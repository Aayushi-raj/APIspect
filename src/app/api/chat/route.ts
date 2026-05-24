import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { metrics, recentErrors, messages } = await req.json();

    if (!metrics || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing metrics, errors, or message history.' },
        { status: 400 }
      );
    }

    const userMessage = messages[messages.length - 1]?.content || '';

    // 1. Detect Available API Keys
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Helper for local mock responses when no key is set
    const getLocalMockResponse = (userMsg: string) => {
      const lowerMsg = userMsg.toLowerCase().trim();
      const failRate = metrics.failureRate ?? 0;
      const avgLat = metrics.avgLatency ?? 0;
      const risk = metrics.outageRisk ?? 'Low';
      const score = metrics.outageRiskScore ?? 0;
      
      const endpoints = Object.keys(metrics.endpointMetrics || {});
      const failingEndpoints = endpoints.filter((ep: string) => metrics.endpointMetrics[ep].failures > 0);
      const slowEndpoints = endpoints.filter((ep: string) => metrics.endpointMetrics[ep].avgLatency > 1000);
      
      const endpointSummaryStr = endpoints.map((ep: string) => {
        const met = metrics.endpointMetrics[ep];
        return `- \`${ep}\` (${met.requests} requests, ${met.failures} failures, avg latency ${met.avgLatency}ms)`;
      }).join('\n');

      const recentErrorsSummaryStr = (metrics.recentErrors && metrics.recentErrors.length > 0)
        ? metrics.recentErrors.slice(0, 5).map((err: string) => `- \`${err}\``).join('\n')
        : '- No recent error logs found.';

      const outageRiskFactors = metrics.outageRiskFactors || [];

      // 1. Check for specific endpoint mentions in the query
      let matchedEndpoint = '';
      for (const ep of endpoints) {
        if (lowerMsg.includes(ep.toLowerCase())) {
          matchedEndpoint = ep;
          break;
        }
      }

      if (matchedEndpoint) {
        const met = metrics.endpointMetrics[matchedEndpoint];
        const epFailRate = met.requests > 0 ? ((met.failures / met.requests) * 100).toFixed(1) : '0';
        
        let response = `### 📊 Endpoint Diagnostics: \`${matchedEndpoint}\`\n\n`;
        response += `- **Requests:** ${met.requests}\n`;
        response += `- **Failures:** ${met.failures} (${epFailRate}% failure rate)\n`;
        response += `- **Average Latency:** ${met.avgLatency}ms\n\n`;

        if (met.failures > 0) {
          response += `#### 🚨 Failure Analysis:\n`;
          const firstError = met.errors?.[0] || 'Unknown Exception';
          response += `The endpoint is failing with the following recent trace:\n`;
          response += `> \`${firstError}\`\n\n`;

          if (firstError.toLowerCase().includes('discount_rate') || firstError.toLowerCase().includes('column')) {
            response += `**Root Cause:** A missing database column \`discount_rate\` is preventing the SQL query from executing successfully. This typically happens when a code deployment occurs before its database migration has run.\n\n`;
            response += `**Remediation SQL Fix:**\n`;
            response += `\`\`\`sql\n-- Run this migration to add the missing column\nALTER TABLE products ADD COLUMN discount_rate DECIMAL(10,2) DEFAULT 0.00;\n\`\`\`\n`;
          } else if (firstError.toLowerCase().includes('pool') || firstError.toLowerCase().includes('exhaust') || firstError.toLowerCase().includes('timeout')) {
            response += `**Root Cause:** The database connection pool is exhausted or connections are timing out. This indicates that database connections are not being closed properly or the pool limit (\`max\`) is set too low for the current volume of concurrent transactions.\n\n`;
            response += `**Remediation Config Fix:**\n`;
            response += `\`\`\`javascript\n// Increase database pool limits\nconst dbConfig = {\n  max: 30, // Raise limit from default\n  idleTimeoutMillis: 30000,\n  connectionTimeoutMillis: 5000 // fail fast if pool is full\n};\n\`\`\`\n`;
          } else {
            response += `**Root Cause:** Internal Server Error (HTTP 500). An unhandled exception occurred in the route handler logic.\n\n`;
            response += `**Remediation Code Fix:**\n`;
            response += `\`\`\`javascript\n// Wrap code in structured try/catch block\ntry {\n  const data = await processRequest(req);\n  return res.json(data);\n} catch (error) {\n  logger.error('Route failure:', error);\n  return res.status(500).json({ error: 'Internal system exception' });\n}\n\`\`\`\n`;
          }
        } else if (met.avgLatency > 1000) {
          response += `#### ⏱️ Latency Analysis:\n`;
          response += `The endpoint has a high average latency of **${met.avgLatency}ms**. While there are no hard failures, this slowness threatens upstream proxy timeouts and hurts user experience.\n\n`;
          response += `**Remediation Suggestions:**\n`;
          response += `1. **Add Indexing:** Verify if the database queries on this endpoint use filtering keys that lack indices.\n`;
          response += `2. **Cache Responses:** For static or slow-changing queries, cache responses in Redis/Memory:\n`;
          response += `\`\`\`javascript\n// Implement Redis caching middleware\nconst cachedPayload = await redis.get(cacheKey);\nif (cachedPayload) return JSON.parse(cachedPayload);\n\`\`\`\n`;
        } else {
          response += `#### ✅ Status Check:\n`;
          response += `This endpoint is performing within healthy limits. No errors were detected, and average response times are optimal at **${met.avgLatency}ms**.\n`;
        }

        return response;
      }

      // 2. Check for chronological order / timeline / sequence of events queries
      if (lowerMsg.includes('timeline') || lowerMsg.includes('chronolog') || lowerMsg.includes('what happened') || lowerMsg.includes('sequence') || lowerMsg.includes('first')) {
        const events = metrics.timelineEvents || [];
        if (events.length === 0) {
          return `### ⏱️ Timeline of Events\n\nNo critical errors or latency spikes were found in the parsed logs to trace.`;
        }

        let response = `### ⏱️ Chronological Incident Flow\n\n`;
        response += `Here is the sequence of events reconstructed from the parsed logs:\n\n`;
        
        events.forEach((evt: any, idx: number) => {
          const levelBadge = evt.level === 'ERROR' ? '🚨' : '⚠️';
          response += `${idx + 1}. **${evt.timeLabel}** ${levelBadge} \`${evt.level}\` -> **${evt.event}**\n`;
          response += `   *Details:* ${evt.description}\n`;
        });

        response += `\n**Incident Summary:** The timeline shows that the outage sequence started with warnings/latencies and culminated in consecutive HTTP 500 server errors. We recommend investigating the initial timestamps to isolate the trigger.`;
        return response;
      }

      // 3. Check for specific error message lookup (e.g. database pool, discount_rate, etc.)
      const errorKeywords = ['pool', 'exhaust', 'discount_rate', 'column', 'timeout', 'timed out', 'token', 'auth', 'security', '401', '500'];
      let matchedKeyword = '';
      for (const keyword of errorKeywords) {
        if (lowerMsg.includes(keyword)) {
          matchedKeyword = keyword;
          break;
        }
      }

      if (matchedKeyword || lowerMsg.includes('error') || lowerMsg.includes('fail') || lowerMsg.includes('exception')) {
        const filterWord = matchedKeyword || 'error';
        const matchingLogs = (metrics.recentErrors || []).filter((err: string) => 
          err.toLowerCase().includes(filterWord)
        );

        if (matchingLogs.length > 0) {
          let response = `### 🔍 Isolated Error Log Traces (Matching: "${filterWord}")\n\n`;
          response += `Found ${matchingLogs.length} matching error traces in the active log payload:\n\n`;
          
          matchingLogs.slice(0, 4).forEach((log: string) => {
            response += `> \`${log}\`\n\n`;
          });

          response += `#### **Diagnosis & Recommendation:**\n`;
          if (filterWord === 'discount_rate' || filterWord === 'column') {
            response += `- **Issue:** Missing database schema column.\n`;
            response += `- **Fix:** Run the SQL migration:\n`;
            response += `\`\`\`sql\nALTER TABLE products ADD COLUMN discount_rate DECIMAL(10,2) DEFAULT 0.00;\n\`\`\``;
          } else if (filterWord === 'pool' || filterWord === 'exhaust' || filterWord === 'timeout' || filterWord === 'timed out') {
            response += `- **Issue:** Database connection exhaustion or slow responses.\n`;
            response += `- **Fix:** Increase the connection pool limit in config and ensure connections are released back to the pool in a \`finally\` block.`;
          } else if (filterWord === 'auth' || filterWord === 'token' || filterWord === '401') {
            response += `- **Issue:** Authentication failures.\n`;
            response += `- **Fix:** Verify bearer token format and expiration. Check if auth middleware is misconfigured.`;
          } else {
            response += `- **Fix:** Inspect the route handlers matching the timestamp. Verify parameters and database query locks.`;
          }
          return response;
        }
      }

      // 4. Outage Risk Score Details
      if (lowerMsg.includes('risk') || lowerMsg.includes('outage') || lowerMsg.includes('score') || lowerMsg.includes('critical') || lowerMsg.includes('high')) {
        const factorsList = (outageRiskFactors.length > 0)
          ? outageRiskFactors.map((f: string) => `- ${f}`).join('\n')
          : '- No critical risk factors identified.';

        return `### ⚠️ System Outage Risk Assessment
        
The current System Outage Risk is **${risk}** with a score of **${score}/100**.

#### **Identified Risk Factors:**
${factorsList}

#### **AI Diagnosis:**
${failRate > 10 
  ? `The primary driver of system instability is the high failure rate of **${failRate}%**. Crucial write operations are failing and raising errors.` 
  : 'System failures are low, but latency issues or warnings could cause service level agreement breaches.'
}
${avgLat > 1000 
  ? `Additionally, average response latency is elevated at **${avgLat}ms**, which points to connection bottlenecks.` 
  : ''
}

Would you like recommended code fixes or database pool configurations?`;
      }

      // 5. Latency queries
      if (lowerMsg.includes('latency') || lowerMsg.includes('slow') || lowerMsg.includes('time') || lowerMsg.includes('speed')) {
        let response = `### ⏱️ Latency Analysis Report\n\n`;
        response += `- **Average System Latency:** ${avgLat}ms\n`;
        response += `- **Slowest Endpoints:** ${slowEndpoints.length > 0 ? slowEndpoints.map((e: string) => `\`${e}\` (${metrics.endpointMetrics[e].avgLatency}ms)`).join(', ') : 'None'}\n\n`;
        
        response += `#### **Diagnosis:**\n`;
        if (slowEndpoints.length > 0) {
          response += `The slowest endpoints identified are: ${slowEndpoints.map((e: string) => `\`${e}\``).join(', ')}. Response times exceed the 1000ms threshold.\n\n`;
        } else {
          response += `Overall latency is stable, but individual peaks could still be optimized.\n\n`;
        }
        
        response += `#### **Recommended Solution (Caching Middleware):**\n`;
        response += `\`\`\`javascript\n// Cache static or slow product payloads in Redis\nconst cacheMiddleware = async (req, res, next) => {\n  const key = \`cache:\${req.originalUrl}\`;\n  const cachedVal = await redisClient.get(key);\n  if (cachedVal) {\n    return res.json(JSON.parse(cachedVal));\n  }\n  res.sendResponse = res.json;\n  res.json = (body) => {\n    redisClient.set(key, JSON.stringify(body), { EX: 300 }); // Cache for 5 mins\n    res.sendResponse(body);\n  };\n  next();\n};\n\`\`\``;
        return response;
      }

      // 6. Greetings
      if (lowerMsg.match(/\b(hi|hello|hey|greetings|help|howdy|what can you do|who are you)\b/i)) {
        return `### 🤖 Hello! I am DebugPilot AI, your interactive troubleshooting copilot.
        
I am monitoring your active logs. Here is a quick snapshot of the parsed dataset:
- **Total Requests:** ${metrics.totalRequests}
- **Failure Rate:** ${failRate}% (${metrics.errorsCount} failures)
- **Average Latency:** ${avgLat}ms
- **Outage Risk Classification:** **${risk}** (Score: ${score}/100)

**What would you like me to debug?** You can ask:
1. *"Why is /api/v1/payment failing?"* (or ask about any other endpoint)
2. *"What happened first in the logs?"* (for a chronological timeline)
3. *"Why is the outage risk score high?"*
4. *"Show me the database error traces"*
5. Or type any custom question about the system logs!`;
      }

      // 7. General Fallback
      return `### 🤖 DebugPilot Contextual Engine

I am examining the active log workspace. Here is a summary of the current session state:
- **Total Traces:** ${metrics.totalRequests}
- **Anomalies Found:** ${metrics.errorsCount} error logs
- **Performance Average:** ${avgLat}ms latency
- **Status Codes:** ${JSON.stringify(metrics.statusDistribution)}

#### **Recent Errors List:**
${recentErrorsSummaryStr}

What specific log trace, endpoint, or metric can I help you troubleshoot? Feel free to ask about database pool configs, chronological timelines, or slow endpoints.`;
    };

    if (!geminiKey && !groqKey && !openaiKey) {
      return NextResponse.json({
        content: getLocalMockResponse(userMessage),
        noKey: true
      });
    }

    // Formulate system instruction context
    const systemPrompt = `You are DebugPilot AI, an elite interactive API troubleshooting copilot.
You have access to the parsed metrics and log context of the user's web service.
Answer the user's questions contextually, providing root cause analysis, suggestions, or hotfixes with clean code examples.
Be extremely helpful, direct, and concise in your explanations.
Always format your responses with beautiful Markdown and highlight filenames/configurations.
Do not mention API keys or configuration settings unless asked.

Here are the parsed metrics of the current system:
- Total Requests: ${metrics.totalRequests}
- Total Errors (5xx/failures): ${metrics.errorsCount}
- Total Warnings (4xx/slowness): ${metrics.warningsCount}
- Average Latency: ${metrics.avgLatency}ms
- Failure Rate: ${metrics.failureRate}%
- Outage Risk Level: ${metrics.outageRisk} (Score: ${metrics.outageRiskScore}/100)
- Outage Risk Factors: ${metrics.outageRiskFactors?.join(', ') || 'None'}
- Error Categories: ${JSON.stringify(metrics.errorCategories)}
- Endpoints Analyzed: ${JSON.stringify(Object.keys(metrics.endpointMetrics))}

Here is a sample of recent logs that triggered errors or warnings:
${recentErrors.slice(0, 15).join('\n')}
`;

    // A. Use Gemini (Preferred)
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt
        });

        // Convert message history to Gemini format: [{ role: 'user'|'model', parts: [{ text: string }] }]
        const history = messages.slice(0, -1).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text();

        return NextResponse.json({ content: reply });
      } catch (err: any) {
        console.error('Gemini Chat Error:', err);
        return NextResponse.json({
          content: getLocalMockResponse(userMessage),
          noKey: true
        });
      }
    }
 
    // B. Use OpenAI
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ]
          })
        });
        const data = await res.json();
        const reply = data.choices[0].message.content;
        return NextResponse.json({ content: reply });
      } catch (err: any) {
        console.error('OpenAI Chat Error:', err);
        return NextResponse.json({
          content: getLocalMockResponse(userMessage),
          noKey: true
        });
      }
    }
 
    // C. Use Groq
    if (groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ]
          })
        });
        const data = await res.json();
        const reply = data.choices[0].message.content;
        return NextResponse.json({ content: reply });
      } catch (err: any) {
        console.error('Groq Chat Error:', err);
        return NextResponse.json({
          content: getLocalMockResponse(userMessage),
          noKey: true
        });
      }
    }

    return NextResponse.json({
      content: getLocalMockResponse(userMessage),
      noKey: true
    });

  } catch (error: any) {
    console.error('Error during chat handler:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during chat.' },
      { status: 500 }
    );
  }
}
