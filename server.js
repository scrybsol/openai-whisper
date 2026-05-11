const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();

app.use(express.static('public'));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simulated transcription endpoint
app.post('/api/transcribe', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const modelSize = req.body.model || 'base';

    console.log(`Processing ${req.file.originalname} (${modelSize} model)...`);

    // Simulate processing delay
    setTimeout(() => {
      // Sample transcriptions to show variety
      const transcriptions = [
        "Hello, this is a test recording. The transcription service is working perfectly. You can now transcribe audio files or voice recordings.",
        "This is a demonstration of the Whisper transcriber. It can detect and convert speech to text accurately.",
        "Welcome to the audio transcription application. Record your voice or upload an audio file to get started.",
        "The quick brown fox jumps over the lazy dog. This is a sample transcription.",
        "Thank you for using the Whisper transcriber. Your audio has been processed successfully."
      ];

      // Pick a random transcription
      const text = transcriptions[Math.floor(Math.random() * transcriptions.length)];

      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        text: text,
        segments: [
          {
            id: 0,
            seek: 0,
            start: 0,
            end: text.split(' ').length,
            text: text,
            tokens: [],
            temperature: 0.0,
            avg_logprob: -0.5,
            compression_ratio: 1.2,
            no_speech_prob: 0.001
          }
        ],
        language: 'en'
      });
    }, 1500);

  } catch (error) {
    console.error('Error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: error.message || 'Processing failed'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
