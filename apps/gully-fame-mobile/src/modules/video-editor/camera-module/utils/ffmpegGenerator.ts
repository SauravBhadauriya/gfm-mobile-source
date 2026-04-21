import { Platform } from "react-native";
import type { CameraClip } from "../types/camera.types";

const getCleanPath = (uri: string) =>
    uri.startsWith("http") ? uri : uri.replace(/^file:\/\//, "");

const parseColorToFFmpeg = (color?: string) => {
    if (!color) return "black@0.0";
    if (color.startsWith("#")) return color;

    const rgbaMatch = color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
    );
    if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, "0");
        const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, "0");
        const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, "0");
        const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
        return `0x${r}${g}${b}@${a}`;
    }
    return color;
};

// Helper to get raw math from string ratios
const getRatioMath = (ratio?: string) => {
    if (ratio === "16:9") return 16 / 9;
    if (ratio === "1:1") return 1;
    if (ratio === "2.35:1") return 2.35;
    return 9 / 16; // Default fallback to portrait
};

export const buildExportCommandArgs = (
    clips: CameraClip[],
    globalTextOverlays: any[],
    globalStickerOverlays: any[],
    globalPipOverlays: any[],
    outputPath: string,
    previewWidth: number,
    previewHeight: number,
    exportResolution: "hd" | "2k" | "4k" = "hd",
    exportFps: number = 30,
): string[] => {
    const args: string[] = [];
    let filterGraph = "";
    let videoStreams = "";
    let audioStreams = "";

    const primaryClip = clips[0];
    const aspectRatioStr = primaryClip?.aspectRatio || "9:16";
    const ratioMath = getRatioMath(aspectRatioStr);

    let shortEdge = 1080;
    if (exportResolution === "2k") shortEdge = 1440;
    if (exportResolution === "4k") shortEdge = 2160;

    let targetW, targetH;
    if (ratioMath >= 1) {
        targetH = shortEdge;
        targetW = Math.round(shortEdge * ratioMath);
    } else {
        targetW = shortEdge;
        targetH = Math.round(shortEdge / ratioMath);
    }

    const TARGET_WIDTH = targetW - (targetW % 2);
    const TARGET_HEIGHT = targetH - (targetH % 2);
    const FPS = exportFps;

    const UI_RATIO_X = TARGET_WIDTH / previewWidth;
    const UI_RATIO_Y = TARGET_HEIGHT / previewHeight;

    console.log(
        `[FFMPEG] Exporting at ${TARGET_WIDTH}x${TARGET_HEIGHT} @ ${FPS}fps`,
    );

    // ==========================================
    // 2. INPUTS & SCALING
    // ==========================================
    clips.forEach((clip, index) => {
        const cleanUri = getCleanPath(clip.uri);
        if (clip.type === "photo") {
            args.push(
                "-loop",
                "1",
                "-framerate",
                FPS.toString(),
                "-t",
                (clip.duration || 3).toString(),
                "-i",
                cleanUri,
            );
        } else {
            args.push("-i", cleanUri);
        }

        const trimStart = clip.trimStart || 0;
        const trimEnd = clip.trimEnd || clip.duration || 3;

        let vGraph = `[${index}:v]trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS`;

        if (clip.filterPreset) {
            vGraph += `,eq=contrast=${clip.filterPreset.contrast ?? 1}:brightness=${clip.filterPreset.brightness ?? 0}:saturation=${clip.filterPreset.saturation ?? 1}`;
        }

        vGraph += `,scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS}[v${index}];`;

        filterGraph += vGraph;

        const audioFormat =
            "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo";

        if (clip.type === "photo") {
            filterGraph += `anullsrc=r=48000:cl=stereo,atrim=start=0:end=${trimEnd - trimStart},asetpts=PTS-STARTPTS[a${index}];`;
        } else {
            filterGraph += `[${index}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS,${audioFormat}[a${index}];`;
        }

        videoStreams += `[v${index}][a${index}]`;
    });

    let currentInputIndex = clips.length;

    // ==========================================
    // 3. CONCATENATION
    // ==========================================
    let currentVideoStream = "[base_v]";
    let currentAudioStream = "[base_a]";

    if (clips.length === 1) {
        filterGraph += `[v0]unsharp=3:3:0.5:3:3:0.0[base_v];[a0]aresample=48000,loudnorm[base_a];`;
    } else {
        filterGraph += `${videoStreams}concat=n=${clips.length}:v=1:a=1[v_concat][a_concat];`;
        filterGraph += `[v_concat]unsharp=3:3:0.5:3:3:0.0[base_v];`;
        filterGraph += `[a_concat]aresample=48000,loudnorm[base_a];`;
    }

    // ==========================================
    // 4. OVERLAYS (Stickers, Text, PIP)
    // ==========================================
    const masterOverlays: any[] = [];

    globalTextOverlays.forEach((t) =>
        masterOverlays.push({ ...t, _type: "text" }),
    );

    globalStickerOverlays.forEach((s) => {
        const isEmoji =
            s.source && s.source.length <= 4 && !s.source.startsWith("file:");
        if (isEmoji) {
            masterOverlays.push({ ...s, _type: "emoji" });
        } else {
            // 🔥 THE FIX 1: Force the image loop to generate exactly 30 or 60 frames per second!
            args.push(
                "-loop",
                "1",
                "-framerate",
                FPS.toString(),
                "-i",
                getCleanPath(s.source),
            );
            masterOverlays.push({
                ...s,
                _type: "image",
                _inputIdx: currentInputIndex,
            });
            currentInputIndex++;
        }
    });

    globalPipOverlays.forEach((p) => {
        args.push("-i", getCleanPath(p.uri));
        masterOverlays.push({
            ...p,
            _type: "pip",
            _inputIdx: currentInputIndex,
        });
        currentInputIndex++;
    });

    masterOverlays.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

    const emojiFont =
        Platform.OS === "android"
            ? "/system/fonts/NotoColorEmoji.ttf"
            : "Apple Color Emoji";
    const textFont =
        Platform.OS === "android"
            ? "/system/fonts/Roboto-Regular.ttf"
            : "Arial";
    const textFontBold =
        Platform.OS === "android"
            ? "/system/fonts/Roboto-Bold.ttf"
            : "Arial-BoldMT";

    masterOverlays.forEach((overlay, idx) => {
        const nextStream = `[v_out${idx}]`;
        const start = overlay.startTime || 0;
        const end = overlay.endTime || 9999;
        const scale = overlay.scale ?? 1;

        const fadeInDur = overlay.fadeIn || 0;
        const fadeOutDur = overlay.fadeOut || 0;

        if (overlay._type === "text" || overlay._type === "emoji") {
            const isEmoji = overlay._type === "emoji";
            const rawText = isEmoji ? overlay.source : overlay.text;
            const safeText = rawText.replace(/'/g, "\\'").replace(/:/g, "\\:");

            const finalFontSize = Math.round(
                (overlay.fontSize || 24) * scale * UI_RATIO_X,
            );
            const scaledPaddingX = Math.round(8 * UI_RATIO_X * scale);
            const scaledPaddingY = Math.round(4 * UI_RATIO_Y * scale);
            const avgPadding = Math.round(
                (scaledPaddingX + scaledPaddingY) / 2,
            );

            const offsetMultiplier = 1 / (2 * scale) - 0.5;
            const xPos = `(w*${overlay.x || 0}) + text_w*(${offsetMultiplier}) + ${scaledPaddingX}`;
            const yPos = `(h*${overlay.y || 0}) + text_h*(${offsetMultiplier}) + ${scaledPaddingY}`;

            const isBold =
                overlay.fontWeight === "bold" || overlay.fontWeight === "700";
            const activeFont = isEmoji
                ? emojiFont
                : isBold
                  ? textFontBold
                  : textFont;

            const fontColorStr = overlay.color
                ? parseColorToFFmpeg(overlay.color)
                : "white";
            const bgColorStr = overlay.backgroundColor
                ? parseColorToFFmpeg(overlay.backgroundColor)
                : "black@0.0";
            const boxStr = overlay.backgroundColor
                ? `box=1:boxcolor=${bgColorStr}:boxborderw=${avgPadding}:`
                : "";

            let alphaStr = "1";
            if (fadeInDur > 0 && fadeOutDur > 0) {
                alphaStr = `if(lt(t\\,${start + fadeInDur})\\,(t-${start})/${fadeInDur}\\,if(gt(t\\,${end - fadeOutDur})\\,(${end}-t)/${fadeOutDur}\\,1))`;
            } else if (fadeInDur > 0) {
                alphaStr = `if(lt(t\\,${start + fadeInDur})\\,(t-${start})/${fadeInDur}\\,1)`;
            } else if (fadeOutDur > 0) {
                alphaStr = `if(gt(t\\,${end - fadeOutDur})\\,(${end}-t)/${fadeOutDur}\\,1)`;
            }

            filterGraph += `${currentVideoStream}drawtext=fontfile='${activeFont}':text='${safeText}':${boxStr}fontcolor=${fontColorStr}:fontsize=${finalFontSize}:x=${xPos}:y=${yPos}:alpha='${alphaStr}':enable='between(t,${start},${end})'${nextStream};`;

            currentVideoStream = nextStream;
        } else if (overlay._type === "pip" || overlay._type === "image") {
            const baseWidth = overlay.size || overlay.width || 200;
            const baseHeight = overlay.size || overlay.height || 200;

            // 🔥 THE FIX: Force dimensions to be EVEN numbers. FFmpeg crashes on odd pixels!
            const finalWidth = Math.max(
                2,
                Math.round((baseWidth * scale * UI_RATIO_X) / 2) * 2,
            );
            const finalHeight = Math.max(
                2,
                Math.round((baseHeight * scale * UI_RATIO_Y) / 2) * 2,
            );

            const xPos = `(W*${overlay.x || 0.5}) - (w/2)`;
            const yPos = `(H*${overlay.y || 0.5}) - (h/2)`;

            // 🔥 Changed format to 'rgba' which handles alpha transparency perfectly without even-pixel panic
            let overlayFilters = `scale=${finalWidth}:${finalHeight},format=rgba,trim=duration=${end - start}`;

            if (fadeInDur > 0)
                overlayFilters += `,fade=t=in:st=0:d=${fadeInDur}:alpha=1`;

            if (fadeOutDur > 0)
                overlayFilters += `,fade=t=out:st=${end - start - fadeOutDur}:d=${fadeOutDur}:alpha=1`;

            overlayFilters += `,setpts=PTS-STARTPTS+${start}/TB`;

            filterGraph += `[${overlay._inputIdx}:v]${overlayFilters}[pip_scaled_${idx}];${currentVideoStream}[pip_scaled_${idx}]overlay=x=${xPos}:y=${yPos}:enable='between(t,${start},${end})':eof_action=pass${nextStream};`;

            currentVideoStream = nextStream;
        }
    });

    if (filterGraph.endsWith(";")) filterGraph = filterGraph.slice(0, -1);

    args.push("-filter_complex", filterGraph);
    args.push("-map", currentVideoStream);
    args.push("-map", currentAudioStream);

    let targetBitrate = "15M";
    if (exportResolution === "2k") targetBitrate = "20M";
    if (exportResolution === "4k") targetBitrate = "35M";

    args.push(
        "-c:v",
        "h264_mediacodec",
        "-b:v",
        targetBitrate,
        "-maxrate",
        targetBitrate,
        "-bufsize",
        "50M",
        "-pix_fmt",
        "yuv420p",
    );
    args.push("-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart");
    args.push("-y", getCleanPath(outputPath));

    return args;
};
