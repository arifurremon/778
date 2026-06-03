/** Canonical legal document versions — bump when policy content changes. */
export const CURRENT_POLICY_VERSION = "1.0.0";
export const POLICY_LAST_UPDATED = "2026-03-12";

export const PRIVACY_POLICY_TITLE = "Privacy Policy";
export const TERMS_OF_SERVICE_TITLE = "Terms of Service";

export function userNeedsPolicyReconsent(
  policyVersion: string | null | undefined
): boolean {
  return policyVersion !== CURRENT_POLICY_VERSION;
}
