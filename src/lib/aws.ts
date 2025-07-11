import AWS from 'aws-sdk';
import { db } from './db';

// Configure AWS conditionally
let s3: AWS.S3 | null = null;
let sqs: AWS.SQS | null = null;

// Only initialize AWS services if credentials are available
// Use custom environment variable names for Netlify compatibility
if (process.env.EXECUTA_AWS_ACCESS_KEY_ID && 
    process.env.EXECUTA_AWS_SECRET_ACCESS_KEY && 
    process.env.EXECUTA_AWS_ACCESS_KEY_ID !== 'your-aws-access-key-id') {
  
  AWS.config.update({
    region: process.env.EXECUTA_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.EXECUTA_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.EXECUTA_AWS_SECRET_ACCESS_KEY,
  });
  
  s3 = new AWS.S3();
  sqs = new AWS.SQS();
}

// Helper function to get S3 with error handling
function getS3(): AWS.S3 {
  if (!s3) {
    throw new Error('AWS S3 not initialized - AWS credentials not configured');
  }
  return s3;
}

// Helper function to get SQS with error handling
function getSQS(): AWS.SQS {
  if (!sqs) {
    throw new Error('AWS SQS not initialized - AWS credentials not configured');
  }
  return sqs;
}

// Constants for Executa App resources
const EXECUTA_APP_PREFIX = 'executa-app';
const AWS_REGION = process.env.EXECUTA_AWS_REGION || 'us-east-1';

// Generate account-specific bucket name
export function generateAccountBucketName(accountId: string): string {
  // S3 bucket names can only contain lowercase letters, numbers, and hyphens
  // Must be between 3 and 63 characters, start and end with letter/number
  const sanitizedAccountId = accountId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const sanitizedRegion = AWS_REGION.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  
  // Build bucket name: executa-app-knowledge-{accountId}-{region}
  const bucketName = `${EXECUTA_APP_PREFIX}-knowledge-${sanitizedAccountId}-${sanitizedRegion}`;
  
  // Ensure it's not too long (S3 limit is 63 characters)
  if (bucketName.length > 63) {
    // Truncate account ID if needed
    const maxAccountIdLength = 63 - EXECUTA_APP_PREFIX.length - '-knowledge--'.length - sanitizedRegion.length;
    const truncatedAccountId = sanitizedAccountId.substring(0, maxAccountIdLength);
    return `${EXECUTA_APP_PREFIX}-knowledge-${truncatedAccountId}-${sanitizedRegion}`;
  }
  
  return bucketName;
}

// Generate SQS queue name for file processing
export function generateProcessingQueueName(accountId: string): string {
  return `${EXECUTA_APP_PREFIX}-processing-${accountId}`;
}

// Create account-specific S3 bucket
export async function createAccountBucket(accountId: string): Promise<string> {
  const bucketName = generateAccountBucketName(accountId);
  console.log(`🪣 Attempting to create S3 bucket: ${bucketName} for account: ${accountId}`);
  
  try {
    // Check if bucket already exists
    try {
      await getS3().headBucket({ Bucket: bucketName }).promise();
      console.log(`Bucket ${bucketName} already exists`);
      return bucketName;
    } catch (error) {
      // Bucket doesn't exist, create it
    }

    // Create bucket
    const createParams: AWS.S3.CreateBucketRequest = {
      Bucket: bucketName,
      CreateBucketConfiguration: AWS_REGION !== 'us-east-1' ? {
        LocationConstraint: AWS_REGION as AWS.S3.BucketLocationConstraint
      } : undefined
    };

    await getS3().createBucket(createParams).promise();
    console.log(`✅ Bucket created: ${bucketName}`);

    // Enable server-side encryption (simplest approach)
    try {
      await getS3().putBucketEncryption({
        Bucket: bucketName,
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      }).promise();
      console.log(`✅ Encryption enabled for: ${bucketName}`);
    } catch (encryptionError) {
      console.log(`⚠️ Could not enable encryption (non-critical): ${String(encryptionError)}`);
    }

    // Add basic tags (optional, non-critical)
    try {
      await getS3().putBucketTagging({
        Bucket: bucketName,
        Tagging: {
          TagSet: [
            {
              Key: 'Project',
              Value: 'ExecutaApp'
            },
            {
              Key: 'AccountId',
              Value: accountId
            },
            {
              Key: 'Environment',
              Value: process.env.NODE_ENV || 'development'
            }
          ]
        }
      }).promise();
      console.log(`✅ Tags added to: ${bucketName}`);
    } catch (tagError) {
      console.log(`⚠️ Could not add tags (non-critical): ${String(tagError)}`);
    }

    console.log(`Created bucket: ${bucketName}`);
    return bucketName;
  } catch (error) {
    console.error(`Error creating bucket for account ${accountId}:`, error);
    throw new Error(`Failed to create S3 bucket: ${error}`);
  }
}

// Upload file to account-specific bucket
export async function uploadFileToAccountBucket(
  accountId: string,
  file: Buffer,
  fileName: string,
  mimeType: string,
  checksum: string
): Promise<{ s3Key: string; s3Bucket: string }> {
  const bucketName = generateAccountBucketName(accountId);
  const s3Key = `knowledge-files/${Date.now()}-${fileName}`;

  try {
    // Encode filename for HTTP header compatibility (base64 to handle special characters)
    const encodedFilename = Buffer.from(fileName, 'utf8').toString('base64');
    
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        'original-filename-encoded': encodedFilename,
        'checksum': checksum,
        'account-id': accountId,
        'upload-timestamp': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    };

    await getS3().upload(uploadParams).promise();

    return {
      s3Key,
      s3Bucket: bucketName
    };
  } catch (error) {
    console.error(`Error uploading file to account ${accountId}:`, error);
    throw new Error(`Failed to upload file: ${error}`);
  }
}

// Get presigned URL for file download
export async function getPresignedDownloadUrl(
  bucketName: string,
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Expires: expiresIn
    };

    return getS3().getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

// Delete file from S3
export async function deleteFileFromS3(bucketName: string, s3Key: string): Promise<void> {
  try {
    await getS3().deleteObject({
      Bucket: bucketName,
      Key: s3Key
    }).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error(`Failed to delete file: ${error}`);
  }
}

// Create SQS queue for file processing
export async function createProcessingQueue(accountId: string): Promise<string> {
  const queueName = generateProcessingQueueName(accountId);
  
  try {
    const createParams: AWS.SQS.CreateQueueRequest = {
      QueueName: queueName,
      Attributes: {
        'MessageRetentionPeriod': '1209600', // 14 days
        'VisibilityTimeoutSeconds': '300', // 5 minutes
        'DelaySeconds': '0',
        'MaxReceiveCount': '3'
      },
      tags: {
        'Project': 'ExecutaApp',
        'AccountId': accountId,
        'Environment': process.env.NODE_ENV || 'development',
        'BillingGroup': 'ExecutaApp-File-Processing'
      }
    };

    const result = await getSQS().createQueue(createParams).promise();
    return result.QueueUrl!;
  } catch (error) {
    console.error(`Error creating SQS queue for account ${accountId}:`, error);
    throw new Error(`Failed to create processing queue: ${error}`);
  }
}

// Send file processing message to SQS
export async function sendFileProcessingMessage(
  queueUrl: string,
  message: {
    fileId: string;
    accountId: string;
    s3Bucket: string;
    s3Key: string;
    processingSessionId?: string;
  }
): Promise<void> {
  try {
    const params: AWS.SQS.SendMessageRequest = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        'AccountId': {
          DataType: 'String',
          StringValue: message.accountId
        },
        'FileId': {
          DataType: 'String',
          StringValue: message.fileId
        }
      }
    };

    await getSQS().sendMessage(params).promise();
  } catch (error) {
    console.error('Error sending processing message:', error);
    throw new Error(`Failed to send processing message: ${error}`);
  }
}

// Initialize account infrastructure (bucket + queue)
export async function initializeAccountInfrastructure(accountId: string): Promise<{
  bucketName: string;
  queueUrl: string;
}> {
  try {
    const [bucketName, queueUrl] = await Promise.all([
      createAccountBucket(accountId),
      createProcessingQueue(accountId)
    ]);

    // Update account in database with bucket name
    await db.account.update({
      where: { accountId },
      data: { s3BucketName: bucketName }
    });

    return { bucketName, queueUrl };
  } catch (error) {
    console.error(`Error initializing infrastructure for account ${accountId}:`, error);
    throw error;
  }
}

// Get account bucket name (create if doesn't exist)
export async function ensureAccountBucket(accountId: string): Promise<string> {
  try {
    // Check if account already has a bucket
    const account = await db.account.findUnique({
      where: { accountId },
      select: { s3BucketName: true }
    });

    if (account?.s3BucketName) {
      return account.s3BucketName;
    }

    // Create bucket if it doesn't exist
    const bucketName = await createAccountBucket(accountId);
    
    // Update account record
    await db.account.update({
      where: { accountId },
      data: { s3BucketName: bucketName }
    });

    return bucketName;
  } catch (error) {
    console.error(`Error ensuring bucket for account ${accountId}:`, error);
    throw error;
  }
} 