#!/bin/bash
# Download Whisper Tiny model from HuggingFace
# This script downloads the model files needed for offline transcription

MODEL_DIR="resources/models/whisper-tiny"
mkdir -p "$MODEL_DIR"

echo "Downloading Whisper Tiny model files..."

# Base URL for the model
BASE_URL="https://huggingface.co/Xenova/whisper-tiny/resolve/main"

# List of files to download
FILES=(
  "config.json"
  "generation_config.json"
  "merges.txt"
  "normalizer.json"
  "preprocessor_config.json"
  "tokenizer.json"
  "tokenizer_config.json"
  "vocab.json"
  "model.safetensors"
  "model_quantized.safetensors"
)

# Download each file
for file in "${FILES[@]}"; do
  echo "Downloading $file..."
  curl -L "$BASE_URL/$file" -o "$MODEL_DIR/$file"
  
  if [ $? -eq 0 ]; then
    echo "✓ Downloaded $file"
  else
    echo "✗ Failed to download $file"
  fi
done

echo ""
echo "Download complete! Model files are in: $MODEL_DIR"
echo "Total size:"
du -sh "$MODEL_DIR"
