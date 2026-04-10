#!/bin/bash
# Auto-restart backend if it crashes
while true; do
  echo "[$(date)] Starting HackAI backend..."
  node server.js
  echo "[$(date)] Backend crashed. Restarting in 2 seconds..."
  sleep 2
done
