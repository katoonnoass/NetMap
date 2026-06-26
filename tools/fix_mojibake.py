#!/usr/bin/env python3
"""Fix double-encoded UTF-8 mojibake in text files.

Corrects text where UTF-8 bytes were misinterpreted as Latin-1 or CP1252
and then re-saved as UTF-8. Handles mixed encoding scenarios.

Examples:
    CÃ\x81LCULO AUTOMÃ\x81TICO  ->  CÁLCULO AUTOMÁTICO
    FUNÃ‡Ã•ES             ->  FUNÇÕES
    Â©                    ->  ©
"""

import sys
import itertools

_CP1252_REVERSE = {
    0x20AC: 0x80,  # €
    0x201A: 0x82,  # ‚
    0x0192: 0x83,  # ƒ
    0x201E: 0x84,  # „
    0x2026: 0x85,  # …
    0x2020: 0x86,  # †
    0x2021: 0x87,  # ‡
    0x02C6: 0x88,  # ˆ
    0x2030: 0x89,  # ‰
    0x0160: 0x8A,  # Š
    0x2039: 0x8B,  # ‹
    0x0152: 0x8C,  # Œ
    0x017D: 0x8E,  # Ž
    0x2018: 0x91,  # '
    0x2019: 0x92,  # '
    0x201C: 0x93,  # "
    0x201D: 0x94,  # "
    0x2022: 0x95,  # •
    0x2013: 0x96,  # –
    0x2014: 0x97,  # —
    0x02DC: 0x98,  # ˜
    0x2122: 0x99,  # ™
    0x0161: 0x9A,  # š
    0x203A: 0x9B,  # ›
    0x0153: 0x9C,  # œ
    0x017E: 0x9E,  # ž
    0x0178: 0x9F,  # Ÿ
}


def _char_to_byte(ch):
    code = ord(ch)
    if code < 0x100:
        return code
    return _CP1252_REVERSE.get(code)


def fix_mojibake(text):
    out = bytearray()
    for ch in text:
        byte_val = _char_to_byte(ch)
        if byte_val is not None:
            out.append(byte_val)
        else:
            out.extend(ch.encode('utf-8'))

    try:
        fixed = out.decode('utf-8')
    except UnicodeDecodeError:
        return text

    return fixed if fixed != text else text


def _count_diffs(original, fixed):
    return sum(1 for a, b in itertools.zip_longest(original, fixed, fillvalue='') if a != b)


def main():
    dry_run = False
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    if len(args) != 1:
        print("Usage: fix_mojibake.py [--dry-run] <filepath>")
        sys.exit(1)
    dry_run = '--dry-run' in sys.argv

    path = args[0]

    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    fixed = fix_mojibake(original)

    if fixed != original:
        if dry_run:
            print(f"Would fix {_count_diffs(original, fixed)} characters in {path}")
        else:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"Fixed {_count_diffs(original, fixed)} characters in {path}")
    else:
        print(f"No changes needed in {path}")


if __name__ == '__main__':
    main()
