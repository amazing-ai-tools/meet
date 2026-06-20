export async function onRequest(context: EventContext<{ BACKEND_ORIGIN?: string }, string, unknown>) {
  const backendOrigin = context.env.BACKEND_ORIGIN || 'https://meet.api.amazing-ai.tools';

  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, backendOrigin);

  return fetch(new Request(targetUrl, context.request));
}
