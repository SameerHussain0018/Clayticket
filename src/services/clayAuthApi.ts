/**
 * Minimal Clay auth / OTP response shape used by {@link ../utils/clayUser}.
 * Extend when wiring additional Clay endpoints.
 */
export interface ClayAuthApiResponse {
  data?: {
    userID?: string;
    userName?: string;
    role?: string;
    partnerCode?: string | number;
  };
}
