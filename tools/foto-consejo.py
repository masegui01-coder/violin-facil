"""Prepara una imagen para los consejos: recorte centrado a 4:3, 960x720 y WebP ligero para el móvil.

Uso:  python tools/foto-consejo.py <imagen> <ilustración> <paso 1-3> [--top 0.0-1.0]
      python tools/foto-consejo.py descargas/sax.png sax-posture 1
--top elige qué parte se queda al recortar en vertical (0 = arriba, 0.5 = centro, 1 = abajo).
Guarda img/consejos/fotos/<ilustración>-<paso>.webp e imprime la línea para js/tips-photos.js.
"""
import argparse
import pathlib
import sys

from PIL import Image, ImageOps

W, H = 960, 720
OUT = pathlib.Path(__file__).resolve().parent.parent / 'img' / 'consejos' / 'fotos'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('art')
    ap.add_argument('step', type=int, choices=[1, 2, 3])
    ap.add_argument('--top', type=float, default=0.5)
    args = ap.parse_args()

    src = pathlib.Path(args.image)
    if not src.is_file():
        sys.exit(f'No encuentro la imagen: {src}')
    img = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    img = ImageOps.fit(img, (W, H), method=Image.LANCZOS, centering=(0.5, max(0.0, min(1.0, args.top))))
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f'{args.art}-{args.step}.webp'
    img.save(dest, 'WEBP', quality=82, method=6)
    rel = dest.relative_to(OUT.parent.parent.parent).as_posix()
    print(f'{dest} ({dest.stat().st_size // 1024} KB)')
    print(f"  '{args.art}': {{ {args.step - 1}: {{ src: '{rel}', marks: [] }} }},")


if __name__ == '__main__':
    main()
