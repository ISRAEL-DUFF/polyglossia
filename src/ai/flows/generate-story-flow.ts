'use server';
/**
 * @fileOverview A flow for generating a short story from a vocabulary list.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VocabWordSchema = z.object({
  word: z.string().describe('The vocabulary word in its original language.'),
  meaning: z.string().describe('The English meaning of the word.').optional(),
});

const GenerateStoryInputSchema = z.object({
  vocab: z.array(VocabWordSchema).describe('A list of vocabulary words to incorporate into the story.'),
  userPrompt: z.string().describe('A prompt from the user outlining the desired theme or plot of the story.'),
  language: z.string().describe('The language of the vocabulary (e.g., Greek, Hebrew, Latin).'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;


const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('A creative and fitting title for the story in English.'),
  greekText: z.string().describe('The full story, written in simple, clear Ancient Greek that incorporates at least one vocabulary word. Should be a few paragraphs long.'),
  englishTranslation: z.string().describe('A simple, clear English translation of the full Greek story.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;


export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a creative storyteller and language tutor specializing in Ancient Greek. Your task is to write a short, simple, and engaging story in ANCIENT GREEK for a student learning the language. The story should have an Erasmian feel to its language if possible.

The story must incorporate several of the following {{language}} vocabulary words:
{{#each vocab}}
- {{word}}{{#if meaning}}: {{meaning}}{{/if}}
{{/each}}

When you use one of the vocabulary words from the list in the 'greekText', you MUST wrap it in double asterisks. For example, if 'λόγος' is a vocabulary word, it should appear as '**λόγος**' in the generated text.

The user has provided the following theme: "{{userPrompt}}"

Please generate:
1.  'title': A creative title for the story in English.
2.  'greekText': The full story as a single block of text (a few paragraphs long).
3.  'englishTranslation': A clear and simple English translation of the entire story.

The entire response must be a valid JSON object that adheres to the output schema.
`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async (input) => {
    const {output} = await storyPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a story.');
    }
    return output;
  }
);
