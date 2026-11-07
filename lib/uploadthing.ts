import { UTApi } from "uploadthing/server";

let utapi: UTApi | null = null;

export function isUploadThingConfigured() {
  return Boolean(process.env.UPLOADTHING_TOKEN);
}

export function getUtapi() {
  if (!process.env.UPLOADTHING_TOKEN) return null;
  if (!utapi) utapi = new UTApi();
  return utapi;
}

export async function deleteUploadedFiles(keys: string[]) {
  const cleanKeys = keys.filter(Boolean);
  if (!cleanKeys.length) return;
  const api = getUtapi();
  if (!api) return;
  try {
    await api.deleteFiles(cleanKeys);
  } catch (error) {
    console.error("Failed to delete UploadThing files", error);
  }
}
