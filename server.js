const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
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

// Real transcription using whisper Python module
app.post('/api/transcribe', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const modelSize = req.body.model || 'base';
    const outputDir = '/tmp/whisper_output';

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Transcribing ${req.file.originalname} with model ${modelSize}...`);

    // Run whisper using Python module
    const pythonProcess = spawn('python3', [
      '-m', 'whisper',
      filePath,
      '--model', modelSize,
      '--output_format', 'json',
      '--output_dir', outputDir
    ]);

    let stderr = '';
    let stdout = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('Whisper stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      try {
        // Clean up input file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (code !== 0) {
          console.error('Whisper failed with code', code, stderr);
          return res.status(500).json({
            error: 'Transcription failed. Ensure Whisper is installed: pip install openai-whisper'
          });
        }

        // Read the JSON output
        const outputFile = path.join(outputDir, path.basename(filePath) + '.json');
        if (!fs.existsSync(outputFile)) {
          return res.status(500).json({ error: 'Transcription output not found' });
        }

        const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

        // Clean up output file
        fs.unlinkSync(outputFile);

        res.json({
          text: result.text,
          segments: result.segments || [],
          language: result.language || 'unknown'
        });
      } catch (err) {
        console.error('Error processing result:', err);
        res.status(500).json({ error: err.message });
      }
    });

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
