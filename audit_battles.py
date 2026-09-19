from pathlib import Path
for path in sorted(Path('event results').glob('*.txt')):
    text = path.read_text(encoding='utf-8')
    if ';' not in text:
        print(f'{path.name}: NO SEMICOLON')
        continue
    parts = text.split(';')
    if len(parts) != 2:
        print(f'{path.name}: split count {len(parts)}')
        continue
    results, battles = [p.strip() for p in parts]
    if not battles:
        print(f'{path.name}: NO BATTLE DATA')
        continue
    lines = [ln.strip() for ln in battles.splitlines() if ln.strip()]
    if not lines:
        print(f'{path.name}: EMPTY BATTLE SECTION')
        continue
    bad = []
    for i, line in enumerate(lines, 1):
        if ',' not in line:
            bad.append((i, line))
        else:
            a, b = [p.strip() for p in line.split(',', 1)]
            if not a or not b:
                bad.append((i, line))
    if bad:
        print(f'{path.name}: bad battle lines {bad[:5]}')
