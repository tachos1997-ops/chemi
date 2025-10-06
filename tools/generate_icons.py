"""Generate minimalist SVG icons for every Elemental Nexus discovery."""
from __future__ import annotations

import hashlib
from pathlib import Path

from shared import base_elements, combos

OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'nexus' / 'static' / 'nexus' / 'icons'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def gradient_for(name: str) -> tuple[str, str]:
    digest = hashlib.sha1(name.encode('utf-8')).hexdigest()
    hue = int(digest[:2], 16) % 360
    hue2 = (hue + 45) % 360
    return (
        f'hsl({hue} 80% 55%)',
        f'hsl({hue2} 85% 45%)',
    )


def svg_for(name: str) -> str:
    start, end = gradient_for(name)
    label = name[:3].upper()
    return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
  <defs>
    <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='{start}' />
      <stop offset='100%' stop-color='{end}' />
    </linearGradient>
  </defs>
  <rect x='8' y='8' width='112' height='112' rx='24' fill='url(#g)'/>
  <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
        font-family='Verdana, sans-serif' font-size='40' fill='rgba(10,12,30,0.9)'>{label}</text>
</svg>"""


def main() -> None:
    seen: set[str] = set()
    for element in base_elements():
        seen.add(element)
    for combo in combos():
        seen.add(combo.result)
        seen.update(combo.ingredients)

    for name in sorted(seen):
        safe = ''.join(ch for ch in name if ch.isalnum()) or 'Element'
        path = OUTPUT_DIR / f"{safe}.svg"
        path.write_text(svg_for(name), encoding='utf-8')

    print(f"Generated {len(seen)} icons in {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
