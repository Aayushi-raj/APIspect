# APIspect - AI-Powered API Observability & Debugging

**Live demo:** [https://api-spect.vercel.app/](https://api-spect.vercel.app/)  
**Repository:** [https://github.com/Aayushi-raj/APIspect](https://github.com/Aayushi-raj/APIspect)
**Demonstration** [https://drive.google.com/file/d/1FOVjH2sN7AE_bLIllo_WN-0fuS9smBf-/view?usp=sharing](https://drive.google.com/file/d/1FOVjH2sN7AE_bLIllo_WN-0fuS9smBf-/view?usp=sharing)

APIspect turns messy API logs into an incident-ready debugging workspace. Upload raw logs, get instant metrics, see the failure timeline, compare pre/post deployment behavior, and ask an AI copilot what broke and how to fix it.

It is built for the moment every developer knows too well: production is failing, the logs are noisy, and the team needs a root-cause direction now.

---

## The Problem

Modern APIs generate thousands of log lines during incidents. Developers often waste critical minutes manually searching for:

- the first warning before the outage
- the endpoint causing the most failures
- latency spikes hidden inside normal traffic
- new errors introduced after a deployment
- whether the issue is auth, database, timeout, rate limiting, or something else

Traditional observability tools are powerful, but they often require setup, agents, dashboards, queries, and backend ingestion before they become useful. APIspect focuses on a faster workflow: drop in the logs and get a debugging cockpit immediately.

---

## The Solution

APIspect combines a client-side log parser with AI-assisted diagnostics.

The raw log parsing happens in the browser, so users can inspect sensitive logs without uploading the full raw file to a third-party service. The app extracts metrics locally, then sends only structured summaries and selected error samples to the AI diagnostic endpoints when AI analysis is requested.

Core workflow:

1. Upload or paste `.log`, `.txt`, or `.json` logs.
2. APIspect parses requests, status codes, latency, endpoints, methods, warnings, and errors.
3. The dashboard visualizes API health in real time.
4. DebugPilot AI explains the likely root cause and suggests practical fixes.
5. The comparison mode detects regressions between logs before and after a deployment.

---

## Why It Stands Out

- **Instant value:** no agents, no database, no setup-heavy observability pipeline.
- **Privacy-conscious by design:** raw log parsing runs client-side.
- **Incident timeline reconstruction:** surfaces the order of warning and failure events.
- **Deployment regression detection:** compares before/after logs to identify newly introduced failures.
- **AI with a fallback:** Gemini, OpenAI, or Groq can power diagnostics, but local heuristic responses keep the product usable without API keys.
- **Built for demos and real debugging:** sample data, live simulation, charts, reports, and chat are all part of one flow.

---

## Feature Highlights

### Client-Side Log Parsing

APIspect parses common JSON logs, Apache-style lines, and standard text logs. It extracts:

- HTTP methods
- endpoints
- status codes
- latency values
- warning/error levels
- recent error samples
- endpoint-level failure statistics

### Outage Risk Scoring

The app computes an outage risk score from `0-100` using:

- failure rate
- average latency
- warning density
- timeout patterns
- database bottleneck signals
- authentication failure signatures

The score maps into `Low`, `Medium`, `High`, or `Critical` severity.

### DebugPilot AI Diagnostics

DebugPilot can summarize the incident, identify likely root causes, list top issues, estimate business impact, and recommend remediation steps. Depending on the configured provider, it can use:

- Google Gemini
- OpenAI
- Groq
- local heuristic fallback mode

### Incident Timeline

APIspect reconstructs a chronological view of warnings and failures so teams can understand what happened first, what escalated, and which endpoint became unstable.

### Deployment Comparison

Upload logs from before and after a release. APIspect compares:

- latency changes
- failure-rate changes
- new error signatures
- regression severity
- rollback or hotfix recommendation

### Interactive Copilot Chat

Ask questions such as:

- "Why is `/api/v1/payment` failing?"
- "What caused the latency spike?"
- "What happened first in the logs?"
- "Show me database-related errors."

---

## Demo Flow for Judges

1. Open the [live demo](https://api-spect.vercel.app/).
2. Launch the dashboard.
3. Click **Load Sample Logs** to simulate a production payment outage.
4. Review the generated metrics, charts, outage score, endpoint failures, and timeline.
5. Run **AI Diagnostics** to see the root-cause explanation and suggested fixes.
6. Open **DebugPilot AI Copilot** and ask why the payment API is failing.
7. Switch to deployment comparison and load the before/after samples to see regression detection.

This shows the full product loop: observe, diagnose, explain, and respond.

---

## Architecture Diagram

![APIspect Architecture](/public/architectureDiagram.jpeg)

## Workflow Diagram

![APIspect Workflow](/public/workflowDiagram.jpeg)

---

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** React 19
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Icons:** Lucide React
- **AI Providers:** Google Generative AI, OpenAI-compatible APIs, Groq
- **Deployment:** Vercel

---

## Project Structure

```text
APIspect/
|-- public/                  # Static assets
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |   |-- analyze/     # POST endpoint for AI log diagnostics
|   |   |   |-- chat/        # POST endpoint for DebugPilot chat
|   |   |   `-- compare/     # POST endpoint for deployment comparison
|   |   |-- dashboard/       # Main observability dashboard
|   |   |-- globals.css      # Global styling
|   |   |-- layout.tsx       # Root layout
|   |   `-- page.tsx         # Landing page
|   |-- components/
|   |   `-- ui/              # Shared UI primitives
|   `-- lib/
|       `-- parser.ts        # Log parsing and metrics engine
|-- package.json
|-- tsconfig.json
`-- README.md
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable AI diagnostics, create `.env.local` and add one or more provider keys:

```bash
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

The app still works without API keys through local fallback diagnostics.

---

## What Is Implemented Today

- Browser-side log parsing
- Observability dashboard
- Status, method, endpoint, error, and latency metrics
- Outage risk scoring
- Incident timeline generation
- AI diagnostics endpoint
- AI chat copilot endpoint
- Deployment comparison endpoint
- Local fallback analysis when no API key is configured
- Sample logs and live simulation experience

---

## Honest Limitations

APIspect is a hackathon MVP, so a few things are intentionally scoped:

- It does not ingest live production traffic yet.
- It does not store historical incidents or user workspaces.
- AI output is advisory and should be reviewed before applying changes.
- The parser supports common log formats, but highly custom logs may need format-specific adapters.
- Generated recommendations include code/config examples, but APIspect does not directly patch a user's codebase.

---

## Future Roadmap

- Real-time log streaming integrations
- Saved incident reports
- Team workspaces and shared dashboards
- Custom parser templates
- GitHub issue or pull request generation from incident reports
- Slack or Teams incident alerts
- More precise schema validation for AI responses
- Support for traces and metrics beyond logs

---

## License

This project is open source and available under the MIT License.
