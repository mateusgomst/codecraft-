# 1. Parar o servidor Flask anterior
pkill -f 'python3.*app.py'

# 2. Parar o servidor frontend anterior (se estiver rodando)
pkill -f 'python3.*http.server'

# 3. Aguardar 2 segundos
sleep 2

# 4. Iniciar backend
cd /Users/mateusgomes/Documents/CodeCraft/backend
python3 app.py &

# 5. Aguardar backend iniciar
sleep 3

# 6. Iniciar frontend (em outra aba do terminal)
cd /Users/mateusgomes/Documents/CodeCraft/front
python3 -m http.server 8000 &

echo "✅ Tudo pronto!"
echo "Frontend: http://localhost:8000"
echo "Backend: http://localhost:5001"
