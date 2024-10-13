import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image to Cloudinary.
 *
 * @function uploadImageOnCloudinary
 * @param {string} localFilePath - The local path of the image file to be uploaded.
 * @returns {Promise<Object|null>} A promise that resolves to the Cloudinary response
 * object containing the image details, or null if no file path is provided.
 * In case of an error, the local file will be deleted, and the error will be returned.
 *
 * @throws {Error} Throws an error if the upload fails.
 *
 * @example
 * const response = await uploadImageOnCloudinary("path/to/image.jpg");
 * console.log(response); // Cloudinary response containing image URL and details.
 */
const uploadImageOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return error;
  }
};

/**
 * Optimizes the delivery of an image by applying automatic format and quality.
 *
 * @constant optimizeUrl
 * @type {string}
 * @default
 * The optimized URL for the image "shoes" with auto format and quality.
 *
 * @example
 * console.log(optimizeUrl); // Outputs the optimized URL for the "shoes" image.
 */
const optimizeUrl = cloudinary.url("shoes", {
  fetch_format: "auto",
  quality: "auto",
});

/**
 * Automatically crops an image to a square aspect ratio.
 *
 * @constant autoCropUrl
 * @type {string}
 * @default
 * The URL for the cropped version of the image "shoes" with specified width and height.
 *
 * @example
 * console.log(autoCropUrl); // Outputs the auto-cropped URL for the "shoes" image.
 */
const autoCropUrl = cloudinary.url("shoes", {
  crop: "auto",
  gravity: "auto",
  width: 500,
  height: 500,
});

export { uploadImageOnCloudinary, optimizeUrl, autoCropUrl };
