#!/bin/bash

echo "========================================================================"
echo "CO₂VISION - INICIALIZAÇÃO COMPLETA"
echo "========================================================================"
echo ""

# Parar processos anteriores
echo "🧹 Limpando processos anteriores..."
pkill -f 'python3.*app.py' 2>/dev/null
pkill -f 'python3.*http.server' 2>/dev/null
sleep 2

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"
echo ""

# Verificar arquivo de treino
if [ ! -f "data/treino/*.nc" ]; then
    echo "⚠️  ATENÇÃO: Arquivo de treino não encontrado em data/treino/"
    echo "   Coloque o arquivo 037.nc lá antes de processar."
fi

# Iniciar backend
echo "📡 Iniciando backend..."
cd backend
python3 app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd front
python3 -m http.server 8000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Aguardar frontend iniciar
sleep 2

echo ""
echo "========================================================================"
echo "✅ SISTEMA INICIADO COM SUCESSO!"
echo "========================================================================"
echo ""
echo "🌐 Frontend: http://localhost:8000"
echo "📡 Backend:  http://localhost:5001"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Para parar os servidores:"
echo "   ./STOP.sh"
echo ""
echo "   Ou manualmente:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "========================================================================"

# Salvar PIDs
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo ""
echo "Pressione Ctrl+C para parar tudo"
echo ""

# Aguardar Ctrl+C
trap './STOP.sh' INT
wait
