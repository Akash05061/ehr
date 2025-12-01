// ================== IMPORTS ==================
const AWS = require("aws-sdk");
require("dotenv").config();

// ================== AWS CONFIG ==================
AWS.config.update({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const BUCKET = process.env.S3_BUCKET_NAME;

if (!BUCKET) {
  console.error("❌ ERROR: S3_BUCKET_NAME missing in .env");
}

// ================== CLASS ======================
class S3Service {
  
  // ---------- UPLOAD FILE ----------
  async uploadFile(patientId, file, fileType = "medical") {
    try {
      if (!file) {
        return { success: false, error: "No file uploaded" };
      }

      const key = `patients/${patientId}/${Date.now()}-${file.originalname}`;

      const params = {
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          patientId: String(patientId),
          fileType: fileType,
        }
      };

      console.log(`📤 Uploading to S3 → ${key}`);

      const data = await s3.upload(params).promise();

      return {
        success: true,
        key: data.Key,
        url: data.Location
      };

    } catch (err) {
      console.error("❌ S3 Upload Error:", err);
      return { success: false, error: err.message };
    }
  }

  // ---------- SIGNED URL ----------
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: BUCKET,
        Key: key,
        Expires: expiresIn
      };

      const url = await s3.getSignedUrlPromise("getObject", params);
      return { success: true, url };

    } catch (err) {
      console.error("❌ Signed URL Error:", err);
      return { success: false, error: err.message };
    }
  }

  // ---------- DELETE FILE ----------
  async deleteFile(key) {
    try {
      await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
      return { success: true };

    } catch (err) {
      console.error("❌ Delete Error:", err);
      return { success: false, error: err.message };
    }
  }

  // ---------- LIST FILES ----------
  async listPatientFiles(patientId) {
    try {
      const prefix = `patients/${patientId}/`;

      const data = await s3.listObjectsV2({
        Bucket: BUCKET,
        Prefix: prefix
      }).promise();

      const files = data.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));

      return { success: true, files };

    } catch (err) {
      console.error("❌ List Files Error:", err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new S3Service();
