export function getPublicApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}
