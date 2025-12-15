'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Copy, Trash2, AlertCircle, Bot } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { queryVectorDatabaseAndGenerateResponse } from '@/ai/flows/query-vector-database-and-generate-response';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

const chatFormSchema = z.object({
  prompt: z.string().min(1, 'Message cannot be empty.'),
});

type ChatFormValues = z.infer<typeof chatFormSchema>;

export function ChatInterface() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [isResponding, setIsResponding] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { prompt: '' },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [state.chats, isResponding]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Response copied to clipboard.',
    });
  };
  
  const handleDelete = (id: string) => {
      dispatch({ type: 'DELETE_CHAT', payload: { id } });
  }

  async function onSubmit(data: ChatFormValues) {
    if (!state.settings.apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please enter your Google AI API key in the settings page.',
      });
      return;
    }
    
    setIsResponding(true);

    try {
      const fileContents = state.files.map(file => file.text);
      const result = await queryVectorDatabaseAndGenerateResponse({
        query: data.prompt,
        fileContents,
      });

      dispatch({
        type: 'ADD_CHAT',
        payload: {
          id: new Date().toISOString(),
          userQuery: data.prompt,
          aiResponse: result.response,
        },
      });
      form.reset();
    } catch (error) {
      console.error('Error querying AI:', error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Failed to get a response from the AI. Please check your API key and try again.',
      });
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 md:p-6">
          {state.chats.length === 0 && !isResponding && (
            <Card className="mx-auto max-w-2xl text-center">
              <div className="p-6">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-semibold">Welcome to RagInfo Chat</h2>
                <p className="mt-2 text-muted-foreground">
                  Ask a question about your uploaded documents to get started.
                </p>
              </div>
            </Card>
          )}

          {state.files.length === 0 && (
             <Alert variant="destructive" className="mx-auto max-w-2xl my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Files Uploaded</AlertTitle>
                <AlertDescription>
                    The knowledge base is empty. Please upload some PDF files in the 'Files' section to chat with your documents.
                </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {state.chats.map((chat) => (
              <div key={chat.id}>
                {/* User Message */}
                <div className="flex items-start gap-4 justify-end">
                  <div className="grid gap-1 rounded-lg bg-primary px-3 py-2 text-primary-foreground shadow-md max-w-xl">
                    <p className="text-sm">{chat.userQuery}</p>
                  </div>
                   <Avatar className="h-9 w-9 border">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>

                {/* AI Message */}
                <div className="mt-4 flex items-start gap-4">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="group grid gap-1 rounded-lg bg-card px-3 py-2 shadow-md max-w-xl">
                    <p className="text-sm">{chat.aiResponse}</p>
                     <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(chat.aiResponse)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(chat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isResponding && (
              <div className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 rounded-lg bg-card px-3 py-2 shadow-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-accent"></div>
                        <span>Thinking...</span>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-4 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Ask a question..." {...field} disabled={isResponding} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isResponding}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
