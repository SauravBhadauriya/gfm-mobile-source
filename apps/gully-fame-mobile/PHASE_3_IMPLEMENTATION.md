# Phase 3: Export Pipeline - Implementation Guide

## Status: IN PROGRESS

### Phase 3 Goals:

1. ⏳ FFmpeg Integration & Setup
2. ⏳ H.264 Hardware Encoding
3. ⏳ Coordinate Mapping (UI → FFmpeg)
4. ⏳ Export Settings & Quality Control
5. ⏳ Integration & Testing

---

## FFmpeg Setup

### Step 1: Install FFmpeg Package

```bash
cd apps/gully-fame-mobile
npm install ffmpeg-kit-react-native-community@6.0.2-fork.1
```

### Step 2: Update app.json

Add FFmpeg plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}
```

### Step 3: Rebuild Native Modules

```bash
npx expo prebuild --clean
```

---

## Architecture Overview

```
ExportScreen
├── Export Settings
│   ├── Resolution Selector
│   ├── Quality Preset
│   ├── Bitrate Control
│   └── Format Selection
├── Preview
│   └── Final Video Preview
├── Progress
│   ├── Encoding Progress
│   ├── Time Remaining
│   └── Cancel Button
└── Export Engine
    ├── FFmpeg Command Builder
    ├── Coordinate Mapper
    ├── Overlay Renderer
    └── Video Encoder
```

---

## Core Components to Build

### 1. ExportScreen.tsx

Main export interface with settings and progress.

**Features:**

- Resolution selection (HD, 2K, 4K)
- Quality presets (Low, Medium, High, Maximum)
- Bitrate control
- Format selection (MP4, MOV, WebM)
- Export progress tracking
- Cancel functionality

### 2. FFmpegExporter.ts

FFmpeg command builder and executor.

**Features:**

- Build FFmpeg commands
- Handle encoding
- Track progress
- Error handling
- Cleanup

### 3. CoordinateMapper.ts

Convert React Native UI coordinates to FFmpeg math.

**Features:**

- Map X/Y positions
- Scale calculations
- Rotation handling
- Z-index ordering
- Aspect ratio preservation

### 4. OverlayRenderer.ts

Render overlays into video.

**Features:**

- Text rendering
- Sticker compositing
- PIP overlay
- Filter application
- Transition effects

### 5. ExportSettings.ts

Export configuration and presets.

**Features:**

- Resolution presets
- Quality presets
- Bitrate recommendations
- Format options
- Codec selection

---

## FFmpeg Command Structure

### Basic Video Encoding:

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -b:v 5000k \
  -c:a aac \
  -b:a 128k \
  output.mp4
```

### With Overlays:

```bash
ffmpeg -i input.mp4 \
  -i overlay.png \
  -filter_complex "[0:v][1:v]overlay=x=100:y=100[out]" \
  -map "[out]" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  output.mp4
```

### With Text:

```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Hello':x=100:y=100:fontsize=24:fontcolor=white" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  output.mp4
```

### With Filters:

```bash
ffmpeg -i input.mp4 \
  -vf "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  output.mp4
```

---

## Coordinate Mapping

### React Native to FFmpeg:

```typescript
// React Native coordinates (0-1 normalized)
const rnPosition = {
  x: 0.5, // 50% from left
  y: 0.5, // 50% from top
  width: 0.4, // 40% of container width
  height: 0.3, // 30% of container height
};

// Convert to FFmpeg pixel coordinates
const ffmpegPosition = {
  x: Math.round(rnPosition.x * videoWidth),
  y: Math.round(rnPosition.y * videoHeight),
  width: Math.round(rnPosition.width * videoWidth),
  height: Math.round(rnPosition.height * videoHeight),
};

// FFmpeg overlay command
const overlayFilter = `overlay=x=${ffmpegPosition.x}:y=${ffmpegPosition.y}:w=${ffmpegPosition.width}:h=${ffmpegPosition.height}`;
```

### Scale Mapping:

```typescript
// React Native scale (0.2 - 5.0)
const rnScale = 1.5;

// Convert to FFmpeg scale
const ffmpegScale = {
  width: Math.round(baseWidth * rnScale),
  height: Math.round(baseHeight * rnScale),
};
```

### Rotation Mapping:

```typescript
// React Native rotation (degrees)
const rnRotation = 45;

// FFmpeg rotate filter
const rotateFilter = `rotate=${(rnRotation * Math.PI) / 180}`;
```

---

## Quality Presets

### Low Quality:

```typescript
{
  resolution: "hd",      // 1920x1080
  preset: "fast",        // Encoding speed
  crf: 28,              // Quality (0-51, lower = better)
  bitrate: "2000k",     // Video bitrate
  audioBitrate: "64k"   // Audio bitrate
}
```

### Medium Quality:

```typescript
{
  resolution: "hd",
  preset: "medium",
  crf: 23,
  bitrate: "5000k",
  audioBitrate: "128k"
}
```

### High Quality:

```typescript
{
  resolution: "2k",
  preset: "slow",
  crf: 18,
  bitrate: "10000k",
  audioBitrate: "192k"
}
```

### Maximum Quality:

```typescript
{
  resolution: "4k",
  preset: "veryslow",
  crf: 15,
  bitrate: "20000k",
  audioBitrate: "256k"
}
```

---

## Export Flow

### Step 1: Prepare Assets

```typescript
// Collect all clips, overlays, filters
const exportData = {
  clips: [...],
  textOverlays: [...],
  stickerOverlays: [...],
  pipOverlays: [...],
  filters: [...],
  transitions: [...]
}
```

### Step 2: Build FFmpeg Command

```typescript
// Generate FFmpeg command with all filters
const ffmpegCommand = buildFFmpegCommand(exportData, settings);
```

### Step 3: Execute Encoding

```typescript
// Run FFmpeg with progress tracking
const result = await FFmpegKit.executeAsync(ffmpegCommand, (session) => {
  // Track progress
  const progress = session.getProgress();
  updateProgressUI(progress);
});
```

### Step 4: Save Output

```typescript
// Save encoded video to device
const outputPath = await saveVideoToGallery(result);
```

### Step 5: Cleanup

```typescript
// Clean up temporary files
await cleanupTemporaryFiles();
```

---

## File Structure

```
src/modules/video-editor/camera-module/
├── components/
│   ├── ExportScreen.tsx (NEW)
│   ├── ExportSettings.tsx (NEW)
│   └── ExportProgress.tsx (NEW)
├── hooks/
│   └── useFFmpegExport.ts (NEW)
├── utils/
│   ├── ffmpegExporter.ts (NEW)
│   ├── coordinateMapper.ts (NEW)
│   ├── overlayRenderer.ts (NEW)
│   └── exportSettings.ts (NEW)
└── types/
    └── export.types.ts (NEW)
```

---

## Implementation Checklist

### Phase 3.1: FFmpeg Setup

- [ ] Install ffmpeg-kit-react-native-community
- [ ] Update app.json with plugin
- [ ] Run prebuild
- [ ] Test FFmpeg availability

### Phase 3.2: Export Screen

- [ ] Create ExportScreen component
- [ ] Add resolution selector
- [ ] Add quality presets
- [ ] Add bitrate control
- [ ] Add format selection
- [ ] Add progress tracking

### Phase 3.3: FFmpeg Integration

- [ ] Create FFmpegExporter utility
- [ ] Build FFmpeg commands
- [ ] Handle encoding
- [ ] Track progress
- [ ] Error handling

### Phase 3.4: Coordinate Mapping

- [ ] Create CoordinateMapper utility
- [ ] Map X/Y positions
- [ ] Map scale values
- [ ] Map rotation values
- [ ] Handle aspect ratios

### Phase 3.5: Overlay Rendering

- [ ] Create OverlayRenderer utility
- [ ] Render text overlays
- [ ] Render sticker overlays
- [ ] Render PIP overlays
- [ ] Apply filters
- [ ] Apply transitions

### Phase 3.6: Integration

- [ ] Connect ExportScreen to PreviewScreen
- [ ] Pass export data
- [ ] Handle export completion
- [ ] Save to gallery
- [ ] Show success message

### Phase 3.7: Testing

- [ ] Test single clip export
- [ ] Test multi-clip export
- [ ] Test with text overlays
- [ ] Test with sticker overlays
- [ ] Test with PIP overlays
- [ ] Test with filters
- [ ] Test with transitions
- [ ] Test different quality presets
- [ ] Test different resolutions
- [ ] Test cancel functionality

---

## Performance Considerations

### Optimization Strategies:

1. **Hardware Encoding:** Use device's H.264 encoder
2. **Preset Selection:** Balance speed vs quality
3. **Bitrate Optimization:** Recommend based on resolution
4. **Parallel Processing:** Process clips in parallel if possible
5. **Memory Management:** Stream processing for large files

### Estimated Encoding Times:

- **Low Quality (HD):** 30-60 seconds
- **Medium Quality (HD):** 60-120 seconds
- **High Quality (2K):** 120-240 seconds
- **Maximum Quality (4K):** 240-600 seconds

---

## Error Handling

### Common Errors:

1. **Insufficient Storage:** Check available space
2. **FFmpeg Not Available:** Fallback or error message
3. **Invalid Input:** Validate before encoding
4. **Encoding Failure:** Retry or show error
5. **Cancelled Export:** Cleanup and return

### Error Recovery:

```typescript
try {
  const result = await FFmpegKit.executeAsync(command);
  if (result.getReturnCode() !== 0) {
    throw new Error("FFmpeg encoding failed");
  }
} catch (error) {
  console.error("Export error:", error);
  showErrorMessage(error.message);
  cleanupTemporaryFiles();
}
```

---

## Testing Checklist

- [ ] Export single clip
- [ ] Export multiple clips
- [ ] Export with text overlay
- [ ] Export with sticker overlay
- [ ] Export with PIP overlay
- [ ] Export with filter
- [ ] Export with transition
- [ ] Export with all features combined
- [ ] Test low quality preset
- [ ] Test medium quality preset
- [ ] Test high quality preset
- [ ] Test maximum quality preset
- [ ] Test HD resolution
- [ ] Test 2K resolution
- [ ] Test 4K resolution
- [ ] Test cancel during export
- [ ] Test insufficient storage
- [ ] Test invalid input
- [ ] Verify output video quality
- [ ] Verify overlay positioning
- [ ] Verify overlay scaling
- [ ] Verify filter application
- [ ] Verify transition effects
- [ ] Check file size
- [ ] Check encoding time
- [ ] Verify saved to gallery

---

## Next Steps

1. **Install FFmpeg Package**

   ```bash
   npm install ffmpeg-kit-react-native-community@6.0.2-fork.1
   ```

2. **Update app.json**
   - Add FFmpeg plugin

3. **Run Prebuild**

   ```bash
   npx expo prebuild --clean
   ```

4. **Create ExportScreen**
   - Build UI components
   - Add settings controls

5. **Implement FFmpeg Integration**
   - Build command generator
   - Handle encoding

6. **Implement Coordinate Mapping**
   - Convert UI coordinates
   - Handle scaling and rotation

7. **Test Export Pipeline**
   - Test with various inputs
   - Verify output quality

---

## Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Kit React Native](https://github.com/tanersonmez/ffmpeg-kit-react-native-community)
- [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html)
- [H.264 Encoding](https://trac.ffmpeg.org/wiki/Encode/H.264)

---

**Phase 3 Status:** IN PROGRESS
**Next Update:** After FFmpeg setup
**Last Updated:** May 5, 2026
