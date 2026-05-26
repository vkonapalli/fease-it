export async function parseRequestData(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return request.json();
  }
  
  const formData = await request.formData();
  return Object.fromEntries(formData);
}

export function validateOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  const host = request.headers.get("Host");
  const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  
  if (!origin || !host) return false;
  
  // In development, allow localhost matching
  if (process.env.NODE_ENV === "development" && (host.includes("localhost") || host.includes("127.0.0.1"))) {
    return true;
  }
  
  const expectedOrigin = `${protocol}://${host}`;
  return origin === expectedOrigin;
}
