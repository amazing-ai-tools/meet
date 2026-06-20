export function createMeetingUrl(slug: string, appDomain: string): string {
  const normalizedDomain = appDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${normalizedDomain}/r/${slug}`;
}
