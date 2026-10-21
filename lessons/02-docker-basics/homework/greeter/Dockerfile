# image בסיס: פייתון 3.11 בגרסה קטנה
FROM python:3.11-slim

# תיקיית העבודה בתוך ה-container
WORKDIR /app

# מעתיקים קודם רק את רשימת הספריות, כדי שה-cache יעבוד
COPY requirements.txt .

# מתקינים את הספריות (Flask)
RUN pip install --no-cache-dir -r requirements.txt

# רק עכשיו מעתיקים את הקוד
COPY app.py .

# תיעוד: השרת מאזין בפורט 8000
EXPOSE 8000

# הפקודה שמפעילה את השרת כשה-container עולה
CMD ["python", "app.py"]
