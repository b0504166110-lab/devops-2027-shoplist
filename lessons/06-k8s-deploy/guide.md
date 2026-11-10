# שיעור 6 — ShopList ב-Kubernetes
## מדריך לסטודנטית

---

## מה יהיה בסוף השיעור

- בתיקייה `kubernetes/` בריפו: 12 קבצי YAML, שמתארים את כל ShopList
- ארבעה Deployments ב-namespace `shoplist`: postgres, backend, stats ו-frontend, כולם `Running`
- האפליקציה עובדת בדפדפן ב-`http://localhost:30080`
- המוצרים נשמרים גם כשה-pod של postgres נמחק

**מה תדעו לעשות:**
- לתרגם קובץ Compose לקבצי Kubernetes
- להשתמש ב-ConfigMap וב-Secret, ולהסביר למה base64 הוא לא הצפנה
- לבקש אחסון קבוע עם PersistentVolumeClaim
- להשתמש ב-readinessProbe, ולהסביר מה הוא עושה ל-Service
- להחיל קבצים עם `kubectl apply`, ולשנות את המצב הרצוי דרך הקובץ

**עוד לא:** כל ערך שחוזר (שם ה-namespace, שמות ה-images) כתוב ידנית בכמה קבצים. את זה נפתור בשיעור 7, עם Helm.

---

## לפני שמתחילות

- [ ] Docker Desktop פתוח, ולמטה כתוב **Engine running** וגם **Kubernetes running**
- [ ] בתיקייה הראשית של הריפו: `cd devops-2027-shoplist`
- [ ] יש לכן את הקבצים משיעורי הבית של שיעור 4: `app/backend/Dockerfile`, `app/stats/Dockerfile`, `app/frontend/Dockerfile`. במחשב בכיתה: `git pull --no-rebase --no-edit`
- [ ] kubectl מדבר עם ה-cluster הנכון:

```shell
kubectl config current-context
kubectl get nodes
```

**צפוי:** `docker-desktop`, ו-node אחד במצב `Ready`.

---

## חלק 1 — מ-Compose ל-Kubernetes

ב-Compose היה קובץ אחד. ב-Kubernetes כל דבר הוא **משאב** (resource) נפרד, ונוח לכתוב כל משאב בקובץ משלו. הנה מה שכל שורה ב-`docker-compose.yml` הופכת להיות:

| ב-Compose | ב-Kubernetes | הקובץ |
|---|---|---|
| (אין) | Namespace: המחלקה של ShopList | `namespace.yml` |
| `POSTGRES_PASSWORD: shoppass` | Secret | `postgres-secret.yml` |
| `../sql/init.sql:/docker-entrypoint-initdb.d/...` | ConfigMap | `postgres-configmap.yml` |
| `postgres-data:` (הארונית) | PersistentVolumeClaim | `postgres-pvc.yml` |
| service `postgres` | Deployment | `postgres-deployment.yml` |
| השם `postgres` הוא הכתובת | Service | `postgres-service.yml` |
| service `backend` | Deployment + Service | `backend-deployment.yml`, `backend-service.yml` |
| service `stats` | Deployment + Service | `stats-deployment.yml`, `stats-service.yml` |
| service `frontend` עם `ports: 8080:80` | Deployment + Service מסוג NodePort | `frontend-deployment.yml`, `frontend-service.yml` |
| `healthcheck` | readinessProbe | בתוך ה-Deployments |
| `depends_on` | **אין.** Kubernetes מנסה שוב עד שמצליח | — |

**התמונה בסוף:**

```
                       המחשב שלכן
  localhost:30080
        │
┌───────┼──────────────── cluster (docker-desktop) ────────────────────────┐
│       │                    namespace: shoplist                           │
│       ▼                                                                  │
│  Service frontend ──▶ pod frontend (Nginx)                               │
│  (NodePort 30080)          │  /api/stats        │  /api/...            │
│                            ▼                    ▼                        │
│                   Service stats ──▶ pod stats ──▶ Service backend        │
│                                                        │                 │
│                                                        ▼                 │
│                                                   pod backend            │
│                                                        │                 │
│                                                        ▼                 │
│   Secret postgres-secret ─▶  Service postgres ──▶ pod postgres ──▶ PVC   │
│   ConfigMap postgres-init ─▶                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### שלב 1 — לבנות את ה-images (תרגיל 1, 5 דקות)

ב-cluster של Docker Desktop אין צורך ב-registry: הוא רואה את ה-images שבנינו במחשב. אבל צריך לתת להם שמות קבועים. ה-Compose קרא להם `docker-backend` וכו', ופה נשתמש בשמות שלנו:

```shell
docker build -t shoplist-backend:local app/backend
docker build -t shoplist-stats:local app/stats
docker build -t shoplist-frontend:local app/frontend
docker images shoplist-*
```

**צפוי:** שלושה images, כולם עם התג `local`.

> **בנטפרי:** אם ה-build של ה-backend נכשל ב-`pip install`, ה-Dockerfile צריך את `--trusted-host`, כמו בשיעורי הבית של שיעור 4.

---

## חלק 2 — מושגים חדשים

> **המשפט של היום: ה-pod זמני. כל מה שחשוב גר מחוץ לו.** הגדרות ב-ConfigMap, סיסמה ב-Secret, נתונים ב-PVC, וכתובת ב-Service. כל המושגים בחלק הזה הם תשובה לשאלה "איפה שומרים את זה, כדי שלא ייעלם עם ה-pod?"

### קובץ YAML של Kubernetes: ארבע קומות

מהיום כותבות קבצים במקום פקודות מהירות. לכל קובץ אותו מבנה:

```yaml
apiVersion: v1          # איזו גרסה של ה-API מכירה את הסוג הזה
kind: Service           # מה זה: Deployment, Service, Secret...
metadata:               # השם, ובאיזה namespace
  name: backend
  namespace: shoplist
spec:                   # המצב הרצוי. כאן כל סוג שונה
  ...
```

> **השורה `namespace: shoplist` בכל קובץ:** ככה לא צריך לזכור `-n shoplist` ב-`apply`. אבל ב-`get`, `logs` ו-`describe` עדיין צריך.

### ארבע שאלות לכל קובץ: איך קוראים YAML

לפני שכותבות קובץ, ואחרי שסיימתן, קוראות אותו בקול ועונות על ארבע שאלות. תמיד אותן ארבע:

| שאלה | איפה בקובץ | דוגמה: `backend-service.yml` |
|---|---|---|
| 1. מה זה? | `apiVersion` ו-`kind` | Service: מספר טלפון קבוע |
| 2. איך קוראים לו? | `metadata.name` | `backend`. השם הזה הוא הכתובת |
| 3. מה הוא רוצה? | `spec` | להעביר שיחות לפורט 5000 |
| 4. את מי הוא מוצא, ומי מוצא אותו? | `selector`, `...Ref`, `claimName`, שמות | מוצא pods עם `app: backend`. ‏`nginx.conf` ו-stats מוצאים אותו בשם `backend` |

> **שאלה 4 היא החשובה.** קובץ ב-Kubernetes אף פעם לא עומד לבד: הוא מחובר לקבצים אחרים **בשמות**. כשמשהו לא עובד, כמעט תמיד הסיבה היא שם שכתוב קצת אחרת בשני מקומות.

### למה צריך כל משאב

כל משאב קיים כי בלעדיו משהו נשבר. השאלה "מה היה קורה בלעדיו?" היא הדרך הכי טובה לזכור למה הוא שם.

| משאב | הבעיה שהוא פותר | בלעדיו | אנלוגיה |
|---|---|---|---|
| Namespace | 12 משאבים בתוך cluster שיש בו עוד דברים | הכל מעורבב ב-`default`, ומחיקה אחת פוגעת באחרים | המחלקה של ShopList |
| Deployment | pod לבד מת ולא קם | pod שנמחק נעלם לתמיד | ההזמנה הקבועה (שיעור 5) |
| Service | לכל pod כתובת IP חדשה בכל לידה | backend לא מוצא את postgres אחרי שה-pod מתחלף | מספר טלפון קבוע |
| ConfigMap | קובץ הגדרות (`init.sql`) צריך להגיע ל-container | בונים image חדש לכל שינוי הגדרה | הדף על המקרר |
| Secret | סיסמה לא צריכה להיות כתובה ב-Deployment | הסיסמה גלויה לכל מי שקוראת את ה-Deployment | המעטפה |
| PersistentVolumeClaim | הדיסק של pod נמחק איתו | כל המוצרים נעלמים כש-postgres מתחלף | טופס בקשה לארונית |

> **readinessProbe** הוא לא משאב נפרד, אלא כמה שורות בתוך ה-Deployment. הוא מחליף את `depends_on`: בלעדיו, ה-Service שולח בקשות ל-pod שעוד לא מוכן.

### labels ו-selectors: מדבקות

**מה זה:** label היא מדבקה על pod, למשל `app: backend`. selector הוא "תביא לי את כל מי שיש עליו המדבקה הזו".

**למה זה קיים:** ל-pods אין שם קבוע. הם נוצרים ונמחקים. אז Deployment ו-Service לא מחפשים pod לפי שם, אלא לפי מדבקה.

**איך זה עובד:** ה-Deployment מדביק `app: backend` על כל pod שהוא יוצר (`template.metadata.labels`), ומזהה את ה-pods שלו לפי אותה מדבקה (`selector.matchLabels`). ה-Service שולח שיחות לכל pod עם המדבקה שב-`selector` שלו.

> **טעות נפוצה:** מדבקה שונה ב-Service. ה-Service נוצר בלי שגיאה, אבל אין מאחוריו אף pod, והדפדפן לא מקבל תשובה. בודקות עם `kubectl get endpoints -n shoplist`: Service בלי כתובות הוא Service בלי pods.

### Service לעומק: שלושה סוגים

**מה זה:** Service נותן ל-pods שם קבוע וכתובת IP קבועה, ומחלק ביניהם בקשות. ה-`type` קובע **מי יכולה להתקשר**. תחשבו על מרכזייה טלפונית.

| סוג | במרכזייה | מה הוא נותן | מי מגיעה | ב-ShopList |
|---|---|---|---|---|
| **ClusterIP** (ברירת מחדל, בלי `type`) | שלוחה פנימית | כתובת IP וירטואלית ושם ב-DNS: `backend`, או בשם המלא `backend.shoplist.svc.cluster.local` | רק מתוך ה-cluster | postgres, backend, stats |
| **NodePort** | דלת בכל מטבח | כל מה ש-ClusterIP נותן, ועוד פורט פתוח **על כל node**, בטווח 30000–32767 | מהמחשב. ב-Docker Desktop: `localhost` | frontend, בכיתה |
| **LoadBalancer** | מספר ציבורי | כל מה ש-NodePort נותן, ועוד מאזן עומס של ספק הענן עם כתובת ציבורית | מהאינטרנט | frontend, בענן. עולה כסף |

כל סוג בנוי על הקודם: LoadBalancer מכיל NodePort, ו-NodePort מכיל ClusterIP.

> **רק לדעת שקיימים:** ExternalName (שם שמפנה לכתובת מחוץ ל-cluster), ו-headless (`clusterIP: None`, בלי כתובת משלו). ובענן לרוב לא נותנים LoadBalancer לכל סרוויס, אלא שמים **Ingress**: דלת אחת שמחלקת לפי כתובת. Ingress הוא לא סוג של Service.

**שלושת הפורטים**, בדרך מהדפדפן ל-frontend:

| | nodePort | port | targetPort |
|---|---|---|---|
| מה זה | הדלת על ה-node | השלוחה של ה-Service | הפורט שה-container באמת מאזין בו |
| ב-frontend | 30080 | 80 | 80 |

בתוך ה-cluster אין nodePort: Nginx פונה ל-`backend:5000` (ה-port), ומגיע ל-`targetPort: 5000` ב-pod. port ו-targetPort לא חייבים להיות שווים.

**איך ה-Service מוצא pods:** ה-`selector` מחפש pods עם המדבקה, ושומר רשימה עדכנית של הכתובות שלהם, **רק של אלה שה-readinessProbe שלהם עבר**. הרשימה נקראת **endpoints**. kube-proxy (השליחה ממפגש 5) דואג שכל בקשה לכתובת של ה-Service תגיע לאחד מהם.

```shell
kubectl get svc -n shoplist
kubectl get endpoints -n shoplist
kubectl describe svc backend -n shoplist
```

> **טעות נפוצה:** לתת NodePort או LoadBalancer לכל סרוויס "ליתר ביטחון". כל דלת פתוחה היא עוד מקום שאפשר להיכנס ממנו. מסד נתונים לא צריך דלת לרחוב אף פעם.

### ConfigMap: הדף על המקרר

**מה זה:** משאב ששומר הגדרות כטקסט: משתנים, או קובץ שלם.

**למה זה קיים:** הגדרות לא שייכות לתוך ה-image. אותו image צריך לרוץ בכיתה, בבדיקות ובענן, עם הגדרות שונות. ב-Compose זה היה `environment` ו-bind mount.

**איך זה עובד:** אצלנו, ה-ConfigMap `postgres-init` מחזיק את כל `init.sql`. ה-Deployment של postgres מחבר אותו כתיקייה, `/docker-entrypoint-initdb.d`, ו-postgres מריץ אותו בפעם הראשונה. בדיוק כמו ה-bind mount משיעור 4.

> **טעות נפוצה:** לשים סיסמה ב-ConfigMap, "כי זה יותר פשוט". ConfigMap הוא דף על המקרר: כל מי שנכנסת למטבח קוראת אותו.

### Secret: מעטפה בכתב ראי

**מה זה:** משאב לשמירת מידע רגיש: סיסמאות, מפתחות, tokens.

**למה זה קיים:** כדי שהסיסמה לא תהיה כתובה ב-Deployment, ושאפשר יהיה להגביל מי רשאית לקרוא אותה.

**איך זה עובד:** הערכים ב-Secret כתובים ב-**base64**. ה-pod מקבל אותם כמשתני סביבה, כבר מפוענחים.

**ב-PowerShell:**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("shoppass"))
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String("c2hvcHBhc3M="))
```

**ב-Git Bash:**
```shell
echo -n shoppass | base64
echo c2hvcHBhc3M= | base64 -d
```

> **טעות נפוצה, והכי חשובה היום: base64 הוא לא הצפנה.** זה כמו כתב ראי: נראה מוזר, אבל כל מי שמחזיקה מראה קוראת. ההגנה האמיתית היא **מי רשאית לפתוח את המעטפה** (הרשאות, RBAC). ובעבודה אמיתית לא עושים commit לקובץ Secret עם סיסמה אמיתית.

> **`echo -n`:** בלי `-n`, נכנסת לקידוד גם ירידת שורה, והסיסמה לא תתאים.

### Secret לעומק: מה קורה לסיסמה

**המסע של הסיסמה:**

1. `kubectl apply` שולח את ה-Secret ל-**API server**, שבודק שמותר לך ליצור אותו.
2. ה-Secret נשמר ב-**etcd**. **כברירת מחדל בדיוק כמו שכתבנו: base64, בלי הצפנה.** מי שיש לה גישה ל-etcd או לגיבוי שלו, רואה הכל.
3. pod שצריך את ה-Secret משובץ ל-node. **רק ה-kubelet של אותו node** מקבלת אותו.
4. ה-kubelet מפענחת ומכניסה לתוך ה-container, באחת משתי דרכים:

| | משתנה סביבה (`env`, `envFrom`), אצלנו | קובץ (Secret כ-volume) |
|---|---|---|
| איך זה נראה בפנים | `DB_PASSWORD=shoppass` | קובץ לכל מפתח, למשל `/etc/secrets/POSTGRES_PASSWORD` |
| איפה יושב | בזיכרון של התהליך | בזיכרון (tmpfs), לא בדיסק של ה-node |
| משנים את ה-Secret | **לא נכנס** עד שה-pod עולה מחדש: `kubectl rollout restart` | מתעדכן לבד, תוך כדקה |

**מה באמת שומר על הסיסמה:**

| שכבה | מה זה |
|---|---|
| **הרשאות (RBAC)** | מי רשאית לקרוא Secrets ב-namespace. אפשר לראות Deployments בלי לראות Secrets. שימו לב: מי שיכולה ליצור pod ב-namespace, יכולה לחבר אליו כל Secret שבו |
| **הצפנה ב-etcd** | encryption at rest. בענן מנוהל (למשל EKS) מצפינים עם מפתח של הענן (KMS) |
| **לא ב-Git** | הסודות בכספת חיצונית (HashiCorp Vault, AWS Secrets Manager), וכלי כמו External Secrets מושך אותם ל-cluster. או Sealed Secrets: מוצפן לפני ה-commit, ורק ה-cluster יכול לפתוח |

**עוד שימושי:**

| פקודה או שדה | מה זה |
|---|---|
| `stringData:` במקום `data:` | כותבות טקסט רגיל, ו-Kubernetes מקודד לבד. נוח, אבל הסיסמה גלויה בקובץ |
| `kubectl describe secret postgres-secret -n shoplist` | מראה רק שמות מפתחות וגדלים, בלי הערכים |
| `kubectl create secret generic postgres-secret --from-literal=POSTGRES_PASSWORD=shoppass -n shoplist` | יוצר Secret בלי קובץ, ולכן בלי סיכון ל-commit |
| `type: Opaque` / `kubernetes.io/tls` / `kubernetes.io/dockerconfigjson` | סודות כלליים (אצלנו) / תעודה / סיסמה ל-registry פרטי (שיעור 8) |

### PersistentVolumeClaim: טופס בקשה לארונית

**מה זה:** בקשה לאחסון: "אני צריכה ארונית של 1Gi".

**למה זה קיים:** כמו בשיעור 4, ה-container הוא חדר במלון: כשמוחקים את ה-pod, כל מה שבתוכו נעלם. למסד נתונים צריך ארונית שנשארת.

**איך זה עובד:**

| | במלון | ב-Kubernetes |
|---|---|---|
| הבקשה | טופס: "ארונית בגודל בינוני" | PersistentVolumeClaim (PVC) |
| מה שמקבלים | הארונית עצמה | PersistentVolume (PV) |
| מי מייצר ארוניות | המחסן | StorageClass. ב-Docker Desktop: `hostpath` |

ה-pod של postgres מחבר את ה-PVC לתיקייה `/var/lib/postgresql/data`. ה-pod נמחק? ה-PVC נשאר. pod חדש מתחבר לאותו PVC, והמוצרים שם.

> **טעות נפוצה:** לחשוב שמחיקת pod מוחקת נתונים. היא לא. מה שמוחק את הנתונים הוא `kubectl delete pvc`: זה ה-`down -v` של Kubernetes.

### readinessProbe: השלט "פתוח" על הדלת

**מה זה:** בדיקה ש-Kubernetes מריץ על ה-pod כל כמה שניות: "את מוכנה לקבל לקוחות?".

**למה זה קיים:** pod יכול להיות `Running` אבל עוד לא מוכן. postgres צריך כמה שניות. ב-Compose פתרנו את זה עם `healthcheck` ו-`depends_on`.

**איך זה עובד:** כל עוד הבדיקה נכשלת, ה-pod מסומן `0/1`, וה-Service **לא שולח אליו** שיחות. כשהיא מצליחה: `1/1`, והשלט מתהפך ל"פתוח".

| הסרוויס | הבדיקה |
|---|---|
| postgres | פקודה: `pg_isready` |
| backend | בקשת HTTP ל-`/health` בפורט 5000 |
| stats | בקשת HTTP ל-`/health` בפורט 3000 |

> **ואין `depends_on`:** אם ה-backend עולה לפני postgres, הבדיקה שלו פשוט נכשלת עוד כמה פעמים, ו-Kubernetes ממשיך לנסות. לא צריך להגיד לו באיזה סדר.

### readiness מול liveness: השלט על הדלת, ובדיקת הדופק

| | readinessProbe | livenessProbe |
|---|---|---|
| **השאלה** | "את מוכנה לקבל לקוחות?" | "את בכלל חיה?" |
| **כשנכשל** | ה-pod יוצא מה-endpoints. ה-Service מפסיק לשלוח אליו. **לא מפעילים מחדש** | ה-kubelet **מפעילה מחדש** את ה-container (אחרי `failureThreshold` כישלונות ברצף) |
| **בשביל מה** | עלייה, עומס, תלות שעוד לא מוכנה | תהליך שנתקע: לא קרס, אבל לא עונה |
| **בקונדיטוריה** | השלט "פתוח/סגור" | אופה שנרדמה ליד התנור: מעירים אותה |

ויש שלישית, **startupProbe**, לאפליקציות שעולות לאט: עד שהיא עוברת, ה-liveness לא מתחיל, כדי שלא יפעיל מחדש אפליקציה שעוד לא סיימה לעלות.

ככה נראה backend עם שתיהן:

```yaml
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
```

> **טעות נפוצה, ומסוכנת:** liveness שבודק גם את מסד הנתונים. postgres נופל לדקה, כל ה-backends נכשלים ב-liveness ומופעלים מחדש שוב ושוב, בדיוק כשהמערכת חלשה. הכלל: **liveness בודק רק שהתהליך עצמו חי.** readiness יכול לבדוק תלויות.

> **בקבצים של היום יש רק readiness.** הוספת liveness היא בונוס בשיעורי הבית (ד12).

---

## חלק 3 — בונים יחד

כל 12 הקבצים **כבר מחכים לכן** בתיקייה `kubernetes/`, בתיקייה הראשית של הריפו. הם שלדים: המבנה וההזחה כבר נכונים, ובמקומות החשובים יש קו ריק, `____`, עם הערה שמסבירה מה צריך לבוא שם. ממלאות יחד עם המצגת, קובץ אחרי קובץ.

```
devops-2027-shoplist/
├── app/
├── docker/
├── sql/
└── kubernetes/        ← 12 שלדים
```

**איך עובדים עם כל קובץ:** בזוגות, מחשב אחד לזוג. אחת מקלידה, השנייה שואלת. מתחלפות בכל קובץ.

1. **מנחשות:** במצגת מופיעים קודם רק הקווים הריקים. דקה בזוג: מה בא בכל קו?
2. **ממלאות:** בקובץ שב-`kubernetes/`. ההערות באנגלית אומרות מה צריך לבוא שם, ואם השם מגיע מקובץ אחר. לפני ה-apply, השואלת שואלת את ארבע השאלות: מה זה? איך קוראים לו? מה הוא רוצה? את מי הוא מוצא?
3. **מריצות:** `kubectl apply -f kubernetes/<הקובץ>.yml`. בטרמינל שני `kubectl get pods -n shoplist -w` פתוח כל הזמן
4. **רואות:** לכל קובץ יש משהו שקורה על המסך. מסתכלות עליו לפני שממשיכות

> **קובץ אחרי קובץ, לא את כל התיקייה.** `kubectl apply -f kubernetes/` על קבצים שעוד יש בהם `____` ייכשל. ההערות (`#`) לא מפריעות: Kubernetes מתעלם מהן, ואפשר להשאיר אותן.

> **הקבצים המלאים מופיעים בהמשך המדריך**, לכל שלב. הם בשביל מי שנתקעה או רוצה להשוות. קודם מנסות לבד, לפי המצגת.

> **YAML:** רווחים בלבד, לא Tab. שניים לכל רמה. המקף של רשימה (`- name:`) הוא חלק מההזחה.

### שלב 2 — namespace.yml

`kubernetes/namespace.yml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: shoplist
```

```shell
kubectl apply -f kubernetes/namespace.yml
```

> יצרתן את `shoplist` כבר בשיעור 5 עם `kubectl create namespace`? תקבלו אזהרה על annotation חסר. זה תקין, אפשר להתעלם.

### שלב 3 — postgres-secret.yml

`kubernetes/postgres-secret.yml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: shoplist
type: Opaque
data:
  POSTGRES_DB: c2hvcGxpc3Q=
  POSTGRES_USER: c2hvcHVzZXI=
  POSTGRES_PASSWORD: c2hvcHBhc3M=
```

| מפתח | הערך המפוענח |
|---|---|
| `POSTGRES_DB` | `shoplist` |
| `POSTGRES_USER` | `shopuser` |
| `POSTGRES_PASSWORD` | `shoppass` |

שמות המפתחות הם בדיוק השמות ש-`postgres:15-alpine` מחפש, כמו ב-`environment` של Compose.

```shell
kubectl apply -f kubernetes/postgres-secret.yml
kubectl get secret postgres-secret -n shoplist -o yaml
```

**לנסות:** להעתיק את הערך של `POSTGRES_PASSWORD` ולפענח אותו. מה יצא?

### שלב 4 — postgres-configmap.yml

`kubernetes/postgres-configmap.yml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init
  namespace: shoplist
data:
  init.sql: |
    CREATE TABLE IF NOT EXISTS products (
        id        SERIAL PRIMARY KEY,
        name      VARCHAR(100) NOT NULL,
        price     NUMERIC(10, 2) NOT NULL,
        quantity  INTEGER NOT NULL DEFAULT 1,
        category  VARCHAR(30) NOT NULL DEFAULT 'Other',
        bought    BOOLEAN NOT NULL DEFAULT FALSE
    );
```

- `init.sql:` הוא **שם הקובץ** שייווצר בתיקייה. `|` אומר "מכאן טקסט של כמה שורות".
- התוכן הוא בדיוק `sql/init.sql`, מוזח בארבעה רווחים.

```shell
kubectl apply -f kubernetes/postgres-configmap.yml
```

### שלב 5 — postgres-pvc.yml

`kubernetes/postgres-pvc.yml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: shoplist
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

| שדה | משמעות |
|---|---|
| `ReadWriteOnce` | רק node אחד יכול לחבר אותה בכל רגע. מתאים למסד נתונים |
| `storage: 1Gi` | הגודל: ג'יגה אחד |

```shell
kubectl apply -f kubernetes/postgres-pvc.yml
kubectl get pvc -n shoplist
kubectl get storageclass
```

**צפוי:** `postgres-pvc` במצב `Bound`. המחסן (`hostpath`) ייצר ארונית לפי הבקשה.

### שלב 6 — postgres-deployment.yml

הקובץ הכי ארוך היום. לעבור עליו לאט.

`kubernetes/postgres-deployment.yml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: shoplist
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          envFrom:
            - secretRef:
                name: postgres-secret
          ports:
            - containerPort: 5432
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "shopuser", "-d", "shoplist"]
            initialDelaySeconds: 5
            periodSeconds: 10
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
            - name: postgres-init
              mountPath: /docker-entrypoint-initdb.d
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
        - name: postgres-init
          configMap:
            name: postgres-init
```

| חלק | מה הוא עושה | ב-Compose |
|---|---|---|
| `replicas: 1` | pod אחד של postgres, תמיד | — |
| `selector` ו-`labels` | המדבקה `app: postgres` | — |
| `envFrom: secretRef` | כל מפתח ב-Secret הופך למשתנה סביבה | `environment` |
| `readinessProbe` | `pg_isready` כל 10 שניות | `healthcheck` |
| `volumes` | **מה** מחברים: ה-PVC וה-ConfigMap | הרשימה בסוף הקובץ |
| `volumeMounts` | **לאן** מחברים, בתוך ה-container | `volumes` תחת ה-service |

> **שני חלקים לכל volume:** `volumes` בתחתית אומר מה זה, `volumeMounts` אומר לאן. ה-`name` מחבר ביניהם, ולכן חייב להיות זהה.

### שלב 7 — postgres-service.yml

`kubernetes/postgres-service.yml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: shoplist
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

אין `type`, אז זה ClusterIP: רק מתוך ה-cluster. **השם `postgres` הוא הכתובת**, בדיוק כמו בשיעור 4.

**בחלון טרמינל שני**, להשאיר פתוח:

```shell
kubectl get pods -n shoplist -w
```

**בחלון הראשון:**

```shell
kubectl apply -f kubernetes/postgres-deployment.yml
kubectl apply -f kubernetes/postgres-service.yml
```

**צפוי בחלון השני:** `ContainerCreating`, אחר כך `Running` עם `0/1`, ואחרי כמה שניות `1/1`. זה ה-readinessProbe: השלט התהפך ל"פתוח".

```shell
kubectl logs deployment/postgres -n shoplist
```

לחפש בלוג: `running /docker-entrypoint-initdb.d/init.sql` ו-`database system is ready to accept connections`.

### שלב 8 — backend: Deployment ו-Service

`kubernetes/backend-deployment.yml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: shoplist
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: shoplist-backend:local
          imagePullPolicy: Never
          env:
            - name: DB_HOST
              value: postgres
            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_DB
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_USER
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
          ports:
            - containerPort: 5000
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 10
```

| חלק | למה |
|---|---|
| `image: shoplist-backend:local` | ה-image שבנינו בשלב 1 |
| `imagePullPolicy: Never` | לא להוריד מהאינטרנט. להשתמש במה שבמחשב |
| `DB_HOST: postgres` | שם ה-Service של postgres. זה לא סוד, אז כתוב ישר |
| `secretKeyRef` | לקחת **מפתח אחד** מה-Secret, ולתת לו **שם אחר**: ה-backend מחפש `DB_PASSWORD`, וב-Secret זה `POSTGRES_PASSWORD` |
| `readinessProbe` | `/health` של Flask |

`kubernetes/backend-service.yml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: shoplist
spec:
  selector:
    app: backend
  ports:
    - port: 5000
      targetPort: 5000
```

```shell
kubectl apply -f kubernetes/backend-deployment.yml
kubectl apply -f kubernetes/backend-service.yml
kubectl logs deployment/backend -n shoplist
```

**צפוי:** pod של backend מגיע ל-`1/1`. בלוג: Flask רץ, ובקשות `GET /health` כל 10 שניות. זה ה-readinessProbe דופק בדלת.

### לפני שממשיכות: השמות שמחברים בין הקבצים

שמונה קבצים כתובים. עכשיו מסתכלות על מה שמחבר ביניהם: **שמות שחייבים להיות זהים בדיוק בשני מקומות**. זו שאלה 4 מלמעלה, על כל הקבצים יחד.

| השם | מוגדר ב | משתמשים בו ב | אם לא זהה |
|---|---|---|---|
| `postgres-secret` | `postgres-secret.yml`, ‏`metadata.name` | `envFrom` ב-postgres, ‏`secretKeyRef.name` ב-backend | pod ב-`CreateContainerConfigError`: ‏`secret not found` |
| `POSTGRES_PASSWORD` (וגם `_DB`, `_USER`) | `postgres-secret.yml`, ‏`data` | `secretKeyRef.key` ב-backend | `CreateContainerConfigError`: ‏`couldn't find key` |
| `postgres-init` | `postgres-configmap.yml`, ‏`metadata.name` | `volumes.configMap.name` ב-postgres | pod תקוע ב-`ContainerCreating` |
| `postgres-pvc` | `postgres-pvc.yml`, ‏`metadata.name` | `claimName` ב-postgres | pod תקוע ב-`Pending` |
| `postgres-data` (שם ה-volume) | `volumes.name` ב-postgres | `volumeMounts.name`, באותו קובץ | `apply` נכשל: ‏`volumeMounts ... Not found` |
| `app: backend` | `template.metadata.labels` ב-Deployment | `selector.matchLabels` באותו קובץ, ו-`selector` ב-Service | Deployment: ‏`apply` נכשל. Service: אין endpoints, אין תשובה |
| `postgres` (שם ה-Service) | `postgres-service.yml`, ‏`metadata.name` | `DB_HOST` ב-backend | backend לא מתחבר למסד הנתונים |
| `backend`, `stats` (שמות Services) | `backend-service.yml`, ‏`stats-service.yml` | `nginx.conf` בתוך ה-image של frontend, ו-`BACKEND_URL` ב-stats | frontend נופל: ‏`host not found in upstream` |

> **תרגיל של 3 דקות, על דף:** פותחות את `backend-deployment.yml`, ומסמנות כל שם שמחבר אותו למשהו אחר. מה מצאתן? (`postgres` ב-`DB_HOST`: ה-Service. ‏`postgres-secret` ושלושת המפתחות שלו: ה-Secret. ‏`app: backend`: מה שה-Service מחפש. ‏`shoplist-backend:local`: השם מה-`docker build`.)

---

### שלב 9 — עכשיו אתן: stats ו-frontend (תרגיל 2, 15 דקות)

ארבעה קבצים, **וכל אחד עם פחות עזרה מהקודם**: שלד עם קווים, אחר כך רק המפתחות, ובסוף דף ריק. אותה תבנית כמו ה-backend. מה משתנה:

| | stats | frontend |
|---|---|---|
| image | `shoplist-stats:local` | `shoplist-frontend:local` |
| פורט | 3000 | 80 |
| משתני סביבה | `BACKEND_URL: http://backend:5000` | אין |
| Secret | **לא צריך.** stats לא מדבר עם מסד הנתונים | לא צריך |
| readinessProbe | `/health` בפורט 3000 | אין |
| Service | ClusterIP, פורט 3000 | **NodePort**, פורט 80, `nodePort: 30080` |

**9א — `stats-deployment.yml`: שלד עם קווים.** השלד כבר בקובץ. משלימות כל `____`:

```yaml
apiVersion: apps/v1
kind: ____
metadata:
  name: ____
  namespace: shoplist
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ____
  template:
    metadata:
      labels:
        app: ____                # אותה מדבקה בדיוק כמו בשורה למעלה
    spec:
      containers:
        - name: stats
          image: ____
          imagePullPolicy: Never
          env:
            - name: BACKEND_URL
              value: ____        # שם ה-Service של ה-backend, עם http:// ופורט
          ports:
            - containerPort: ____
          readinessProbe:
            httpGet:
              path: /health
              port: ____
            initialDelaySeconds: 5
            periodSeconds: 10
```

**9ב — `stats-service.yml`: רק המפתחות.** כבר בקובץ. הערכים עליכן:

```yaml
apiVersion:
kind:
metadata:
  name:            # השם הזה הוא הכתובת. nginx.conf מחפש אותו
  namespace:
spec:
  selector:
    app:           # חייב להיות זהה למדבקה ב-stats-deployment.yml
  ports:
    - port:
      targetPort:
```

**9ג — `frontend-deployment.yml`: דף ריק.** בקובץ יש רק הערות עם רשימת הבדיקה. רמז: מעתיקות את `stats-deployment.yml`, ומוחקות. רשימת בדיקה:

- [ ] ארבע קומות
- [ ] `app: frontend` בשני מקומות, זהה
- [ ] `image: shoplist-frontend:local` ו-`imagePullPolicy: Never`
- [ ] `containerPort: 80`
- [ ] **אין** `env`, אין Secret, אין readinessProbe

**9ד — `frontend-service.yml`: דף ריק.** שלושה הבדלים מ-`stats-service.yml`:

- [ ] `type: NodePort`
- [ ] `port` ו-`targetPort`: ‏80
- [ ] `nodePort: 30080`, באותה הזחה כמו `port`

**לפני כל `apply`:** ארבע השאלות על הקובץ, בקול. ובדיקה בלי ליצור כלום:

```shell
kubectl apply --dry-run=server -f kubernetes/stats-deployment.yml
```

**צפוי:** `deployment.apps/stats created (server dry run)`. שגיאת כתיב או הזחה? היא מופיעה כאן, לפני שמשהו נוצר.

נתקעתן? הקבצים המלאים כאן:

<details>
<summary><code>kubernetes/stats-deployment.yml</code></summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stats
  namespace: shoplist
spec:
  replicas: 1
  selector:
    matchLabels:
      app: stats
  template:
    metadata:
      labels:
        app: stats
    spec:
      containers:
        - name: stats
          image: shoplist-stats:local
          imagePullPolicy: Never
          env:
            - name: BACKEND_URL
              value: http://backend:5000
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```
</details>

<details>
<summary><code>kubernetes/stats-service.yml</code></summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stats
  namespace: shoplist
spec:
  selector:
    app: stats
  ports:
    - port: 3000
      targetPort: 3000
```
</details>

<details>
<summary><code>kubernetes/frontend-deployment.yml</code></summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: shoplist
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: shoplist-frontend:local
          imagePullPolicy: Never
          ports:
            - containerPort: 80
```
</details>

<details>
<summary><code>kubernetes/frontend-service.yml</code></summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: shoplist
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
```
</details>

**סדר ההחלה:** קודם stats (קובץ ה-Service לפני ה-frontend!), ואחר כך frontend:

```shell
kubectl apply -f kubernetes/stats-deployment.yml
kubectl apply -f kubernetes/stats-service.yml
kubectl apply -f kubernetes/frontend-deployment.yml
kubectl apply -f kubernetes/frontend-service.yml
```

> **למה stats לפני frontend?** Nginx מחפש את השמות `stats` ו-`backend` ברגע שהוא עולה (זוכרות את `nginx.conf`?). אם ה-Service עוד לא קיים, Nginx נופל עם `host not found in upstream`. ב-Kubernetes זה מסתדר לבד: הוא מרים את ה-pod שוב ושוב, עד שה-Service קיים.

### שלב 10 — האפליקציה עובדת

```shell
kubectl get all -n shoplist
```

**צפוי:** ארבעה pods, כולם `1/1 Running`. ארבעה Deployments `1/1`. ה-Service של ה-frontend: `80:30080/TCP`.

לפתוח בדפדפן: **`http://localhost:30080`**

- שתי הנוריות למעלה ירוקות
- להוסיף שלושה מוצרים, לסמן אחד כנקנה, ולערוך אחד

---

## חלק 4 — בודקות שזה באמת Kubernetes (תרגיל 3, 10 דקות)

### 1. המוצרים שורדים (PVC)

```shell
kubectl delete pod -n shoplist -l app=postgres
kubectl get pods -n shoplist -w
```

`-l app=postgres`: למחוק לפי מדבקה, בלי להעתיק שם. כשה-pod החדש `1/1`, לרענן את הדפדפן. **המוצרים עדיין שם?** חדר חדש, אותה ארונית.

### 2. המטבח מתקן לבד

```shell
kubectl delete pod -n shoplist -l app=backend
```

בדפדפן, הנורית של backend אדומה לכמה שניות, וחוזרת לירוק. אף אחת לא הרימה אותו.

### 3. לשנות את ההזמנה, דרך הקובץ

ב-`kubernetes/backend-deployment.yml`, לשנות `replicas: 1` ל-`replicas: 3`, לשמור, ו:

```shell
kubectl apply -f kubernetes/backend-deployment.yml
kubectl get pods -n shoplist
kubectl get endpoints backend -n shoplist
```

**צפוי:** שלושה pods של backend, ושלוש כתובות מאחורי ה-Service `backend`. האפליקציה ממשיכה לעבוד, וכל בקשה מגיעה לאחד מהם.

> **זה declarative:** לא אמרנו "תוסיף שניים". שינינו את מה שצריך להיות, ו-Kubernetes השלים את ההפרש. ה-`scale` משיעור 5 עובד, אבל רק הקובץ נשמר ב-Git.

להחזיר ל-`replicas: 1`, ו-`apply` שוב.

### 4. כל הקבצים בפקודה אחת

אפשר להחיל תיקייה שלמה:

```shell
kubectl apply -f kubernetes/
```

ושום דבר לא ישתנה: `unchanged` ליד כל קובץ.

> **ב-cluster חדש** (למשל בבית), להחיל קודם את `kubernetes/namespace.yml`. הקבצים מוחלים בסדר אלפביתי, ומה שקודם ל-`namespace.yml` ייכשל אם ה-namespace עוד לא קיים. זה הכוח של declarative: מריצות את אותה פקודה כמה פעמים שרוצות, והתוצאה זהה.

---

## חלק 5 — מילון פקודות: Compose מול kubectl

| מה רוצות | Compose | Kubernetes |
|---|---|---|
| להרים הכל | `docker compose up -d` | `kubectl apply -f kubernetes/` |
| מה רץ | `docker compose ps` | `kubectl get pods -n shoplist` |
| לוגים | `docker compose logs backend` | `kubectl logs deployment/backend -n shoplist` |
| להיכנס פנימה | `docker compose exec backend sh` | `kubectl exec -it deployment/backend -n shoplist -- sh` |
| להוריד, להשאיר נתונים | `docker compose down` | `kubectl delete deployment,service --all -n shoplist` |
| להוריד ולמחוק נתונים | `docker compose down -v` | `kubectl delete pvc postgres-pvc -n shoplist` |

> **זהירות:** `kubectl delete -f kubernetes/` מוחק גם את ה-PVC (הוא בתיקייה!) וגם את ה-namespace. בסוף השיעור **לא** מוחקות כלום: נמשיך מכאן בשיעור 7.

---

## חלק 6 — ומה בענן? Ingress, ואיך ShopList נראית באינטרנט

### Ingress: פקידת הקבלה של ה-cluster

**מה זה:** כניסה אחת לכל ה-cluster, ששולחת כל בקשה ל-Service הנכון לפי **שם האתר** (host) ו**הנתיב** (path). אותו רעיון כמו `nginx.conf` משיעור 4, ברמת ה-cluster.

**למה זה קיים:** בענן, LoadBalancer לכל Service עולה כסף: מאזן עומס נפרד לכל סרוויס. עם Ingress יש מאזן אחד, ומאחוריו כמה סרוויסים.

**איך זה עובד:** שני חלקים.

| חלק | מה זה |
|---|---|
| קובץ `kind: Ingress` | הכללים: `shop.example.com` הולך ל-Service בשם `frontend`, בפורט 80 |
| Ingress Controller | התוכנה שמבצעת את הכללים: ingress-nginx, או ב-AWS ה-Load Balancer Controller שיוצר ALB |

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shoplist
  namespace: shoplist
spec:
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

> **טעות נפוצה:** לכתוב קובץ Ingress ולחכות שיקרה משהו. בלי Ingress Controller, הקובץ לא עושה כלום. ב-Docker Desktop אין controller מותקן, ולכן בכיתה השתמשנו ב-NodePort. וגם: Ingress הוא לא סוג של Service. ה-Services שמאחוריו נשארים ClusterIP.

### ShopList ב-cluster בענן

```
משתמשת ← DNS (shop.example.com) ← Load Balancer של הענן ← Ingress Controller ← Services (ClusterIP) ← pods
```

| | בכיתה (Docker Desktop) | בענן (EKS, AKS, GKE) |
|---|---|---|
| הכניסה | NodePort, `localhost:30080` | Load Balancer עם כתובת ציבורית ו-HTTPS, ואחריו Ingress |
| nodes | אחד, המחשב שלכן | כמה, באזורים שונים (Availability Zones), ברשת פרטית בלי כתובת ציבורית |
| ההנהלה | על אותו node | מנוהלת על ידי הספק. לא רואים אותה |
| images | מהמחשב, `imagePullPolicy: Never` | מ-registry (שיעור 8) |
| הארונית (PVC) | תיקייה במחשב (`hostpath`) | דיסק של הענן, למשל EBS. או מסד נתונים מנוהל, כמו RDS |

**הרעיון המרכזי:** דלת ציבורית אחת, וכל השאר פנימי.

---

## תקלות נפוצות

| בעיה | סיבה | פתרון |
|---|---|---|
| `ErrImageNeverPull` | ה-image לא נבנה, או שהשם לא תואם בדיוק | `docker images shoplist-*`, ולבנות לפי שלב 1. השם ב-`image:` חייב להיות זהה, כולל `:local` |
| `No resources found in shoplist namespace` | ה-apply נכשל, או שחסר `namespace: shoplist` בקובץ | לקרוא את הפלט של `kubectl apply`. לבדוק את `metadata` |
| `error converting YAML to JSON` | Tab, או הזחה שגויה | רווחים בלבד. השגיאה אומרת באיזו שורה |
| `selector does not match template labels` | מדבקה שונה ב-`selector` וב-`template` | אותה מילה בדיוק בשני המקומות |
| pod תקוע ב-`0/1` | ה-readinessProbe נכשל | `kubectl describe pod -n shoplist -l app=backend`, ולחפש למטה `Readiness probe failed` |
| backend ב-`CrashLoopBackOff` | משהו חסר: Secret, שם מפתח, או postgres לא קיים | `kubectl logs deployment/backend -n shoplist` |
| frontend ב-`CrashLoopBackOff`, בלוג `host not found in upstream` | ה-Service של stats או backend עוד לא קיים | להחיל אותו. ה-frontend יתאושש לבד |
| PVC תקוע ב-`Pending` | אין StorageClass | `kubectl get storageclass`. ב-Docker Desktop צריך להיות `hostpath` |
| postgres נופל עם `directory ... exists but is not empty` | שאריות בארונית | למחוק את ה-PVC ולהחיל שוב (מוחק נתונים!) |
| `relation "products" does not exist` | ה-ConfigMap חובר אחרי שהארונית כבר נוצרה | init.sql רץ רק על ארונית ריקה: `kubectl delete pvc postgres-pvc -n shoplist`, ולהחיל שוב את ה-PVC ואת postgres |
| הדפדפן לא נפתח ב-30080 | ה-Service לא NodePort, או פורט אחר | `kubectl get svc -n shoplist`: צריך `80:30080/TCP` |
| הנורית של stats אדומה | ה-Service `stats` חסר, או `BACKEND_URL` שגוי | `kubectl get endpoints -n shoplist`, ו-`kubectl logs deployment/stats -n shoplist` |

---

## שאלות לראיון עבודה

**1. מה ההבדל בין ConfigMap ל-Secret?**
שניהם מעבירים הגדרות ל-pods בלי לבנות image מחדש. ConfigMap להגדרות רגילות, בטקסט גלוי. Secret למידע רגיש: הערכים ב-base64, ואפשר להגביל עליו הרשאות בנפרד.

**2. Secret מוצפן?**
לא. base64 הוא קידוד, לא הצפנה: כל מי שקוראת את ה-Secret מפענחת אותו בפקודה אחת. ההגנה היא הרשאות (RBAC), ובסביבות אמיתיות גם הצפנה של etcd או כלי חיצוני לניהול סודות.

**3. מה ההבדל בין PVC ל-PV, ומה קורה לנתונים כשה-pod נמחק?**
PVC הוא הבקשה לאחסון, PV הוא האחסון עצמו, ו-StorageClass מייצר PV לפי בקשה. כשה-pod נמחק, ה-PVC וה-PV נשארים, וה-pod החדש מתחבר אליהם. הנתונים נמחקים רק כשמוחקים את ה-PVC.

**4. מה עושה readinessProbe, ובמה הוא שונה מ-depends_on ב-Compose?**
הוא בודק אם ה-pod מוכן לקבל בקשות, וכל עוד לא, ה-Service לא שולח אליו. ב-Kubernetes אין סדר עלייה: כל רכיב עולה, נכשל אם צריך, ומנסה שוב עד שהכל מוכן.

**5. איך Service יודע לאילו pods לשלוח בקשות?**
לפי labels. ה-`selector` של ה-Service מחפש pods עם אותה מדבקה, ומעדכן את רשימת הכתובות (endpoints) כל הזמן, כשpods נוצרים ונמחקים.
