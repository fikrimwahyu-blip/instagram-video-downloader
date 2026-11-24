import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ shortcode: string }>;
}

type ProviderItem = {
  type?: string;
  url?: string;
};

type ProviderResponse = {
  ok?: boolean;
  items?: ProviderItem[];
  error?: boolean;
  code?: string;
  message?: string;
  request_id?: string;
};

const PROVIDER_URL = "https://developers.getinsaver.com/v1/resolve";
const REQUEST_TIMEOUT_MS = 55_000;

function jsonError(
  error: string,
  message: string,
  status: number,
  extraHeaders?: HeadersInit
) {
  return NextResponse.json(
    { error, message },
    { status, headers: extraHeaders }
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { shortcode } = await context.params;

  if (!shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) {
    return jsonError("noShortcode", "Tautan Instagram tidak valid.", 400);
  }

  // Accept both names: the existing deployment variable and the name used
  // in the provider's official integration examples.
  const apiKey =
    process.env.GETINSAVER_API_KEY || process.env.GIS_KEY;

  if (!apiKey) {
    console.error(
      "Instagram downloader is not configured: set GETINSAVER_API_KEY or GIS_KEY"
    );
    return jsonError(
      "serverError",
      "Layanan unduhan belum dikonfigurasi. Admin perlu mengatur API key.",
      503
    );
  }

  const submittedUrl = request.nextUrl.searchParams.get("url");
  let sourceUrl = `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/`;

  if (submittedUrl) {
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
  }

  try {
    const response = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        service: "instagram",
        url: sourceUrl,
        max_results: 1,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const result = (await response.json().catch(() => null)) as
      | ProviderResponse
      | null;

    if (!response.ok || !result?.ok) {
      const providerCode = result?.code || "UNKNOWN";
      const providerMessage = result?.message || "No details returned";
      console.error("GetInSaver request failed:", {
        status: response.status,
        code: providerCode,
        message: providerMessage,
        requestId: result?.request_id,
      });

      if (
        response.status === 401 ||
        providerCode === "API_KEY_INVALID"
      ) {
        return jsonError(
          "serverError",
          "API key downloader tidak valid atau belum diverifikasi. Periksa pengaturan server.",
          503
        );
      }

      if (
        response.status === 402 ||
        providerCode === "INSUFFICIENT_CREDITS"
      ) {
        return jsonError(
          "serverError",
          "Kuota layanan downloader habis. Silakan hubungi admin.",
          503
        );
      }

      if (
        response.status === 422 ||
        providerCode === "MEDIA_NOT_FOUND" ||
        providerCode === "UPSTREAM_REJECTED"
      ) {
        return jsonError(
          "notFound",
          "Video tidak ditemukan. Pastikan postingan bersifat publik dan masih tersedia.",
          404
        );
      }

      if (
        response.status === 429 ||
        providerCode === "RATE_LIMITED" ||
        providerCode === "CONCURRENCY_LIMIT"
      ) {
        const retryAfter = response.headers.get("Retry-After");
        return jsonError(
          "tooManyRequests",
          "Server sedang sibuk. Tunggu sebentar lalu coba lagi.",
          429,
          retryAfter ? { "Retry-After": retryAfter } : undefined
        );
      }

      if (response.status === 504 || providerCode === "UPSTREAM_TIMEOUT") {
        return jsonError(
          "serverError",
          "Instagram membutuhkan waktu terlalu lama untuk merespons. Coba lagi beberapa saat.",
          504
        );
      }

      return jsonError(
        "serverError",
        "Layanan Instagram sedang bermasalah. Silakan coba lagi nanti.",
        502
      );
    }

    const video = result.items?.find(
      (item) =>
        item.type?.toLowerCase() === "video" &&
        typeof item.url === "string" &&
        item.url.startsWith("https://")
    );

    if (!video?.url) {
      return jsonError(
        "notVideo",
        "Postingan ini tidak berisi video yang bisa diunduh.",
        400
      );
    }

    return NextResponse.json(
      {
        data: {
          xdt_shortcode_media: {
            is_video: true,
            video_url: video.url,
          },
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Instagram downloader provider error:", error);
    return jsonError(
      "serverError",
      "Gagal menghubungi layanan downloader. Silakan coba lagi nanti.",
      502
    );
  }
}
