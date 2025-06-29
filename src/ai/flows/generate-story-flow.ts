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
  meaning: z.string().describe('The English meaning of the word.'),
});

const GenerateStoryInputSchema = z.object({
  vocab: z.array(VocabWordSchema).describe('A list of vocabulary words to incorporate into the story.'),
  userPrompt: z.string().describe('A prompt from the user outlining the desired theme or plot of the story.'),
  language: z.string().describe('The language of the vocabulary (e.g., Greek, Hebrew, Latin).'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const SceneSchema = z.object({
  text: z.string().describe('A paragraph of the story. It should be in simple, clear English and must incorporate at least one of the provided vocabulary words. The story should be engaging for a language learner.'),
  imagePrompt: z.string().describe('A simple, descriptive prompt for an image that visually represents this paragraph. The prompt should be suitable for a text-to-image AI model. Example: "A scholar sitting under an olive tree reading a scroll."'),
});

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('A creative and fitting title for the story.'),
  scenes: z.array(SceneSchema).describe('An array of scenes that make up the story, between 3 to 5 scenes long.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a creative storyteller and language tutor. Your task is to write a short, simple, and engaging story in English for a student learning {{language}}.

The story must incorporate several of the following vocabulary words:
{{#each vocab}}
- {{word}}: {{meaning}}
{{/each}}

The user has provided the following theme: "{{userPrompt}}"

Please generate a story that is 3 to 5 paragraphs long. Each paragraph will be a "scene". For each scene, you must provide:
1.  'text': The paragraph of the story. Make the story easy to understand for a language learner.
2.  'imagePrompt': A simple, descriptive prompt for a text-to-image AI model that illustrates the scene.

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
