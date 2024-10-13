import multer from "multer";

/**
 * Configuration for file upload using multer.
 *
 * This configuration sets up multer to store uploaded files on the disk.
 * Files will be saved in the `./public/temp` directory with their original names.
 *
 * @module upload
 * @requires multer
 *
 * @const {Object} storage - multer storage engine configuration.
 * @property {Function} destination - A function that determines the destination folder for storing uploaded files.
 * @property {Function} filename - A function that defines the name of the file to be stored.
 *
 * @returns {Object} - Returns a multer instance configured for disk storage.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/temp");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
