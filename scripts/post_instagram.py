"""Publish approved Reels in posts/ to Instagram via the official Graph API.

posts/<slug>/meta.json:
  {"status": "approved", "post_at": "2026-11-01T19:30:00+05:30", "caption": "...", "video": "video.mp4"}
A post is published when status == "approved" and post_at <= now. After publishing, meta.json
gets status "posted" + permalink (or status "failed" + error). Nothing else is ever posted.

Env: IG_TOKEN (required, repo secret), IG_USER_ID (optional; discovered from the token if absent).
Usage: python scripts/post_instagram.py          # publish due posts
       python scripts/post_instagram.py --check  # only verify the token and show the account
"""
import datetime as dt, glob, json, os, sys, time
import requests

G = "https://graph.facebook.com/v21.0"
TOKEN = os.environ.get("IG_TOKEN", "").strip()


def api(method, path, **kw):
    r = requests.request(method, f"{G}/{path}", params={"access_token": TOKEN, **kw.pop("params", {})}, timeout=60, **kw)
    j = r.json()
    if r.status_code >= 400 or "error" in j:
        raise RuntimeError(f"{path}: {j.get('error', j)}")
    return j


def ig_account():
    uid = os.environ.get("IG_USER_ID", "").strip()
    if uid:
        return uid, api("GET", uid, params={"fields": "username"}).get("username")
    pages = api("GET", "me/accounts", params={"fields": "name,instagram_business_account{id,username}"})["data"]
    for p in pages:
        iba = p.get("instagram_business_account")
        if iba:
            return iba["id"], iba.get("username")
    raise RuntimeError("No Instagram business account found on the Pages this token can see. "
                       "Check the IG account is Professional and linked to the Facebook Page, and the system user has the Page assigned.")


def publish(ig_id, video_path, caption):
    size = os.path.getsize(video_path)
    c = api("POST", f"{ig_id}/media", data={"media_type": "REELS", "upload_type": "resumable",
                                              "caption": caption, "share_to_feed": "true"})
    cid = c["id"]
    with open(video_path, "rb") as f:
        r = requests.post(f"https://rupload.facebook.com/ig-api-upload/v21.0/{cid}",
                          headers={"Authorization": f"OAuth {TOKEN}", "offset": "0", "file_size": str(size)},
                          data=f, timeout=600)
    if r.status_code >= 400:
        raise RuntimeError(f"upload failed: {r.text}")
    for _ in range(60):  # up to ~10 min of processing
        s = api("GET", cid, params={"fields": "status_code,status"})
        if s.get("status_code") == "FINISHED":
            break
        if s.get("status_code") in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"processing failed: {s}")
        time.sleep(10)
    else:
        raise RuntimeError("processing timed out")
    mid = api("POST", f"{ig_id}/media_publish", data={"creation_id": cid})["id"]
    link = api("GET", mid, params={"fields": "permalink"}).get("permalink")
    return mid, link


def main():
    if not TOKEN:
        sys.exit("IG_TOKEN secret is not set (repo Settings -> Secrets and variables -> Actions).")
    ig_id, user = ig_account()
    print(f"Instagram account: @{user} ({ig_id})")
    if "--check" in sys.argv:
        return
    now = dt.datetime.now(dt.timezone.utc)
    for meta_path in sorted(glob.glob("posts/*/meta.json")):
        d = os.path.dirname(meta_path)
        m = json.load(open(meta_path))
        if m.get("status") != "approved":
            continue
        if dt.datetime.fromisoformat(m["post_at"]) > now:
            print(f"{d}: scheduled for {m['post_at']}")
            continue
        print(f"{d}: publishing")
        try:
            mid, link = publish(ig_id, os.path.join(d, m.get("video", "video.mp4")), m.get("caption", ""))
            m.update(status="posted", posted_at=now.isoformat(), media_id=mid, permalink=link)
            print(f"  posted: {link}")
        except Exception as e:
            m.update(status="failed", error=str(e)[:500], failed_at=now.isoformat())
            print(f"  FAILED: {e}")
        json.dump(m, open(meta_path, "w"), indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
