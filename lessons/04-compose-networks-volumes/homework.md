# שיעור 4 — שיעורי בית: ShopList רצה ב-Docker Compose

## מסמך דרישות

**המטרה:** בסוף שיעורי הבית, במחשב שלכן בבית, פקודה אחת מרימה את כל ShopList, והאפליקציה עובדת בדפדפן ב-`http://localhost:8080`. מה שהתחלתן בכיתה, משלימות כאן. `nginx.conf` ו-`init.sql` כבר בריפו: כתבנו אותם יחד בכיתה.

**הגשה:** push ל-fork שלכן, **לפני תחילת שיעור 5**.

**זמן משוער:** שעתיים עד שלוש.

**איך עובדים עם המסמך:** לכל דרישה יש מספר (ד1, ד2...) ורשימת בדיקה. מסמנות ✓ רק אחרי שבדקתן. ההסברים המלאים, עם הקוד, נמצאים ב-[guide.md](guide.md) של שיעור 4 וב-[guide.md](../02-docker-basics/guide.md) של שיעור 2. ליד כל דרישה כתוב איפה.

---

## 0. הכנה (פעם אחת)

### מה צריך במחשב בבית
- [ ] Docker Desktop פתוח, ולמטה כתוב **Engine running**.
- [ ] Git, וטרמינל: PowerShell או Git Bash.
- [ ] VS Code, או עורך אחר. **לא Notepad**: הוא שומר קבצים עם `.txt` בסוף.

### להביא את הקוד
1. ב-GitHub, ב-fork שלכן: **Sync fork** ואז **Update branch**. ככה מקבלות את שיעור 4 ואת הקובץ `build.js`.
2. בטרמינל, בתיקייה שבה רוצות לשמור את הקורס:
   ```shell
   git clone https://github.com/<שם-המשתמש-שלכן>/devops-2027-shoplist.git
   cd devops-2027-shoplist
   ```
   כבר יש לכן clone בבית? אז רק `git pull`.

> **למה מתחילות מחדש בבית?** מה שכתבתן בכיתה נשאר במחשב של הכיתה, כי משם לא עושים push. בבית כותבות את הקבצים שוב, ב-fork שלכן. זו גם חזרה טובה.

### push מהבית
מהמחשב הפרטי מותר לעשות push. בפעם הראשונה ש-`git push` מבקש להזדהות, נפתח חלון של GitHub בדפדפן: להתחבר ולאשר. מהפעם השנייה זה עובד לבד.

---

## 1. התמונה הגדולה: מה יהיה בסוף

```
devops-2027-shoplist/
├── app/
│   ├── backend/
│   │   ├── app.py              (קיים)
│   │   ├── requirements.txt    (קיים)
│   │   └── Dockerfile          ← ד1
│   ├── stats/
│   │   ├── server.js           (קיים)
│   │   ├── package.json        (קיים)
│   │   └── Dockerfile          ← ד2
│   └── frontend/
│       ├── index.html, app.js, style.css, build.js   (קיימים)
│       ├── nginx.conf          (קיים, כתבנו בכיתה) ← ד3
│       ├── Dockerfile          ← ד4
│       └── Dockerfile.multistage   ← ד8
├── sql/
│   └── init.sql                (קיים, כתבנו בכיתה) ← ד5
├── docker/
│   └── docker-compose.yml      ← ד6
└── lessons/04-compose-networks-volumes/homework/
    ├── answers.md              ← ד10
    └── screenshots/            ← ד9
```

| סרוויס | שפה | פורט בתוך ה-container | פתוח למחשב? |
|---|---|---|---|
| frontend | Nginx | 80 | **כן**, ב-8080 |
| backend | Python (Flask) | 5000 | לא |
| stats | Node.js | 3000 | לא |
| postgres | PostgreSQL 15 | 5432 | לא |

---

## 2. הדרישות

### ד1 — Dockerfile ל-backend
**קובץ:** `app/backend/Dockerfile` · **עזרה:** שיעור 2, guide.md, שלב 3

- [ ] מתחיל מ-`python:3.11-slim`.
- [ ] תיקיית עבודה `/app`.
- [ ] **קודם** מעתיק את `requirements.txt` ומריץ `pip install --no-cache-dir -r requirements.txt`, **ורק אחר כך** את `app.py`. (layer caching: ההתקנה לא חוזרת בכל שינוי בקוד.)
- [ ] `EXPOSE 5000`.
- [ ] `CMD` בצורת exec (סוגריים מרובעים) שמריץ `python app.py`.

> **נטפרי בבית?** אם ה-build נכשל ב-`pip install` עם שגיאת SSL או `CERTIFICATE_VERIFY_FAILED`, להוסיף לפקודת ה-`pip install` שני דגלים, שאומרים ל-pip לסמוך על השרתים של PyPI:
> ```dockerfile
> RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
> ```
> בלי נטפרי, לא צריך אותם.

### ד2 — Dockerfile ל-stats
**קובץ:** `app/stats/Dockerfile` · **עזרה:** שיעור 4, guide.md, שלב 1

- [ ] מתחיל מ-`node:24-alpine`.
- [ ] תיקיית עבודה `/app`.
- [ ] מעתיק `package.json` ו-`server.js`.
- [ ] **בלי** `npm install`: ל-stats אין חבילות חיצוניות.
- [ ] `EXPOSE 3000`, ו-`CMD` בצורת exec שמריץ `node server.js`.

### ד3 — nginx.conf: לבדוק ולהבין
**קובץ:** `app/frontend/nginx.conf` · **קיים בריפו**, כתבנו אותו יחד בכיתה · **הסבר:** שיעור 4, guide.md, שלב 2

לא כותבים מחדש. פותחים את הקובץ, ומוודאות שאתן מבינות כל שורה:

- [ ] בלוק `server` שמאזין בפורט 80.
- [ ] `location /`: מגיש קבצים מ-`/usr/share/nginx/html`, עם `try_files`.
- [ ] `location /api/stats`: מעביר ל-`http://stats:3000/stats`.
- [ ] `location /api/`: מעביר ל-`http://backend:5000/`, עם לוכסן בסוף.
- [ ] יכולות להסביר במילים שלכן למה `/api/stats` מגיע ל-stats ולא ל-backend, ומה הלוכסן בסוף עושה. (שאלה 7 ב-ד10.)

> **אין לכן את הקובץ?** לעשות **Sync fork** ב-GitHub, ואז `git pull` בבית.

### ד4 — Dockerfile ל-frontend
**קובץ:** `app/frontend/Dockerfile` · **עזרה:** שיעור 4, guide.md, שלב 3

- [ ] מתחיל מ-`nginx:1.30-alpine`.
- [ ] מעתיק את `index.html`, `app.js` ו-`style.css` ל-`/usr/share/nginx/html/`.
- [ ] מעתיק את `nginx.conf` ל-`/etc/nginx/conf.d/default.conf`.
- [ ] `EXPOSE 80`. **בלי `CMD`**: יורשים אותו מ-nginx.

### ד5 — init.sql: לבדוק
**קובץ:** `sql/init.sql` · **קיים בריפו**, כתבנו אותו יחד בכיתה · **הסבר:** שיעור 4, guide.md, שלב 4

לא כותבים מחדש. מוודאות שהקובץ יוצר טבלה בשם `products`, עם `IF NOT EXISTS`, ועם שש העמודות האלה בדיוק (ה-backend מחפש אותן לפי השם):

| עמודה | סוג | חובה? | ברירת מחדל |
|---|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | | |
| `name` | `VARCHAR(100)` | כן (`NOT NULL`) | |
| `price` | `NUMERIC(10, 2)` | כן | |
| `quantity` | `INTEGER` | כן | `1` |
| `category` | `VARCHAR(30)` | כן | `'Other'` |
| `bought` | `BOOLEAN` | כן | `FALSE` |

> **שימו לב:** הקובץ נמצא בתיקייה `sql`, ולא ליד קובץ ה-Compose. לכן בקובץ ה-Compose הנתיב אליו מתחיל ב-`../` (ד6).

### ד6 — docker-compose.yml
**קובץ:** `docker/docker-compose.yml` · **עזרה:** שיעור 4, guide.md, שלבים 5–6

**כללי:**
- [ ] ארבעה services, **בשמות האלה בדיוק**: `postgres`, `backend`, `stats`, `frontend`. השם הוא הכתובת, אז שגיאת כתיב אחת שוברת את הכל.
- [ ] רווחים בלבד, לא Tab. שני רווחים לכל רמה.
- [ ] מעל כל service, הערה בעברית במשפט אחד: מה הוא, ועם מי הוא מדבר.
- [ ] **אין** אף מילה על networks: Compose יוצר רשת לבד.

**postgres:**
- [ ] `image: postgres:15-alpine` (לא `build`).
- [ ] `environment`: `POSTGRES_DB: shoplist`, `POSTGRES_USER: shopuser`, `POSTGRES_PASSWORD: shoppass`.
- [ ] `volumes`, שתי שורות:
  - **named volume** בשם `postgres-data`, לתיקייה `/var/lib/postgresql/data`.
  - **bind mount** של `../sql/init.sql` לקובץ `/docker-entrypoint-initdb.d/init.sql`. הנתיב יחסי למיקום של קובץ ה-Compose: יוצאות מ-`docker` (`..`) ונכנסות ל-`sql`.
- [ ] `healthcheck` עם `pg_isready -U shopuser -d shoplist`: `interval: 10s`, `timeout: 5s`, `retries: 5`.
- [ ] **בלי** `ports`.

**backend:**
- [ ] `build` עם `context: ../app/backend`.
- [ ] `environment`: `DB_HOST: postgres`, `DB_NAME: shoplist`, `DB_USER: shopuser`, `DB_PASSWORD: shoppass`.
- [ ] `depends_on` על postgres, עם `condition: service_healthy`.
- [ ] **בלי** `ports`.

**stats:**
- [ ] `build` עם `context: ../app/stats`.
- [ ] `environment`: `BACKEND_URL: http://backend:5000`. לפי **שם**, לא `localhost`.
- [ ] `depends_on`: backend.
- [ ] **בלי** `ports`.

**frontend:**
- [ ] `build` עם `context: ../app/frontend`.
- [ ] `ports`: `"8080:80"`. **זה ה-service היחיד עם ports.**
- [ ] `depends_on`: backend ו-stats.

**בסוף הקובץ:**
- [ ] `volumes:` ברמה הראשית, ובתוכו `postgres-data:`.

### ד7 — האפליקציה עובדת
**עזרה:** שיעור 4, guide.md, שלבים 7–8

מהתיקייה `docker`:
```shell
docker compose config
docker compose up -d --build
docker compose ps
```

כל הבדיקות האלה צריכות לעבור:

| # | בדיקה | איך | מה אמור להופיע |
|---|---|---|---|
| 1 | הקובץ תקין | `docker compose config` | הקובץ המלא, בלי שגיאה |
| 2 | ארבעה services רצים | `docker compose ps` | 4 שורות. ליד postgres: `(healthy)` |
| 3 | הדף עולה | דפדפן: `http://localhost:8080` | ShopList, ולמעלה מימין שתי נוריות **ירוקות** |
| 4 | הוספה | להוסיף 3 מוצרים, עם כמות וקטגוריה | הם ברשימה. ה-Stats מתעדכן |
| 5 | עריכה וסימון | לערוך מוצר אחד (✎), ולסמן מוצר אחר כנקנה | השינוי נשמר אחרי רענון |
| 6 | ה-API דרך Nginx | `curl.exe http://localhost:8080/api/health` | `{"status":"ok"}` |
| 7 | stats דרך Nginx | `curl.exe http://localhost:8080/api/stats` | JSON עם `count` ו-`total` |
| 8 | השם הוא הכתובת | `docker compose exec -T stats wget -qO- http://backend:5000/health` | `{"status":"ok"}` |
| 9 | backend לא חשוף | דפדפן: `http://localhost:5000` | **לא** נפתח |
| 10 | מיקרו-סרוויסים | `docker compose stop stats`, ולרענן | המוצרים עובדים, הנורית של stats אדומה. אחר כך `docker compose start stats` |
| 11 | הנתונים נשמרים | `docker compose down`, ואז `docker compose up -d` | המוצרים עדיין שם |

> ב-Git Bash: `curl` במקום `curl.exe`.
> **לא** להריץ `down -v` בבדיקות: זה מוחק את המוצרים.

### ד8 — multi-stage ל-frontend
**קובץ:** `app/frontend/Dockerfile.multistage` (D גדולה). לא לגעת ב-`Dockerfile` הרגיל.

**הרקע:** ב-`app/frontend` יש קובץ `build.js`, כלי "בנייה" קטן ב-Node.js. הוא קורא את `index.html`, `app.js` ו-`style.css`, מנקה הערות מ-`app.js`, מוסיף לתחתית הדף שורה `Build: <תאריך ושעה>`, וכותב הכל לתיקייה `dist`. כדי להריץ אותו צריך Node. כדי **להגיש** את התוצאה מספיק Nginx. **מטבח** עם כל הכלים, ו**מגש הגשה** עם העוגה בלבד.

**השלד, להעתיק ולהשלים כל `____`:**

```dockerfile
# שלב 1: בנייה (המטבח)
FROM ____ AS ____
WORKDIR /app
COPY ____ ____ ____ ____ ./
RUN ____

# שלב 2: הרצה (מגש ההגשה)
FROM ____
COPY --from=____ ____ /usr/share/nginx/html/
COPY ____ /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**שלב 1, המטבח:**

| שורה | מה להשלים | למה |
|---|---|---|
| `FROM ____ AS ____` | ה-image של Node שבו השתמשנו ל-stats, ואחרי `AS` את השם `build` | צריך Node כדי להריץ את `build.js`. `AS build` נותן לשלב שם |
| `COPY ____ ____ ____ ____ ./` | ארבעת הקבצים ש-`build.js` צריך: הסקריפט ושלושת קובצי האתר | כמה קבצים בשורה אחת: היעד חייב להסתיים ב-`/` |
| `RUN ____` | הפקודה שמריצה את `build.js` עם Node | רץ **בזמן הבנייה**. בסופה קיימת `/app/dist` |

- [ ] בשלב 1 **אין** `EXPOSE` ואין `CMD`. אף אחד לא מריץ את המטבח.

**שלב 2, מגש ההגשה:**

| שורה | מה להשלים | למה |
|---|---|---|
| `FROM ____` | אותו image של Nginx כמו ב-Dockerfile הרגיל | `FROM` שני מתחיל image **חדש ונקי** |
| `COPY --from=____ ____ ...` | שם השלב הראשון, ואחריו התיקייה שנוצרה בו (נתיב מלא, מתחיל ב-`/app`) | מעתיקים **מהשלב ההוא**, רק את `dist` |
| `COPY ____ /etc/nginx/...` | קובץ ההגדרות מ-ד3 | **בלי** `--from`: הקובץ מגיע מהמחשב |

- [ ] בשלב 2 **אין** `CMD`. (למה? שאלה 5 ב-ד10.)

**לחבר ל-Compose:** ב-`docker/docker-compose.yml`, תחת `frontend` ← `build`, להוסיף שורה:
```yaml
  frontend:
    build:
      context: ../app/frontend
      dockerfile: Dockerfile.multistage
```

**בדיקות ל-ד8**, מהתיקייה הראשית של הריפו:

```shell
docker build -t shoplist-frontend:single app/frontend
docker build -f app/frontend/Dockerfile.multistage -t shoplist-frontend:multi app/frontend
docker build -f app/frontend/Dockerfile.multistage --target build -t shoplist-frontend:kitchen app/frontend
docker images shoplist-frontend
docker run --rm shoplist-frontend:kitchen node --version
docker run --rm shoplist-frontend:multi node --version
```

- [ ] `kitchen` גדול בהרבה מ-`multi`. לרשום את שלושת הגדלים ב-`answers.md`.
- [ ] ב-`kitchen`, `node --version` מדפיס גרסה. ב-`multi` הוא נכשל: אין שם Node.
- [ ] מהתיקייה `docker`: `docker compose up -d --build frontend`, ורענון עם Ctrl+F5. בתחתית הדף מופיעה שורת `Build: ...`.

### ד9 — הוכחה שזה עובד
בתיקייה `lessons/04-compose-networks-volumes/homework/screenshots/`, שלושה צילומי מסך:

- [ ] `browser.png`: ShopList בדפדפן, עם לפחות 3 מוצרים, שתי נוריות ירוקות, ושורת `Build:` בתחתית.
- [ ] `compose-ps.png`: הפלט של `docker compose ps`, עם 4 services ו-`(healthy)`.
- [ ] `sizes.png`: הפלט של `docker images shoplist-frontend`.

### ד10 — שאלות
**קובץ:** `lessons/04-compose-networks-volumes/homework/answers.md`. משפט או שניים לכל שאלה.

1. ל-backend אין `ports`. איך stats מגיע אליו? ואיך הדפדפן מגיע אליו?
2. עושים `docker compose down` ואחר כך `up`. המוצרים נשארו? ומה אם עושים `down -v`? הסבירו לפי סוג ה-volume.
3. השורה `../sql/init.sql:/docker-entrypoint-initdb.d/init.sql`: איזה סוג volume זה, ואיך יודעים? מה יקרה אם תשנו את `init.sql` אחרי שהמסד כבר נוצר?
4. מה שם הרשת ש-Compose יצר, ומה שם ה-volume? (להריץ `docker network ls` ו-`docker volume ls`, ולהסביר מאיפה הגיעו השמות.)
5. ב-`Dockerfile.multistage`: מה יש ב-image הסופי ומה אין? למה אין `CMD`? ולמה ל-stats לא צריך multi-stage?
6. שלושת הגדלים מ-ד8 (`single`, `multi`, `kitchen`). למה `multi` כמעט בגודל של `single`?
7. ב-`nginx.conf`: בקשה ל-`/api/stats` מתאימה גם ל-`location /api/`. למה היא מגיעה ל-stats? ומה קורה לבקשה `/api/products` בגלל הלוכסן בסוף `http://backend:5000/`?

---

## 3. הגשה

מהתיקייה הראשית של הריפו:

```shell
git status
git add .
git commit -m "homework 4: ShopList with Docker Compose and multi-stage"
git push
```

- [ ] ב-`git status` **לא** מופיעים קבצים מוזרים, כמו `Dockerfile.txt` או `nginx.conf.txt`.
- [ ] אחרי ה-push, ב-GitHub, ב-fork שלכן: כל הקבצים מהטבלה בסעיף 1 קיימים.
- [ ] **בונוס** (ד11 למטה): `.env` **לא** מופיע ב-GitHub.

---

## 4. תקלות נפוצות

| בעיה | סיבה | פתרון |
|---|---|---|
| `found character that cannot start any token` | Tab ב-YAML | רווחים בלבד. `docker compose config` מראה את השורה |
| `no configuration file provided` | הפקודה רצה מחוץ ל-`docker` | `cd docker` |
| `service "postgres" refers to undefined volume` | חסר `volumes:` בסוף הקובץ | להוסיף `volumes:` ו-`postgres-data:` |
| `failed to read dockerfile` | הקובץ נשמר בשם `Dockerfile.txt` | לשנות שם. ב-PowerShell: `dir` מראה את השם המלא |
| `CERTIFICATE_VERIFY_FAILED` ב-build של backend | נטפרי | `--trusted-host` ב-`pip install` (ד1) |
| `Welcome to nginx!` בדפדפן | חסרה שורת `COPY nginx.conf` | לתקן ו-`up -d --build` |
| `host not found in upstream` | שגיאת כתיב בשם service | השמות ב-`nginx.conf` וב-compose חייבים להיות זהים |
| `502 Bad Gateway` | backend או stats לא עלו | `docker compose ps`, ואז `docker compose logs backend` |
| `relation "products" does not exist` | `init.sql` לא רץ: נתיב שגוי ב-bind mount, או שנוסף אחרי שהמסד נוצר | לבדוק `../sql/init.sql`, ואז `docker compose down -v` ו-`up -d` |
| `column "quantity" does not exist` | `init.sql` ישן, בלי שש העמודות | לתקן את `init.sql`, ואז `down -v` ו-`up -d` |
| Sync fork מראה **conflict** ב-`nginx.conf` או ב-`init.sql` | יצרתן את הקובץ גם ב-fork שלכן | לפנות למורה לפני שממשיכות |
| `port is already allocated` | 8080 תפוס | `docker ps`, ולמחוק את ה-container שתופס |
| הדף לא השתנה אחרי שינוי | הדפדפן זוכר את הישן | Ctrl+F5 |
| `the input device is not a TTY` | Git Bash עם `exec` | `docker compose exec -T ...` |

---

## 5. בונוס

### ד11 — סיסמה מחוץ לקובץ
- [ ] קובץ `docker/.env` עם השורה `POSTGRES_PASSWORD=shoppass`.
- [ ] ב-`docker-compose.yml`, בשני המקומות: `${POSTGRES_PASSWORD}` במקום `shoppass`.
- [ ] `docker compose config` מראה את הסיסמה במקום המשתנה, והאפליקציה עדיין עובדת.
- [ ] `.env` מופיע ב-`.gitignore`, ולכן לא עולה ל-GitHub.

---

## 6. מה בודקים

| דרישה | נקודות |
|---|---|
| ד1, ד2, ד4: שלושה Dockerfiles | 20 |
| ד6: `docker-compose.yml` לפי כל הדרישות | 30 |
| ד7, ד9: האפליקציה עובדת, עם צילומי מסך | 20 |
| ד8: multi-stage עובד ומחובר ל-Compose | 20 |
| ד10: שאלות | 10 |
| ד11: בונוס | +5 |

---

## 7. בתחילת שיעור 5, בכיתה

במחשב של הכיתה יש עדיין את הקבצים מהשיעור, שלא עלו ל-GitHub. כדי לא להתנגש עם מה שהעליתן מהבית, **מתחילות נקי**:

1. ב-File Explorer, לשנות את שם התיקייה `devops-2027-shoplist` במחשב הכיתה ל-`devops-2027-shoplist-old`.
2. בטרמינל:
   ```shell
   git clone https://github.com/<שם-המשתמש-שלכן>/devops-2027-shoplist.git
   cd devops-2027-shoplist/docker
   docker compose up -d --build
   ```
3. `http://localhost:8080`: אותה אפליקציה כמו בבית.
