# ProjectPilot AI — Intelligent Project Workspace

> **Built for the Google Cloud Run AI Challenge**  
> *Turn ideas into structured architecture, actionable roadmaps, and context-aware intelligence powered by Gemini and Cloud Run.*

---

## 🌟 Overview & Original Enhancements

**ProjectPilot AI** is a multi-project intelligence workspace designed for students, software engineers, researchers, and technical builders. Production deployment and cloud-secret configuration must be completed separately.

While traditional AI tools offer disconnected chat dialogues or simple personal journals, ProjectPilot AI transforms unstructured thoughts into an **end-to-end engineered project ecosystem**:
1. **Multi-Project Workspace**: Manage independent projects, each isolated securely in Cloud Firestore.
2. **AI System Architecture & Specification**: Gemini architects functional & non-functional requirements, recommended tech stacks, data models, and a technical risk matrix.
3. **Phase-Based Execution Roadmap**: Interactive Kanban & phase views with automatic milestone generation and Gemini-powered task suggestions.
4. **Context-Grounded Project Co-Pilot with Role Personas**: Multi-turn AI assistant with specialized personas (Tech Lead, Architect, Security Officer, Full-Stack Dev), model speed switcher, and live Google Search Grounding.
5. **Live Tech & Market Research Grounding**: Real-time Gemini Google Search grounding to synthesize technical documentation, security advisories, and source citations.
6. **Project Memory (ADRs & Research Notes)**: Document technical tradeoffs and decisions that persist into AI context for long-term consistency.
7. **Live Project Health & Diagnostics**: Gemini audits project momentum, flags unmitigated risks, and creates 1-click corrective action items.
8. **Portable Markdown & JSON Export**: Full project export capabilities allowing developers to export their complete roadmap, notes, ADRs, and architecture as a portable Markdown document or JSON archive.
9. **Authenticated Backend Security**: Express API gateway protected with Firebase Admin SDK ID token authentication (`Authorization: Bearer <token>`), instance-local rate limiting, untrusted data delimiters (`<UNTRUSTED_PROJECT_DATA>`), and a configurable model fallback ladder.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Markdown
- **Backend API Gateway**: Node.js Express server (`server.ts`) with Firebase Admin SDK token verification
- **AI Intelligence**: Google Gemini SDK (`@google/genai`) with server-side proxying and resilience ladder
- **Database & Auth**: Cloud Firestore and Firebase Authentication (Google and Firebase Anonymous Auth)
- **Deployment Target**: Google Cloud Run; deployment is not completed by this repository alone
- **Secret Management Target**: Google Cloud Secret Manager; configure it during deployment

---

## 🔒 Security Architecture & Zero-Trust Defense

ProjectPilot AI enforces **Zero Insecure Defaults** across all 5 Threat Zones:

| Threat Zone | Risk Identified | Countermeasure & Implementation |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection & oversized payloads | Strict body size limits (2MB), string truncation sanitizer (`sanitizeString`), and schema validation |
| **Planning & Reasoning** | Prompt injection & system prompt override | All user inputs & project context are encapsulated inside `<UNTRUSTED_PROJECT_DATA>` tags with explicit safety directives |
| **Tool & Endpoint Execution** | Unauthenticated Gemini API abuse & credential theft | Firebase Admin SDK verifies Bearer ID tokens on every `/api/gemini/*` endpoint; rate limiting active |
| **Memory & State** | Cross-user data leakage & tampering | Strict owner-bound Firestore rules (`request.auth.uid == userId`) and sanitizeData helpers stripping `undefined` properties |
| **Inter-System & Cloud Secrets** | API key exposure | `GEMINI_API_KEY` is server-only and must be bound from Secret Manager during deployment; it is never a `VITE_*` variable |

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile doc: only the owner can read or write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Project documents & all subcollections
      match /projects/{projectId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /tasks/{taskId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /notes/{noteId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /decisions/{decisionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        match /conversations/{conversationId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;

          match /messages/{messageId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
    }
  }
}
```

---

## 🚀 Step-by-Step Google Cloud Run Deployment

> Deployment status: the repository contains deployment configuration, but no
> successful Cloud Run deployment or Secret Manager binding is claimed here.

### Local configuration

Use npm as the canonical package manager:

```bash
npm ci
npm run dev
```

Copy `.env.example` to an ignored local `.env` and populate the seven public
Firebase web variables. `VITE_FIREBASE_MEASUREMENT_ID` is optional. The
server-only `GEMINI_API_KEY` must never use a `VITE_` prefix. The frontend no
longer reads `firebase-applet-config.json`.

Firebase Anonymous Auth produces a real Firebase user and ID token when it is
enabled. If Firebase Auth is unavailable during local development, the app can
use a clearly labelled `guest-*` local-preview identity and browser storage.
That preview identity has no ID token and cannot call protected Gemini routes.
In production, synthetic guest fallback and silent Firestore-to-localStorage
downgrades are disabled.

The 40 requests/minute Gemini limiter is retained as immediate protection. It
is memory-backed and instance-local, so it is not a distributed quota across
Cloud Run instances.

### Gemini models requiring deployment-time verification

The server uses `GEMINI_MODEL`, defaulting to the official SDK quickstart model
`gemini-2.5-flash`. Optional `GEMINI_FALLBACK_MODELS` values are used only when
an operator explicitly supplies comma-separated model IDs verified for the same
Gemini Developer API key and project. The application no longer guesses future
model names in source code.

`VITE_FIREBASE_MEASUREMENT_ID` remains optional in local configuration, but is
not passed through the production Docker build because Firebase Analytics is
not initialized by this application. Add it to both Docker and Cloud Build only
if Analytics is intentionally introduced.

### Reproducible Cloud Build

`cloudbuild.yaml` runs `npm ci`, typechecking, and tests before building and
pushing the configured image. The known non-secret Firebase web identifiers
have project defaults. Supply the public Firebase Web API key explicitly:

```bash
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --project=gen-lang-client-0616895579 \
  --region=asia-southeast1 \
  --substitutions=_VITE_FIREBASE_API_KEY="YOUR_PUBLIC_FIREBASE_WEB_API_KEY"
```

The build fails before Vite compilation if a required Firebase build argument
is absent. Never add `GEMINI_API_KEY` to Cloud Build substitutions or Docker
build arguments.

### 1. Prerequisites & GCP APIs Setup
Ensure you have the Google Cloud SDK (`gcloud`) installed and configured:
```bash
# Login to GCP
gcloud auth login

# Set your target project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud Services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

### 2. Secret Manager Configuration (Zero-Hardcoding Hygiene)
Create a dedicated Cloud Run runtime identity, create the secret, add its value
through standard input (so it is not placed in a command argument), and grant
that identity access only to this secret:

```bash
# Create secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Create a dedicated runtime service account
gcloud iam service-accounts create projectpilot-runtime \
  --display-name="ProjectPilot Cloud Run runtime"

# Add the key through stdin; paste it when prompted and then send EOF
gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant only the dedicated runtime identity access to this secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:projectpilot-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Deploy Firestore Security Rules
Deploy the owner-bound rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

---

### 4. Build and Deploy to Cloud Run
Deploy the application to Cloud Run using an immutable container image and a Secret Manager binding:

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="PUBLIC_FIREBASE_WEB_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="YOUR_APP_ID" \
  --tag IMAGE_URL .
```

Push `IMAGE_URL` to Artifact Registry, then deploy that immutable image and
bind the server-only secret:

```bash
gcloud run deploy projectpilot-ai \
  --image IMAGE_URL \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account="projectpilot-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars="FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

Never pass `GEMINI_API_KEY` as a build argument or a `VITE_*` value.

---

### 5. Mandatory Campaign Labeling
To register the service for the **Google Cloud Run AI Challenge**, apply the required resource label:

```bash
gcloud run services update projectpilot-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Manual Walkthrough & Verification Guide

### Automated verification

```bash
npm ci
npm run lint
npm test
npm run build
npm audit
```

The test suite covers Firebase-token middleware behavior, rate limiting,
request-shape safeguards, prompt boundaries, response normalization, Firestore
owner isolation, production fallback gating, safe grounding URLs, and export
redaction. A production build should also be scanned to ensure server-only
secret names and credential-shaped values are absent from `dist/index.html`
and `dist/assets/`.

### Security and operational limitations

- The in-memory rate limiter applies independently to each Cloud Run instance.
- Gemini model identifiers must be checked in the target Google AI project.
- Local preview storage is intentionally non-durable and development-only.
- Firebase web configuration is public browser configuration; protect data with
  Firestore rules and restrict the associated API key in Google Cloud.
- `GEMINI_API_KEY` is server-only and must be supplied through Secret Manager.
- Historical Git cleanup and credential review are separate approval-gated
  operations and are not implied by a successful application build.
- Cloud Run, Firestore rules, Secret Manager, IAM, and live authentication must
  be verified in the target project before claiming production deployment.

### Troubleshooting

- A missing Firebase configuration error means one or more required
  `VITE_FIREBASE_*` values were unavailable during the Vite build.
- Repeated HTTP 401 responses usually indicate an expired/invalid Firebase ID
  token or a mismatch between frontend and Admin Firebase projects.
- Local preview guests cannot call Gemini APIs because they do not possess a
  Firebase ID token.
- A Firestore persistence error in production is surfaced deliberately; the
  app does not silently substitute browser storage.

### Test Suite 1: Authentication & Zero-Trust Workspace Isolation
1. **Google Sign-In**: Click "Continue with Google". Confirm user profile displays in Navbar and Firebase ID token is attached to backend API requests.
2. **Guest Mode**: Sign out and click "Continue as Guest". Confirm anonymous UID is provisioned and local state operates cleanly.
3. **Data Isolation**: Verify in Firestore Console that documents are created strictly under `/users/{auth.uid}/projects/{projectId}`.
4. **Backend Token Rejection**: Send a raw POST to `/api/gemini/analyze-project` without an `Authorization` header and confirm HTTP 401 Unauthorized is returned.

### Test Suite 2: Project Creation & Gemini Architecture Analysis
1. Click **+ New Project**. Enter Name (*"CloudScale Analytics"*), Description (*"High throughput stream processor"*), and leave "Generate Project Plan with Gemini" checked.
2. Submit and observe the loading state while Gemini generates the system architecture.
3. Navigate to **AI Project Plan**. Verify:
   - Problem Definition & Proposed Solution
   - Frontend, Backend, Database, Hosting, and AI/ML stack recommendations
   - Functional & Non-Functional Requirements
   - Risk matrix with severity badges and mitigations
   - Multi-phase roadmap

### Test Suite 3: Roadmap, Kanban, & AI Task Suggestions
1. Navigate to **Roadmap & Tasks**.
2. Click **AI Suggest Tasks**. Gemini reads the project objective and current phase, returning actionable task suggestions.
3. Click **+ Add** on a suggested task. Confirm it instantly appears on the Kanban board under "To Do".
4. Drag or change status to "In Progress" and "Completed". Verify the progress percentage updates in real-time.

### Test Suite 4: Context-Grounded Co-Pilot Chat
1. Navigate to **Project Co-Pilot**.
2. Click prompt chip: *"What should I work on next?"*.
3. Verify Gemini references your actual uncompleted roadmap tasks and project architecture in its response.
4. Click **New Thread** and test multi-conversation persistence across page reloads.

### Test Suite 5: Live Google Search Research Grounding
1. Click **Research Grounding** in the header.
2. Search a query such as: *"Latest best practices for React 19 server components vs client architecture"*.
3. Observe live web search results, source URLs, and clear technical synthesis.
4. Click **Save as Note** to verify instant synchronization with project knowledge base.

### Test Suite 6: Project Memory (ADRs & Notes)
1. Navigate to **Knowledge & ADRs**.
2. Record an Architecture Decision Record (e.g. *Decision: "Use Firestore for real-time listener subscriptions"*, *Status: "ACCEPTED"*).
3. Create a Research Note with category *"RESEARCH"* and tags `database, latency`.
4. Test instant text filtering and search.

### Test Suite 7: Live Health Diagnostic & 1-Click Action Queue
1. Navigate to **Health & Feasibility**.
2. Click **Run Live Diagnostic**. Observe Gemini auditing the roadmap momentum and architecture decisions.
3. Review Health Score (0-100), execution strengths, and identified risks.
4. Click **+ Add to Roadmap** on a recommended action item and confirm it is immediately appended to your roadmap backlog.

### Test Suite 8: Project Settings & Workspace Export
1. Navigate to **Settings**.
2. Click **Export JSON Workspace**. Verify a structured `.json` backup file containing your project metadata, tasks, ADRs, and notes is downloaded.
3. Modify project metadata and save.
