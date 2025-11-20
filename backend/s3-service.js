const AWS = require('aws-sdk');

// Configure AWS SDK
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ehr-medical-files-yourname';

class S3Service {
  // Upload file to S3
  async uploadFile(patientId, file, fileType) {
    const key = `patients/${patientId}/${Date.now()}-${file.originalname}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        patientId: patientId.toString(),
        uploadedBy: 'ehr-system'
      }
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        success: true,
        key: result.Key,
        url: result.Location,
        size: file.size,
        type: file.mimetype
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate pre-signed URL for secure file access
  async getSignedUrl(fileKey, expiresIn = 3600) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Expires: expiresIn
    };

    try {
      const signedUrl = await s3.getSignedUrlPromise('getObject', params);
      return { success: true, signedUrl };
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete file from S3
  async deleteFile(fileKey) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey
    };

    try {
      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 Delete Error:', error);
      return { success: false, error: error.message };
    }
  }

  // List files for a patient
  async listPatientFiles(patientId, prefix = '') {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: `patients/${patientId}/${prefix}`
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified
        }))
      };
    } catch (error) {
      console.error('S3 List Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new S3Service();
