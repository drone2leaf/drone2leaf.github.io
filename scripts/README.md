# Build drone-image web previews and scan GIFs

`build_scan_previews.py` regenerates the gallery's smaller image files from the
full-resolution photographs and supplied masks in `assets/images/`. It leaves
the source files unchanged.

## Requirements

Use Python 3.10 or newer and Pillow:

```powershell
python -m pip install Pillow
```

## Regenerate after replacing a source image or mask

Run these commands from the repository root. To rebuild only the first image:

```powershell
python scripts/build_scan_previews.py --example DJI_20260416114316_0027_D
```

For the second image:

```powershell
python scripts/build_scan_previews.py --example DJI_20260521145932_0042_D
```

To rebuild both examples:

```powershell
python scripts/build_scan_previews.py
```

The script resolves the image folder relative to its own location, so it can
also be called using an absolute path from another working directory.

## Source and output files

Each example uses a folder named after its image ID. For an image ID such as
`DJI_20260416114316_0027_D`, the script reads and writes:

| Source file | Generated web file |
| --- | --- |
| `<IMAGE_ID>.JPG` | `<IMAGE_ID>_web.webp` |
| `<IMAGE_ID>_mask_preview.png` | `<IMAGE_ID>_mask_preview_web.webp` |
| `<IMAGE_ID>_binary_mask.png` | `<IMAGE_ID>_binary_mask_web.png` |

All three sources must have matching dimensions so the scan layers align. The
script checks this before writing an example's outputs. Keep these source names
when replacing files.

Outputs are 1920 pixels wide with the original aspect ratio (1920 × 1439 for
the current images). Photographs and coloured masks use Lanczos resizing and
WebP quality 88. Binary masks use nearest-neighbour resizing and lossless PNG
to preserve their black-and-white values. Existing web files are overwritten.

Preview the gallery from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/#first-look`, review the regenerated files, and publish
the updated sources and web files together. The gallery uses the same output
filenames, so no HTML or JavaScript changes are needed. Refresh the published
page with Ctrl+F5 if an older preview is cached.

## Regenerate the LinkedIn scan GIFs

`build_scan_gifs.py` reads the same full-resolution sources and generates both
GIFs with the Drone2Leaf logo and stage labels. It uses Python and Pillow, plus
Segoe UI fonts on Windows or DejaVu Sans on other systems.

To rebuild the first image's GIFs after replacing its masks:

```powershell
python scripts/build_scan_gifs.py --example DJI_20260416114316_0027_D --output-dir "D:\Projects\AnacondaFiles\Drone2leaf\Linkedin_posts"
```

Use `--example DJI_20260521145932_0042_D` for the second image. The output folder
is required; choose any writable folder. Existing GIFs with the generated names
are overwritten. Sources and website previews are left unchanged.

| Output filename (`0027_D` for the first image) | Sequence and timings |
| --- | --- |
| `Drone2Leaf_0027_D_colour_scan_15s_HD_clean.gif` | Original: 1 s; colour scan: 4 s; colour hold: 1 s; binary scan: 4 s; final mask: 5 s |
| `Drone2Leaf_0027_D_original_to_BW_10s_HD.gif` | Original: 1 s; binary scan: 6 s; final mask: 3 s |

Both files loop continuously. The photo is resized to 1920 pixels wide while
preserving its aspect ratio. With the current images, the full GIF is
1920 × 1707 including the header and footer. Binary masks use nearest-neighbour
resizing. Local palettes for newly revealed strips reduce colour speckling
without dithering. After writing each GIF, the script checks its dimensions,
duration, frame count, loop setting and exact final mask pixels.
