
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlgorithmicOrderSchedulerStack } from '../lib/algorithmic-order-scheduler-stack';

const app = new cdk.App();
new AlgorithmicOrderSchedulerStack(app, 'AlgorithmicOrderSchedulerStack', {
  // If you want to use a custom domain, uncomment and modify these lines
  // CustomDomain: 'your-domain.com',
  
  // The origin base path is the S3 key prefix where the React app files will be stored
  OriginBasePath: 'app',
  
  /* If you uncomment the next line, the stack will create a new bucket.
   * Otherwise, it will create a bucket named "LovableInventoryApp" 
   */
  // OriginBucket: 'your-bucket-name',
  
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
