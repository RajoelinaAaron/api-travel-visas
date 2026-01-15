# Architecture du Projet

## 📁 Arborescence

```
api-bd/
├── src/
│   ├── server.ts                 # Point d'entrée - Bootstrap Fastify
│   ├── db/
│   │   ├── pool.ts              # Pool de connexions MariaDB
│   │   └── queries.ts           # Toutes les requêtes SQL (paramétrées)
│   ├── plugins/
│   │   ├── cors.ts              # Configuration CORS
│   │   ├── swagger.ts           # Documentation OpenAPI/Swagger
│   │   ├── helmet.ts            # Headers de sécurité HTTP
│   │   ├── rateLimit.ts         # Rate limiting
│   │   └── adminAuth.ts         # Authentification admin (x-api-key)
│   ├── routes/
│   │   ├── countries.ts         # GET /v1/countries, GET /v1/countries/:iso2
│   │   ├── nationalities.ts     # GET /v1/nationalities
│   │   ├── requirements.ts      # GET /v1/requirements (principal)
│   │   └── admin.ts             # Tous les endpoints PUT/POST admin
│   ├── services/
│   │   └── requirements.ts      # Logique d'agrégation requirements
│   ├── schemas/
│   │   └── index.ts             # Schémas Zod pour validation
│   └── types/
│       └── index.ts             # Interfaces TypeScript
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── ARCHITECTURE.md
```

## 🔄 Flux de Données

### Endpoint Principal: GET /v1/requirements

```
Requête (query params)
  ↓
Validation Zod (schemas/index.ts)
  ↓
Service requirements.ts
  ├─→ Résolution nationality (ISO2 ou name_fr)
  ├─→ Résolution destination (ISO2 ou name_fr)
  ├─→ Lecture entry_profiles
  ├─→ Lecture entry_documents (liste)
  ├─→ Lecture travel_requirements
  ├─→ Lecture health_requirements
  ├─→ Lecture country_guides
  └─→ Lecture official_portals
  ↓
Agrégation JSON
  ↓
Réponse (RequirementsResponse)
```

### Endpoint Admin: PUT /v1/admin/entry-profiles/:id/documents

```
Requête (body + x-api-key header)
  ↓
Plugin adminAuth (vérification API key)
  ↓
Validation Zod
  ↓
Transaction MySQL
  ├─→ BEGIN TRANSACTION
  ├─→ DELETE entry_documents WHERE profile_id = ?
  ├─→ INSERT batch entry_documents
  └─→ COMMIT (ou ROLLBACK en cas d'erreur)
  ↓
Réponse
```

## 🔐 Sécurité

1. **CORS** : Configuré via `CORS_ORIGINS` (liste d'origines)
2. **Admin Auth** : Hook `onRequest` vérifie `x-api-key` header
3. **SQL Injection** : Toutes les requêtes utilisent des paramètres préparés (`?`)
4. **Rate Limiting** : 100 req/min par défaut
5. **Helmet** : Headers de sécurité HTTP

## 🗄️ Base de Données

- **Pool de connexions** : 10 connexions max, keep-alive activé
- **Transactions** : Utilisées pour les opérations multi-tables (ex: replace documents)
- **Requêtes paramétrées** : Protection contre l'injection SQL

## 📦 Dépendances Principales

- `fastify` : Framework web
- `mysql2/promise` : Client MariaDB/MySQL async
- `zod` : Validation runtime
- `@fastify/swagger` : Documentation API
- `@fastify/cors` : CORS
- `@fastify/helmet` : Sécurité HTTP
- `@fastify/rate-limit` : Rate limiting
- `pino` : Logging (intégré Fastify)

## 🚀 Points Clés

1. **TypeScript strict** : Tous les types sont définis
2. **Validation Zod** : Query params et body validés
3. **Gestion d'erreurs** : Codes HTTP appropriés (400, 401, 404, 500)
4. **Swagger** : Documentation interactive sur `/docs`
5. **Health check** : `/health` pour monitoring
6. **Docker ready** : Dockerfile multi-stage + docker-compose

