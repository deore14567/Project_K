#!/usr/bin/env bash
# Regenerate the static Tailwind CSS file.
# Run this after adding new Tailwind classes to HTML/JS files.
set -e

cd "$(dirname "$0")/.."
echo "Building Tailwind CSS..."
./node_modules/.bin/tailwindcss -i ./frontend/css/tailwind-input.css -o ./frontend/css/tailwind.css --minify
echo "Done. Output: frontend/css/tailwind.css ($(wc -c < frontend/css/tailwind.css) bytes)"
