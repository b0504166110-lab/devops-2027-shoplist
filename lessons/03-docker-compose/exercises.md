# שיעור 3 — תרגילים
## Docker Compose, Nginx ו-volumes

**הנחיות:**
- לפתור לפי הסדר
- להסתכל במדריך רק אם נתקעתן
- לבדוק כל תרגיל לפני שעוברים לבא
- הפקודות רצות בטרמינל שבחרתן, **מתוך התיקייה `docker`**, אלא אם כתוב אחרת

---

## תרגיל 1 — מה קורה ל-frontend לבד? (קל)

**המשימה:**
1. מהתיקייה הראשית של הריפו, להריץ את ה-frontend בלי Compose:
   `docker run -d -p 8081:80 --name front-alone shoplist-frontend:local`
2. להריץ `docker ps -a --filter name=front-alone`. מה הסטטוס?
3. לקרוא את הלוג: `docker logs front-alone`
4. לנקות: `docker rm -f front-alone`

**מה רואים כאן:**
ה-container נפל מיד. בלוג כתוב `host not found in upstream "stats"`. Nginx מחפש את השמות `stats` ו-`backend` כבר בהפעלה, והשמות האלה קיימים רק בתוך הרשת של Compose. אותו image, בתוך Compose, עובד מצוין.

**שאלה:** למה ה-502 של stats בשיעור 2 וה-crash הזה הם בעצם אותה בעיה?

---

## תרגיל 2 — להציץ למסד הנתונים (בינוני)

**המשימה:**
1. להרים את המערכת: `docker compose up -d`
2. להוסיף בדפדפן שלושה מוצרים.
3. להיכנס ל-postgres ולשאול אותו ישירות:
   ```shell
   docker compose exec postgres psql -U shopuser -d shoplist -c "SELECT * FROM products;"
   ```
4. לסמן מוצר אחד כנקנה, ולמחוק מוצר אחר. להריץ שוב את הפקודה.

**מה רואים כאן:**
`docker compose exec` מריץ פקודה בתוך service שרץ, כמו `docker exec` משיעור 2, רק לפי שם ה-service. `psql` הוא הכלי של PostgreSQL, והוא כבר בתוך ה-image. הנתונים שהוספתן בדפדפן עברו דרך Nginx, ה-backend, ועד הטבלה.

> **ב-Git Bash:** אם מופיע `the input device is not a TTY`, להוסיף `winpty` בהתחלה, או להוסיף `-T` אחרי `exec`.

**בדיקה:** שלוש שורות בטבלה. אחרי השינויים: שתי שורות, ובאחת מהן `bought` הוא `t` (true).

---

## תרגיל 3 — בלי healthcheck (בינוני)

**המשימה:**
1. `docker compose down -v`, כדי להתחיל ממסד נתונים ריק.
2. ב-`docker-compose.yml`, למחוק את כל הבלוק `healthcheck:` של postgres, ולשנות את `condition: service_healthy` ל-`condition: service_started`.
3. `docker compose up -d`, ומיד אחרי זה: `docker compose logs backend`
4. לפתוח את `http://localhost:8080` מהר, תוך שניות מה-`up`.
5. להחזיר את הקובץ לגרסה המקורית: `git checkout docker-compose.yml` (עובד אם עשיתן commit בשלב 8 של המדריך. אחרת, להחזיר את השורות ידנית)

**מה רואים כאן:**
ה-backend עולה לפני ש-postgres מוכן. בקשות בשניות הראשונות נכשלות עם שגיאת חיבור בלוג (`connection refused` או `the database system is starting up`). עם ה-healthcheck, ה-backend מחכה, והבעיה לא קורה.

> לפעמים המחשב מהיר מספיק ולא רואים שגיאה. זה בדיוק הסיכון: זה עובד אצלי, ונכשל בשרת.

---

## תרגיל 4 — סיסמאות מחוץ לקובץ (בינוני)

**הבעיה:** הסיסמה `shoppass` כתובה ב-`docker-compose.yml`, והקובץ נכנס ל-Git. זה בדיוק מה שלמדנו לא לעשות בשיעור 2.

**המשימה:**
1. ליצור בתיקייה `docker` קובץ בשם `.env`:
   ```
   POSTGRES_PASSWORD=shoppass
   ```
2. ב-`docker-compose.yml`, להחליף את **שני** המקומות שבהם כתוב `shoppass` ב-`${POSTGRES_PASSWORD}`:
   ```yaml
   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
   ```
   ```yaml
   DB_PASSWORD: ${POSTGRES_PASSWORD}
   ```
3. לבדוק מה Compose רואה: `docker compose config`. הסיסמה מופיעה במקום המשתנה.
4. `docker compose up -d` ולבדוק שהכל עובד.
5. לבדוק ש-Git לא רואה את `.env`: `git status`. אם הוא מופיע, להוסיף שורה `.env` לקובץ `.gitignore` בתיקייה הראשית.

**מה רואים כאן:**
Compose קורא אוטומטית קובץ בשם `.env` מאותה תיקייה, ומחליף כל `${...}` בערך שלו. הקובץ עם הסיסמה נשאר במחשב, והקובץ שנכנס ל-Git מכיל רק את שם המשתנה.

> **ב-Notepad:** לשמור עם "All files", בשם `.env` בדיוק. Notepad נוטה לשמור `.env.txt`.

---

## תרגיל בונוס — מוצר אחד לפי מספר (רשות)

**המשימה:**
להוסיף ל-`app/backend/app.py` כתובת חדשה:

```
GET /products/<id>   →  מחזיר מוצר אחד כ-JSON
                     →  מחזיר 404 עם {"error": "not found"} אם אין כזה
```

**רמז:** להעתיק את `get_products` ולשנות אותה. בקוד כבר יש `COLUMNS` (רשימת העמודות) ו-`to_json` (הופכת שורה ל-JSON). השאילתה: `SELECT ... FROM products WHERE id = %s`, ו-`cur.fetchone()` מחזיר שורה אחת, או `None` אם אין.

ואז, מהתיקייה `docker`:

```shell
docker compose up -d --build backend
curl.exe -i http://localhost:8080/api/products/1
curl.exe -i http://localhost:8080/api/products/9999
```

**מה רואים כאן:** `--build backend` בונה מחדש רק את ה-backend. בזכות ה-cache משיעור 2, זה לוקח שניות. שאר הסרוויסים לא נגעו.

> **קיבלתן `502 Bad Gateway`?** ה-backend נוצר מחדש, ולפעמים הוא מקבל כתובת חדשה ברשת. Nginx זוכר את הכתובת הישנה מהרגע שהוא עלה. הפתרון: `docker compose restart frontend`, ואז שוב `curl`.
