import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleGeminiApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/gemini/')) {
    return false;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return true;
  }

  try {
    const ai = getAiClient();
    const endpoint = url.replace('/api/gemini/', '').split('?')[0];
    const body = await parseJsonBody(req);

    if (endpoint === 'assistant') {
      const { prompt, destination, tripContext } = body;
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an expert, friendly personal travel concierge for a trip to ${destination || 'the traveler\'s destination'}. 
Current trip context: ${tripContext || 'General travel'}
User query: ${prompt}
Provide practical, well-formatted, actionable advice with local insider tips, cultural etiquette, transit hacks, or budget ideas where relevant. Keep it structured and easy to read on mobile.`,
        });
        sendJson(res, 200, { reply: response.text });
        return true;
      } else {
        const simulatedReplies: Record<string, string> = {
          default: `Here are insider tips for ${destination || 'your destination'}:\n\n` +
            `• Best time to visit top spots: Early morning (7:30 - 9:00 AM) or after 4:30 PM to bypass tour buses.\n` +
            `• Local Transit: Purchase a rechargeable transit pass or multi-day metro card at the airport terminal to save 30%.\n` +
            `• Etiquette: In local restaurants, tipping is either included in service charge or customary to round up to the nearest bill.\n` +
            `• Safety: Keep emergency cash and copy of passport in your digital wallet. Tap water is safe at all accredited hotels.`,
        };
        sendJson(res, 200, { reply: simulatedReplies.default, isSimulated: true });
        return true;
      }
    }

    if (endpoint === 'optimize-itinerary') {
      const { activities, destination } = body;
      if (ai && activities && activities.length > 0) {
        const promptText = `Reorder and optimize the following trip activities in ${destination} to minimize travel commute and balance energy levels across the day.
Return a JSON array of the same activities with suggested "optimizedSlot" ('Morning' | 'Afternoon' | 'Evening' | 'Night'), "recommendedTime", and a short "optimizationReason".
Activities: ${JSON.stringify(activities)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = response.text || '[]';
        try {
          const parsed = JSON.parse(text);
          sendJson(res, 200, { optimized: parsed });
          return true;
        } catch {
          sendJson(res, 200, { optimized: activities });
          return true;
        }
      } else {
        const slots: Array<'Morning' | 'Afternoon' | 'Evening' | 'Night'> = ['Morning', 'Afternoon', 'Evening', 'Night'];
        const optimized = (activities || []).map((act: any, idx: number) => ({
          ...act,
          optimizedSlot: slots[idx % slots.length],
          recommendedTime: ['09:00 AM', '01:30 PM', '06:00 PM', '08:30 PM'][idx % 4],
          optimizationReason: 'Grouped geographically with nearby stops to reduce walking time.',
        }));
        sendJson(res, 200, { optimized, isSimulated: true });
        return true;
      }
    }

    if (endpoint === 'smart-packing') {
      const { destination, days, weather, style } = body;
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Generate a smart, highly specific packing checklist for a ${days || 5}-day ${style || 'cultural'} trip to ${destination || 'Tokyo'}. Current weather forecast: ${weather || 'Sunny, 21°C'}.
Return a JSON array of items with { name: string, category: 'Clothing' | 'Electronics' | 'Documents' | 'Toiletries' | 'Essentials', reason: string }. Include 12-16 items.`,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const items = JSON.parse(response.text || '[]');
        sendJson(res, 200, { items });
        return true;
      } else {
        const defaultItems = [
          { name: 'Universal Travel Power Adapter (Type A/C/G)', category: 'Electronics', reason: 'Essential for local hotel sockets' },
          { name: 'Lightweight Packable Rain Jacket', category: 'Clothing', reason: 'Unpredictable afternoon showers' },
          { name: 'Passport & Physical Backup Copies', category: 'Documents', reason: 'Required for tax-free shopping and hotel check-in' },
          { name: 'Comfortable Broken-in Walking Shoes', category: 'Clothing', reason: '15,000+ steps expected per day' },
          { name: 'Compact 10,000mAh Power Bank', category: 'Electronics', reason: 'Keep phone charged for GPS navigation' },
          { name: 'Prescription Meds & Electrolyte Packets', category: 'Toiletries', reason: 'Stay hydrated during long day trips' },
          { name: 'Refillable Collapsible Water Bottle', category: 'Essentials', reason: 'Eco-friendly water refill stations' },
          { name: 'Travel Insurance Emergency Card', category: 'Documents', reason: 'Instant medical coverage verification' },
          { name: 'Noise-Cancelling Earbuds', category: 'Electronics', reason: 'Transit and train rides' },
          { name: 'Sunscreen SPF 50+ & UV Lip Balm', category: 'Toiletries', reason: 'Outdoor walking and high UV exposure' },
        ];
        sendJson(res, 200, { items: defaultItems, isSimulated: true });
        return true;
      }
    }

    sendJson(res, 404, { error: 'Unknown Gemini endpoint' });
    return true;
  } catch (error: any) {
    console.error('Error handling Gemini API:', error);
    sendJson(res, 500, { error: error.message || 'Server error' });
    return true;
  }
}
