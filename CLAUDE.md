# woodland-reels

Woodland Architects' (Mangaluru) animated Reels/Shorts system. Owner: Woodland (principal architect).

## Layout
- `engine/` video engine: `build.sh setup|voice|preview|render <dir>`. Per video you write `video.json` (script) and `scenes.js` (animated section drawings). See `engine/examples/cool-home/` and the `woodland-reel-maker` skill for the full style rules.
- `topics.md` topic queue. Use the first unchecked topic; tick it (`- [x]`) when its post is approved. If empty, choose a topic yourself.
- `posts/<YYYY-MM-DD>-<slug>/` one folder per APPROVED post: `video.mp4`, `meta.json`, plus `video.json` + `scenes.js` sources.
- `.github/workflows/post-reels.yml` publishes approved posts to Instagram when `post_at` passes (checks every 30 min, 7–10:30 PM IST). Secret `IG_TOKEN` (optional `IG_USER_ID`) lives in repo Settings.

## Scheduled run (every other day)
1. Pick the topic (queue first). Build the video in `work/<slug>/` with the engine (`./engine/build.sh setup` first).
2. Send the MP4 + Instagram caption to Woodland with SendUserFile and a short message; ask him to reply "approve" or request changes. Use PushNotification if available.
3. NEVER commit a post to `posts/` without his explicit approval in this session. If he asks for changes, redo and resend.
4. On approval: create `posts/<date>-<slug>/` with `video.mp4`, sources, and `meta.json`:
   `{"status": "approved", "post_at": "<today>T19:30:00+05:30", "caption": "...", "video": "video.mp4", "topic": "..."}`
   (if he approves after 7:15 PM, set post_at to now + 15 min). Commit "Approve: <title>" and push to main.
5. Tell him it will go live at the post time. No approval that day → nothing is posted.

## Rules
- Brand: "Woodland Architects" spoken in hook + end card; captions end with a DM call to action and #woodlandarchitects #mangalore.
- Don't delete or rewrite posted folders. Don't change workflow secrets.
