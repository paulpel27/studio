'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying a vector database and generating a response.
 *
 * - queryVectorDatabaseAndGenerateResponse - A function that takes a user query and returns an AI-generated response based on the content of the vector database.
 * - QueryVectorDatabaseAndGenerateResponseInput - The input type for the queryVectorDatabaseAndGenerateResponse function.
 * - QueryVectorDatabaseAndGenerateResponseOutput - The return type for the queryVectorDatabaseAndGenerateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const QueryVectorDatabaseAndGenerateResponseInputSchema = z.object({
  query: z.string().describe('The user query to be answered using the vector database.'),
  fileContents: z.array(z.string()).describe('An array of file contents to use as context.'),
  model: z.string().describe('The AI model to use for generating the response.'),
  apiKey: z.string().describe('The Google AI API key.'),
});
export type QueryVectorDatabaseAndGenerateResponseInput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseInputSchema>;

const QueryVectorDatabaseAndGenerateResponseOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type QueryVectorDatabaseAndGenerateResponseOutput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseOutputSchema>;

const qaPrompt = ai.definePrompt({
    name: 'qaPrompt',
    input: {
        schema: z.object({
            query: z.string(),
            fileContents: z.array(z.string()),
        })
    },
    output: {
        format: 'text'
    },
    prompt: `You are a helpful AI assistant that answers questions based on the provided document excerpts.

    Use the following document excerpts as context to answer the question. If the answer is not found in the excerpts, say "I could not find an answer in the provided documents." Do not make up information.
    
    Context:
    ---
    {{#each fileContents}}
    {{this}}
    ---
    {{/each}}
    
    Question: {{query}}`,
});


export async function queryVectorDatabaseAndGenerateResponse(input: QueryVectorDatabaseAndGenerateResponseInput): Promise<QueryVectorDatabaseAndGenerateResponseOutput> {
  return queryVectorDatabaseAndGenerateResponseFlow(input);
}

const queryVectorDatabaseAndGenerateResponseFlow = ai.defineFlow(
  {
    name: 'queryVectorDatabaseAndGenerateResponseFlow',
    inputSchema: QueryVectorDatabaseAndGenerateResponseInputSchema,
    outputSchema: QueryVectorDatabaseAndGenerateResponseOutputSchema,
  },
  async input => {
    // Dynamically create the Google AI plugin with the provided API key.
    const dynamicGoogleAI = googleAI({ apiKey: input.apiKey });
    const modelName = input.model.startsWith('gemini') ? input.model : `gemini-1.5-flash-latest`;

    const { output } = await ai.generate({
      prompt: {
        text: `You are a helpful AI assistant that answers questions based on the provided document excerpts.
    
        Use the following document excerpts as context to answer the question. If the answer is not found in the excerpts, say "I could not find an answer in the provided documents." Do not make up information.
        
        Context:
        ---
        ${input.fileContents.join('\n---\n')}
        
        Question: ${input.query}`
      },
      model: dynamicGoogleAI.model(modelName),
      stream: false,
    });

    if (!output || !output.text) {
      throw new Error('AI failed to generate a response.');
    }

    return { response: output.text };
  }
);