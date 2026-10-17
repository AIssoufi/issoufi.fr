const MONTH_NAMES: Record<string, number> = {
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
  // English
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
  dec: 11,
  december: 11,
};

function parseDate(str: string): Date {
  const s = str.trim().toLowerCase();
  if (
    s === "aujourd'hui" ||
    s === 'auj.' ||
    s === 'auj' ||
    s === 'present' ||
    s === 'today' ||
    s === 'pres.'
  ) {
    return new Date();
  }
  const [rawMonth, rawYear] = s.split(' ');
  const monthKey = rawMonth.replace('.', '');
  const month = MONTH_NAMES[monthKey] ?? 0;
  return new Date(parseInt(rawYear, 10), month, 1);
}

export function computeDuration(startDate: string, endDate: string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mois`);
  return parts.join(' ') || '< 1 mois';
}
