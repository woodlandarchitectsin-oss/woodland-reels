"""Snapshot @woodland_architects growth: followers, posts, and recent Reels' reach/plays/saves/shares.
Writes stats/latest.json and appends a line to stats/history.csv. Env: IG_TOKEN, IG_USER_ID."""
import csv, datetime as dt, json, os, requests
G = "https://graph.facebook.com/v21.0"; T = os.environ["IG_TOKEN"]; U = os.environ["IG_USER_ID"]
def get(path, **p):
    r = requests.get(f"{G}/{path}", params={"access_token": T, **p}, timeout=60).json()
    if "error" in r: raise RuntimeError(r["error"])
    return r
acct = get(U, fields="username,followers_count,follows_count,media_count")
media = get(f"{U}/media", fields="id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count", limit=25)["data"]
for m in media:
    try:
        mt = "reach,saved,shares,total_interactions" + (",views" if m.get("media_product_type") == "REELS" else "")
        ins = get(f"{m['id']}/insights", metric=mt)["data"]
        m["insights"] = {i["name"]: i["values"][0]["value"] for i in ins}
    except Exception as e:
        m["insights_error"] = str(e)[:200]
    m["caption"] = (m.get("caption") or "")[:80]
try:
    day = get(f"{U}/insights", metric="reach,profile_views,follower_count", period="day")["data"]
    acct["daily"] = {i["name"]: i["values"] for i in day}
except Exception as e:
    acct["daily_error"] = str(e)[:200]
checks = {}
import glob
for mp in glob.glob("posts/*/meta.json"):
    pm = json.load(open(mp))
    if pm.get("media_id"):
        try: checks[mp] = get(pm["media_id"], fields="id,permalink,timestamp,media_product_type,like_count")
        except Exception as e: checks[mp] = {"error": str(e)[:300]}
acct["post_checks"] = checks
now = dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).isoformat(timespec="minutes")
os.makedirs("stats", exist_ok=True)
json.dump({"at": now, "account": acct, "media": media}, open("stats/latest.json", "w"), indent=2, ensure_ascii=False)
new = not os.path.exists("stats/history.csv")
with open("stats/history.csv", "a", newline="") as f:
    w = csv.writer(f)
    if new: w.writerow(["at", "followers", "following", "posts"])
    w.writerow([now, acct.get("followers_count"), acct.get("follows_count"), acct.get("media_count")])
print(f"@{acct['username']}: {acct.get('followers_count')} followers, {acct.get('media_count')} posts")
