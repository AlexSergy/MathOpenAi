"""Embed editorial explanations (both group-level and work-level) for local file:// use without fetch."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
group_data = json.loads((root / "notes/human_explanations.json").read_text(encoding="utf-8"))
assert len({e["id"] for e in group_data["entries"]}) == len(group_data["entries"])

works_path = root / "notes/work_explanations.json"
works_data = json.loads(works_path.read_text(encoding="utf-8")) if works_path.exists() else {"works": {}}

progress_path = root / "notes/progress.json"
progress_data = json.loads(progress_path.read_text(encoding="utf-8")) if progress_path.exists() else {}

combined = {
    "coverage": f"Каталог, {len(group_data['entries'])} вводных разборов групп и {len(works_data.get('works', {}))} детальных разборов отдельных рукописей. Независимая проверка доказательств не выполнялась.",
    "meta": {
        "total_works": 719,
        "explained_works_count": len(works_data.get("works", {})),
        "total_groups": 372,
        "explained_groups_count": len(group_data["entries"]),
        "last_batch": progress_data.get("batches", [{}])[-1].get("batch_id", "")
    },
    "entries": group_data["entries"],
    "groups": group_data["entries"],
    "works": works_data.get("works", {})
}

(root / "assets/human-data.js").write_text(
    "window.ATLAS_HUMAN = " + json.dumps(combined, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8"
)
print(f"Built human-data.js: {len(combined['entries'])} group entries, {len(combined['works'])} work entries.")
