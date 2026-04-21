# Sticker Setup Guide

## How to Add Stickers

### Step 1: Create the Stickers Folder

Create a folder for your stickers:
- Option 1: `src/assets/stickers/`
- Option 2: `assets/stickers/`

### Step 2: Add Sticker Images

Add your sticker image files (PNG, JPG, etc.) to the stickers folder.

Example:
```
src/assets/stickers/
  ├── sticker1.png
  ├── sticker2.png
  ├── sticker3.png
  └── ...
```

### Step 3: Import Stickers in `stickerLoader.ts`

Open `camera-module/utils/stickerLoader.ts` and import your stickers:

```typescript
// Import your stickers
import sticker1 from '../../src/assets/stickers/sticker1.png';
import sticker2 from '../../src/assets/stickers/sticker2.png';
import sticker3 from '../../src/assets/stickers/sticker3.png';
// ... add more as needed

// Export them as an array
export const STICKERS = [
  sticker1,
  sticker2,
  sticker3,
  // ... add more stickers here
];
```

### Step 4: Test

1. Run your app
2. Go to preview screen
3. Click the "Sticker" button
4. You should see your stickers in a 3-row grid
5. Click a sticker to select it

## Notes

- Stickers are displayed in a 3-row grid with horizontal scrolling
- Shows 4-5 columns at a time
- Supports both local image imports (require) and URI strings
- Stickers are organized in columns for smooth horizontal scrolling

## Troubleshooting

**Problem: No stickers showing**
- Make sure you've imported stickers in `stickerLoader.ts`
- Check that the file paths are correct
- Verify the images are valid image files

**Problem: Images not loading**
- Check the import paths are relative to `stickerLoader.ts`
- Ensure image files are in the correct format (PNG, JPG, etc.)
- Try using absolute paths if relative paths don't work

