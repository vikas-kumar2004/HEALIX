# Voice Classification using MFCC + SVM

This project implements a binary voice classification system to distinguish between **Normal** and **Vox Senilis** voices using **MFCC features** and an **SVM classifier**.

The pipeline includes audio preprocessing, feature extraction, supervised model training, evaluation, and inference on unseen audio.

---

## Overview

Pipeline:

Voice (.wav)  
→ MFCC feature extraction  
→ Feature scaling  
→ SVM training  
→ Evaluation  
→ Prediction on unknown voice  

---

## Methodology

- Feature Extraction: MFCC (13 coefficients)
- Classifier: Support Vector Machine (RBF kernel)
- Learning Type: Supervised Learning
- Train/Test Split: 80% / 20%
- Feature Scaling: StandardScaler

Labels:
- Normal → 0  
- Vox Senilis → 1  

---

## Results (Baseline Model)

- Accuracy: ~87%
- Vox Senilis F1-score: ~0.84

Confusion Matrix (example):

- True Normal: 103  
- False Vox: 9  
- False Normal: 15  
- True Vox: 64  

Performance on real-world audio may vary due to dataset mismatch and limited training data.

---

## Project Structure

├── datasets/ # NOT included in repo (see below)
├── notebooks/
│ └── voice-processing.ipynb
├── main.py
├── requirements.txt
└── .gitignore


---

## Dataset

Dataset is not included in this repository.

Please download separately and place as:

datasets/
├── Normal/
└── Vox senilis/

Each folder should contain `.wav` files.

---

## Running the Notebook

1. Install dependencies:

```bash
pip install -r requirements.txt

2. Open:
notebooks/voice-processing.ipynb and run the cells in the order.

```
Run the notebook to generate model.pkl and scaler.pkl

## Limitations

- Dataset recorded under controlled conditions
- Real-world audio may reduce accuracy (domain shift)
- MFCC dimension currently minimal (13)

## Future Improvements

- Increase MFCC dimensions (e.g., 30–40)
- Add delta MFCC features
- Hyperparameter tuning (C, gamma)
- Class balancing
- Multiclass classification
- Deep learning models (CNN)