import os
import io

EVENT_FILES = [
  'Unicon24.txt','Unicon26.txt','Unicon22.txt','Unicon18.txt','Unicon16.txt','Unicon14.txt',
  'EUCW26.txt','EUCW25.txt','EUCW24.txt','EUCS23.txt','EUCS25.txt','CFM25.txt',
  'NAUCC26.txt','NAUCC25.txt','LAUCC25.txt','GUC25.txt','GUC24.txt','GUC23.txt',
  'GUC22.txt','BUC24.txt','BUC25.txt','BUC23.txt','BUC22.txt','GUC26.txt'
]

def extract_names(text):
    if not text:
        return []
    parts = [p.strip() for p in text.split('|') if p.strip()]
    names = set()
    for block in parts:
        sem = block.find(';')
        results = block if sem == -1 else block[:sem]
        for line in results.splitlines():
            line = line.strip()
            if not line:
                continue
            # remove leading place numbers like '1 ', '1.' or '1)'
            import re
            m = re.match(r'^\s*(\d+)[\.)]?\s*(.+)$', line)
            name = m.group(2).strip() if m else line
            if name:
                names.add(name)
    return names

def read_existing(path):
    d = {}
    if not os.path.exists(path):
        return d
    with io.open(path, 'r', encoding='utf8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split(',') if p.strip()]
            if parts:
                d[parts[0]] = line
    return d

def main():
    cwd = os.getcwd()
    collected = set()
    for fn in EVENT_FILES:
        fp = os.path.join(cwd, fn)
        if not os.path.exists(fp):
            continue
        with io.open(fp, 'r', encoding='utf8') as f:
            txt = f.read()
        collected.update(extract_names(txt))

    riders_file = os.path.join(cwd, 'riders_all.txt')
    existing = read_existing(riders_file)

    for name in collected:
        if name not in existing:
            existing[name] = name

    merged = [existing[k] for k in sorted(existing.keys(), key=lambda s: s.lower())]
    with io.open(riders_file, 'w', encoding='utf8') as f:
        f.write('\r\n'.join(merged) + '\r\n')

    print('Wrote', len(merged), 'entries to', riders_file)

if __name__ == '__main__':
    main()
