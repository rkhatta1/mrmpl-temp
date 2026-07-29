const ADMIN_SUBDOMAIN_PREFIX = "admin.";

export function normalizeHostname(hostHeader: string | null) {
  return hostHeader?.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

export function isAdminHostname(hostHeader: string | null) {
  const hostname = normalizeHostname(hostHeader);
  const configuredHostname = normalizeHostname(
    process.env.ADMIN_HOSTNAME ?? null,
  );

  return (
    hostname === "admin.localhost" ||
    hostname.startsWith(ADMIN_SUBDOMAIN_PREFIX) ||
    (configuredHostname.length > 0 && hostname === configuredHostname)
  );
}

export function getAdminBasePath(hostHeader: string | null) {
  return isAdminHostname(hostHeader) ? "" : "/admin";
}
