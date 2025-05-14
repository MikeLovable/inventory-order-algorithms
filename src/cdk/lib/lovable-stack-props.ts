
import * as cdk from 'aws-cdk-lib';

/**
 * Properties for the AlgorithmicOrderScheduler stack
 */
export interface LovableStackProps extends cdk.StackProps {
  /**
   * Optional custom domain for the CloudFront distribution
   */
  CustomDomain?: string;
  
  /**
   * Optional S3 bucket for storing the React UI files
   * If not provided, a bucket named "LovableInventoryApp" will be created
   */
  OriginBucket?: string;
  
  /**
   * S3 key prefix for the React UI files
   */
  OriginBasePath: string;
}
