
'use server';

/**
 * @fileOverview AI agent for morphological analysis of ancient languages.
 *
 * - analyzeMorphology - A function that handles the morphological analysis process.
 * - MorphologicalAnalysisInput - The input type for the analyzeMorphology function.
 * - MorphologicalAnalysisOutput - The return type for the analyzeMorphology function.
 * - WordAnalysis - The schema for a single word's analysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MorphologicalAnalysisInputSchema = z.object({
  text: z.string().describe('The text or word(s) to analyze morphologically.'),
  language: z
    .enum(['Ancient Greek', 'Hebrew', 'Latin'])
    .describe('The language of the text.'),
});
export type MorphologicalAnalysisInput = z.infer<
  typeof MorphologicalAnalysisInputSchema
>;

const WordAnalysisSchema = z.object({
  word: z.string().describe('The original word from the input text.'),
  lemma: z.string().describe('The dictionary form (lemma) of the word.'),
  partOfSpeech: z.string().describe('The part of speech of the word (e.g., Noun, Verb, Adjective).'),
  morphology: z.array(z.object({
    feature: z.string().describe('Morphological feature (e.g., Tense, Mood, Case, Gender, Number, Person).'),
    value: z.string().describe('Value of the morphological feature (e.g., Present, Indicative, Nominative, Masculine, Singular, 1st).')
  })).describe('Detailed morphological breakdown of the word.'),
  definitions: z.array(z.string()).describe('Possible definitions or lexical entries for the word in English.'),
});
export type WordAnalysis = z.infer<typeof WordAnalysisSchema>;

const MorphologicalAnalysisOutputSchema = z.object({
  analyzedWords: z.array(WordAnalysisSchema).describe('An array containing the morphological analysis and lexical information for each word in the input text.'),
});
export type MorphologicalAnalysisOutput = z.infer<
  typeof MorphologicalAnalysisOutputSchema
>;

export async function analyzeMorphology(
  input: MorphologicalAnalysisInput
): Promise<MorphologicalAnalysisOutput> {
  return analyzeMorphologyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'morphologicalAnalysisPrompt',
  input: {schema: MorphologicalAnalysisInputSchema},
  output: {schema: MorphologicalAnalysisOutputSchema},
  prompt: `You are an expert in ancient languages, specifically {{{language}}}.
For the given text: "{{{text}}}", provide a detailed morphological analysis and lexical information for each word.

For each word, return:
1. The original word ('word').
2. Its lemma (dictionary form) ('lemma').
3. Its part of speech ('partOfSpeech').
4. A detailed morphological breakdown as an array of feature-value pairs ('morphology'). Features may include:
    - For Nouns/Adjectives/Pronouns: Case, Number, Gender.
    - For Verbs: Tense, Voice, Mood, Person, Number.
    - For Particles/Conjunctions/Prepositions: Specify type if applicable.
5. An array of possible definitions or lexical entries for the word in English ('definitions').

Ensure your output strictly adheres to the JSON schema provided for 'analyzedWords'.
`,
});

const analyzeMorphologyFlow = ai.defineFlow(
  {
    name: 'analyzeMorphologyFlow',
    inputSchema: MorphologicalAnalysisInputSchema,
    outputSchema: MorphologicalAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI did not return a valid analysis.');
    }
    return output;
  }
);

