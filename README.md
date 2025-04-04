# Encurtador de URL

Aplicação simples de encurtamento de URLs criada com Next.js e MongoDB.

## Características

- Encurtamento de URLs longas
- Contador de cliques para cada URL encurtada
- Interface moderna e responsiva
- Armazenamento em MongoDB

## Requisitos

- Node.js 14.x ou superior
- Docker e Docker Compose

## Instalação

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd url-shortner
```

2. Instale as dependências
```bash
npm install
```

3. Inicie o MongoDB usando Docker
```bash
docker-compose up -d
```

4. Execute o aplicativo em modo de desenvolvimento
```bash
npm run dev
```

5. Acesse a aplicação em `http://localhost:3000`

## Uso

1. Digite ou cole uma URL longa no campo de entrada
2. Clique no botão "Encurtar URL"
3. A URL encurtada será exibida, pronta para ser copiada e compartilhada

## Estrutura do Projeto

- `pages/` - Páginas da aplicação (Next.js)
- `pages/api/` - Endpoints da API
- `models/` - Modelos Mongoose
- `lib/` - Utilitários e conexão com o banco de dados
- `public/` - Arquivos estáticos
- `styles/` - Estilos CSS

## Ambientes

- Desenvolvimento: `npm run dev`
- Produção: `npm run build && npm start`

## Licença

ISC 