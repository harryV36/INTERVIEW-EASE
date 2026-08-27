// services/cloudinaryService.js
import cloudinary from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload face photo to Cloudinary
 * @param {Buffer} imageBuffer - Image buffer from cv2.imencode
 * @param {string} sessionId - Interview session ID
 * @param {string} userId - User ID
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadFacePhoto = async (imageBuffer, sessionId, userId) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `interview-faces/${userId}`,
          public_id: `face_${sessionId}_${Date.now()}`,
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log(
              `✅ Face photo uploaded to Cloudinary: ${result.secure_url}`
            );
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(imageBuffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("❌ Face photo upload failed:", error);
    throw error;
  }
};

/**
 * Delete face photo from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteFacePhoto = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    console.log(`✅ Face photo deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to delete photo ${publicId}:`, error);
    throw error;
  }
};

/**
 * Get latest face photo for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Latest photos
 */
export const getLatestFacePhotos = async (userId, limit = 5) => {
  try {
    const result = await cloudinary.v2.api.resources_by_ids(
      [],
      {
        type: "upload",
        prefix: `interview-faces/${userId}`,
        max_results: limit,
      }
    );
    return result.resources || [];
  } catch (error) {
    console.error("❌ Failed to fetch face photos:", error);
    return [];
  }
};

export default {
  uploadFacePhoto,
  deleteFacePhoto,
  getLatestFacePhotos,
};
