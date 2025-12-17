'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import * as pdfjsLib from 'pdfjs-dist';
import { Progress } from '@/components/ui/progress';

// Set up the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ProcessStep = 'idle' | 'extracting' | 'chunking' | 'embedding' | 'done' | 'error';
interface FileStatus {
  file: File;
  status: ProcessStep;
  progress: number;
  message: string;
}

async function extractTextFromPdf(file: File, onProgress: (percent: number) => void): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n\n';
      onProgress(Math.round((i / pdf.numPages) * 100));
    }
  
    return fullText;
}

function chunkText(text: string, chunkSize: number = 1500, overlap: number = 200): string[] {
    const chunks: string[] = [];
    if (!text) return chunks;

    let i = 0;
    while (i < text.length) {
      const end = i + chunkSize;
      chunks.push(text.slice(i, end));
      i = end - overlap;
      if (end >= text.length) {
        break;
      }
    }
    return chunks;
}


export function FileUploader() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);

  const updateFileStatus = (fileName: string, newStatus: Partial<FileStatus>) => {
    setFileStatuses(prev => prev.map(fs => fs.file.name === fileName ? { ...fs, ...newStatus } : fs));
  };
  
  const processFile = async (file: File) => {
    // 1. Extraction
    updateFileStatus(file.name, { status: 'extracting', progress: 0, message: 'Extracting text...' });
    let rawText = '';
    try {
        rawText = await extractTextFromPdf(file, (progress) => {
            updateFileStatus(file.name, { progress });
        });
        updateFileStatus(file.name, { progress: 100 });
    } catch (error) {
        console.error('Extraction Failed:', error);
        updateFileStatus(file.name, { status: 'error', message: 'Failed to extract text.' });
        return; // Stop processing this file
    }

    // Artificial delay to simulate careful processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Chunking
    updateFileStatus(file.name, { status: 'chunking', progress: 0, message: 'Chunking document...' });
    const textChunks = chunkText(rawText);
    // Simulate chunking progress
    for (let i = 0; i <= 100; i+= 50) {
        updateFileStatus(file.name, { progress: i });
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    updateFileStatus(file.name, { progress: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. "Embedding" / Saving
    updateFileStatus(file.name, { status: 'embedding', progress: 50, message: 'Adding to knowledge base...' });
    dispatch({
      type: 'ADD_FILE',
      payload: {
        id: `${file.name}-${new Date().toISOString()}`,
        name: file.name,
        textChunks: textChunks,
      },
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    updateFileStatus(file.name, { status: 'done', progress: 100, message: 'Complete' });

    toast({
        title: 'File Processed',
        description: `"${file.name}" has been added to the knowledge base.`,
    });
  }


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!state.settings.apiKey || !state.settings.model) {
      toast({
        variant: 'destructive',
        title: 'Configuration Missing',
        description: 'Please set your API key and model in Settings before uploading.',
      });
      return;
    }
    
    const newFileStatuses: FileStatus[] = acceptedFiles
        .filter(file => {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast({
                  variant: 'destructive',
                  title: 'File too large',
                  description: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
                });
                return false;
            }
            return true;
        })
        .map(file => ({ file, status: 'idle', progress: 0, message: 'Queued' }));

    setFileStatuses(prev => [...prev, ...newFileStatuses]);

    for (const status of newFileStatuses) {
        await processFile(status.file);
    }

  }, [dispatch, toast, state.settings.apiKey, state.settings.model]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });
  
  const isLoading = fileStatuses.some(f => f.status !== 'done' && f.status !== 'error' && f.status !== 'idle');

  return (
    <div className="space-y-4">
        <div
        {...getRootProps()}
        className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
        } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            <input {...getInputProps()} disabled={isLoading} />
            <div className="flex flex-col items-center text-center">
                <UploadCloud className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold">
                    {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
                </p>
                <p className="text-sm text-muted-foreground">PDF only, up to {MAX_FILE_SIZE_MB}MB</p>
            </div>
        </div>

        {fileStatuses.length > 0 && (
            <div className="space-y-2 rounded-md border p-4">
                <h4 className="text-sm font-medium">Upload Progress</h4>
                {fileStatuses.map(({ file, status, progress, message }) => (
                    <div key={file.name} className="flex items-center gap-4 text-sm">
                        <div className="w-8 shrink-0 text-center">
                            {status === 'done' && <CheckCircle className="mx-auto h-5 w-5 text-green-500" />}
                            {status === 'error' && <AlertCircle className="mx-auto h-5 w-5 text-destructive" />}
                            {(status !== 'done' && status !== 'error') && <FileText className="mx-auto h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                            <p className="truncate font-medium">{file.name}</p>
                            <Progress value={progress} className="h-2 mt-1" />
                        </div>
                        <p className="w-36 shrink-0 text-right text-muted-foreground">{message}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}
