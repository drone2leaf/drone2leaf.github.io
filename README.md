# Drone2Leaf website

Static project website for [Drone2Leaf](https://github.com/drone2leaf/drone2leaf_models), designed for GitHub Pages.

The site features the [Drone2Leaf glasshouse flight video](https://youtu.be/18SfkeW88w8), an interactive particle illustration, and a gallery of two glasshouse drone images with their supplied leaf masks. The video uses its thumbnail as a local preview and loads the YouTube player when clicked. The gallery reveals the coloured mask preview and then the black-and-white mask with a scanning line.

The particle illustration shows drone flight inside a glasshouse, individual leaves, then leaves showing signs of disease. It depicts the research goal; it is not a model output or a validation result.

## Reference website

Reference website: [spsaswat.github.io](https://spsaswat.github.io/) ([source repository](https://github.com/spsaswat/spsaswat.github.io)). Saswat Panda's plant and drone illustration under Current Engagement is the reference for the particle animation. The Drone2Leaf scene expands sampled shapes, moving rotor particles and pointer interaction into a glasshouse sequence.

## Collaborators

Project lead: Mr. Saswat Panda. Operation and Automation Lead: Mr. Ming Dao Chia.

Dr. Tao Hu, Dr. Dat Pham, Mr. Scott Allchin, Dr. Supriyo Shafkat Ahmed, Richard Poire, Prof. Mark Tjoelker and Prof. Danielle Way.

ANU TechLauncher students working through the PlantDIs project: Hanxiao Ma, Yubin Zhan, Zongjing Han and Mukul Sharma.

## Project support

The project is supported by the APPN SIF program, the Central Data Team, and by the TechLauncher program at ANU through the PlantDIs project.

## Branding

The supplied mark in `assets/images/d2l_.jpg` is traced into SVG paths in `assets/images/d2l-logo.svg` and used in the header and footer, with a matching SVG favicon. The original image remains available in the assets folder.

## Shared-link previews

The page includes Open Graph metadata with an absolute URL to `assets/images/d2l-social-preview.png` (1200 × 630), plus a square PNG logo for summary cards. These PNG images are rendered from the existing SVG logo. Shared-link thumbnails use this metadata rather than the browser favicon. PNG, ICO and Apple touch icon fallbacks are also included.

Publish the HTML and image files together so preview crawlers can retrieve the images. Sharing apps may retain an earlier preview until their cache is refreshed.

## Animation controls

The particle illustration's three stages advance automatically. Select a stage to view it, or pause the animation. Starting leaves are light green; detected leaves are dark green with blue bounding boxes. Disease highlights and boxes are amber. Pointer movement gently disperses nearby particles. Off-screen animation stops, and reduced-motion settings show a still illustration with manual stage selection.

## Drone-image and mask gallery

Each example starts with its original drone photograph, then a top-to-bottom scan reveals the coloured mask preview, followed by another scan revealing the black-and-white mask. The completed view stays visible. Use the previous/next arrows to change examples, the stage buttons to inspect a view, or the pause/resume/replay control. Left/right keyboard arrows also change examples when the gallery has focus. Animation pauses off screen and in hidden tabs. Reduced-motion visitors select stages manually.

The gallery scales to the available browser height and width while preserving the full image aspect ratio. It measures the toolbar and control rows, leaves space for the fixed site navigation, and uses compact controls in shorter windows so the stage buttons remain visible at normal browser zoom.

The source files are kept in `assets/images/DJI_20260416114316_0027_D/` and `assets/images/DJI_20260521145932_0042_D/`. The website loads 1920-pixel copies; the full-resolution originals and supplied masks remain unchanged. Binary preview copies use nearest-neighbour resizing to preserve black-and-white pixels. To regenerate these copies with Python and Pillow installed:

```bash
python scripts/build_scan_previews.py
```

## Page-view counter

The footer uses a shared [Hits.sh](https://github.com/silentsoft/hits) badge for `drone2leaf.github.io`. It starts recording badge requests when the site is published; it does not recover earlier visits or count unique people. Local previews do not load the live badge or add to the total. If the service is unavailable, the footer shows “Page views: unavailable”.

Public counter statistics: [hits.sh/drone2leaf.github.io](https://hits.sh/drone2leaf.github.io/). If the website moves to a custom domain, update the production hostname check in `assets/js/main.js`.

## Preview locally

Open `index.html` directly, or run a simple local server from this directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

Push the contents of this repository to the `main` branch. GitHub Pages can publish directly from the repository root.
