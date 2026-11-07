"""Create web-sized copies of the supplied drone images and masks."""

from pathlib import Path

from PIL import Image


IMAGE_ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
EXAMPLES = ("DJI_20260416114316_0027_D", "DJI_20260521145932_0042_D")
PREVIEW_WIDTH = 1920


def build_previews():
    for example in EXAMPLES:
        directory = IMAGE_ROOT / example
        for suffix, extension in (("", ".JPG"), ("_mask_preview", ".png"), ("_binary_mask", ".png")):
            source = directory / f"{example}{suffix}{extension}"
            with Image.open(source) as image:
                size = (PREVIEW_WIDTH, round(image.height * PREVIEW_WIDTH / image.width))
                if suffix == "_binary_mask":
                    preview = image.resize(size, Image.Resampling.NEAREST)
                    destination = directory / f"{example}{suffix}_web.png"
                    preview.save(destination, optimize=True)
                else:
                    preview = image.convert("RGB").resize(size, Image.Resampling.LANCZOS)
                    destination = directory / f"{example}{suffix}_web.webp"
                    preview.save(destination, quality=88, method=6)
            print(f"{destination.relative_to(IMAGE_ROOT)}: {destination.stat().st_size:,} bytes")


if __name__ == "__main__":
    build_previews()
