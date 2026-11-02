# שיעור 3 — תרגול פקודות Compose

שני חלקים:
- **חלק א, על דף:** לכתוב את הפקודה המתאימה, בלי מחשב. מתאים גם לחזרה בבית.
- **חלק ב, במחשב הכיתה:** תרגיל רצוף על המערכת שבניתן.

כל הפקודות, עם הסברים: [compose-reference.md](compose-reference.md).

---

## חלק א — מה הפקודה? (על דף)

הכל רץ מהתיקייה `docker`.

| # | המשימה |
|---|---|
| 1 | להרים את כל ShopList ברקע |
| 2 | להרים את כל ShopList, ולבנות קודם מחדש את ה-images |
| 3 | לראות אילו services רצים, והאם postgres תקין |
| 4 | לראות בזמן אמת רק את הלוגים של ה-backend |
| 5 | לעצור רק את stats, בלי למחוק אותו |
| 6 | להפעיל שוב את stats |
| 7 | לפתוח טרמינל בתוך ה-service של postgres |
| 8 | לבנות מחדש ולהרים רק את ה-frontend |
| 9 | לבדוק אם יש שגיאה בקובץ ה-YAML |
| 10 | לעצור הכל, **ולשמור** את המוצרים |
| 11 | לעצור הכל, **ולמחוק** את המוצרים |
| 12 | לראות אילו volumes קיימים במחשב |

**ועוד שלוש שאלות על הקובץ:**

13. איך כותבים ב-`docker-compose.yml` שה-frontend יהיה זמין ב-`localhost:9090`?
14. איך כותבים שה-backend יחכה עד ש-postgres תקין?
15. ב-service של stats כתוב `BACKEND_URL: http://backend:5000`. מאיפה מגיע השם `backend`?

---

## חלק ב — תרגיל רצוף (במחשב הכיתה, 20 דקות)

מתוך התיקייה `docker`. אחרי כל שלב יש שאלה: לענות עליה לפני שממשיכות.

**1. להרים ולבדוק.**
```shell
docker compose up -d
docker compose ps
```
> **שאלה:** כמה services רצים? ליד מי מהם כתוב `healthy`, ולמה רק לידו?

**2. השמות של ה-containers.**
```shell
docker ps --format "{{.Names}}"
```
> **שאלה:** מה ההבדל בין השם כאן לשם ה-service בקובץ? באיזה שם משתמשים ב-`docker compose logs`?

**3. הרשת.**
```shell
docker network ls
docker compose exec stats wget -qO- http://backend:5000/health
```
> **שאלה:** איזו רשת Compose יצר? ולמה `http://backend:5000` עובד מתוך stats, אבל לא מהדפדפן שלכן?

**4. ה-volume.**
```shell
docker volume ls
```
> **שאלה:** מה שם ה-volume? (רמז: שם התיקייה, קו תחתון, ושם ה-volume מהקובץ.)

**5. לוגים של service אחד.**
```shell
docker compose logs -f backend
```
להוסיף מוצר בדפדפן ולראות את הבקשה בלוג. לצאת עם Ctrl+C.

בלוג יופיעו גם בקשות שלא אתן שלחתן: `GET /health` כל 10 שניות, מהנוריות שבראש הדף, ו-`GET /products` מ-stats, שמבקש את הרשימה כדי לחשב סטטיסטיקה.
> **שאלה:** איזה נתיב רואים בלוג של ה-backend: `/api/products` או `/products`? למה? ומי עוד שולח בקשות ל-backend, חוץ מהדפדפן?

**6. להפיל ולהקים.**
```shell
docker compose stop backend
```
לרענן את הדפדפן, ולחכות כמה שניות.
```shell
docker compose start backend
```
> **שאלה:** מה הדפדפן הראה כשה-backend היה עצור? איזו נורית האדימה? ולמה גם תיבת ה-Stats הפסיקה לעבוד, אם stats עצמו לא נעצר?

**7. ניקיון בלי לאבד נתונים.**
```shell
docker compose down
docker volume ls
docker compose up -d
```
> **שאלה:** ה-volume נשאר אחרי `down`? המוצרים עדיין בדפדפן?

**8. לסיום.**
```shell
docker compose down
```

> **שימו לב:** הפרק הזה לא מוחק נתונים. את `down -v` עשיתן במדריך, וזה מספיק.
