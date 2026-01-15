// Google Drive Integration for Reel Library
// Uses Replit's Google Drive connector for authentication

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export async function listDriveFolders(parentId?: string): Promise<DriveFolder[]> {
  const drive = await getUncachableGoogleDriveClient();
  
  const query = parentId 
    ? `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    : `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 100,
  });

  return (response.data.files || []).map(f => ({
    id: f.id!,
    name: f.name!,
  }));
}

export async function listDriveVideos(folderId?: string, searchQuery?: string): Promise<DriveFile[]> {
  const drive = await getUncachableGoogleDriveClient();
  
  const videoMimeTypes = [
    "mimeType contains 'video/'",
  ];
  
  let query = `(${videoMimeTypes.join(' or ')}) and trashed = false`;
  
  if (folderId) {
    query = `'${folderId}' in parents and ${query}`;
  }
  
  if (searchQuery) {
    query = `${query} and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
  }
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, thumbnailLink, webViewLink, size, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  });

  return (response.data.files || []).map(f => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    thumbnailLink: f.thumbnailLink || undefined,
    webViewLink: f.webViewLink || undefined,
    size: f.size || undefined,
    createdTime: f.createdTime || undefined,
    modifiedTime: f.modifiedTime || undefined,
  }));
}

export async function getDriveVideoStream(fileId: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; name: string }> {
  const drive = await getUncachableGoogleDriveClient();
  
  // Get file metadata first
  const metadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType, size',
  });
  
  const fileSizeBytes = parseInt(metadata.data.size || '0', 10);
  const maxSizeBytes = 100 * 1024 * 1024; // 100MB limit
  
  if (fileSizeBytes > maxSizeBytes) {
    throw new Error(`Video file too large. Maximum size is 100MB, this file is ${Math.round(fileSizeBytes / 1024 / 1024)}MB`);
  }
  
  // Download the file
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  
  return {
    stream: response.data as unknown as NodeJS.ReadableStream,
    mimeType: metadata.data.mimeType || 'video/mp4',
    name: metadata.data.name || 'video.mp4',
  };
}

export async function downloadDriveVideo(fileId: string): Promise<Buffer> {
  const { stream } = await getDriveVideoStream(fileId);
  
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks);
}
