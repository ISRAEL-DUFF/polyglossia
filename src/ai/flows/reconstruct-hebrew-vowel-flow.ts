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
  reconstructedInHebrew: z.string().describe('A hypothetical representation of the reconstructed Proto-Semitic form using Hebrew consonantal script (unpointed).'),
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

Follow these instructions precisely:
1.  **Analyze the Input**: Examine the provided Biblical Hebrew word: '{{{word}}}'.
2.  **Determine Proto-Semitic Form**: Based on your linguistic knowledge, reconstruct the most likely Proto-Semitic form of the word. This MUST be a scholarly transliteration in the 'reconstructedForm' field.
3.  **Provide Hebrew Script Representation**: Generate a hypothetical representation of the reconstructed Proto-Semitic form using only Hebrew consonants (no vowel points) and populate it into the 'reconstructedInHebrew' field. This field MUST NOT be empty. This should correspond to the consonantal root of the word.
4.  **Detail Transformation Steps**: Create a series of steps that explain the evolution from your reconstructed Proto-Semitic form to the provided Biblical Hebrew form. Each step should represent a major, recognized sound change. Examples of stages include:
    *   "Proto-Semitic Base"
    *   "Loss of final short vowels"
    *   "Canaanite Shift (ā > ō)"
    *   "Monophthongization (aw > ō, ay > ē)"
    *   "Vowel Reduction in open pretonic syllables"
    *   "Compensatory Lengthening"
    *   "Development of shewa"

For each step, provide a clear and concise explanation. The goal is to educate the user on how the word transformed over time. Ensure the final output is in the specified JSON format and that ALL fields are populated correctly.`,
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
