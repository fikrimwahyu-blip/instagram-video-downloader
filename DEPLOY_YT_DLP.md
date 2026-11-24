# Deploy yt-dlp downloader (free test setup)

The Next.js website stays on Vercel. The extraction service runs separately as a Docker web service on Render.

## 1. Deploy the extraction service to Render

1. Push this repository to GitHub (the service files are in `downloader-service/`).
2. In Render, choose **New → Web Service** and connect this GitHub repository.
3. Select branch `master`.
4. Set **Root Directory** to `downloader-service`.
5. Select **Docker** as the runtime/environment. Render will use `downloader-service/Dockerfile`.
6. Choose the Free instance for testing.
7. Add an environment variable:
   - Key: `DOWNLOADER_API_KEY`
   - Value: a long random secret, generated locally for example with `openssl rand -hex 32`.
8. Set Health Check Path to `/health`, then deploy.

After deployment, copy the service URL, for example `https://your-service-name.onrender.com`. Test `https://your-service-name.onrender.com/health`; it should return JSON with `"status":"ok"`.

## 2. Configure the Vercel website

In Vercel → Project → Settings → Environment Variables, add both variables for **Production** (and Preview if desired):

- `DOWNLOADER_API_URL` = the Render service URL, without a trailing slash
- `DOWNLOADER_API_KEY` = exactly the same secret used in Render

Save and redeploy the Vercel project.

## 3. Test

1. Open the Render `/health` URL first. A free Render service sleeps after 15 minutes without traffic and can take about a minute to wake up.
2. Once health responds, open the Instagram Downloader website.
3. Test with a public Instagram Reel or video post.

## Important limitations

- yt-dlp is open-source software; it does not make Instagram extraction permanently reliable. Instagram may change its website, throttle requests, or require authentication. This setup intentionally supports public posts only.
- Render Free is for testing/hobby use, not production. It sleeps after 15 minutes idle, has limited monthly usage and may restart. First requests after sleep are slow.
- Do not add Instagram passwords, session cookies, or private-account access to this service.
- Keep `DOWNLOADER_API_KEY` secret. Never put it in a `NEXT_PUBLIC_*` variable or browser code.
- Download only content you own or have permission to save, and follow Instagram's terms and applicable copyright rules.
