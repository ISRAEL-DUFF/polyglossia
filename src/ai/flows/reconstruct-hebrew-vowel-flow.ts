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
  word: z.string().describe('The Biblical Hebrew word to be reconstructed, possibly with vowel points.'),
});
export type ReconstructHebrewInput = z.infer<typeof ReconstructHebrewInputSchema>;

const ReconstructHebrewOutputSchema = z.object({
  originalWord: z.string().describe('The original Biblical Hebrew word that was provided, with vowels.'),
  reconstructedForm: z.string().describe('The reconstructed Proto-Semitic form of the word, in a scholarly transliteration.'),
  reconstructedInHebrew: z.string().describe(
    "A mandatory field. This must be the Hebrew consonantal root (shoresh) of the input word, with no vowels. For example, for 'שָׁלוֹם', this field should be 'שלמ'."
  ),
  steps: z.array(z.object({
    stage: z.string().describe('The name of the historical linguistic stage or sound change, e.g., "Canaanite Shift".'),
    explanation: z.string().describe('A clear, concise explanation of the change that occurred at this stage.'),
  })).describe('A step-by-step breakdown of the transformations from the reconstructed form to the original form.'),
});
export type ReconstructHebrewOutput = z.infer<typeof ReconstructHebrewOutputSchema>;

export async function reconstructHebrewVowel(input: ReconstructHebrewInput): Promise<ReconstructHebrewOutput> {
  return reconstructHebrewVowelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reconstructHebrewVowelPrompt',
  input: {schema: ReconstructHebrewInputSchema},
  output: {schema: ReconstructHebrewOutputSchema},
  prompt: `You are an expert historical linguist specializing in the diachronic development of Semitic languages, particularly the evolution from Proto-Semitic to Biblical Hebrew.

Your task is to take a given Biblical Hebrew word and provide its reconstructed Proto-Semitic form, along with a step-by-step explanation of the sound changes that occurred.

Given the input word '{{{word}}}', you must generate a response that populates all fields in the output schema. Pay close attention to the following:

1.  **Consonantal Root**: THIS IS THE MOST IMPORTANT STEP. You must identify the consonantal root (shoresh) of the input word. This root must be placed in the 'reconstructedInHebrew' field. This field is mandatory and must not be empty. For example, if the input is 'שָׁלוֹם', the root is 'שלמ'.

2.  **Proto-Semitic Form**: After identifying the root, reconstruct the most likely Proto-Semitic form of the word. Provide this as a scholarly transliteration in the 'reconstructedForm' field.

3.  **Transformation Steps**: Detail the series of recognized sound changes that explain the evolution from your reconstructed Proto-Semitic form to the provided Biblical Hebrew form. Populate the 'steps' array with these transformations. Examples of stages include "Proto-Semitic Base", "Loss of final short vowels", "Canaanite Shift (ā > ō)", "Vowel Reduction", etc.

Ensure your final output is a valid JSON object matching the required schema. The 'reconstructedInHebrew' field MUST be correctly populated.`,
});

const reconstructHebrewVowelFlow = ai.defineFlow(
  {
    name: 'reconstructHebrewVowelFlow',
    inputSchema: ReconstructHebrewInputSchema,
    outputSchema: ReconstructHebrewOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
