# Homepage Media Assets Needed

## Hero (full-bleed background)
- [ ] `hero.webm` - CleanShot recording of Chords mode interaction (~5-10s loop, full-screen capture)
- [ ] `hero.mp4` - MP4 conversion of WebM (Safari <16.4 fallback). Convert with: `ffmpeg -i hero.webm -c:v libx264 -crf 23 hero.mp4`
- [ ] `hero-poster.webp` - Static poster frame from the video (first frame or best frame)

## Tool Card Screenshots
- [ ] `tool-chords.webp` - Chords mode screenshot (~1200x600px source, compressed WebP)
- [ ] `tool-scales.webp` - Scales mode screenshot (~1200x600px source, compressed WebP)
- [ ] `tool-harmony.webp` - Harmony mode screenshot (~1200x600px source, compressed WebP)

## Branding
- [ ] `fret-atlas-logo.png` - Transparent PNG logo for navbar (white text, works on dark/image backgrounds)

## Social / SEO
- [ ] `og-image.jpg` - 1200x630px Open Graph image for social sharing (JPG for max compatibility)

## Notes
- Screenshots should be 2x retina resolution for sharp display
- Target ~60-80KB per WebP screenshot
- Hero video target <2MB for reasonable load times
- Card screenshots should show the app with a chord/scale/progression selected (not empty state)
- Logo PNG should be white (for use over hero video) with transparent background
