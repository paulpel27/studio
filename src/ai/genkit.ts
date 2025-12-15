import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {NextRequest} from 'next/server';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: async () => {
        const req = await (globalThis as any).__request;
        return req.headers.get('x-google-api-key') || process.env.GEMINI_API_KEY;
      },
    }),
  ],
  // The model must be specified on a per-generation call basis.
  // model: 'googleai/gemini-2.5-flash',
});
