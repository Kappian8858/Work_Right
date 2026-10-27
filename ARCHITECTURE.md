# WorkRight — System Architecture

> Built for Prompt Wars 2026 (ACM SRMIST × Google for Developers × Hack2Skill)
> Solving UN SDG 8: Decent Work & Economic Growth for informal shift workers

## System Overview

WorkRight is a full-stack Node.js web application designed for India's informal construction and hospital labour sectors. Every architectural decision was made to serve one constraint: **the app must be usable by a low-literacy construction worker on a ₹5,000 Android phone with patchy 4G signal.**

```
┌─────────────────────────────────────────────────────────────┐
│                   Worker's Mobile Browser                   │
│  Phone-first HTML5 • Web Speech API • Zero JS frameworks   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────────────┐
│            Express.js REST API  (Node.js 18+)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ /api/pay │ │/api/haz  │ │/api/pass │ │ /api/auth    │   │
│  │ routes   │ │ ards     │ │  port    │ │ (worker+adm) │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │            │            │               │           │
│  ┌────▼────────────▼────────────▼───────────────▼────────┐  │
│  │             data/seed.js  (In-Memory Store)           │  │
│  │  workers[] • payRecords[] • hazards[] • passport[]    │  │
│  │  + File persistence: store.json / /tmp fallback       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Pure Logic Layer                         │   │
│  │  payCalculator.js  │  violationChecker.js            │   │
│  │  translator.js (Tamil/Hindi→English keyword rules)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Design Decisions

### 1. Zero External AI API Dependency
The entire translation and categorization system uses **hand-curated regex dictionaries** covering Tamil (Unicode \\u0B80–\\u0BFF) and Hindi (Devanagari \\u0900–\\u097F) workplace safety vocabulary. This means:
- Zero API keys required
- Works offline-first
- Sub-millisecond translation latency
- No rate limits or costs

### 2. Speech-to-Text Without External APIs  
WorkRight uses the **browser's native `SpeechRecognition` API** (`webkitSpeechRecognition` on Android Chrome). No Google Cloud Speech-to-Text billing, no external SDK. The API accepts `lang='ta-IN'`, `'hi-IN'`, `'en-IN'`.

### 3. Statutory Pay Engine (Pure Math, No Black Box)
```
hourlyRate = minDailyWage / 8
regularPay = min(hours, threshold) × hourlyRate
overtimePay = max(0, hours − threshold) × hourlyRate × 1.5
```
Tamil Nadu statutory rates hardcoded from official government circulars:
- Construction unskilled: **₹563/day**
- Hospital support staff: **₹600/day**

### 4. Privacy-Preserving Public Passport
The public `/passport/:workerId` endpoint exposes **ONLY** name, role, sector, verified skills, and total weeks. It **strictly never** returns pay amounts, violation flags, or dispute records. This is enforced in `server.js` via explicit field allowlisting.

### 5. File-Backed Persistence for Serverless Environments
`data/seed.js` uses a two-tier persistence strategy:
1. Tries to write to `data/store.json` (local/Render)
2. Falls back to `os.tmpdir()/workright_store.json` (Vercel/serverless)
3. All mutations (`approveRegistrationRequest`, `adminCreateWorker`, etc.) immediately call `persistStore()`

### 6. Cross-Cloud Client Auto-Sync
When a worker's account exists in browser `localStorage` but the server restarted (serverless cold boot), the login page detects the 404, calls `POST /api/auth/worker/sync` with cached credentials, then retries login — all transparently within the same click.

---

## Authentication Model

| Actor | Credentials | Mechanism |
|---|---|---|
| Admin | `username: admin` / `password: admin` | Static check, returns `admin123` token |
| Worker (seeded) | `username or WRK-id` + `password123` | `findWorkerByIdOrUsername` + password match |
| Worker (self-registered) | Registered username + chosen password | Pending until `approveRegistrationRequest` |
| Worker (admin-created) | Admin-assigned username + set password | Immediately active |

---

## Data Flow: Worker Self-Registration → Login

```
1. Worker fills Create Account form
   └─► POST /api/auth/worker/register
       └─► addRegistrationRequest() → status: 'pending'
       
2. Admin sees badge on Pending Registrations tab
   └─► POST /api/admin/registration-requests/:id/approve  [X-Admin-Token]
       └─► approveRegistrationRequest() → creates worker, assigns WRK-Hxxx ID
       └─► persistStore() → saved to disk
       
3. Worker logs in (username OR employee ID)
   └─► POST /api/auth/worker/login
       └─► authenticateWorker(identifier, password)  ← checks first
       └─► Returns worker profile with official ID
```

---

## Test Coverage

| Suite | Tests | Coverage Area |
|---|---|---|
| `auth.test.js` | 4 | Admin login, worker create, register→approve→login cycle |
| `hazards.test.js` | 8 | Submission, status transitions, anonymity, Tamil/Hindi translation |
| `passport.test.js` | 7 | Pay aggregation, privacy guard, QR code, PDF, experience, verification |
| `pay.test.js` | 8 | Wage math, overtime thresholds, violation detection |
| **Total** | **27** | **All pass** |

---

## Deployment

| Environment | URL | Notes |
|---|---|---|
| Render (Backend) | https://prompt-wars-vsi5.onrender.com | Full Node.js server, persistent store.json |
| Vercel (Frontend) | Auto-connects to Render via `DEFAULT_BACKEND_URL` | Static HTML served via CDN |
| Local Dev | `npm start` → port 8080 | Same codebase, no env vars needed |
