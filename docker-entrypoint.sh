#!/bin/sh
set -e

# Esperar o MongoDB se tornar disponível
echo "Aguardando MongoDB ficar disponível..."
sleep 5

# Executar script de inicialização para criar o usuário admin
echo "Criando usuário administrador..."
node init-admin.js

# Iniciar o aplicativo Next.js
echo "Iniciando a aplicação..."
exec npm start 