'use server';

/**
 * @fileOverview A Genkit flow for intelligently extracting and chunking text from a PDF file.
 *
 * - extractTextFromPdfFlow - The main flow function.
 * - ExtractTextFromPdfInput - The input type for the flow.
 * - ExtractTextFromPdfOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractTextFromPdfInputSchema = z.object({
  pdfBase64: z.string().describe('The base64 encoded content of the PDF file.'),
  model: z.string().describe('The AI model to use for processing.'),
  apiKey: z.string().describe('The Google AI API key.'),
});
export type ExtractTextFromPdfInput = z.infer<typeof ExtractTextFromPdfInputSchema>;

const ExtractTextFromPdfOutputSchema = z.object({
  chunks: z.array(z.string()).describe('An array of text chunks extracted from the PDF.'),
});
export type ExtractTextFromPdfOutput = z.infer<typeof ExtractTextFromPdfOutputSchema>;


const chunkingPrompt = ai.definePrompt({
    name: 'chunkingPrompt',
    input: {
        schema: z.object({
            pdfBase64: z.string(),
        })
    },
    output: {
        schema: ExtractTextFromPdfOutputSchema,
    },
    prompt: `You are an expert at processing documents. Your task is to extract text from the provided PDF file and break it down into smaller, meaningful chunks.

    Guidelines:
    1.  Extract all text content from the PDF.
    2.  Split the extracted text into chunks of approximately 1500 characters each.
    3.  Ensure an overlap of about 200 characters between consecutive chunks to maintain context.
    4.  Preserve the original formatting and structure as much as possible within each chunk.
    5.  Return the result as a structured JSON object with a "chunks" array.
    
    PDF File: {{media url=(concat "data:application/pdf;base64," pdfBase64)}}`,
});


const extractTextFromPdfFlowInternal = ai.defineFlow(
  {
    name: 'extractTextFromPdfFlowInternal',
    inputSchema: ExtractTextFromPdfInputSchema,
    outputSchema: ExtractTextFromPdfOutputSchema,
  },
  async (input) => {
    const modelName = input.model.startsWith('googleai/') ? input.model : `googleai/${input.model}`;
    
    const { output } = await ai.generate({
        model: modelName,
        config: {
            apiKey: input.apiKey,
        },
        prompt: await chunkingPrompt.render({ input: { pdfBase64: input.pdfBase64 } }),
        output: {
            format: 'json',
            schema: ExtractTextFromPdfOutputSchema
        }
    });

    if (!output) {
      throw new Error('AI failed to generate a response for text extraction.');
    }
    
    return output;
  }
);


export async function extractTextFromPdfFlow(input: ExtractTextFromPdfInput): Promise<ExtractTextFromPdfOutput> {
    return extractTextFromPdfFlowInternal(input);
}
