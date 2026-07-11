# 👁️🖋️ InkSight

> **An AI-Powered Grading & Insights Platform for Educators**

InkSight is a smart grading assistant that saves teachers hours of manual work. It allows educators to snap photos of handwritten essays, grades them instantly using a custom rubric, and builds visual dashboards to show exactly which topics a class is struggling with. Behind the scenes, it protects student privacy, uses a backup AI so it never crashes, and carefully manages data to avoid system limits.

---

## 🚀 The Mission
To eliminate grading bottlenecks while generating structured, actionable data from unstructured handwritten text. InkSight honors the traditional element of education (handwritten expression) while utilizing a fault-tolerant, ultra-low latency AI architecture and rigorous data privacy standards to support teachers.

## 🛠️ Technology Stack
* **Frontend:** React.js (Vite) styled with Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL)
* **Primary AI Engine:** Groq API (Ultra-fast LLM inference)
* **Fallback AI Engine:** Cerebras API (High-performance redundancy)
* **Image Processing:** Native HTML5/JavaScript File API (Base64 conversion / OCR prep)
* **Data Visualization:** Recharts

---

## ✨ Core Engineering Features

### 🧠 The Dual-Brain Fail-Safe Pipeline
Implements a redundant `try/catch` routing system. If the primary Groq inference engine times out or hits a rate limit, the system silently intercepts the failure and routes the exact prompt to the Cerebras fallback, ensuring zero downtime for the user and lightning-fast responses regardless of traffic.

### 🚦 Concurrency Control & Rate Limit Management
To prevent `429 Too Many Requests` errors when processing batch uploads (e.g., 40+ essays), the ingestion pipeline utilizes a Promise Queue to orchestrate asynchronous API requests in controlled, localized batches.

### 🛡️ Client-Side PII Masking
Ensuring strict educational data governance, all Personally Identifiable Information (PII) is masked client-side. Student names are temporarily replaced with anonymous IDs (e.g., `Student_01`) before payloads hit third-party LLMs, and are re-mapped locally upon the return of the JSON response.

### 📊 BI Analytics & Competency Gap Tracking
Moving beyond simple grading, InkSight stores execution metadata and structured rubric results in PostgreSQL. This powers a Recharts dashboard featuring:
* **Competency Gap Analyzer:** Visualizes class-wide mastery gaps based on specific rubric misses.
* **NLP Word Cloud:** Aggregates top keywords across essays to visualize class vocabulary trends.
* **Multi-Section Filtering:** Allows granular filtering across different class sections.

---

## 🏗️ System Architecture 

```text
[Physical Written Essays] -> [Camera/Upload]
                                  │
                                  ▼
                        [ React Frontend ]
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
   (PII Name Masking)                          (Rate-Limit Queue)
            │                                           │
            └─────────────────────┬─────────────────────┘
                                  ▼
                       [ Groq API Engine ] ──(If 429/Fail)──> [ Cerebras API ]
                                  │                                  │
                                  └──────────────────┬───────────────┘
                                                     ▼
                                         [ Structured JSON Result ]
                                                     │
                                                     ▼
                                           [ Supabase Data Log ]
                                                     │
                                                     ▼
                                         [ Recharts BI Dashboard ]
```
