// 1er juin 2018 : début de l'alternance chez Supralog, suivie d'un parcours continu.
// Le mois est indexé à partir de 0 (5 = juin).
export const CAREER_START_DATE = new Date(2018, 5, 1);

export function getFullYearsSince(start: Date, now: Date = new Date()): number {
  const years = now.getFullYear() - start.getFullYear();
  const anniversaryReached =
    now.getMonth() > start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());

  return Math.max(0, anniversaryReached ? years : years - 1);
}

export function getYearsOfExperience(now: Date = new Date()): number {
  return getFullYearsSince(CAREER_START_DATE, now);
}
