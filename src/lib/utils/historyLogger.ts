
'use client';

import type { Language as AppLanguage } from '@/types'; // Assuming Language type exists

// Define a more specific type for the language prop if needed, or use string
type HistoryLanguage = 'greek' | 'hebrew' | 'latin' | AppLanguage;

// const API_BASE_URL = 'https://www.eazilang.gleeze.com/api';
const API_BASE_URL = 'http://localhost:3001';

interface LogEntryPayload {
  word: string;
  lemma: string;
  namespace: string;
  language: HistoryLanguage;
}

interface LogHistoryResponse {
  success: boolean;
  message?: string;
  entry?: any; // Define more strictly if needed
}

export async function logHistoryEntry(payload: LogEntryPayload): Promise<LogHistoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/lookup-history/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: payload.word,
        lemma: payload.lemma,
        namespace: payload.namespace,
        language: payload.language
        // Language is part of the URL, but can be included if backend expects it
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to log history entry. Status: ${response.status}` }));
      console.error('Failed to log history entry:', errorData.message || response.statusText);
      return { success: false, message: errorData.message || `HTTP error ${response.status}` };
    }
    
    const result = await response.json();
    return { success: true, message: "Entry logged successfully", entry: result };

  } catch (error) {
    console.error('Error logging history entry:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message };
  }
}
