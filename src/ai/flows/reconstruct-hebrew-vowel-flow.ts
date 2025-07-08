'use server';
/**
 * @fileOverview An AI agent for historical Hebrew vowel reconstruction.
 *
 * - reconstructHebrewVowel - A function that handles the reconstruction process.
 * - ReconstructHebrewInput - The input type for the reconstructHebrewVowel function.
 * - ReconstructHebrewOutput - The return type for the reconstructHebrewVowel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReconstructHebrewInputSchema = z.object({
  word: z
    .string()
    .describe(
      'The Biblical Hebrew word to be reconstructed, possibly with vowel points.'
    ),
});
export type ReconstructHebrewInput = z.infer<
  typeof ReconstructHebrewInputSchema
>;

const ReconstructHebrewOutputSchema = z.object({
  originalWord: z
    .string()
    .describe(
      'The original Biblical Hebrew word that was provided, with vowels.'
    ),
  reconstructedForm: z
    .string()
    .describe(
      'The reconstructed Proto-Semitic form of the word, in a scholarly transliteration.'
    ),
  reconstructedInHebrew: z
    .string()
    .describe(
      "A mandatory field. This must be the Hebrew consonantal root (shoresh) of the input word, with no vowels. For example, for 'שָׁלוֹם', this field should be 'שלמ'."
    ),
  explanation: z
    .string()
    .describe(
      'A concise explanation of the transformations from the reconstructed form to the original form, covering the key sound changes.'
    ),
});
export type ReconstructHebrewOutput = z.infer<
  typeof ReconstructHebrewOutputSchema
>;

export async function reconstructHebrewVowel(
  input: ReconstructHebrewInput
): Promise<ReconstructHebrewOutput> {
  return reconstructHebrewVowelFlow(input);
}

// A more focused schema for the main analysis prompt
const AnalysisSchema = z.object({
  originalWord: z.string(),
  reconstructedForm: z.string(),
  explanation: z
    .string()
    .describe(
      'A clear, single-paragraph explanation of the key historical sound changes (like the Canaanite Shift, vowel reduction, etc.) that transformed the reconstructed form into the Biblical Hebrew word.'
    ),
});

const analysisPrompt = ai.definePrompt({
  name: 'reconstructHebrewVowelAnalysisPrompt',
  input: {schema: ReconstructHebrewInputSchema},
  output: {schema: AnalysisSchema},
  prompt: `You are an expert historical linguist specializing in the diachronic development of Semitic languages, particularly the evolution from Proto-Semitic to Biblical Hebrew.

Your task is to take a given Biblical Hebrew word and provide a response that populates all fields in the output schema.

Given the input word '{{{word}}}', you must generate:

1.  **originalWord**: The word exactly as it was provided, including all vowel points and diacritics.
2.  **reconstructedForm**: The most likely reconstructed Proto-Semitic form of the word, as a scholarly transliteration.
3.  **explanation**: A clear, single-paragraph explanation of the key historical sound changes (like the Canaanite Shift, vowel reduction, etc.) that transformed the reconstructed form into the Biblical Hebrew word.

Ensure your final output is a valid JSON object matching the required schema.`,
});

const rootPrompt = ai.definePrompt({
  name: 'extractHebrewRootPrompt',
  input: {schema: ReconstructHebrewInputSchema},
  output: {
    schema: z.object({
      root: z.string().describe('The Hebrew consonantal root (shoresh).'),
    }),
  },
  prompt: `You are an expert in Hebrew morphology. Given the word '{{{word}}}', provide its consonantal root (shoresh). Provide only the Hebrew letters of the root.`,
});

const reconstructHebrewVowelFlow = ai.defineFlow(
  {
    name: 'reconstructHebrewVowelFlow',
    inputSchema: ReconstructHebrewInputSchema,
    outputSchema: ReconstructHebrewOutputSchema,
  },
  async (input) => {
    // Run both prompts in parallel for efficiency
    const [{output: analysis}, {output: rootExtraction}] = await Promise.all([
      analysisPrompt(input),
      rootPrompt(input),
    ]);

    if (!analysis || !rootExtraction) {
      throw new Error('AI analysis or root extraction failed.');
    }

    // Combine the results from both AI calls
    return {
      originalWord: analysis.originalWord,
      reconstructedForm: analysis.reconstructedForm,
      explanation: analysis.explanation,
      reconstructedInHebrew: rootExtraction.root,
    };
  }
);
