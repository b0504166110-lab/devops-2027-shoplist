# מדריך עזר: Docker Compose, YAML ו-Nginx

כל מה שצריך לשיעור 3, מסודר לפי נושא. הפקודות רצות **מהתיקייה שבה נמצא `docker-compose.yml`** (אצלנו: `docker`).

---

## 1. פקודות Docker Compose

| פקודה | מה היא עושה | מקבילה בשיעור 2 |
|---|---|---|
| `docker compose up` | בונה (אם צריך) ומרים את כל ה-services. הלוגים בחלון | כמה `docker run` |
| `docker compose up --build` | בונה מחדש את ה-images לפני שמרים | `docker build` + `docker run` |
| `docker compose up -d` | מרים ברקע ומחזיר את הטרמינל | `docker run -d` |
| `docker compose up -d --build backend` | בונה ומרים מחדש רק את backend | |
| `docker compose ps` | אילו services רצים, והאם הם healthy | `docker ps` |
| `docker compose logs` | הלוגים של כל ה-services | `docker logs` |
| `docker compose logs -f backend` | לוגים של service אחד, בזמן אמת (יציאה: Ctrl+C) | `docker logs -f` |
| `docker compose stop stats` | עוצר service אחד, בלי למחוק | `docker stop` |
| `docker compose start stats` | מפעיל שוב service עצור | `docker start` |
| `docker compose restart backend` | עוצר ומפעיל | `docker restart` |
| `docker compose exec postgres sh` | פותח טרמינל בתוך service שרץ | `docker exec -it` |
| `docker compose build` | רק בונה את ה-images, בלי להרים | `docker build` |
| `docker compose config` | מציג את הקובץ כמו ש-Compose מבין אותו, אחרי הצבת משתנים. **מצוין לבדיקת שגיאות YAML** | |
| `docker compose down` | עוצר ומוחק containers ורשת. **שומר volumes** | `docker rm -f` |
| `docker compose down -v` | כמו `down`, **ומוחק גם volumes, כלומר את הנתונים** | |

> **שמות:** Compose קורא ל-containers בשם `<תיקייה>-<service>-1`, למשל `docker-backend-1`. בפקודות `docker compose` משתמשים בשם ה-service בלבד: `backend`.

---

## 2. תחביר YAML בקצרה

```yaml
services:            # מפתח, ואחריו נקודתיים
  backend:           # מוזח ב-2 רווחים: שייך ל-services
    environment:     # מוזח עוד 2: שייך ל-backend
      DB_HOST: postgres          # מפתח: ערך
    ports:
      - "8080:80"                # מקף ורווח: פריט ברשימה
```

| כלל | דוגמה |
|---|---|
| ההזחה קובעת למי שייך מה | `environment` מתחת ל-`backend` שייך ל-backend |
| **רק רווחים, אף פעם לא Tab** | Tab גורם לשגיאה `found character that cannot start any token` |
| `מפתח: ערך`, עם רווח אחרי הנקודתיים | `DB_HOST: postgres`, לא `DB_HOST:postgres` |
| רשימה: מקף ורווח | `- backend` |
| פורטים בגרשיים | `"8080:80"`. בלי גרשיים YAML עלול לקרוא חלק מהמספרים לא נכון |
| הערה: `#` | `# זו הערה` |

**שגיאה ב-YAML?** `docker compose config` מראה בדיוק באיזו שורה.

---

## 3. מבנה של service

| מפתח | מה הוא אומר | דוגמה |
|---|---|---|
| `image` | להשתמש ב-image מוכן | `image: postgres:15-alpine` |
| `build: context:` | לבנות image מ-Dockerfile בתיקייה הזו (יחסית לקובץ) | `context: ../app/backend` |
| `build: dockerfile:` | Dockerfile בשם אחר בתוך ה-context (ברירת המחדל: `Dockerfile`) | `dockerfile: Dockerfile.dev` |
| `environment` | משתני סביבה, כמו `-e` | `DB_HOST: postgres` |
| `ports` | פורט במחשב : פורט ב-container, כמו `-p` | `- "8080:80"` |
| `volumes` | volume בשם או קובץ מהמחשב : נתיב ב-container | `- postgres-data:/var/lib/postgresql/data` |
| `depends_on` | מי צריך לעלות קודם | `- backend` |
| `depends_on` + `condition` | לחכות שהסרוויס יהיה healthy | `condition: service_healthy` |
| `healthcheck` | פקודה שבודקת אם הסרוויס מוכן | `test: ["CMD-SHELL", "pg_isready ..."]` |
| `restart` | מה לעשות כשה-container נופל | `restart: unless-stopped` |

**ובסוף הקובץ:** כל volume בשם מוצהר תחת `volumes:` ברמה העליונה.

---

## 4. volume בשם מול קובץ מהמחשב

| | volume בשם | קובץ מהמחשב (bind mount) |
|---|---|---|
| איך כותבים | `postgres-data:/var/lib/postgresql/data` | `./init.sql:/docker-entrypoint-initdb.d/init.sql` |
| איך מזהים | מתחיל בשם | מתחיל ב-`./` או `../` |
| איפה הנתונים | Docker מנהל אותם | בקובץ שלכן בריפו |
| מתי משתמשים | נתונים שנוצרים בזמן ריצה (מסד נתונים) | קבצים שכתבתן ורוצות להכניס ל-container |
| `docker volume ls` | מופיע | לא מופיע |

---

## 5. nginx.conf בקצרה

```nginx
server {
    listen 80;                         # הפורט בתוך ה-container

    location / {                       # כל בקשה שלא התאימה למשהו אחר
        root /usr/share/nginx/html;    # מגישים קבצים מכאן
        try_files $uri $uri/ /index.html;
    }

    location /api/stats {              # התאמה ארוכה יותר מנצחת
        proxy_pass http://stats:3000/stats;
    }

    location /api/ {
        proxy_pass http://backend:5000/;   # הלוכסן בסוף מוריד את /api/
    }
}
```

| בקשה מהדפדפן | location שנבחר | מה מגיע לסרוויס |
|---|---|---|
| `/` | `/` | הקובץ `index.html` |
| `/app.js` | `/` | הקובץ `app.js` |
| `/api/products` | `/api/` | `backend:5000/products` |
| `/api/products/3` | `/api/` | `backend:5000/products/3` |
| `/api/stats` | `/api/stats` | `stats:3000/stats` |

**שגיאות נפוצות של Nginx:**

| בלוג | מה זה אומר |
|---|---|
| `host not found in upstream "backend"` | Nginx לא מוצא service בשם הזה. רץ מחוץ ל-Compose, או שגיאת כתיב בשם |
| `502 Bad Gateway` בדפדפן | Nginx עובד, אבל הסרוויס שמאחוריו לא עונה |
| דף ברירת המחדל "Welcome to nginx!" | ה-`nginx.conf` שלכן לא הועתק, או image ישן. `docker compose up --build` |
