'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import { extractTextFromPdfFlow } from '@/ai/flows/extract-text-from-pdf-flow';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URI prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function FileUploader() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);

    if (!state.settings.apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please enter your Google AI API key in the settings page.',
      });
      setIsLoading(false);
      return;
    }

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
        const pdfBase64 = await fileToBase64(file);
        const result = await extractTextFromPdfFlow({
          pdfBase64,
          model: state.settings.model,
          apiKey: state.settings.apiKey,
        });
        
        const combinedText = result.chunks.join('\n\n');

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
  }, [dispatch, toast, state.settings]);

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
