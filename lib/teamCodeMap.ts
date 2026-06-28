/**
 * Maps 3-letter FIFA TLA codes → 2-letter ISO 3166-1 alpha-2 codes.
 * Used by the Flag component (react-world-flags) which requires ISO-2 codes.
 */
export const TLA_TO_ISO: Record<string, string> = {
  GER: 'DE',
  PAR: 'PY',
  FRA: 'FR',
  SWE: 'SE',
  RSA: 'ZA',
  CAN: 'CA',
  NED: 'NL',
  MAR: 'MA',
  POR: 'PT',
  CRO: 'HR',
  ESP: 'ES',
  AUT: 'AT',
  USA: 'US',
  BIH: 'BA',
  BEL: 'BE',
  SEN: 'SN',
  BRA: 'BR',
  JPN: 'JP',
  CIV: 'CI',
  NOR: 'NO',
  MEX: 'MX',
  ECU: 'EC',
  ENG: 'GB',
  COD: 'CD',
  ARG: 'AR',
  CPV: 'CV',
  AUS: 'AU',
  EGY: 'EG',
  SUI: 'CH',
  ALG: 'DZ',
  COL: 'CO',
  GHA: 'GH',
  // Additional teams that might appear
  ITA: 'IT',
  URU: 'UY',
  CHI: 'CL',
  PER: 'PE',
  CMR: 'CM',
  NGA: 'NG',
  TUN: 'TN',
  KOR: 'KR',
  IRN: 'IR',
  KSA: 'SA',
  QAT: 'QA',
  POL: 'PL',
  DEN: 'DK',
  SRB: 'RS',
  WAL: 'GB-WLS',
  SCO: 'GB-SCT',
  CRC: 'CR',
  HON: 'HN',
  PAN: 'PA',
  JAM: 'JM',
  TRI: 'TT',
};

/** Convert a FIFA TLA code to an ISO-2 code for flag rendering. Returns the input if no mapping exists. */
export function getIsoCode(tla: string): string {
  if (!tla) return tla;
  return TLA_TO_ISO[tla.toUpperCase()] || tla;
}

/** Reverse map: ISO-2 → TLA (for migration purposes) */
export const ISO_TO_TLA: Record<string, string> = Object.fromEntries(
  Object.entries(TLA_TO_ISO).map(([tla, iso]) => [iso, tla])
);
