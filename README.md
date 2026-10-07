# Drone2Leaf website

Static project website for [Drone2Leaf](https://github.com/drone2leaf/drone2leaf_models), designed for GitHub Pages.

The site features the [Drone2Leaf glasshouse flight video](https://youtu.be/18SfkeW88w8), an interactive particle illustration, and an original glasshouse drone image with a scanning line. The video uses its thumbnail as a local preview and loads the YouTube player when clicked. Once the image scan completes, “Initial results in the next update” appears underneath.

The particle illustration shows drone flight inside a glasshouse, individual leaves, then leaves showing signs of disease. It depicts the research goal; it is not a model output or a validation result.

## Reference website

[Saswat Panda's website — spsaswat.github.io](https://spsaswat.github.io/) ([source repository](https://github.com/spsaswat/spsaswat.github.io)) is the reference for the particle animation, particularly the plant and drone illustration under Current Engagement. The Drone2Leaf scene expands sampled shapes, moving rotor particles and pointer interaction into a glasshouse sequence.

## Animation controls

The three stages advance automatically. Select a stage to view it, or pause the animation. Pointer movement gently disperses nearby particles. Off-screen animation stops, and reduced-motion settings show a still illustration with manual stage selection. The raw-image scan plays when it enters view and can be replayed; reduced-motion visitors see the update message immediately.

## Preview locally

Open `index.html` directly, or run a simple local server from this directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

Push the contents of this repository to the `main` branch. GitHub Pages can publish directly from the repository root.
