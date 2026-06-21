import { NextResponse } from "next/server"
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client"

export const runtime = "nodejs"

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024 // 500 MB — Apple exports can be large

/**
 * Token endpoint for client-side uploads to Vercel Blob. The browser uploads
 * the zip directly to Blob (no ~4.5 MB function body limit), using a short-lived
 * token minted here. Requires BLOB_READ_WRITE_TOKEN in the environment.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "application/zip",
          "application/x-zip-compressed",
          "application/octet-stream",
        ],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
      // The actual import is triggered by the client after upload completes,
      // so there is nothing to do on the server side here.
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    )
  }
}
