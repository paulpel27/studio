'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import * as pdfjs from 'pdfjs-dist';

// Set up the worker for pdfjs
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
}

async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => ('str' in item ? item.str : '')).join(' ');
        text += '\n';
    }
    return text;
}

function chunkText(text: string, chunkSize: number = 1500, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const end = i + chunkSize;
        chunks.push(text.slice(i, end));
        i = end - overlap;
        if (i < 0) {
            i = end;
        }
    }
    return chunks;
}


export function FileUploader() {
  const { dispatch } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);

    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
        });
        continue;
      }

      try {
        const extractedText = await extractTextFromPdf(file);
        const textChunks = chunkText(extractedText);
        const combinedText = textChunks.join('\n\n');

        dispatch({
          type: 'ADD_FILE',
          payload: {
            id: `${file.name}-${new Date().toISOString()}`,
            name: file.name,
            text: combinedText,
          },
        });
        toast({
          title: 'File Processed',
          description: `"${file.name}" has been extracted and added to the knowledge base.`,
        });
      } catch (error) {
        console.error('Extraction Failed:', error);
        toast({
            variant: 'destructive',
            title: 'Extraction Failed',
            description: `Could not process "${file.name}". Please ensure it is a valid PDF file.`,
        });
      }
    }
    setIsLoading(false);
  }, [dispatch, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
      } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Processing files...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-semibold">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-muted-foreground">PDF only, up to {MAX_FILE_SIZE_MB}MB</p>
        </div>
      )}
    </div>
  );
}
