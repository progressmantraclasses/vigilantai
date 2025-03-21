from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import cv2
from PIL import Image
from collections import Counter
import torchvision.transforms as transforms
import os

from huggingface_hub import hf_hub_download
import time
RESOLUTION = 224 

transformer = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5]),
    transforms.Resize((RESOLUTION, RESOLUTION))
])
num_classes = 8

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
scripted_model_path = "models\crime_model_scripted.pt"
model = torch.jit.load(scripted_model_path, map_location=device)
model.to(device)
model.eval()
from collections import Counter
def prediction(pth):
    frame_predictions = []
    cap = cv2.VideoCapture(pth)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
        Y_channel, _, _ = cv2.split(frame_yuv)
        pil_frame = Image.fromarray(Y_channel)
        input_tensor = transformer(pil_frame)
        input_tensor = input_tensor.unsqueeze(0) 
        with torch.no_grad():
            outputs = model(input_tensor.to(device))
            predicted = outputs.argmax(dim=1).item()
            frame_predictions.append(predicted) 
    cap.release()
    return Counter(frame_predictions).most_common(1)[0][0]
def preprocess_frame(frame):
    frame_yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
    Y_channel, _, _ = cv2.split(frame_yuv)
    pil_frame = Image.fromarray(Y_channel)
    input_tensor = transformer(pil_frame)
    return input_tensor.unsqueeze(0) 

def live_inference():
    
    cap = cv2.VideoCapture(0)  

    if not cap.isOpened():
        print("Error: Unable to access the webcam.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to retrieve frame from webcam.")
            break
        start_time = time.time()
        input_tensor = preprocess_frame(frame)
        with torch.no_grad():
            outputs = model(input_tensor.to(device))
            predicted = outputs.argmax(dim=1).item()
        inference_time = time.time() - start_time

        overlay_text = f"Pred: {predicted} | {inference_time:.2f}s"
        cv2.putText(frame, overlay_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (0, 255, 0), 2, cv2.LINE_AA)

        cv2.imshow("Live Inference - Press 'q' to exit", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    live_inference()