# תשובות — שיעורי בית 6

## 1. למה `shoplist-backend:local`, ומה היה קורה בלי `imagePullPolicy: Never`?

ה-Compose נתן ל-images שמות אוטומטיים (`docker-backend`) שתלויים בשם התיקייה, ובשביל Kubernetes רצינו שם קבוע ומפורש שנכתוב ב-`image:`. בלי `imagePullPolicy: Never`, עבור image עם תג `local`, Kubernetes היה מנסה להוריד אותו מ-registry באינטרנט, לא היה מוצא אותו (הוא קיים רק במחשב), והיה מקבל `ErrImagePull` / `ImagePullBackOff`.

## 2. פענוח `POSTGRES_PASSWORD` מה-Secret

```shell
kubectl get secret postgres-secret -n shoplist -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

יצא `shoppass`. כלומר base64 הוא קידוד ולא הצפנה: כל מי שמורשית לקרוא את ה-Secret מפענחת אותו בפקודה אחת. ההגנה האמיתית היא הרשאות (RBAC), הצפנה של etcd, וכלי ניהול סודות חיצוני.

## 3. למה המוצרים נשארו אחרי מחיקת ה-pod של postgres?

הקובץ `postgres-pvc.yml` (ה-PersistentVolumeClaim), שמחובר ל-`/var/lib/postgresql/data` דרך `postgres-deployment.yml`. ה-pod החדש מתחבר לאותו PVC. הפקודה שכן הייתה מוחקת את הנתונים: `kubectl delete pvc postgres-pvc -n shoplist`.

## 4. מה קורה אם ה-backend עולה לפני postgres, ומה מונע ממנו לקבל בקשות לפני שהוא מוכן?

ה-backend לא מצליח להתחבר למסד הנתונים, ה-readinessProbe שלו נכשל וה-pod נשאר `0/1`, ו-Kubernetes ממשיך לנסות עד שהכול עולה. אין סדר עלייה כמו `depends_on`. ה-readinessProbe הוא שדואג שה-Service לא ישלח בקשות ל-pod שעוד לא מוכן.

## 5. ד8: מה ראיתי, ולמה?

בדפדפן: הנורית של backend נהייתה אדומה, ולא ראיתי מוצרים וסטטיסטיקה. ה-pods של backend לא נפלו ונשארו `1/1 Running`, אבל `kubectl get endpoints backend` היה ריק. הסיבה: ה-selector של ה-Service חיפש pods עם `app: backnd`, ולאף pod אין את המדבקה הזו, ולכן ל-Service לא היו pods מאחוריו. ה-Service נוצר בלי שגיאה, אבל אין לו לאן לשלוח בקשות. אחרי התיקון ל-`app: backend` ה-endpoint חזר והנוריות ירוקות.

## 6. שיניתי ערך ב-`app-config` והרצתי `apply`, אבל ה-backend רואה את הערך הישן. למה, ומה הפתרון?

משתני סביבה נקראים רק כשה-pod עולה, ו-pod שכבר רץ לא מתעדכן כשה-ConfigMap משתנה. הפתרון: להפעיל מחדש את ה-pods עם `kubectl rollout restart deployment/backend -n shoplist`.

## 7. כמה פעמים כתבתי `shoplist` ב-12 הקבצים, וכמה קבצים נצטרך לשנות ל-`shoplist-test`?

שם ה-namespace כתוב ב-13 קבצים (12 קבצים עם `namespace: shoplist`, ועוד `namespace.yml` עצמו עם `name: shoplist`). המחרוזת `shoplist` מופיעה בסך הכול 18 פעמים, כי היא מופיעה גם בשם ה-image, בשם מסד הנתונים וכו'. כדי להריץ עותק שני ב-`shoplist-test` נצטרך לשנות את ה-namespace בכל 13 הקבצים ידנית. זה בדיוק מה ש-Helm יפתור בשיעור 7, עם ערך אחד שמוחלף בכל הקבצים.
