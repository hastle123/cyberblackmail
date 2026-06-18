# CYBERBLACKMAIL

Enterprise Threat Intelligence Platform — SOC command center for cyber threat analysis.

## Quick Start

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stack

- **Next.js 15** + TypeScript + Tailwind CSS + Framer Motion
- **SQLite** (local dev) / PostgreSQL (production via `docker-compose.yml`)
- **Prisma ORM** with full relational intelligence schema
- **27 REST API endpoints** + SSE realtime streams

## Modules

| Route | Module |
|-------|--------|
| `/` | SOC Command Center |
| `/threat-map` | Global Attack Map |
| `/alerts` | Alert Center (SSE) |
| `/iocs` | IOC Explorer |
| `/companies` | Company Intelligence |
| `/countries` | Country Threat Intel |
| `/industries` | Industry Risk Center |
| `/vulnerabilities` | CVE Intelligence |
| `/actors` | Threat Actors DB |
| `/ransomware` | Ransomware Tracker |
| `/darknet` | Darknet Monitor |
| `/breaches` | Breach Database |
| `/intel` | Threat Reports |
| `/briefing` | Daily Intelligence Briefing |
| `/executive` | Executive Dashboard |
| `/analyst` | AI Analyst |
| `/graph` | Threat Relationship Graph |
| `/radar` | CyberBlackmail Radar |

## API

All endpoints return `{ data, meta, error }` JSON.

```
GET /api/intel          GET /api/breaches       GET /api/alerts
GET /api/iocs           GET /api/ransomware     GET /api/actors
GET /api/companies      GET /api/countries      GET /api/industries
GET /api/vulnerabilities GET /api/threat-map    GET /api/briefing
GET /api/graph          GET /api/search         GET /api/stats
POST /api/analyst/query GET /api/alerts/stream  GET /api/stream
```

## Production (PostgreSQL)

```bash
docker compose up -d
# Update .env: DATABASE_URL="postgresql://cyberblackmail:cyberblackmail@localhost:5432/cyberblackmail"
# Change prisma/schema.prisma provider to "postgresql"
npm run db:setup
npm run build && npm start
```

## Admin

Default credentials (seed): `admin@cyberblackmail.io` / `ChangeMe123!`
