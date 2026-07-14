# Infraestrutura Docker

Estrutura para rodar o projeto com Docker Compose.

## Como usar

1. Copie o arquivo de exemplo:
   ```bash
   cp infra/.env.example infra/.env
   ```
2. Suba os containers:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```
3. Acesse:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080
   - PostgreSQL: localhost:5432

## Serviços

- db: PostgreSQL
- backend: aplicação Java/Spring Boot
- frontend: aplicação Next.js
