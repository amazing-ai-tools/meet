export async function onRequest(context: EventContext<{ BACKEND_ORIGIN?: string }, string, unknown>) {
  const backendOrigin = context.env.BACKEND_ORIGIN;
  if (!backendOrigin) {
    return Response.json(
      { error: 'BACKEND_ORIGIN is not configured for MeetTeams API proxy' },
      { status: 503 },
    );
  }

  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, backendOrigin);

  return fetch(new Request(targetUrl, context.request));
}
