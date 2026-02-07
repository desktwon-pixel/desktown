
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Standalone Object Storage Service (No Replit sidecar dependency)
// Requires standard Google Cloud environment variables:
// - GOOGLE_APPLICATION_CREDENTIALS (path to JSON key)
// - or GCS_PROJECT_ID, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY
const storageOptions = process.env.GOOGLE_APPLICATION_CREDENTIALS ? {} : (
  process.env.GCS_PRIVATE_KEY ? {
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  } : {}
);

export const objectStorageClient = new Storage(storageOptions);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    return pathsStr.split(",").map(p => p.trim()).filter(p => p.length > 0);
  }

  getPrivateObjectDir(): string {
    return process.env.PRIVATE_OBJECT_DIR || "";
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });
      file.createReadStream().pipe(res);
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async getObjectEntityUploadURL(fileExtension?: string): Promise<{ uploadURL: string; objectPath: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const extension = fileExtension ? `.${fileExtension}` : '';
    const fullPath = `${privateObjectDir}/uploads/${objectId}${extension}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    // Using standard GCS signed URLs
    const [uploadURL] = await objectStorageClient.bucket(bucketName).file(objectName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'application/octet-stream',
    });

    return { uploadURL, objectPath: `/objects/uploads/${objectId}${extension}` };
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const entityId = objectPath.slice(9);
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) entityDir = `${entityDir}/`;
    const { bucketName, objectName } = parseObjectPath(`${entityDir}${entityId}`);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  async getSignedDownloadURL(objectPath: string, ttlSec: number = 300): Promise<string> {
    const file = await this.getObjectEntityFile(objectPath);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + ttlSec * 1000,
    });
    return url;
  }

  async trySetObjectEntityAclPolicy(objectPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    try {
      const file = await this.getObjectEntityFile(objectPath);
      await setObjectAclPolicy(file, aclPolicy);
      return objectPath;
    } catch (error) {
      console.error("Error setting ACL policy:", error);
      return objectPath;
    }
  }

  async canAccessObjectEntity({ userId, objectPath, requestedPermission }: { userId?: string; objectPath: string; requestedPermission: ObjectPermission }): Promise<boolean> {
    try {
      const file = await this.getObjectEntityFile(objectPath);
      return await canAccessObject({ userId, objectFile: file, requestedPermission });
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const parts = path.startsWith('/') ? path.slice(1).split('/') : path.split('/');
  return { bucketName: parts[0], objectName: parts.slice(1).join('/') };
}
