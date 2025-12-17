'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying a vector database and generating a response.
 *
 * - queryVectorDatabaseAndGenerateResponse - A function that takes a user query and returns an AI-generated response based on the content of the vector database.
 * - QueryVectorDatabaseAndGenerateResponseInput - The input type for the queryVectorDatabaseAndGenerateResponse function.
 * - QueryVectorDatabaseAndGenerateResponseOutput - The return type for the queryVectordatabaseAndGenerateResponse function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

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

export async function queryVectorDatabaseAndGenerateResponse(input: QueryVectorDatabaseAndGenerateResponseInput): Promise<QueryVectorDatabaseAndGenerateResponseOutput> {
  const ai = genkit({
    plugins: [
      googleAI({
        apiKey: input.apiKey,
      }),
    ],
  });

  const primaryModelName = input.model.startsWith('gemini')
    ? `googleai/${input.model}`
    : 'googleai/gemini-pro';

  const fallbackModelName = 'googleai/gemini-pro';

  const prompt = `You are a helpful AI assistant that answers questions based on the provided document excerpts.

Use the following document excerpts as context to answer the question. If the answer is not found in the excerpts, say "I could not find an answer in the provided documents." Do not make up information.

Context:
---
${input.fileContents.join('\n---\n')}

Question: ${input.query}`;

  try {
    const { output } = await ai.generate({
      prompt: prompt,
      model: primaryModelName,
    });

    if (!output || !output.text) {
      throw new Error('AI failed to generate a response with the primary model.');
    }
    return { response: output.text };
  } catch (error: any) {
    // If the primary model fails (e.g., due to overload), try the fallback.
    console.warn(`Primary model '${primaryModelName}' failed: ${error.message}. Retrying with fallback model '${fallbackModelName}'.`);
    
    try {
        const { output } = await ai.generate({
            prompt: prompt,
            model: fallbackModelName,
        });

        if (!output || !output.text) {
            throw new Error('AI failed to generate a response with the fallback model.');
        }
        return { response: output.text };
    } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw new Error('AI failed to generate a response with both primary and fallback models.');
    }
  }
}
