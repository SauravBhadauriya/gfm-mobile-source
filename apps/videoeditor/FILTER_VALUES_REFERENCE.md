# Filter Values Reference Guide

## Current Filter Presets in Codebase

All filter presets are defined in `camera-module/types/filters.ts`. Here's a quick reference:

### Understanding Filter Parameters

1. **Brightness**: -1.0 to 1.0 (0 = no change)
   - Negative = darker
   - Positive = brighter

2. **Contrast**: 0.0 to 2.0 (1.0 = no change)
   - < 1.0 = less contrast (softer)
   - > 1.0 = more contrast (dramatic)

3. **Saturation**: 0.0 to 3.0 (1.0 = no change, 0.0 = grayscale)
   - 0.0 = black & white
   - < 1.0 = desaturated
   - > 1.0 = more vibrant

4. **Gamma**: 0.1 to 3.0 (1.0 = no change)
   - < 1.0 = darker midtones
   - > 1.0 = brighter midtones

5. **Temperature**: -1.0 to 1.0 (0 = neutral)
   - Negative = cool (blue)
   - Positive = warm (orange/yellow)

6. **Tint**: -1.0 to 1.0 (0 = neutral)
   - Negative = green
   - Positive = magenta

## Resources to Check Filter Values

### 1. **Online Filter Visualizers**

- **Canva Color Adjustments**: https://www.canva.com/
  - Upload an image and use their filter tools to see effects
  - Good for understanding visual results

- **Photopea** (Free Photoshop Alternative): https://www.photopea.com/
  - Image → Adjustments → Color Balance, Brightness/Contrast, Hue/Saturation
  - Shows real-time preview of adjustments

### 2. **Filter Preset Libraries** (for inspiration)

- **PresetLove**: https://presetlove.com/
  - Free Lightroom presets with descriptions
  - Good for understanding filter aesthetics

- **VSCO Presets Info**: 
  - VSCO app itself (mobile) - test filters directly
  - Visual guides available online

### 3. **FFmpeg Documentation**

For technical filter values used in export:

- **FFmpeg eq filter**: https://ffmpeg.org/ffmpeg-filters.html#eq
  - Brightness, contrast, saturation, gamma parameters
  - Official documentation with value ranges

- **FFmpeg colorbalance**: https://ffmpeg.org/ffmpeg-filters.html#colorbalance
  - Temperature and tint adjustments

### 4. **Color Grading Tools**

- **DaVinci Resolve** (Free): 
  - Professional color grading software
  - Great for testing color values and seeing results

- **GIMP** (Free):
  - Colors → Levels, Colors → Curves, Colors → Color Balance
  - Free alternative for testing adjustments

### 5. **Check Your Current Values**

To see all your current filter values, check:
- `camera-module/types/filters.ts` - All filter presets are defined here
- Each filter has its specific brightness, contrast, saturation, temperature, etc.

### 6. **Testing Filter Effects**

**Quick Test Method:**
1. Open your app
2. Apply a filter to an image/video
3. Take note of the visual effect
4. Adjust values in `filters.ts` if needed
5. Test again

### Example Filter Breakdown

```typescript
{
  name: 'Warm',
  temperature: 0.3,      // Slightly warm (orange/yellow tint)
  contrast: 1.1,         // 10% more contrast
  saturation: 1.1,       // 10% more saturated
}
```

```typescript
{
  name: 'Vintage',
  contrast: 0.9,         // 10% less contrast (softer)
  saturation: 0.75,      // 25% less saturated (desaturated)
  temperature: 0.2,      // Slight warm tint
  gamma: 1.1,            // Brighter midtones
  vignette: {            // Dark edges effect
    angle: 45,
    x0: 0.5,
    y0: 0.5,
  },
}
```

## Pro Tips

1. **Start with small adjustments**: 0.1-0.2 changes are often enough
2. **Temperature vs Tint**: Temperature shifts between warm/cool, tint shifts between magenta/green
3. **Saturation 0 = Grayscale**: Any filter with `saturation: 0` removes all color
4. **Contrast affects drama**: Higher contrast (1.2+) = more dramatic, lower (0.8-) = softer
5. **Test on different images**: A filter that looks good on one image may not work on another

## Need to Modify Values?

Edit `camera-module/types/filters.ts` and adjust the values. The preview overlays in the app will update automatically.

