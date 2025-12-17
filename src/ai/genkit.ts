'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This initializes the genkit AI instance with the Google AI plugin.
// The API key will be provided directly in the fetch call,
// but this sets up the overall structure.
export const ai = genkit({
  plugins: [googleAI()],
});
