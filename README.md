# Woodland Reels

Animated Reels and Shorts for **Woodland Architects**, Mangaluru: architect's section drawings in motion, AI narration, captions and a branded end card.

**How it runs**
1. Every other day Claude makes a new video (topic from `topics.md`, or its own pick) and sends it to Woodland for approval.
2. Only after he approves, the video is saved in `posts/` with a post time (7:30 PM IST).
3. The *Post approved Reels* GitHub Action publishes it to the Woodland Architects Instagram at that time and records the link.

**Setup:** add the Instagram posting token as the repository secret `IG_TOKEN`, then run *Actions → Post approved Reels → Run workflow* (check-only) to confirm it shows the right account.
