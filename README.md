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

Este projeto está licenciado sob a licença ISC. 