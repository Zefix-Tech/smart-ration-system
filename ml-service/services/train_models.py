import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.cluster import KMeans
import joblib
import os

# Ensure models directory exists
os.makedirs('../models', exist_ok=True)

print("Training Stock Prediction Model (Linear Regression)...")
df_stock = pd.read_csv('../datasets/ration_usage.csv')
X_stock = df_stock[['users_count']]
y_rice = df_stock['rice_used']
y_sugar = df_stock['sugar_used']
y_wheat = df_stock['wheat_used']

model_rice = LinearRegression().fit(X_stock, y_rice)
model_sugar = LinearRegression().fit(X_stock, y_sugar)
model_wheat = LinearRegression().fit(X_stock, y_wheat)

joblib.dump({
    'rice': model_rice,
    'sugar': model_sugar,
    'wheat': model_wheat
}, '../models/stock_prediction_model.pkl')
print("✅ Stock Prediction Model saved.")

print("Training Fraud Detection Model (Decision Tree)...")
df_fraud = pd.read_csv('../datasets/fraud_data.csv')
X_fraud = df_fraud[['user_requests_per_month', 'duplicate_attempt']]
y_fraud = df_fraud['fraud_label']

model_fraud = DecisionTreeClassifier(random_state=42).fit(X_fraud, y_fraud)
joblib.dump(model_fraud, '../models/fraud_detection_model.pkl')
print("✅ Fraud Detection Model saved.")

print("Training Usage Pattern Model (K-Means)...")
# Generating dummy time data for clustering (0-23 hours)
# Features: [Hour of day, transactions_count]
np.random.seed(42)
hours = np.random.randint(0, 24, 200)
transactions = [np.random.randint(50, 150) if 8 <= h <= 12 or 17 <= h <= 20 else np.random.randint(5, 30) for h in hours]
X_usage = pd.DataFrame({'hour': hours, 'transactions': transactions})

model_usage = KMeans(n_clusters=3, random_state=42).fit(X_usage)
joblib.dump(model_usage, '../models/usage_clustering_model.pkl')
print("✅ Usage Pattern clustering Model saved.")
print("All models trained successfully!")
