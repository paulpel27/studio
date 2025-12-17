export interface AppFile {
  id: string;
  name: string;
  // This holds the content extracted from the PDF, broken into chunks.
  textChunks: string[];
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
