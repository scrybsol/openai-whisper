#!/usr/bin/env python3
import sys
import json
import os

# Add current directory to path to import whisper from source
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import whisper
    
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Missing arguments'}), file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model_name = sys.argv[2]
    
    if not os.path.exists(audio_file):
        print(json.dumps({'error': f'File not found: {audio_file}'}), file=sys.stderr)
        sys.exit(1)
    
    # Load model and transcribe
    print(f"Loading {model_name} model...", file=sys.stderr)
    model = whisper.load_model(model_name)
    
    print(f"Transcribing {audio_file}...", file=sys.stderr)
    result = model.transcribe(audio_file)
    
    # Output result as JSON
    print(json.dumps({
        'text': result['text'],
        'language': result.get('language', 'unknown'),
        'segments': result.get('segments', [])
    }))
    
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
