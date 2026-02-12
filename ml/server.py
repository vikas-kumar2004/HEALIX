from flask import Flask, request
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)


@app.route("/predict", methods=["POST"])
def predict():
    file = request.files.get("file")
    if not file or not file.filename.endswith(".wav"):
        return "Only .wav file required", 400

    filepath = "temp.wav"
    file.save(filepath)

    try:
        result = subprocess.run(
            ["python", "main.py", filepath],
            capture_output=True,
            text=True
        )
        return result.stdout
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == "__main__":
    app.run(port=5000)
