// Pure logica voor de vraagschermen (zonder React), zodat die los te testen is.

type Answers = Record<string, unknown>;

/** Waarde van de optie "Geen" bij meerkeuzevragen: sluit de andere keuzes uit. */
export const NONE = 'none' as const;

export interface FlowOption {
  value: string | number | boolean;
  label: string;
}

export interface FlowQuestion {
  key: string;
  topic: string;
  title: string;
  help?: string;
  /** Meerkeuze: antwoord is een lijst; [] betekent "Geen". */
  multi?: boolean;
  options: FlowOption[];
}


/** Nummer (1-based) van de eerste onbeantwoorde vraag, of null als alles is ingevuld. */
export function firstOpenQuestion(questions: FlowQuestion[], answers: Answers): number | null {
  const i = questions.findIndex((q) => answers[q.key] === null || answers[q.key] === undefined);
  return i === -1 ? null : i + 1;
}

/** Meerkeuze met "Geen": "Geen" wist de rest, een andere keuze haalt "Geen" weg. */
export function toggleMulti<T extends string>(current: T[], value: T | typeof NONE, noneSelected: boolean): { values: T[]; none: boolean } {
  if (value === NONE) return { values: [], none: !noneSelected };
  const values = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { values, none: false };
}

/** Label van een antwoord, voor overzichten. */
export function optionLabel(question: FlowQuestion, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Geen';
    return value.map((v) => question.options.find((o) => o.value === v)?.label ?? String(v)).join(', ');
  }
  return question.options.find((o) => o.value === value)?.label ?? String(value);
}

