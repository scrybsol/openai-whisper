#!/usr/bin/env python3
import sys
import subprocess

# Install dependencies
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'flask'], check=False)

# Run the Flask app
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
from pathlib import Path

# Add current directory to path to import whisper
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import whisper

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads folder
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)

model = None

def load_model(model_name='base'):
    global model
    if model is None:
        model = whisper.load_model(model_name)
    return model

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        model_name = request.form.get('model', 'base')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Load model and transcribe
        model = load_model(model_name)
        result = model.transcribe(filepath)
        
        # Clean up
        os.remove(filepath)
        
        return jsonify({
            'text': result['text'],
            'segments': result['segments'],
            'language': result['language']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    return jsonify({
        'models': ['tiny', 'base', 'small', 'medium', 'large']
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
