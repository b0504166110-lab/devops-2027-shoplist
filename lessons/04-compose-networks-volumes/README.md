# שיעור 4: רשתות, volumes ו-Docker Compose לעומק

## מה לומדות בשיעור

- למה בתוך container, `localhost` הוא ה-container עצמו
- `ports`: דלת מהמחשב לתוך container, ומתי לא צריך אותה
- סוגי רשתות ב-Docker, ולמה ברשת שיוצרים "השם הוא הכתובת"
- שלושה סוגי volumes: named volume, bind mount ו-tmpfs, ומתי משתמשים בכל אחד
- כותבות יחד: Dockerfile ל-stats ול-frontend, `nginx.conf`, `init.sql` ו-`docker-compose.yml`
- `stop`, `down` ו-`down -v`: מה נשאר ומה נמחק

## התרגילים בשיעור

1. שני containers, ספר טלפונים אחד (רשתות, 7 דקות)
2. בונים יחד את ShopList ומריצים עם Compose (20 דקות)

## שיעורי בית

[homework.md](homework.md): **מסמך דרישות.** לסיים בבית את כל מה שלא הספקנו: Dockerfiles לשלושת הסרוויסים, `nginx.conf`, `init.sql` ו-`docker-compose.yml`, להריץ את ShopList ב-Docker Compose, ולהוסיף Dockerfile ב-multi-stage ל-frontend. הגשה ב-push, לפני שיעור 5.

## הקבצים בתיקייה

| קובץ | מה יש בו |
|---|---|
| [guide.md](guide.md) | מדריך: מושגים, הדגמות, ושלב אחר שלב |
| [homework.md](homework.md) | **שיעורי בית** |
