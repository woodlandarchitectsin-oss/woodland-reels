# woodland-reels

Woodland Architects' (Mangaluru) animated Reels/Shorts system. Owner: Woodland (principal architect).

## Layout
- `engine/` video engine: `build.sh setup|voice|preview|render <dir>`. Per video you write `video.json` (script) and `scenes.js` (animated section drawings). See `engine/examples/cool-home/` and the `woodland-reel-maker` skill for the full style rules.
- `topics.md` topic queue. Use the first unchecked topic; tick it (`- [x]`) when its post is approved. If empty, choose a topic yourself.
- `posts/<YYYY-MM-DD>-<slug>/` one folder per APPROVED post: `video.mp4`, `meta.json`, plus `video.json` + `scenes.js` sources.
- `.github/workflows/post-reels.yml` publishes approved posts to Instagram when `post_at` passes (checks every 30 min, 7–10:30 PM IST). Secret `IG_TOKEN` (optional `IG_USER_ID`) lives in repo Settings.

## Scheduled runs: Tuesday + Friday, post at 7:00 PM IST
- **Tuesday = educational Reel**: topic = first unchecked item in `topics.md` (or your pick). Same format as `posts/2026-10-30-why-you-need-an-architect`.
- **Friday = project Reel** from a real Woodland project: plan + renders/site photos from `projects/<name>/` (first folder without `used:` in info.txt). If none, ask Woodland in chat for the plan, 3–5 renders/site photos and key facts; build once he sends them. Format: hook (project name, place, plot) → plan reveal with `planReveal` + `pinArea` on 2–3 highlights → renders with `kenBurns` → closing line → end card.
- **Thursday reminders** (10:47 AM, 3:47 PM, 9:47 PM IST): scheduled task "Friday project Reel – reminder" asks Woodland for the project details until a ready, unused folder exists in `projects/`; whatever he sends is saved there. Stay silent if one is already ready.
1. Build the video in `work/<slug>/` with the engine (`./engine/build.sh setup` first).
2. **Vary the house**: never reuse the previous post's drawing. Pick `houseStyle(g,u,style)` from kerala / modern / duplex / courtyard (check `house_style` in the last posts' video.json) and draw topic-specific diagrams new each time. Record `"house_style"` and `"reel_type": "educational"|"project"` in video.json.
3. Send the MP4 + Instagram caption to Woodland with SendUserFile and a short message; ask him to reply "approve" or request changes. Use PushNotification if available.
4. NEVER commit a post to `posts/` without his explicit approval in this session. If he asks for changes, redo and resend.
5. On approval: create `posts/<date>-<slug>/` with `video.mp4`, sources, and `meta.json`:
   `{"status": "approved", "post_at": "<today>T19:00:00+05:30", "caption": "...", "video": "video.mp4", "topic": "...", "reel_type": "..."}`
   (if he approves after 6:45 PM, set post_at to now + 15 min). Tick the topic / mark the project folder used. Commit "Approve: <title>" and push to main.
6. Tell him it will go live at 7 PM. No approval that day → nothing is posted.

## Rules
- Brand: "Woodland Architects" spoken in hook + end card; captions end with a DM call to action and #woodlandarchitects #mangalore.
- Don't delete or rewrite posted folders. Don't change workflow secrets.
