import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

print("🚀 Step 1: Loading the new Real-World Dataset...")
df = pd.read_csv("apnidisha_mega_dataset.csv")

X = df[["R", "I", "A", "S", "E", "C", "Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"]]

y = df["career_cluster"]

print("🧠 Step 2: Training the AI Brain (Random Forest)...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X, y)

print("💾 Step 3: Saving the new smart brain...")
joblib.dump(rf_model, "apnidisha_model.pkl")

print("✅ SUCCESS! New 'apnidisha_model.pkl' created and ready for ApniDisha backend!")