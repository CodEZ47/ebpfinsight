eBPF Insight - Full-stack Starter

This repository provides a Postgres DB, Node.js + Fastify server using Prisma, and a Next.js frontend (App Router) with Tailwind.

Quick start (requires Docker and docker-compose):

1. Copy or update `.env` if needed. The provided `.env` uses the `db` service name so Docker networking works.

2. Build and start all services:

```powershell
docker-compose up --build
```

3. The frontend will be available at: http://localhost:3000
   The API will be available at: http://localhost:8000

Prisma notes:

- Prisma schema for the server is under `server/prisma/schema.prisma`.
- The server image runs `npx prisma migrate deploy || npx prisma db push` on start to ensure the database schema is applied.
- If you prefer to create migrations locally, run from `server`:

```powershell
cd server
npm install
npx prisma migrate dev --name init
npx prisma generate
```

Then restart the services.

# ebpfinsight

ebpfinsight is an automated framework for analyzing eBPF repositories, benchmarking their runtime overhead, and visualizing performance impact on microservice workloads.
