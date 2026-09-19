import re
from pathlib import Path

root = Path(r"c:\Users\benni\Desktop\unicycling\ranking project")
notes_dir = root / "rider notes"
notes_dir.mkdir(exist_ok=True)

names = set()
for path in sorted(root.glob('*.txt')):
    if path.name.lower() in {'create_notes.py'}:
        continue
    try:
        with path.open('r', encoding='utf-8') as fh:
            for raw in fh:
                line = raw.strip()
                if not line:
                    continue
                if ',' in line or ';' in line:
                    continue
                if re.fullmatch(r"[A-Za-zÀ-ÿ\-\.\s]+", line):
                    names.add(line)
    except Exception:
        pass

for name in sorted(names):
    safe_name = re.sub(r"[<>:\"/\\|?*\x00-\x1f]+", "_", name).rstrip('.')
    if not safe_name:
        safe_name = 'rider'
    file_path = notes_dir / f"{safe_name}.txt"
    if not file_path.exists():
        file_path.write_text(f"Notes for {name}\n\nAdd session notes here.\n", encoding='utf-8')

print(f"Created {len(list(notes_dir.glob('*.txt')))} note files")
for p in sorted(notes_dir.glob('*.txt')):
    print(p.name)
