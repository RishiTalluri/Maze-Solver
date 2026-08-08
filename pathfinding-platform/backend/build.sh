#!/usr/bin/env bash
# build.sh — Render build script for the backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
