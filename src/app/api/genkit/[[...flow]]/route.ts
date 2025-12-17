import { createNextHandler } from '@genkit-ai/next';
import '@/ai/flows/query-vector-database-and-generate-response';
import '@/ai/flows/extract-text-from-pdf-flow';

export const POST = createNextHandler();

// Increase the body size limit to handle large file uploads (e.g., PDFs).
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};
