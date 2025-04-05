# Imagem base com Node.js
FROM node:18-alpine

# Diretório de trabalho no container
WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar o resto do código fonte
COPY . .

# Buildar a aplicação Next.js
RUN npm run build

# Expor a porta que a aplicação usará
EXPOSE 3000

# Script de inicialização
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Comando para iniciar a aplicação
ENTRYPOINT ["/docker-entrypoint.sh"]