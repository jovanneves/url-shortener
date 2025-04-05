# URL Shortner

Aplicação de encurtamento de URLs com painel de controle para administradores e usuários.

## Executando com Docker

A maneira mais simples de executar esta aplicação é usando Docker e docker-compose. Siga os passos abaixo:

1. Clone o repositório
2. Execute o comando:

```bash
docker-compose up -d
```

A aplicação estará disponível em http://localhost:3000

## Acesso Inicial

Um usuário administrador é criado automaticamente na primeira execução da aplicação:

- Email: admin@sistema.com
- Senha: @dm1n

Use estas credenciais para fazer o primeiro acesso ao sistema como administrador.

### Personalização do Usuário Administrador

É possível personalizar o email e senha do administrador através de variáveis de ambiente:

1. Modificando diretamente no arquivo `docker-compose.yml`:
```yaml
environment:
  - ADMIN_EMAIL=seu.email@dominio.com
  - ADMIN_PASSWORD=sua_senha
```

2. Criando um arquivo `.env` com os valores desejados:
```
ADMIN_EMAIL=seu.email@dominio.com
ADMIN_PASSWORD=sua_senha
```

3. Passando as variáveis via linha de comando:
```bash
ADMIN_EMAIL=seu.email@dominio.com ADMIN_PASSWORD=sua_senha docker-compose up -d
```

## Inicialização Automatizada

A aplicação está configurada com um processo de inicialização automatizado que:

1. Aguarda o MongoDB ficar disponível
2. Executa o script de criação do usuário administrador
3. Inicia a aplicação Next.js

Este processo é controlado pelos seguintes arquivos:

- `init-admin.js`: Script que verifica se já existe um usuário administrador e, caso não exista, cria um novo
- `docker-entrypoint.sh`: Script de inicialização que orquestra o processo
- `Dockerfile`: Configurado para usar o script de inicialização como ponto de entrada

## Desenvolvimento

Para executar a aplicação em modo de desenvolvimento:

```bash
npm install
npm run dev
```

## Tecnologias Utilizadas

- Next.js
- MongoDB
- NextAuth.js
- TailwindCSS
- Docker

## Características

- Encurtamento de URLs longas
- Contador de cliques para cada URL encurtada
- Interface moderna e responsiva
- Armazenamento em MongoDB
- Criação automatizada de usuário administrador na primeira execução

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
- `init-admin.js` - Script para inicialização do usuário admin
- `docker-entrypoint.sh` - Script de inicialização para o container Docker

## Arquivos de Configuração

- `Dockerfile` - Configuração para build da imagem Docker
- `docker-compose.yml` - Configuração dos serviços Docker (app e MongoDB)
- `.env.example` - Exemplo de variáveis de ambiente necessárias

## Variáveis de Ambiente

As seguintes variáveis de ambiente podem ser configuradas:

```
# MongoDB
MONGODB_URI=mongodb://admin:password@mongodb:27017/urlshortner?authSource=admin

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin User (primeira execução)
ADMIN_EMAIL=admin@sistema.com
ADMIN_PASSWORD=@dm1n
```

## Ambientes

- Desenvolvimento: `npm run dev`
- Produção: `npm run build && npm start`

## Licença

ISC 