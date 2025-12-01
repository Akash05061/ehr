// s3-service.js
const AWS = require('aws-sdk');

// -------------------------
// AWS CONFIGURATION
// -------------------------
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// S3 Client
const s3 = new AWS.S3();

// Bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
if (!BUCKET_NAME) {
  console.error("❌ ERROR: S3_BUCKET_NAME is missing in .env");
}

class S3Service {

  /** Upload file to S3 */
  async uploadFile(patientId, file, fileType) {
    try {
      if (!file) {
        return { success: false, error: "No file provided" };
      }

      const key = `patients/${patientId}/${Date.now()}-${file.originalname}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          patientId: String(patientId),
          fileType: fileType || "medical",
          uploadedBy: "ehr-system"
        }
      };

      console.log(`📤 Uploading file to S3: ${key}`);

      const result = await s3.upload(params).promise();

      return {
        success: true,
        key: result.Key,
        url: result.Location,
        size: file.size,
        mimeType: file.mimetype
      };

    } catch (error) {
      console.error("❌ S3 Upload Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /** Generate signed URL */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Expires: expiresIn
      };

      const signedUrl = await s3.getSignedUrlPromise("getObject", params);
      return { success: true, signedUrl };

    } catch (error) {
      console.error("❌ S3 Signed URL Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /** Delete file */
  async deleteFile(fileKey) {
    try {
      const params = { Bucket: BUCKET_NAME, Key: fileKey };
      await s3.deleteObject(params).promise();
      return { success: true };

    } catch (error) {
      console.error("❌ S3 Delete Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /** List files for a patient */
  async listPatientFiles(patientId) {
    try {
      const prefix = `patients/${patientId}/`;

      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix
      };

      const result = await s3.listObjectsV2(params).promise();

      const files = result.Contents.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified
      }));

      return { success: true, files };

    } catch (error) {
      console.error("❌ S3 List Error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new S3Service();
