#!/usr/bin/env python3
import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import whisper

    if len(sys.argv) < 3:
        json.dump({'error': 'Missing arguments'}, sys.stderr)
        sys.exit(1)

    audio_file = sys.argv[1]
    model_name = sys.argv[2]

    if not os.path.exists(audio_file):
        json.dump({'error': f'File not found: {audio_file}'}, sys.stderr)
        sys.exit(1)

    print(f"Loading {model_name} model...", file=sys.stderr, flush=True)
    model = whisper.load_model(model_name)

    print(f"Transcribing {audio_file}...", file=sys.stderr, flush=True)
    result = model.transcribe(audio_file)

    output = {
        'text': result['text'],
        'language': result.get('language', 'unknown'),
        'segments': result.get('segments', [])
    }

    print(json.dumps(output))

except Exception as e:
    json.dump({'error': str(e)}, sys.stderr)
    sys.exit(1)
