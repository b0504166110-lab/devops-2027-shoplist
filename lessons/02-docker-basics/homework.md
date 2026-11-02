# שיעור 2 — שיעורי בית

**מה צריך:** דפדפן וחשבון GitHub. **לא צריך להתקין כלום בבית.** כותבות ישירות באתר של GitHub, ובודקות בכיתה בתחילת שיעור 3.

**זמן משוער:** שעה וחצי, כולל הבוחן.

**מה מגישים, בתיקייה `lessons/02-docker-basics/homework/` ב-fork שלכן:**
- `greeter/Dockerfile`
- `greeter/answers.md`
- `quiz-answers.md`

---

## חלק 1 — Dockerfile לסרוויס חדש (חובה)

בתיקייה `lessons/02-docker-basics/homework/greeter/` יש סרוויס קטן ב-Python בשם **greeter**:

| קובץ | מה יש בו |
|---|---|
| `app.py` | שרת Flask עם שתי כתובות: `/health` ו-`/hello/<name>` |
| `requirements.txt` | ספרייה אחת: `flask==3.0.3` |

**לפני שכותבות, לקרוא את `app.py` ולענות לעצמכן:**
- על איזה פורט השרת מאזין?
- מאיזה משתנה סביבה הוא קורא את הברכה, ומה ברירת המחדל?
- האם הוא מאזין ל-`0.0.0.0` או ל-`localhost`?

**המשימה:** לכתוב `Dockerfile` לסרוויס, באותה תיקייה.

**איך עושים את זה ב-GitHub, בלי מחשב עם Docker:**
1. להיכנס ל-**fork שלכן** ב-GitHub, ולנווט לתיקייה `lessons/02-docker-basics/homework/greeter/`.
2. ללחוץ **Add file** ואז **Create new file**.
3. שם הקובץ: `Dockerfile`, בלי סיומת.
4. לכתוב את ה-Dockerfile.
5. למטה ללחוץ **Commit changes**. בהודעה לכתוב למשל `homework: Dockerfile for greeter`.

**הדרישות:**
- [ ] image בסיס של Python עם גרסה מדויקת (לא `latest`).
- [ ] התלויות מותקנות **לפני** שהקוד מועתק, כדי שה-cache יעבוד.
- [ ] `EXPOSE` עם הפורט הנכון.
- [ ] `CMD` בצורת exec, כלומר עם סוגריים מרובעים.
- [ ] **מעל כל שורה, הערה בעברית** שמסבירה מה היא עושה. הערה ב-Dockerfile מתחילה ב-`#`.

> **ברשת של נטפרי:** אם ה-`pip install` נכשל, מוסיפים לו את הדגלים `--trusted-host pypi.org --trusted-host files.pythonhosted.org`, כמו ב-backend.

---

## חלק 2 — לחשוב על הפקודות (חובה)

ליצור באותה תיקייה קובץ בשם `answers.md` (Add file, Create new file), ולכתוב בו את התשובות:

1. איזו פקודה תבנה מה-Dockerfile שלכן image בשם `greeter` עם התגית `v1`? (מהתיקייה הראשית של הריפו.)
2. איזו פקודה תריץ אותו ברקע, בשם `greeter`, כך שבדפדפן נגיע אליו דרך `http://localhost:9000`?
3. מה צריך להוסיף לפקודה משאלה 2 כדי שהברכה תהיה `Shalom` במקום `Hello`?
4. מה תחזיר הכתובת `http://localhost:9000/hello/Rivka` אחרי השינוי משאלה 3?
5. שיניתן שורה ב-`app.py` ובניתן שוב. אילו שלבים ב-build יסומנו `CACHED`, ואילו ירוצו מחדש? למה?

---

## חלק 3 — בוחן (חובה, להגשה)

לענות על [quiz.md](quiz.md) ולהגיש בקובץ `quiz-answers.md` באותה תיקייה. ההוראות בראש הבוחן.

---

## בונוס

ליצור בתיקייה גם קובץ `.dockerignore`, שמונע מ-Docker להעתיק לתוך ה-image קבצים מיותרים: `__pycache__/`, `*.pyc` ו-`answers.md`.

---

## בתחילת שיעור 3, בכיתה

```shell
cd devops-2027-shoplist
git pull                      # מביא למחשב את מה שכתבתן ב-GitHub
docker build -t greeter:v1 lessons/02-docker-basics/homework/greeter
docker run -d -p 9000:8000 --name greeter -e GREETING=Shalom greeter:v1
curl.exe http://localhost:9000/hello/Rivka
docker rm -f greeter
```

**התוצאה הצפויה:** `{"message":"Shalom, Rivka!"}`

אם ה-build נכשל בשלב ה-`pip install`, להוסיף ל-`pip install` את הדגלים `--trusted-host pypi.org --trusted-host files.pythonhosted.org`, בדיוק כמו ב-backend.
