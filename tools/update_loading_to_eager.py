import glob
from pathlib import Path

files = glob.glob('**/*.html', recursive=True) + glob.glob('**/*.js', recursive=True)
count = 0
for path_str in files:
    path = Path(path_str)
    text = path.read_text(encoding='utf-8')
    new_text = text.replace('loading="lazy"', 'loading="eager"')
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        count += 1
print(f'updated={count} files')
