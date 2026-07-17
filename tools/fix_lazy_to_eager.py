import glob
import os

files = glob.glob(os.path.join('**', '*.html'), recursive=True)
updated = 0
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        text = f.read()
    new_text = text.replace('loading="lazy"', 'loading="eager"')
    if new_text != text:
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(new_text)
        updated += 1
print(f'updated={updated}, total={len(files)}')
