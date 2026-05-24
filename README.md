# APIspect — AI-Powered API Observability & Debugging

APIspect is a modern, premium Next.js-based web application designed to make API log monitoring, incident timeline parsing, and root-cause debugging frictionless. It converts raw, unstructured application logs (JSON, Apache, standard text format) into visual dashboards in milliseconds, assesses outage risk levels, tracks deployment regressions, and generates automated code fixes using advanced LLMs (Gemini, OpenAI, or Groq).

---

## Features

- **Instant Client-Side Parsing:** Upload `.log`, `.txt`, or `.json` files. The high-performance client-side parser extracts metrics, API failure rates, status code distributions, HTTP method frequencies, and endpoint statistics instantly without uploading private raw data to external servers.
- **AI-Powered Diagnostics (DebugPilot):** Run detailed diagnostics to identify anomalies, group recurring exceptions, pin down system bottlenecks (e.g., database pool exhaustions, authentication failures, network timeouts), and receive code/config remediation suggestions.
- **Chronological Incident Timelines:** Reconstructs the exact order of events leading up to a system failure, isolating warning metrics that preceded hard server errors.
- **Pre/Post-Deployment Log Comparison:** Compare log outputs from before and after a production deployment to detect regressions, latency spikes, or brand-new error signatures.
- **Predictive Outage Risk Assessment:** Computes an outage risk score (0-100) using multi-factor heuristics (failure rates, average response latency, database bottlenecks, timeout events).
- **Interactive Chat Copilot:** Chat with the built-in DebugPilot AI to ask contextual questions about logs, like *"Why is the `/api/v1/payment` endpoint failing?"* or *"What was the sequence of events?"*.

---

## Architecture & Tech Stack

APIspect is built on top of a highly responsive developer-centric stack:

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4 & PostCSS
- **Visualizations:** Recharts (responsive line, bar, pie, and radial charts)
- **Icons:** Lucide React
- **AI Integrations:** Native SDK interface for Google Generative AI (Gemini 2.5/2.5-flash) and API integrations for Groq (Llama 3.1) & OpenAI (GPT-4o-mini).
- **Local Fallback:** Robust local heuristic mock responses for when API keys are not provided, ensuring full dashboard functionality offline.

---

## Project Structure

```
APIspect/
├── public/                  # Static SVG resources & assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/     # POST endpoint for LLM log metrics diagnostics
│   │   │   ├── chat/        # POST endpoint for interactive copilot conversations
│   │   │   └── compare/     # POST endpoint for pre/post-deployment delta analysis
│   │   ├── dashboard/       # Main interactive dashboard layout and charts
│   │   ├── globals.css      # Core custom ambient styling
│   │   ├── layout.tsx       # Next.js global root layout
│   │   └── page.tsx         # Sleek landing page detailing features & UI walkthroughs
│   ├── components/
│   │   └── ui/              # Shared dashboard shell and card components
│   └── lib/
│       └── parser.ts        # The core log engine regex, metrics logic, & timeline builders
├── .env.local               # (Git-ignored) API key configuration
├── .gitignore               # Excludes dependencies, builds, and keys
├── package.json             # Build configurations & npm dependencies
└── tsconfig.json            # Strict TypeScript configuration
```

---

## Local Setup

### 1. Clone & Install Dependencies
Clone the repository and install the required npm packages:
```bash
git clone https://github.com/Aayushi-raj/APIspect.git
cd APIspect
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Add at least one of the keys below to unlock full AI diagnostics
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run Development Server
Start the Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## Deployment to Vercel

APIspect is fully compatible with [Vercel](https://vercel.com) out of the box. Follow these steps to deploy your application:

### Option A: Via Vercel Dashboard (Recommended)
1. Go to the [Vercel Dashboard](https://vercel.com/new).
2. Click **Import** next to the `Aayushi-raj/APIspect` repository.
3. In the **Environment Variables** section, expand it and add your API Keys:
   - Key: `GEMINI_API_KEY` | Value: `your_gemini_api_key`
4. Click **Deploy**. Vercel will automatically detect the Next.js configuration, compile the project, and provision a live URL.

### Option B: Via Vercel CLI
If you prefer deploying from your terminal:
1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Log in to your Vercel account:
   ```bash
   vercel login
   ```
3. Run the initial deployment from the project root:
   ```bash
   vercel
   ```
4. Add your production environment variables when prompted or on your Vercel project settings dashboard.
5. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## License
This project is open-source and available under the MIT License.
