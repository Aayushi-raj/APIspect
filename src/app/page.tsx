import Link from 'next/link';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  Code, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  GitCompare, 
  Layers 
} from 'lucide-react';
import { SmoothAnchor } from '@/components/ui/smooth-anchor';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden relative">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              APIspect
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <SmoothAnchor targetId="features" className="hover:text-white transition-colors">Features</SmoothAnchor>
            <a href="https://github.com/Aayushi-raj/APIspect" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Github</a>
          </nav>

          <div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-200"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-28 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-purple-500/5 text-purple-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Observability</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Observe API Failures in Real-Time &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Debug with AI
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Stop digging through thousands of log lines. APIspect parses your files in milliseconds, runs instant diagnostics, predicts outages, and writes code fixes automatically.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 transition-all duration-200 group"
            >
              Start Uploading Logs
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl transition-all duration-200"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Dashboard Preview / Mock Grid */}
        <div className="mt-20 border border-zinc-800/60 bg-zinc-950/30 rounded-2xl p-4 md:p-6 backdrop-blur-sm relative shadow-2xl">
          <div className="absolute -top-3 left-6 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500">
            observability_workspace.log
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2 border-b border-zinc-900 pb-3">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-zinc-500 ml-4">Terminal Session</span>
              </div>
              <div className="font-mono text-xs text-zinc-400 space-y-2.5 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 overflow-x-auto">
                <p className="text-zinc-500">[2026-05-23T13:30:00.012Z] INFO: Listening on port 3000</p>
                <p className="text-emerald-400">[2026-05-23T13:30:15.110Z] GET /api/v1/user/profile 200 OK - took 45ms</p>
                <p className="text-amber-400">[2026-05-23T13:30:18.552Z] WARN: GET /api/v1/products latency 2200ms - query execution slow</p>
                <p className="text-rose-500">[2026-05-23T13:30:20.902Z] ERROR: POST /api/v1/payment 500 - db connection timeout after 3000ms</p>
                <p className="text-rose-400">[2026-05-23T13:30:22.012Z] ERROR: POST /api/v1/payment 500 - pool exhausted, failed to acquire connection</p>
              </div>
            </div>

            <div className="border border-zinc-800/80 bg-purple-950/10 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Insight Card</span>
                </div>
                <h4 className="text-base font-bold text-white">Database Pool Timeout Detected</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your payments service is failing because it took over 3000ms to acquire a connection. This points to database exhaustion, likely due to un-indexed complex queries.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-900 space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Suggested Fix</span>
                <pre className="text-[10px] text-cyan-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 overflow-x-auto">
                  {`// Increase Pool Limit in config\ndatabase.maxPool = 25;\ndatabase.timeout = 10000;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-zinc-900 relative z-10 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need to debug faster
          </h2>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            Combining lightning-fast client parsing with deep generative AI capabilities to make observability frictionless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Log Upload & Parsing</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Upload `.txt`, `.json`, or `.log` files. Out-of-the-box browser-side parsing computes request counts, error rates, and response metrics instantly.
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Root Cause Diagnostics</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Let the AI engine correlate log logs, identify repeating exceptions, and point out system bottlenecks like database pools, auth failures, and rate limits.
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Debugging Recommendations</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Don't just look at the stack trace. The assistant writes step-by-step remediation fixes, config tuning details, and code adjustments to fix the bug.
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Outage Risk Prediction</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Computes and flags outage levels (Low, Medium, High, Critical) using a combination of fast rule-based math and logical LLM forecasting.
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Deployment Comparisons</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Upload log segments before and after pushing code. The AI checks for regressions, latency spikes, and brand new error patterns introduced by the release.
            </p>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Harmonious Dashboards</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Beautiful charts for latency distribution, API failure rates, status codes, and failing endpoints. Optimized for dark screens.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 bg-zinc-950/40 text-center text-xs text-zinc-500">
        <p>© 2026 APIspect Observability Inc. Built for premium developers.</p>
      </footer>
    </div>
  );
}
