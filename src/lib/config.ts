/**
 * Global application configuration.
 *
 * This file contains environment-based configuration.
 * Values should be injected via environment variables in production.
 */

export const APP_CONFIG = {
  name: "TokoBox ERP",
  version: "0.1.0",
  apiVersion: "v1",
  defaultPageSize: 20,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  supportedUploadFormats: [".xlsx", ".xls", ".csv"],
  whatsappApiUrl: process.env["NEXT_PUBLIC_WA_API_URL"] || "",
  driveFolderId: process.env["NEXT_PUBLIC_DRIVE_FOLDER_ID"] || "",
  supabaseUrl: process.env["NEXT_PUBLIC_SUPABASE_URL"] || "",
  supabaseAnonKey: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "",
} as const;

export type AppConfig = typeof APP_CONFIG;
