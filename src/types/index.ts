export const LANGUAGES = ['Ancient Greek', 'Hebrew', 'Latin'] as const;
export type Language = typeof LANGUAGES[number];

export interface NamespaceEntry {
  namespace: string;
  count: string; // Assuming count is still a string based on previous structure
  vocabCount?: string;
}
