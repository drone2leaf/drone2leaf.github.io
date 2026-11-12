"""Create web-sized copies of all gallery examples or selected image IDs."""

import argparse
from pathlib import Path

from PIL import Image


IMAGE_ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
EXAMPLES = ("DJI_20260416114316_0027_D", "DJI_20260521145932_0042_D")
PREVIEW_WIDTH = 1920


def build_previews(examples=EXAMPLES):
    for example in examples:
        directory = IMAGE_ROOT / example
        sources = [
            (suffix, directory / f"{example}{suffix}{extension}")
            for suffix, extension in (("", ".JPG"), ("_mask_preview", ".png"), ("_binary_mask", ".png"))
        ]
        # Check alignment before replacing any of this example's web copies.
        source_size = None
        for _, source in sources:
            with Image.open(source) as image:
                if source_size is not None and image.size != source_size:
                    raise ValueError(f"{source.name} has size {image.size}; expected {source_size}")
                source_size = image.size

        for suffix, source in sources:
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--example", action="append", choices=EXAMPLES, dest="examples",
        help="Regenerate only this image ID; repeat to select multiple examples. Defaults to both.",
    )
    args = parser.parse_args()
    try:
        build_previews(args.examples or EXAMPLES)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Could not build web previews: {error}\n")
