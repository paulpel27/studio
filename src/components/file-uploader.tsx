'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';

// Mock function to simulate PDF text extraction
async function extractTextFromPdf(file: File): Promise<string> {
  console.log(`Simulating text extraction for ${file.name}`);
  // In a real app, you would use a library like pdf.js or a server-side process
  // to extract text from the PDF file.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`This is simulated extracted text from the PDF file: "${file.name}".`);
    }, 500);
  });
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
        const text = await extractTextFromPdf(file);
        dispatch({
          type: 'ADD_FILE',
          payload: {
            id: `${file.name}-${new Date().toISOString()}`,
            name: file.name,
            text,
          },
        });
        toast({
          title: 'File Added',
          description: `"${file.name}" has been added to the knowledge base.`,
        });
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Extraction Failed',
            description: `Could not process "${file.name}".`,
        });
      }
    }
    setIsLoading(false);
  }, [dispatch, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
        isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
      }`}
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
