/**
 * Global Country List with Phone Codes
 * Comprehensive list of all countries with their ISO codes and phone country codes
 */

export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 code
  phoneCode: string; // Phone country code (e.g., +1, +91)
  flag: string; // Emoji flag
}

export const countries: Country[] = [
  { name: 'Afghanistan', code: 'AF', phoneCode: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', phoneCode: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', phoneCode: '+213', flag: '🇩🇿' },
  { name: 'Argentina', code: 'AR', phoneCode: '+54', flag: '🇦🇷' },
  { name: 'Australia', code: 'AU', phoneCode: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', phoneCode: '+43', flag: '🇦🇹' },
  { name: 'Bangladesh', code: 'BD', phoneCode: '+880', flag: '🇧🇩' },
  { name: 'Belgium', code: 'BE', phoneCode: '+32', flag: '🇧🇪' },
  { name: 'Brazil', code: 'BR', phoneCode: '+55', flag: '🇧🇷' },
  { name: 'Bulgaria', code: 'BG', phoneCode: '+359', flag: '🇧🇬' },
  { name: 'Canada', code: 'CA', phoneCode: '+1', flag: '🇨🇦' },
  { name: 'Chile', code: 'CL', phoneCode: '+56', flag: '🇨🇱' },
  { name: 'China', code: 'CN', phoneCode: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', phoneCode: '+57', flag: '🇨🇴' },
  { name: 'Croatia', code: 'HR', phoneCode: '+385', flag: '🇭🇷' },
  { name: 'Czech Republic', code: 'CZ', phoneCode: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', phoneCode: '+45', flag: '🇩🇰' },
  { name: 'Egypt', code: 'EG', phoneCode: '+20', flag: '🇪🇬' },
  { name: 'Finland', code: 'FI', phoneCode: '+358', flag: '🇫🇮' },
  { name: 'France', code: 'FR', phoneCode: '+33', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', phoneCode: '+49', flag: '🇩🇪' },
  { name: 'Greece', code: 'GR', phoneCode: '+30', flag: '🇬🇷' },
  { name: 'Hong Kong', code: 'HK', phoneCode: '+852', flag: '🇭🇰' },
  { name: 'Hungary', code: 'HU', phoneCode: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', phoneCode: '+354', flag: '🇮🇸' },
  { name: 'India', code: 'IN', phoneCode: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', phoneCode: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', phoneCode: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', phoneCode: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', phoneCode: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', phoneCode: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', phoneCode: '+39', flag: '🇮🇹' },
  { name: 'Japan', code: 'JP', phoneCode: '+81', flag: '🇯🇵' },
  { name: 'Kenya', code: 'KE', phoneCode: '+254', flag: '🇰🇪' },
  { name: 'Malaysia', code: 'MY', phoneCode: '+60', flag: '🇲🇾' },
  { name: 'Mexico', code: 'MX', phoneCode: '+52', flag: '🇲🇽' },
  { name: 'Morocco', code: 'MA', phoneCode: '+212', flag: '🇲🇦' },
  { name: 'Netherlands', code: 'NL', phoneCode: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', phoneCode: '+64', flag: '🇳🇿' },
  { name: 'Nigeria', code: 'NG', phoneCode: '+234', flag: '🇳🇬' },
  { name: 'Norway', code: 'NO', phoneCode: '+47', flag: '🇳🇴' },
  { name: 'Pakistan', code: 'PK', phoneCode: '+92', flag: '🇵🇰' },
  { name: 'Philippines', code: 'PH', phoneCode: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', phoneCode: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', phoneCode: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', phoneCode: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', phoneCode: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', phoneCode: '+7', flag: '🇷🇺' },
  { name: 'Saudi Arabia', code: 'SA', phoneCode: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', phoneCode: '+65', flag: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', phoneCode: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', phoneCode: '+82', flag: '🇰🇷' },
  { name: 'Spain', code: 'ES', phoneCode: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', phoneCode: '+94', flag: '🇱🇰' },
  { name: 'Sweden', code: 'SE', phoneCode: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', phoneCode: '+41', flag: '🇨🇭' },
  { name: 'Taiwan', code: 'TW', phoneCode: '+886', flag: '🇹🇼' },
  { name: 'Thailand', code: 'TH', phoneCode: '+66', flag: '🇹🇭' },
  { name: 'Turkey', code: 'TR', phoneCode: '+90', flag: '🇹🇷' },
  { name: 'Ukraine', code: 'UA', phoneCode: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', phoneCode: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', code: 'GB', phoneCode: '+44', flag: '🇬🇧' },
  { name: 'United States', code: 'US', phoneCode: '+1', flag: '🇺🇸' },
  { name: 'Vietnam', code: 'VN', phoneCode: '+84', flag: '🇻🇳' },
];

// Helper function to get country by name
export const getCountryByName = (name: string): Country | undefined => {
  return countries.find(c => c.name === name);
};

// Helper function to get country code by country name
export const getCountryCodeByName = (name: string): string => {
  const country = getCountryByName(name);
  return country ? country.phoneCode : '+1'; // Default to US
};

// Helper function to get country by phone code
export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return countries.find(c => c.phoneCode === phoneCode);
};

// Get all country options for dropdowns
export const getCountryOptions = () => {
  return countries.map(country => ({
    value: country.name,
    label: `${country.flag} ${country.name}`,
    phoneCode: country.phoneCode,
  }));
};

// Get all country code options for phone pickers (deduplicated by phone code)
export const getCountryCodeOptions = () => {
  const seen = new Set<string>();
  const options: Array<{ value: string; label: string; country: string }> = [];
  
  for (const country of countries) {
    if (!seen.has(country.phoneCode)) {
      seen.add(country.phoneCode);
      options.push({
        value: country.phoneCode,
        label: `${country.flag} ${country.phoneCode} (${country.code})`,
        country: country.name,
      });
    }
  }
  
  return options;
};

// Helper function to check if country uses IFSC (India) or SWIFT (others)
export const usesIFSC = (country: string): boolean => {
  return country === 'India';
};

// Helper function to get bank field label based on country
export const getBankFieldLabel = (country: string): string => {
  return usesIFSC(country) ? 'IFSC Code' : 'SWIFT Code';
};

// Helper function to get bank field placeholder based on country
export const getBankFieldPlaceholder = (country: string): string => {
  return usesIFSC(country) ? 'Enter IFSC Code' : 'Enter SWIFT Code';
};

