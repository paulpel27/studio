import { SettingsForm } from '@/components/settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Enter your Google AI API key and choose a model to use for the chat.
            Your key is stored securely in your browser's local storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingsForm />
           <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">How to get a free API Key</h4>
              <p className="text-sm text-muted-foreground">
                You can get a free Google AI API key for development from Google AI Studio.
                It provides a generous free tier to get you started.
              </p>
              <Button asChild variant="link" className="px-0">
                <Link href="https://aistudio.google.com/app/apikey" target="_blank">
                    Get an API Key from Google AI Studio
                </Link>
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
