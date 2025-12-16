import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // The model must be specified on a per-generation call basis.
  // model: 'googleai/gemini-2.5-flash',
});
