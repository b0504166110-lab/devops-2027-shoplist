# שיעור 5 — שיעורי בית

**מה צריך:** המחשב בבית, עם Docker Desktop. עובדות ב-clone של ה-fork שלכן (אותו clone משיעורי הבית של שיעור 4), כותבות ב-VS Code, ובודקות שהכל עובד לפני ה-push.

**זמן משוער:** שעתיים, כולל הפעלת Kubernetes בבית.

### 0. הכנה (פעם אחת)

1. **ב-GitHub:** ב-fork שלכן, Sync fork, ואז Update branch. ככה מגיעה התיקייה של שיעור 5.
2. **במחשב:**

```shell
cd devops-2027-shoplist
git pull --no-rebase --no-edit
```

3. **להפעיל Kubernetes ב-Docker Desktop**, בדיוק כמו בכיתה (מדריך, חלק 4, שלב 1): גלגל השיניים (Settings) ← Kubernetes ← לסמן Enable Kubernetes ← kubeadm ← Apply & restart. לחכות ל-**Kubernetes running**, לפתוח טרמינל חדש, ולבדוק:

```shell
kubectl config current-context
kubectl get nodes
```

**צפוי:** `docker-desktop`, ו-node אחד במצב `Ready`.

> בפעם הראשונה ההפעלה מורידה כמה images ולוקחת כמה דקות. אם זה תקוע הרבה זמן: Docker Desktop ← Settings ← Resources, ולוודא שיש לפחות 4GB זיכרון.

**מה מגישים, בתיקייה `lessons/05-k8s-cluster/homework/` ב-fork שלכן:**
- `answers.md` (חלקים א ו-ב)
- `greeter-deployment.yml` ו-`greeter-service.yml` (חלק ג)
- `greeter.png`: צילום מסך שמראה ש-greeter רץ ב-cluster (חלק ג)

---

## חלק א — מפת ה-cluster (חובה)

ב-`answers.md`, להעתיק את הטבלה ולמלא את שתי העמודות הריקות. **במילים שלכן**, לא העתקה מהמדריך. האנלוגיה יכולה להיות הקונדיטוריה מהשיעור, או כל דבר אחר שמתאים לכן: בית חולים, בית ספר, חנות.

| רכיב | איפה הוא רץ (הנהלה / כל node) | מה הוא עושה, במשפט אחד | אנלוגיה |
|---|---|---|---|
| API server | | | |
| etcd | | | |
| scheduler | | | |
| controller manager | | | |
| kubelet | | | |
| container runtime | | | |
| kube-proxy | | | |
| coredns | | | |

> **רמז ל-coredns:** ראיתן אותו ב-`kubectl get pods -n kube-system`. איזה רעיון משיעור 4 הוא מממש?

---

## חלק ב — תרחישים (חובה)

באותו `answers.md`. בכל תרחיש: **מה קורה, ומי עושה כל שלב.** 3–5 משפטים.

1. **scale.** רצים 2 pods של Deployment בשם `web`, ומריצות `kubectl scale deployment web --replicas=4`. תארו לפי הסדר מה קורה, מהרגע שלחצתן Enter ועד שיש 4 pods ב-Running. לכל שלב: איזה רכיב פועל?
2. **שלוש בלילה.** ה-container של backend קרס בשלוש בלילה. מה קורה? ומה היה קורה אם מישהי הייתה מוחקת את ה-pod כולו?
3. **node נכבה.** ב-cluster בענן יש 3 nodes, ו-node 2 נכבה. מה קורה ל-pods שרצו עליו? ומה היה קורה ב-cluster של Docker Desktop בכיתה, אם המחשב נכבה?
4. **מהכיתה לענן.** חברה רוצה להעביר את ShopList ל-EKS, עם אותם קבצי YAML שעבדו בכיתה: `imagePullPolicy: Never` ו-Service מסוג `NodePort`. מה לא יעבוד, ולמה? מה צריך לשנות?
5. **pod בודד.** בכיתה יצרתן pod עם `kubectl run`, מחקתן אותו, והוא לא חזר. אבל כשמחקתן pod של `web`, הוא חזר. למה? מה הייתן עושות כדי ש-stats יחזור תמיד?

---

## חלק ג — ה-YAML הראשון: greeter ב-Kubernetes (חובה)

בשיעור 2 כתבתן Dockerfile ל-greeter. עכשיו נכתוב לו שני קבצים ל-Kubernetes. בשיעור 6 נכתוב בדיוק כאלה לכל ShopList, אז זה אימון.

**תזכורת על greeter:** שרת Flask שמאזין ב-**פורט 8000**, קורא את הברכה ממשתנה הסביבה `GREETING`, ועונה ב-`/hello/<שם>`. ה-image נקרא `greeter:v1`.

### קובץ 1: greeter-deployment.yml — ההזמנה הקבועה

ליצור קובץ `lessons/05-k8s-cluster/homework/greeter-deployment.yml`, להעתיק את השלד ולהשלים כל `____`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: greeter
spec:
  replicas: ____
  selector:
    matchLabels:
      app: ____
  template:
    metadata:
      labels:
        app: ____
    spec:
      containers:
        - name: greeter
          image: ____
          imagePullPolicy: Never
          env:
            - name: GREETING
              value: "____"
          ports:
            - containerPort: ____
```

| שורה | מה להשלים | למה |
|---|---|---|
| `apiVersion: apps/v1`, `kind: Deployment` | (מלא) | איזה סוג משאב זה. Deployment שייך לקבוצה `apps` |
| `metadata: name` | (מלא) | השם של ה-Deployment, כמו `web` בהדגמה |
| `replicas` | **2** | כמה עוגות בוויטרינה, תמיד |
| `selector: matchLabels: app` | **greeter** | איך ה-Deployment מזהה את ה-pods **שלו**: כל pod עם התווית `app: greeter` |
| `template` | | **התבנית של כל pod**. כל מה שמתחתיה מתאר pod אחד, וה-Deployment משכפל אותו |
| `template: labels: app` | **בדיוק אותה מילה כמו ב-selector** | המדבקה שכל pod מקבל. אם היא לא תואמת ל-selector, ה-Deployment לא יכיר את ה-pods של עצמו, ו-Kubernetes יסרב לקובץ |
| `image` | ה-image של greeter, עם התג | המתכון. אותו שם כמו ב-`docker build -t` |
| `imagePullPolicy: Never` | (מלא) | להשתמש ב-image שעל המחשב, לא להוריד מהאינטרנט. רק ב-cluster מקומי! |
| `env` | ברכה לבחירתכן | בדיוק כמו `environment:` ב-Compose |
| `containerPort` | הפורט ש-greeter מאזין בו | תיעוד, כמו `EXPOSE` ב-Dockerfile |

### קובץ 2: greeter-service.yml — מספר הטלפון והדלת

ליצור `lessons/05-k8s-cluster/homework/greeter-service.yml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: greeter
spec:
  type: ____
  selector:
    app: ____
  ports:
    - port: 8000
      targetPort: ____
      nodePort: 30090
```

| שורה | מה להשלים | למה |
|---|---|---|
| `apiVersion: v1`, `kind: Service` | (מלא) | Service שייך לקבוצה הבסיסית, ולכן רק `v1` |
| `metadata: name` | (מלא) | **השם הוא הכתובת**: ב-cluster אפשר יהיה לפנות ל-`http://greeter:8000` |
| `type` | הסוג שפותח דלת מהמחשב, בטווח 30000–32767 | בלי זה (ברירת המחדל, ClusterIP) אפשר להגיע רק מתוך ה-cluster |
| `selector: app` | אותה תווית כמו של ה-pods | **ככה ה-Service יודע לאילו pods להעביר שיחות.** לא לפי שם, לפי מדבקה |
| `port` | (מלא) | הפורט של ה-Service עצמו, בתוך ה-cluster |
| `targetPort` | הפורט ש-greeter מאזין בו בתוך ה-container | לאן השיחה מגיעה בסוף |
| `nodePort: 30090` | (מלא) | הדלת מהמחשב: `localhost:30090` |

### טעויות נפוצות

| טעות | מה יקרה |
|---|---|
| Tab במקום רווחים | YAML לא ייקרא. רווחים בלבד, שניים לכל רמה |
| `- name:` לא מיושר מתחת ל-`containers:` | המקף הוא חלק מההזחה: שני רווחים יותר מ-`containers:` |
| תווית שונה ב-selector וב-template | `selector does not match template labels` |
| Service עם selector שלא תואם | ה-Service נוצר, אבל בלי אף pod מאחוריו. הדפדפן לא מקבל תשובה |
| `targetPort: 5000` מהעתקה של backend | greeter מאזין ב-8000 |

### בדיקה: להריץ את greeter ב-cluster

אם אין לכן `greeter:v1`, לבנות אותו קודם:

```shell
docker images greeter
docker build -t greeter:v1 lessons/02-docker-basics/homework/greeter
```

להחיל את שני הקבצים:

```shell
kubectl apply -f lessons/05-k8s-cluster/homework/
kubectl get deployments,pods,services
```

**צפוי:** Deployment בשם `greeter` עם `2/2`, שני pods במצב `Running`, ו-Service מסוג `NodePort` עם `8000:30090/TCP`.

לפתוח בדפדפן `http://localhost:30090/hello/<השם שלכן>`. **צפוי:** הברכה שבחרתן.

ועכשיו הטרמוסטט: למחוק pod אחד של greeter (את השם מעתיקות מ-`kubectl get pods`), ולראות אותו חוזר:

```shell
kubectl delete pod <שם של pod>
kubectl get pods
```

בסוף לנקות:

```shell
kubectl delete -f lessons/05-k8s-cluster/homework/
```

> **שגיאות?** `kubectl apply` כותב באיזה קובץ ובאיזו שורה. `ErrImageNeverPull`: ה-image לא בנוי, או שהשם ב-`image:` לא זהה בדיוק ל-`greeter:v1`. הדף לא נטען: לבדוק ש-`selector` ב-Service תואם לתווית של ה-pods, ושה-`targetPort` הוא 8000.

**צילום מסך:** הדפדפן עם התשובה מ-`localhost:30090`, ולידו הטרמינל עם `kubectl get pods`. לשמור כ-`lessons/05-k8s-cluster/homework/greeter.png`.

**Commit ו-push מהבית:**

```shell
git add lessons/05-k8s-cluster/homework/
git commit -m "homework 5: greeter on kubernetes"
git push
```

> push רק מהמחשב בבית, לא ממחשבי המעבדה.

---

## בונוס

ב-`answers.md`: מה יקרה אם תשני ב-Deployment את `replicas` ל-0 ותריצי `kubectl apply`? האם ה-Service ימשיך להתקיים? מה יקבל הדפדפן?

---

## בתחילת שיעור 6, בכיתה

נעבור יחד על התרחישים מחלק ב, וכמה מכן יראו את greeter רץ. בכיתה: `git pull --no-rebase --no-edit`, כדי שהקבצים שלכן יגיעו גם למחשב בכיתה.
