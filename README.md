# URL Shortener

Aplicação de encurtamento de URLs com painel de controle para administradores e usuários.

## Executando com Docker

A maneira mais simples de executar esta aplicação é usando Docker e docker-compose. Siga os passos abaixo:

1. Clone o repositório
2. Execute o comando:

```bash
docker-compose up -d
```

A aplicação estará disponível em http://urlshortener

### Arquitetura de Containers

O sistema está configurado para ser executado com os seguintes containers:
- **MongoDB**: Banco de dados
- **Redis**: Sistema de cache para melhorar performance
- **App**: Aplicação Next.js
- **Nginx**: Servidor web que funciona como proxy reverso

O fluxo de requisições é:
```
Cliente → Nginx (porta 80) → Aplicação Next.js (porta 3000) → MongoDB/Redis
```

### Configuração do Domínio Local

Para acessar a aplicação usando o nome `urlshortener` ao invés de `localhost`, é necessário adicionar uma entrada no arquivo hosts do seu sistema:

```
127.0.0.1 urlshortener
```

#### Como editar o arquivo hosts:

**Windows:**
1. Abra o Bloco de Notas como administrador
2. Abra o arquivo: `C:\Windows\System32\drivers\etc\hosts`
3. Adicione a linha acima no final do arquivo
4. Salve o arquivo

**Linux/Mac:**
```bash
sudo nano /etc/hosts
```
1. Adicione a linha acima no final do arquivo
2. Pressione CTRL+O e ENTER para salvar
3. Pressione CTRL+X para sair

Após fazer essa configuração, reinicie os containers (se necessário) e acesse a aplicação em seu navegador usando:
```
http://urlshortener
```

### Nginx como Proxy Reverso

A aplicação utiliza o Nginx como proxy reverso, oferecendo as seguintes vantagens:
- **Segurança**: O Nginx atua como uma camada adicional de proteção
- **Performance**: Cache de conteúdo estático e compressão gzip
- **Escalabilidade**: Facilita a expansão do sistema no futuro

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
- Redis
- NextAuth.js
- TailwindCSS
- Chart.js (para visualização de estatísticas)
- Docker e Docker Compose
- Nginx

## Características

- Encurtamento de URLs longas
- Contador de cliques para cada URL encurtada
- Histórico detalhado de estatísticas para cada URL
- Interface moderna e responsiva
- Armazenamento em MongoDB
- Criação automatizada de usuário administrador na primeira execução
- Sistema de autenticação completo (registro, login, recuperação de senha)
- Painel administrativo para gerenciamento de usuários
- Opções de visibilidade: URLs públicas e privadas
- Filtros de visualização: Todas as URLs, Minhas URLs, URLs Públicas
- Função de cópia para área de transferência com feedback visual
- Funcionalidade de edição de URLs existentes
- Cache com Redis para melhorar a performance

## Funcionalidades Principais

### Gerenciamento de URLs
- Criação de URLs encurtadas com alias personalizados
- Configuração de visibilidade (pública/privada) para cada URL
- Edição de URLs existentes (alias, URL original e visibilidade)
- Exclusão de URLs

### Estatísticas
- Contagem total de cliques
- Histórico diário de acessos
- Gráficos de visualização de tendências

### Painel de Controle
- Filtros para visualização de URLs (Todas, Minhas, Públicas)
- Pesquisa por URL ou alias
- Ordenação por data, cliques ou código
- Paginação para facilitar a navegação

### Administração
- Gerenciamento completo de usuários
- Visualização de todas as URLs no sistema
- Capacidade de editar ou excluir URLs de qualquer usuário

### Segurança
- Proteção de URLs privadas (apenas o proprietário pode ver estatísticas)
- Autenticação via NextAuth
- Validação de formulários
- Sanitização de entradas

## Requisitos

- Node.js 14.x ou superior
- Docker e Docker Compose

## Instalação

1. Clone o repositório
```bash
git clone <seu-repositorio>
cd url-shortener
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
  - `pages/auth/` - Páginas de autenticação
  - `pages/admin/` - Painel administrativo
  - `pages/stats/` - Visualização de estatísticas de URLs
  - `pages/urls/` - Gerenciamento de URLs
- `components/` - Componentes reutilizáveis
- `models/` - Modelos Mongoose
- `lib/` - Utilitários, conexão com banco de dados e Redis
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
MONGODB_URI=mongodb://admin:password@mongodb:27017/urlshortener?authSource=admin

# Redis
REDIS_URI=redis://redis:6379

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