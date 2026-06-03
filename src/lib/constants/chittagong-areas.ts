export const CHITTAGONG_AREAS = [
  "Akbar Shah",
  "Bakalia",
  "Bandar",
  "Bayezid Bostami",
  "Chandgaon",
  "Chawkbazar",
  "Double Mooring",
  "EPZ",
  "Halishahar",
  "Karnaphuli",
  "Khulshi",
  "Kotwali",
  "Pahartali",
  "Panchlaish",
  "Patenga",
  "Sadarghat",
] as const;

export type ChittagongArea = (typeof CHITTAGONG_AREAS)[number];
