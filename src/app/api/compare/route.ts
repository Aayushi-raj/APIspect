import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { beforeMetrics, afterMetrics, beforeRecentErrors, afterRecentErrors } = await req.json();

    if (!beforeMetrics || !afterMetrics) {
      return NextResponse.json(
        { error: 'Missing metrics for comparison.' },
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

    // Formulate the comparison prompt
    const prompt = `
Compare the API performance and failure logs before and after a deployment.

Before Deployment Metrics:
- Total Requests: ${beforeMetrics.totalRequests}
- Total Errors: ${beforeMetrics.errorsCount}
- Failure Rate: ${beforeMetrics.failureRate}%
- Average Latency: ${beforeMetrics.avgLatency}ms
- Top Error Categories: ${JSON.stringify(beforeMetrics.errorCategories)}

After Deployment Metrics:
- Total Requests: ${afterMetrics.totalRequests}
- Total Errors: ${afterMetrics.errorsCount}
- Failure Rate: ${afterMetrics.failureRate}%
- Average Latency: ${afterMetrics.avgLatency}ms
- Top Error Categories: ${JSON.stringify(afterMetrics.errorCategories)}

Sample Errors Before Deployment:
${beforeRecentErrors?.slice(0, 10).join('\n') || 'None'}

Sample Errors After Deployment:
${afterRecentErrors?.slice(0, 10).join('\n') || 'None'}

Tasks:
1. Identify any regression in performance (e.g. latency spikes, throughput drops).
2. Spot any NEW error patterns or exceptions introduced in the "after" logs that were not present in "before" logs.
3. Classify regression severity: "Low", "Medium", "High", or "Critical".
4. Suggest a probable cause (e.g. bad database query, code exception, configurations) and recommend whether to rollback or hotfix.

Return the response ONLY in a structured JSON format exactly conforming to this TypeScript type:
{
  "summary": string;
  "regressionSeverity": "Low" | "Medium" | "High" | "Critical";
  "latencyChangeMs": number; // Positive is increase, negative is decrease
  "failureRateChangePct": number; // Positive is increase, negative is decrease
  "newErrors": string[]; // List of new error patterns identified
  "rootCause": string;
  "recommendation": {
    "action": "Rollback Recommended" | "Hotfix Advised" | "Monitor Closely" | "No Regression Detected";
    "details": string;
    "fixes": string[];
  };
  "businessImpact": {
    "revenueImpact": "Low" | "Medium" | "High" | "Critical";
    "criticalService": string;
  };
  "immediateActions": string[];
}
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
    console.error('Error during log comparison:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during comparison.', noKey: true },
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
