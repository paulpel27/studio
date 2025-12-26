'use client';

import { FileUploader } from '@/components/file-uploader';
import { FileList } from '@/components/file-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function FilesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">File Management</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>Upload files (max 10MB) to add them to the knowledge base. Supported formats: PDF, DOCX, TXT, CSV.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Manage your uploaded files. Deleting a file removes it from the knowledge base.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
