# שיעור 3: Docker Compose, Nginx ושמירת נתונים

> **שימו לב:** בשיעור 3 למדנו את המושגים (רשתות, volumes, multi-stage) והכרנו את קובץ ה-Compose. **את הקבצים כותבות ומריצות בשיעור 4**, יחד בכיתה. החומר כאן הוא לקריאה וחזרה. **שיעורי הבית והבוחן של שיעור 3 לא להגשה.** שיעורי הבית הבאים: [שיעור 4](../04-compose-networks-volumes/).

## מה לומדות בשיעור

- Nginx כ-reverse proxy: כתובת אחת לדפדפן, וכל בקשה לסרוויס הנכון
- Dockerfile ל-frontend
- Docker Compose: כל ארבעת הסרוויסים בקובץ אחד ובפקודה אחת
- איך סרוויסים מוצאים זה את זה לפי השם
- volumes, ומה עושה `down -v`
- healthcheck: לחכות שמסד הנתונים באמת מוכן
- multi-stage build: image סופי קטן, בלי כלי הבנייה (תרגול בשיעורי הבית של שיעור 4)

## התרגילים

1. מה קורה ל-frontend לבד?
2. להציץ למסד הנתונים עם `psql`
3. בלי healthcheck
4. סיסמאות מחוץ לקובץ, עם `.env`
5. בונוס: מוצר אחד לפי מספר
6. תרגול פקודות: [commands-practice.md](commands-practice.md)

## שיעורי בית

לא להגשה. שיעורי הבית הבאים הם של [שיעור 4](../04-compose-networks-volumes/homework.md).

## הקבצים בתיקייה

| קובץ | מה יש בו |
|---|---|
| [guide.md](guide.md) | מדריך שלב אחר שלב |
| [exercises.md](exercises.md) | תרגילים |
| [compose-reference.md](compose-reference.md) | מדריך עזר: פקודות Compose, YAML ו-nginx.conf |
| [commands-practice.md](commands-practice.md) | תרגול פקודות: על דף ובמחשב |
| [quiz.md](quiz.md) | **בוחן להגשה** על שיעור 3 |
| [homework.md](homework.md) | **שיעורי בית** |
