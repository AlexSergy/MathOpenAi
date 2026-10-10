"""
Helper utility for subagents to save and validate batches of manuscript explanations.
Prevents file collisions by writing each worker's output to worker_{worker_id}.json,
and provides an automated merger that updates work_explanations.json and progress.json.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
catalog_path = root / "catalog.json"
works_file = root / "notes/work_explanations.json"
progress_file = root / "notes/progress.json"

with open(catalog_path, "r", encoding="utf-8") as f:
    cat = json.load(f)
VALID_WORK_IDS = {w["id"]: w for w in cat["works"]}
VALID_GROUP_IDS = {g["id"]: g for g in cat["groups"]}

REQUIRED_FIELDS = [
    "work_id", "group_id", "area", "title_original", "title_ru", "role",
    "question", "example", "claim", "novelty", "benefit", "applications",
    "limit", "action", "source_path", "source_pages", "read_scope",
    "verification_status", "dependencies"
]

def validate_work(w):
    for f in REQUIRED_FIELDS:
        if f not in w or not w[f] and not isinstance(w[f], list):
            raise ValueError(f"Work {w.get('work_id')} missing or empty field: {f}")
    wid = w["work_id"]
    if wid not in VALID_WORK_IDS:
        raise ValueError(f"Unknown work_id: {wid}")
    gid = w["group_id"]
    if gid not in VALID_GROUP_IDS:
        raise ValueError(f"Unknown group_id: {gid}")
    # Verify PDF exists on disk
    cat_w = VALID_WORK_IDS[wid]
    pdf_path = root.parent / "math" / cat_w["pdf"]
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found for {wid}: {pdf_path}")
    return True

def save_worker_batch(worker_id: str, new_works: dict):
    """Save or update batch for a specific worker."""
    worker_file = root / f"notes/worker_{worker_id}.json"
    if worker_file.exists():
        with open(worker_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"worker_id": worker_id, "works": {}}

    for wid, w in new_works.items():
        validate_work(w)
        data["works"][wid] = w

    with open(worker_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Worker {worker_id}: saved {len(data['works'])} works total to {worker_file.name}")
    return len(data["works"])

def merge_all_workers():
    """Merge master work_explanations.json with all worker_*.json files and update progress.json."""
    if works_file.exists():
        with open(works_file, "r", encoding="utf-8") as f:
            master = json.load(f).get("works", {})
    else:
        master = {}

    worker_files = list(root.glob("notes/worker_*.json"))
    added_from_workers = 0
    for wf in worker_files:
        with open(wf, "r", encoding="utf-8") as f:
            wdata = json.load(f).get("works", {})
            for wid, w in wdata.items():
                validate_work(w)
                master[wid] = w
                added_from_workers += 1

    # Save master
    with open(works_file, "w", encoding="utf-8") as f:
        json.dump({
            "meta": {
                "total_works": 719,
                "explained_works_count": len(master),
                "last_update": "merged_workers"
            },
            "works": master
        }, f, ensure_ascii=False, indent=2)

    # Save progress
    explained_gids = sorted(list({w["group_id"] for w in master.values()}))
    with open(progress_file, "r", encoding="utf-8") as f:
        prog = json.load(f)

    prog["explained_works_count"] = len(master)
    prog["explained_groups_count"] = len(explained_gids)
    prog["work_ids_completed"] = sorted(list(master.keys()))
    prog["group_ids_completed"] = explained_gids

    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(prog, f, ensure_ascii=False, indent=2)

    # Rebuild assets/human-data.js
    import subprocess
    subprocess.run(["python3", str(root / "notes/build_human_data.py")], check=True)

    print(f"MERGED SUCCESS: {len(master)} / 719 works explained across {len(explained_gids)} groups.")
    return len(master)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "merge":
        merge_all_workers()
    else:
        print("Usage: python3 batch_worker_helper.py merge")
