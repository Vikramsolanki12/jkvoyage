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

    if (endpoint === 'explore-places') {
      const { destination, category, coordinates, userQuery } = body;
      const targetCat = category || 'all';
      const cleanDest = destination || 'your destination';

      if (ai) {
        const promptText = `You are an expert Google Maps guide and local travel specialist.
Discover 8 to 12 top-rated, authentic, verified nearby places, points of interest, and culinary or cultural highlights for travelers visiting ${cleanDest}.
Category filter: "${targetCat}" (where 'all' includes iconic attractions, top dining, cafes, and stays; 'attraction' focuses on top sights and monuments; 'restaurant' on local cuisine; 'cafe' on coffee and brunch spots; 'hotel' on stays).
${coordinates ? `Geographic center: latitude ${coordinates.latitude}, longitude ${coordinates.longitude}.` : ''}
${userQuery ? `Specific traveler request / query: "${userQuery}".` : ''}

Return ONLY a JSON array of objects with this exact structure:
[
  {
    "id": "place_unique_id",
    "title": "Official Place Name",
    "category": "attraction" | "food" | "culture" | "nature" | "hotel",
    "address": "Specific locality or road, ${cleanDest}",
    "rating": 4.7,
    "reviewCount": 1850,
    "bestTime": "Recommended visiting hours or sunset slot",
    "estCostINR": 350,
    "insiderTip": "Actionable insider tip, entry advice, or photo spot recommendation",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "latitude": 28.6139,
    "longitude": 77.2090,
    "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Official+Place+Name+${encodeURIComponent(cleanDest)}"
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
          },
        });

        try {
          const parsed = JSON.parse(response.text || '[]');
          sendJson(res, 200, { places: parsed, poweredBy: 'Gemini 3.8 Flash' });
          return true;
        } catch {
          sendJson(res, 200, { places: [], poweredBy: 'Gemini 3.8 Flash' });
          return true;
        }
      } else {
        const simulatedPlaces = [
          {
            id: 'gemini_gem_1',
            title: `${cleanDest} Old Heritage Quarter & Fort`,
            category: 'culture',
            address: `Heritage District, Central ${cleanDest}`,
            rating: 4.8,
            reviewCount: 3420,
            bestTime: 'Early morning 7:30 AM - 10:00 AM (least crowd)',
            estCostINR: 200,
            insiderTip: 'Book entry pass online or hire an accredited ASI certified guide at the south gate.',
            tags: ['Heritage', 'Architecture', 'Iconic Landmark'],
            latitude: coordinates?.latitude || 26.9124,
            longitude: coordinates?.longitude || 75.7873,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}+Heritage+Fort`
          },
          {
            id: 'gemini_gem_2',
            title: `The Spice & Artisan Royal Bazaar`,
            category: 'attraction',
            address: `Old City Market, ${cleanDest}`,
            rating: 4.7,
            reviewCount: 2890,
            bestTime: 'Evening 5:00 PM - 8:30 PM when lanterns light up',
            estCostINR: 150,
            insiderTip: 'Try the traditional saffron tea and handmade lac bangles; standard bargaining is customary.',
            tags: ['Bazaar', 'Local Crafts', 'Street Food'],
            latitude: (coordinates?.latitude || 26.9124) + 0.005,
            longitude: (coordinates?.longitude || 75.7873) + 0.004,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}+Bazaar`
          },
          {
            id: 'gemini_gem_3',
            title: `Heritage Grand Thali & Dining Courtyard`,
            category: 'food',
            address: `Palace Road, ${cleanDest}`,
            rating: 4.9,
            reviewCount: 4120,
            bestTime: 'Lunch 12:30 PM - 2:30 PM or Candlelight Dinner',
            estCostINR: 650,
            insiderTip: 'Order the authentic Rajasthani / regional festive thali with freshly churned butter and warm rotis.',
            tags: ['Fine Dining', 'Authentic Regional', 'Vegetarian Friendly'],
            latitude: (coordinates?.latitude || 26.9124) - 0.004,
            longitude: (coordinates?.longitude || 75.7873) + 0.006,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}+Traditional+Dining`
          },
          {
            id: 'gemini_gem_4',
            title: `Artisan Roastery & Rooftop Cafe`,
            category: 'food',
            address: `Lakeview Promenade, ${cleanDest}`,
            rating: 4.6,
            reviewCount: 1640,
            bestTime: 'Late afternoon 4:00 PM for sunset views',
            estCostINR: 320,
            insiderTip: 'Outdoor balcony seats have the best panoramic skyline photo vantage point with great cold brew.',
            tags: ['Cafe', 'Rooftop', 'Sunset View'],
            latitude: (coordinates?.latitude || 26.9124) + 0.008,
            longitude: (coordinates?.longitude || 75.7873) - 0.005,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanDest)}+Rooftop+Cafe`
          }
        ];
        sendJson(res, 200, { places: simulatedPlaces, isSimulated: true, poweredBy: 'Gemini Travel Concierge' });
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
