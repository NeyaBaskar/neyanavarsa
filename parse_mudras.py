import os
from html.parser import HTMLParser
import json

class MudraParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current_tag = None
        self.current_data = []
        self.title = None
        self.current_section = None
        self.sections = {}
        self.current_list = []

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        if tag in ('h1', 'h2', 'p', 'li'):
            self.current_data = []
        if tag == 'img':
            attrs = dict(attrs)
            if attrs.get('class') == 'mudra-image':
                self.sections['image'] = attrs.get('src', '')

    def handle_endtag(self, tag):
        text = ''.join(self.current_data).strip()
        if tag == 'h1':
            self.title = text
        elif tag == 'h2':
            self.current_section = text
            if self.current_section:
                self.sections.setdefault(self.current_section, [])
        elif tag == 'p':
            if self.current_section:
                self.sections[self.current_section].append(text)
        elif tag == 'li':
            self.current_list.append(text)
        elif tag == 'ul':
            if self.current_section:
                self.sections[self.current_section] = self.current_list[:]
            self.current_list = []
            self.current_section = None
        self.current_data = []

    def handle_data(self, data):
        if self.current_tag in ('h1', 'h2', 'p', 'li'):
            self.current_data.append(data)

mudras = []
root = os.path.dirname(__file__)
path = os.path.join(root, 'mudras')
for fname in sorted(os.listdir(path)):
    if not fname.endswith('.html'):
        continue
    fullpath = os.path.join(path, fname)
    with open(fullpath, 'r', encoding='utf-8') as f:
        html = f.read()
    parser = MudraParser()
    parser.feed(html)
    name = parser.title or os.path.splitext(fname)[0]
    if parser.sections.get('Meaning & Symbolism'):
        meaning = ' '.join(parser.sections['Meaning & Symbolism'])
    else:
        meaning = ''
    if parser.sections.get('Usage in Performance'):
        usage = ' '.join(parser.sections['Usage in Performance'])
    else:
        usage = ''
    image = parser.sections.get('image', '')
    if image and not image.startswith('http'):
        image = os.path.join('mudras', os.path.basename(image))
    mudras.append({
        'name': name,
        'link': f'mudras/{fname}',
        'image': image,
        'meaning': meaning,
        'usage': usage
    })
print(json.dumps(mudras, ensure_ascii=False, indent=2))
