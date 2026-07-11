# 👁️🖋️ InkSight

> **An AI-Powered Grading & Insights Platform for Educators**

InkSight is a smart grading assistant that saves teachers hours of manual work. It allows educators to snap photos of handwritten essays, grades them instantly using a custom rubric, and builds visual dashboards to show exactly which topics a class is struggling with. Behind the scenes, it protects student privacy, uses a backup AI so it never crashes, and carefully manages data to avoid system limits.

**🔗 Live Demo:** [ink-sight-lac.vercel.app](https://ink-sight-lac.vercel.app/)

---

## 📋 Table of Contents

- [The Mission](#-the-mission)
- [Technology Stack](#️-technology-stack)
- [Core Engineering Features](#-core-engineering-features)
- [System Architecture](#️-system-architecture)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Deployment](#️-deployment)

---

## 🚀 The Mission

To eliminate grading bottlenecks while generating structured, actionable data from unstructured handwritten text. InkSight honors the traditional element of education (handwritten expression) while utilizing a fault-tolerant, ultra-low latency AI architecture and rigorous data privacy standards to support teachers.

---

## 🛠️ Technology Stack

* **Frontend:** React.js (Vite) styled with Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
* **Serverless Compute:** Supabase Edge Functions (Deno)
* **Primary AI Engine:** Groq API — `llama-3.3-70b-versatile` (text) / `llama-4-scout` (vision)
* **Fallback AI Engine:** Cerebras API — high-performance text redundancy
* **Image Processing:** Native HTML5/JavaScript File API (Base64 conversion)
* **Data Visualization:** Recharts
* **Deployment:** Vercel (frontend) + Supabase (backend/Edge Functions)

---

## ✨ Core Engineering Features

### 🧠 The Dual-Brain Fail-Safe Pipeline
Implements a redundant `try/catch` routing system inside a Supabase Edge Function. If the primary Groq inference engine times out or hits a rate limit, the system silently intercepts the failure and routes the exact prompt to the Cerebras fallback, ensuring zero downtime for the user and lightning-fast responses regardless of traffic. Both AI provider keys live server-side as Edge Function secrets — never exposed to the browser.

### 🚦 Concurrency Control & Rate Limit Management
To prevent `429 Too Many Requests` errors when processing batch uploads (e.g., 40+ essays), the Processing Queue utilizes a worker-pool pattern to orchestrate asynchronous grading requests in controlled, concurrent batches rather than firing everything at once.

### 🛡️ Privacy-First Design
Student names never leave the browser as part of any AI payload — only anonymized essay content and the grading rubric are sent to Groq/Cerebras. The Processing Queue UI displays masked identifiers (e.g., `Student_01`) during grading, while real names remain in your own Supabase database, visible only to the authenticated teacher who owns the assignment (enforced via Postgres Row Level Security).

### 📊 BI Analytics & Competency Gap Tracking
Moving beyond simple grading, InkSight stores execution metadata and structured rubric results in PostgreSQL. This powers a Recharts dashboard featuring:
* **Competency Gap Analyzer:** Visualizes class-wide mastery gaps based on specific rubric misses.
* **NLP Word Cloud:** Aggregates top keywords across essays to visualize class vocabulary trends.
* **Multi-Section Filtering:** Allows granular filtering across different class sections.
* **System Performance Dashboard:** Tracks engine reliability, fallback trigger rate, and average grading latency over time.

### 🔐 Full Authentication
Email/password sign-up and login via Supabase Auth, with a real password-reset flow, profile management, and route protection — every page requires an authenticated session, and every assignment is scoped to its owning teacher.

---

## 🏗️ System Architecture

```text
[Physical Written Essays] -> [Camera/Upload]
                                  │
                                  ▼
                        [ React Frontend ]
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
   (No PII in AI Payload)                      (Rate-Limit Queue)
            │                                           │
            └─────────────────────┬─────────────────────┘
                                  ▼
                    [ Supabase Edge Function ]
                                  │
                       [ Groq API Engine ] ──(If Fail)──> [ Cerebras API ]
                                  │                              │
                                  └──────────────┬───────────────┘
                                                 ▼
                                     [ Structured JSON Result ]
                                                 │
                                                 ▼
                                       [ Supabase Data Log ]
                                                 │
                                                 ▼
                                     [ Recharts BI Dashboard ]
```

---


## 🔑 Environment Variables

The frontend only needs Supabase connection details — AI provider keys are never exposed to the browser and are stored exclusively as Edge Function secrets.

| Variable | Location | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase Dashboard → Settings → API |
| `GROQ_API_KEY` | Supabase secret | `npx supabase secrets set` |
| `CEREBRAS_API_KEY` | Supabase secret | `npx supabase secrets set` |

---

## 📁 Project Structure

```
inksight/
├── src/
│   ├── assets/          # Logo and static images
│   ├── components/      # Sidebar, Layout, PageHeader, ProtectedRoute, etc.
│   ├── context/         # AuthContext (session, sign in/up/out, password reset)
│   ├── lib/             # Supabase client
│   └── pages/           # Route-level pages (Rubric Builder, Ingestion Hub,
│                         #   Processing Queue, Analytics, System Performance,
│                         #   Settings, Help & Support, Auth)
├── supabase/
│   └── functions/
│       └── grade-essay/ # Edge Function: Groq → Cerebras fail-safe grading pipeline
├── vercel.json           # SPA rewrite rules for client-side routing
└── .env.example
```

---

## ☁️ Deployment

Deployed on **Vercel**, connected to this repository for automatic redeploys on every push to `main`.

1. Push to `main` → Vercel builds (`npm run build`) and deploys automatically.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Project Settings → Environment Variables.
3. Add your production domain to Supabase → Authentication → URL Configuration (Site URL + Redirect URLs), or login/signup/password-reset emails will redirect to `localhost`.
