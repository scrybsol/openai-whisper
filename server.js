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

// Mock transcription for demo - returns sample text
app.post('/api/transcribe', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const modelSize = req.body.model || 'base';

    console.log(`Processing ${req.file.originalname} with model ${modelSize}...`);

    // Simulate transcription delay
    setTimeout(() => {
      const mockTranscriptions = [
        {
          text: "Hello, this is a test recording. The transcription service is working perfectly. You can now transcribe audio files or voice recordings.",
          language: "en"
        },
        {
          text: "This is another sample transcription. The Whisper model can detect and transcribe speech in multiple languages with high accuracy.",
          language: "en"
        },
        {
          text: "Welcome to the Whisper transcriber application. You can upload audio files or record voice notes to get accurate transcriptions.",
          language: "en"
        }
      ];

      const mockResult = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        text: mockResult.text,
        segments: [{ id: 0, seek: 0, start: 0, end: 10, text: mockResult.text, tokens: [], temperature: 0, avg_logprob: -0.5, compression_ratio: 1.2, no_speech_prob: 0.001 }],
        language: mockResult.language
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
