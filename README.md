# ShopList: קורס DevOps 2027

ברוכות הבאות! בריפו הזה נמצאים כל הקוד וכל החומר של הקורס.

ShopList היא אפליקציה קטנה לניהול רשימת מוצרים. היא מלווה אותנו לאורך כל הקורס. האפליקציה עצמה לא משתנה. מה שמשתנה משיעור לשיעור זו **הדרך שבה מריצים אותה**: Docker, אחר כך Kubernetes, Helm ו-CI/CD, ובסוף פרויקט גמר שמחבר הכל.

```
Browser → frontend (Nginx :80) → backend (Flask :5000) → postgres (PostgreSQL :5432)
                               → stats (Node.js :3000) ───→ backend
```

**מה האפליקציה יודעת לעשות:** להוסיף מוצר עם מחיר, כמות וקטגוריה; לערוך ולמחוק; לסמן מה כבר נקנה; לחפש ולמיין; ולהציג סטטיסטיקה לפי קטגוריה. למעלה בדף יש נורית לכל סרוויס, ירוקה כשהוא עונה ואדומה כשלא.

| סרוויס | כתובות (API) |
|---|---|
| backend | `GET /health`, `GET /categories`, `GET /products`, `POST /products`, `PATCH /products/<id>`, `DELETE /products/<id>` |
| stats | `GET /health`, `GET /stats` |

## לקבל את הקוד: fork ואז clone

כל אחת עובדת על עותק משלה של הריפו, ב-GitHub שלה. ככה אפשר לשמור בו את העבודה, ולהשתמש בו בהמשך הקורס (CI/CD בשיעורים 8–9).

**צריך:** חשבון GitHub. מי שאין לה, נרשמת ב-[github.com/signup](https://github.com/signup).

### 1. fork: עותק של הריפו ב-GitHub שלכן

1. להיכנס לכתובת של הריפו שהמורה נותנת.
2. ללחוץ על הכפתור **Fork**, למעלה מימין.
3. במסך שנפתח, לא לשנות כלום וללחוץ **Create fork**.
4. עכשיו אתן בעמוד של העותק שלכן: למעלה כתוב `<שם-המשתמש-שלכן>/devops-2027-shoplist`, ומתחתיו "forked from ...".

### 2. clone: להוריד את העותק שלכן למחשב

1. בעמוד של **העותק שלכן** (לא של המורה), ללחוץ על הכפתור הירוק **Code**, לבחור **HTTPS**, ולהעתיק את הכתובת.
2. בטרמינל, בתיקייה שבה רוצות לשמור את הקורס:
   ```shell
   git clone https://github.com/<שם-המשתמש-שלכן>/devops-2027-shoplist.git
   cd devops-2027-shoplist
   ```
3. לבדוק שהכתובת היא של העותק שלכן:
   ```shell
   git remote -v
   ```
   צריך להופיע שם המשתמש **שלכן**, לא של המורה.

> **שימו לב:** אם עשיתן clone לכתובת של המורה, אפשר לעבוד, אבל אי אפשר לשמור את העבודה ב-GitHub. כדאי למחוק את התיקייה ולעשות clone מחדש מהעותק שלכן.

### 3. לקבל חומר של שיעור חדש

החומר של כל שיעור עולה לריפו של המורה לקראת השיעור. ה-fork שלכן לא מתעדכן לבד:

1. בעמוד של העותק שלכן ב-GitHub, ללחוץ **Sync fork** ואז **Update branch**.
2. במחשב, מתוך התיקייה `devops-2027-shoplist`:
   ```shell
   git pull
   ```

החומר החדש מגיע לתיקייה `lessons/`, והקבצים שכתבתן בעצמכן נשארים כמו שהם.

## השיעורים

| # | נושא | תיקייה |
|---|---|---|
| 1 | מה זה DevOps, מיקרו-סרוויסים והכרת ShopList | [01-devops-intro](lessons/01-devops-intro/) |
| 2 | Docker: images, containers ו-Dockerfile | [02-docker-basics](lessons/02-docker-basics/) |
| 3 | רשתות, volumes ו-multi-stage: מושגים, והיכרות עם Compose | [03-docker-compose](lessons/03-docker-compose/) |
| 4 | רשתות, volumes ו-Docker Compose לעומק: בונים את ShopList | [04-compose-networks-volumes](lessons/04-compose-networks-volumes/) |
| 5 | Kubernetes: מה זה cluster, ו-cluster מקומי | יעלה בהמשך |
| 6 | Kubernetes: ShopList ב-cluster | יעלה בהמשך |
| 7 | Helm | יעלה בהמשך |
| 8 | CI/CD: מושגים וכתיבת פייפליין | יעלה בהמשך |
| 9 | Registry ו-GitHub Actions | יעלה בהמשך |
| 10 | פרויקט הגמר | יעלה בהמשך |

בכל תיקיית שיעור יש `README.md`, ואחריו מדריך ותרגילים. החומר של כל שיעור עולה לריפו לקראת השיעור.

## מבנה הריפו

בהתחלה יש בריפו רק את הקוד של האפליקציה. את כל השאר כותבות בעצמכן במהלך הקורס.

```
app/
  backend/    Flask (Python): app.py, requirements.txt
  stats/      Node.js: server.js, package.json
  frontend/   HTML, JavaScript ו-CSS
lessons/      חומר הלימוד לפי שיעור
```

מה תוסיפו לאורך הקורס:

| שיעור | מה כותבות |
|---|---|
| 2 | `Dockerfile` ל-backend ול-stats |
| 4 | `Dockerfile` ו-`nginx.conf` ל-frontend, `docker/init.sql` ו-`docker/docker-compose.yml`, ובשיעורי הבית `Dockerfile.multistage` |
| 5–6 | מניפסטים של Kubernetes בתיקייה `kubernetes/` |
| 7 | Helm chart בתיקייה `helm/` |
| 8–9 | פייפליינים: `.gitlab-ci.yml` ו-`.github/workflows/` |

## סביבת העבודה

- Windows עם Docker Desktop, על מחשבי הכיתה.
- הפקודות רצות בטרמינל: PowerShell, Git Bash או WSL, לבחירתכן (ראו למטה).

## איזה טרמינל?

אפשר לעבוד בכל אחד משלושת הטרמינלים. פקודות `docker` ו-`git` זהות בכולם, וההבדלים הם רק בכמה פרטים קטנים:

| | PowerShell | Git Bash | WSL (Ubuntu) |
|---|---|---|---|
| **למי** | ברירת המחדל, קיים בכל Windows | מי שהתרגלה אליו בקורס Git | רק מי שכבר עובדת איתו |
| **לבדוק שרת** | `curl.exe -i <כתובת>` | `curl -i <כתובת>` | `curl -i <כתובת>` |
| **כמה פקודות בשורה** | `;` | `;` או `&&` | `;` או `&&` |
| **התיקייה הנוכחית ב-`-v`** | `${PWD}` | `$(pwd -W)` | `$(pwd)` |
| **`docker exec -it`** | עובד | אם מופיע `the input device is not a TTY`: `winpty docker exec -it ...` | עובד |

**Git Bash, פעם אחת בהתחלה:**
```bash
echo 'export MSYS_NO_PATHCONV=1' >> ~/.bashrc
```
ואז לפתוח Git Bash מחדש. בלי זה Git Bash הופך נתיבים כמו `/app` ל-`C:/Program Files/Git/app`, ופקודות כמו `docker exec stats ls /app` נכשלות.

**WSL:** עובד רק אם ב-Docker Desktop מופעל Settings → Resources → WSL integration להפצה שלכן. לא חובה, ובמחשבי הכיתה עדיף בלי.

## עבודה עם Git בקורס

עובדות רק על `main`: `git add`, `git commit` ו-`git push`. ה-push הולך לעותק שלכן (ה-fork), לא לריפו של המורה.
