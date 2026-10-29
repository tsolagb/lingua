export const TERMS_VERSION = "terms-2026-10-20-draft-v1";
export const PRIVACY_VERSION = "privacy-2026-10-20-draft-v2";
export const LEGAL_ACCEPTANCE_PENDING_KEY = "@linguamatch_v1_pending_legal_acceptance";
export const LEGAL_GUEST_ACCEPTANCE_KEY = "@linguamatch_v1_guest_legal_acceptance";

export interface LegalAcceptancePayload {
  termsVersion: typeof TERMS_VERSION;
  privacyVersion: typeof PRIVACY_VERSION;
  adultAttested: true;
}

export const CURRENT_LEGAL_ACCEPTANCE: LegalAcceptancePayload = {
  termsVersion: TERMS_VERSION,
  privacyVersion: PRIVACY_VERSION,
  adultAttested: true,
};
