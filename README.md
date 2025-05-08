# URL Shortener

Aplicação de encurtamento de URLs com painel de controle para administradores e usuários.

## Funcionalidades

- Encurtamento de URLs com código personalizado
- Painel de controle para usuários e administradores
- Estatísticas de acesso às URLs
- URLs públicas e privadas
- Sistema de cache com Redis
- Interface responsiva e moderna
- Feedback visual para ações do usuário
- Filtros para visualização de URLs
- Paginação de resultados
- Modo escuro/claro

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
- **App**: Aplicação Next.js (inclui o Redis embutido no mesmo container)
- **Nginx**: Servidor web que funciona como proxy reverso

O fluxo de requisições é:
```
Cliente → Nginx (porta 80) → Aplicação Next.js + Redis (porta 3000/6379) → MongoDB
```

### Configuração do Domínio Local

Para acessar a aplicação usando o nome `urlshortener` ao invés de `localhost`, é necessário adicionar uma entrada no arquivo hosts do seu sistema:

```
127.0.0.1 urlshortener go
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

## Tecnologias Utilizadas

- **Frontend:**
  - Next.js 15.2.4
  - React 19.1.0
  - TailwindCSS 3.3.3
  - ESLint para qualidade de código

- **Backend:**
  - Next.js API Routes
  - MongoDB 6.15.0
  - Redis 4.7.0
  - NextAuth.js 4.24.11

- **Infraestrutura:**
  - Docker
  - Docker Compose
  - Nginx

## Variáveis de Ambiente

Crie um arquivo `.env` (ou configure no Docker Compose) com as seguintes variáveis:

```env
NEXTAUTH_URL=http://urlshortener
NEXTAUTH_SECRET=sua-chave-secreta-aqui
MONGODB_URI=mongodb://usuario:senha@mongodb:27017/urlshortener?authSource=admin
ADMIN_EMAIL=admin@seudominio.com
ADMIN_PASSWORD=sua-senha-admin-aqui
```

> **Importante:**
> - Quando rodando com Docker Compose, use sempre `mongodb` como host do banco na variável `MONGODB_URI` (exemplo: `mongodb://admin:password@mongodb:27017/urlshortener?authSource=admin`).
> - Não use `localhost` ou `127.0.0.1` como host do MongoDB dentro do container da aplicação.

- Gere uma chave segura para o `NEXTAUTH_SECRET` com:  
  `openssl rand -base64 32`
- **Nunca compartilhe seu arquivo `.env` real publicamente.**
- O usuário administrador será criado automaticamente na primeira execução com o email e senha definidos acima.

### Exemplo de configuração no Docker Compose

```yaml
environment:
  - NEXTAUTH_URL=http://urlshortener
  - NEXTAUTH_SECRET=sua-chave-secreta-aqui
  - MONGODB_URI=mongodb://admin:password@mongodb:27017/urlshortener?authSource=admin
  - ADMIN_EMAIL=admin@seudominio.com
  - ADMIN_PASSWORD=sua-senha-admin-aqui
```

### Sobre o NEXTAUTH_SECRET

`NEXTAUTH_SECRET` é uma chave secreta usada para proteger as sessões de autenticação. Gere uma string forte e nunca compartilhe publicamente.

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

## Desenvolvimento

Para desenvolvimento local, siga os passos:

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Execute os testes:
```bash
npm test
```

5. Lint do código:
```bash
npm run lint
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📄 Rotas Principais

| Rota                | Descrição                                                                 |
|---------------------|---------------------------------------------------------------------------|
| `/`                 | Página inicial para encurtar URLs, visualizar e copiar links.              |
| `/urls`             | Lista de URLs criadas pelo usuário, com filtros e paginação.               |
| `/stats/[code]`     | Estatísticas detalhadas de acesso para uma URL específica.                 |
| `/stats/all`        | Estatísticas agregadas de todas as URLs do usuário/admin.                  |
| `/admin/users`      | Painel administrativo para gerenciar usuários (apenas para admins).        |
| `/auth/login`       | Tela de login de usuário.                                                  |
| `/auth/profile`     | Perfil do usuário autenticado.                                             |
| `/404`, `/500`      | Páginas de erro personalizadas.                                            |

---

## 🛠️ Endpoints de API

### `POST /api/shorten`
- **Descrição:** Cria uma nova URL encurtada.
- **Body:**  
  ```json
  {
    "longUrl": "https://exemplo.com",
    "alias": "meulink", // opcional
    "isPublic": true    // opcional
  }
  ```
- **Resposta:**  
  ```json
  {
    "urlCode": "meulink",
    "longUrl": "https://exemplo.com",
    "clicks": 0,
    ...
  }
  ```

### `GET /api/check/[alias]`
- **Descrição:** Verifica se um alias existe e retorna a URL original.
- **Resposta:**  
  ```json
  {
    "exists": true,
    "longUrl": "https://exemplo.com"
  }
  ```

### `GET /api/admin/users`
- **Descrição:** Lista todos os usuários (apenas admin).
- **Resposta:**  
  ```json
  [
    { "email": "...", "isAdmin": true, ... }
  ]
  ```

### `PUT /api/admin/users`
- **Descrição:** Atualiza status ou permissões de um usuário.
- **Body:**  
  ```json
  {
    "userId": "id_do_usuario",
    "status": "ativo" // ou "inativo"
    // ou
    "isAdmin": true
  }
  ```

> **Obs:** Existem outros endpoints para autenticação, estatísticas, etc. Consulte o código em `/pages/api/` para detalhes.

---

## 🛡️ Painel Administrativo

- **Acesso:** Apenas usuários com permissão de admin.
- **Funcionalidades:**
  - Listar todos os usuários cadastrados.
  - Ativar/desativar contas de usuários.
  - Conceder ou remover permissões de administrador.
  - Visualizar estatísticas globais.
- **Proteção:** Rotas protegidas por middleware e componentes (`RequireAdmin`).

---

## 🔐 Fluxo de Autenticação

- **Login:** Usuários autenticam via `/auth/login` (NextAuth).
- **Permissões:** 
  - Usuários comuns: podem criar, listar e ver estatísticas de suas URLs.
  - Admins: acesso ao painel administrativo, podem gerenciar usuários.
- **Proteção de rotas:** 
  - Rotas sensíveis usam componentes como `RequireAuth` e `RequireAdmin`.
- **Logout:** Disponível no menu do usuário.

---

## 🚀 Práticas Recomendadas para Produção

- **Domínio real:** Configure um domínio próprio e utilize HTTPS (SSL).
- **Variáveis sensíveis:** Nunca exponha segredos em arquivos versionados. Use `.env` e variáveis de ambiente.
- **Backups:** Implemente backups automáticos para o volume do MongoDB.
- **Escalabilidade:** Considere múltiplas instâncias da aplicação e balanceamento de carga.
- **Monitoramento:** Utilize ferramentas de monitoramento para containers e logs.
- **Segurança:** Habilite autenticação no MongoDB e restrinja acessos externos.

---