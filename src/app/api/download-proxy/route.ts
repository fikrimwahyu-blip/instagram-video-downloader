import { NextRequest, NextResponse } from "next/server";

const ALLOWED_VIDEO_HOSTS = [
  "cdninstagram.com",
  "fbcdn.net",
  "instagram.com",
];

function isAllowedVideoHost(hostname: string) {
  return ALLOWED_VIDEO_HOSTS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get("url");
  const requestedFilename =
    searchParams.get("filename") || "instagram-video.mp4";
  const filename = requestedFilename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);

  if (!fileUrl) {
    return NextResponse.json(
      { error: "missingUrl", message: "URL video wajib diisi." },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return NextResponse.json(
      { error: "invalidUrl", message: "URL video tidak valid." },
      { status: 400 }
    );
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname ||
    !isAllowedVideoHost(parsedUrl.hostname)
  ) {
    return NextResponse.json(
      { error: "invalidUrl", message: "Host video tidak diizinkan." },
      { status: 400 }
    );
  }

  try {
    const videoResponse = await fetch(parsedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });

    if (!videoResponse.ok) {
      return NextResponse.json(
        {
          error: "downloadFailed",
          message: "Gagal mengambil file video dari Instagram.",
        },
        { status: 502 }
      );
    }

    if (!videoResponse.body) {
      return NextResponse.json(
        { error: "emptyResponse", message: "File video kosong." },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set(
      "Content-Type",
      videoResponse.headers.get("Content-Type") || "video/mp4"
    );
    headers.set("Cache-Control", "no-store");

    const contentLength = videoResponse.headers.get("Content-Length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(videoResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      {
        error: "serverError",
        message: "Gagal mengunduh video. Silakan coba lagi.",
      },
      { status: 502 }
    );
  }
}
