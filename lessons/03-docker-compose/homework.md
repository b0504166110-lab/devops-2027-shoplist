# שיעור 3 — שיעורי בית

**מה צריך:** דפדפן וחשבון GitHub. **לא צריך להתקין כלום בבית.** כותבות באתר של GitHub, ובודקות בכיתה בתחילת שיעור 4.

**זמן משוער:** שעה וחצי, כולל הבוחן.

**מה מגישים, בתיקייה `lessons/03-docker-compose/homework/` ב-fork שלכן:**
- `docker-compose.yml`
- `answers.md`
- `quiz-answers.md`

---

## חלק 1 — Compose ל-greeter (חובה)

בשיעורי הבית הקודמים כתבתן Dockerfile לסרוויס greeter, בתיקייה `lessons/02-docker-basics/homework/greeter/`. עכשיו נריץ אותו עם Compose, ובשתי שפות בבת אחת.

**המשימה:** לכתוב `docker-compose.yml` בתיקייה `lessons/03-docker-compose/homework/`, עם **שני services מאותו Dockerfile**:

| service | הברכה (`GREETING`) | פורט במחשב |
|---|---|---|
| `greeter-he` | `Shalom` | 9001 |
| `greeter-en` | `Hello` | 9002 |

**הדרישות:**
- [ ] שני ה-services נבנים מאותה תיקייה, עם `build: context:`. **הנתיב יחסי למיקום של קובץ ה-compose**, כלומר צריך לעלות שתי תיקיות ולהיכנס ל-`02-docker-basics/homework/greeter`.
- [ ] לכל service משתנה סביבה `GREETING` משלו.
- [ ] לכל service פורט משלו במחשב. **הפורט בתוך ה-container זהה בשניהם.** איזה הוא? (רמז: `app.py` של greeter.)
- [ ] מעל כל service, הערה בעברית שמסבירה מה הוא.

**איך עושים את זה ב-GitHub:**
1. ב-fork שלכן, לנווט ל-`lessons/03-docker-compose/homework/`.
2. **Add file** ואז **Create new file**, בשם `docker-compose.yml`.
3. לכתוב את הקובץ. ב-GitHub אין בדיקת שגיאות, אז לשים לב להזחות: רווחים בלבד, שניים לכל רמה.
4. **Commit changes**, עם ההודעה `homework 3: compose for greeter`.

---

## חלק 2 — שאלות (חובה)

ליצור באותה תיקייה קובץ `answers.md` ולענות:

1. בקובץ שכתבתן יש שני services מאותו image. כמה containers ירוצו? כמה images ייבנו?
2. מה תחזיר הכתובת `http://localhost:9001/hello/Rivka`? ומה `http://localhost:9002/hello/Rivka`?
3. למה אי אפשר לתת לשני ה-services את אותו פורט במחשב, אבל אפשר לתת להם את אותו פורט בתוך ה-container?
4. רוצות להוסיף greeter שלישי בצרפתית (`Bonjour`, פורט 9003). מה בדיוק מוסיפים לקובץ?
5. בקובץ שלכן אין `volumes`. למה greeter לא צריך volume, ו-postgres כן?

---

## חלק 3 — בוחן (חובה, להגשה)

לענות על [quiz.md](quiz.md) ולהגיש בקובץ `quiz-answers.md` באותה תיקייה. ההוראות בראש הבוחן.

---

## בונוס

להוסיף לכל service `healthcheck` שבודק את `/health` של greeter. רמז: ב-image של `python:3.11-slim` אין `curl`, אבל יש Python:

```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
  interval: 10s
```

---

## בתחילת שיעור 4, בכיתה

```shell
cd devops-2027-shoplist
git pull
cd lessons/03-docker-compose/homework
docker compose up -d --build
curl.exe http://localhost:9001/hello/Rivka
curl.exe http://localhost:9002/hello/Rivka
docker compose ps
docker compose down
```

**התוצאה הצפויה:** `Shalom, Rivka!` ו-`Hello, Rivka!`, ושני services ב-`docker compose ps`.

אם ה-build נכשל בשלב ה-`pip install`, צריך להוסיף ל-`pip install` של greeter את הדגלים `--trusted-host pypi.org --trusted-host files.pythonhosted.org`, כמו ב-backend.
