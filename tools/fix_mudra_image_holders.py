import glob
import re
import os

pattern = re.compile(r'<div class="mudra-illustration">\s*<span>([^<]+)</span>\s*</div>', re.MULTILINE)
files = sorted(glob.glob(os.path.join('mudras', '*.html')))
updated = 0
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        text = f.read()

    def repl(match):
        title = match.group(1).strip()
        return (
            '<div class="mudra-illustration">\n'
            '            <img\n'
            '              src="../images/mudras/placeholder.svg"\n'
            f'              alt="{title} illustration"\n'
            '              class="mudra-image"\n'
            '              loading="lazy"\n'
            '              decoding="async"\n'
            '            />\n'
            '          </div>'
        )

    new_text = pattern.sub(repl, text)
    if new_text != text:
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(new_text)
        updated += 1

print(f'updated={updated}, total={len(files)}')
