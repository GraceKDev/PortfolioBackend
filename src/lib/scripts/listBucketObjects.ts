
import {
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
});

async function main() {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }

  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 10,
    }),
  );

  console.log('S3 connection successful!');
  console.log('Objects:', response.Contents ?? []);
}

main().catch(console.error);
