function jsonHeaders(): Headers {
  return new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
}

export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders() });
}

export function errorJson(message: string, status = 400): Response {
  return json({ error: message }, status);
}