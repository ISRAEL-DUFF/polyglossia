'use server';
/**
 * @fileOverview A flow for converting speech to text.
 *
 * - speechToText - A function that handles the Speech-to-Text process.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of spoken audio, as a data URI that must include a MIME type (like 'audio/webm' or 'audio/ogg') and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  context: z.string().describe('The original text the user was trying to say, to provide context for the model.').optional(),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const sttPrompt = ai.definePrompt({
    name: 'speechToTextPrompt',
    input: {schema: SpeechToTextInputSchema},
    output: {schema: SpeechToTextOutputSchema},
    prompt: `You are a highly accurate speech-to-text transcription service.
    
Transcribe the audio provided. The audio is in Ancient Greek. 
The expected text is '{{context}}'. Please provide the most accurate transcription of the spoken audio.

Audio for transcription: {{media url=audioDataUri}}`,
});


const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    const {output} = await sttPrompt(input);
    if (!output) {
      throw new Error('AI failed to transcribe the audio.');
    }
    return output;
  }
);
