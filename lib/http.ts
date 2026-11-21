import "server-only";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { ...NO_STORE, ...headers } });
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return json({ error, ...extra }, status, headers);
}

export const notConfigured = () => fail(503, "Pàdé is warming up. Please try again in a moment.");
export const serverError = (e: unknown, where: string) => {
  console.error(`[pade] ${where}:`, e instanceof Error ? e.message : e);
  return fail(500, "Network wahala. Please try again.");
};
