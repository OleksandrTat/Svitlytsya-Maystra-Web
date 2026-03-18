type AdminCandidate = {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null;

export function isAdminUser(user: AdminCandidate): boolean {
  if (!user) {
    return false;
  }

  const rawIsAdmin = user.user_metadata?.is_admin;
  const fromUserMetadata =
    rawIsAdmin === true ||
    rawIsAdmin === "true" ||
    rawIsAdmin === 1 ||
    rawIsAdmin === "1";

  const appRole = user.app_metadata?.role;
  const appRoles = user.app_metadata?.roles;
  const fromAppMetadata =
    appRole === "admin" ||
    (Array.isArray(appRoles) && appRoles.some((role) => role === "admin"));

  return fromUserMetadata || fromAppMetadata;
}
