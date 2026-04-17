# SENTINEL AI — AI-Driven Threat Detection & Simulation Engine

> **Hack Malenadu '26 · Cybersecurity Track · Problem Statement 3**

SENTINEL AI is a real-time Security Operations Center (SOC) dashboard that detects, classifies, explains, and simulates cyber threats using AI-powered analysis with multi-layer signal correlation.

## 🎯 Problem Statement Coverage

| Requirement | Implementation | Status |
|---|---|---|
| Multi-Signal Ingestion (2+ layers) | Network + Endpoint + Application layers | ✅ |
| Unified Event Schema | Supabase PostgreSQL with normalized incident schema | ✅ |
| High-throughput (500+ events/sec) | Burst test mode in Judge Panel | ✅ |
| 4+ Threat Categories | Brute Force, Lateral Movement, Data Exfiltration, C2 Beaconing, Port Scan, Malware, Phishing, DNS Tunneling, Privilege Escalation, SQL Injection, Zero Day | ✅ |
| Confidence Scoring | Per-incident confidence with cross-layer fusion breakdown | ✅ |
| Severity Levels | LOW / MEDIUM / HIGH / CRITICAL | ✅ |
| Cross-layer Correlation | Multi-layer incidents marked as CORRELATED with higher confidence | ✅ |
| MITRE ATT&CK Mapping | Full technique + tactic mapping (T1046, T1110, T1059, T1021, T1041, etc.) | ✅ |
| Plain-English Explainability | CEO mode — zero jargon, business impact focus | ✅ |
| Technical Explainability | Analyst mode — MITRE terminology, IOC indicators | ✅ |
| False Positive Detection | Behavioral baseline comparison with reasoning | ✅ |
| Dynamic Playbooks | AI-generated playbooks for unknown threats + static per threat type | ✅ |
| Live SOC Dashboard | 3-panel real-time dashboard with Kill Chain visualization | ✅ |
| Threat Simulation | Judge panel with preset scenarios + custom attack injection | ✅ |
| Dual Simultaneous Attacks | Brute Force + C2 Beacon scenario | ✅ |
| Realistic False Positive | Admin bulk file transfer scenario included | ✅ |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    LOG SOURCES                        │
│  Network IDS │ Endpoint EDR │ Application │ DNS/Proxy │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│            NORMALIZATION ENGINE (Supabase)            │
│     Parse logs → Extract IOCs → Unified Schema       │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              CORRELATION ENGINE                       │
│  Multi-layer signal fusion │ Kill Chain mapping       │
│  RECON → INITIAL ACCESS → EXECUTION → LATERAL → EXFIL│
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│               SAMANTHA AI (Groq LLM)                  │
│  llama-3.3-70b │ Analyst Mode │ CEO Mode │ Streaming  │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              SOC DASHBOARD v3.1                       │
│  Kill Chain │ Incident Feed │ AI Analysis │ Playbook  │
└──────────────────────────────────────────────────────┘
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd sentinel-ai
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GROQ_API_KEY=<your-groq-api-key>
```

### Supabase Tables Required

```sql
-- Incidents table (core)
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID,
  stage TEXT,
  threat_type TEXT,
  severity TEXT,
  confidence INTEGER,
  mitre_technique TEXT,
  mitre_tactic TEXT,
  is_false_positive BOOLEAN DEFAULT false,
  false_positive_reason TEXT,
  correlated BOOLEAN DEFAULT false,
  layers_involved TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attacks table
CREATE TABLE attacks (
  id UUID PRIMARY KEY,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID,
  action TEXT,
  actor TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decision log
CREATE TABLE attack_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_id UUID,
  decision TEXT,
  notes TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Run

```bash
npm run dev
```

- **Dashboard**: http://localhost:5173
- **Judge Panel**: http://localhost:5173/judge.html

## 🎮 Demo Flow

### For Judges:

1. Open **Judge Panel** (`/judge.html`) on one screen
2. Open **SOC Dashboard** (`/`) on another screen
3. Enter your name and select an attack scenario
4. Click **INITIATE ATTACK SEQUENCE**
5. Watch the dashboard respond in real-time:
   - Kill Chain progresses through stages
   - Incidents appear with severity badges
   - Samantha AI provides live analysis
   - Response playbook updates with actionable steps

### Custom Attack Injection:
- Switch to **CUSTOM ATTACK** tab
- Set any threat type, severity, stage, confidence, and signal layers
- Inject and watch the dashboard detect and analyze it in real-time

### Burst Testing:
- Switch to **BURST TEST** tab
- Fire 100-500 events to test throughput handling

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Database | Supabase (PostgreSQL + Realtime) |
| AI Engine | Groq API (llama-3.3-70b-versatile) |
| Styling | Inline CSS (terminal aesthetic) |

## 📁 Project Structure

```
sentinel-ai/
├── public/
│   ├── judge.html          # Judge access terminal
│   ├── favicon.svg         # App icon
│   └── architecture.svg    # Architecture diagram
├── src/
│   ├── components/
│   │   ├── IncidentFeed.jsx     # Real-time incident list with polling + realtime
│   │   ├── SamanthaStream.jsx   # AI analysis with streaming
│   │   ├── KillChain.jsx        # 5-stage kill chain visualization
│   │   ├── DecisionPanel.jsx    # Analyst decision logging
│   │   ├── PlaybookPanel.jsx    # Dynamic response playbooks
│   │   └── ConfidenceTooltip.jsx # Confidence breakdown tooltip
│   ├── lib/
│   │   ├── supabase.js          # Supabase client
│   │   └── groq.js              # Groq AI streaming + prompt engineering
│   ├── pages/
│   │   ├── Dashboard.jsx        # Main SOC dashboard layout
│   │   └── Architecture.jsx     # System architecture diagram
│   ├── App.jsx
│   └── main.jsx
├── .env.local              # Environment variables
├── package.json
└── vite.config.js
```

## 👥 Team

Built for **Hack Malenadu '26** — Cybersecurity Track
