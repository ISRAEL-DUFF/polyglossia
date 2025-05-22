export const LANGUAGES = ['Ancient Greek', 'Hebrew', 'Latin'] as const;
export type Language = typeof LANGUAGES[number];
