
interface Word {
  word: string;
  meanings: string[];
  meaning?: string;
  partOfSpeech?: string;
  root?: string;
  transliteration?: string;
  inflection?: string;
  semanticGroup?: string;
  frequency?: number;
  id?: string;
}

interface DataSource {
  key: string;
  value: string;
}

export type WordGroups = Record<string, Word[]>;

/**
 * Loads the available data source files for a specific language
 */
export async function loadDataSources(language: string): Promise<DataSource[]> {
  try {
    const response = await fetch(`/word-bank/${language}/files.json`);
    if (!response.ok) {
      console.error(`Failed to load data sources for ${language}: ${response.statusText}`);
      return [];
    }
    
    const datasources = await response.json();
    return Object.keys(datasources).map(key => ({
      key,
      value: datasources[key]
    }));
  } catch (error) {
    console.error(`Error loading data sources for ${language}:`, error);
    return [];
  }
}

/**
 * Loads vocabulary data from a specific file
 */
export async function loadVocabularyData(language: string, filename: string): Promise<WordGroups> {
  try {
    const response = await fetch(`/word-bank/${language}/${filename}`);
    if (!response.ok) {
      console.error(`Failed to load vocabulary data: ${response.statusText}`);
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading vocabulary data:', error);
    return {};
  }
}
