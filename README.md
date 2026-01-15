# API Visa/eVisa/ETA - Node.js TypeScript

API complète pour fournir des informations sur les visas, eVisa, ETA, autorisations de voyage, formulaires d'arrivée, vaccins et guides touristiques.

## 🚀 Technologies

- **Node.js 20+** avec **TypeScript**
- **Fastify** - Framework web rapide
- **MariaDB/MySQL** - Base de données via `mysql2/promise`
- **Zod** - Validation des données
- **Pino** - Logging (intégré à Fastify)
- **Swagger/OpenAPI** - Documentation interactive

## 📋 Prérequis

- Node.js 20 ou supérieur
- MariaDB/MySQL 10.5+
- npm ou yarn

## 🔧 Installation

1. Cloner le projet et installer les dépendances :

```bash
npm install
```

2. Configurer les variables d'environnement :

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=visa_db
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ADMIN_API_KEY=your-secret-admin-api-key
```

3. S'assurer que la base de données existe et que le schéma est créé (voir section Schéma DB ci-dessous).

## 🏃 Développement

```bash
# Mode développement avec hot-reload
npm run dev

# Build TypeScript
npm run build

# Lancer en production
npm start
```

Le serveur démarre sur `http://localhost:3000`

- API: `http://localhost:3000`
- Documentation Swagger: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

## 🐳 Docker

### Avec docker-compose (recommandé)

```bash
docker-compose up -d
```

Cela démarre l'API et MariaDB automatiquement.

### Build manuel

```bash
docker build -t visa-api .
docker run -p 3000:3000 --env-file .env visa-api
```

## 📊 Schéma de Base de Données

Le projet suppose l'existence des tables suivantes dans MariaDB :

- `countries` - Pays de destination
- `official_portals` - Portails officiels par pays
- `nationalities` - Nationalités
- `entry_profiles` - Profils d'entrée (nationalité + destination + purpose)
- `entry_documents` - Documents requis (visa, ETA, eVisa, etc.)
- `travel_requirements` - Autorisations de voyage et formulaires d'arrivée
- `health_requirements` - Exigences sanitaires (vaccins)
- `country_guides` - Guides touristiques par pays et langue

**Index recommandés** (à créer si nécessaire) :

```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_countries_iso2 ON countries(iso2);
CREATE INDEX idx_nationalities_iso2 ON nationalities(iso2);
CREATE INDEX idx_entry_profiles_lookup ON entry_profiles(nationality_id, destination_country_id, purpose);
CREATE INDEX idx_entry_documents_profile ON entry_documents(profile_id);
CREATE INDEX idx_travel_requirements_profile ON travel_requirements(profile_id);
CREATE INDEX idx_health_requirements_profile ON health_requirements(profile_id);
CREATE INDEX idx_country_guides_lookup ON country_guides(country_id, lang);
CREATE INDEX idx_official_portals_country ON official_portals(country_id, label);
```

## 📡 Endpoints

### READ (Public)

#### GET /v1/countries
Liste des pays avec filtres optionnels.

**Query params:**
- `search` - Recherche par nom ou ISO2
- `continent` - Filtrer par continent
- `popular` - `0` ou `1` pour destinations populaires
- `limit` - Nombre de résultats
- `offset` - Pagination

**Exemple:**
```bash
curl "http://localhost:3000/v1/countries?popular=1&limit=10"
```

#### GET /v1/countries/:iso2
Détails d'un pays par code ISO2.

**Exemple:**
```bash
curl "http://localhost:3000/v1/countries/CA"
```

#### GET /v1/nationalities
Liste des nationalités.

**Query params:**
- `search` - Recherche par nom ou ISO2
- `limit` - Nombre de résultats
- `offset` - Pagination

**Exemple:**
```bash
curl "http://localhost:3000/v1/nationalities?search=France"
```

#### GET /v1/requirements
**Endpoint principal** - Retourne toutes les informations agrégées pour un trajet.

**Query params (requis):**
- `nationality` - Nom ou ISO2 de la nationalité (ex: "France" ou "FR")
- `destination` - Nom ou ISO2 du pays de destination (ex: "Canada" ou "CA")
- `purpose` - But du voyage (défaut: "tourism")
- `lang` - Langue pour le guide (défaut: "fr")

**Exemple:**
```bash
curl "http://localhost:3000/v1/requirements?nationality=FR&destination=CA&purpose=tourism&lang=fr"
```

**Réponse JSON:**
```json
{
  "nationality": { "id": 1, "name_fr": "France", "iso2": "FR" },
  "destination": { "id": 40, "name_fr": "Canada", "iso2": "CA", "continent": "Amérique du Nord", "image_url": "...", "official_portal": "https://..." },
  "purpose": "tourism",
  "last_checked": "2026-01-06",
  "source_confidence": 0.90,
  "needs_manual_review": false,
  "sections": {
    "documents": [
      {
        "id": 1,
        "nom_document": "eTA",
        "type_document": "eta",
        "required": true,
        "duree_validite_text": "5 ans",
        "nombre_entrees": "multiple",
        "prix_montant": 7,
        "prix_devise": "CAD",
        "application_url": "https://..."
      }
    ],
    "travel_authorization": {
      "required": false,
      "name": "",
      "url": "",
      "message": "Vous n'avez PAS besoin d'autorisation de voyage pour ce trajet."
    },
    "arrival_form": {
      "required": true,
      "name": "Formulaire d'arrivée",
      "url": "https://...",
      "notes": ""
    },
    "vaccines": {
      "required": [],
      "recommended": ["COVID-19"],
      "notes": null
    },
    "guide": {
      "lang": "fr",
      "text": "Guide touristique du Canada..."
    }
  },
  "sources": [
    { "url": "https://...", "title": "Site officiel" }
  ],
  "llm": {
    "model": "gpt-4",
    "prompt_version": "v1"
  }
}
```

#### GET /v1/entry-profiles/:id
Détails d'un profil d'entrée par ID.

#### GET /v1/entry-profiles/:id/documents
Documents d'un profil.

#### GET /v1/entry-profiles/:id/travel-requirements
Exigences de voyage d'un profil.

#### GET /v1/entry-profiles/:id/health
Exigences sanitaires d'un profil.

#### GET /v1/countries/:iso2/guide?lang=fr
Guide touristique d'un pays.

### WRITE (Admin - Protégé par API Key)

Tous les endpoints admin nécessitent le header `x-api-key` avec la valeur de `ADMIN_API_KEY`.

#### POST /v1/admin/nationalities
Créer ou mettre à jour une nationalité.

**Body:**
```json
{
  "name_fr": "France",
  "iso2": "FR"
}
```

**Exemple:**
```bash
curl -X POST "http://localhost:3000/v1/admin/nationalities" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-admin-api-key" \
  -d '{"name_fr": "France", "iso2": "FR"}'
```

#### POST /v1/admin/countries
Créer ou mettre à jour un pays.

**Body:**
```json
{
  "name_fr": "Canada",
  "iso2": "CA",
  "continent": "Amérique du Nord",
  "popular_destination": true,
  "image_url": "https://..."
}
```

#### POST /v1/admin/countries/:iso2/official-portal
Ajouter/mettre à jour le portail officiel d'un pays.

**Body:**
```json
{
  "url": "https://www.canada.ca/..."
}
```

#### PUT /v1/admin/entry-profiles
Créer ou mettre à jour un profil d'entrée.

**Body:**
```json
{
  "nationality_id": 1,
  "destination_country_id": 40,
  "purpose": "tourism",
  "last_checked": "2026-01-06",
  "source_confidence": 0.90,
  "needs_manual_review": false,
  "llm_model": "gpt-4",
  "llm_prompt_version": "v1",
  "llm_sources_json": "[{\"url\":\"https://...\",\"title\":\"...\"}]",
  "llm_raw_json": "{...}"
}
```

#### PUT /v1/admin/entry-profiles/:id/documents
**Remplacer** tous les documents d'un profil (transaction).

**Body:**
```json
{
  "documents": [
    {
      "nom_document": "eTA",
      "type_document": "eta",
      "required": true,
      "duree_validite_text": "5 ans",
      "duree_validite_days": 1825,
      "nombre_entrees": "multiple",
      "duree_sejour_max_text": "6 mois",
      "duree_sejour_max_days": 180,
      "prix_montant": 7,
      "prix_devise": "CAD",
      "prix_montant_eur": 5,
      "prix_libelle": "Taxe eTA",
      "temps_obtention_visa": "Quelques minutes",
      "application_url": "https://www.canada.ca/...",
      "source_officielle": "https://...",
      "confidence": 0.95
    }
  ]
}
```

**Exemple:**
```bash
curl -X PUT "http://localhost:3000/v1/admin/entry-profiles/1/documents" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-admin-api-key" \
  -d '{
    "documents": [
      {
        "nom_document": "eTA",
        "type_document": "eta",
        "required": true,
        "nombre_entrees": "multiple",
        "prix_montant": 7,
        "prix_devise": "CAD",
        "application_url": "https://www.canada.ca/..."
      }
    ]
  }'
```

#### PUT /v1/admin/entry-profiles/:id/travel-requirements
Mettre à jour les exigences de voyage.

**Body:**
```json
{
  "travel_authorization_required": false,
  "travel_authorization_name": null,
  "travel_authorization_url": null,
  "arrival_form_required": true,
  "arrival_form_name": "Formulaire d'arrivée",
  "arrival_form_url": "https://...",
  "other_requirements_json": null
}
```

#### PUT /v1/admin/entry-profiles/:id/health
Mettre à jour les exigences sanitaires.

**Body:**
```json
{
  "vaccines_required_json": "[]",
  "vaccines_recommended_json": "[\"COVID-19\"]",
  "notes": null
}
```

#### PUT /v1/admin/countries/:iso2/guide
Mettre à jour le guide touristique.

**Body:**
```json
{
  "lang": "fr",
  "guide_text": "Le Canada est un pays magnifique..."
}
```

## 🔒 Sécurité

- **CORS** : Configuré via `CORS_ORIGINS` (liste d'origines autorisées)
- **Admin API Key** : Tous les endpoints `/v1/admin/*` nécessitent le header `x-api-key`
- **Rate Limiting** : 100 requêtes par minute par défaut
- **Helmet** : Headers de sécurité HTTP
- **SQL Injection** : Toutes les requêtes utilisent des paramètres préparés

## 📝 Validation

- **Zod** : Validation des query params et body
- Codes HTTP appropriés :
  - `400` : Requête invalide
  - `401` : Non autorisé (API key manquante/invalide)
  - `404` : Ressource introuvable
  - `500` : Erreur serveur

## 🗄️ Transactions

Les opérations multi-tables utilisent des transactions MySQL :
- `PUT /v1/admin/entry-profiles/:id/documents` : DELETE puis INSERT batch dans une transaction

## 📚 Documentation

La documentation Swagger/OpenAPI est accessible sur `/docs` une fois le serveur démarré.

## 🧪 Exemples cURL

### 1. Lister les pays populaires
```bash
curl "http://localhost:3000/v1/countries?popular=1&limit=5"
```

### 2. Obtenir les exigences complètes (France → Canada)
```bash
curl "http://localhost:3000/v1/requirements?nationality=FR&destination=CA&purpose=tourism&lang=fr"
```

### 3. Mettre à jour les documents d'un profil (admin)
```bash
curl -X PUT "http://localhost:3000/v1/admin/entry-profiles/1/documents" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-admin-api-key" \
  -d '{
    "documents": [
      {
        "nom_document": "eTA",
        "type_document": "eta",
        "required": true,
        "duree_validite_text": "5 ans",
        "duree_validite_days": 1825,
        "nombre_entrees": "multiple",
        "prix_montant": 7,
        "prix_devise": "CAD",
        "application_url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html"
      }
    ]
  }'
```

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifier que MariaDB est démarré
- Vérifier les variables `DB_*` dans `.env`
- Vérifier que la base de données existe

### Erreur 401 sur les endpoints admin
- Vérifier que le header `x-api-key` est présent
- Vérifier que la valeur correspond à `ADMIN_API_KEY` dans `.env`

### Erreur 404 sur /v1/requirements
- Vérifier que la nationalité et la destination existent dans la DB
- Vérifier qu'un `entry_profile` existe pour cette combinaison

## 📄 Licence

ISC

