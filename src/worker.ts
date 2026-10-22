export interface Env {
  ASSETS?: { fetch: (request: Request | string) => Promise<Response> };
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  GOOGLE_PLACES_API_KEY?: string;
  VITE_GOOGLE_PLACES_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

    // 1. Runtime Config Endpoint (Safe public configuration)
    if (url.pathname === '/api/config') {
      return new Response(
        JSON.stringify({
          hasGemini: Boolean(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
          googlePlacesApiKey: env.GOOGLE_PLACES_API_KEY || env.VITE_GOOGLE_PLACES_API_KEY || '',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 2. Gemini AI Edge Endpoint
    if (url.pathname.startsWith('/api/gemini/')) {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
      const endpoint = url.pathname.replace('/api/gemini/', '').split('?')[0];

      try {
        const body = (await request.json().catch(() => ({}))) as any;

        if (apiKey) {
          // Call Google Gemini REST API directly from the Cloudflare edge
          let prompt = '';
          if (endpoint === 'assistant') {
            prompt = `You are an expert, friendly personal travel concierge for a trip to ${body.destination || "the traveler's destination"}. 
Current trip context: ${body.tripContext || 'General travel'}
User query: ${body.prompt}
Provide practical, well-formatted, actionable advice with local insider tips, transit hacks, and etiquette. Keep it easy to read on mobile.`;
          } else if (endpoint === 'optimize-itinerary') {
            prompt = `Reorder and optimize the following trip activities in ${body.destination || 'destination'} to minimize travel commute and balance energy levels. Return a JSON array: ${JSON.stringify(body.activities || [])}`;
          } else if (endpoint === 'smart-packing') {
            prompt = `Generate a smart packing checklist for a ${body.days || 5}-day ${body.style || 'cultural'} trip to ${body.destination || 'Kashmir'}. Return a JSON array of items with { name: string, category: string, reason: string }.`;
          } else {
            prompt = body.prompt || 'Travel recommendation';
          }

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (geminiRes.ok) {
            const data = (await geminiRes.json()) as any;
            const replyText =
              data?.candidates?.[0]?.content?.parts?.[0]?.text ||
              'No response generated.';
            return new Response(JSON.stringify({ reply: replyText }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        // Graceful fallback simulation if GEMINI_API_KEY is not yet configured
        return new Response(
          JSON.stringify({
            reply:
              `Here are curated insider travel recommendations for ${body.destination || 'your destination'}:\n\n` +
              `• Best time to visit: Early morning (7:30 - 9:00 AM) or after 4:30 PM to avoid peak crowds.\n` +
              `• Transit Tip: Book local cab passes or prepaid prepaid counters at transit hubs.\n` +
              `• Luggage: Keep digital IDs and tickets stored in your offline wallet for quick access.\n` +
              `• Safety: Drink sealed bottled water and keep emergency contacts handy.`,
            isSimulated: true,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || 'Gemini edge handler error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

      // 3. Fallback: Serve static SPA assets from ./dist (HTML, JS, CSS, images)
      if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        return await env.ASSETS.fetch(request);
      }

      // If env.ASSETS is unavailable or not bound, return clean HTML fallback
      return new Response(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>JKVoyage</title></head><body><div id="root">Loading JKVoyage...</div></body></html>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    } catch (globalErr: any) {
      console.error('Cloudflare Worker edge exception caught:', globalErr);
      return new Response(
        JSON.stringify({
          error: 'Worker Execution Notice',
          message: globalErr?.message || String(globalErr),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
