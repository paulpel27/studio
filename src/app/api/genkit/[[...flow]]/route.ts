import { createNextHandler } from '@genkit-ai/next';
import '@/ai/flows/query-vector-database-and-generate-response';
import '@/ai/flows/extract-text-from-pdf-flow';

// This is the crucial configuration to increase the body size limit for this API route.
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export const POST = createNextHandler();
