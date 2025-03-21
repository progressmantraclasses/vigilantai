import streamlit as st
import requests
import tempfile
import os

API_URL = "http://192.168.29.76:5000"  # Use the actual Flask IP
 # Change this if Flask API is hosted elsewhere

def classify_video(video_file):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".avi") as temp_video:
        temp_video.write(video_file.read())
        temp_video_path = temp_video.name
    
    with open(temp_video_path, 'rb') as f:
        files = {'video': f}
        response = requests.post(f"{API_URL}/predict", files=files)  # Add `/predict`
    
    os.remove(temp_video_path)  # Cleanup after sending request
    
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Failed to get prediction"}


st.title("Crime Classification from Video")
st.write("Upload a video file and get a predicted class.")

uploaded_file = st.file_uploader("Upload Video", type=["avi", "mp4", "mov"])

if uploaded_file is not None:
    st.video(uploaded_file)
    
    if st.button("Classify Video"):
        with st.spinner("Classifying..."):
            result = classify_video(uploaded_file)
            st.write("### Prediction Result")
            st.json(result)
