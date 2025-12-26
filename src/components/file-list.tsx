'use client';

import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Trash2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FileList() {
  const { state, dispatch } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_FILE', payload: { id } });
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  if (state.files.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
            <Info className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Files Uploaded</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Your knowledge base is empty. Upload a file to get started.
            </p>
        </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>{file.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete file</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
