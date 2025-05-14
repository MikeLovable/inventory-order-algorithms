
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as mime from 'mime-types';

interface BuildUploadOptions {
  bucketName: string;
  basePath: string;
  buildDir: string;
}

/**
 * Builds the React app and uploads it to S3
 * @param options Configuration options
 */
export async function buildAndUpload(options: BuildUploadOptions): Promise<void> {
  const { bucketName, basePath, buildDir } = options;
  
  console.log('Building React app...');
  
  try {
    // Run build command
    childProcess.execSync('npm run build', {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    
    console.log('Build successful. Uploading to S3...');
    
    // Initialize S3 client
    const s3 = new AWS.S3();
    
    // Make sure the destination path exists
    const destPath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
    
    // Upload files recursively
    await uploadDir(s3, buildDir, bucketName, destPath);
    
    console.log('Upload successful.');
  } catch (error) {
    console.error('Build or upload failed:', error);
    throw error;
  }
}

/**
 * Recursively uploads a directory to S3
 */
async function uploadDir(
  s3: AWS.S3,
  dirPath: string,
  bucketName: string,
  basePath: string,
  prefix: string = ''
): Promise<void> {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Recursive call for directories
      await uploadDir(s3, filePath, bucketName, basePath, path.join(prefix, file));
    } else {
      // Upload file
      const s3Key = prefix 
        ? path.join(basePath, prefix, file).replace(/\\/g, '/') 
        : path.join(basePath, file).replace(/\\/g, '/');
      
      const contentType = mime.lookup(filePath) || 'application/octet-stream';
      
      console.log(`Uploading ${filePath} to s3://${bucketName}/${s3Key}`);
      
      await s3.putObject({
        Bucket: bucketName,
        Key: s3Key,
        Body: fs.readFileSync(filePath),
        ContentType: contentType,
      }).promise();
    }
  }
}
