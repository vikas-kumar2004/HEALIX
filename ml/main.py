import sys
import numpy as np
import librosa
import joblib
import os

def extract_mfcc(file_path, n_mfcc=13):
    audio, sr = librosa.load(file_path, sr=None)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfcc.T, axis=0)

if len(sys.argv) < 2:
    print("Usage: python main.py <audio_file.wav>")
    sys.exit(1)

audio_path = sys.argv[1]

# Load trained model + scaler
if not os.path.exists("model.pkl") or not os.path.exists("scaler.pkl"):
    print("Error: model.pkl or scaler.pkl not found.")
    print("Please run the training notebook first to generate these files.")
    exit(1)

model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")


try:
    features = extract_mfcc(audio_path)
except Exception as e:
    print("Error loading audio file.")
    print("Please provide a valid .wav file.")
    exit(1)

features = features.reshape(1, -1)
features = scaler.transform(features)

# Predict
pred = model.predict(features)

if pred[0] == 0:
    print("Result: Normal voice")
else:
    print("Result: Vox senilis")
