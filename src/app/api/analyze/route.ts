import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { metrics, recentErrors } = await req.json();

    if (!metrics || !recentErrors) {
      return NextResponse.json(
        { error: 'Missing log metrics or recent errors.' },
        { status: 400 }
      );
    }

    // 1. Detect Available API Keys
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !groqKey && !openaiKey) {
      return NextResponse.json(
        {
          error: 'No API key configured. Please set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in your .env.local file.',
          noKey: true
        },
        { status: 400 }
      );
    }

    // Formulate the analysis prompt
    const prompt = `
Analyze the following API logs and metrics.
Tasks:
1. Detect anomalies and recurring failures.
2. Identify probable root causes.
3. Categorize severity (Critical, High, Medium, Low).
4. Suggest debugging fixes, providing detailed step-by-step resolution steps and code examples where helpful.
5. Summarize overall system health.
6. Estimate outage probability.

Return the response ONLY in a structured JSON format exactly conforming to this TypeScript type:
{
  "summary": string;
  "severity": "Low" | "Medium" | "High" | "Critical";
  "topIssues": string[];
  "rootCause": string;
  "recommendations": {
    "title": string;
    "description": string;
    "codeExample"?: string; // Provide code example if relevant (e.g. Node.js, SQL, configuration block)
  }[];
  "outageRisk": "Low" | "Medium" | "High" | "Critical";
  "outageRiskExplanation": string;
  "businessImpact": {
    "revenueImpact": "Low" | "Medium" | "High" | "Critical";
    "criticalService": string;
  };
  "immediateActions": string[];
}

Here are the parsed metrics:
- Total Requests: ${metrics.totalRequests}
- Total Errors (5xx/failures): ${metrics.errorsCount}
- Total Warnings (4xx/slowness): ${metrics.warningsCount}
- Average Latency: ${metrics.avgLatency}ms
- Failure Rate: ${metrics.failureRate}%
- Error Categories: ${JSON.stringify(metrics.errorCategories)}
- Endpoints Analyzed: ${JSON.stringify(Object.keys(metrics.endpointMetrics))}

Here is a sample of recent logs that triggered errors or warnings:
${recentErrors.join('\n')}
`;

    let resultJson: any = null;

    // A. Use Gemini (Preferred)
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });
        
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        resultJson = JSON.parse(cleanJsonString(text));
      } catch (err: any) {
        console.error('Gemini API Error:', err);
        throw new Error(`Gemini API failed: ${err.message}`);
      }
    } 
    // B. Use Groq
    else if (groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });
        const data = await res.json();
        const text = data.choices[0].message.content;
        resultJson = JSON.parse(text);
      } catch (err: any) {
        console.error('Groq API Error:', err);
        throw new Error(`Groq API failed: ${err.message}`);
      }
    }
    // C. Use OpenAI
    else if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });
        const data = await res.json();
        const text = data.choices[0].message.content;
        resultJson = JSON.parse(text);
      } catch (err: any) {
        console.error('OpenAI API Error:', err);
        throw new Error(`OpenAI API failed: ${err.message}`);
      }
    }

    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Error during log analysis:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during analysis.', noKey: true },
      { status: 400 }
    );
  }
}

// Helper to clean up any markdown blocks if returned by model
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}
