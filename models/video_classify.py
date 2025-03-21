from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import cv2
from PIL import Image
from collections import Counter
import torchvision.transforms as transforms
import os
from flask_cors import CORS


app = Flask(__name__)

RESOLUTION = 224 

transformer = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5]),
    transforms.Resize((RESOLUTION, RESOLUTION))
])
num_classes = 8
class CrimeModelCNN(nn.Module):
    def __init__(self):
        super(CrimeModelCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 64, kernel_size=3, padding="same")
        self.leaky_relu = nn.LeakyReLU(0.1)
        self.max_pool1 = nn.MaxPool2d(2, 2)
        self.dropout1 = nn.Dropout(0.25)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding="same")
        self.max_pool2 = nn.MaxPool2d(2, 2)
        self.dropout2 = nn.Dropout(0.25)
        self.conv3 = nn.Conv2d(128, 256, kernel_size=3, padding="same")
        self.max_pool3 = nn.MaxPool2d(2, 2)
        self.dropout3 = nn.Dropout(0.4)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28 * 28 * 256, 256)
        self.dropout4 = nn.Dropout(0.5)

    def forward(self, x):
        x = self.conv1(x)
        x = self.leaky_relu(x)
        x = self.max_pool1(x)
        x = self.dropout1(x)
        x = self.conv2(x)
        x = self.leaky_relu(x)
        x = self.max_pool2(x)
        x = self.dropout2(x)
        x = self.conv3(x)
        x = self.leaky_relu(x)
        x = self.max_pool3(x)
        x = self.dropout3(x)
        x = self.flatten(x)
        x = self.fc1(x)
        x = self.leaky_relu(x)
        x = self.dropout4(x)
        return x
class CrimeModelLSTM(nn.Module):
    def __init__(self):
        super(CrimeModelLSTM, self).__init__()
        self.lstm1 = nn.LSTM(1, 8, batch_first=True, bidirectional=False)
        self.lstm2 = nn.LSTM(8, 8, batch_first=True, bidirectional=False)
        self.fc = nn.Linear(8, 4)
        self.dropout = nn.Dropout(0.2)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        x = x[:, -1, :]
        x = self.fc(x)
        x = self.dropout(x)
        return x
class CrimeModel(nn.Module):
    def __init__(self):
        super(CrimeModel, self).__init__()
        self.cnn = CrimeModelCNN()
        self.lstm = CrimeModelLSTM()
        self.fc = nn.Linear(260, 8) 

    def forward(self, x):
        x_cnn = x
        x_lstm = torch.reshape(x, (x.shape[0], RESOLUTION * RESOLUTION, 1))
        x_cnn = self.cnn(x_cnn)
        x_lstm = self.lstm(x_lstm)
        x_combined = torch.cat((x_cnn, x_lstm), dim=1)
        x = self.fc(x_combined)
        return x



def load_crime_model(checkpoint_path, device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = CrimeModel()
    model = nn.DataParallel(model)
    model.to(device)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint)
    
    model.to(device)
    model.eval()
    
    return model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# path="crime_model_epoch_5.pth"
# model = load_crime_model(path, device)

path = "models\crime_model_scripted.pt"
model = torch.jit.load(path, map_location=device)

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

@app.route('/predict', methods=['POST'])
def predict():
    
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files['video']
    temp_video_path = "-1l5631l3fg_0.avi"
    video_file.save(temp_video_path)
    
    predi = prediction(temp_video_path)
    
    os.remove(temp_video_path)
    
    return jsonify({
        "predicted_class": predi,
        
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    CORS(app)