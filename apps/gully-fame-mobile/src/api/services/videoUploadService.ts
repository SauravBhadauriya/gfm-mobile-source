/**
 * Video Upload Service
 * KIRO: Complete video upload pipeline integration
 * Handles: Camera → Compression → Upload → Reel Creation
 */

import apiClient from "../axios";
import { ApiResponse } from "../types";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export interface VideoUploadRequest {
  videoUri: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  resolution: "hd" | "2k" | "4k";
  fps: number;
  tags?: string[];
  competitionId?: string;
}

export interface VideoUploadResponse {
  reelId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  status: "processing" | "completed" | "failed";
  message: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload video file to server
 * KIRO: Handles multipart form data upload with progress tracking
 */
export async function uploadVideoFile(
  videoUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<ApiResponse<{ uploadId: string; videoUrl: string }>> {
  try {
    console.log("[videoUploadService] Starting video upload:", videoUri);

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error("Video file not found");
    }

    // KIRO: Create FormData for multipart upload
    const formData = new FormData();
    formData.append("video", {
      uri: videoUri,
      type: "video/mp4",
      name: `video_${Date.now()}.mp4`,
    } as any);

    // KIRO: Upload with progress tracking
    const response = await apiClient.post<any>("reels/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress?.({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          percentage,
        });
      },
    });

    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          uploadId: responseData.data.uploadId || responseData.data.id,
          videoUrl: responseData.data.videoUrl || responseData.data.url,
        },
        message: responseData.message || "Video uploaded successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Upload failed",
      error: "API returned unsuccessful response",
      data: { uploadId: "", videoUrl: "" },
    };
  } catch (error: any) {
    console.error("[videoUploadService] Upload error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to upload video",
      error: error.message,
      data: { uploadId: "", videoUrl: "" },
    };
  }
}

/**
 * Create reel from uploaded video
 * KIRO: Creates reel metadata after successful upload
 */
export async function createReelFromUpload(
  uploadId: string,
  request: VideoUploadRequest
): Promise<ApiResponse<VideoUploadResponse>> {
  try {
    console.log("[videoUploadService] Creating reel from upload:", uploadId);

    const payload = {
      uploadId,
      title: request.title,
      description: request.description || "",
      duration: request.duration,
      resolution: request.resolution,
      fps: request.fps,
      tags: request.tags || [],
      competitionId: request.competitionId,
    };

    const response = await apiClient.post<any>("reels/create", payload);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          reelId: responseData.data.reelId || responseData.data.id,
          videoUrl: responseData.data.videoUrl || responseData.data.url,
          thumbnailUrl: responseData.data.thumbnailUrl,
          status: responseData.data.status || "completed",
          message: responseData.message || "Reel created successfully",
        },
        message: responseData.message || "Reel created successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to create reel",
      error: "API returned unsuccessful response",
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: "Failed to create reel",
      },
    };
  } catch (error: any) {
    console.error("[videoUploadService] Create reel error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to create reel",
      error: error.message,
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: error.message,
      },
    };
  }
}

/**
 * Complete video upload pipeline
 * KIRO: Handles entire flow: Upload → Create Reel → Save to Gallery
 */
export async function uploadVideoComplete(
  videoUri: string,
  request: VideoUploadRequest,
  onProgress?: (stage: string, progress: number) => void
): Promise<ApiResponse<VideoUploadResponse>> {
  try {
    console.log("[videoUploadService] Starting complete upload pipeline");

    // Stage 1: Upload video file
    onProgress?.("uploading", 0);
    const uploadResult = await uploadVideoFile(videoUri, (prog) => {
      onProgress?.("uploading", prog.percentage);
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.message);
    }

    // Stage 2: Create reel
    onProgress?.("creating_reel", 50);
    const reelResult = await createReelFromUpload(uploadResult.data.uploadId, request);

    if (!reelResult.success) {
      throw new Error(reelResult.message);
    }

    // Stage 3: Save to gallery (optional)
    onProgress?.("saving_gallery", 90);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(videoUri);
        console.log("[videoUploadService] Video saved to gallery");
      }
    } catch (galleryError) {
      console.warn("[videoUploadService] Failed to save to gallery:", galleryError);
      // Don't fail the upload if gallery save fails
    }

    onProgress?.("completed", 100);

    return {
      success: true,
      data: reelResult.data,
      message: "Video uploaded and reel created successfully",
    };
  } catch (error: any) {
    console.error("[videoUploadService] Complete upload error:", error.message);
    return {
      success: false,
      message: error.message || "Upload pipeline failed",
      error: error.message,
      data: {
        reelId: "",
        videoUrl: "",
        status: "failed",
        message: error.message,
      },
    };
  }
}

/**
 * Get upload status
 * KIRO: Check status of ongoing upload
 */
export async function getUploadStatus(
  uploadId: string
): Promise<ApiResponse<{ status: string; progress: number }>> {
  try {
    console.log("[videoUploadService] Getting upload status:", uploadId);

    const response = await apiClient.get<any>(`reels/upload/${uploadId}/status`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          status: responseData.data.status,
          progress: responseData.data.progress || 0,
        },
        message: "Status retrieved successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to get status",
      error: "API returned unsuccessful response",
      data: { status: "unknown", progress: 0 },
    };
  } catch (error: any) {
    console.error("[videoUploadService] Get status error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to get upload status",
      error: error.message,
      data: { status: "error", progress: 0 },
    };
  }
}

/**
 * Cancel upload
 * KIRO: Cancel ongoing upload
 */
export async function cancelUpload(uploadId: string): Promise<ApiResponse<void>> {
  try {
    console.log("[videoUploadService] Cancelling upload:", uploadId);

    const response = await apiClient.post<any>(`reels/upload/${uploadId}/cancel`);
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        message: "Upload cancelled successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to cancel upload",
      error: "API returned unsuccessful response",
    };
  } catch (error: any) {
    console.error("[videoUploadService] Cancel error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to cancel upload",
      error: error.message,
    };
  }
}
