# Instagram Downloader Service (yt-dlp)

A small FastAPI service that extracts public Instagram video URLs with yt-dlp.

## Environment variables

- `DOWNLOADER_API_KEY`: required shared secret. Use a long random value.
- `RATE_LIMIT_PER_MINUTE`: optional, defaults to 15 requests per client IP.

## Local run

```bash
cd downloader-service
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export DOWNLOADER_API_KEY="replace-with-a-long-random-secret"
uvicorn app:app --host 0.0.0.0 --port 10000
```

Health check: `GET /health`

Extract: `POST /extract` with header `X-API-Key` and JSON body `{"url":"https://www.instagram.com/reel/SHORTCODE/"}`.

Only use this service for public posts you are allowed to download. Instagram may change its site or restrict automated access, so extraction is not guaranteed to work permanently. Do not use private-account cookies or attempt to bypass access controls.
