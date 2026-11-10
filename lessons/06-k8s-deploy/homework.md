# שיעור 6 — שיעורי בית: ShopList רצה ב-Kubernetes

## מסמך דרישות

**המטרה:** בסוף שיעורי הבית, ב-cluster של Docker Desktop במחשב שלכן בבית, כל ShopList רצה ב-namespace `shoplist`, ועובדת בדפדפן ב-`http://localhost:30080`. ההגדרות של האפליקציה יושבות ב-ConfigMap, והמוצרים שורדים מחיקה של pod.

**הגשה:** push ל-fork שלכן, **לפני תחילת שיעור 7**.

**זמן משוער:** שעתיים וחצי עד שלוש.

**איך עובדים עם המסמך:** לכל דרישה יש מספר (ד1, ד2...) ורשימת בדיקה. מסמנות ✓ רק אחרי שבדקתן. ההסברים המלאים, עם הקוד, נמצאים ב-[guide.md](guide.md) של שיעור 6. ליד כל דרישה כתוב איפה.

---

## 0. הכנה (פעם אחת)

### מה צריך במחשב בבית
- [ ] Docker Desktop פתוח, ולמטה כתוב **Engine running** וגם **Kubernetes running**. Kubernetes עוד לא מופעל? Settings (גלגל השיניים) ← Kubernetes ← Enable Kubernetes ← Apply & restart. ההסבר המלא: [שיעור 5, guide.md, שלב 1](../05-k8s-cluster/guide.md).
- [ ] `kubectl config current-context` מחזיר `docker-desktop`.
- [ ] VS Code, או עורך אחר. **לא Notepad.**

### להביא את הקוד
1. ב-GitHub, ב-fork שלכן: **Sync fork** ואז **Update branch**. ככה מגיעה התיקייה של שיעור 6.
2. בטרמינל, ב-clone שלכן בבית:
   ```shell
   cd devops-2027-shoplist
   git pull --no-rebase --no-edit
   ```

> **מה שכתבנו בכיתה נשאר במחשב בכיתה** (לא עושים push משם). בבית כותבות את הקבצים שוב, עם המדריך. זה חלק מהתרגול: בפעם השנייה זה הולך הרבה יותר מהר.

### push מהבית
push רק מהמחשב בבית. בפעם הראשונה GitHub יבקש להתחבר בדפדפן.

---

## 1. התמונה הגדולה: מה יהיה בסוף

```
devops-2027-shoplist/
├── app/                         (קיים: הקוד וה-Dockerfiles משיעור 4)
├── docker/                      (קיים: ה-Compose משיעור 4)
├── sql/
└── kubernetes/                  ← כל הקבצים של שיעורי הבית
    ├── namespace.yml
    ├── postgres-secret.yml
    ├── postgres-configmap.yml
    ├── postgres-pvc.yml
    ├── postgres-deployment.yml
    ├── postgres-service.yml
    ├── app-config.yml           ← חדש, ד7
    ├── backend-deployment.yml
    ├── backend-service.yml
    ├── stats-deployment.yml
    ├── stats-service.yml
    ├── frontend-deployment.yml
    └── frontend-service.yml
```

| הסרוויס | image | פורט | Service | מה הוא צריך |
|---|---|---|---|---|
| postgres | `postgres:15-alpine` | 5432 | ClusterIP | Secret, ConfigMap של init.sql, PVC |
| backend | `shoplist-backend:local` | 5000 | ClusterIP | הסיסמאות מה-Secret, `DB_HOST` מ-`app-config` |
| stats | `shoplist-stats:local` | 3000 | ClusterIP | `BACKEND_URL` מ-`app-config` |
| frontend | `shoplist-frontend:local` | 80 | **NodePort 30080** | כלום. `nginx.conf` כבר בתוך ה-image |

---

## 2. הדרישות

### ד1 — שלושה images עם השמות שלנו
**עזרה:** guide.md, שלב 1

- [ ] `docker images shoplist-*` מציג שלושה images: `shoplist-backend`, `shoplist-stats`, `shoplist-frontend`, כולם עם התג `local`.
- [ ] בנויים מה-Dockerfiles **שלכן**, משיעורי הבית של שיעור 4.

### ד2 — namespace ו-postgres (6 קבצים)
**קבצים:** `namespace.yml`, `postgres-secret.yml`, `postgres-configmap.yml`, `postgres-pvc.yml`, `postgres-deployment.yml`, `postgres-service.yml` · **עזרה:** guide.md, שלבים 2–7

- [ ] בכל קובץ: `namespace: shoplist` תחת `metadata` (חוץ מ-`namespace.yml` עצמו).
- [ ] ה-Secret: שלושה מפתחות (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`), כל ערך ב-base64. **קודדתן בעצמכן**, עם הפקודה מהמדריך, ובדקתן שהפענוח מחזיר את המילה הנכונה.
- [ ] ה-ConfigMap: התוכן זהה ל-`sql/init.sql`, כולל 6 העמודות.
- [ ] ה-PVC: `ReadWriteOnce`, `1Gi`. ב-`kubectl get pvc -n shoplist` הוא `Bound`.
- [ ] ה-Deployment: `envFrom` מה-Secret, readinessProbe עם `pg_isready`, ושני volumes: ה-PVC ב-`/var/lib/postgresql/data` וה-ConfigMap ב-`/docker-entrypoint-initdb.d`.
- [ ] ה-Service: בשם `postgres`, פורט 5432.
- [ ] ה-pod של postgres `1/1 Running`.

### ד3 — backend (2 קבצים)
**קבצים:** `backend-deployment.yml`, `backend-service.yml` · **עזרה:** guide.md, שלב 8

- [ ] `image: shoplist-backend:local` עם `imagePullPolicy: Never`.
- [ ] `DB_NAME`, `DB_USER` ו-`DB_PASSWORD` מגיעים מה-Secret, עם `secretKeyRef`. **אין סיסמה גלויה בקובץ.**
- [ ] readinessProbe: `httpGet` ל-`/health` בפורט 5000.
- [ ] ה-Service בשם `backend`, פורט 5000. (השם חייב להיות `backend`: ככה כתוב ב-`nginx.conf`.)
- [ ] ה-pod `1/1 Running`.

> את `DB_HOST` תעבירו ל-ConfigMap בד7. בינתיים אפשר לכתוב `value: postgres`, כמו בכיתה.

### ד4 — stats ו-frontend (4 קבצים)
**קבצים:** `stats-deployment.yml`, `stats-service.yml`, `frontend-deployment.yml`, `frontend-service.yml` · **עזרה:** guide.md, שלב 9

- [ ] stats: image `shoplist-stats:local`, פורט 3000, readinessProbe ל-`/health`, **בלי** Secret.
- [ ] ה-Service של stats בשם `stats`, פורט 3000.
- [ ] frontend: image `shoplist-frontend:local`, פורט 80.
- [ ] ה-Service של frontend: `type: NodePort`, `port: 80`, `targetPort: 80`, `nodePort: 30080`.

### ד5 — הכל בפקודה אחת
- [ ] מהתיקייה הראשית של הריפו. **קודם ה-namespace**, ורק אחר כך כל התיקייה:
  ```shell
  kubectl apply -f kubernetes/namespace.yml
  kubectl apply -f kubernetes/
  kubectl get all -n shoplist
  ```
  > למה בשני שלבים? `kubectl apply -f kubernetes/` מחיל את הקבצים **בסדר אלפביתי**: `app-config.yml` ו-`backend-deployment.yml` לפני `namespace.yml`. ב-cluster בבית עוד אין namespace בשם `shoplist`, והם ייכשלו עם `namespaces "shoplist" not found`.
- [ ] ארבעה pods, כולם `1/1 Running`, ואין `RESTARTS` שממשיכים לעלות.

> הקבצים מוחלים בסדר אלפביתי, אז ה-frontend יכול לעלות לפני ה-Service של stats וליפול פעם או פעמיים. זה תקין: Kubernetes מרים אותו שוב, עד שהכל קיים.

### ד6 — האפליקציה עובדת
- [ ] `http://localhost:30080` נפתח, ושתי הנוריות למעלה ירוקות.
- [ ] אפשר להוסיף מוצר, לסמן כנקנה, לערוך ולמחוק.
- [ ] כרטיסי הסטטיסטיקה מתעדכנים.
- [ ] `kubectl get endpoints -n shoplist`: לכל אחד מארבעת ה-Services יש לפחות כתובת אחת.
- [ ] **הנתונים שורדים:** מוסיפות 3 מוצרים, ואז:
  ```shell
  kubectl delete pod -n shoplist -l app=postgres
  ```
  מחכות שה-pod החדש `1/1`, ומרעננות: שלושת המוצרים עדיין שם.
- [ ] **declarative:** ב-`backend-deployment.yml`, `replicas: 2`, ואז `kubectl apply -f kubernetes/backend-deployment.yml`. ב-`kubectl get endpoints backend -n shoplist` רואים **שתי** כתובות. (מותר להשאיר על 2.)

### ד7 — הגדרות ב-ConfigMap
**קובץ חדש:** `kubernetes/app-config.yml` · **עזרה:** guide.md, "ConfigMap: הדף על המקרר"

**הרקע:** היום `DB_HOST` כתוב בתוך ה-Deployment של backend, ו-`BACKEND_URL` בתוך זה של stats. הגדרות לא שייכות לתוך ה-Deployment. מעבירות את שתיהן ל-ConfigMap אחד, `app-config`.

**השלד, להעתיק ולהשלים כל `____`:**

```yaml
apiVersion: v1
kind: ____
metadata:
  name: app-config
  namespace: ____
data:
  DB_HOST: ____
  BACKEND_URL: ____
```

**ב-`backend-deployment.yml`**, במקום:
```yaml
            - name: DB_HOST
              value: postgres
```
כותבות:
```yaml
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: ____
                  key: ____
```

**ב-`stats-deployment.yml`**: אותו דבר בשביל `BACKEND_URL`.

| שורה | מה להשלים | למה |
|---|---|---|
| `kind` | הסוג של משאב ההגדרות | ConfigMap, לא Secret: אין כאן סוד |
| `DB_HOST` | שם ה-Service של postgres | השם הוא הכתובת |
| `BACKEND_URL` | הכתובת המלאה של ה-backend, עם `http://` ופורט | בדיוק מה שהיה ב-stats |
| `configMapKeyRef: name` | שם ה-ConfigMap | `app-config` |
| `configMapKeyRef: key` | איזה מפתח לקחת ממנו | `DB_HOST` או `BACKEND_URL` |

**בדיקות ל-ד7:**
- [ ] `kubectl apply -f kubernetes/` עובר בלי שגיאות.
- [ ] `kubectl get configmap app-config -n shoplist -o yaml` מציג את שני המפתחות.
- [ ] `kubectl exec -n shoplist deployment/backend -- env` מציג `DB_HOST=postgres`.
- [ ] `kubectl exec -n shoplist deployment/stats -- env` מציג `BACKEND_URL=http://backend:5000`.
- [ ] האפליקציה עדיין עובדת, ושתי הנוריות ירוקות.
- [ ] **אין יותר** `value: postgres` או `value: http://backend:5000` בקבצי ה-Deployments.

> **שימו לב:** שינוי ב-ConfigMap לא משנה pods שכבר רצים. משתני סביבה נקראים רק כשה-pod עולה. כדי שהשינוי ייכנס: `kubectl rollout restart deployment/backend -n shoplist`.

### ד8 — לשבור ולתקן: מדבקה שגויה
**עזרה:** guide.md, "labels ו-selectors: מדבקות"

1. ב-`backend-service.yml`, לשנות את ה-selector ל-`app: backnd` (בלי ה-e), ולהחיל.
2. לחכות 10 שניות ולהסתכל בדפדפן.
3. להריץ:
   ```shell
   kubectl get pods -n shoplist
   kubectl get endpoints backend -n shoplist
   kubectl describe service backend -n shoplist
   ```
4. לתקן בחזרה ל-`app: backend`, ולהחיל.

- [ ] ב-`answers.md`, שאלה 5: מה ראיתן בדפדפן? האם ה-pods של backend נפלו? מה הראה `get endpoints`, ולמה?
- [ ] אחרי התיקון: הנוריות ירוקות, ול-`backend` יש שוב כתובות ב-endpoints.

### ד9 — הוכחה שזה עובד
**תיקייה:** `lessons/06-k8s-deploy/homework/screenshots/`

- [ ] `app.png`: הדפדפן ב-`localhost:30080`, עם לפחות 3 מוצרים ושתי נוריות ירוקות.
- [ ] `get-all.png`: הטרמינל עם `kubectl get all -n shoplist`.
- [ ] `survived.png`: הטרמינל עם `kubectl get pods -n shoplist` **אחרי** שמחקתן את ה-pod של postgres (רואים שהוא חדש, לפי ה-AGE), ולידו הדפדפן עם המוצרים.

### ד10 — שאלות
**קובץ:** `lessons/06-k8s-deploy/homework/answers.md`. משפט או שניים לכל שאלה.

1. בתחילת השיעור בנינו את ה-images עם `-t shoplist-backend:local`. למה לא השתמשנו בשמות ש-Compose נתן (`docker-backend`)? ומה היה קורה בלי `imagePullPolicy: Never`?
2. פענחו את `POSTGRES_PASSWORD` מה-Secret. איזו פקודה הרצתן? מה זה אומר על האבטחה של Secret?
3. מחקתן את ה-pod של postgres והמוצרים נשארו. איזה קובץ אחראי לזה, ואיזו פקודה **כן** הייתה מוחקת אותם?
4. ב-Compose היה `depends_on`. ב-Kubernetes אין. מה קורה אם ה-backend עולה לפני postgres? מה דואג שהוא לא יקבל בקשות לפני שהוא מוכן?
5. ד8: מה ראיתן, ולמה? (ראו שם)
6. שיניתן ערך ב-`app-config` והרצתן `apply`, אבל ה-backend עדיין רואה את הערך הישן. למה, ומה הפתרון?
7. כמה פעמים כתבתן `shoplist` ב-12 הקבצים? ואם מחר נרצה להריץ עותק שני של ShopList ב-namespace בשם `shoplist-test`, כמה קבצים נצטרך לשנות? (רמז לשיעור הבא.)

---

## 3. הגשה

מהתיקייה הראשית של הריפו, **מהמחשב בבית**:

```shell
git status
git add kubernetes/ lessons/06-k8s-deploy/homework/
git commit -m "homework 6: ShopList on Kubernetes"
git push
```

- [ ] ב-GitHub, ב-fork שלכן: רואים את התיקייה `kubernetes/` עם 13 קבצים, ואת `answers.md` ו-3 צילומי מסך.

> הסיסמה `shoppass` נכנסת ל-Git, בתוך ה-Secret. בקורס זה בסדר, זו סיסמת תרגול. **בעבודה אמיתית לא עושים commit לקובץ Secret עם סיסמה אמיתית.**

---

## 4. תקלות נפוצות

הטבלה המלאה: [guide.md, תקלות נפוצות](guide.md#תקלות-נפוצות). הכי נפוצות בבית:

| בעיה | פתרון |
|---|---|
| `kubectl` מחזיר `connection refused` | Kubernetes לא רץ ב-Docker Desktop. לבדוק למטה משמאל: **Kubernetes running** |
| `ErrImageNeverPull` | לבנות את ה-images בבית (ד1). images מהכיתה לא מגיעים הביתה |
| `namespaces "shoplist" not found` | להחיל קודם את `kubernetes/namespace.yml`, ואז שוב את כל התיקייה |
| `configmap "app-config" not found` | להחיל את `app-config.yml`. `kubectl apply -f kubernetes/` מחיל את כולם |
| `couldn't find key DB_HOST in ConfigMap` | השם ב-`key` לא זהה בדיוק למפתח ב-`data` |
| המוצרים נעלמו אחרי מחיקת ה-pod | ה-PVC לא מחובר: לבדוק `volumes` ו-`volumeMounts` ב-postgres, ושה-`name` זהה בשניהם |
| `relation "products" does not exist` | ה-PVC נוצר לפני ה-ConfigMap. `kubectl delete pvc postgres-pvc -n shoplist`, ו-`kubectl apply -f kubernetes/` שוב |

---

## 5. בונוס

### ד11 — frontend מ-multi-stage
בשיעורי הבית של שיעור 4 כתבתן `app/frontend/Dockerfile.multistage`. עכשיו מריצות אותו ב-Kubernetes:

```shell
docker build -f app/frontend/Dockerfile.multistage -t shoplist-frontend:multi app/frontend
```

- [ ] ב-`frontend-deployment.yml`, לשנות את התג ל-`shoplist-frontend:multi`, ולהחיל.
- [ ] `kubectl get pods -n shoplist`: ה-pod של frontend הוחלף בחדש.
- [ ] בתחתית הדף: השורה `Build: <תאריך>`. היא מגיעה מ-`build.js`, כלומר מהמטבח.
- [ ] ב-`answers.md`: מה קרה ל-pod הישן כששיניתן את ה-image? האם הייתה שנייה שבה האפליקציה לא עבדה?

### ד12 — livenessProbe ל-backend
**עזרה:** guide.md, "readiness מול liveness"

- [ ] ב-`backend-deployment.yml`, להוסיף `livenessProbe` מסוג `httpGet` ל-`/health` בפורט 5000, עם `initialDelaySeconds: 15`, `periodSeconds: 20` ו-`failureThreshold: 3`. להחיל.
- [ ] `kubectl describe pod -n shoplist -l app=backend`: רואים שתי שורות, `Liveness:` ו-`Readiness:`.
- [ ] ב-`answers.md`: backend נתקע (רץ, אבל לא עונה). מה קורה עם readiness בלבד, ומה קורה כשיש גם liveness? ולמה אסור ש-liveness יבדוק את postgres?

---

## 6. מה בודקים

| דרישה | ניקוד |
|---|---|
| ד1–ד4: 12 הקבצים נכונים | 35 |
| ד5–ד6: הכל רץ, הנתונים שורדים, replicas מהקובץ | 20 |
| ד7: ConfigMap | 15 |
| ד8: לשבור ולתקן, והסבר | 10 |
| ד9: צילומי מסך | 10 |
| ד10: שאלות | 10 |
| ד11–ד12: בונוס | +5 כל אחד |

---

## 7. בתחילת שיעור 7, בכיתה

1. במחשב בכיתה: `git pull --no-rebase --no-edit`. ככה מגיעים הקבצים מהבית.
2. אם ה-cluster בכיתה עוד מריץ את ShopList מהשיעור, להחיל את הגרסה מהבית: `kubectl apply -f kubernetes/`.
3. לבדוק ש-`http://localhost:30080` עובד. משם ממשיכות ל-Helm.
