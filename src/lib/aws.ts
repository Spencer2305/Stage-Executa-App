import AWS from 'aws-sdk';
import { db } from './db';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

// Constants for Executa App resources
const EXECUTA_APP_PREFIX = 'executa-app';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Generate account-specific bucket name
export function generateAccountBucketName(accountId: string): string {
  return `${EXECUTA_APP_PREFIX}-knowledge-${accountId}-${AWS_REGION}`.toLowerCase();
}

// Generate SQS queue name for file processing
export function generateProcessingQueueName(accountId: string): string {
  return `${EXECUTA_APP_PREFIX}-processing-${accountId}`;
}

// Create account-specific S3 bucket
export async function createAccountBucket(accountId: string): Promise<string> {
  const bucketName = generateAccountBucketName(accountId);
  
  try {
    // Check if bucket already exists
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
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

    await s3.createBucket(createParams).promise();

    // Set bucket policy for secure access
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ExecutaAppAccess',
          Effect: 'Allow',
          Principal: {
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket'
          ],
          Resource: [
            `arn:aws:s3:::${bucketName}`,
            `arn:aws:s3:::${bucketName}/*`
          ]
        }
      ]
    };

    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();

    // Enable versioning
    await s3.putBucketVersioning({
      Bucket: bucketName,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    }).promise();

    // Set lifecycle configuration to manage costs
    await s3.putBucketLifecycleConfiguration({
      Bucket: bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'DeleteIncompleteMultipartUploads',
            Status: 'Enabled',
            AbortIncompleteMultipartUpload: {
              DaysAfterInitiation: 1
            }
          },
          {
            Id: 'TransitionToIA',
            Status: 'Enabled',
            Transitions: [
              {
                Days: 30,
                StorageClass: 'STANDARD_IA'
              },
              {
                Days: 90,
                StorageClass: 'GLACIER'
              }
            ]
          }
        ]
      }
    }).promise();

    // Add tags for billing and organization
    await s3.putBucketTagging({
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
          },
          {
            Key: 'BillingGroup',
            Value: 'ExecutaApp-Knowledge-Storage'
          }
        ]
      }
    }).promise();

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
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        'original-filename': fileName,
        'checksum': checksum,
        'account-id': accountId,
        'upload-timestamp': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    };

    await s3.upload(uploadParams).promise();

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

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

// Delete file from S3
export async function deleteFileFromS3(bucketName: string, s3Key: string): Promise<void> {
  try {
    await s3.deleteObject({
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

    const result = await sqs.createQueue(createParams).promise();
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

    await sqs.sendMessage(params).promise();
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