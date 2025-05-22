// This is an AI-powered tool for translating passages into modern English, offering suggestions and alternative renderings of particular words or phrases.
// It must display a disclaimer that it's not meant to be authoritative.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslationAssistanceInputSchema = z.object({
  text: z.string().describe('The text to translate, which should be in either Ancient Greek, Hebrew, or Latin.'),
  language: z.enum(['Ancient Greek', 'Hebrew', 'Latin']).describe('The language of the text.'),
});

export type TranslationAssistanceInput = z.infer<typeof TranslationAssistanceInputSchema>;

const TranslationAssistanceOutputSchema = z.object({
  translation: z.string().describe('The translated text in modern English, with suggestions and alternative renderings.'),
  disclaimer: z
    .string()
    .describe('A disclaimer stating that the translation is not authoritative and is provided without warranty.'),
});

export type TranslationAssistanceOutput = z.infer<typeof TranslationAssistanceOutputSchema>;

export async function getTranslation(input: TranslationAssistanceInput): Promise<TranslationAssistanceOutput> {
  return translationAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translationAssistancePrompt',
  input: {
    schema: TranslationAssistanceInputSchema,
  },
  output: {
    schema: TranslationAssistanceOutputSchema,
  },
  prompt: `You are a translation assistant, skilled in translating Ancient Greek, Hebrew, and Latin into modern English.

  Translate the following text into modern English, providing suggestions and alternative renderings for specific words or phrases where appropriate.

  Language: {{{language}}}
  Text: {{{text}}}

  Include a disclaimer stating that the translation is not authoritative and is provided without warranty.
  `,
});

const translationAssistanceFlow = ai.defineFlow(
  {
    name: 'translationAssistanceFlow',
    inputSchema: TranslationAssistanceInputSchema,
    outputSchema: TranslationAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
