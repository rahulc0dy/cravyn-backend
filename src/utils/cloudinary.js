import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image on cloudinary
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

// Optimize delivery by resizing and applying auto-format and auto-quality
const optimizeUrl = cloudinary.url("shoes", {
  fetch_format: "auto",
  quality: "auto",
});

// Transform the image: auto-crop to square aspect_ratio
const autoCropUrl = cloudinary.url("shoes", {
  crop: "auto",
  gravity: "auto",
  width: 500,
  height: 500,
});

export { uploadImageOnCloudinary, optimizeUrl, autoCropUrl };
