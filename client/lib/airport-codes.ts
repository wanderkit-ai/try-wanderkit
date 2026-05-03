/** Maps common city names / nicknames to their primary IATA airport code. */
const CITY_TO_IATA: Record<string, string> = {
  // North America
  'new york': 'JFK', 'nyc': 'JFK', 'brooklyn': 'JFK', 'manhattan': 'JFK', 'queens': 'JFK',
  'los angeles': 'LAX', 'la': 'LAX',
  'san francisco': 'SFO', 'sf': 'SFO', 'bay area': 'SFO',
  'chicago': 'ORD',
  'miami': 'MIA',
  'boston': 'BOS',
  'seattle': 'SEA',
  'washington': 'IAD', 'dc': 'IAD', 'washington dc': 'IAD',
  'dallas': 'DFW',
  'houston': 'IAH',
  'denver': 'DEN',
  'atlanta': 'ATL',
  'phoenix': 'PHX',
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'cancun': 'CUN',
  'mexico city': 'MEX',
  'buenos aires': 'EZE',
  'rio de janeiro': 'GIG', 'rio': 'GIG',
  'sao paulo': 'GRU',
  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'berlin': 'BER',
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'rome': 'FCO',
  'milan': 'MXP',
  'lisbon': 'LIS',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'copenhagen': 'CPH',
  'helsinki': 'HEL',
  'athens': 'ATH',
  'istanbul': 'IST',
  'prague': 'PRG',
  'budapest': 'BUD',
  'warsaw': 'WAW',
  'brussels': 'BRU',
  'dublin': 'DUB',
  // Africa
  'cairo': 'CAI',
  'nairobi': 'NBO', 'kenya': 'NBO', 'maasai mara': 'NBO',
  'cape town': 'CPT',
  'johannesburg': 'JNB',
  'lagos': 'LOS',
  'casablanca': 'CMN', 'morocco': 'CMN',
  'marrakech': 'RAK',
  // Middle East
  'dubai': 'DXB', 'uae': 'DXB',
  'abu dhabi': 'AUH',
  'doha': 'DOH', 'qatar': 'DOH',
  'tel aviv': 'TLV', 'israel': 'TLV',
  'amman': 'AMM', 'jordan': 'AMM',
  'riyadh': 'RUH',
  // Asia
  'tokyo': 'HND',
  'osaka': 'KIX',
  'kyoto': 'KIX',
  'seoul': 'ICN', 'south korea': 'ICN',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'singapore': 'SIN',
  'bangkok': 'BKK', 'thailand': 'BKK',
  'phuket': 'HKT',
  'bali': 'DPS', 'denpasar': 'DPS',
  'jakarta': 'CGK',
  'kuala lumpur': 'KUL', 'kl': 'KUL',
  'manila': 'MNL',
  'taipei': 'TPE',
  'mumbai': 'BOM', 'bombay': 'BOM',
  'delhi': 'DEL', 'new delhi': 'DEL',
  'bangalore': 'BLR',
  'colombo': 'CMB', 'sri lanka': 'CMB',
  'kathmandu': 'KTM', 'nepal': 'KTM',
  'annapurna': 'KTM',
  'pokhara': 'PKR',
  // Oceania
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'brisbane': 'BNE',
  'perth': 'PER',
  'auckland': 'AKL', 'new zealand': 'AKL',
  // Central America / Caribbean
  'costa rica': 'SJO', 'san jose': 'SJO',
  'nosara': 'LIR',
  'panama': 'PTY',
  'havana': 'HAV',
};

/**
 * Resolve a user-typed city/country name to its primary IATA code.
 * Returns the input uppercased if it's already a 3-letter code.
 * Returns null if no mapping found (caller may still send the raw string).
 */
export function resolveIATA(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 3 && /^[A-Za-z]+$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const key = trimmed.toLowerCase();
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (key === city || key.includes(city) || city.includes(key)) {
      return code;
    }
  }
  return null;
}

/** Returns "City (XYZ)" label if an IATA code is known, else just the raw value. */
export function labelWithCode(input: string): string {
  if (!input.trim()) return input;
  const code = resolveIATA(input);
  if (!code) return input;
  const trimmed = input.trim();
  if (trimmed.toUpperCase() === code) return trimmed.toUpperCase();
  return `${trimmed} (${code})`;
}
