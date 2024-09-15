import * as cdk from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface FargateSandboxStackProps extends cdk.StageProps {
  commitId: string;
}

export class FargateSandboxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: FargateSandboxStackProps) {
    super(scope, id, props);

    const versionId = props?.commitId;

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'FargateSandboxQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const vpc = new Vpc(this, "MyVpc", {
      maxAzs: 3, // Default is all AZs in the region
    });

    const cluster = new Cluster(this, "MyCluster", {
      vpc: vpc,
    });

    const repo = Repository.fromRepositoryArn(
      this,
      "test_repo_ref",
      "arn:aws:ecr:us-east-1:637423577773:repository/demo_repo"
    );

    new ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 3, // Default is 1
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(repo, versionId),
      },
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true, // Default is false
      healthCheck: {
        command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
        // the properties below are optional
        interval: cdk.Duration.seconds(20),
        retries: 5,
        startPeriod: cdk.Duration.minutes(1),
        timeout: cdk.Duration.seconds(5),
      },
    });
  }
}
