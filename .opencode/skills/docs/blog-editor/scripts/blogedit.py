#!/usr/bin/env python3
"""Fetch, edit, publish, and verify a Blogger post in as few calls as possible.

Usage:
  blogedit.py status
  blogedit.py fetch
  blogedit.py push
  blogedit.py apply edits.json [--dry]
  blogedit.py apply edits.json --dry   # preview only, no publish

edits.json format:
  [ {"old": "teks lama", "new": "teks baru"},
    {"old": "teks lama", "new": "teks baru", "all": true} ]
"""

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, "/root/.config/gblog")
from gauth import get_token

BLOG_ID = "7100036323484833731"
POST_ID = "5568284433876837160"
API = f"https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}/posts/{POST_ID}"
WORK_FILE = Path("/tmp/opencode/blog-work.html")


def _request(url, data=None, method="GET", token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    return json.load(urllib.request.urlopen(req, timeout=60))


def live_content(token):
    return _request(API, token=token)["content"]


def stats(html):
    return f"{len(html)} chars, {html.count('<img ')} gambar"


def publish(token, html):
    body = json.dumps({"content": html}).encode()
    _request(API, data=body, method="PUT", token=token)


def cmd_status():
    token = get_token()
    post = _request(API, token=token)
    print(f"Auth  : OK")
    print(f"Judul : {post['title']}")
    print(f"URL   : {post['url']}")
    print(f"Konten: {stats(post['content'])}")
    print(f"Kerja : {WORK_FILE}")


def cmd_fetch():
    token = get_token()
    html = live_content(token)
    WORK_FILE.write_text(html)
    print(f"Fetched -> {WORK_FILE} ({stats(html)})")


def cmd_push():
    token = get_token()
    html = WORK_FILE.read_text()
    publish(token, html)
    verify = live_content(token)
    print(f"Pushed  ({stats(html)})")
    print(f"Verify  : {'OK' if verify == html else 'BEDA'} ({stats(verify)})")


def cmd_apply(path, dry=False):
    token = get_token()
    edits = json.loads(Path(path).read_text())
    html = live_content(token)
    original_imgs = html.count("<img ")

    for i, edit in enumerate(edits, 1):
        old, new = edit["old"], edit["new"]
        n = html.count(old)
        if n == 0:
            print(f"GAGAL #{i}: teks tidak ditemukan -> {old[:70]!r}")
            sys.exit(1)
        if n > 1 and not edit.get("all"):
            print(f"GAGAL #{i}: cocok {n}x (tambah \"all\": true kalau memang mau semua) -> {old[:70]!r}")
            sys.exit(1)
        html = html.replace(old, new)
        print(f"OK #{i}: {n}x -> {old[:55]!r}")

    if html.count("<img ") != original_imgs:
        print("GAGAL: jumlah gambar berubah. Tidak ada yang dipublish.")
        sys.exit(1)

    if dry:
        print(f"DRY RUN — tidak dipublish. Hasil: {stats(html)}")
        return

    publish(token, html)
    verify = live_content(token)
    missing = [e["new"] for e in edits if e["new"] not in verify]
    print(f"Pushed  ({stats(html)})")
    print(f"Verify  : {'OK' if not missing and verify == html else 'BEDA ' + str(missing)}")


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    cmd = args[0]
    if cmd == "status":
        cmd_status()
    elif cmd == "fetch":
        cmd_fetch()
    elif cmd == "push":
        cmd_push()
    elif cmd == "apply":
        if len(args) < 2:
            print("Butuh file edits.json")
            sys.exit(1)
        cmd_apply(args[1], dry="--dry" in args)
    else:
        print(f"Command tidak dikenal: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
