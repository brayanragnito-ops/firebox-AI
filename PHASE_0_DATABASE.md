# Firebox AI - Phase 0: Database Setup Complete ✅

## Overview

Phase 0 establishes the database foundation for Firebox AI, replacing all hardcoded data with real persistent storage.

## What Was Implemented

### 1. Database Schemas (PostgreSQL + Drizzle ORM)

**Location**: `lib/db/src/schema/`

Created 5 table schemas:

#### `users.ts` - User Accounts
- Email (unique), password (hashed), name
- Plan (free/pro/enterprise), credits
- GitHub connection state + encrypted token
- Timestamps

#### `projects.ts` - User Projects
- Project metadata (name, description, slug)
- Source (prompt/github/zip), repository URL
- Status (ready/running/needs-setup/deploying/error)
- Framework, language, runtime detection
- Build/dev commands, package manager
- Local files path, git branch
- User ownership (userId foreign key)

#### `deployments.ts` - Deployments
- Provider (Vercel, Railway, Render, etc)
- Status (building/deploying/live/failed/paused)
- External deployment ID, live URL
- Logs and error messages
- Environment variables
- User + Project ownership

#### `agent-runs.ts` - Agent Execution History
- Agent name (Spark, Forge, Nexus, etc)
- User prompt and status
- Activity events (JSON)
- Tokens used, credits charged
- Timeline (startedAt, completedAt)

#### `usage.ts` - Usage Tracking
- Daily usage per user
- Agent tokens, compute minutes, API calls
- Cost tracking in USD

### 2. Security Services

**Location**: `artifacts/api-server/src/lib/crypto.ts`

- **Password Hashing**: bcrypt with 10 rounds
- **Password Verification**: Compare hashed vs plaintext
- **Token Encryption**: AES-256-GCM for sensitive tokens
- **ID Generation**: UUID v4
- **Token Generation**: Secure random 32-byte tokens

### 3. Database Service Layer

**Location**: `artifacts/api-server/src/services/db.ts`

Query functions for all tables:
- `createUser()`, `getUserById()`, `getUserByEmail()`, `updateUser()`
- `createProject()`, `getProjectsByUserId()`, `getProjectById()`, `updateProject()`, `deleteProject()`
- `createDeployment()`, `getDeploymentsByProjectId()`, `updateDeployment()`
- `createAgentRun()`, `getAgentRunsByProjectId()`, `updateAgentRun()`
- `recordUsage()`, `getUserUsageByDate()`

### 4. Database Seeding Script

**Location**: `artifacts/api-server/scripts/seed-db.mts`

Populates database with sample data matching the original hardcoded projects:
- Demo user: `demo@fireboxai.dev` / `demo123`
- 3 sample projects (Summit Commerce, Orbit Analytics, Atlas API)
- Initial usage record

## Installation & Setup

### 1. Install Dependencies

```bash
cd Code-Forge-AI
pnpm install
```

This installs:
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication (for Phase 1)
- `drizzle-orm` - Database ORM (already installed)
- `drizzle-kit` - Migration tool

### 2. Configure Database

Create `.env` file in project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/firebox_ai"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
JWT_SECRET="your-jwt-secret-key-here"
NODE_ENV="development"
```

### 3. Run Database Migrations

```bash
pnpm --filter @workspace/db run push
```

This creates all tables in PostgreSQL.

### 4. Seed Sample Data

```bash
pnpm --filter @workspace/api-server run seed
```

This creates:
- Demo user account
- 3 sample projects
- Initial usage record

## Database ERD

```
users (1) ──┬─ (many) projects
            ├─ (many) deployments
            ├─ (many) agent_runs
            └─ (many) usage

projects (1) ──┬─ (many) deployments
               └─ (many) agent_runs
```

## API Endpoints to Implement (Next Phase)

The database is ready for the following Phase 1 endpoints:

**Auth**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

**Projects** (existing, to be updated)
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Deployments** (existing, to be updated)
- `GET /api/deployments` - List user's deployments
- `POST /api/projects/:id/deployments` - Create deployment

**Usage** (new)
- `GET /api/usage` - Get user's usage/credits

## Security Notes

⚠️ **Development Credentials**
- Seed user: `demo@fireboxai.dev` / `demo123`
- Change in production!

✅ **Security Features Implemented**
- Passwords hashed with bcrypt (10 rounds)
- Sensitive tokens encrypted with AES-256-GCM
- User project isolation (userId foreign keys)
- No secrets in frontend
- Prepared for JWT authentication

## Next Steps

### Phase 1: Authentication
- JWT token generation
- Login/signup endpoints
- Protected routes
- Session persistence
- Current user endpoint

### Phase 2: User Project Management
- Replace hardcoded endpoints with real database queries
- File upload/import handling
- Project analysis service
- Real-time project status

## Files Added/Modified

### Added
- `lib/db/src/schema/users.ts`
- `lib/db/src/schema/projects.ts`
- `lib/db/src/schema/deployments.ts`
- `lib/db/src/schema/agent-runs.ts`
- `lib/db/src/schema/usage.ts`
- `artifacts/api-server/src/lib/crypto.ts`
- `artifacts/api-server/src/services/db.ts`
- `artifacts/api-server/scripts/seed-db.mts`

### Modified
- `lib/db/src/schema/index.ts` - Export all schemas
- `artifacts/api-server/package.json` - Add bcrypt, jsonwebtoken

## Troubleshooting

### "DATABASE_URL not set"
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/firebox_ai"
```

### "Connection refused"
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Test with: `psql $DATABASE_URL -c "SELECT 1"`

### Seed script fails
- Run migrations first: `pnpm --filter @workspace/db run push`
- Check DATABASE_URL
- Clear database and retry

## TypeScript Types

All database schemas export TypeScript types:

```typescript
import { type User, type Project, type Deployment } from "@workspace/db";

const user: User = await getUserById("user-123");
const projects: Project[] = await getProjectsByUserId(user.id);
```

---

✅ **Phase 0 Complete!**

Database foundation is ready. Proceed to **Phase 1: Authentication** to implement login/signup.
