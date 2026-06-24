export type WidgetEmbedParams = {
  contextId: string;
  displayName: string;
  title: string;
};

export function readWidgetEmbedParams(search: string): WidgetEmbedParams {
  const params = new URLSearchParams(search);

  return {
    contextId: readParam(params, 'contextId'),
    displayName: readParam(params, 'displayName'),
    title: readParam(params, 'title'),
  };
}

function readParam(params: URLSearchParams, key: string): string {
  return (params.get(key) || '').trim().slice(0, 160);
}
