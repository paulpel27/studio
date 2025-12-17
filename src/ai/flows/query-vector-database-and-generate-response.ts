'use server';

/**
 * @fileOverview This file defines a flow for querying a vector database and generating a response.
 *
 * - queryVectorDatabaseAndGenerateResponse - A function that takes a user query and returns an AI-generated response based on the content of the vector database.
 * - QueryVectorDatabaseAndGenerateResponseInput - The input type for the queryVectorDatabaseAndGenerateResponse function.
 * - QueryVectorDatabaseAndGenerateResponseOutput - The return type for the queryVectordatabaseAndGenerateResponse function.
 */

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
  // The 'gemini-pro' and 'gemini-2.5-pro' models can be restrictive on the free tier.
  // Automatically switch to a more generous model if one of them is selected.
  let modelName = input.model || 'gemini-1.5-flash-latest';
  if (modelName === 'gemini-pro' || modelName === 'gemini-2.5-pro') {
    modelName = 'gemini-1.5-flash-latest';
  }


  const prompt = `You are a helpful AI assistant that answers questions based on the provided document excerpts.

Use the following document excerpts as context to answer the question. If the answer is not found in the excerpts, say "I could not find an answer in the provided documents." Do not make up information.

Context:
---
${input.fileContents.join('\n---\n')}

Question: ${input.query}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': input.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('AI API Error:', errorBody);
        const errorMessage = errorBody?.error?.message || 'The AI service returned an error.';
        throw new Error(`AI API request failed: ${response.status} ${response.statusText} - ${errorMessage}`);
    }

    const responseData = await response.json();
    
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Invalid response structure from AI:', responseData);
      throw new Error('AI failed to generate a valid response structure.');
    }

    return { response: text };

  } catch (error) {
    console.error('Failed to call AI model:', error);
    if (error instanceof Error) {
        throw new Error(`AI failed to generate a response: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the AI model.');
  }
}
