# שיעור 5 — Kubernetes: מה זה cluster
## מדריך לסטודנטית

---

## מה יהיה בסוף השיעור

- cluster של Kubernetes רץ על המחשב, ב-Docker Desktop
- `kubectl` מחובר אליו (context בשם `docker-desktop`)
- namespace בשם `shoplist`, מוכן לשיעור 6
- בדקתן שה-cluster רואה את ה-images שבניתן: `shoplist-stats:local`

**מה תדעו לעשות:**
- להסביר מה זה cluster, ומה התפקיד של כל רכיב בו
- להסביר את ההבדל בין imperative ל-declarative, ואיך לולאת הבקרה עובדת
- ליצור Deployment, למחוק pod ולראות אותו חוזר, לשנות מספר עותקים, ולפתוח Service
- להסביר מה שונה בין cluster מקומי ל-cluster בענן

**עוד לא:** ShopList לא רצה ב-Kubernetes. זה שיעור 6.

---

## לפני שמתחילות

- [ ] Docker Desktop פתוח ורץ
- [ ] יש לכן image של stats בשם `shoplist-stats:local`. ב-Compose הוא נבנה בשם `docker-stats`, אז בונות אותו פעם אחת עם שם משלנו:

```shell
docker build -t shoplist-stats:local app/stats
docker images shoplist-stats
```
- [ ] בתיקייה הראשית של הריפו: `cd devops-2027-shoplist`

---

## חלק 1 — למה Kubernetes

### מה Compose לא פותר

| מקרה | עם Compose |
|---|---|
| השרת נכבה ועלה מחדש | שום דבר לא עולה מעצמו |
| backend קרס בשלוש בלילה | נשאר למטה עד שמישהי שמה לב |
| פתאום פי עשרה משתמשות | פותחות עוד עותקים ביד |
| מחשב אחד לא מספיק | Compose עובד רק על מחשב אחד |

**Kubernetes לא מחליף את Docker.** ה-images נשארים אותם images. Kubernetes הוא שכבת ניהול מעל containers: מחליט איפה כל אחד ירוץ, משגיח עליו, ומחליף אותו כשהוא נופל.

> **השם:** ביוונית, הגאי, מי שמנווט את הספינה. מקצרים ל-**K8s**: K, שמונה אותיות, s.

### imperative מול declarative

| | imperative | declarative |
|---|---|---|
| **מה אומרים** | "תעשה עכשיו" | "ככה זה צריך להיות" |
| **בקונדיטוריה** | "תאפי עוגת שוקולד עכשיו" | "בוויטרינה יהיו תמיד 3 עוגות שוקולד" |
| **מה קורה כשמשהו נופל** | כלום. הפקודה כבר נגמרה | משלימים מיד |
| **דוגמה** | `docker run`, `docker compose up` | `replicas: 3` ב-Kubernetes |

**המשפט החשוב של היום:** ב-Kubernetes לא אומרים מה לעשות. מתארים מה צריך להיות, והוא דואג שזה יקרה.

### לולאת הבקרה: כמו מזגן עם טרמוסטט

לא אומרות למזגן "תקרר עשר דקות". קובעות 24 מעלות, והוא בודק ומתקן כל הזמן.

1. **מה רצוי:** 24 מעלות. ב-Kubernetes: `replicas: 3`.
2. **מה בפועל:** 27 מעלות. ב-Kubernetes: רצים 2.
3. **מתקנים את ההפרש:** מקרר. ב-Kubernetes: יוצר pod אחד.
4. **חוזרים ל-1.** כל הזמן.

> **טעות נפוצה:** לחשוב ש-Kubernetes "מריץ פקודות". הוא לא. הוא משווה כל הזמן בין מה שכתוב לבין מה שיש.

---

## חלק 2 — מה זה cluster

**cluster** (אשכול): הרבה מחשבים שמתנהגים כמו מחשב אחד גדול. כל מחשב נקרא **node**. לא אומרים "תריץ על שרת 3", אומרים "אני רוצה 3 עותקים", וה-cluster מחליט איפה.

### האנלוגיה: רשת קונדיטוריות

| בקונדיטוריה | ב-Docker | ב-Kubernetes |
|---|---|---|
| מתכון | image | image |
| עוגה | container | container, בתוך pod |
| מטבח | המחשב שלכן | node |
| משרד ההנהלה | אין | control plane |

### ההנהלה (control plane)

| רכיב | תפקיד | בקונדיטוריה |
|---|---|---|
| **API server** | הכניסה היחידה. מקבל כל בקשה, בודק שהיא תקינה ושמותר, ורושם. `kubectl` מדבר רק איתו | מוקד ההזמנות |
| **etcd** | מסד הנתונים של ה-cluster עצמו: מה צריך להיות, ומה יש | ספר ההזמנות |
| **scheduler** | מחליט על איזה node ירוץ כל pod חדש, לפי מקום פנוי | הסדרנית |
| **controller manager** | לולאת הבקרה: משווה רצוי לבפועל, ומתקן | המפקחת |

> **טעות נפוצה:** לבלבל בין etcd לבין מסד הנתונים של האפליקציה. etcd שומר את ההגדרות של ה-cluster. המוצרים של ShopList יישמרו ב-postgres, שהוא אפליקציה שרצה ב-cluster.

### המטבחים (worker nodes)

| רכיב | תפקיד | בקונדיטוריה |
|---|---|---|
| **kubelet** | שואלת "מה שובץ אליי?", מריצה, ומדווחת כל כמה שניות שה-node חי | אחראית המשמרת |
| **container runtime** | מריץ containers מ-images. ב-Docker Desktop: מנוע ה-Docker | התנור |
| **kube-proxy** | בקשה לשם של Service מגיעה לאחד ה-pods הנכונים | השליחה |

**חוק חשוב:** אף רכיב לא מדבר ישירות עם רכיב אחר. כולם מדברים דרך API server.

### מה קורה כשמזמינות 3 עוגות

```shell
kubectl create deployment web --image=nginx:1.30-alpine --replicas=3
```

1. kubectl שולח ל-**API server**.
2. נרשם ב-**etcd**: רצויים 3.
3. **controller manager** רואה 0 מתוך 3, ויוצר 3 pods.
4. **scheduler** משבץ כל pod ל-node.
5. **kubelet** בכל node רואה מה שובץ אליה.
6. **ה-runtime** מריץ, ו-kubelet מדווחת: Running.

### כשמשהו נופל

| מה נפל | מי שם לב | מה קורה |
|---|---|---|
| container קרס | kubelet | מרימה אותו מחדש באותו pod |
| pod נמחק | controller manager | רואה פחות מהרצוי, יוצר pod חדש |
| node שלם נפל | ההנהלה (kubelet הפסיקה לדווח) | מסמנת NotReady, וה-pods נוצרים על nodes אחרים |

> **ב-cluster של node אחד** (כמו אצלנו בכיתה) אין node אחר לעבור אליו. התיקון העצמי של pods עובד, של nodes לא.

---

## חלק 3 — אוצר מילים

### Pod: המגש
היחידה הכי קטנה ש-Kubernetes מכיר. container אחד (לפעמים כמה) על מגש. לכל pod כתובת IP, **שמשתנה** כשהוא נוצר מחדש.

> **טעות נפוצה:** להריץ pod לבד. אם הוא נמחק, אף אחד לא מחזיר אותו, כי אין הזמנה קבועה בספר.

### Deployment: ההזמנה הקבועה
"3 עוגות backend, תמיד". יוצר **ReplicaSet**, שסופר ומשלים, וה-ReplicaSet יוצר את ה-pods. מזהה את ה-pods שלו לפי **תווית (label)**, למשל `app=backend`.

**כלל:** לא מריצים pod לבד. תמיד דרך Deployment.

### Service: מספר טלפון קבוע
pods באים והולכים. Service נותן שם וכתובת קבועים, ומעביר כל בקשה לאחד ה-pods עם התווית המתאימה. **בדיוק "השם הוא הכתובת" משיעור 4.**

| סוג | מי מגיע | ב-ShopList |
|---|---|---|
| ClusterIP (ברירת מחדל) | רק מתוך ה-cluster | postgres, backend, stats |
| NodePort | מהמחשב, בפורט 30000–32767 | frontend, מקומי |
| LoadBalancer | מהאינטרנט, כתובת ציבורית | frontend, בענן |

### Namespace: מחלקות
חלוקה פנימית של ה-cluster. `kube-system` הוא ההנהלה עצמה, `default` הוא לאן שהולך מה שלא אמרו לו לאן, ו-`shoplist` יהיה שלנו.

> **הטעות הכי נפוצה בקורס:** לשכוח `-n shoplist`. בלי זה kubectl מסתכל ב-`default`, והרשימה ריקה.

### מילון: מ-Compose ל-Kubernetes

| Docker Compose | Kubernetes |
|---|---|
| `docker-compose.yml` | כמה קבצי YAML (manifests) |
| service בקובץ | Deployment |
| השם הוא הכתובת | Service |
| `ports` | NodePort או LoadBalancer |
| named volume | PersistentVolumeClaim |
| `environment` | ConfigMap ו-Secret |
| `healthcheck` | readinessProbe |
| `docker compose up` / `ps` | `kubectl apply` / `get` |

---

## חלק 4 — cluster על המחשב

### ארבעה כלים, אותו Kubernetes

| כלי | מה זה |
|---|---|
| **Docker Desktop** | Kubernetes מובנה. מפעילים בלחיצה, kubectl בפנים. **זה מה שנשתמש בו** |
| kind | Kubernetes in Docker: כל node הוא container. טוב לכמה nodes |
| k3d | k3s, גרסה קלה של Kubernetes, בתוך Docker. דורש התקנה |
| minikube | הכלי הרשמי, במכונה וירטואלית או ב-Docker. עם תוספים כמו dashboard |

כולם מריצים Kubernetes אמיתי: אותו `kubectl`, אותם קבצי YAML. ההבדל הוא באיך מתקינים ואיך מכניסים images.

**למה Docker Desktop:** כבר מותקן, kubectl מגיע איתו, וה-cluster משתמש באותו מנוע Docker, ולכן רואה את ה-images שבניתן בלי לייבא אותם.

### שלב 1 — להפעיל את Kubernetes ב-Docker Desktop

Kubernetes כבר נמצא בתוך Docker Desktop, רק כבוי. מדליקים אותו פעם אחת, והוא נשאר דולק גם אחרי שסוגרים ופותחים את Docker Desktop.

**א. לוודא ש-Docker עצמו רץ.** לפתוח את Docker Desktop, ולחכות שבפינה השמאלית התחתונה יופיע **Engine running** בירוק.

**ב. להיכנס להגדרות.** ללחוץ על **גלגל השיניים** ⚙️ (Settings) בפינה הימנית העליונה של החלון.

**ג. לבחור Kubernetes.** בתפריט שבצד שמאל של מסך ההגדרות: **Kubernetes**.

**ד. להפעיל.** לסמן את התיבה **Enable Kubernetes**.
- אם מופיעה שאלה **Cluster provisioning method**, לבחור **kubeadm** (node אחד). לא kind.
- את שאר התיבות להשאיר כמו שהן.

**ה. לשמור.** ללחוץ על **Apply & restart** (בגרסאות מסוימות הכפתור נקרא **Apply**) בפינה הימנית התחתונה. אם נפתח חלון ששואל אם להתקין את Kubernetes: **Install**.

**ו. לחכות.** Docker Desktop מוריד את ה-images של ההנהלה ומפעיל את ה-cluster. בפעם הראשונה זה לוקח כמה דקות. כשהוא מוכן, בפינה השמאלית התחתונה מופיע, ליד Engine running, גם **Kubernetes running** בירוק (או סמל ההגה ☸ בירוק).

> **אצלך המסך נראה אחרת?** בגרסאות חדשות של Docker Desktop יש בתפריט הצד של החלון הראשי לשונית **Kubernetes** עם כפתור **Create cluster**. אם יש לך אותה: Create cluster ← **kubeadm** ← Create, ומשם ממשיכים מ-ו.

> **תקוע ב-Starting יותר מ-10 דקות?** Settings ← Resources: לוודא שיש לפחות 4GB זיכרון. אם עדיין תקוע: Settings ← Kubernetes ← **Reset Kubernetes Cluster**, ולחכות שוב.

**ז. לפתוח טרמינל חדש** (טרמינל שהיה פתוח קודם לא מכיר את kubectl), ולבדוק:

```shell
kubectl config current-context
kubectl get nodes
```

**צפוי:** `docker-desktop`, ו-node אחד בשם `docker-desktop` במצב `Ready`, בתפקיד `control-plane`.

> **context** הוא "לאיזה cluster kubectl מדבר עכשיו". kubectl יכול להכיר כמה clusters. תמיד כדאי לבדוק לפני פקודה.

### שלב 2 — מצאו את ההנהלה (תרגיל 1, 10 דקות)

```shell
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
kubectl get pods -n kube-system
kubectl describe node docker-desktop
```

ב-`kube-system`, התאימו כל pod לתפקיד שלו:

| ה-pod מתחיל ב... | תפקיד |
|---|---|
| `kube-apiserver` | ? |
| `etcd` | ? |
| `kube-scheduler` | ? |
| `kube-controller-manager` | ? |
| `coredns` | ? |

**שאלה:** למה kubelet לא מופיעה ברשימה? (רמז: מי מפעילה את כל השאר?)

ב-`describe node`, לחפש: **Capacity** (כמה זיכרון ומעבד יש למטבח), ואת רשימת ה-pods שרצים עליו.

### שלב 3 — רואים את הטרמוסטט עובד (תרגיל 2א)

**בחלון טרמינל שני**, להשאיר פתוח:

```shell
kubectl get pods -w
```

`-w` (watch): מתעדכן לבד בכל שינוי. יציאה: Ctrl+C.

**בחלון הראשון:**

```shell
kubectl create deployment web --image=nginx:1.30-alpine --replicas=3
kubectl get deployments,replicasets,pods
```

Deployment אחד, ReplicaSet אחד, שלושה pods. בחלון השני רואים אותם עוברים מ-`Pending` ל-`ContainerCreating` ל-`Running`.

**למחוק עוגה:** להעתיק את השם של אחד ה-pods מהרשימה, ו:

```shell
kubectl delete pod <השם>
```

בחלון השני: אחד `Terminating`, ומיד נולד חדש. **מי יצר אותו?**

**לשנות את ההזמנה:**

```shell
kubectl scale deployment web --replicas=5
```

**לפתוח דלת מהמחשב:**

```shell
kubectl expose deployment web --type=NodePort --port=80
kubectl get services
```

בשורה של `web` מופיע משהו כמו `80:31234/TCP`. לפתוח בדפדפן `http://localhost:31234` (עם המספר שלכן): Welcome to nginx!, מאחד מחמשת ה-pods.

**לנקות:**

```shell
kubectl delete deployment web
kubectl delete service web
```

> `create`, `scale` ו-`expose` הן פקודות מהירות, טובות להדגמה. בעבודה אמיתית כותבים קבצי YAML ומריצים `kubectl apply`, כי קובץ אפשר לשמור ב-Git. זה שיעור 6.

### שלב 4 — ה-image שלנו ב-cluster (תרגיל 2ב)

> לא בניתן את `shoplist-stats:local` בתחילת השיעור? עכשיו: `docker build -t shoplist-stats:local app/stats`.

```shell
kubectl create namespace shoplist
kubectl run stats-test -n shoplist --image=shoplist-stats:local --image-pull-policy=Never
kubectl get pods -n shoplist
kubectl logs stats-test -n shoplist
```

- `--image-pull-policy=Never`: לא להוריד מהאינטרנט, להשתמש רק במה שיש על המחשב.
- **צפוי:** `Running`, ובלוג: `stats service listening on 0.0.0.0:3000`.

`kubectl run` יוצר **pod בודד**, בלי Deployment. מותר, כי זו בדיקה. עכשיו:

```shell
kubectl delete pod stats-test -n shoplist
kubectl get pods -n shoplist
```

**הוא חזר? למה לא?**

את ה-namespace `shoplist` משאירות. נשתמש בו בשיעור 6.

---

## חלק 5 — cluster מקומי מול ענן

**אנלוגיה:** cluster מקומי הוא מטבח ביתי עם תנור אחד, לנסות מתכונים בלי לשלם. cluster מנוהל בענן הוא מתחם מטבחים ששוכרים: בעל המתחם מחזיק את ההנהלה ואת התחזוקה, ומשלמים לפי שעה.

| | מקומי (Docker Desktop) | ענן מנוהל (EKS, AKS, GKE) |
|---|---|---|
| **nodes** | אחד, המחשב שלכן | כמה שצריך, שרתים אמיתיים |
| **ההנהלה** | אצלכן, על אותו node | הספק מנהל אותה. לא רואים אותה |
| **כניסה מבחוץ** | localhost ו-NodePort | LoadBalancer, כתובת ציבורית |
| **images** | רואה את מה שבניתן | רק מ-registry באינטרנט |
| **מחשב נכבה** | הכול נעצר | node נפל? העבודה עוברת לאחר |
| **עלות** | חינם | לפי שעה, גם כשאף אחד לא נכנס |
| **בשביל מה** | ללמוד, לפתח, לבדוק | משתמשות אמיתיות |

**מה זהה:** kubectl, קבצי ה-YAML, Deployment, Service, Namespace, ולולאת הבקרה.
**מה משתנה:** ה-context, images עוברים ל-registry (שיעור 8), LoadBalancer במקום NodePort, כסף והרשאות.

> **בקורס:** שיעור 6, ShopList ב-cluster המקומי. שיעור 8, images ל-registry. שיעורים 9–10, שרת בענן, ועליו cluster שנתקין בעצמנו. זו דרך שלישית: לא מנוהל ולא על המחשב.

---

## תקלות נפוצות

| בעיה | סיבה | פתרון |
|---|---|---|
| אין Kubernetes בתפריט ההגדרות | Docker Desktop ישן מאוד, או שה-engine לא רץ | לחכות ל-Engine running. אם עדיין אין: לעדכן את Docker Desktop |
| Kubernetes תקוע ב-Starting | הורדה איטית או חוסר זיכרון | Settings ← Resources: לפחות 4GB. אחר כך Settings ← Kubernetes ← Reset Kubernetes Cluster |
| `kubectl: command not found` / לא מזוהה | הטרמינל נפתח לפני ההפעלה | לסגור ולפתוח טרמינל |
| `The connection to the server ... was refused` | Kubernetes לא רץ, או context אחר | לבדוק בממשק "Kubernetes running", ו-`kubectl config use-context docker-desktop` |
| `No resources found in default namespace` | שכחתן `-n shoplist` | להוסיף `-n shoplist` |
| `ErrImageNeverPull` | ה-image לא קיים על המחשב | `docker images shoplist-stats`, ואם אין: `docker build -t shoplist-stats:local app/stats` |
| `ImagePullBackOff` ב-nginx | ה-image לא במחשב, וההורדה נחסמה | `docker pull nginx:1.30-alpine` (עם תעודת NetFree), ולנסות שוב |
| `deployments.apps "web" already exists` | נשאר מהפעם הקודמת | `kubectl delete deployment web` |
| הדפדפן לא נפתח ב-localhost:3XXXX | פורט לא נכון | `kubectl get services`, המספר אחרי הנקודתיים |
| ב-PowerShell, `\` בסוף שורה לא עובד | זה תחביר של bash | לכתוב את הפקודה בשורה אחת |

---

## שאלות לראיון עבודה

**1. מה ההבדל בין control plane ל-worker node?**
control plane מקבל בקשות, שומר את המצב הרצוי ומחליט מה רץ איפה (API server, etcd, scheduler, controller manager). worker nodes מריצים את ה-containers בפועל (kubelet, container runtime, kube-proxy).

**2. מה זה declarative, ואיך לולאת הבקרה עובדת?**
מתארים את המצב הרצוי ולא את הפעולות. לולאת הבקרה משווה כל הזמן בין הרצוי לבפועל ומתקנת את ההפרש, כמו טרמוסטט.

**3. pod קרס. מי שם לב ומי מחזיר אותו?**
kubelet מרימה מחדש container שקרס. אם ה-pod נמחק, ה-controller של ה-Deployment (דרך ה-ReplicaSet) יוצר pod חדש, וה-scheduler משבץ אותו.

**4. למה צריך Service, אם לכל pod יש IP?**
ה-IP של pod משתנה כשהוא נוצר מחדש, ויכולים להיות כמה עותקים. Service נותן שם וכתובת קבועים ומחלק את הבקשות בין ה-pods לפי labels.

**5. מה ההבדל בין cluster מקומי לענן מנוהל?**
מקומי: node אחד, חינם, ללמידה, ההנהלה אצלך. מנוהל: הרבה nodes, הספק מנהל את ההנהלה, LoadBalancer עם כתובת ציבורית, images מ-registry, ומשלמים לפי שעה.
