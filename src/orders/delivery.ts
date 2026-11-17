// Leverbeloftes van XXL Nutrition (projectbrief, sectie "Bestellingen"):
// - vóór 22:00 besteld op een werkdag (ma–vr) = vandaag verzonden
// - thuisbezorging 6 dagen per week (geen bezorging op zondag; nog te controleren)
// - bezorgd op de eerstvolgende bezorgdag na verzending
// Alles wordt gerekend in Nederlandse tijd (Europe/Amsterdam), ook als de telefoon anders staat ingesteld.
// Feestdagen zitten er (nog) niet in.

export const TIME_ZONE = 'Europe/Amsterdam';
export const CUTOFF_HOUR = 22;

/** Een kalenderdag zonder tijd, bijv. "2026-11-18". */
export type IsoDate = string;

interface LocalParts {
  date: IsoDate;
  weekday: number; // 0 = zondag … 6 = zaterdag
  hour: number;
  minute: number;
}

/** Datum, weekdag en tijd in Nederland op moment `at`. */
export function amsterdamParts(at: Date): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: weekdays.indexOf(parts.weekday),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Dag erbij optellen, puur als kalenderdatum. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: IsoDate): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

const isWorkday = (weekday: number) => weekday >= 1 && weekday <= 5; // ma–vr: verzenddagen
const isDeliveryDay = (weekday: number) => weekday !== 0; // ma–za: bezorgdagen

/** Verzenddag: vandaag als het een werkdag is en vóór 22:00, anders de eerstvolgende werkdag. */
export function shipDate(orderedAt: Date): IsoDate {
  const { date, weekday, hour } = amsterdamParts(orderedAt);
  if (isWorkday(weekday) && hour < CUTOFF_HOUR) return date;
  let d = addDays(date, 1);
  while (!isWorkday(weekdayOf(d))) d = addDays(d, 1);
  return d;
}

/** Verwachte bezorgdag: de eerstvolgende bezorgdag (ma–za) na de verzenddag. */
export function expectedDelivery(orderedAt: Date): IsoDate {
  let d = addDays(shipDate(orderedAt), 1);
  while (!isDeliveryDay(weekdayOf(d))) d = addDays(d, 1);
  return d;
}

/** "donderdag 20 november" */
export function formatDayLong(date: IsoDate): string {
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

/** "17 november 2026" */
export function formatDate(at: Date | IsoDate): string {
  const d = typeof at === 'string' ? new Date(`${at}T12:00:00Z`) : at;
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: typeof at === 'string' ? 'UTC' : TIME_ZONE }).format(d);
}

/** "Morgen" / "Vandaag" / "donderdag 20 november", gezien vanaf `now`. */
export function relativeDay(date: IsoDate, now: Date): string {
  const today = amsterdamParts(now).date;
  if (date === today) return 'vandaag';
  if (date === addDays(today, 1)) return 'morgen';
  return formatDayLong(date);
}

/**
 * Tijdstip dat het in Nederland `hour`:00 is op `date`, rekening houdend met zomer-/wintertijd.
 * Bedoeld voor uren van 2 tot 23 (wij gebruiken 8–22).
 */
export function amsterdamTime(date: IsoDate, hour: number): Date {
  for (const offset of [1, 2]) {
    const candidate = new Date(`${date}T${String(hour - offset).padStart(2, '0')}:00:00Z`);
    const p = amsterdamParts(candidate);
    if (p.date === date && p.hour === hour) return candidate;
  }
  throw new Error(`Geen geldig tijdstip: ${date} ${hour}:00`);
}
