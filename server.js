const express = require('express');
const path = require('path');
const multer = require('multer');
const { execSync } = require('child_process');
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

app.post('/api/transcribe', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const modelSize = req.body.model || 'base';
    const outputFormat = 'json';

    console.log(`Transcribing ${req.file.originalname} with model ${modelSize}...`);

    // Call whisper CLI
    const command = `cd ${__dirname} && python -m whisper "${filePath}" --model ${modelSize} --output_format ${outputFormat} --output_dir /tmp 2>&1`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    
    console.log('Whisper output:', output);

    // Read the JSON result
    const jsonFilePath = `/tmp/${path.basename(filePath)}.json`;
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error('Transcription output file not found');
    }

    const result = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Clean up
    fs.unlinkSync(filePath);
    fs.unlinkSync(jsonFilePath);

    res.json({
      text: result.text,
      segments: result.segments || [],
      language: result.language || 'unknown'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: error.message || 'Transcription failed. Make sure Whisper is installed with: pip install openai-whisper'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
