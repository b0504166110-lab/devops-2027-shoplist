# שיעור 7: Helm — ShopList באריזה אחת

## מה לומדות בשיעור

- למה Helm קיים: 12 קבצים, וכל ערך כתוב ביד
- chart, values ו-release: העיצוב, טופס הפרטים, וההזמנות של זוג מסוים
- להפוך YAML רגיל לתבנית: `{{ .Values... }}`, `{{ .Release.Namespace }}`, והצינור `| b64enc`
- `helm lint` ו-`helm template`: לראות מה יותקן, לפני שמתקינים
- `install`, `upgrade`, `history`, `rollback` ו-`uninstall`: החיים של release
- מי מנצח: `values.yaml`, קובץ `-f`, או `--set`
- מה קורה ל-PVC ב-`uninstall`, ואיך שומרים עליו

## התרגילים בשיעור

1. stats ו-frontend: להשלים את החורים לבד (10 דקות)
2. מחזור חיים שלם: install, upgrade, לשבור, rollback ו-uninstall, על release שלישי (15 דקות)

## שיעורי בית

[homework.md](homework.md): **מסמך דרישות.** לבנות בבית את ה-chart של ShopList, להתקין אותו, לעדכן, לשבור ולחזור אחורה. הגשה ב-push מהבית, לפני שיעור 8.

## הקבצים בתיקייה

| קובץ | מה יש בו |
|---|---|
| [guide.md](guide.md) | מדריך: מושגים, וכל ה-chart שלב אחר שלב |
| [homework.md](homework.md) | **שיעורי בית** |
