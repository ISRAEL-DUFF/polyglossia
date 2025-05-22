'use server';

/**
 * @fileOverview AI agent for morphological analysis of ancient languages.
 *
 * - analyzeMorphology - A function that handles the morphological analysis process.
 * - MorphologicalAnalysisInput - The input type for the analyzeMorphology function.
 * - MorphologicalAnalysisOutput - The return type for the analyzeMorphology function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MorphologicalAnalysisInputSchema = z.object({
  text: z.string().describe('The text to analyze morphologically.'),
  language: z
    .enum(['Ancient Greek', 'Hebrew', 'Latin'])
    .describe('The language of the text.'),
});
export type MorphologicalAnalysisInput = z.infer<
  typeof MorphologicalAnalysisInputSchema
>;

const MorphologicalAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A detailed morphological analysis of the text, including part-of-speech tagging and parsing.'
    ),
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
  prompt: `You are an expert in ancient languages, including Ancient Greek, Hebrew, and Latin.

You will receive a passage of text in one of these languages, and you will provide a detailed morphological analysis.
This analysis should include part-of-speech tagging and parsing to aid in understanding the grammatical structure and meaning of the text.

Language: {{{language}}}
Text: {{{text}}}

Provide your analysis:
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
    return output!;
  }
);
