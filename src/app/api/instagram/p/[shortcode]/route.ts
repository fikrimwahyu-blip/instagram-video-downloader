import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    shortcode: string;
  }>;
}

type GetInSaverResponse = {
  ok?: boolean;
  items?: Array<{
    type?: string;
    url?: string;
  }>;
  error?: boolean;
  code?: string;
  message?: string;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { shortcode } = await context.params;

  if (!shortcode) {
    return NextResponse.json(
      { error: "noShortcode", message: "shortcode is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GETINSAVER_API_KEY;

  if (!apiKey) {
    console.error("GETINSAVER_API_KEY is not configured");
    return NextResponse.json(
      { error: "serverError", message: "Downloader service is not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://developers.getinsaver.com/v1/resolve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        service: "instagram",
        url: `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/`,
        max_results: 1,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    const result = (await response.json().catch(() => null)) as
      | GetInSaverResponse
      | null;

    if (!response.ok || !result?.ok) {
      const providerCode = result?.code || "UNKNOWN";
      console.error("GetInSaver request failed:", response.status, providerCode);

      if (response.status === 422 || providerCode === "MEDIA_NOT_FOUND") {
        return NextResponse.json(
          { error: "notFound", message: "public media not found or unavailable" },
          { status: 404 }
        );
      }

      if (response.status === 429 || providerCode === "RATE_LIMITED") {
        return NextResponse.json(
          {
            error: "tooManyRequests",
            message: "too many requests, please try again later",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "serverError", message: "The download provider could not process this link" },
        { status: response.status === 402 ? 503 : 502 }
      );
    }

    const video = result.items?.find(
      (item) => item.type === "video" && typeof item.url === "string"
    );

    if (!video?.url) {
      return NextResponse.json(
        { error: "notVideo", message: "post does not contain a downloadable video" },
        { status: 400 }
      );
    }

    // Keep the response shape expected by the existing frontend.
    return NextResponse.json(
      {
        data: {
          xdt_shortcode_media: {
            is_video: true,
            video_url: video.url,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Instagram downloader provider error:", error);
    return NextResponse.json(
      { error: "serverError", message: "Unable to process this link right now" },
      { status: 502 }
    );
  }
}
