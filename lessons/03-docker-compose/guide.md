# שיעור 3 — Docker Compose: כל ShopList בפקודה אחת
## מדריך לסטודנטית

---

## מה יהיה בסוף השיעור

| קובץ | חדש? | מה הוא עושה |
|---|---|---|
| `app/frontend/nginx.conf` | כותבות היום | ההגדרות של Nginx: מגיש את הדף, ומעביר בקשות API לסרוויסים |
| `app/frontend/Dockerfile` | כותבות היום | אורז את ה-frontend ל-image |
| `docker/init.sql` | כותבות היום | יוצר את טבלת המוצרים במסד הנתונים |
| `docker/docker-compose.yml` | כותבות היום | מגדיר את כל ארבעת הסרוויסים ומריץ אותם יחד |
| `app/backend/Dockerfile`, `app/stats/Dockerfile` | משיעור 2 | ממשיכים להשתמש בהם |

**מה תדעו לעשות:**
- להסביר מה זה reverse proxy, ולמה הדפדפן מדבר רק עם Nginx
- לכתוב קובץ `docker-compose.yml` ולהריץ איתו מערכת שלמה
- להסביר איך סרוויסים מוצאים זה את זה לפי השם
- לשמור נתונים עם volume, ולהבין מה עושה `down -v`

**בסוף השיעור:** ShopList רצה במלואה ב-`http://localhost:8080`. מוסיפות מוצרים, רואות סטטיסטיקות, והנתונים נשמרים גם אחרי הפעלה מחדש.

---

## לפני שמתחילות

- [ ] Docker Desktop פתוח ורץ
- [ ] יש לכן את שני ה-images משיעור 2: `docker images --filter "reference=shoplist-*"`
- [ ] ה-Dockerfiles משיעור 2 נמצאים ב-`app/backend` וב-`app/stats`

> **טרמינל:** PowerShell, Git Bash או WSL, מה שנוח לכן. ההבדלים הקטנים בטבלה "איזה טרמינל?" ב-[README הראשי](../../README.md#איזה-טרמינל).

---

## חלק 1 — מושגים

### reverse proxy

**מה זה:** שרת שעומד בכניסה למערכת, מקבל את כל הבקשות, ומעביר כל אחת לסרוויס הנכון.

**למה צריך את זה:** בשיעור 2 כל סרוויס ישב על פורט אחר: 5000, 3000. משתמשת אמיתית לא אמורה לדעת את זה. היא פותחת כתובת אחת, ו-Nginx מחליט לאן כל בקשה הולכת.

**איך זה עובד ב-ShopList:**

| הבקשה מהדפדפן | לאן Nginx מעביר |
|---|---|
| `/` (הדף, הקבצים) | מגיש בעצמו את `index.html`, `app.js`, `style.css` |
| `/api/stats` | ל-`stats:3000/stats` |
| `/api/products` | ל-`backend:5000/products` |

> **טעות נפוצה:** לחשוב שהדפדפן מדבר עם ה-backend. הוא לא. הוא מדבר רק עם Nginx, ו-Nginx מדבר עם ה-backend בתוך הרשת של Docker.

### Docker Compose

**מה זה:** כלי שמריץ כמה containers יחד, לפי קובץ אחד: `docker-compose.yml`.

**למה צריך את זה:** בשיעור 2 הרצנו כל container בפקודת `docker run` ארוכה. ל-ShopList צריך ארבעה containers, כל אחד עם הגדרות משלו, בסדר הנכון, ומחוברים זה לזה. Compose כותב את כל זה בקובץ, ומריץ הכל בפקודה אחת: `docker compose up`.

**איך זה עובד:** בקובץ יש רשימה של **services**. כל service הוא container אחד. Compose יוצר רשת משותפת, ומחבר אליה את כולם.

### סרוויסים מוצאים זה את זה לפי השם

**זה הדבר הכי חשוב היום.** בתוך הרשת של Compose, שם ה-service הוא הכתובת שלו. ה-service שנקרא `backend` נמצא בכתובת `backend`. לכן:
- stats מגיע ל-backend בכתובת `http://backend:5000`
- ה-backend מגיע למסד הנתונים בכתובת `postgres`
- Nginx מגיע לשניהם לפי השם

זוכרות את ה-502 של stats בשיעור 2? stats חיפש את `backend`, ולא היה כזה. היום יהיה.

### volume

**מה זה:** מקום לשמירת נתונים מחוץ ל-container.

**למה צריך את זה:** container הוא זמני. כשמוחקים אותו, כל מה שנכתב בתוכו נמחק. למסד נתונים זה אסון: כל המוצרים היו נעלמים בכל הפעלה מחדש. volume שומר את הנתונים בצד, ומחבר אותם ל-container בכל פעם שהוא עולה.

> **טעות נפוצה:** `docker compose down -v`. הדגל `-v` מוחק גם את ה-volumes, כלומר את כל הנתונים. `docker compose down` בלי `-v` שומר אותם.

### healthcheck

**מה זה:** בדיקה ש-Docker מריץ שוב ושוב, כדי לדעת אם הסרוויס באמת מוכן.

**למה צריך את זה:** container של postgres עולה תוך שנייה, אבל מסד הנתונים בתוכו מוכן לקבל חיבורים רק אחרי כמה שניות. אם ה-backend ינסה להתחבר מוקדם מדי, הוא ייכשל. ה-healthcheck אומר ל-Compose לחכות עד ש-postgres באמת מוכן.

---

## חלק 2 — שלב אחר שלב

### שלב 0 — לעדכן ולהתכונן

1. **ב-GitHub:** בעמוד של העותק שלכן, **Sync fork** ואז **Update branch**.
2. **במחשב:**

```shell
cd devops-2027-shoplist
git pull
docker pull postgres:15-alpine
docker rm -f web backend stats
```

- ה-`pull` של postgres לוקח דקה. אפשר להמשיך לקרוא בזמן שהוא רץ.
- `docker rm -f` מנקה containers שנשארו משיעור 2. אם מופיע `No such container`, זה בסדר.

---

### שלב 1 — nginx.conf: שער הכניסה

ליצור את הקובץ `app/frontend/nginx.conf`:

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/stats {
        proxy_pass http://stats:3000/stats;
    }

    location /api/ {
        proxy_pass http://backend:5000/;
    }
}
```

| חלק | מה הוא עושה |
|---|---|
| `listen 80` | Nginx מקשיב בפורט 80, בתוך ה-container |
| `location /` | כל בקשה רגילה: מגישים קובץ מהתיקייה `/usr/share/nginx/html` |
| `location /api/stats` | בקשה ל-`/api/stats` עוברת ל-`stats` בפורט 3000 |
| `location /api/` | כל בקשה אחרת שמתחילה ב-`/api/` עוברת ל-`backend` בפורט 5000 |
| `proxy_pass` | "תעביר את הבקשה לכתובת הזו" |

**שני דברים עדינים:**
- **הסדר בין שני ה-`location` של `/api`:** Nginx בוחר את ההתאמה הארוכה ביותר. `/api/stats` ארוך יותר מ-`/api/`, ולכן בקשה ל-`/api/stats` הולכת ל-stats, וכל השאר ל-backend.
- **הלוכסן בסוף `http://backend:5000/`:** הוא מוריד את `/api/` מהנתיב. בקשה ל-`/api/products` מגיעה ל-backend בתור `/products`, בדיוק הכתובת שה-backend מכיר.

> **שימו לב:** `stats` ו-`backend` הם שמות של services ב-Compose. מחוץ ל-Compose הם לא אומרים כלום. לכן את ה-frontend לא מריצים לבד: Nginx מחפש את השמות האלה כבר בהפעלה, ובלעדיהם הוא נכשל.

---

### שלב 2 — Dockerfile ל-frontend

ליצור את `app/frontend/Dockerfile`:

```dockerfile
FROM nginx:1.30-alpine

COPY index.html  /usr/share/nginx/html/
COPY app.js      /usr/share/nginx/html/
COPY style.css   /usr/share/nginx/html/
COPY nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 80
```

| שורה | מה היא עושה |
|---|---|
| `FROM nginx:1.30-alpine` | אותו Nginx מהתרגיל הראשון של שיעור 2 |
| `COPY index.html ...` | את קובצי האתר לתיקייה ש-Nginx מגיש ממנה |
| `COPY nginx.conf /etc/nginx/conf.d/default.conf` | ההגדרות שלנו **במקום** ההגדרות של ברירת המחדל |
| `EXPOSE 80` | תיעוד בלבד, כמו בשיעור 2 |

**אין `CMD`?** נכון. ה-image של nginx כבר מגדיר איך להפעיל את Nginx, ואנחנו יורשות את זה מה-`FROM`.

> **ב-Notepad:** לשמור עם "All files", בשם `Dockerfile` בלי סיומת, כמו בשיעור 2.

לבנות, כדי לוודא שאין שגיאות:

```shell
docker build -t shoplist-frontend:local app/frontend
```

---

### שלב 3 — init.sql: טבלת המוצרים

ליצור תיקייה חדשה בשם `docker` בתיקייה הראשית של הריפו, ובתוכה את הקובץ `docker/init.sql`:

```sql
CREATE TABLE IF NOT EXISTS products (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    price     NUMERIC(10, 2) NOT NULL,
    quantity  INTEGER NOT NULL DEFAULT 1,
    category  VARCHAR(30) NOT NULL DEFAULT 'Other',
    bought    BOOLEAN NOT NULL DEFAULT FALSE
);
```

| חלק | מה הוא אומר |
|---|---|
| `SERIAL PRIMARY KEY` | מספר מזהה שגדל לבד לכל מוצר חדש |
| `IF NOT EXISTS` | בטוח להריץ שוב ושוב: הטבלה נוצרת רק פעם אחת |
| `NUMERIC(10, 2)` | מחיר עם שתי ספרות אחרי הנקודה |
| `DEFAULT 1` | ערך שנכנס אם לא שלחו ערך אחר. מוצר חדש מתחיל בכמות 1, בקטגוריה `Other`, ולא נקנה (`FALSE`) |
| `BOOLEAN` | אמת או שקר: האם כבר קנינו את המוצר |

ה-image של postgres מריץ אוטומטית כל קובץ SQL בתיקייה `/docker-entrypoint-initdb.d/`, **רק בהפעלה הראשונה**, כשמסד הנתונים עוד ריק. בשלב הבא נחבר את הקובץ לשם.

> **הרצתן כבר את ShopList עם `init.sql` ישן?** אם הוספת מוצר נכשלת והלוג של ה-backend מראה `column "quantity" does not exist`, המסד נוצר בלי העמודות החדשות. `docker compose down -v` ואז `docker compose up -d --build` יוצרים אותו מחדש.

---

### שלב 4 — docker-compose.yml

ליצור את `docker/docker-compose.yml`:

```yaml
services:

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: shoplist
      POSTGRES_USER: shopuser
      POSTGRES_PASSWORD: shoppass
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shopuser -d shoplist"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../app/backend
    environment:
      DB_HOST: postgres
      DB_NAME: shoplist
      DB_USER: shopuser
      DB_PASSWORD: shoppass
    depends_on:
      postgres:
        condition: service_healthy

  stats:
    build:
      context: ../app/stats
    environment:
      BACKEND_URL: http://backend:5000
    depends_on:
      - backend

  frontend:
    build:
      context: ../app/frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
      - stats

volumes:
  postgres-data:
```

> **YAML רגיש לרווחים.** ההזחה היא חלק מהמשמעות: מה שמוזח מתחת ל-`postgres:` שייך ל-postgres. להשתמש **ברווחים בלבד, לא ב-Tab**, שניים לכל רמה. רוב השגיאות בקובץ הזה הן רווח אחד חסר או מיותר.

**service אחרי service:**

| service | מה חשוב בו |
|---|---|
| **postgres** | `image`: לוקחים image מוכן, בלי Dockerfile. `environment`: שם המסד, משתמש וסיסמה, נקראים בהפעלה הראשונה. `volumes`: שורה אחת שומרת את הנתונים (`postgres-data`), שורה שנייה מחברת את `init.sql`. `healthcheck`: בודק כל 10 שניות אם המסד מוכן |
| **backend** | `build`: בונים מה-Dockerfile שכתבתן בשיעור 2. `DB_HOST: postgres`: שם ה-service, זו הכתובת. כאן מגיעים משתני הסביבה שהיו חסרים בשיעור 2 (`KeyError: 'DB_HOST'`). `depends_on` עם `service_healthy`: לחכות ש-postgres באמת מוכן |
| **stats** | `BACKEND_URL: http://backend:5000`: עכשיו יש backend בשם הזה |
| **frontend** | `ports: "8080:80"`: **הסרוויס היחיד שפתוח החוצה.** אותו `-p` משיעור 2, בכתיבה אחרת |
| **volumes** | בסוף הקובץ מצהירים על ה-volume `postgres-data`. Docker יוצר ומנהל אותו |

**שימו לב מה אין:** ל-backend, ל-stats ול-postgres אין `ports:`. הם פנימיים. אפשר להגיע אליהם רק מתוך הרשת של Compose, לא מהדפדפן.

> **ברשת של נטפרי:** Compose בונה את ה-backend מה-Dockerfile שלכן, כולל הדגלים `--trusted-host` משיעור 2. אין צורך בשינוי.

---

### שלב 5 — להריץ את הכל

```shell
cd docker
docker compose up --build
```

- `up`: להרים את כל ה-services.
- `--build`: לבנות קודם את ה-images מה-Dockerfiles.

הטרמינל מציג את הלוגים של כל הסרוויסים יחד, כל אחד בצבע אחר. לחפש את השורות האלה:

```
postgres-1  | database system is ready to accept connections
backend-1   |  * Running on all addresses (0.0.0.0)
stats-1     | stats service listening on 0.0.0.0:3000, backend at http://backend:5000
frontend-1  | ... Configuration complete; ready for start up
```

לפתוח בדפדפן את **`http://localhost:8080`**, ולנסות:
- להוסיף שלושה מוצרים, עם כמות וקטגוריה.
- לסמן מוצר אחד כנקנה (תיבת הסימון משמאל), ולערוך מוצר אחר (✎).
- לבדוק שתיבת ה-**Stats** מציגה כמה נקנה, סכום, כמה נשאר לשלם, ועמודה לכל קטגוריה.
- למעלה מימין: שתי נוריות ירוקות, `backend` ו-`stats`.

כל פעולה בדף עוברת את כל הדרך: דפדפן, Nginx, ה-backend, ו-postgres.

**בחלון טרמינל נוסף**, מתוך התיקייה `docker`:

```shell
docker compose ps
```

ארבעה services. ליד postgres כתוב `(healthy)`.

---

### שלב 6 — מיקרו-סרוויסים בפועל

עדיין בחלון השני:

```shell
docker compose stop stats
```

לרענן את הדפדפן. המוצרים עובדים, תיבת ה-Stats מודיעה שהסרוויס לא זמין, והנורית של `stats` אדומה. **זה הרעיון של מיקרו-סרוויסים משיעור 1:** סרוויס אחד נפל, והשאר ממשיכים.

```shell
docker compose start stats
```

לרענן שוב. הסטטיסטיקות חזרו, והנורית ירוקה.

---

### שלב 7 — הנתונים נשמרים

בחלון הראשון ללחוץ **Ctrl+C** כדי לעצור, ואז:

```shell
docker compose down
docker compose up -d
```

- `down`: עוצר ומוחק את ה-containers ואת הרשת. **את ה-volume הוא משאיר.**
- `up -d`: מרים שוב, הפעם ברקע, כמו `-d` ב-`docker run`.

לרענן את הדפדפן: **המוצרים עדיין שם.** ה-containers חדשים לגמרי, אבל הנתונים נשמרו ב-volume.

ועכשיו מה קורה בלי ה-volume:

```shell
docker compose down -v
docker compose up -d
```

לרענן: **המוצרים נעלמו.** `-v` מחק את ה-volume. בעבודה אמיתית, זו פקודה שמוחקת מסד נתונים.

לסיום, לעצור הכל:

```shell
docker compose down
```

---

### שלב 8 — לשמור את העבודה

מהתיקייה הראשית של הריפו:

```shell
cd ..
git add .
git commit -m "feat: add Docker Compose setup for ShopList"
```

---

## שאלות לראיון עבודה

**1. איך סרוויסים ב-Docker Compose מוצאים זה את זה?**
Compose יוצר רשת משותפת, ושם ה-service משמש ככתובת. ה-backend מתחבר למסד הנתונים בכתובת `postgres`, בלי כתובות IP.

**2. מה זה reverse proxy, ולמה משתמשים בו?**
שרת שמקבל את כל הבקשות בכניסה ומעביר כל אחת לסרוויס הנכון. הדפדפן מדבר עם כתובת אחת, והסרוויסים הפנימיים לא חשופים החוצה.

**3. מה ההבדל בין `docker compose down` ל-`docker compose down -v`?**
`down` עוצר ומוחק containers ורשת, אבל שומר את ה-volumes. `down -v` מוחק גם את ה-volumes, כלומר את הנתונים.

**4. למה `depends_on` לבד לא מספיק למסד נתונים?**
הוא מחכה רק שה-container יתחיל לרוץ, לא שהאפליקציה בתוכו מוכנה. בשביל זה מוסיפים `healthcheck` ו-`condition: service_healthy`.

**5. למה ל-backend אין `ports:` בקובץ?**
כי הוא פנימי. רק ה-frontend פתוח החוצה, וה-backend נגיש רק מתוך הרשת של Compose. פחות פורטים פתוחים זה פחות סיכון.

---

## קבצי עזר

- [compose-reference.md](compose-reference.md): פקודות Compose, תחביר YAML ו-nginx.conf, עם הסברים
- [exercises.md](exercises.md): תרגילים
- [commands-practice.md](commands-practice.md): תרגול פקודות
- [quiz.md](quiz.md): בוחן להגשה על שיעור 3
- [homework.md](homework.md): שיעורי הבית
