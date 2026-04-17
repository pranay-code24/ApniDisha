import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

print("Starting ApniDisha ML Model Evaluation...")

df = pd.read_csv("apnidisha_mega_dataset.csv")
X = df[["R", "I", "A", "S", "E", "C", "Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"]]
y = df["career_cluster"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training on {len(X_train)} profiles, Testing on {len(X_test)} unseen profiles...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
y_pred = rf_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print("\n" + "="*50)
print(f"OVERALL MODEL ACCURACY: {accuracy * 100:.2f}%")
print("="*50)

print("\n DETAILED CLASSIFICATION REPORT:")
print(classification_report(y_test, y_pred))


print("Generating Confusion Matrix...")
plt.figure(figsize=(12, 8))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=rf_model.classes_, 
            yticklabels=rf_model.classes_,
            linewidths=1, linecolor='white')

plt.title('AI Brain Accuracy: Confusion Matrix', fontsize=16, fontweight='bold', pad=20)
plt.ylabel('Actual Career Cluster (Real Data)', fontsize=12, fontweight='bold')
plt.xlabel('Predicted Career Cluster (AI Output)', fontsize=12, fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('model_confusion_matrix.png', dpi=300)
plt.close()

print("🎨 Generating Feature Importance Graph...")
plt.figure(figsize=(10, 6))

importances = rf_model.feature_importances_
indices = np.argsort(importances)[::-1]
features = X.columns

sns.barplot(x=importances[indices], y=features[indices], hue=features[indices], palette='magma', legend=False)

plt.title('Psychological Trait Importance in Career Prediction', fontsize=16, fontweight='bold')
plt.xlabel('Importance Score (Weightage given by AI)', fontsize=12)
plt.ylabel('Psychometric Trait', fontsize=12)
plt.tight_layout()
plt.savefig('model_feature_importance.png', dpi=300)
plt.close()

print("SUCCESS! Two HD graphs have been saved in the folder:")