# שיעור 4 — רשתות, volumes ו-Docker Compose
## מדריך לסטודנטית

---

## מה יהיה בסוף השיעור

| קובץ | מה הוא עושה |
|---|---|
| `app/stats/Dockerfile` | אורז את stats (Node.js) ל-image |
| `app/frontend/nginx.conf` | ההגדרות של Nginx: מגיש את הדף, ומעביר בקשות API לסרוויסים |
| `app/frontend/Dockerfile` | אורז את ה-frontend ל-image |
| `sql/init.sql` | יוצר את טבלת המוצרים במסד הנתונים |
| `docker/docker-compose.yml` | מגדיר את כל ארבעת הסרוויסים ומריץ אותם יחד |

**מה תדעו לעשות:**
- להסביר למה `localhost` לא עובד בין containers, ומה כן
- להבדיל בין `ports` לבין תקשורת בתוך הרשת
- לבחור את סוג ה-volume המתאים: named volume, bind mount או tmpfs
- לכתוב `docker-compose.yml` ולהריץ איתו מערכת שלמה

**בסוף השיעור:** ShopList רצה ב-`http://localhost:8080`. מה שלא תספיקו, ממשיכות בשיעורי הבית.

---

## לפני שמתחילות

- [ ] Docker Desktop פתוח ורץ
- [ ] בתיקייה הראשית של הריפו: `cd devops-2027-shoplist`
- [ ] יש לכן את ה-image של nginx: `docker images nginx`

> **Git Bash:** לוודא ש-`MSYS_NO_PATHCONV=1` מוגדר (טבלה ב-[README הראשי](../../README.md#איזה-טרמינל)). היום יש נתיבים כמו `/data` בתוך פקודות.

---

## חלק 1 — רשתות

### אנלוגיה לכל החלק: בניין דירות

המחשב שלכן הוא **בניין**. כל container הוא **דירה**: יש לה קירות, דלת ומספר משלה. השאלה של היום: איך שולחים מכתב מדירה לדירה, ואיך נכנסים מהרחוב.

### localhost זה אני עצמי

**מה זה:** בתוך container, `localhost` הוא **ה-container עצמו**. לא המחשב, ולא container אחר.

**למה זה חשוב:** אם ה-backend מחפש את מסד הנתונים ב-`localhost`, הוא מחפש אותו **בתוך הדירה של עצמו**. שם אין postgres, ומקבלים `connection refused`. כמו להתקשר למספר של הבית שלכן ולחכות שהשכנה תענה.

> **טעות נפוצה:** "על המחשב שלי זה עבד עם localhost". נכון, כי שם הכול רץ באותה "דירה". ב-containers כל סרוויס בדירה נפרדת.

### ports: דלת מהרחוב

**מה זה:** `-p 8080:80` (או `ports: - "8080:80"` ב-Compose) פותח דלת **מהמחשב** לתוך container.

| | מבחוץ פנימה | בין containers |
|---|---|---|
| **מי** | הדפדפן במחשב שלכן | stats מדבר עם backend |
| **איך** | דרך `ports` | דרך הרשת, לפי שם |
| **אנלוגיה** | דלת מהרחוב לדירה | המסדרון של הבניין |
| **דוגמה** | `localhost:8080` | `http://backend:5000` |

- **הסדר ב-`8080:80`:** קודם המחשב (הרחוב), אחר כך ה-container (הדירה).
- **ports פותחים רק למי שהעולם צריך לפגוש.** ב-ShopList, רק ל-frontend.

> **טעות נפוצה:** לחשוב ש-`EXPOSE` פותח פורט. הוא רק מתעד. מי שפותח הוא `-p` או `ports`.

### סוגי רשתות

| סוג | מה זה | אנלוגיה | מתי |
|---|---|---|---|
| **bridge (ברירת מחדל)** | כל `docker run` בלי `--network`. מוצאים **רק לפי IP** | לובי בלי לוח שמות | container בודד |
| **רשת שיוצרים** | `docker network create`, או Compose לבד. מוצאים **לפי שם** | קומה במשרד עם ספר טלפונים | כמה containers יחד |
| **host** | ה-container משתמש ישר ברשת של המחשב, בלי בידוד | אין קירות | כמעט אף פעם |
| **none** | אין רשת בכלל | חדר בלי טלפון | משימה מבודדת |

### ברשת שיצרנו, השם הוא הכתובת

**מה זה:** בכל רשת שאנחנו יוצרות יש ל-Docker **ספר טלפונים פנימי (DNS)**. כל container שמצטרף נרשם בו לפי השם שלו.

**למה לא IP:** ה-IP של container משתנה בכל פעם שהוא נוצר מחדש. השם נשאר. כמו אנשי קשר בטלפון: לא זוכרות מספרים, זוכרות שמות.

**ב-Compose:** Compose יוצר רשת אחת לבד, בשם `<התיקייה>_default`. הקובץ שלנו בתיקייה `docker`, אז הרשת היא `docker_default`. שם ה-service בקובץ הוא השם בספר הטלפונים.

### תרגיל 1 — שני containers, ספר טלפונים אחד (7 דקות)

```shell
docker run -d --name a nginx:1.30-alpine
docker run -d --name b nginx:1.30-alpine
docker exec b ping -c 2 a
```

**מה קיבלתן?** `ping: bad address 'a'`. ברשת ברירת המחדל אין ספר טלפונים.

```shell
docker network create shopnet
docker network connect shopnet a
docker network connect shopnet b
docker exec b ping -c 2 a
```

**ועכשיו?** תשובות מכתובת IP. ספר הטלפונים תרגם את `a` לכתובת.

**בונוס:**

```shell
docker network inspect shopnet
```

מה ה-IP של `a`? מחקו את `a`, הריצו אותו מחדש וחברו שוב לרשת. ה-IP השתנה?

**ניקוי:**

```shell
docker rm -f a b
docker network rm shopnet
```

---

## חלק 2 — volumes

### אנלוגיה לכל החלק: חדר במלון

container הוא **חדר במלון**. נכנסות (`run`) ומקבלות חדר נקי, לפי אותה תוכנית (ה-image). כותבות, מסדרות, משנות. כשעוזבות (`rm`), החדר מנוקה, **וכל מה שהשארתן בו נעלם**.

ל-stats זה בסדר, הוא לא שומר כלום. למסד נתונים זה אסון. לכן צריך מקום **מחוץ לחדר**.

### שלושה סוגים

| סוג | אנלוגיה | מה זה | דוגמה | מתי |
|---|---|---|---|---|
| **named volume** | ארונית במחסן של המלון | Docker מנהל ושומר אותו. יש לו שם, והוא נשאר אחרי שה-container נמחק | `-v notes:/data` | מסד נתונים |
| **bind mount** | דלת לחדר שלכן בבית | תיקייה או קובץ מהמחשב שלכן. שינוי בצד אחד נראה מיד בצד השני | `-v ${PWD}/site:/app` | קבצי הגדרות, קוד בזמן פיתוח |
| **tmpfs** | לוח מחיק | בזיכרון בלבד, נמחק כשה-container נעצר | `--tmpfs /scratch` | קבצים זמניים ורגישים |

**איך מבדילים בקובץ Compose?**
- **רק שם** (`postgres-data:/var/lib/...`) → named volume. השם מופיע שוב בסוף הקובץ, תחת `volumes:`.
- **מתחיל ב-`./`, `../` או `/`** (`../sql/init.sql:/docker-...`) → bind mount.

> **טעות נפוצה:** `-v /data` בלי שם. Docker יוצר "anonymous volume" עם שם אקראי ארוך, ואחר כך קשה למצוא אותו. תמיד לתת שם.

### הדגמה: רואים את זה קורה

**1. בלי volume:** container חדש לא רואה את הקובץ.

```shell
docker run --rm nginx:1.30-alpine sh -c "echo shalom > /tmp/note.txt"
docker run --rm nginx:1.30-alpine cat /tmp/note.txt
```

`No such file`. `--rm` מחק את ה-container הראשון, והשני הוא חדר חדש ונקי.

**2. named volume:** הקובץ שורד.

```shell
docker run --rm -v notes:/data nginx:1.30-alpine sh -c "echo shalom > /data/note.txt"
docker run --rm -v notes:/data nginx:1.30-alpine cat /data/note.txt
docker volume ls
```

`shalom`. שני containers שונים, אותה ארונית.

**3. bind mount:** משנות במחשב, רואות בדפדפן.

ליצור תיקייה `site`, ובתוכה ב-VS Code קובץ `index.html` עם שורה אחת: `<h1>Shalom</h1>`. ואז:

```shell
# PowerShell
docker run -d -p 8081:80 -v ${PWD}/site:/usr/share/nginx/html --name site nginx:1.30-alpine
# Git Bash: במקום ${PWD} כותבים $(pwd -W)
```

לפתוח `http://localhost:8081`, לשנות את הטקסט ב-VS Code, לשמור, ולרענן. השינוי מופיע בלי build.

**ניקוי:**

```shell
docker rm -f site
docker volume rm notes
```

### stop, down ו-down -v

| פקודה | במלון | containers | רשת | volumes |
|---|---|---|---|---|
| `docker compose stop` | יוצאות לטיול | עוצרים, לא נמחקים | נשארת | נשארים |
| `docker compose down` | עוזבות את המלון | נמחקים | נמחקת | **נשארים** |
| `docker compose down -v` | עוזבות ומרוקנות את הארונית | נמחקים | נמחקת | **נמחקים** |

> **טעות נפוצה:** `down -v` מתוך הרגל. `-v` זה מחיקת מסד נתונים.

---

## חלק 3 — בונים יחד, שלב אחר שלב

מקלידות, לא מעתיקות. כל הפקודות מהתיקייה הראשית של הריפו, אלא אם כתוב אחרת.

### שלב 1 — Dockerfile ל-stats

ליצור את `app/stats/Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package.json .
COPY server.js .

EXPOSE 3000

CMD ["node", "server.js"]
```

| | backend | stats |
|---|---|---|
| **בסיס** | `python:3.11-slim` | `node:24-alpine` |
| **תלויות** | `pip install` | אין |
| **פורט** | 5000 | 3000 |
| **הפעלה** | `python app.py` | `node server.js` |

**אין `RUN npm install`?** נכון. ל-stats אין חבילות חיצוניות. ב-`server.js` יש רק `require('http')`, שמגיע עם Node.

```shell
docker build -t shoplist-stats:local app/stats
```

> **ב-Notepad:** לשמור עם "All files", בשם `Dockerfile` בלי סיומת.

---

### שלב 2 — nginx.conf: פקידת הקבלה

**reverse proxy** הוא כמו פקידת קבלה במרפאה: יש כניסה אחת, והיא שולחת כל אחת לחדר הנכון. הדפדפן מכיר רק את `localhost:8080`, ומדבר רק עם Nginx.

ליצור את `app/frontend/nginx.conf`:

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

| הבקשה מהדפדפן | לאן Nginx שולח |
|---|---|
| `/` | מגיש בעצמו את `index.html`, `app.js`, `style.css` |
| `/api/stats` | ל-`stats:3000/stats` |
| `/api/products` | ל-`backend:5000/products` |

**שני דברים עדינים:**
- **ההתאמה הארוכה מנצחת:** `/api/stats` ארוך מ-`/api/`, ולכן בקשה לסטטיסטיקה לא תגיע בטעות ל-backend.
- **הלוכסן בסוף `http://backend:5000/`** מוריד את `/api` מהנתיב. `/api/products` מגיע ל-backend בתור `/products`.

> **שימו לב:** `stats` ו-`backend` הם שמות בספר הטלפונים של Compose. לכן את ה-frontend לא מריצים לבד: Nginx מחפש את השמות כבר בהפעלה, ובלעדיהם נופל עם `host not found in upstream`.

---

### שלב 3 — Dockerfile ל-frontend

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
| `FROM nginx:1.30-alpine` | Nginx מוכן, כמו בתרגיל הראשון של שיעור 2 |
| שלוש שורות `COPY` ראשונות | קובצי האתר לתיקייה ש-Nginx מגיש ממנה |
| `COPY nginx.conf ...` | ההגדרות שלנו **במקום** ההגדרות של ברירת המחדל |
| `EXPOSE 80` | תיעוד בלבד |

**אין `CMD`?** נכון. יורשות אותו מה-image של nginx.

---

### שלב 4 — init.sql

ליצור תיקייה `sql` בתיקייה הראשית, ובתוכה `sql/init.sql`:

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

ה-image של postgres מריץ כל קובץ SQL בתיקייה `/docker-entrypoint-initdb.d/`, **רק בהפעלה הראשונה**, כשהארונית (ה-volume) ריקה.

---

### שלב 5 — docker-compose.yml: postgres

ליצור תיקייה `docker` בתיקייה הראשית, ובתוכה את `docker/docker-compose.yml`. מתחילות ב-service הראשון:

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
      - ../sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shopuser -d shoplist"]
      interval: 10s
      timeout: 5s
      retries: 5
```

| חלק | מה הוא עושה |
|---|---|
| `image` | image מוכן, בלי Dockerfile |
| `environment` | שם המסד, משתמש וסיסמה. נקראים רק בהפעלה הראשונה |
| `postgres-data:...` | **named volume**: הארונית של הנתונים |
| `../sql/init.sql:...` | **bind mount**: הקובץ מהמחשב שלנו. הנתיב יחסי לקובץ ה-Compose: יוצאות מ-`docker` ונכנסות ל-`sql` |
| `healthcheck` | `pg_isready` שואל כל 10 שניות: "המסד מוכן?" |

> **YAML רגיש לרווחים.** רווחים בלבד, לא Tab, שניים לכל רמה. מה שמוזח מתחת ל-`postgres:` שייך ל-postgres.

---

### שלב 6 — docker-compose.yml: שאר ה-services

להמשיך באותו קובץ, באותה הזחה כמו `postgres:`:

```yaml
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

| חלק | מה חשוב בו |
|---|---|
| `build: context:` | איפה ה-Dockerfile. **יחסי למיקום של קובץ ה-compose**: יוצאות מ-`docker` (`..`) ונכנסות ל-`app` |
| `DB_HOST: postgres` | **שם ה-service הוא הכתובת.** זה מה שחסר בשיעור 2 (`KeyError: 'DB_HOST'`) |
| `BACKEND_URL: http://backend:5000` | stats מוצא את backend לפי השם |
| `condition: service_healthy` | backend מחכה שהמסד **באמת** מוכן, לא רק שה-container עלה |
| `ports` | **רק ל-frontend.** כל השאר פנימיים |
| `volumes:` בסוף | רשימת הארוניות. כאן Docker לומד ש-`postgres-data` הוא named volume |

> **ברשת של נטפרי:** אם ה-build של ה-backend נכשל ב-`pip install` עם שגיאת SSL, להוסיף ל-`pip install` ב-Dockerfile את הדגלים `--trusted-host pypi.org --trusted-host files.pythonhosted.org`.

---

### שלב 7 — להריץ

```shell
cd docker
docker compose config
docker compose up --build
```

- `config`: בודק את הקובץ. אם יש שגיאת הזחה, הוא מראה את השורה.
- `up --build`: בונה את ה-images ומרים את הכול.

בלוגים, לחפש את הסדר: קודם postgres, אחרי כמה שניות `healthy`, ורק אז backend, stats ו-frontend.

לפתוח **`http://localhost:8080`**:
- להוסיף שלושה מוצרים, עם כמות וקטגוריה.
- לסמן מוצר כנקנה, ולערוך מוצר אחר.
- למעלה מימין: שתי נוריות ירוקות, `backend` ו-`stats`.

**בחלון טרמינל נוסף**, מתוך `docker`:

```shell
docker compose ps
```

---

### שלב 8 — לראות את הרשת ואת הארונית

עדיין בחלון השני, מתוך `docker`:

```shell
docker network ls
docker volume ls
```

- `docker_default`: הרשת ש-Compose יצר.
- `docker_postgres-data`: הארונית. Compose מוסיף את שם התיקייה לפני השם.

**השם עובד מבפנים:**

```shell
docker compose exec -T stats wget -qO- http://backend:5000/health
```

`{"status":"ok"}`. stats שאל את backend לפי השם. (`-T` מונע שגיאת TTY ב-Git Bash.)

**מיקרו-סרוויסים:**

```shell
docker compose stop stats
```

לרענן את הדפדפן: המוצרים עובדים, הנורית של stats אדומה. `docker compose start stats` מחזיר אותו.

**הנתונים נשמרים:**

```shell
docker compose down
docker compose up -d
```

המוצרים עדיין שם. ה-containers חדשים, הארונית אותה ארונית.

---

### שלב 9 — לשמור את העבודה

```shell
docker compose down
cd ..
git add .
git commit -m "feat: add Docker Compose setup for ShopList"
```

**בלי push**, ובלי `-v` ב-`down`.

---

## תקלות נפוצות

| בעיה | סיבה | פתרון |
|---|---|---|
| `found character that cannot start any token` | Tab ב-YAML | רווחים בלבד. `docker compose config` מראה את השורה |
| `no configuration file provided` | הפקודה רצה מחוץ לתיקייה `docker` | `cd docker` |
| `Welcome to nginx!` בדפדפן | `nginx.conf` לא הועתק | לבדוק את ה-Dockerfile של ה-frontend, ו-`up --build` |
| `host not found in upstream` | ה-frontend רץ לבד, או שגיאת כתיב בשם service | להריץ דרך Compose, ולבדוק שמות |
| `502 Bad Gateway` | backend או stats לא עלו | `docker compose ps`, ואז `docker compose logs backend` |
| `relation "products" does not exist` | `init.sql` לא רץ, כי הארונית כבר הייתה מלאה | `docker compose down -v` ואז `up` |
| `port is already allocated` | 8080 תפוס, למשל מהדגמה | `docker rm -f site a b`, או לסגור את ה-container שתופס |
| `ping: bad address` גם ברשת שיצרתן | שכחתן לחבר אחד מה-containers | `docker network connect shopnet <שם>` |
| `the input device is not a TTY` | Git Bash עם `exec` | להוסיף `-T`: `docker compose exec -T ...` |

---

## שאלות לראיון עבודה

**1. למה container לא יכול להגיע ל-container אחר דרך `localhost`?**
לכל container יש רשת משלו, ו-`localhost` בתוכו הוא ה-container עצמו.

**2. מה ההבדל בין רשת ברירת המחדל לרשת שיוצרים?**
ברשת ברירת המחדל מוצאים רק לפי IP. ברשת שיוצרים (ובזו ש-Compose יוצר) יש DNS פנימי, ומוצאים לפי שם.

**3. מה ההבדל בין `ports` לבין תקשורת בתוך הרשת?**
`ports` פותח דלת מהמחשב לתוך container. containers באותה רשת מדברים ישירות, לפי שם ופורט פנימי, בלי `ports`.

**4. named volume מול bind mount?**
named volume מנוהל על ידי Docker, ומתאים לנתונים כמו מסד נתונים. bind mount הוא תיקייה או קובץ מהמחשב, ומתאים לקבצי הגדרות ולפיתוח.

**5. מה זה multi-stage build?**
Dockerfile עם כמה `FROM`. בונים בשלב אחד עם כל הכלים, ומעתיקים לשלב האחרון רק את התוצאה. כלי הבנייה לא נכנסים ל-image הסופי, ולכן הוא קטן ובטוח יותר. (תתרגלו את זה בשיעורי הבית.)
