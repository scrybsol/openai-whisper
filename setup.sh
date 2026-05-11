#!/bin/bash
set -e

echo "Installing Node dependencies..."
npm install --force

echo "Installing Python Whisper library..."
pip install -e . -q

echo "Setup complete!"
