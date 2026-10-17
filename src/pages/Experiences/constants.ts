/** Zero-based month index of each French and English month name or abbreviation, lowercase. */
export const MONTH_NAMES: Record<string, number> = {
  // French
  janv: 0,
  janvier: 0,
  févr: 1,
  février: 1,
  mars: 2,
  avr: 3,
  avril: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  juillet: 6,
  août: 7,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  déc: 11,
  décembre: 11,
  // English (oct and nov are shared with French)
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  october: 9,
  november: 10,
  dec: 11,
  december: 11,
};

/** End-date words meaning "until now", lowercase, in French and English. */
export const TODAY_KEYWORDS = new Set(["aujourd'hui", 'auj.', 'auj', 'present', 'pres.', 'today']);

/** Number of months in a year, to split a month count into years and months. */
export const MONTHS_PER_YEAR = 12;

/** A year written with exactly four digits, e.g. "2021". */
export const YEAR_PATTERN = /^\d{4}$/;
