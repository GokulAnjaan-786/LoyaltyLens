import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle
import os

# 1. Generate Synthetic Data (Food Delivery Context)
def generate_data(n_samples=500):
    np.random.seed(42)
    
    # Context Mapping:
    # login_days -> Order Frequency (Days/Month)
    # hours_spent -> Avg Order Value ($)
    # support_tickets -> Delivery Complaints
    
    cities = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
        "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", 
        "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", 
        "Coimbatore", "Trichy", "Madurai", "Kochi", "Mysore", "Gurgaon", "Noida"
    ]
    
    data = {
        'customer_id': np.arange(1001, 1001 + n_samples),
        'login_days': np.random.randint(1, 25, n_samples), # 1 to 25 orders a month
        'hours_spent': np.random.randint(20, 150, n_samples), # $20 to $150 Avg Order Value
        'support_tickets': np.random.randint(0, 5, n_samples), # 0 to 5 complaints
        'subscription_type': np.random.choice(['Free', 'Basic', 'Premium'], n_samples, p=[0.6, 0.3, 0.1]),
        'joining_date': pd.date_range(start='2024-01-01', periods=n_samples, freq='h').normalize(),
        'City': np.random.choice(cities, n_samples),
        'industry_type': np.random.choice(['Food Delivery', 'E-commerce', 'Education'], n_samples, p=[0.7, 0.2, 0.1]),
        # New columns for advanced analysis
        'orders_count': np.random.randint(1, 20, n_samples),
        'avg_delivery_delay_mins': np.random.randint(10, 60, n_samples),
        'app_rating': np.random.uniform(1.0, 5.0, n_samples).round(1)
    }
    
    df = pd.DataFrame(data)
    
    # Randomize dates a bit more to spread them out over months
    df['joining_date'] = np.random.choice(pd.date_range(start='2024-01-01', end='2024-12-31'), n_samples)

    
    # Logic to simulate churn (Food Delivery Specific)
    # Higher churn probability if:
    # - Low Order Frequency (login_days)
    # - High Complaints (support_tickets) - CRITICAL for food
    # - Low App Rating
    # - High Delivery Delay
    
    churn_prob = np.zeros(n_samples)
    
    # Add weights to probability
    churn_prob += (25 - df['login_days']) * 0.02   # Less orders -> more churn
    churn_prob += (150 - df['hours_spent']) * 0.002 # (Weak factor) Low spend -> slightly more churn
    churn_prob += df['support_tickets'] * 0.15     # HIGH SENSITIVITY: Complaints drive away food users fast
    churn_prob += (df['avg_delivery_delay_mins'] - 30) * 0.005 # Delay > 30 mins increases churn
    churn_prob += (5 - df['app_rating']) * 0.1 # Low rating increases churn
    
    # Subscription factor
    churn_prob += np.where(df['subscription_type'] == 'Free', 0.2, 0) # No loyalty program -> higher churn
    churn_prob += np.where(df['subscription_type'] == 'Basic', 0.1, 0)
    # Premium (Gold/Pro) -> Low churn risk
    
    # Location Bias (Simulate some cities having higher churn)
    # e.g. Chennai high churn, Bangalore low
    churn_prob += np.where(df['City'] == 'Chennai', 0.15, 0)
    churn_prob += np.where(df['City'] == 'Bangalore', -0.1, 0)
    
    # Normalize and create binary target (Clip to 0-1)
    churn_prob = np.clip(churn_prob, 0, 1)
    
    # Add some randomness noise
    churn_prob = (churn_prob + np.random.uniform(0, 0.2, n_samples)) / 1.2
    
    df['churn'] = np.random.binomial(1, churn_prob)
    
    return df

print("🍔 Generating synthetic Food Delivery App data with Location intelligence...")
df = generate_data()

# Save sample data for user to upload later
if not os.path.exists('data'):
    os.makedirs('data')
df.to_excel('data/sample_upload.xlsx', index=False)
print("✅ Saved 'data/sample_upload.xlsx' with Cities and Industry types!")

# 2. Preprocessing
# Encode Subscription Type: Free=0, Basic=1, Premium=2
sub_mapping = {'Free': 0, 'Basic': 1, 'Premium': 2}
df['subscription_type'] = df['subscription_type'].map(sub_mapping)

# Drop date for training
# Note: We do NOT use City in the simple model yet, keeping it rule-based or visual only for now
X = df[['login_days', 'hours_spent', 'support_tickets', 'subscription_type']]
y = df['churn']

# 3. Train Model
print("🧠 Training Logistic Regression Model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"🎯 Model Accuracy: {score:.2f}")

# 4. Save Model
if not os.path.exists('model'):
    os.makedirs('model')

with open('model/churn_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("💾 Model saved to 'model/churn_model.pkl'")
print("🚀 Setup Complete! You can now run 'streamlit run app.py'")
