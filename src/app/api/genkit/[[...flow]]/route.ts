import { createNextHandler } from '@genkit-ai/next';
import '@/ai/flows/query-vector-database-and-generate-response';
import '@/ai/flows/extract-text-from-pdf-flow';

export const POST = createNextHandler();
