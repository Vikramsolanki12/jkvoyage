export interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }
    return new Response("JKVoyage - Built and Ready", { status: 200 });
  }
};
