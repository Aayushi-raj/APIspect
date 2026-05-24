'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  FileText, 
  Database, 
  Sparkles, 
  Lock, 
  Server, 
  AlertCircle, 
  XCircle, 
  GitCompare, 
  Layers, 
  TrendingUp, 
  X,
  Play,
  ArrowRight,
  Code,
  Send,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar
} from 'recharts';
import { parseLogs, ParsedLogMetrics } from '@/lib/parser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

// --- MARKDOWN RENDERING HELPERS FOR AI COPILOT ---
const parseInlineMarkdown = (text: string): React.ReactNode[] | string => {
  const tokens: any[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      tokens.push(textBefore);
    }
    
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(<strong key={`b-${match.index}`} className="font-extrabold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(<code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-900/60 font-mono text-[10px] text-purple-300 font-semibold">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(<em key={`i-${match.index}`} className="italic text-zinc-200">{token.slice(1, -1)}</em>);
    }
    
    lastIndex = regex.lastIndex;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    tokens.push(remaining);
  }

  return tokens.length > 0 ? tokens : text;
};

const formatMessageContent = (content: string) => {
  const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2] });
    lastIndex = regex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push({ type: 'text', content: remainingText });
  }

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <pre key={index} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900/80 font-mono text-[11px] text-cyan-400 overflow-x-auto leading-relaxed my-2.5 shadow-inner">
          <code className="text-cyan-400/90">{part.content.trim()}</code>
        </pre>
      );
    }

    const lines = part.content.split('\n');
    return (
      <div key={index} className="space-y-2 text-zinc-300">
        {lines.map((line, lidx) => {
          const cleanLine = line.trim();
          if (!cleanLine) return <div key={lidx} className="h-1.5" />;

          if (cleanLine.startsWith('### ')) {
            return <h5 key={lidx} className="font-extrabold text-xs text-white mt-3 border-b border-zinc-800/60 pb-1">{parseInlineMarkdown(cleanLine.replace('### ', ''))}</h5>;
          }
          if (cleanLine.startsWith('## ')) {
            return <h4 key={lidx} className="font-extrabold text-sm text-white mt-4 border-b border-zinc-800/80 pb-1.5">{parseInlineMarkdown(cleanLine.replace('## ', ''))}</h4>;
          }
          if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
            return (
              <ul key={lidx} className="list-disc pl-4 text-zinc-300">
                <li className="leading-relaxed my-0.5">{parseInlineMarkdown(cleanLine.substring(2))}</li>
              </ul>
            );
          }

          return <p key={lidx} className="leading-relaxed text-zinc-300 my-1">{parseInlineMarkdown(cleanLine)}</p>;
        })}
      </div>
    );
  });
};

// --- SAMPLE DATA CONFIGURATIONS ---

const SINGLE_LOG_SAMPLE = `[2026-05-23T13:30:01.012Z] INFO GET /api/v1/auth/session - 200 - took 14ms
[2026-05-23T13:30:02.155Z] INFO GET /api/v1/user/profile - 200 - took 32ms
[2026-05-23T13:30:03.412Z] INFO GET /api/v1/products - 200 - took 88ms
[2026-05-23T13:30:04.992Z] WARN GET /api/v1/products - latency 1250ms - slow query warning
[2026-05-23T13:30:05.102Z] INFO GET /api/v1/auth/session - 200 - took 12ms
[2026-05-23T13:30:06.331Z] INFO POST /api/v1/cart/add - 200 - took 65ms
[2026-05-23T13:30:07.502Z] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms
[2026-05-23T13:30:08.012Z] INFO GET /api/v1/auth/session - 200 - took 10ms
[2026-05-23T13:30:09.112Z] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms
[2026-05-23T13:30:10.551Z] INFO GET /api/v1/user/profile - 200 - took 41ms
[2026-05-23T13:30:11.890Z] ERROR POST /api/v1/payment - 500 - connection pool exhausted
[2026-05-23T13:30:12.302Z] WARN GET /api/v1/user/billing - 401 - missing bearer token
[2026-05-23T13:30:13.112Z] INFO GET /api/v1/auth/session - 200 - took 15ms
[2026-05-23T13:30:14.901Z] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms
[2026-05-23T13:30:15.012Z] WARN POST /api/v1/payment - latency 3120ms
[2026-05-23T13:30:16.892Z] ERROR POST /api/v1/payment - 500 - connection pool exhausted
[2026-05-23T13:30:17.001Z] INFO GET /api/v1/products - 200 - took 95ms
[2026-05-23T13:30:18.420Z] ERROR POST /api/v1/checkout - 500 - failed to commit db transaction
[2026-05-23T13:30:19.112Z] WARN GET /api/v1/products - latency 1890ms
[2026-05-23T13:30:20.155Z] INFO GET /api/v1/user/profile - 200 - took 30ms
[2026-05-23T13:30:21.012Z] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms
[2026-05-23T13:30:22.402Z] INFO GET /api/v1/auth/session - 200 - took 11ms
[2026-05-23T13:30:23.902Z] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms
[2026-05-23T13:30:24.012Z] INFO GET /api/v1/auth/session - 200 - took 14ms
[2026-05-23T13:30:25.155Z] INFO GET /api/v1/user/profile - 200 - took 28ms`;

const BEFORE_DEPLOY_SAMPLE = `[2026-05-23T10:00:00.001Z] INFO GET /api/v1/products - 200 OK - took 40ms
[2026-05-23T10:00:05.102Z] INFO GET /api/v1/products - 200 OK - took 35ms
[2026-05-23T10:00:10.222Z] INFO GET /api/v1/products - 200 OK - took 48ms
[2026-05-23T10:00:15.340Z] INFO GET /api/v1/products - 200 OK - took 42ms
[2026-05-23T10:00:20.450Z] INFO GET /api/v1/products - 200 OK - took 39ms
[2026-05-23T10:00:25.560Z] INFO GET /api/v1/products - 200 OK - took 45ms
[2026-05-23T10:00:30.670Z] INFO GET /api/v1/products - 200 OK - took 50ms
[2026-05-23T10:00:35.780Z] INFO GET /api/v1/products - 200 OK - took 38ms
[2026-05-23T10:00:40.890Z] INFO GET /api/v1/products - 200 OK - took 44ms
[2026-05-23T10:00:45.990Z] INFO GET /api/v1/products - 200 OK - took 41ms`;

const AFTER_DEPLOY_SAMPLE = `[2026-05-23T11:00:00.001Z] WARN GET /api/v1/products - latency 2240ms
[2026-05-23T11:00:05.102Z] ERROR GET /api/v1/products - 500 Internal Server Error - SQL Error: Column 'discount_rate' not found in table 'products'
[2026-05-23T11:00:10.222Z] WARN GET /api/v1/products - latency 2100ms
[2026-05-23T11:00:15.340Z] ERROR GET /api/v1/products - 500 Internal Server Error - SQL Error: Column 'discount_rate' not found in table 'products'
[2026-05-23T11:00:20.450Z] WARN GET /api/v1/products - latency 2350ms
[2026-05-23T11:00:25.560Z] ERROR GET /api/v1/products - 500 Internal Server Error - SQL Error: Column 'discount_rate' not found in table 'products'
[2026-05-23T11:00:30.670Z] WARN GET /api/v1/products - latency 2450ms
[2026-05-23T11:00:35.780Z] ERROR GET /api/v1/products - 500 Internal Server Error - SQL Error: Column 'discount_rate' not found in table 'products'
[2026-05-23T11:00:40.890Z] WARN GET /api/v1/products - latency 2280ms
[2026-05-23T11:00:45.990Z] ERROR GET /api/v1/products - 500 Internal Server Error - SQL Error: Column 'discount_rate' not found in table 'products'`;

const COLORS = ['#8B5CF6', '#06B6D4', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'observe' | 'compare'>('observe');
  
  // Single Log Observability States
  const [rawInput, setRawInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [metrics, setMetrics] = useState<ParsedLogMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [noApiKey, setNoApiKey] = useState(false);

  // Chatbot (Ask DebugPilot AI) States
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '### Hello Developer! I am DebugPilot AI.\n\nI have parsed your system logs and I am ready to troubleshoot. How can I help you? Try asking:\n- *"Why is the payment API failing?"*\n- *"What caused the latency spikes?"*' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Incident Report States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Live Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<string[]>([]);
  const [showWowAlert, setShowWowAlert] = useState(false);
  const [hasTriggeredWow, setHasTriggeredWow] = useState(false);
  const simTimerRef = useRef<any>(null);
  const simLogsRef = useRef<string>('');

  // Deployment Comparison States
  const [beforeInput, setBeforeInput] = useState('');
  const [afterInput, setAfterInput] = useState('');
  const [beforeFileName, setBeforeFileName] = useState('');
  const [afterFileName, setAfterFileName] = useState('');
  const [beforeMetrics, setBeforeMetrics] = useState<ParsedLogMetrics | null>(null);
  const [afterMetrics, setAfterMetrics] = useState<ParsedLogMetrics | null>(null);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareNoApiKey, setCompareNoApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  if (!mounted) return null;

  // --- LOG PARSING ACTIONS ---

  const handleParseSingle = (content: string, name: string = 'Uploaded Logs') => {
    try {
      const results = parseLogs(content);
      setMetrics(results);
      setFileName(name);
      setAiAnalysis(null);
      setAiError(null);
      setNoApiKey(false);
    } catch (err) {
      console.error(err);
      alert('Failed to parse logs. Ensure the file contains text content.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseSingle(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setRawInput(SINGLE_LOG_SAMPLE);
    handleParseSingle(SINGLE_LOG_SAMPLE, 'production_payment_outage.log');
  };

  // --- AI ANALYSIS FOR SINGLE LOG ---

  const runAiAnalysis = async () => {
    if (!metrics) return;
    setLoadingAi(true);
    setAiError(null);
    setNoApiKey(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          recentErrors: metrics.recentErrors
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.noKey) {
          setNoApiKey(true);
          // Generate a fallback rule-based diagnostic for UI completeness
          setAiAnalysis(generateLocalDiagnostics(metrics));
        } else {
          throw new Error(data.error || 'Server error running AI Analysis');
        }
      } else {
        setAiAnalysis(data);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Connection failed.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim() || !metrics) return;
    
    const newUserMessage = { role: 'user' as const, content: msgText };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setChatInput('');
    setLoadingChat(true);
    setChatError(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          recentErrors: metrics.recentErrors,
          messages: updatedHistory
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to chat with DebugPilot AI');
      }
      
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.content }]);
      if (data.noKey) {
        setNoApiKey(true);
      }
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || 'Connection failed.');
    } finally {
      setLoadingChat(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const generateIncidentReport = async () => {
    if (!metrics) return;
    setLoadingReport(true);
    setShowReportModal(true);
    setReportData(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          recentErrors: metrics.recentErrors
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate incident report');
      }
      
      setReportData({
        incidentId: `INC-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        severity: data.severity || metrics.outageRisk,
        summary: data.summary,
        rootCause: data.rootCause,
        affectedServices: Object.keys(metrics.endpointMetrics).filter(p => metrics.endpointMetrics[p].failures > 0),
        recommendedActions: data.recommendations || [],
        outageRiskScore: metrics.outageRiskScore
      });
    } catch (err: any) {
      console.error(err);
      setReportData({
        incidentId: `INC-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        severity: metrics.outageRisk,
        summary: `Incident summary: ${metrics.failureRate}% failure rate detected with ${metrics.errorsCount} transaction errors.`,
        rootCause: metrics.errorCategories[0]?.name === 'Database Bottleneck' 
          ? 'Database connection exhaustion causing HTTP 500 response codes on payment and checkout endpoints.'
          : 'High response latency and request gateway timeouts.',
        affectedServices: Object.keys(metrics.endpointMetrics).filter(p => metrics.endpointMetrics[p].failures > 0),
        recommendedActions: [
          { title: 'Increase Connection Pool Size', description: 'Scale db connections count up to 30' },
          { title: 'Optimize Indexing', description: 'Apply database table indexes on lookup constraints' }
        ],
        outageRiskScore: metrics.outageRiskScore
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulatedAlerts(['[START] Live stream simulation initiated...', '[INFO] Monitoring incoming network request streams...']);
    setShowWowAlert(false);
    setHasTriggeredWow(false);
    
    let baseLogs = rawInput || SINGLE_LOG_SAMPLE;
    simLogsRef.current = baseLogs;
    let tickCount = 0;
    
    simTimerRef.current = setInterval(() => {
      tickCount++;
      const timestamp = new Date().toISOString();
      let newLog = '';
      let newAlert = '';
      
      // WOW Moment: On tick 3, trigger massive database pool outage!
      if (tickCount === 3) {
        newLog = Array(6).fill(0).map((_, i) => 
          `[${new Date(Date.now() + i*100).toISOString()}] ERROR POST /api/v1/payment - 500 - db connection pool exhausted, took 3120ms`
        ).join('\n');
        newAlert = `[NEW] 🚨 CRITICAL OUTAGE: Database connection pool fully exhausted!`;
      } else {
        const rand = Math.random();
        if (rand < 0.2) {
          newLog = `[${timestamp}] ERROR POST /api/v1/payment - 500 - db connection timeout after 3000ms`;
          newAlert = `[NEW] 🚨 Timeout detected: POST /api/v1/payment failed (HTTP 500)`;
        } else if (rand < 0.4) {
          newLog = `[${timestamp}] WARN GET /api/v1/products - latency ${Math.floor(2000 + Math.random() * 1500)}ms - slow database query warning`;
          newAlert = `[NEW] ⚠️ Latency spike: GET /api/v1/products execution delayed`;
        } else if (rand < 0.6) {
          newLog = `[${timestamp}] ERROR POST /api/v1/payment - 500 - pool exhausted, failed to acquire connection`;
          newAlert = `[NEW] 🚨 Pool exhaustion: Database connection pool limit reached`;
        } else if (rand < 0.8) {
          newLog = `[${timestamp}] WARN GET /api/v1/user/billing - 401 - missing bearer token`;
          newAlert = `[NEW] ⚠️ Security alert: Unauthorized billing request rejected`;
        } else {
          newLog = `[${timestamp}] INFO GET /api/v1/user/profile - 200 - took ${Math.floor(10 + Math.random() * 80)}ms`;
          newAlert = `[NEW] ✅ Success trace: GET /api/v1/user/profile processed`;
        }
      }
      
      simLogsRef.current += '\n' + newLog;
      setRawInput(simLogsRef.current);
      
      try {
        const results = parseLogs(simLogsRef.current);
        setMetrics(results);
        setFileName('live_monitoring_stream.log');
        
        // Check for WOW Moment threshold (>80 outage risk score)
        if (results.outageRiskScore > 80) {
          setShowWowAlert(true);
          setHasTriggeredWow(true);
          
          // Prepend alert to simulated Alerts
          setSimulatedAlerts((prev) => [
            `[ALERT] 🚨 OUTAGE CRITICAL: Outage risk score exceeded 80% (${results.outageRiskScore}/100)!`,
            newAlert,
            ...prev.slice(0, 18)
          ]);
          
          // Append explanation message to SRE Copilot Chat if we haven't posted this emergency alert yet
          setChatHistory((prev) => {
            const alreadyAlerted = prev.some(msg => msg.content.includes("EMERGENCY ALERT: Outage Probability Exceeded 80%"));
            if (alreadyAlerted) return prev;
            return [
              ...prev,
              {
                role: 'assistant',
                content: `### 🚨 EMERGENCY ALERT: Outage Probability Exceeded 80%!\n\nMy log correlation engine has isolated the root cause: **Database pool exhaustion is causing cascading payment failures.**\n\n#### **Active Symptoms:**\n- **Route:** \`POST /api/v1/payment\` is returning HTTP 500.\n- **Error Rate:** Failure rate spiked to **${results.failureRate}%**.\n- **Bottleneck:** Connection pool limit reached.\n\n#### **Suggested Immediate SRE Actions:**\n1. **Scale Replicas:** Run \`kubectl scale deployment payment-service --replicas=5\` to absorb traffic load.\n2. **Restart DB Pool:** Recycle PostgreSQL database connections to release active transaction locks.\n3. **Rollback Canary:** If latency does not recover below 1000ms within the next 30 seconds.`
              }
            ];
          });
          
          // Automatically slide open the SRE Chat sidebar for maximum visual effect!
          setShowChat(true);
        } else {
          setSimulatedAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
        }
      } catch (e) {
        console.error(e);
        setSimulatedAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
      }
    }, 3000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setShowWowAlert(false);
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  // Local Rule-Based Diagnostics Generator (Fallback when no key is in env)
  const generateLocalDiagnostics = (m: ParsedLogMetrics) => {
    const errorCats = m.errorCategories.map(c => c.name);
    let rootCause = "The system is experiencing anomalies, but the root cause is unclear.";
    let topIssues = ["General API Failures"];
    let recommendations: any[] = [];
    let severity = m.outageRisk;
    
    let businessImpact: {
      revenueImpact: 'Low' | 'Medium' | 'High' | 'Critical';
      criticalService: string;
    } = {
      revenueImpact: "Low",
      criticalService: "Generic Server Endpoints"
    };
    let immediateActions: string[] = [];

    if (errorCats.includes("Database Bottleneck")) {
      rootCause = "The issue likely originated after the recent database transaction lock occurred, creating database connection pool exhaustion that blocks downstream payment APIs.";
      topIssues = ["Database Connection Pool Exhaustion", "Transaction Locking"];
      businessImpact = {
        revenueImpact: "Critical" as const,
        criticalService: "Payment Infrastructure & Checkout Flow"
      };
      immediateActions = [
        "Restart database connection pool (recycle active locks)",
        "Scale payment service replicas to handle connection retry spikes",
        "Deploy temporary index to speed up slow database scans"
      ];
      recommendations = [
        {
          title: "Increase Database Pool Size",
          description: "Modify database connection settings to allow more concurrent connections.",
          codeExample: `// Database pool tuning configuration\nconst dbConfig = {\n  host: process.env.DB_HOST,\n  max: 30, // Increase max connection pool\n  idleTimeoutMillis: 30000,\n  connectionTimeoutMillis: 5000 // fail fast if pool is full\n};`
        },
        {
          title: "Apply Indexes to Query Fields",
          description: "Analyze slow queries on endpoints to find missing table indexes that lock database rows.",
          codeExample: `-- Create database index on slow filtering key\nCREATE INDEX CONCURRENTLY idx_payments_user_id \nON payments(user_id);`
        }
      ];
    } else if (errorCats.includes("Timeout Error")) {
      rootCause = "The issue likely originated due to unbounded gateway timeouts on heavy indexing routes, creating a thread pool block on core routing nodes.";
      topIssues = ["Downstream Service Latency", "Unbounded HTTP Fetches"];
      businessImpact = {
        revenueImpact: "High" as const,
        criticalService: "Product Inventory & Catalog API"
      };
      immediateActions = [
        "Restart slow downstream dependency nodes",
        "Introduce strict client timeout configurations (2000ms max query cap)",
        "Enable database read replica routing for heavy scans"
      ];
      recommendations = [
        {
          title: "Introduce Call Timeouts & Retries",
          description: "Add a strict timeout limit when calling downstream dependencies.",
          codeExample: `// Fetch helper with AbortController timeout\nconst controller = new AbortController();\nconst timeoutId = setTimeout(() => controller.abort(), 2000);\n\nconst response = await fetch(url, { signal: controller.signal });\nclearTimeout(timeoutId);`
        }
      ];
    } else if (errorCats.includes("Auth/Security Failure")) {
      rootCause = "The issue likely originated after expired identity token cache errors triggered cascading authorization failures.";
      topIssues = ["JWT Verification Failure", "Expired Tokens"];
      businessImpact = {
        revenueImpact: "Medium" as const,
        criticalService: "User Authentication & Sign-in Node"
      };
      immediateActions = [
        "Check identity token provider key rotations",
        "Recycle authentication service instances",
        "Flush cached expired sessions"
      ];
      recommendations = [
        {
          title: "Optimize Token Expiration & Handling",
          description: "Verify if client caches expired tokens or fails to trigger token refresh workflows.",
          codeExample: `// Check JWT validation expiration\nif (payload.exp < Date.now() / 1000) {\n  return triggerTokenRefresh();\n}`
        }
      ];
    } else {
      // General Fallback
      rootCause = `The issue likely originated due to general internal server code processing exceptions. Failure rates are currently elevated at ${m.failureRate}%.`;
      topIssues = ["Server Side Internal Failures"];
      businessImpact = {
        revenueImpact: "Low" as const,
        criticalService: "Generic Server Endpoints"
      };
      immediateActions = [
        "Investigate active server CPU and memory allocations",
        "Add try-catch global error handling middleware",
        "Monitor server request retry intervals"
      ];
      recommendations = [
        {
          title: "Add Try-Catch Blocks & Global Error Handler",
          description: "Implement top-level middleware to catch unhandled promise rejections.",
          codeExample: `// Express global error handling middleware\napp.use((err, req, res, next) => {\n  logger.error(err.stack);\n  res.status(500).json({ error: 'Internal Server Error' });\n});`
        }
      ];
    }

    return {
      summary: `Diagnostic analysis shows ${severity} outage risk due to slow response times and error spikes.`,
      severity,
      topIssues,
      rootCause,
      recommendations,
      outageRisk: severity,
      outageRiskExplanation: `Outage risk is calculated as ${m.outageRiskScore}/100. Failure rates are currently ${m.failureRate}%, and average response time is ${m.avgLatency}ms.`,
      businessImpact,
      immediateActions
    };
  };

  // --- LOG PARSING ACTIONS FOR COMPARISON ---

  const handleParseBefore = (content: string, name: string) => {
    try {
      const results = parseLogs(content);
      setBeforeMetrics(results);
      setBeforeFileName(name);
      setComparisonResults(null);
      setCompareError(null);
      setCompareNoApiKey(false);
    } catch (e) {
      alert('Error parsing "Before" logs.');
    }
  };

  const handleParseAfter = (content: string, name: string) => {
    try {
      const results = parseLogs(content);
      setAfterMetrics(results);
      setAfterFileName(name);
      setComparisonResults(null);
      setCompareError(null);
      setCompareNoApiKey(false);
    } catch (e) {
      alert('Error parsing "After" logs.');
    }
  };

  const handleBeforeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseBefore(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseAfter(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadComparisonSamples = () => {
    setBeforeInput(BEFORE_DEPLOY_SAMPLE);
    setAfterInput(AFTER_DEPLOY_SAMPLE);
    handleParseBefore(BEFORE_DEPLOY_SAMPLE, 'v1.4.2_stable_prod.log');
    handleParseAfter(AFTER_DEPLOY_SAMPLE, 'v1.5.0_deployed_canary.log');
  };

  // --- RUN DEPLOYMENT COMPARISON ---

  const runDeploymentComparison = async () => {
    if (!beforeMetrics || !afterMetrics) return;
    setLoadingCompare(true);
    setCompareError(null);
    setCompareNoApiKey(false);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeMetrics,
          afterMetrics,
          beforeRecentErrors: beforeMetrics.recentErrors,
          afterRecentErrors: afterMetrics.recentErrors
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.noKey) {
          setCompareNoApiKey(true);
          setComparisonResults(generateLocalComparison(beforeMetrics, afterMetrics));
        } else {
          throw new Error(data.error || 'Server error running deployment comparison');
        }
      } else {
        setComparisonResults(data);
      }
    } catch (err: any) {
      console.error(err);
      setCompareError(err.message || 'Connection failed.');
    } finally {
      setLoadingCompare(false);
    }
  };

  const generateLocalComparison = (b: ParsedLogMetrics, a: ParsedLogMetrics) => {
    const latencyDiff = a.avgLatency - b.avgLatency;
    const failureDiff = a.failureRate - b.failureRate;
    
    let regressionSeverity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    let action: any = "Monitor Closely";
    let details = "No severe regressions detected between the deployment runs.";
    let newErrors: string[] = [];
    let fixes: string[] = [];
    
    let businessImpact: {
      revenueImpact: 'Low' | 'Medium' | 'High' | 'Critical';
      criticalService: string;
    } = {
      revenueImpact: "Low",
      criticalService: "Product Catalog"
    };
    let immediateActions: string[] = [];

    if (failureDiff > 10 || latencyDiff > 1000) {
      regressionSeverity = 'Critical';
      action = 'Rollback Recommended';
      details = `Severe performance degradation: Failure rate rose by ${failureDiff.toFixed(1)}% and average latency increased by ${Math.round(latencyDiff)}ms in the logs post-deployment.`;
      newErrors = [
        "SQL Error: Column 'discount_rate' not found in table 'products'",
        "High latency spike on product indexing service"
      ];
      fixes = [
        "Rollback build immediately to preserve stability.",
        "Check database migration logs. It appears a schema column 'discount_rate' was deleted or not deployed successfully.",
        "Profile database queries hitting `/api/v1/products` to examine full-table locks."
      ];
      businessImpact = {
        revenueImpact: "Critical" as const,
        criticalService: "Product Catalog & Checkout Flow"
      };
      immediateActions = [
        "Rollback deployment from v1.5.0 to baseline v1.4.2",
        "Re-run database column schema verification scripts",
        "Alert SRE on-call team of checkout API outages"
      ];
    } else if (failureDiff > 2 || latencyDiff > 200) {
      regressionSeverity = 'Medium';
      action = 'Hotfix Advised';
      details = `Mild degradation observed. Latency is higher by ${Math.round(latencyDiff)}ms.`;
      businessImpact = {
        revenueImpact: "Medium" as const,
        criticalService: "Product Catalog"
      };
      immediateActions = [
        "Profile product database lookup times",
        "Add memory caching index layer to `/api/v1/products`"
      ];
    }

    return {
      summary: `Deployment analysis shows a ${regressionSeverity.toUpperCase()} level regression.`,
      regressionSeverity,
      latencyChangeMs: Math.round(latencyDiff),
      failureRateChangePct: parseFloat(failureDiff.toFixed(2)),
      newErrors,
      rootCause: "The issue likely originated after deployment because latency remained stable in the baseline logs but increased sharply in the canary release, due to a missing 'discount_rate' database column migration.",
      recommendation: {
        action,
        details,
        fixes
      },
      businessImpact,
      immediateActions
    };
  };

  // Formats Recharts data for Status Code Pie
  const getStatusCodePieData = (dist: { [code: string]: number }) => {
    return Object.keys(dist).map((code) => ({
      name: `HTTP ${code}`,
      value: dist[code]
    }));
  };

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              APIspect
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
              v1.0.0
            </span>
          </Link>

          {/* Navigation Tabs */}
          <div className="flex space-x-1.5 p-1 bg-zinc-950/60 rounded-xl border border-zinc-900">
            <button
              onClick={() => setActiveTab('observe')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'observe'
                  ? 'bg-zinc-900 text-purple-400 shadow-md border border-white/5'
                  : 'text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Observe Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'compare'
                  ? 'bg-zinc-900 text-purple-400 shadow-md border border-white/5'
                  : 'text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Deployments</span>
            </button>
          </div>

          {/* Setup Instructions Modal Button */}
          <div className="flex items-center space-x-3">
            {/* Live stream toggle */}
            <button
              onClick={() => {
                if (isSimulating) stopSimulation();
                else startSimulation();
              }}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                isSimulating 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'}`} />
              <span>{isSimulating ? 'Stop Live Sim' : 'Simulate Live Stream'}</span>
            </button>

            {/* AI Chat button */}
            {metrics && (
              <button
                onClick={() => setShowChat(!showChat)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  showChat 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-lg shadow-purple-500/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask DebugPilot AI</span>
              </button>
            )}

            <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>Observing Live</span>
            </span>
          </div>
        </div>
      </header>

      {/* WOW Moment Critical Alert Banner */}
      {showWowAlert && (
        <div className="bg-rose-950/90 border-b border-rose-500/30 text-rose-200 px-6 py-3 flex items-center justify-between animate-pulse backdrop-blur-md sticky top-16 z-40">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce flex-shrink-0" />
            <div className="text-xs sm:text-sm font-bold tracking-wide">
              <span className="text-white uppercase font-extrabold">🚨 Critical outage probability exceeded 80%!</span> – Database pool exhaustion is causing cascading payment failures on <code className="bg-rose-900/40 px-1 py-0.5 rounded font-mono text-rose-300">/api/v1/payment</code>.
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowChat(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-600/30 whitespace-nowrap cursor-pointer"
            >
              Open DebugPilot SRE Hotfix
            </button>
            <button
              onClick={() => setShowWowAlert(false)}
              className="p-1 text-rose-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TAB 1: OBSERVE LOGS */}
        {activeTab === 'observe' && (
          <div className="space-y-8">
            
            {/* Step 1: Upload Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-4.5 h-4.5 text-purple-400" />
                    <span>Upload API Logs</span>
                  </CardTitle>
                  <CardDescription>
                    Provide logs from standard web servers, JSON structures, or node applications to evaluate health.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload Drop Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 transition-all rounded-xl p-8 text-center cursor-pointer space-y-2 group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".log,.txt,.json" 
                      className="hidden" 
                    />
                    <Upload className="w-8 h-8 mx-auto text-zinc-400 group-hover:text-purple-300 transition-colors" />
                    <p className="text-sm font-semibold text-zinc-300">
                      Drag & Drop your log file, or <span className="text-purple-400 group-hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-zinc-300">Supports .log, .txt, .json files</p>
                  </div>

                  {/* Or Manual Paste */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Or paste logs manually:</label>
                    <textarea
                      placeholder="[ERROR] POST /payment - 500 - timeout after 3000ms&#10;[WARN] GET /user/profile - latency 2200ms"
                      value={rawInput}
                      onChange={(e) => {
                        setRawInput(e.target.value);
                        if (e.target.value.trim().length > 0) {
                          handleParseSingle(e.target.value, 'pasted_logs.log');
                        }
                      }}
                      className="w-full h-24 bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-zinc-900/60 pt-4">
                  <button 
                    onClick={handleLoadSample}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs text-purple-400 hover:bg-purple-500/10 transition-colors font-medium"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Try Sample Timeout Logs</span>
                  </button>
                  {fileName && (
                    <span className="text-xs text-zinc-300 font-mono flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate max-w-[200px]">{fileName}</span>
                    </span>
                  )}
                </CardFooter>
              </Card>

              {/* Status / Trigger analysis */}
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                    <span>AI Observability Agent</span>
                  </CardTitle>
                  <CardDescription>
                    Trigger deep generative diagnostic analysis to locate failures and fixes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center py-6">
                  {metrics ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 inline-block">
                        <Activity className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Log Parsing Completed</p>
                        <p className="text-xs text-zinc-300 mt-1">Parsed {metrics.totalRequests} log transactions successfully.</p>
                      </div>
                      <button
                        onClick={runAiAnalysis}
                        disabled={loadingAi}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-purple-500/25"
                      >
                        {loadingAi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                            <span>Correlating Logs...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            <span>Analyze Failures with AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-zinc-300 space-y-2 py-6">
                      <AlertCircle className="w-8 h-8 mx-auto text-zinc-500" />
                      <p className="text-xs">No active logs parsed. Upload or click sample logs above to begin.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-[11px] text-zinc-400 text-center border-t border-zinc-900/60 pt-3">
                  Analysis respects data privacy and processes error payloads anonymously.
                </CardFooter>
              </Card>
            </div>

            {/* Step 2: Dashboard Metrics & Charts */}
            {metrics && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 2.1 Metrics Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-purple-500/5 rounded-bl-full pointer-events-none" />
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Total Transactions</p>
                    <p className="text-3xl font-extrabold text-white mt-1.5">{metrics.totalRequests}</p>
                    <div className="mt-2.5 flex items-center space-x-1 text-[11px] text-zinc-300">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Individual traces</span>
                    </div>
                  </Card>

                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-rose-500/5 rounded-bl-full pointer-events-none" />
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Failure Rate</p>
                    <p className={`text-3xl font-extrabold mt-1.5 ${metrics.failureRate > 15 ? 'text-rose-500' : metrics.failureRate > 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {metrics.failureRate}%
                    </p>
                    <div className="mt-2.5 flex items-center space-x-1.5 text-[11px]">
                      {metrics.failureRate > 5 ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-400/90 font-medium">Critical error threshold</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-zinc-300">Within acceptable limits</span>
                        </>
                      )}
                    </div>
                  </Card>

                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-cyan-500/5 rounded-bl-full pointer-events-none" />
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Avg Response Time</p>
                    <p className="text-3xl font-extrabold text-white mt-1.5">{metrics.avgLatency}ms</p>
                    <div className="mt-2.5 flex items-center space-x-1 text-[11px] text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Across all parsed actions</span>
                    </div>
                  </Card>

                  <Card hoverGlow={false} className="relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-amber-500/5 rounded-bl-full pointer-events-none" />
                      <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">System Outage Risk</p>
                      <p className={`text-3xl font-extrabold mt-1.5 ${
                        metrics.outageRisk === 'Critical' || metrics.outageRisk === 'High' ? 'text-rose-500' :
                        metrics.outageRisk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {metrics.outageRisk}
                      </p>
                      <div className="mt-2.5 flex items-center space-x-1 text-[11px]">
                        <span className="text-zinc-400">Score:</span>
                        <span className="font-semibold text-zinc-200">{metrics.outageRiskScore}/100</span>
                      </div>
                    </div>
                    {metrics.outageRiskFactors && metrics.outageRiskFactors.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-900/60 space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Risk Factors:</p>
                        {metrics.outageRiskFactors.map((factor, idx) => (
                          <div key={idx} className="flex items-start space-x-1.5 text-[10px] text-zinc-300 leading-normal">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 mt-0.5 flex-shrink-0" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* 2.2 Charts visualization grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Latency Trend Area Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Latency Trend Over Time</span>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                      </CardTitle>
                      <CardDescription>Average trace duration bucketed across log timestamps</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.latencyTrend} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#a1a1aa', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#f4f4f5' }} 
                            itemStyle={{ color: '#a78bfa' }}
                          />
                          <Area type="monotone" dataKey="latency" name="Latency" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Code Donut Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">HTTP Status Codes</CardTitle>
                      <CardDescription>HTTP status distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex flex-col justify-between items-center py-2">
                      <div className="w-full h-[170px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getStatusCodePieData(metrics.statusDistribution)}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {getStatusCodePieData(metrics.statusDistribution).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#f4f4f5' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend Grid */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
                        {getStatusCodePieData(metrics.statusDistribution).map((entry, index) => (
                          <div key={entry.name} className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span>{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 2.3 Bottom Grid: Top failing endpoints & Error categories */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Top Failing Endpoints Table */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Database className="w-4 h-4 text-rose-400" />
                        <span>Failing Endpoints Summary</span>
                      </CardTitle>
                      <CardDescription>Aggregate metrics grouped by API paths</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 pb-2 text-zinc-500 font-bold">
                              <th className="py-2.5">Endpoint Path</th>
                              <th>Total Requests</th>
                              <th>Failed Requests</th>
                              <th>Avg Latency</th>
                              <th>Stability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(metrics.endpointMetrics).map((path) => {
                              const pathMetric = metrics.endpointMetrics[path];
                              const pathFailRate = ((pathMetric.failures / pathMetric.requests) * 100).toFixed(1);
                              return (
                                <tr key={path} className="border-b border-zinc-900/60 hover:bg-zinc-950/30 transition-colors">
                                  <td className="py-3 font-mono font-semibold text-zinc-300">{path}</td>
                                  <td>{pathMetric.requests}</td>
                                  <td className={pathMetric.failures > 0 ? 'text-rose-400 font-semibold' : 'text-zinc-500'}>
                                    {pathMetric.failures}
                                  </td>
                                  <td className="font-mono">{pathMetric.avgLatency}ms</td>
                                  <td>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                      parseFloat(pathFailRate) > 30 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                      parseFloat(pathFailRate) > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {parseFloat(pathFailRate) > 0 ? `${(100 - parseFloat(pathFailRate)).toFixed(1)}%` : 'Healthy'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error categories bar chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Error Distribution</CardTitle>
                      <CardDescription>Categorized signatures matching issues</CardDescription>
                    </CardHeader>
                    <CardContent className="h-60 flex flex-col justify-between py-2">
                      {metrics.errorCategories.length > 0 ? (
                        <>
                          <div className="w-full h-[85%]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={metrics.errorCategories} layout="vertical" margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                                <XAxis type="number" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#e4e4e7" fontSize={11} width={130} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px', color: '#f4f4f5' }}
                                />
                                <Bar dataKey="value" name="Count" fill="#a78bfa" radius={[0, 4, 4, 0]}>
                                  {metrics.errorCategories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs text-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2 mx-auto" />
                          <p>Zero exceptions or warnings detected in logs!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Incident Sequence & Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Timeline Card */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>Incident Sequence & Timeline</span>
                      </CardTitle>
                      <CardDescription>
                        Chronological flow of anomalies, warnings, and latency spike events detected in logs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.timelineEvents && metrics.timelineEvents.length > 0 ? (
                        <div className="relative pl-6 border-l border-zinc-800 space-y-6 ml-2 my-2">
                          {metrics.timelineEvents.map((evt, idx) => (
                            <div key={idx} className="relative group">
                              {/* Pulse Indicator dot */}
                              <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border bg-zinc-950 flex items-center justify-center ${
                                evt.level === 'ERROR' 
                                  ? 'border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                                  : 'border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  evt.level === 'ERROR' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                              </div>
                              
                              {/* Event details */}
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold font-mono text-purple-300 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/10">{evt.timeLabel}</span>
                                  <span className={`text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded ${
                                    evt.level === 'ERROR' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {evt.level}
                                  </span>
                                  <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                                    {evt.event}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-200 leading-relaxed font-medium pl-0">
                                  {evt.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/70" />
                          <p>No critical incident events or slowness warnings detected in the active logs.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Live Simulation Alert Terminal */}
                  <Card className="flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Live Stream Alert Feed</span>
                        <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-rose-500 animate-ping' : 'bg-zinc-800'}`} />
                      </CardTitle>
                      <CardDescription>
                        {isSimulating 
                          ? 'Real-time telemetry stream simulation active' 
                          : 'Simulation inactive. Turn it on in the header.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="font-mono text-[10px] bg-zinc-950 p-4 rounded-xl border border-zinc-900 h-64 overflow-y-auto space-y-2.5 flex-1 select-none">
                        {simulatedAlerts.length > 0 ? (
                          simulatedAlerts.map((alert, idx) => (
                            <div key={idx} className="leading-relaxed border-b border-zinc-900/40 pb-1.5 last:border-0">
                              <span className="text-zinc-500">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>{' '}
                              <span className={
                                alert.includes('🚨') ? 'text-rose-400 font-semibold' :
                                alert.includes('⚠️') ? 'text-amber-400' :
                                alert.includes('✅') ? 'text-emerald-400' :
                                'text-purple-400'
                              }>
                                {alert.replace('[NEW] ', '')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-2">
                            <Activity className="w-5 h-5 animate-pulse text-zinc-700" />
                            <p>Stream buffer empty.<br />Toggle "Simulate Live Stream" in the header to run.</p>
                          </div>
                        )}
                      </div>
                      
                      {isSimulating && (
                        <div className="mt-4 p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-400 flex items-start space-x-1.5">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Simulated traffic is running. Logs are appended and parsed dynamically every 3s.</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 2.4 AI Insights Panel */}
                {aiAnalysis && (
                  <Card className="border-purple-500/25 bg-gradient-to-r from-zinc-950 via-[#0a061a]/70 to-zinc-950 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] animate-fade-in">
                    <CardHeader className="border-b border-zinc-900/80 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">AI Observability Analysis</CardTitle>
                            <CardDescription>Generative diagnostics and recommendations</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {noApiKey && (
                            <div className="hidden lg:inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-400 text-xs font-semibold">
                              <AlertCircle className="w-4 h-4" />
                              <span>Local Engine Active</span>
                            </div>
                          )}
                          <button
                            onClick={generateIncidentReport}
                            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Generate Incident Report</span>
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      {/* API Key Setup Instructions Warning */}
                      {noApiKey && (
                        <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-5 space-y-3.5">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-zinc-200">How to Enable Live Generative AI Diagnostics</h5>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                To run live log diagnostics using Google Gemini, Groq, or OpenAI models, create a file named <code className="text-purple-400 font-mono text-[11px] bg-zinc-900 px-1 py-0.5 rounded">.env.local</code> in your project root workspace directory and add one or more of these API keys:
                              </p>
                            </div>
                          </div>
                          <pre className="text-[11px] font-mono text-cyan-400 bg-zinc-950 p-4 rounded-xl border border-zinc-900 leading-relaxed">
{`# c:\\Users\\Ayushiraj\\Downloads\\APIspect\\.env.local
GEMINI_API_KEY=AIzaSy...      # (Recommended) Official Gemini SDK
GROQ_API_KEY=gsk_...         # Groq API endpoint
OPENAI_API_KEY=sk-...        # OpenAI API endpoint`}
                          </pre>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Once added, restart the next development server and click the analysis button again to get custom, live AI reports.
                          </p>
                        </div>
                      )}

                      {/* AI Summary Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Analysis Summary</h4>
                          <p className="text-sm text-zinc-300 leading-relaxed font-semibold bg-zinc-950/30 border border-zinc-900 p-4 rounded-xl">
                            {aiAnalysis.summary}
                          </p>
                          <div className="space-y-2">
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Isolated Root Cause</h4>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {aiAnalysis.rootCause}
                            </p>
                          </div>
                          
                          {/* Suggested Immediate Actions */}
                          {aiAnalysis.immediateActions && aiAnalysis.immediateActions.length > 0 && (
                            <div className="mt-4 p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 space-y-2.5">
                              <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Suggested Immediate SRE Actions</span>
                              </h4>
                              <ol className="list-decimal pl-4.5 space-y-1.5 text-xs text-zinc-200 font-semibold leading-relaxed">
                                {aiAnalysis.immediateActions.map((action: string, idx: number) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 border-l border-zinc-900 pl-0 md:pl-6">
                          <div className="space-y-1.5">
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Severity Classification</h4>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              aiAnalysis.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              aiAnalysis.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              aiAnalysis.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {aiAnalysis.severity}
                            </span>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Business Impact</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400 font-medium">Revenue Risk:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  aiAnalysis.businessImpact?.revenueImpact === 'Critical' || aiAnalysis.businessImpact?.revenueImpact === 'High'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : aiAnalysis.businessImpact?.revenueImpact === 'Medium'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {aiAnalysis.businessImpact?.revenueImpact || 'High'}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-300 leading-normal">
                                <span className="text-zinc-400 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Affected Critical Service:</span>
                                <span className="text-white font-bold">{aiAnalysis.businessImpact?.criticalService || 'Payment Infrastructure'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 pt-2 border-t border-zinc-900/60">
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Top Detected Anomaly Signatures</h4>
                            <ul className="space-y-1.5">
                              {aiAnalysis.topIssues?.map((issue: string, idx: number) => (
                                <li key={idx} className="flex items-center space-x-2 text-xs text-zinc-200">
                                  <AlertCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Actionable Debugging Solutions */}
                      <div className="space-y-4 pt-4 border-t border-zinc-900">
                        <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Actionable Debugging Recommendations</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {aiAnalysis.recommendations?.map((rec: any, idx: number) => (
                            <div key={idx} className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-purple-400">
                                  <Code className="w-4 h-4" />
                                  <span className="text-xs font-bold uppercase tracking-wider">{rec.title}</span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                  {rec.description}
                                </p>
                              </div>
                              {rec.codeExample && (
                                <div className="mt-4">
                                  <pre className="text-[10px] text-cyan-400 font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-900/60 overflow-x-auto leading-relaxed">
                                    {rec.codeExample}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Error display */}
                {aiError && (
                  <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5 text-sm flex items-center space-x-3 text-rose-400">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Failed to query LLM endpoint: {aiError}. Double check your .env.local file.</span>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEPLOYMENT COMPARISON */}
        {activeTab === 'compare' && (
          <div className="space-y-8">
            
            {/* Log inputs before/after */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Before Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2 text-zinc-300">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Logs BEFORE Deployment (Baseline)</span>
                  </CardTitle>
                  <CardDescription>Stable reference logs from previous production run</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    onClick={() => beforeFileInputRef.current?.click()}
                    className="border border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-950/5 transition-all rounded-xl p-6 text-center cursor-pointer space-y-1.5 group"
                  >
                    <input 
                      type="file" 
                      ref={beforeFileInputRef} 
                      onChange={handleBeforeUpload} 
                      accept=".log,.txt,.json" 
                      className="hidden" 
                    />
                    <Upload className="w-6 h-6 mx-auto text-zinc-400 group-hover:text-cyan-300 transition-colors" />
                    <p className="text-xs font-semibold text-zinc-300">Upload baseline file, or browse</p>
                  </div>
                  <textarea
                    placeholder="Paste logs from before deployment..."
                    value={beforeInput}
                    onChange={(e) => {
                      setBeforeInput(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        handleParseBefore(e.target.value, 'before_deployment.log');
                      }
                    }}
                    className="w-full h-24 bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                  {beforeFileName && (
                    <div className="text-[10px] text-zinc-300 font-mono flex items-center space-x-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Loaded: {beforeFileName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* After Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2 text-zinc-300">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Logs AFTER Deployment (Canary/New Release)</span>
                  </CardTitle>
                  <CardDescription>Canary, staging, or new release logs to analyze</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    onClick={() => afterFileInputRef.current?.click()}
                    className="border border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 transition-all rounded-xl p-6 text-center cursor-pointer space-y-1.5 group"
                  >
                    <input 
                      type="file" 
                      ref={afterFileInputRef} 
                      onChange={handleAfterUpload} 
                      accept=".log,.txt,.json" 
                      className="hidden" 
                    />
                    <Upload className="w-6 h-6 mx-auto text-zinc-400 group-hover:text-purple-300 transition-colors" />
                    <p className="text-xs font-semibold text-zinc-300">Upload release file, or browse</p>
                  </div>
                  <textarea
                    placeholder="Paste logs from after deployment..."
                    value={afterInput}
                    onChange={(e) => {
                      setAfterInput(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        handleParseAfter(e.target.value, 'after_deployment.log');
                      }
                    }}
                    className="w-full h-24 bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                  {afterFileName && (
                    <div className="text-[10px] text-zinc-300 font-mono flex items-center space-x-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Loaded: {afterFileName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Run comparison button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900">
              <button
                onClick={handleLoadComparisonSamples}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-purple-400 border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl transition-all"
              >
                <Play className="w-3.5 h-3.5 mr-2" />
                <span>Load Sample Release Comparison</span>
              </button>

              <button
                onClick={runDeploymentComparison}
                disabled={loadingCompare || !beforeMetrics || !afterMetrics}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md"
              >
                {loadingCompare ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                    <span>Comparing Deployments...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5 mr-2" />
                    <span>Run Differential AI Analysis</span>
                  </>
                )}
              </button>
            </div>

            {/* Comparison results */}
            {beforeMetrics && afterMetrics && (
              <div className="space-y-8 animate-fade-in">
                
                {/* AI Deployment Insights Alert Box */}
                {comparisonResults && (
                  <div className="p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-zinc-950 via-[#0a061a] to-zinc-950 shadow-[0_0_20px_-3px_rgba(168,85,247,0.15)] flex items-start space-x-3.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">AI Deployment Insight</h4>
                      <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
                        {comparisonResults.summary}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                        <strong className="text-purple-400">Root Cause Isolation:</strong> {comparisonResults.rootCause}
                      </p>
                    </div>
                  </div>
                )}

                {/* Side-by-side comparison cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Total Transactions */}
                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Volume (Transactions)</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 pb-2 border-b border-zinc-900/60">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">Before</span>
                        <span className="text-xl font-bold text-zinc-300">{beforeMetrics.totalRequests}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">After</span>
                        <span className="text-xl font-bold text-white">{afterMetrics.totalRequests}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Volume Delta:</span>
                      <span className={`font-mono font-bold ${
                        afterMetrics.totalRequests - beforeMetrics.totalRequests >= 0 ? 'text-cyan-400' : 'text-zinc-300'
                      }`}>
                        {afterMetrics.totalRequests - beforeMetrics.totalRequests >= 0 ? '+' : ''}
                        {afterMetrics.totalRequests - beforeMetrics.totalRequests} requests
                      </span>
                    </div>
                  </Card>

                  {/* Card 2: Failure Rate */}
                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Failure Rate</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 pb-2 border-b border-zinc-900/60">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">Before</span>
                        <span className="text-xl font-bold text-zinc-300">{beforeMetrics.failureRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">After</span>
                        <span className={`text-xl font-bold ${afterMetrics.failureRate > beforeMetrics.failureRate ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {afterMetrics.failureRate}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Regression delta:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        afterMetrics.failureRate - beforeMetrics.failureRate > 2 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {(afterMetrics.failureRate - beforeMetrics.failureRate) >= 0 ? '+' : ''}
                        {(afterMetrics.failureRate - beforeMetrics.failureRate).toFixed(2)}%
                      </span>
                    </div>
                  </Card>

                  {/* Card 3: Avg Response Time */}
                  <Card hoverGlow={false} className="relative overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Avg Latency</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 pb-2 border-b border-zinc-900/60">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">Before</span>
                        <span className="text-xl font-bold text-zinc-300">{beforeMetrics.avgLatency}ms</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase">After</span>
                        <span className={`text-xl font-bold ${afterMetrics.avgLatency > beforeMetrics.avgLatency ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {afterMetrics.avgLatency}ms
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Latency delta:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        afterMetrics.avgLatency - beforeMetrics.avgLatency > 100 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {(afterMetrics.avgLatency - beforeMetrics.avgLatency) >= 0 ? '+' : ''}
                        {Math.round(afterMetrics.avgLatency - beforeMetrics.avgLatency)}ms
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Differential stats table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metric Diff Comparison</CardTitle>
                    <CardDescription>Baseline performance vs canary performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 pb-2 text-zinc-300 font-bold">
                            <th className="py-2.5">Key Performance Indicator</th>
                            <th>Before (Baseline)</th>
                            <th>After (Canary)</th>
                            <th>Delta Change</th>
                            <th>Status Assessment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Request counts */}
                          <tr className="border-b border-zinc-900/60">
                            <td className="py-3 font-semibold text-zinc-300">Total Transactions</td>
                            <td>{beforeMetrics.totalRequests}</td>
                            <td>{afterMetrics.totalRequests}</td>
                            <td className="font-mono">
                              {afterMetrics.totalRequests - beforeMetrics.totalRequests >= 0 ? '+' : ''}
                              {afterMetrics.totalRequests - beforeMetrics.totalRequests}
                            </td>
                            <td>
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 font-bold">
                                Volume Change
                              </span>
                            </td>
                          </tr>

                          {/* Failure rate */}
                          <tr className="border-b border-zinc-900/60">
                            <td className="py-3 font-semibold text-zinc-300">Failure Rate</td>
                            <td>{beforeMetrics.failureRate}%</td>
                            <td className={afterMetrics.failureRate > beforeMetrics.failureRate ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                              {afterMetrics.failureRate}%
                            </td>
                            <td className={`font-mono font-semibold ${
                              afterMetrics.failureRate - beforeMetrics.failureRate > 2 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {(afterMetrics.failureRate - beforeMetrics.failureRate) >= 0 ? '+' : ''}
                              {(afterMetrics.failureRate - beforeMetrics.failureRate).toFixed(2)}%
                            </td>
                            <td>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                afterMetrics.failureRate - beforeMetrics.failureRate > 2 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {afterMetrics.failureRate - beforeMetrics.failureRate > 2 ? 'Regression Detected' : 'Stable'}
                              </span>
                            </td>
                          </tr>

                          {/* Latency */}
                          <tr className="border-b border-zinc-900/60">
                            <td className="py-3 font-semibold text-zinc-300">Average Response Time</td>
                            <td>{beforeMetrics.avgLatency}ms</td>
                            <td className={afterMetrics.avgLatency > beforeMetrics.avgLatency ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                              {afterMetrics.avgLatency}ms
                            </td>
                            <td className={`font-mono font-semibold ${
                              afterMetrics.avgLatency - beforeMetrics.avgLatency > 100 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {(afterMetrics.avgLatency - beforeMetrics.avgLatency) >= 0 ? '+' : ''}
                              {Math.round(afterMetrics.avgLatency - beforeMetrics.avgLatency)}ms
                            </td>
                            <td>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                afterMetrics.avgLatency - beforeMetrics.avgLatency > 100 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {afterMetrics.avgLatency - beforeMetrics.avgLatency > 100 ? 'Latency Spike' : 'Stable'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Regression Panel */}
                {comparisonResults && (
                  <Card className="border-purple-500/25 bg-gradient-to-r from-zinc-950 via-[#0a061a]/70 to-zinc-950 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]">
                    <CardHeader className="border-b border-zinc-900/80 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            <GitCompare className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Differential Regression Report</CardTitle>
                            <CardDescription>AI comparison analysis results</CardDescription>
                          </div>
                        </div>
                        {compareNoApiKey && (
                          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-400 text-xs font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            <span>Using Local Comparison Engine</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider font-semibold">Comparison Summary</h4>
                          <p className="text-sm text-zinc-300 leading-relaxed font-semibold bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                            {comparisonResults.summary}
                          </p>
                          <div className="space-y-1.5">
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Root Cause Suggestion</h4>
                            <p className="text-xs text-zinc-300 leading-relaxed">{comparisonResults.rootCause}</p>
                          </div>
                          
                          {/* Suggested Immediate Actions */}
                          {comparisonResults.immediateActions && comparisonResults.immediateActions.length > 0 && (
                            <div className="mt-4 p-4 rounded-xl border border-rose-500/25 bg-rose-500/5 space-y-2.5">
                              <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Suggested Immediate SRE Actions</span>
                              </h4>
                              <ol className="list-decimal pl-4.5 space-y-1.5 text-xs text-zinc-200 font-semibold leading-relaxed">
                                {comparisonResults.immediateActions.map((action: string, idx: number) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 border-l border-zinc-900 pl-0 md:pl-6 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Recommended Action</h4>
                            <span className={`inline-flex mt-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                              comparisonResults.recommendation?.action?.includes('Rollback') 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                : comparisonResults.recommendation?.action?.includes('Hotfix') 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {comparisonResults.recommendation?.action}
                            </span>
                            <p className="text-[11px] text-zinc-300 mt-2.5 leading-relaxed">
                              {comparisonResults.recommendation?.details}
                            </p>
                          </div>
                          
                          <div className="pt-3 border-t border-zinc-900/60">
                            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Business Impact</h4>
                            <div className="space-y-2 mt-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400 font-medium">Revenue Risk:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  comparisonResults.businessImpact?.revenueImpact === 'Critical' || comparisonResults.businessImpact?.revenueImpact === 'High'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {comparisonResults.businessImpact?.revenueImpact || 'Critical'}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-300 leading-normal">
                                <span className="text-zinc-400 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Affected Critical Service:</span>
                                <span className="text-white font-bold">{comparisonResults.businessImpact?.criticalService || 'Product Catalog & Checkout Flow'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-zinc-900/60">
                            <h4 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Severity Tag</h4>
                            <span className={`inline-flex mt-1 text-[11px] font-bold ${
                              comparisonResults.regressionSeverity === 'Critical' || comparisonResults.regressionSeverity === 'High' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {comparisonResults.regressionSeverity}
                            </span>
                          </div>
                      </div>
                    </div>

                      {/* New errors identified */}
                      {comparisonResults.newErrors?.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-zinc-900">
                          <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">New Errors Introduced in Release</h4>
                          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 font-mono text-xs text-rose-400 space-y-2 max-h-48 overflow-y-auto">
                            {comparisonResults.newErrors.map((err: string, idx: number) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <X className="w-4.5 h-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rollback/fix instructions */}
                      {comparisonResults.recommendation?.fixes?.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-zinc-900">
                          <h4 className="text-xs uppercase font-bold text-zinc-300 tracking-wider">Actionable Hotfix Steps</h4>
                          <ul className="space-y-2 text-xs text-zinc-300">
                            {comparisonResults.recommendation.fixes.map((fix: string, idx: number) => (
                              <li key={idx} className="flex items-start space-x-2.5">
                                <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="pt-0.5 leading-relaxed">{fix}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </CardContent>
                  </Card>
                )}

                {/* Compare Error display */}
                {compareError && (
                  <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl p-5 text-sm flex items-center space-x-3 text-rose-400">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Failed to query LLM comparison: {compareError}. Double check your .env.local file.</span>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* Ask DebugPilot AI Chat Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[420px] bg-zinc-950/98 border-l border-zinc-900 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">DebugPilot AI Copilot</h4>
                {noApiKey && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-semibold text-amber-400">
                    Local Engine
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-300">Interactive Diagnostics Engine</span>
            </div>
          </div>
          <button 
            onClick={() => setShowChat(false)}
            className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scrollbar-thin">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3.5 rounded-xl leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-purple-600/10 border-purple-500/20 text-zinc-100 rounded-tr-none'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-200 rounded-tl-none font-sans'
                }`}
              >
                <div className="space-y-2">
                  {formatMessageContent(msg.content)}
                </div>
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex justify-start">
              <div className="bg-zinc-900/50 border border-zinc-800/80 p-3.5 rounded-xl rounded-tl-none text-zinc-400 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>DebugPilot is thinking...</span>
              </div>
            </div>
          )}
          {chatError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              Error: {chatError}
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        {chatHistory.length === 1 && (
          <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleSendChatMessage('Why is the payment API failing?')}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-purple-500/30 bg-zinc-900/30 text-[10px] text-zinc-300 hover:text-purple-200 transition-colors text-left cursor-pointer"
              >
                Why is /api/v1/payment failing?
              </button>
              <button 
                onClick={() => handleSendChatMessage('What caused the latency spikes?')}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-purple-500/30 bg-zinc-900/30 text-[10px] text-zinc-300 hover:text-purple-200 transition-colors text-left cursor-pointer"
              >
                What is causing high response latency?
              </button>
              <button 
                onClick={() => handleSendChatMessage('Suggest database pool fixes')}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-purple-500/30 bg-zinc-900/30 text-[10px] text-zinc-300 hover:text-purple-200 transition-colors text-left cursor-pointer"
              >
                Suggest database pool config fixes
              </button>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage(chatInput);
            }} 
            className="flex items-center space-x-2"
          >
            <input 
              type="text" 
              placeholder="Ask DebugPilot AI..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loadingChat}
              className="flex-1 bg-zinc-900/80 border border-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500/50 disabled:opacity-50 text-zinc-200"
            />
            <button 
              type="submit"
              disabled={loadingChat || !chatInput.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Incident Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">APIspect AI Incident Report</h3>
                  <span className="text-[10px] text-zinc-300 font-mono">
                    {reportData ? `${reportData.incidentId} • Generated ${new Date(reportData.timestamp).toLocaleTimeString()}` : 'Generating report...'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[500px] overflow-y-auto space-y-6 text-xs text-zinc-300 font-sans leading-relaxed">
              {loadingReport ? (
                <div className="py-16 text-center space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">Generating Incident Diagnostics...</p>
                    <p className="text-zinc-300 text-[11px]">Compiling chronological logs, isolating database locks, and generating code fixes.</p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-900">
                    <div>
                      <span className="text-[10px] text-zinc-300 block uppercase font-semibold">Incident Severity</span>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        reportData.severity === 'Critical' || reportData.severity === 'High' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {reportData.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-300 block uppercase font-semibold">Outage Score</span>
                      <span className="text-xs font-bold text-zinc-200 mt-1 block">
                        {reportData.outageRiskScore} / 100
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-300 block uppercase font-semibold">Affected Services</span>
                      <span className="text-xs font-bold text-zinc-200 mt-1 block truncate">
                        {reportData.affectedServices.length > 0 ? reportData.affectedServices.join(', ') : 'All systems'}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-1">1. Incident Summary</h4>
                    <p className="text-zinc-300">{reportData.summary}</p>
                  </div>

                  {/* Root Cause */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-1">2. Root Cause Analysis</h4>
                    <p className="text-zinc-300">{reportData.rootCause}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-1">3. Recommended Action Plan</h4>
                    <div className="space-y-3">
                      {reportData.recommendedActions.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl space-y-1.5">
                          <h5 className="font-bold text-purple-400">{rec.title}</h5>
                          <p className="text-zinc-300 text-[11px]">{rec.description}</p>
                          {rec.codeExample && (
                            <pre className="bg-zinc-950 p-2 rounded border border-zinc-900 text-[9px] font-mono text-cyan-400 overflow-x-auto leading-relaxed">
                              {rec.codeExample}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-900 flex justify-between bg-zinc-950">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Report
              </button>
              {reportData && (
                <button 
                  onClick={() => {
                    const mdReport = `
# APIspect AI Incident Report: ${reportData.incidentId}
- **Timestamp:** ${reportData.timestamp}
- **Severity:** ${reportData.severity}
- **Outage Score:** ${reportData.outageRiskScore}/100
- **Affected Services:** ${reportData.affectedServices.join(', ') || 'N/A'}

## 1. Incident Summary
${reportData.summary}

## 2. Root Cause Analysis
${reportData.rootCause}

## 3. Recommended Actions
${reportData.recommendedActions.map((r: any, idx: number) => `${idx + 1}. **${r.title}**: ${r.description}`).join('\n')}
`;
                    navigator.clipboard.writeText(mdReport.trim());
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'Copied Markdown!' : 'Copy Report'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-900 py-10 mt-16 bg-zinc-950/40 text-center text-xs text-zinc-300">
        <p>© 2026 APIspect Observability Inc. Built for premium developers.</p>
      </footer>
    </div>
  );
}
