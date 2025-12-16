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
  fileContents: z.array(z.string()).describe('An array of file contents to use as context.'),
  model: z.string().describe('The AI model to use for generating the response.'),
});
export type QueryVectorDatabaseAndGenerateResponseInput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseInputSchema>;

const QueryVectorDatabaseAndGenerateResponseOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type QueryVectorDatabaseAndGenerateResponseOutput = z.infer<typeof QueryVectorDatabaseAndGenerateResponseOutputSchema>;

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
    const modelName = input.model.startsWith('googleai/') ? input.model : `googleai/${input.model}`;
    const {output} = await ai.generate({
      model: modelName,
      prompt: `You are a helpful AI assistant that answers questions based on the provided document excerpts.

      Use the following document excerpts as context to answer the question.
      
      Context:
      ---
      {{#each fileContents}}
      {{this}}
      ---
      {{/each}}
      
      Question: {{query}}`,
      context: {
        fileContents: input.fileContents,
        query: input.query,
      },
    });

    return { response: output.text };
  }
);
