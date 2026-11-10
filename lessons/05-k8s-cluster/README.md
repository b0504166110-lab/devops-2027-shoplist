# שיעור 5: Kubernetes. מה זה cluster, ואיך מריצים אחד על המחשב

## מה לומדות בשיעור

- מה Docker Compose לא פותר, ולמה צריך Kubernetes
- declarative ולולאת הבקרה: "ככה זה צריך להיות", והמערכת דואגת
- מה זה cluster: ההנהלה (control plane) והמטבחים (nodes), ומי עושה מה
- אוצר מילים: Pod, Deployment, Service, Namespace
- להפעיל cluster מקומי ב-Docker Desktop, ולעבוד איתו עם kubectl
- מה ההבדל בין cluster מקומי ל-cluster בענן

## התרגילים בשיעור

1. מצאו את ההנהלה: רכיבי ה-cluster ב-`kube-system` (10 דקות)
2. הזמנה קבועה ועוגה בודדת: Deployment, מחיקת pod, scale, expose, ו-image שלנו ב-cluster (15 דקות)

## שיעורי בית

[homework.md](homework.md): מפת ה-cluster, תרחישים, וקובצי ה-YAML הראשונים ל-greeter. בבית, עם Kubernetes של Docker Desktop: כותבות, מריצות ובודקות שעובד, ואז push.

## הקבצים בתיקייה

| קובץ | מה יש בו |
|---|---|
| [guide.md](guide.md) | מדריך: מושגים, הפעלת ה-cluster, ושלב אחר שלב |
| [homework.md](homework.md) | **שיעורי בית** |
