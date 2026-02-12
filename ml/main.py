import sys
import numpy as np
import librosa
import joblib
import os
from librosa.util.exceptions import ParameterError

def extract_mfcc(file_path, n_mfcc=13):
    audio, sr = librosa.load(file_path, sr=None)

    if len(audio) == 0:
        return np.zeros(n_mfcc)

    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)

    if mfcc.shape[1] == 0:
        return np.zeros(n_mfcc)

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

except FileNotFoundError as e:
    print(f"File not found: {e}")
    exit(1)

except ParameterError as e:
    print(f"Invalid audio file: {e}")
    exit(1)

except ValueError as e:
    print(f"Value error while processing audio: {e}")
    exit(1)


# Predict
features = features.reshape(1,-1)
pred = model.predict(features)

if pred[0] == 0:
    print("Result: Normal voice")
else:
    print("Result: Vox senilis")
