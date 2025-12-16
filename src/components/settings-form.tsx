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
import { UploadCloud } from 'lucide-react';
import { decrypt } from '@/lib/crypto';

const settingsSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required.'),
  model: z.string().min(1, 'Model name is required.'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

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
            const newSettings = JSON.parse(text);
            
            // Decrypt the API key if it's present
            if (newSettings.apiKey) {
                try {
                    newSettings.apiKey = await decrypt(newSettings.apiKey);
                } catch (e) {
                    // It might not be encrypted, so we use it as is.
                }
            }

            const validatedSettings = settingsSchema.parse(newSettings);
            form.reset(validatedSettings);
            dispatch({ type: 'UPDATE_SETTINGS', payload: validatedSettings });
            toast({
              title: 'Settings Loaded',
              description: 'Your settings have been loaded from the file.',
            });

          } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Invalid File',
              description:
                'The uploaded file is not a valid JSON settings file or is corrupted.',
            });
          }
        };
        reader.readAsText(file);
      }
    },
    [dispatch, form, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  function onSubmit(data: SettingsFormValues) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    toast({
      title: 'Settings Saved',
      description: 'Your AI configuration has been updated.',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid w-full max-w-lg gap-8">
          <div
            {...getRootProps()}
            className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
              isDragActive ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 font-semibold">
                {isDragActive
                  ? 'Drop the settings file here...'
                  : 'Drag & drop a settings file, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">Upload a JSON file with your API key and model.</p>
            </div>
          </div>

          <div className="grid gap-6">
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
        </div>
      </form>
    </Form>
  );
}
