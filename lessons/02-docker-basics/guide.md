# שיעור 2 — Docker: images, containers ו-Dockerfile
## מדריך לסטודנטית

---

## מה יהיה בסוף השיעור

| קובץ | חדש? | מה הוא עושה |
|---|---|---|
| `app/backend/Dockerfile` | כותבות היום | אורז את ה-backend (Python) ל-image |
| `app/stats/Dockerfile` | כותבות היום | אורז את ה-stats (Node.js) ל-image |

**images שיהיו לכן במחשב:** `shoplist-backend:local`, `shoplist-stats:local`

**מה עוד לא קיים:**
- אין `docker-compose.yml`, ולכן ShopList עוד לא רצה במלואה. זה שיעור 3.
- אין Dockerfile ל-frontend. גם זה שיעור 3.

**מה תדעו לעשות:**
- להסביר מה ההבדל בין image ל-container
- להריץ container מ-image מוכן ולחבר אליו פורט
- לכתוב Dockerfile, לבנות ממנו image ולהבין את ה-cache
- להריץ container מ-image שבניתן בעצמכן

---

## לפני שמתחילות

- [ ] Docker Desktop פתוח ורץ. בודקות בטרמינל: `docker version`
- [ ] `docker run hello-world` עובד
- [ ] Git מותקן: `git --version`

> **טרמינל:** PowerShell, Git Bash או WSL, מה שנוח לכן. ההבדלים הקטנים בטבלה "איזה טרמינל?" ב-[README הראשי](../../README.md#איזה-טרמינל). בדוגמאות כתוב `curl.exe`, שעובד גם ב-PowerShell וגם ב-Git Bash.

---

## חלק 1 — מושגים

### container

**מה זה:** האפליקציה ארוזה יחד עם כל מה שהיא צריכה כדי לרוץ: שפה, גרסה, ספריות והגדרות.

**למה צריך את זה:** כדי ש"עובד אצלי" יהפוך ל"עובד בכל מקום". במקום להתקין Python ו-Node על כל מחשב ושרת, אורזים כל סרוויס פעם אחת.

**איך זה עובד:** container משתף את ה-kernel של המחשב, ולכן הוא קל ומהיר בהרבה ממכונה וירטואלית.

| | מכונה וירטואלית | container |
|---|---|---|
| מערכת הפעלה | מלאה, לכל אפליקציה | משותפת (kernel) |
| גודל | ג'יגה-בייטים | מגה-בייטים |
| זמן עלייה | דקות | שניות |

> **טעות נפוצה:** לחשוב ש-container הוא "מכונה וירטואלית קטנה". אין לו מערכת הפעלה משלו. הוא תהליך מבודד שרץ על ה-kernel של המחשב.

### image מול container: מתכון ועוגה

**מה זה:** **image** הוא מתכון: סטטי ולקריאה בלבד. **container** הוא עוגה שאפו לפי המתכון: תהליך שרץ.

**למה זה חשוב:** מאותו image אפשר להריץ הרבה containers. מחיקת container לא מוחקת את ה-image.

> **טעות נפוצה:** למחוק container ולחשוב שה-image נמחק. אכלנו עוגה, והמתכון עדיין בספר.

### Dockerfile

**מה זה:** קובץ טקסט עם הוראות לבניית image.

**איך זה עובד:**
```
Dockerfile  →  docker build  →  image  →  docker run  →  container
```

### layer caching

**מה זה:** כל הוראה ב-Dockerfile יוצרת שכבה, ו-Docker זוכר שכבות.

**איך זה עובד:** אם שכבה לא השתנתה מאז ה-build הקודם, Docker לוקח אותה מהזיכרון (`CACHED`). שכבה שהשתנתה, **וכל מה שאחריה**, נבנים מחדש.

> **טעות נפוצה:** להעתיק את הקוד לפני התקנת התלויות. אז כל שינוי קטן בקוד מפעיל את ההתקנה מחדש, וכל build לוקח דקות.

---

## חלק 2 — שלב אחר שלב

### שלב 0 — לקבל את הקוד

אם עשיתן fork ו-clone בשיעור 1, הריפו כבר במחשב. צריך רק לעדכן אותו, בשני צעדים:

1. **ב-GitHub:** בעמוד של העותק שלכן, ללחוץ **Sync fork** ואז **Update branch**. בלי זה, העותק שלכן לא יודע על חומר חדש שעלה לריפו של המורה.
2. **במחשב:**

```shell
cd devops-2027-shoplist
git pull
```

אם עוד לא: לעשות fork ואז clone לפי ההוראות ב-[README הראשי](../../README.md#לקבל-את-הקוד-fork-ואז-clone).

מה יש בריפו:
```
app/
  backend/    app.py, requirements.txt
  stats/      server.js, package.json
  frontend/   index.html, app.js, style.css
lessons/
```

**מכאן והלאה, כל הפקודות רצות מהתיקייה `devops-2027-shoplist`.**

---

### שלב 1 — container ראשון (בהרצאה)

לפני שבונות image משלנו, מריצות image שמישהו אחר בנה: Nginx מ-Docker Hub.

```shell
docker run -d -p 8080:80 --name web nginx:1.30-alpine
```

לפתוח בדפדפן: `http://localhost:8080`. אמור להופיע דף הפתיחה של Nginx.

```shell
docker ps            # אילו containers רצים
docker logs web      # מה Nginx הדפיס. לרענן את הדפדפן ולהריץ שוב
docker rm -f web     # לעצור ולמחוק את ה-container
docker images        # ה-image עדיין כאן
```

| חלק | משמעות |
|---|---|
| `-d` | להריץ ברקע |
| `-p 8080:80` | פורט 8080 במחשב שלך, מחובר לפורט 80 בתוך ה-container |
| `--name web` | שם ל-container, כדי לא להעתיק ID ארוך |
| `nginx:1.30-alpine` | שם ה-image והגרסה שלו |

---

### שלב 2 — להכיר את הקוד של ה-backend

הקובץ `app/backend/app.py` כבר קיים. לא כותבות אותו, רק קוראות ומבינות שלושה דברים:

```python
def get_db():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
    )
```
**1. סיסמאות לא בקוד.** הקוד קורא אותן ממשתני סביבה (`os.environ`). Git זוכר הכול לנצח, ולכן סיסמה שנכנסה לקוד נשארת בהיסטוריה.

```python
@app.route('/health')
def health():
    return jsonify({'status': 'ok'})
```
**2. כתובת `/health`.** עונה "אני חי" בלי לגעת במסד הנתונים. בשיעורים הבאים Docker ו-Kubernetes ישתמשו בה כדי לבדוק שהסרוויס תקין.

```python
app.run(host='0.0.0.0', port=5000)
```
**3. `0.0.0.0` ולא `localhost`.** בתוך container, `localhost` הוא ה-container עצמו. שרת שמאזין רק ל-`localhost` לא יקבל בקשות מבחוץ.

ובנוסף, ב-`app/backend/requirements.txt` כל ספרייה מופיעה עם גרסה מדויקת (`flask==3.0.3`), כדי שכל build ייתן אותה תוצאה.

---

### שלב 3 — לכתוב Dockerfile ל-backend

ליצור את הקובץ `app/backend/Dockerfile` (בלי סיומת):

> **ב-Notepad:** בחלון השמירה לבחור "Save as type: **All files**" ולכתוב את השם `Dockerfile`. אחרת Notepad שומר `Dockerfile.txt`, ו-`docker build` לא ימצא אותו. לבדוק עם `dir app\backend` (PowerShell) או `ls app/backend` (Git Bash). אם VS Code מותקן, עדיף לעבוד בו.

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

| שורה | מה היא עושה |
|---|---|
| `FROM python:3.11-slim` | image בסיס: Python 3.11 מוכן, בגרסה קטנה |
| `WORKDIR /app` | תיקיית העבודה בתוך ה-container. נוצרת אם לא קיימת |
| `COPY requirements.txt .` | **קודם** רק רשימת התלויות |
| `RUN pip install ...` | מתקינים את התלויות. השכבה נשמרת ב-cache |
| `COPY app.py .` | **רק עכשיו** הקוד |
| `EXPOSE 5000` | תיעוד בלבד. **לא פותח את הפורט** |
| `CMD ["python", "app.py"]` | מה רץ כשה-container עולה |

> **ברשת של נטפרי:** `pip install` בתוך ה-build נכשל עם שגיאת SSL (`CERTIFICATE_VERIFY_FAILED`), כי נטפרי בודק את התעבורה, וה-container לא מכיר את התעודה שלו. הפתרון: להגיד ל-pip לסמוך על השרתים שמהם הוא מוריד ספריות. משנים את שורת ה-`pip install`:
>
> ```dockerfile
> RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
> ```
>
> `pypi.org` ו-`files.pythonhosted.org` הם השרתים של PyPI, המאגר של ספריות Python. בלי נטפרי, לא צריך את הדגלים.

---

### שלב 4 — לבנות את ה-image ולראות את ה-cache

```shell
docker build -t shoplist-backend:local app/backend
```

- `-t shoplist-backend:local`: שם ה-image ותגית.
- `app/backend`: התיקייה שבה נמצא ה-Dockerfile.

ה-build הראשון לוקח קצת זמן, כי Docker מוריד את `python:3.11-slim` ומתקין את הספריות.

**עכשיו לראות את ה-cache:**
1. לפתוח את `app/backend/app.py` ולהוסיף רווח איפשהו, ולשמור.
2. לבנות שוב, עם אותה פקודה.
3. ליד שורת ה-`pip install` כתוב עכשיו `CACHED`, וה-build לוקח שניות.

```shell
docker images shoplist-backend      # ה-image שבנית
docker history shoplist-backend:local    # השכבות של ה-image
```

---

### שלב 5 — Dockerfile שני: stats ב-Node.js

לסרוויס ה-stats יש סביבה אחרת לגמרי. הקוד כבר קיים ב-`app/stats/server.js`. שימו לב שגם בו יש `0.0.0.0` ו-`/health`.

ליצור את `app/stats/Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package.json .
COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
```

אין שורת `RUN`: לסרוויס אין ספריות חיצוניות, ולכן אין מה להתקין. ה-build מהיר מאוד, וגם לא צריך את הדגלים של נטפרי.

**ולמה בכל זאת מעתיקים את `package.json`?** זה כרטיס הזהות של פרויקט Node.js: השם, הגרסה ופקודת ההפעלה. היום אין בו תלויות, אבל ברגע שיתווספו, יהיה צריך להוסיף אחריו `RUN npm install`, בדיוק כמו `requirements.txt` ב-backend. כך ה-Dockerfile כבר מוכן לזה.

```shell
docker build -t shoplist-stats:local app/stats
docker images --filter "reference=shoplist-*"
```

| | backend | stats |
|---|---|---|
| image בסיס | `python:3.11-slim` | `node:24-alpine` |
| ספריות | Flask, psycopg2 | אין |
| פורט | 5000 | 3000 |
| הפעלה | `python app.py` | `node server.js` |

**על המחשב שלכן לא מותקן Python 3.11 ולא Node 24, ושני ה-images נבנו.** זה בדיוק מה ש-Docker פותר.

---

### שלב 6 — להריץ כל סרוויס לבד

**קודם ה-backend:**

```shell
docker run -d -p 5000:5000 --name backend shoplist-backend:local
docker logs backend
curl.exe -i http://localhost:5000/health
curl.exe -i http://localhost:5000/products
docker rm -f backend
```

| כתובת | תשובה | למה |
|---|---|---|
| `/health` | `200 OK` | ה-image שבניתן עובד: Python, Flask והקוד, הכל בפנים |
| `/products` | `500 Internal Server Error` | הקוד מחפש את `DB_HOST` במשתני הסביבה, ואין לו. וגם אין מסד נתונים |

> בלוגים תופיע השורה `WARNING: This is a development server`. זה תקין: Flask מזכיר שהשרת המובנה שלו לא מיועד לייצור. לקורס הוא מתאים.

**ועכשיו stats:**

```shell
docker run -d -p 3000:3000 --name stats shoplist-stats:local
docker logs stats
curl.exe -i http://localhost:3000/health
curl.exe -i http://localhost:3000/stats
docker rm -f stats
```

| כתובת | תשובה | למה |
|---|---|---|
| `/health` | `200 OK` | הסרוויס עצמו תקין |
| `/stats` | `502 Bad Gateway` | stats מבקש נתונים מה-backend, וה-backend לא רץ |

> **קודם הלוג, אחר כך הבדיקה.** אם `docker logs` עוד לא מראה `stats service listening on 0.0.0.0:3000`, השרת עוד לא עלה, ו-`curl` יחזיר `Connection reset` או `connection refused`. מחכות שנייה ומריצות שוב את `docker logs`.

> **שימו לב:** אחרי `docker rm`, גם הלוגים נמחקים. `docker logs stats` יחזיר `No such container`. מי שצריכה את הלוג, קוראת אותו לפני שמוחקת.

שני הסרוויסים רצים, ושניהם נכשלים בדיוק באותה נקודה: הם צריכים מישהו אחר. כדי ש-`/stats` יעבוד צריך backend, וכדי ש-`/products` יעבוד צריך מסד נתונים ומשתני סביבה. להריץ כמה containers שמדברים זה עם זה זה בדיוק התפקיד של **Docker Compose**, בשיעור 3.

---

### לשמור את העבודה

```shell
git add .
git commit -m "feat: add Dockerfiles for backend and stats"
```

ה-commit נשמר במחשב. העלאה ל-GitHub (`push`) נלמד בהמשך הקורס.

---

## שאלות לראיון עבודה

**1. מה ההבדל בין image ל-container?**
image הוא תבנית סטטית לקריאה בלבד. container הוא מופע רץ שלה. מ-image אחד אפשר להריץ הרבה containers.

**2. מה ההבדל בין `EXPOSE` ב-Dockerfile לבין `-p` ב-`docker run`?**
`EXPOSE` רק מתעד באיזה פורט האפליקציה מאזינה. `-p` באמת מחבר פורט במחשב לפורט ב-container.

**3. למה מעתיקים את `requirements.txt` לפני הקוד?**
בגלל layer caching. כל עוד רשימת התלויות לא השתנתה, ההתקנה נלקחת מה-cache, ושינוי בקוד בונה רק את השכבה האחרונה.

**4. למה שרת בתוך container מאזין ל-`0.0.0.0` ולא ל-`localhost`?**
בתוך container, `localhost` הוא ה-container עצמו. `0.0.0.0` מאזין לכל הכתובות, ולכן בקשות מבחוץ מגיעות אליו.

**5. ל-backend ול-stats יש images בסיס שונים. למה זו לא בעיה?**
כל container ארוז עם הסביבה שלו. שניהם רצים על אותו מחשב, בלי להתקין Python או Node.

---

## קבצי עזר

- [docker-commands.md](docker-commands.md): כל הפקודות של Docker, עם הסברים ודוגמאות
- [dockerfile-reference.md](dockerfile-reference.md): כל ההוראות של Dockerfile
- [commands-practice.md](commands-practice.md): תרגול פקודות, על דף ובמחשב
- [quiz.md](quiz.md): בוחן להגשה על שיעורים 1 ו-2
- [homework.md](homework.md): שיעורי הבית
