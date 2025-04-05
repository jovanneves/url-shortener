# Configuração do Ambiente Docker

Este documento fornece detalhes sobre a configuração completa do ambiente Docker para o URL Shortener.

## Componentes do Sistema

O sistema está configurado com três serviços principais:

### 1. MongoDB
- Container de banco de dados MongoDB para armazenamento persistente
- Porta: 27017 (acessível apenas dentro da rede Docker)
- Dados persistidos em volume Docker

### 2. Aplicação Next.js
- Container com a aplicação principal em Next.js
- Não expõe porta diretamente para o mundo externo
- Acessível apenas através do Nginx

### 3. Nginx
- Funciona como proxy reverso para a aplicação
- Porta: 80
- Gerencia conexões externas e direciona para a aplicação

## Domínio Personalizado (urlshortener)

A aplicação está configurada para usar o nome de domínio `urlshortener` em vez de `localhost`. Esta configuração envolve:

### Configuração do Nginx
O arquivo `nginx.conf` está configurado para escutar requisições para o domínio `urlshortener`:

```nginx
server {
    listen 80;
    server_name urlshortener;
    
    # Outras configurações...
}
```

### Configuração das Variáveis de Ambiente
O Docker Compose configura as variáveis de ambiente para usar o domínio personalizado:

```yaml
environment:
  - NEXTAUTH_URL=http://urlshortener
  - NEXT_PUBLIC_APP_URL=http://urlshortener
```

### Arquivo Hosts
Para que a configuração funcione localmente, é necessário modificar o arquivo hosts do sistema operacional:

```
127.0.0.1 urlshortener
```

## Benefícios da Arquitetura

Esta arquitetura oferece várias vantagens:

1. **Segurança**:
   - A aplicação Next.js não está diretamente exposta à internet
   - O Nginx filtra e gerencia as conexões

2. **Performance**:
   - Cache de recursos estáticos
   - Compressão gzip para reduzir o tamanho das respostas
   - Otimizações para imagens, CSS e JavaScript

3. **Escalabilidade**:
   - Possibilidade de adicionar mais instâncias da aplicação
   - Load balancing nativo do Nginx

4. **Manutenção**:
   - Facilidade para atualizações sem downtime
   - Isolamento de componentes

## Customização para Produção

Para ambientes de produção, recomenda-se:

1. Usar um domínio real com certificado SSL
2. Configurar autenticação para o MongoDB
3. Implementar backups automáticos para o volume de dados
4. Considerar o uso de serviços de container gerenciados 