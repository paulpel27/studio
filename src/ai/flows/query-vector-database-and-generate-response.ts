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

const QueryVectorDatabaseAndGenerateResponseInputSchema = z.object({
  query: z.string().describe('The user query to be answered using the vector database.'),
  apiKey: z.string().describe('The Google AI API key.'),
  modelName: z.string().describe('The Google AI model name.'),
});
export type QueryVectorDatabaseAndGenerateResponseInput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseInputSchema>;

const QueryVectorDatabaseAndGenerateResponseOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type QueryVectorDatabaseAndGenerateResponseOutput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseOutputSchema>;

export async function queryVectorDatabaseAndGenerateResponse(input: QueryVectorDatabaseAndGenerateResponseInput): Promise<QueryVectorDatabaseAndGenerateResponseOutput> {
  return queryVectorDatabaseAndGenerateResponseFlow(input);
}

const queryVectorDatabaseAndGenerateResponsePrompt = ai.definePrompt({
  name: 'queryVectorDatabaseAndGenerateResponsePrompt',
  input: {schema: QueryVectorDatabaseAndGenerateResponseInputSchema},
  output: {schema: QueryVectorDatabaseAndGenerateResponseOutputSchema},
  prompt: `You are a helpful AI assistant that answers questions based on the content of a vector database.

  Answer the following question:
  {{query}}`,
  model: `{{{modelName}}}`,
  config: {
    apiKey: `{{{apiKey}}}`,
  }
});

const queryVectorDatabaseAndGenerateResponseFlow = ai.defineFlow(
  {
    name: 'queryVectorDatabaseAndGenerateResponseFlow',
    inputSchema: QueryVectorDatabaseAndGenerateResponseInputSchema,
    outputSchema: QueryVectorDatabaseAndGenerateResponseOutputSchema,
  },
  async input => {
    const {output} = await queryVectorDatabaseAndGenerateResponsePrompt(input);
    return output!;
  }
);
