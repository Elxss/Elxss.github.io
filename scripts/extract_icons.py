"""Extract every icon group of a Windows PE file (.dll/.exe) as .ico files.

Minimal PE resource reader: RT_GROUP_ICON (14) entries list the images of
one icon; each image is an RT_ICON (3) resource. An .ico file is those images
behind a header whose entries are the group entries plus data offsets.
"""
import os
import struct
import sys

RT_ICON, RT_GROUP_ICON = 3, 14


def read_resources(data):
    pe = struct.unpack_from('<I', data, 0x3C)[0]
    assert data[pe:pe + 4] == b'PE\0\0', 'not a PE file'
    nsec = struct.unpack_from('<H', data, pe + 6)[0]
    optsize = struct.unpack_from('<H', data, pe + 20)[0]
    opt = pe + 24
    magic = struct.unpack_from('<H', data, opt)[0]
    ddir = opt + (96 if magic == 0x10B else 112)  # PE32 / PE32+
    rsrc_rva = struct.unpack_from('<I', data, ddir + 2 * 8)[0]
    sections = []
    for i in range(nsec):
        off = opt + optsize + i * 40
        vsize, va, rawsize, rawptr = struct.unpack_from('<IIII', data, off + 8)
        sections.append((va, max(vsize, rawsize), rawptr))

    def rva2off(rva):
        for va, size, raw in sections:
            if va <= rva < va + size:
                return rva - va + raw
        raise ValueError(hex(rva))

    base = rva2off(rsrc_rva)

    def entries(off):
        named, ids = struct.unpack_from('<HH', data, base + off + 12)
        for i in range(named + ids):
            name, target = struct.unpack_from('<II', data, base + off + 16 + i * 8)
            yield name, target

    out = {}  # (type, id) -> bytes (first language)
    for rtype, t in entries(0):
        if rtype & 0x80000000 or rtype not in (RT_ICON, RT_GROUP_ICON):
            continue
        for rid, n in entries(t & 0x7FFFFFFF):
            for _lang, leaf in entries(n & 0x7FFFFFFF):
                rva, size = struct.unpack_from('<II', data, base + leaf)
                o = rva2off(rva)
                out[(rtype, rid & 0x7FFFFFFF)] = data[o:o + size]
                break
    return out


def main(src, dest):
    data = open(src, 'rb').read()
    res = read_resources(data)
    os.makedirs(dest, exist_ok=True)
    stem = os.path.splitext(os.path.basename(src))[0].lower()
    count = 0
    for (rtype, gid), grp in sorted(res.items()):
        if rtype != RT_GROUP_ICON:
            continue
        n = struct.unpack_from('<H', grp, 4)[0]
        images = []
        for i in range(n):
            w, h, colors, _r, planes, bits, _size, iid = struct.unpack_from('<BBBBHHIH', grp, 6 + i * 14)
            img = res.get((RT_ICON, iid))
            if img:
                images.append((w, h, colors, planes, bits, img))
        header = struct.pack('<HHH', 0, 1, len(images))
        offset = 6 + 16 * len(images)
        table, body = b'', b''
        for w, h, colors, planes, bits, img in images:
            table += struct.pack('<BBBBHHII', w, h, colors, 0, planes, bits, len(img), offset + len(body))
            body += img
        with open(os.path.join(dest, f'{stem}_{gid:03d}.ico'), 'wb') as f:
            f.write(header + table + body)
        count += 1
    print(f'{count} icons -> {dest}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
