import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

np.random.seed(42)
n_samples = 2000

# Generate features based on new HR_Analytics columns
age = np.random.randint(22, 62, n_samples)
years_at_company = np.clip(np.random.randint(0, 30, n_samples), 0, age - 22)
monthly_income = np.random.randint(30000, 150000, n_samples)
total_working_years = np.clip(np.random.randint(0, 40, n_samples), years_at_company, age - 20)
training_times_last_year = np.random.randint(0, 7, n_samples)
distance_from_home = np.random.randint(1, 30, n_samples)
job_satisfaction = np.random.randint(1, 5, n_samples) # 1 to 4
percent_salary_hike = np.random.randint(11, 26, n_samples)

# Calculate a continuous raw score
raw_score = (
    0.25 * (job_satisfaction / 4) * 5 +
    0.20 * ((percent_salary_hike - 10) / 15) * 5 +
    0.15 * (training_times_last_year / 6) * 5 +
    0.15 * (monthly_income / 150000) * 5 +
    0.10 * (total_working_years / 40) * 5 +
    0.05 * (years_at_company / 30) * 5 +
    0.05 * (1 - (distance_from_home / 30)) * 5 +
    0.05 * (age / 62) * 5
)

# Add some noise to make it realistic
raw_score += np.random.normal(0, 0.5, n_samples)
raw_score = np.clip(raw_score, 1.0, 5.0)

# Convert into classes (Low: 0, Medium: 1, High: 2)
# Low (1.0 - 2.5), Medium (2.5 - 3.8), High (3.8 - 5.0)
target_class = np.select(
    [raw_score < 2.5, (raw_score >= 2.5) & (raw_score < 3.8), raw_score >= 3.8],
    [0, 1, 2],
    default=0
)

data = pd.DataFrame({
    'age': age,
    'years_at_company': years_at_company,
    'monthly_income': monthly_income,
    'total_working_years': total_working_years,
    'training_times_last_year': training_times_last_year,
    'distance_from_home': distance_from_home,
    'job_satisfaction': job_satisfaction,
    'percent_salary_hike': percent_salary_hike,
    'performance_score': target_class
})

data.dropna(inplace=True)

feature_cols = [
    'age', 'years_at_company', 'monthly_income', 'total_working_years',
    'training_times_last_year', 'distance_from_home', 'job_satisfaction', 'percent_salary_hike'
]

X = data[feature_cols]
y = data['performance_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Use Classifier with balanced class weight!
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

model_dir = os.path.dirname(os.path.abspath(__file__))
joblib.dump(model, os.path.join(model_dir, 'model.joblib'))
joblib.dump(scaler, os.path.join(model_dir, 'scaler.joblib'))

feature_importances = dict(zip(feature_cols, model.feature_importances_))
joblib.dump(feature_importances, os.path.join(model_dir, 'feature_importances.joblib'))

print("Classification Model trained and saved successfully")
X_test_scaled = scaler.transform(X_test)
y_pred = model.predict(X_test_scaled)
auth_acc = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {auth_acc:.4f}")
print("Classification Report:\n", classification_report(y_test, y_pred))
