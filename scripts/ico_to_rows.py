"""Print an .ico as a JS array of pixel rows for src/icons.js.

One letter per pixel, '.' for transparent, the other letters being keys of
PALETTE in src/icons.js (the 16-colour Windows palette). Empty borders are
trimmed. Usage: python3 scripts/ico_to_rows.py icons/pifmgr/pifmgr_037.ico NAME
"""
import sys

from PIL import Image

KEYS = {
    (0, 0, 0): 'k', (255, 255, 255): 'w', (128, 128, 128): 's', (192, 192, 192): 'S',
    (128, 0, 0): 'r', (255, 0, 0): 'R', (128, 128, 0): 'o', (255, 255, 0): 'y',
    (0, 128, 0): 'g', (0, 255, 0): 'G', (0, 128, 128): 't', (0, 255, 255): 'c',
    (0, 0, 128): 'n', (0, 0, 255): 'b', (128, 0, 128): 'p', (255, 0, 255): 'm',
}


def rows_of(path):
    im = Image.open(path).convert('RGBA')
    rows = []
    for y in range(im.size[1]):
        row = ''
        for x in range(im.size[0]):
            r, g, b, a = im.getpixel((x, y))
            row += '.' if a == 0 else KEYS[(r, g, b)]
        rows.append(row)
    while rows and set(rows[0]) == {'.'}:
        rows.pop(0)
    while rows and set(rows[-1]) == {'.'}:
        rows.pop()
    left = min(len(r) - len(r.lstrip('.')) for r in rows)
    right = max(len(r.rstrip('.')) for r in rows)
    return [r[left:right] for r in rows]


if __name__ == '__main__':
    path, name = sys.argv[1], sys.argv[2]
    print(f'// {path}\nexport const {name} = [')
    for row in rows_of(path):
        print(f"  '{row}',")
    print(']')
