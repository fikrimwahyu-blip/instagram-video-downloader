import os
import re
import time
from collections import defaultdict, deque
from typing import Any
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="Instagram Downloader Service", version="1.0.0")

# The API is intended to be called by the Next.js server, not directly by browsers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-API-Key"],
)

API_KEY = os.getenv("DOWNLOADER_API_KEY", "")
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "15"))
requests_by_ip: dict[str, deque[float]] = defaultdict(deque)


class ExtractRequest(BaseModel):
    url: HttpUrl


def check_instagram_url(value: str) -> str:
    parsed = urlparse(value)
    allowed_hosts = {"instagram.com", "www.instagram.com", "m.instagram.com"}
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts:
        raise HTTPException(status_code=400, detail="Tautan harus berasal dari Instagram.")
    match = re.match(r"^/(?:p|reel|tv)/([A-Za-z0-9_-]+)/?", parsed.path)
    if not match:
        raise HTTPException(status_code=400, detail="Format tautan Instagram tidak didukung.")
    return f"https://www.instagram.com/{parsed.path.strip('/')}/"


def check_rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = requests_by_ip[ip]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Terlalu banyak permintaan. Coba lagi sebentar.")
    bucket.append(now)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "yt-dlp"}


@app.post("/extract")
def extract_video(
    payload: ExtractRequest,
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> dict[str, Any]:
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    check_rate_limit(request)
    source_url = check_instagram_url(str(payload.url))

    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "format": "best[ext=mp4]/best",
        "socket_timeout": 25,
        "retries": 1,
        "extractor_retries": 1,
    }

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(source_url, download=False)
            if not info:
                raise HTTPException(status_code=404, detail="Video tidak ditemukan.")

            if info.get("_type") == "playlist":
                entries = [entry for entry in (info.get("entries") or []) if entry]
                if not entries:
                    raise HTTPException(status_code=404, detail="Video tidak ditemukan.")
                info = entries[0]

            video_url = info.get("url")
            if not video_url:
                formats = info.get("requested_formats") or info.get("formats") or []
                video_format = next(
                    (item for item in reversed(formats) if item.get("url") and item.get("vcodec") != "none"),
                    None,
                )
                video_url = video_format.get("url") if video_format else None

            if not video_url or not str(video_url).startswith("https://"):
                raise HTTPException(status_code=404, detail="URL video tidak tersedia.")

            return {
                "ok": True,
                "title": info.get("title") or "instagram-video",
                "ext": info.get("ext") or "mp4",
                "url": video_url,
            }
    except HTTPException:
        raise
    except yt_dlp.utils.DownloadError as exc:
        message = str(exc)
        lowered = message.lower()
        if "login" in lowered or "private" in lowered or "cookies" in lowered:
            raise HTTPException(
                status_code=403,
                detail="Instagram meminta login atau postingan bersifat privat. Layanan ini hanya mendukung postingan publik.",
            )
        if "not available" in lowered or "does not exist" in lowered:
            raise HTTPException(status_code=404, detail="Postingan tidak ditemukan atau tidak tersedia.")
        raise HTTPException(
            status_code=502,
            detail="Instagram menolak permintaan atau sedang membatasi akses. Coba lagi nanti.",
        )
    except Exception:
        raise HTTPException(status_code=502, detail="Gagal memproses video Instagram.")
