
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { LovableStackProps } from './lovable-stack-props';
import * as path from 'path';

export class AlgorithmicOrderSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LovableStackProps) {
    super(scope, id, props);

    // Create or use the provided S3 bucket for the React UI
    const originBucket = props.OriginBucket
      ? s3.Bucket.fromBucketName(this, 'OriginBucket', props.OriginBucket)
      : new s3.Bucket(this, 'LovableInventoryApp', {
          bucketName: 'lovable-inventory-app-' + this.account + '-' + this.region,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          publicReadAccess: false,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

    // Create the Lambda function for the API using NodejsFunction
    const apiHandler = new nodejs.NodejsFunction(this, 'AlgorithmicOrderSchedulerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/index.ts'), // Path to the lambda code
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: 'production',
      },
      bundling: {
        externalModules: [], // Include all modules in the bundle
        nodeModules: [],
        minify: true,
        sourceMap: true,
        tsconfig: path.join(__dirname, '../tsconfig.json'),
      },
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'AlgorithmicOrderSchedulerAPI', {
      restApiName: 'AlgorithmicOrderSchedulerAPI',
      description: 'API for AlgorithmicOrderScheduler',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    // Create API endpoints
    const getProductionScenariosIntegration = new apigateway.LambdaIntegration(apiHandler, {
      requestTemplates: { 'application/json': '{ "action": "GetProductionScenarios", "dataSource": "$input.params(\'DataSource\')" }' },
    });
    
    const getOrdersIntegration = new apigateway.LambdaIntegration(apiHandler, {
      requestTemplates: { 'application/json': '{ "action": "GetOrders", "body": $input.json(\'$\') }' },
    });
    
    const simulateOrdersIntegration = new apigateway.LambdaIntegration(apiHandler, {
      requestTemplates: { 'application/json': '{ "action": "SimulateOrders", "body": $input.json(\'$\') }' },
    });

    // Define API paths
    api.root.addResource('GetProductionScenarios')
      .addMethod('GET', getProductionScenariosIntegration);

    api.root.addResource('GetOrders')
      .addMethod('POST', getOrdersIntegration);

    api.root.addResource('SimulateOrders')
      .addMethod('POST', simulateOrdersIntegration);

    // Setup CloudFront distribution for the UI
    let certificate: acm.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;

    // If custom domain is provided, setup certificate and Route53 records
    if (props.CustomDomain) {
      // Extract domain parts
      const domainParts = props.CustomDomain.split('.');
      const domainName = domainParts.slice(domainParts.length - 2).join('.');
      
      // Look up the hosted zone
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: domainName,
      });
      
      // Create certificate using non-deprecated class
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: props.CustomDomain,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

    // Create CloudFront distribution with non-deprecated origin
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(originBucket, {
          originPath: `/${props.OriginBasePath}`,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      certificate: certificate,
      domainNames: props.CustomDomain ? [props.CustomDomain] : undefined,
    });

    // If custom domain is provided, create Route53 record
    if (props.CustomDomain && hostedZone) {
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: props.CustomDomain,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }

    // Output important values
    new cdk.CfnOutput(this, 'APIUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
    
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.domainName}`,
      description: 'CloudFront Distribution URL',
    });
    
    if (props.CustomDomain) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${props.CustomDomain}`,
        description: 'Custom Domain URL',
      });
    }
    
    new cdk.CfnOutput(this, 'BucketName', {
      value: originBucket.bucketName,
      description: 'S3 Bucket for UI',
    });
    
    new cdk.CfnOutput(this, 'OriginPath', {
      value: props.OriginBasePath,
      description: 'S3 Origin Path for UI',
    });
  }
}
