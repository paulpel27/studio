'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { Progress } from '@/components/ui/progress';

// Set up the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ProcessStep = 'idle' | 'extracting' | 'chunking' | 'saving' | 'done' | 'error';
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
      fullText += pageText + '\n';
      onProgress(Math.round((i / pdf.numPages) * 100));
    }
  
    return fullText;
}

async function extractTextFromDocx(file: File, onProgress: (percent: number) => void): Promise<string> {
    onProgress(10);
    const arrayBuffer = await file.arrayBuffer();
    onProgress(50);
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress(100);
    return result.value;
}

async function extractTextFromTxtOrCsv(file: File, onProgress: (percent: number) => void): Promise<string> {
    onProgress(50);
    const text = await file.text();
    onProgress(100);
    return text;
}


/**
 * Splits text into sentences and then groups them into chunks.
 * This is more "content-aware" than simply slicing the text,
 * as it avoids splitting in the middle of a sentence.
 */
function chunkText(text: string, targetChunkSize: number = 1500, overlap: number = 200): string[] {
    if (!text) return [];

    // Split the text into sentences. This is a simple regex and might not be perfect for all cases.
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    
    let currentChunk = "";
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (currentChunk.length + sentence.length > targetChunkSize && currentChunk) {
            chunks.push(currentChunk);
            
            // Handle overlap by finding where to start the next chunk
            const lastSentences = currentChunk.split(/(?<=[.?!])\s+/);
            let overlapText = "";
            let overlapLength = 0;
            for(let j = lastSentences.length - 1; j >= 0; j--) {
                if (overlapLength + lastSentences[j].length < overlap) {
                    overlapLength += lastSentences[j].length;
                    overlapText = lastSentences[j] + " " + overlapText;
                } else {
                    break;
                }
            }
            currentChunk = overlapText;
        }
        currentChunk += sentence + " ";
    }

    if (currentChunk) {
        chunks.push(currentChunk);
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
    updateFileStatus(file.name, { status: 'extracting', progress: 0, message: 'Extracting text...' });
    let rawText = '';
    try {
        const onProgress = (progress: number) => updateFileStatus(file.name, { progress });

        if (file.type === 'application/pdf') {
            rawText = await extractTextFromPdf(file, onProgress);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            rawText = await extractTextFromDocx(file, onProgress);
        } else if (file.type === 'text/plain' || file.type === 'text/csv') {
            rawText = await extractTextFromTxtOrCsv(file, onProgress);
        } else {
            throw new Error(`Unsupported file type: ${file.type}`);
        }
        updateFileStatus(file.name, { progress: 100 });
    } catch (error) {
        console.error('Extraction Failed:', error);
        updateFileStatus(file.name, { status: 'error', message: 'Failed to extract text.' });
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    updateFileStatus(file.name, { status: 'chunking', progress: 0, message: 'Chunking content...' });
    const textChunks = chunkText(rawText);
    for (let i = 0; i <= 100; i+= 50) {
        updateFileStatus(file.name, { progress: i });
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    updateFileStatus(file.name, { progress: 100 });
    await new Promise(resolve => setTimeout(resolve, 300));

    updateFileStatus(file.name, { status: 'saving', progress: 50, message: 'Saving...' });
    dispatch({
      type: 'ADD_FILE',
      payload: {
        id: `${file.name}-${new Date().toISOString()}`,
        name: file.name,
        textChunks: textChunks,
      },
    });
    await new Promise(resolve => setTimeout(resolve, 300));
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
            if (state.files.some(f => f.name === file.name)) {
                toast({
                    variant: 'destructive',
                    title: 'File already exists',
                    description: `"${file.name}" is already in the knowledge base.`,
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

  }, [dispatch, toast, state.settings.apiKey, state.settings.model, state.files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt'],
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
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
                <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, CSV (up to {MAX_FILE_SIZE_MB}MB)</p>
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
                        <p className="w-40 shrink-0 text-right text-muted-foreground">{message}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}
