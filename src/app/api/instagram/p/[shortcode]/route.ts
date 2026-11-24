import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

interface RouteContext {
  params: Promise<{ shortcode: string }>;
}

type ExtractResponse = {
  ok?: boolean;
  title?: string;
  ext?: string;
  url?: string;
  detail?: string;
};

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { shortcode } = await context.params;

  if (!shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) {
    return jsonError("noShortcode", "Tautan Instagram tidak valid.", 400);
  }

  const submittedUrl = request.nextUrl.searchParams.get("url");
  if (!submittedUrl) {
    return jsonError("noShortcode", "Tautan Instagram wajib diisi.", 400);
  }

  let sourceUrl: string;
  try {
    const parsedUrl = new URL(submittedUrl);
    const allowedHosts = [
      "www.instagram.com",
      "instagram.com",
      "m.instagram.com",
    ];
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const isSupportedPath = ["p", "reel", "tv"].includes(pathParts[0]);

    if (
      parsedUrl.protocol !== "https:" ||
      !allowedHosts.includes(parsedUrl.hostname) ||
      !isSupportedPath ||
      pathParts[1] !== shortcode
    ) {
      throw new Error("Invalid Instagram URL");
    }

    sourceUrl = `https://www.instagram.com/${pathParts[0]}/${encodeURIComponent(shortcode)}/`;
  } catch {
    return jsonError("noShortcode", "Tautan Instagram tidak valid.", 400);
  }

  const serviceUrl = process.env.DOWNLOADER_API_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.DOWNLOADER_API_KEY;

  if (!serviceUrl || !serviceKey) {
    console.error(
      "Downloader service is not configured. Set DOWNLOADER_API_URL and DOWNLOADER_API_KEY."
    );
    return jsonError(
      "serverError",
      "Layanan downloader belum dikonfigurasi oleh admin.",
      500
    );
  }

  try {
    const response = await fetch(`${serviceUrl}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": serviceKey,
        Accept: "application/json",
      },
      body: JSON.stringify({ url: sourceUrl }),
      cache: "no-store",
      signal: AbortSignal.timeout(110_000),
    });

    const result = (await response.json().catch(() => null)) as
      | ExtractResponse
      | null;

    if (!response.ok || !result?.url) {
      const message = result?.detail || "Gagal mengambil video Instagram.";
      console.error("yt-dlp service error:", {
        status: response.status,
        message,
      });

      if (response.status === 401) {
        return jsonError(
          "serverError",
          "Kunci penghubung antara Vercel dan downloader tidak cocok.",
          500
        );
      }
      if (response.status === 403) {
        return jsonError("notFound", message, 404);
      }
      if (response.status === 404) {
        return jsonError("notFound", message, 404);
      }
      if (response.status === 429) {
        return jsonError("tooManyRequests", message, 429);
      }
      if (response.status === 400) {
        return jsonError("noShortcode", message, 400);
      }
      return jsonError("serverError", message, 502);
    }

    if (!result.url.startsWith("https://")) {
      return jsonError("serverError", "URL video dari server tidak valid.", 502);
    }

    return NextResponse.json(
      {
        data: {
          xdt_shortcode_media: {
            is_video: true,
            video_url: result.url,
          },
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("yt-dlp service request failed:", error);
    return jsonError(
      "serverError",
      "Server downloader belum merespons. Jika baru aktif, buka alamat health service terlebih dahulu lalu coba lagi.",
      502
    );
  }
}
