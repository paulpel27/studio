export interface AppFile {
  id: string;
  name: string;
  // This is a placeholder for the content extracted from the PDF.
  // In a real application, this would be the full text or structured data.
  text: string;
}

export interface Chat {
  id: string;
  userQuery: string;
  aiResponse: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
}
