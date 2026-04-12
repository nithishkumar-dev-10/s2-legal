export type UserRole = "advocate" | "client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface FileAttachment {
  name: string;
  type: string;   // MIME type
  data: string;   // base64 with data URI prefix
}

export interface Case {
  id: number;
  case_number: string;
  petitioner: string;
  respondent: string;
  court_name: string;
  status: string;
  created_at: string;
}

export interface Hearing {
  id: number;
  case_id?: number;
  title: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  court: string;
  details: string;
}
