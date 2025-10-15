#!/bin/bash

echo "🛑 Parando servidores CO₂Vision..."

# Parar por PID
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null
    rm backend.pid
fi

if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null
    rm frontend.pid
fi

# Parar por nome do processo (fallback)
pkill -f 'python3.*app.py' 2>/dev/null
pkill -f 'python3.*http.server' 2>/dev/null

echo "✅ Servidores parados!"
