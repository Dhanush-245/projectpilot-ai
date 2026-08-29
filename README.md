# ProjectPilot AI — Intelligent Project Workspace

> **Built for the Google Cloud Run AI Challenge**  
> *Turn ideas into structured architecture, actionable roadmaps, and context-aware intelligence powered by Gemini and Cloud Run.*

---

## 🌟 Overview & Original Enhancements

**ProjectPilot AI** is a production-grade, secure, multi-project intelligence workspace designed for students, software engineers, researchers, and technical builders. 

While traditional AI tools offer disconnected chat dialogues or simple personal journals, ProjectPilot AI transforms unstructured thoughts into an **end-to-end engineered project ecosystem**:
1. **Multi-Project Workspace**: Manage independent projects, each isolated securely in Cloud Firestore.
2. **AI System Architecture & Specification**: Gemini architects functional & non-functional requirements, recommended tech stacks, data models, and a technical risk matrix.
3. **Phase-Based Execution Roadmap**: Interactive Kanban & phase views with automatic milestone generation and Gemini-powered task suggestions.
4. **Context-Grounded Project Co-Pilot with Role Personas**: Multi-turn AI assistant with specialized personas (Tech Lead, Architect, Security Officer, Full-Stack Dev), model speed switcher, and live Google Search Grounding.
5. **Live Tech & Market Research Grounding**: Real-time Google Search integration (`gemini-3.5-flash` + `googleSearch` tool) to ground technical benchmarks, library documentation, security advisories, and web source citations.
6. **Project Memory (ADRs & Research Notes)**: Document technical tradeoffs and decisions that persist into AI context for long-term consistency.
7. **Live Project Health & Diagnostics**: Gemini audits project momentum, flags unmitigated risks, and creates 1-click corrective action items.
8. **Portable Markdown & JSON Export**: Full project export capabilities allowing developers to export their complete roadmap, notes, ADRs, and architecture as a portable Markdown document or JSON archive.
9. **Zero-Trust Backend Security**: Express API gateway protected with Firebase Admin SDK ID token authentication (`Authorization: Bearer <token>`), in-memory rate limiting, untrusted data delimiters (`<UNTRUSTED_PROJECT_DATA>`), and automated model fallback ladders (`gemini-3.5-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.1-pro-preview`).

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, React Markdown
- **Backend API Gateway**: Node.js Express server (`server.ts`) with Firebase Admin SDK token verification
- **AI Intelligence**: Google Gemini SDK (`@google/genai`) with server-side proxying and resilience ladder
- **Database & Auth**: Google Cloud Firestore & Firebase Authentication (Google Sign-In & Guest Session Mode)
- **Deployment Platform**: Google Cloud Run (Containerized Microservice)
- **Secret Management**: Google Cloud Secret Manager

---

## 🔒 Security Architecture & Zero-Trust Defense

ProjectPilot AI enforces **Zero Insecure Defaults** across all 5 Threat Zones:

| Threat Zone | Risk Identified | Countermeasure & Implementation |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection & oversized payloads | Strict body size limits (2MB), string truncation sanitizer (`sanitizeString`), and schema validation |
| **Planning & Reasoning** | Prompt injection & system prompt override | All user inputs & project context are encapsulated inside `<UNTRUSTED_PROJECT_DATA>` tags with explicit safety directives |
| **Tool & Endpoint Execution** | Unauthenticated Gemini API abuse & credential theft | Firebase Admin SDK verifies Bearer ID tokens on every `/api/gemini/*` endpoint; rate limiting active |
| **Memory & State** | Cross-user data leakage & tampering | Strict owner-bound Firestore rules (`request.auth.uid == userId`) and sanitizeData helpers stripping `undefined` properties |
| **Inter-System & Cloud Secrets** | API key exposure | `GEMINI_API_KEY` is isolated server-side via Cloud Secret Manager; zero frontend exposure |

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
Create and populate the `GEMINI_API_KEY` in Google Cloud Secret Manager, and grant the Cloud Run compute service account access:

```bash
# Create secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add secret version with your Gemini API key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Retrieve your Project Number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Deploy Firestore Security Rules
Deploy the owner-bound rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

### 4. Build and Deploy to Cloud Run
Deploy the application directly to Cloud Run using source deployment with the Secret Manager binding:

```bash
gcloud run deploy projectpilot-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

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
