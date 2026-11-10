# שיעור 7 — שיעורי בית: ShopList ב-Helm

## מסמך דרישות

**המטרה:** לבנות בבית את ה-chart של ShopList, ולעבור איתו מחזור חיים שלם: התקנה, עדכון, תקלה, חזרה אחורה והסרה.

**הגשה:** push מהבית, לפני שיעור 8.

**זמן משוער:** שעתיים.

**איך לעבוד:** הדרישות מסודרות לפי הסדר. כל דרישה נשענת על הקודמת. בכל דרישה כתוב **איך בודקות שזה עובד**. לא עוברות לדרישה הבאה לפני שהבדיקה עברה.

---

## 0. הכנה (פעם אחת)

### מה צריך במחשב בבית

- [ ] Docker Desktop, עם **Kubernetes running** (הפעלה: Settings ← Kubernetes ← Enable Kubernetes, כמו בשיעור 5)
- [ ] Helm: `helm version` מחזיר `v4.` (או `v3.`). אין? Windows: `winget install Helm.Helm`, ואז לסגור ולפתוח את הטרמינל. Mac: `brew install helm`
- [ ] `kubectl config current-context` מחזיר `docker-desktop`

### להביא את הקוד

כמו בשיעורי הבית הקודמים: בתיקייה של הריפו שלכן, `git pull`. **שימו לב:** את מה שכתבתן במחשב בכיתה לא דחפתן, אז הוא לא כאן. זה בסדר: כל הקבצים מופיעים במדריכים.

### push מהבית

בסוף, מהבית: `git add`, `git commit`, `git push`. לא מהמחשב בכיתה.

---

## 1. התמונה הגדולה: מה יהיה בסוף

```
helm/
  shoplist/
    Chart.yaml
    values.yaml           ← ברירות המחדל
    values-big.yaml       ← ד5: טופס לסביבה "גדולה"
    templates/
      (11 קבצים)
lessons/07-helm/homework/
  answers.md
  screenshots/
    1-app.png
    2-history.png
    3-pvc.png
```

וב-cluster: release בשם `shop`, ב-namespace `shop`, שעובד ב-`http://localhost:30080`.

---

## 2. הדרישות

### ד1 — שלושה images

`shoplist-backend:local`, `shoplist-stats:local`, `shoplist-frontend:local`. בונים בבית, לפי שלב 1 במדריך של שיעור 6.

**בדיקה:** `docker images shoplist-*` מראה שלושה images עם התגית `local`.

### ד2 — ה-chart: Chart.yaml ו-values.yaml

ליצור `helm/shoplist/Chart.yaml` לפי שלב 1 במדריך.

ליצור `helm/shoplist/values.yaml`, ולהשלים את הקווים:

```yaml
imagePullPolicy: ____

backend:
  replicas: ____
  image:
    repository: ____
    tag: ____

stats:
  replicas: ____
  image:
    repository: ____
    tag: ____

frontend:
  replicas: ____
  nodePort: ____
  image:
    repository: ____
    tag: ____

postgres:
  database: ____
  user: ____
  password: ____
  storage: ____
```

> **רמז:** כל הערכים כבר כתובים בקבצים של שיעור 6. רק מעבירים אותם לכאן.

### ד3 — התבניות: 11 קבצים עם חורים

ב-`helm/shoplist/templates/`: 11 הקבצים משיעור 6, **בלי** `namespace.yml`. אין לכן אותם בבית? כולם מופיעים במלואם במדריך של שיעור 6, בחלק 3.

עכשיו החורים. **כל ערך מהטבלה הזו חייב להגיע מ-`values.yaml` או מ-`.Release`, ולא להיות כתוב ביד:**

| מה | באילו קבצים | החור |
|---|---|---|
| namespace | כל 11 הקבצים | `{{ .Release.Namespace }}` |
| replicas | backend, stats, frontend Deployments | `{{ .Values.<סרוויס>.replicas }}` |
| image | backend, stats, frontend Deployments | `repository`:`tag` מ-values |
| imagePullPolicy | backend, stats, frontend Deployments | `{{ .Values.imagePullPolicy }}` |
| nodePort | frontend-service | `{{ .Values.frontend.nodePort }}` |
| שלושת הערכים ב-Secret | postgres-secret | עם `\| b64enc \| quote` |
| המשתמש ומסד הנתונים ב-`pg_isready` | postgres-deployment | עם `\| quote` |
| גודל הארונית | postgres-pvc | `{{ .Values.postgres.storage }}` |

ועוד דבר אחד, שאינו חור: ל-`postgres-pvc.yml` להוסיף את הפתק `helm.sh/resource-policy: keep` (שלב 7 במדריך).

**בדיקה:**

```shell
helm lint ./helm/shoplist
helm template shop ./helm/shoplist -n shop
```

`lint` מחזיר `0 chart(s) failed`. ב-`template`, אין אף `shoplist` אחרי `namespace:`, ואין אף שורה ריקה אחרי `replicas:`.

### ד4 — התקנה

```shell
helm install shop ./helm/shoplist -n shop --create-namespace
```

> **בבית אין ShopList משיעור 6**, אז הדלת 30080 פנויה. לא צריך `--set`.

**בדיקה:**
- `kubectl get pods -n shop`: ארבעה pods, כולם `1/1 Running`
- `http://localhost:30080`: האפליקציה נפתחת, מוסיפות שלושה מוצרים, והנורית של stats ירוקה
- **צילום מסך 1:** האפליקציה עם המוצרים

### ד5 — עדכון עם טופס משלכן

ליצור `helm/shoplist/values-big.yaml`: 3 עותקים של backend, ו-2 של stats. **רק** מה ששונה מ-`values.yaml`.

לעדכן את ה-release `shop` עם הקובץ הזה.

**בדיקה:** `kubectl get pods -n shop` מראה 3 pods של backend ו-2 של stats. `helm history shop -n shop` מראה 2 revisions.

### ד6 — לשבור ולחזור אחורה

1. לעדכן שוב, עם `values-big.yaml`, ובנוסף לשבור את ה-image של ה-backend עם `--set` לתגית שלא קיימת
2. לבדוק ב-`kubectl get pods -n shop`: יש pod ב-`ErrImageNeverPull`. **האפליקציה עדיין עובדת?** לרשום ב-`answers.md`
3. `rollback` ל-revision האחרון שעבד

**בדיקה:** אין יותר pod שבור. `helm history shop -n shop` מראה 4 revisions, והאחרון `Rollback to 2`.

**צילום מסך 2:** הפלט של `helm history shop -n shop`.

### ד7 — uninstall, והארונית

1. `helm uninstall shop -n shop`
2. `kubectl get pvc -n shop`: ה-PVC עדיין שם
3. להתקין שוב, עם אותו שם ואותו namespace
4. לפתוח את `localhost:30080`: שלושת המוצרים מ-ד4 עדיין שם

**צילום מסך 3:** הפלט של `kubectl get pvc -n shop` אחרי ה-uninstall.

### ד8 — שאלות

לענות ב-`lessons/07-helm/homework/answers.md`, במילים שלכן. שתיים-שלוש שורות לכל שאלה.

1. מה ההבדל בין chart ל-release? תנו דוגמה מהשיעור.
2. למה הסרנו את `namespace.yml` מה-chart, ומה מחליף אותו?
3. בד5 כתבתן ב-`values-big.yaml` רק שני ערכים. מאיפה הגיעו כל השאר, למשל `nodePort`?
4. בד6, האפליקציה עבדה גם כשה-image היה שבור. למה? (רמז: שיעור 6)
5. אחרי ה-rollback יש 4 revisions ולא 2. למה Helm לא פשוט חוזר ל-revision 2?
6. מה היה קורה לשלושת המוצרים בד7 בלי השורה `helm.sh/resource-policy: keep`?
7. חברה כתבה בטעות `{{ .Values.backend.replica }}`. Helm לא נתן שגיאה. מה כן קרה, ואיך היא הייתה מגלה?

### בונוס ד9 — שתי ShopList בבית (+5)

להתקין release שני מאותו chart, `shop2`, ב-namespace `shop2`, בדלת 30081. שתי האפליקציות פתוחות בדפדפן, וכל אחת עם מוצרים משלה. לצרף צילום מסך של `helm list -A`.

### בונוס ד10 — סיסמה שחובה למלא (+5)

ב-`values.yaml`, לשנות את הסיסמה ל-`password: ""`. ב-`postgres-secret.yml`, להשתמש בפונקציה `required`, כך שהתקנה בלי סיסמה תיכשל עם הודעה ברורה:

```yaml
  POSTGRES_PASSWORD: {{ required "חסרה סיסמה: --set postgres.password=..." .Values.postgres.password | b64enc | quote }}
```

לבדוק ש-`helm template shop ./helm/shoplist` נכשל עם ההודעה, ושעם `--set postgres.password=shoppass` עובד. להסביר ב-`answers.md`: למה זה טוב יותר מסיסמה שכתובה ב-`values.yaml`?

> **שימו לב:** אחרי בונוס ד10, כל `upgrade` של `shop` צריך `--set postgres.password=shoppass`. בלי זה הוא ייכשל, וזו בדיוק המטרה.

---

## 3. הגשה

```shell
git add helm/ lessons/07-helm/homework/
git commit -m "Lesson 7 homework: ShopList Helm chart"
git push
```

**לפני ה-push, לבדוק:**
- [ ] `helm lint ./helm/shoplist` עובר
- [ ] `values.yaml` ו-`values-big.yaml` בתיקייה `helm/shoplist/`
- [ ] `answers.md` ושלושה צילומי מסך ב-`lessons/07-helm/homework/`

### איך זה נבדק

| מה | נקודות |
|---|---|
| ד2–ד3: ה-chart, וכל החורים מהטבלה | 35 |
| ד4: ההתקנה עובדת | 15 |
| ד5: `values-big.yaml` ו-upgrade | 10 |
| ד6: לשבור וחזרה אחורה | 15 |
| ד7: uninstall, וה-PVC נשאר | 10 |
| ד8: שאלות | 15 |
| בונוס ד9, ד10 | +5 כל אחד |

---

## 4. תקלות נפוצות

| בעיה | פתרון |
|---|---|
| `'helm' is not recognized` | לסגור ולפתוח את הטרמינל אחרי ההתקנה |
| `Kubernetes cluster unreachable` | Docker Desktop: **Kubernetes running**. `kubectl config current-context` |
| `nil pointer evaluating interface {}` | שגיאת כתיב בכתובת. השגיאה אומרת קובץ ושורה |
| `cannot re-use a name that is still in use` | כבר התקנתן `shop`. `helm upgrade`, או `helm uninstall` קודם |
| `ErrImageNeverPull` כבר בד4 | ה-images לא נבנו בבית (ד1), או שם לא תואם |
| `relation "products" does not exist` | נשארה ארונית ישנה בלי טבלה. `helm uninstall shop -n shop`, ואז `kubectl delete pvc postgres-pvc -n shop`, ואז `helm install` שוב (מוחק נתונים) |
| release ב-`failed` | לתקן את הסיבה, ו-`helm upgrade` שוב |

את כל השאר: בטבלת התקלות במדריך.
