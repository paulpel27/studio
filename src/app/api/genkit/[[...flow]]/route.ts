import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {NextRequest} from 'next/server';
import {createNextHandler} from '@genkit-ai/next';

import '@/ai/flows/query-vector-database-and-generate-response';

export const POST = createNextHandler();
