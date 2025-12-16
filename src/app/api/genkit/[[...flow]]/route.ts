import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {NextRequest} from 'next/server';
import {createNextHandler} from '@genkit-ai/next';

import '@/ai/flows/query-vector-database-and-generate-response';
import '@/ai/flows/extract-text-from-pdf-flow';

export const POST = createNextHandler();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};
