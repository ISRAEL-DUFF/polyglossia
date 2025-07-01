
'use server';
/**
 * @fileOverview A flow for generating a short story from a vocabulary list,
 * complete with scene composition instructions for canvas rendering.
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

const CharacterSchema = z.object({
    name: z.string().describe('A simple, one-word identifier for the character, e.g., "Socrates" or "Hero".'),
    spritePrompt: z.string().describe('A descriptive prompt for a text-to-image AI to generate a full-body character sprite in a simple cartoon style. **Crucially, the prompt must specify a plain, solid white background.** This is because the sprite will be layered onto another image. Example: "A cartoon ancient Greek philosopher with a beard, wearing a toga, full body, on a plain white background."'),
    position: z.object({
        x: z.number().describe('The horizontal position of the character, as a percentage from the left edge of the scene (0-100).'),
        y: z.number().describe('The vertical position of the character, as a percentage from the top edge of the scene (0-100).'),
    }).describe('The initial position of the character in the scene.'),
    scale: z.number().min(0.1).max(2.0).describe('The size of the character sprite, where 1.0 is normal size.'),
    animation: z.enum(["idle", "enter_from_left", "enter_from_right", "exit_to_left", "exit_to_right"]).describe('Animation for the character. "idle" for bobbing, "enter_from_left/right" for entering, and "exit_to_left/right" for exiting the scene.').optional(),
});

const SceneSchema = z.object({
  greekText: z.string().describe('A paragraph of the story in simple, clear Ancient Greek that incorporates at least one vocabulary word.'),
  englishTranslation: z.string().describe('A simple, clear English translation of the Greek paragraph.'),
  backgroundPrompt: z.string().describe('A descriptive prompt for a realistic background image with a painterly, slightly ancient feel, like an oil painting or historical illustration. Example: "An ancient Athenian marketplace with columns and stalls, oil painting style."'),
  characters: z.array(CharacterSchema).describe('An array of characters present in this scene. There can be zero, one, or more characters.'),
});

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('A creative and fitting title for the story in English.'),
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
  prompt: `You are a creative storyteller and language tutor specializing in Ancient Greek. Your task is to write a short, simple, and engaging story in ANCIENT GREEK for a student learning the language. The story should have an Erasmian feel to its language if possible.

The story must incorporate several of the following {{language}} vocabulary words:
{{#each vocab}}
- {{word}}{{#if meaning}}: {{meaning}}{{/if}}
{{/each}}

When you use one of the vocabulary words from the list in the 'greekText', you MUST wrap it in double asterisks. For example, if 'λόγος' is a vocabulary word, it should appear as '**λόγος**' in the generated text.

The user has provided the following theme: "{{userPrompt}}"

Please generate a story that is 3 to 5 paragraphs long. Each paragraph will be a "scene". For each scene, you must provide:
1.  'greekText': The paragraph of the story, written in simple but grammatically correct Ancient Greek. Remember to wrap the vocabulary words in double asterisks.
2.  'englishTranslation': A clear and simple English translation of the Greek text.
3.  'backgroundPrompt': A detailed prompt for a text-to-image AI to generate the background scenery.
4.  'characters': An array of characters appearing in the scene. For each character, provide:
    - 'name': A simple identifier.
    - 'spritePrompt': A prompt for an AI to generate a full-body character sprite in a simple cartoon style. **Crucially, the prompt must specify a plain, solid white background.** This is because the sprite will be layered onto another image. Example: "A cartoon ancient Greek philosopher with a beard, wearing a toga, full body, on a plain white background."
    - 'position': An {x, y} object with percentage values for placement.
    - 'scale': A float for character size (e.g., 1.0 for normal, 1.2 for larger).
    - 'animation': A simple animation. Use "idle" if the character is present and talking. Use "enter_from_left" or "enter_from_right" if they are new to the scene. Use "exit_to_left" or "exit_to_right" if they are leaving.

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
