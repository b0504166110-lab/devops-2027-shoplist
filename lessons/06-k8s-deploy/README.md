# שיעור 6: ShopList ב-Kubernetes

## מה לומדות בשיעור

- איך כל חלק בקובץ ה-Compose הופך למשאב ב-Kubernetes
- labels ו-selectors: איך Deployment ו-Service מוצאים את ה-pods שלהם
- ConfigMap ו-Secret, ולמה base64 הוא לא הצפנה
- PersistentVolumeClaim: ארונית שנשארת גם כשה-pod נמחק
- readinessProbe: מתי pod מוכן לקבל בקשות, ולמה אין `depends_on`
- כותבות יחד 12 קבצי YAML, ומריצות את כל ShopList ב-cluster

## התרגילים בשיעור

1. לבנות את שלושת ה-images עם השמות שלנו (5 דקות)
2. stats ו-frontend לבד, לפי התבנית של ה-backend (15 דקות)
3. בודקות: המוצרים שורדים, המטבח מתקן לבד, ו-`replicas: 3` דרך הקובץ (10 דקות)

## שיעורי בית

[homework.md](homework.md): **מסמך דרישות.** להשלים בבית את כל 12 הקבצים, להריץ את ShopList ב-Kubernetes ב-`localhost:30080`, להעביר הגדרות ל-ConfigMap, ולמצוא ולתקן תקלה. הגשה ב-push מהבית, לפני שיעור 7.

## הקבצים בתיקייה

| קובץ | מה יש בו |
|---|---|
| [guide.md](guide.md) | מדריך: מושגים, וכל הקבצים שלב אחר שלב |
| [homework.md](homework.md) | **שיעורי בית** |
