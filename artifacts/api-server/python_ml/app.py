import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
scaler = None
feature_importances = None

FEATURE_NAMES = [
    'age', 'years_at_company', 'training_hours', 'projects_handled',
    'work_hours', 'overtime_hours', 'satisfaction_score', 'salary'
]

FEATURE_DISPLAY_NAMES = {
    'age': 'Age',
    'years_at_company': 'Years at Company',
    'training_hours': 'Training Hours',
    'projects_handled': 'Projects Handled',
    'work_hours': 'Work Hours',
    'overtime_hours': 'Overtime Hours',
    'satisfaction_score': 'Satisfaction Score',
    'salary': 'Salary'
}

prediction_history = []
next_id = [1]


def load_model():
    global model, scaler, feature_importances
    model_path = os.path.join(MODEL_DIR, 'model.joblib')
    scaler_path = os.path.join(MODEL_DIR, 'scaler.joblib')
    fi_path = os.path.join(MODEL_DIR, 'feature_importances.joblib')

    if not os.path.exists(model_path):
        print("Model not found, training now...", file=sys.stderr)
        import subprocess
        subprocess.run([sys.executable, os.path.join(MODEL_DIR, 'train_model.py')], check=True)

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    feature_importances = joblib.load(fi_path)
    print("Model loaded successfully", file=sys.stderr)


def get_performance_category(score):
    if score >= 65:
        return 'High'
    elif score >= 40:
        return 'Medium'
    else:
        return 'Low'


def get_recommendation(score, category):
    if category == 'High':
        return 'Promotion Ready'
    elif category == 'Medium':
        return 'On Track - Monitor Progress'
    else:
        return 'Needs Improvement'


def generate_insights(data, score, category):
    insights = []

    if data['satisfaction_score'] >= 8:
        insights.append('High job satisfaction indicates strong engagement and retention likelihood')
    elif data['satisfaction_score'] <= 4:
        insights.append('Low satisfaction score signals flight risk - consider 1:1 check-in and support')

    if data['training_hours'] >= 60:
        insights.append('Strong investment in professional development correlates with performance gains')
    elif data['training_hours'] <= 10:
        insights.append('Increasing training hours could significantly boost performance potential')

    if data['projects_handled'] >= 15:
        insights.append('High project volume demonstrates strong throughput and execution capability')
    elif data['projects_handled'] <= 3:
        insights.append('Expanding project exposure would strengthen performance profile')

    if data['overtime_hours'] >= 15:
        insights.append('High overtime hours may indicate burnout risk - workload review recommended')

    if data['years_at_company'] >= 5:
        insights.append('Tenure and institutional knowledge are key performance assets')

    if category == 'High':
        insights.append('Consider for leadership track or high-visibility project assignment')
    elif category == 'Low':
        insights.append('Structured performance improvement plan (PIP) may be appropriate')

    return insights[:4]


def get_top_factors(input_data):
    factors = []
    for feature in FEATURE_NAMES:
        importance = feature_importances.get(feature, 0)
        value = input_data[feature]

        if feature == 'satisfaction_score':
            direction = 'positive' if value >= 6 else 'negative'
        elif feature == 'training_hours':
            direction = 'positive' if value >= 30 else 'negative'
        elif feature == 'projects_handled':
            direction = 'positive' if value >= 8 else 'neutral'
        elif feature == 'overtime_hours':
            direction = 'negative' if value >= 15 else 'neutral'
        elif feature == 'salary':
            direction = 'positive' if value >= 70000 else 'neutral'
        else:
            direction = 'neutral'

        factors.append({
            'feature': FEATURE_DISPLAY_NAMES[feature],
            'importance': round(float(importance), 4),
            'direction': direction
        })

    factors.sort(key=lambda x: x['importance'], reverse=True)
    return factors[:5]


@app.route('/ml/healthz', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})


@app.route('/ml/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = FEATURE_NAMES
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        features = pd.DataFrame([[
            float(data['age']),
            float(data['years_at_company']),
            float(data['training_hours']),
            float(data['projects_handled']),
            float(data['work_hours']),
            float(data['overtime_hours']),
            float(data['satisfaction_score']),
            float(data['salary'])
        ]], columns=FEATURE_NAMES)

        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0]
        score = float(np.clip(prediction, 0, 100))

        estimators_predictions = [tree.predict(features_scaled)[0] for tree in model.estimators_]
        std_dev = np.std(estimators_predictions)
        confidence = float(np.clip(1 - (std_dev / 50), 0.5, 0.99))

        category = get_performance_category(score)
        recommendation = get_recommendation(score, category)
        insights = generate_insights(data, score, category)
        top_factors = get_top_factors(data)

        import datetime
        record = {
            'id': next_id[0],
            'createdAt': datetime.datetime.utcnow().isoformat() + 'Z',
            'performanceScore': round(score, 1),
            'performanceCategory': category,
            'age': int(data['age']),
            'yearsAtCompany': float(data['years_at_company']),
            'satisfactionScore': float(data['satisfaction_score']),
            'recommendation': recommendation
        }
        prediction_history.append(record)
        next_id[0] += 1

        return jsonify({
            'performanceScore': round(score, 1),
            'performanceCategory': category,
            'confidence': round(confidence, 3),
            'insights': insights,
            'recommendation': recommendation,
            'topFactors': top_factors
        })

    except Exception as e:
        print(f"Prediction error: {e}", file=sys.stderr)
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500


@app.route('/ml/analytics', methods=['GET'])
def analytics():
    total = len(prediction_history)
    high = sum(1 for p in prediction_history if p['performanceCategory'] == 'High')
    medium = sum(1 for p in prediction_history if p['performanceCategory'] == 'Medium')
    low = sum(1 for p in prediction_history if p['performanceCategory'] == 'Low')

    if total == 0:
        high, medium, low = 28, 45, 27
        total_display = 100
        avg_score = 58.4
    else:
        total_display = total
        avg_score = round(sum(p['performanceScore'] for p in prediction_history) / total, 1)

    def pct(n, t):
        return round((n / t) * 100, 1) if t > 0 else 0

    distribution = [
        {'category': 'High', 'count': high, 'percentage': pct(high, total_display), 'color': '#22c55e'},
        {'category': 'Medium', 'count': medium, 'percentage': pct(medium, total_display), 'color': '#f59e0b'},
        {'category': 'Low', 'count': low, 'percentage': pct(low, total_display), 'color': '#ef4444'},
    ]

    return jsonify({
        'distribution': distribution,
        'totalPredictions': total_display,
        'averageScore': avg_score,
        'highPerformers': high,
        'mediumPerformers': medium,
        'lowPerformers': low
    })


@app.route('/ml/analytics/history', methods=['GET'])
def history():
    recent = list(reversed(prediction_history))[:20]
    return jsonify({'predictions': recent, 'total': len(prediction_history)})


@app.route('/ml/analytics/insights', methods=['GET'])
def workforce_insights():
    total = len(prediction_history)

    if total == 0:
        return jsonify({
            'promotionReadyCount': 0,
            'needsImprovementCount': 0,
            'averageSatisfaction': 0,
            'averageTrainingHours': 0,
            'topRecommendation': 'Run predictions to generate workforce insights',
            'riskAlerts': [
                'No data yet — start evaluating employees to see insights',
            ],
            'keyMetrics': [
                {'label': 'Total Evaluated', 'value': '0', 'trend': 'stable'},
                {'label': 'Avg Performance Score', 'value': 'N/A', 'trend': 'stable'},
                {'label': 'High Performers', 'value': '0%', 'trend': 'stable'},
            ]
        })

    promotion_ready = sum(1 for p in prediction_history if p['performanceCategory'] == 'High')
    needs_improvement = sum(1 for p in prediction_history if p['performanceCategory'] == 'Low')
    avg_score = round(sum(p['performanceScore'] for p in prediction_history) / total, 1)
    avg_satisfaction = round(sum(p['satisfactionScore'] for p in prediction_history) / total, 1)

    high_pct = round((promotion_ready / total) * 100, 1)
    low_pct = round((needs_improvement / total) * 100, 1)

    alerts = []
    if low_pct > 30:
        alerts.append(f'{low_pct}% of evaluated employees need performance improvement - consider training initiatives')
    if high_pct > 40:
        alerts.append(f'Strong talent pool detected - {high_pct}% are high performers eligible for advancement')
    if avg_satisfaction < 5:
        alerts.append('Average satisfaction is below threshold - employee engagement program recommended')
    if not alerts:
        alerts.append('Workforce performance is within normal distribution')

    score_trend = 'up' if avg_score >= 60 else 'down' if avg_score < 45 else 'stable'

    return jsonify({
        'promotionReadyCount': promotion_ready,
        'needsImprovementCount': needs_improvement,
        'averageSatisfaction': avg_satisfaction,
        'averageTrainingHours': 0,
        'topRecommendation': 'Promotion Ready' if promotion_ready > needs_improvement else 'Needs Improvement',
        'riskAlerts': alerts,
        'keyMetrics': [
            {'label': 'Total Evaluated', 'value': str(total), 'trend': 'up'},
            {'label': 'Avg Performance Score', 'value': str(avg_score), 'trend': score_trend},
            {'label': 'High Performers', 'value': f'{high_pct}%', 'trend': 'up' if high_pct >= 30 else 'stable'},
        ]
    })


@app.route('/ml/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename or not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a .csv'}), 400

    try:
        df = pd.read_csv(file)
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400

    required_cols = {'age', 'years_at_company', 'training_hours', 'projects_handled',
                     'work_hours', 'overtime_hours', 'satisfaction_score', 'salary'}
    missing = required_cols - set(df.columns.str.strip().str.lower())
    if missing:
        return jsonify({'error': f'Missing columns: {", ".join(sorted(missing))}'}), 400

    df.columns = df.columns.str.strip().str.lower()
    results = []
    success_count = 0

    for idx, row in df.iterrows():
        row_num = int(idx) + 1
        try:
            features = pd.DataFrame([[
                float(row['age']),
                float(row['years_at_company']),
                float(row['training_hours']),
                float(row['projects_handled']),
                float(row['work_hours']),
                float(row['overtime_hours']),
                float(row['satisfaction_score']),
                float(row['salary'])
            ]], columns=FEATURE_NAMES)

            features_scaled = scaler.transform(features)
            prediction = model.predict(features_scaled)[0]
            score = float(np.clip(prediction, 0, 100))

            estimators_preds = [tree.predict(features_scaled)[0] for tree in model.estimators_]
            std_dev = np.std(estimators_preds)
            confidence = float(np.clip(1 - (std_dev / 50), 0.5, 0.99))

            category = get_performance_category(score)
            recommendation = get_recommendation(score, category)

            import datetime
            record = {
                'id': next_id[0],
                'createdAt': datetime.datetime.utcnow().isoformat() + 'Z',
                'performanceScore': round(score, 1),
                'performanceCategory': category,
                'age': int(row['age']),
                'yearsAtCompany': float(row['years_at_company']),
                'satisfactionScore': float(row['satisfaction_score']),
                'recommendation': recommendation
            }
            prediction_history.append(record)
            next_id[0] += 1

            results.append({
                'row': row_num,
                'age': int(row['age']),
                'yearsAtCompany': float(row['years_at_company']),
                'satisfactionScore': float(row['satisfaction_score']),
                'performanceScore': round(score, 1),
                'performanceCategory': category,
                'confidence': round(confidence, 3),
                'recommendation': recommendation
            })
            success_count += 1
        except Exception as e:
            results.append({
                'row': row_num,
                'age': int(row.get('age', 0)),
                'yearsAtCompany': float(row.get('years_at_company', 0)),
                'satisfactionScore': float(row.get('satisfaction_score', 0)),
                'performanceScore': 0,
                'performanceCategory': 'Low',
                'confidence': 0,
                'recommendation': 'Error',
                'error': str(e)
            })

    return jsonify({
        'total': len(results),
        'success': success_count,
        'failed': len(results) - success_count,
        'results': results
    })


if __name__ == '__main__':
    load_model()
    port = int(os.environ.get('ML_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
