"""Build the 15-second coloured scan and 10-second black-and-white scan GIFs."""

import argparse
import json
import os
from pathlib import Path

from PIL import GifImagePlugin, Image, ImageChops, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ("DJI_20260416114316_0027_D", "DJI_20260521145932_0042_D")
WIDTH, HEADER, FOOTER = 1920, 108, 160
FRAME_MS, GLOW, LINE = 80, 16, 4
FOREST, LIME, SOFT = "#071713", "#bcf2a1", "#abc1b4"


def quantize(image):
    return image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


class PatchGIF:
    """Retain each revealed strip's palette instead of reducing the whole scene."""

    def __init__(self, path, first, duration):
        self.file = path.open("wb")
        indexed = quantize(first)
        header, _ = GifImagePlugin.getheader(
            indexed, info={"loop": 0, "duration": duration, "optimize": False}
        )
        for block in header:
            self.file.write(block)
        self.add(indexed, (0, 0), duration, local_palette=False)

    def add(self, image, offset, duration, local_palette=True):
        indexed = image if image.mode == "P" else quantize(image)
        for block in GifImagePlugin.getdata(
            indexed, offset=offset, duration=duration, disposal=1,
            include_color_table=local_palette,
        ):
            self.file.write(block)

    def __enter__(self):
        return self

    def __exit__(self, error_type, error, traceback):
        if error_type is None:
            self.file.write(b";")
        self.file.close()


class Scene:
    def __init__(self, example):
        directory = ROOT / "assets" / "images" / example
        photos = []
        original_size = None
        for suffix, extension in (("", ".JPG"), ("_mask_preview", ".png"), ("_binary_mask", ".png")):
            source = directory / f"{example}{suffix}{extension}"
            with Image.open(source) as image:
                if original_size is None:
                    original_size = image.size
                    self.photo_height = round(image.height * WIDTH / image.width)
                if image.size != original_size:
                    raise ValueError(f"{source.name} has size {image.size}; expected {original_size}")
                resampling = Image.Resampling.NEAREST if suffix == "_binary_mask" else Image.Resampling.LANCZOS
                photos.append(image.convert("RGB").resize((WIDTH, self.photo_height), resampling))
        self.original, self.colour, self.binary = photos
        self.height = HEADER + self.photo_height + FOOTER
        self.footer_top = HEADER + self.photo_height
        with Image.open(ROOT / "assets" / "images" / "d2l-logo.png") as image:
            self.logo = image.convert("RGB").resize((76, 76), Image.Resampling.LANCZOS)
        self.fonts = {}

    def font(self, size, bold=False):
        key = size, bold
        if key not in self.fonts:
            windows_fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
            candidates = [
                str(windows_fonts / ("seguisb.ttf" if bold else "segoeui.ttf")),
                "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
            ]
            for candidate in candidates:
                try:
                    self.fonts[key] = ImageFont.truetype(candidate, size * 2)
                    break
                except OSError:
                    continue
            else:
                raise OSError("Install Segoe UI or DejaVu Sans fonts to render the GIF labels.")
        return self.fonts[key]

    def decorate(self, photo, stage, label, labels):
        frame = Image.new("RGB", (WIDTH, self.height), FOREST)
        frame.paste(photo, (0, HEADER))
        frame.paste(self.logo, (34, 16))
        draw = ImageDraw.Draw(frame)
        draw.text((136, 26), "Drone2Leaf", font=self.font(22, True), fill=LIME)
        draw.text((WIDTH - 40, 32), label, font=self.font(20, True), fill="#ffffff", anchor="ra")
        top = self.footer_top
        for index, text in enumerate(labels):
            left = index * WIDTH // len(labels)
            right = (index + 1) * WIDTH // len(labels)
            if index == stage:
                draw.rectangle((left, top, right - 1, self.height - 1), fill="#1a392a")
                draw.rectangle((left, self.height - 8, right - 1, self.height - 1), fill=LIME)
            draw.line((left, top, right, top), fill="#244134", width=2)
            if index:
                draw.line((left, top, left, self.height), fill="#244134", width=2)
            draw.text((left + 36, top + 26), f"0{index + 1}", font=self.font(14), fill=SOFT)
            draw.text((left + 36, top + 68), text, font=self.font(21, index == stage),
                      fill=LIME if index == stage else SOFT)
        return frame


def add_scan(gif, scene, before, after, stage, label, labels, scan_ms):
    before_frame = scene.decorate(before, stage, label, labels)
    after_frame = scene.decorate(after, stage, label, labels)
    count = scan_ms // FRAME_MS
    previous = 0
    for index in range(1, count + 1):
        position = round(scene.photo_height * index / count)
        # Erase the previous scan line and glow as the next strip is revealed.
        top = 0 if index == 1 else HEADER + max(0, previous - GLOW)
        bottom = HEADER + min(scene.photo_height, position + LINE)
        patch = before_frame.crop((0, top, WIDTH, bottom))
        reveal_bottom = min(bottom, HEADER + position)
        patch.paste(after_frame.crop((0, top, WIDTH, reveal_bottom)), (0, 0))
        if index < count:
            line_y = HEADER + position - top
            glow = Image.new("RGBA", patch.size)
            draw = ImageDraw.Draw(glow)
            for offset in range(1, GLOW + 1):
                alpha = round(40 * (1 - offset / (GLOW + 1)))
                draw.line((0, line_y - offset, WIDTH, line_y - offset), fill=(197, 255, 162, alpha))
            draw.line((0, line_y, WIDTH, line_y), fill=(197, 255, 162, 255), width=LINE)
            patch = Image.alpha_composite(patch.convert("RGBA"), glow).convert("RGB")
        gif.add(patch, (0, top), FRAME_MS)
        previous = position


def add_hold(gif, scene, photo, stage, label, labels, duration):
    final = scene.decorate(photo, stage, label, labels)
    # Updating only the UI keeps the photo strips' separate palettes intact.
    gif.add(final.crop((0, scene.footer_top, WIDTH, scene.height)), (0, scene.footer_top), FRAME_MS)
    gif.add(final.crop((0, 0, WIDTH, HEADER)), (0, 0), duration - FRAME_MS)


def verify_gif(path, scene, expected_ms, expected_frames):
    with Image.open(path) as gif:
        if gif.size != (WIDTH, scene.height) or gif.n_frames != expected_frames or gif.info.get("loop") != 0:
            raise ValueError(f"Unexpected GIF dimensions, frame count or loop setting: {path.name}")
        duration = 0
        for index in range(gif.n_frames):
            gif.seek(index)
            duration += gif.info.get("duration", 0)
        if duration != expected_ms:
            raise ValueError(f"{path.name}: expected {expected_ms} ms, got {duration} ms")
        final_photo = gif.convert("RGB").crop((0, HEADER, WIDTH, scene.footer_top))
        if ImageChops.difference(final_photo, scene.binary).getbbox() is not None:
            raise ValueError(f"Final mask does not match the resized source: {path.name}")
    return {"file": str(path), "dimensions": [WIDTH, scene.height],
            "duration_seconds": duration / 1000, "frames": expected_frames,
            "size_bytes": path.stat().st_size, "final_mask": "pixel-exact"}


def build_gifs(example, output_dir):
    scene = Scene(example)
    output_dir.mkdir(parents=True, exist_ok=True)
    short_id = "_".join(example.split("_")[-2:])
    labels = ["Original image", "Mask preview", "Black & white mask"]
    colour_path = output_dir / f"Drone2Leaf_{short_id}_colour_scan_15s_HD_clean.gif"
    with PatchGIF(colour_path, scene.decorate(scene.original, 0, "Original drone image", labels), 1000) as gif:
        add_scan(gif, scene, scene.original, scene.colour, 0, "Scanning · Mask preview", labels, 4000)
        add_hold(gif, scene, scene.colour, 1, "Mask preview", labels, 1000)
        add_scan(gif, scene, scene.colour, scene.binary, 1, "Scanning · Black & white mask", labels, 4000)
        add_hold(gif, scene, scene.binary, 2, "Black & white mask", labels, 5000)
    print(json.dumps(verify_gif(colour_path, scene, 15000, 105)), flush=True)

    labels = ["Original image", "Black & white mask"]
    binary_path = output_dir / f"Drone2Leaf_{short_id}_original_to_BW_10s_HD.gif"
    with PatchGIF(binary_path, scene.decorate(scene.original, 0, "Original drone image", labels), 1000) as gif:
        add_scan(gif, scene, scene.original, scene.binary, 0, "Scanning · Black & white mask", labels, 6000)
        add_hold(gif, scene, scene.binary, 1, "Black & white mask", labels, 3000)
    print(json.dumps(verify_gif(binary_path, scene, 10000, 78)), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--example", choices=EXAMPLES, default=EXAMPLES[0], help="Image ID; defaults to the first image.")
    parser.add_argument("--output-dir", type=Path, required=True, help="Folder for both GIFs; existing output filenames are overwritten.")
    args = parser.parse_args()
    try:
        build_gifs(args.example, args.output_dir.expanduser().resolve())
    except (OSError, ValueError) as error:
        parser.exit(1, f"Could not build scan GIFs: {error}\n")
