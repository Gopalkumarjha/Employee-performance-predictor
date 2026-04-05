import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

np.random.seed(42)
n_samples = 2000

age = np.random.randint(22, 62, n_samples)
years_at_company = np.clip(np.random.randint(0, 30, n_samples), 0, age - 22)
training_hours = np.random.randint(0, 120, n_samples)
projects_handled = np.random.randint(1, 25, n_samples)
work_hours = np.random.randint(35, 60, n_samples)
overtime_hours = np.random.randint(0, 25, n_samples)
satisfaction_score = np.round(np.random.uniform(1, 10, n_samples), 1)
salary = np.random.randint(30000, 150000, n_samples)

performance_score = (
    0.20 * (satisfaction_score / 10) * 100 +
    0.15 * (projects_handled / 25) * 100 +
    0.15 * (training_hours / 120) * 100 +
    0.12 * (years_at_company / 30) * 100 +
    0.10 * (salary / 150000) * 100 +
    0.10 * ((work_hours - 35) / 25) * 100 +
    0.08 * (age / 62) * 100 +
    0.10 * np.random.uniform(0, 1, n_samples) * 100
)

performance_score = np.clip(performance_score, 0, 100)

data = pd.DataFrame({
    'age': age,
    'years_at_company': years_at_company,
    'training_hours': training_hours,
    'projects_handled': projects_handled,
    'work_hours': work_hours,
    'overtime_hours': overtime_hours,
    'satisfaction_score': satisfaction_score,
    'salary': salary,
    'performance_score': performance_score
})

data.dropna(inplace=True)

feature_cols = ['age', 'years_at_company', 'training_hours', 'projects_handled',
                'work_hours', 'overtime_hours', 'satisfaction_score', 'salary']

X = data[feature_cols]
y = data['performance_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

model_dir = os.path.dirname(os.path.abspath(__file__))
joblib.dump(model, os.path.join(model_dir, 'model.joblib'))
joblib.dump(scaler, os.path.join(model_dir, 'scaler.joblib'))

feature_importances = dict(zip(feature_cols, model.feature_importances_))
joblib.dump(feature_importances, os.path.join(model_dir, 'feature_importances.joblib'))

print("Model trained and saved successfully")
X_test_scaled = scaler.transform(X_test)
score = model.score(X_test_scaled, y_test)
print(f"Model R² score: {score:.4f}")
