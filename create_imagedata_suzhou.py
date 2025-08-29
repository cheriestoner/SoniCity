#!/usr/bin/env python3
import os
import csv

USERS = ["Bingqing", "Jiachen", "Chao", "Xuehua"]
BASE_DIR = os.getcwd()
USERS_DIR = os.path.join(BASE_DIR, "users")
OUTPUT_CSV = os.path.join(BASE_DIR, "imagedata-suzhou.csv")

# Map common audio extensions
AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".webm", ".mp4"}
IMG_EXTS = {".jpg", ".jpeg", ".png"}


def find_files_for_user(user_dir):
    # Collect files by base name (Name-1, Name-2, etc.)
    by_base = {}
    for name in os.listdir(user_dir):
        if name.startswith('.'):  # skip hidden
            continue
        path = os.path.join(user_dir, name)
        if not os.path.isfile(path):
            continue
        base, ext = os.path.splitext(name)
        ext = ext.lower()
        entry = by_base.setdefault(base, {"img": None, "audio": None, "txt": None})
        if ext in IMG_EXTS:
            entry["img"] = os.path.join("users", os.path.basename(user_dir), name)
        elif ext in AUDIO_EXTS:
            entry["audio"] = os.path.join("users", os.path.basename(user_dir), name)
        elif ext == ".txt":
            entry["txt"] = os.path.join(user_dir, name)
    return by_base


def read_describ_from_txt(txt_path):
    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            text = f.read().strip()
        # Normalize separators -> semicolon + space
        # Replace newlines and commas with semicolons
        normalized = text.replace("\n", "; ")
        normalized = "; ".join([p.strip() for p in normalized.replace(",", ";").split(";") if p.strip()])
        return normalized
    except Exception:
        return ""


def main():
    rows = []
    for user in USERS:
        user_dir = os.path.join(USERS_DIR, user)
        if not os.path.isdir(user_dir):
            print(f"Warning: missing user directory {user_dir}")
            continue
        entries = find_files_for_user(user_dir)
        for base, parts in sorted(entries.items()):
            img = parts["img"]
            audio = parts["audio"]
            describ = read_describ_from_txt(parts["txt"]) if parts["txt"] else ""
            if not img and not audio:
                continue
            title = f"{user} | {base}"
            # bgc uses same image path
            rows.append({
                "src": img or "",
                "bgc": img or "",
                "audio": audio or "",
                "describ": describ,
                "title": title,
            })

    # Write CSV without x,y,site columns
    fieldnames = ["src", "bgc", "audio", "describ", "title"]
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
