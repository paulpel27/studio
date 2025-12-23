'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, FileDown } from 'lucide-react';
import { decrypt, encrypt } from '@/lib/crypto';
import type { AppSettings } from '@/lib/types';

const settingsSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required.'),
  model: z.string().min(1, 'Model name is required.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const exportedDataSchema = z.object({
    settings: settingsSchema.partial().extend({ apiKey: z.string().optional() }),
    files: z.array(z.object({
        id: z.string(),
        name: z.string(),
        textChunks: z.array(z.string())
    })),
    chats: z.array(z.any()).optional(), // Keep chats flexible for now
});


export function SettingsForm() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: state.settings,
  });

  useEffect(() => {
    form.reset(state.settings);
  }, [state.settings, form]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            const importedData = JSON.parse(text);

            // We use .partial() here to allow for files that might only contain settings or only files
            const validatedData = exportedDataSchema.parse(importedData);
            
            if (validatedData.settings) {
                const newSettings: AppSettings = { ...state.settings };
                if (validatedData.settings.apiKey) {
                    try {
                        newSettings.apiKey = await decrypt(validatedData.settings.apiKey);
                    } catch (e) {
                        // It might not be encrypted, use as is.
                        newSettings.apiKey = validatedData.settings.apiKey;
                    }
                }
                if (validatedData.settings.model) {
                    newSettings.model = validatedData.settings.model;
                }
                dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
            }

            if (validatedData.files) {
                dispatch({ type: 'SET_FILES', payload: validatedData.files });
            }

            toast({
              title: 'Data Loaded',
              description: 'Your settings and file data have been imported.',
            });

          } catch (error) {
            console.error("Import error:", error)
            toast({
              variant: 'destructive',
              title: 'Invalid File',
              description:
                'The uploaded file is not a valid data file or is corrupted.',
            });
          }
        };
        reader.readAsText(file);
      }
    },
    [dispatch, toast, state.settings]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  async function handleExport() {
    try {
        const encryptedKey = await encrypt(state.settings.apiKey);
        const stateToSave = { 
            settings: { ...state.settings, apiKey: encryptedKey },
            files: state.files,
            chats: state.chats
        };
        const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'raginfo-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: 'Data Exported',
            description: 'Your data has been saved to raginfo-data.json',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: 'Could not export your application data.',
        });
    }
  }

  function onSubmit(data: SettingsFormValues) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    toast({
      title: 'Settings Saved',
      description: 'Your AI configuration has been updated.',
    });
  }

  return (
    <div className="space-y-12">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid w-full max-w-lg gap-6">
                <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Google AI API Key</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., gemini-1.5-flash-latest" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit">Save Settings</Button>
            </div>
        </form>
        </Form>
        
        <div className="grid w-full max-w-lg gap-8">
            <div
                {...getRootProps()}
                className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
                isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 font-semibold">
                    {isDragActive
                    ? 'Drop the data file here...'
                    : 'Import Data'}
                </p>
                <p className="text-xs text-muted-foreground">Drag & drop a JSON file to restore your settings & files.</p>
                </div>
            </div>
            
            <Button type="button" variant="outline" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export All Data
            </Button>
        </div>
    </div>
  );
}
