import sys
import numpy as np
import librosa
import joblib

def extract_mfcc(file_path, n_mfcc=13):
    audio, sr = librosa.load(file_path, sr=None)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfcc.T, axis=0)

if len(sys.argv) < 2:
    print("Usage: python main.py <audio_file.wav>")
    sys.exit(1)

audio_path = sys.argv[1]

# Load trained model + scaler
model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

# Extract features
features = extract_mfcc(audio_path)
features = features.reshape(1, -1)
features = scaler.transform(features)

# Predict
pred = model.predict(features)

if pred[0] == 0:
    print("Result: Normal voice")
else:
    print("Result: Vox senilis")
