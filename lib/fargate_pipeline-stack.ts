import * as cdk from "aws-cdk-lib";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { FargatePipelineStage } from "./fargate_pipeline-stage";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Role } from "aws-cdk-lib/aws-iam";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const GITHUB_CONNECTION_ARN: string =
  "arn:aws:codestar-connections:us-east-1:637423577773:connection/78b54ada-1f46-4e0d-8b5c-572f1c8ee882";

export class FargatePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ECR_REPO_ARN =
      "arn:aws:ecr:us-east-1:637423577773:repository/demo_repo";

    const ecrRepo = Repository.fromRepositoryArn(this, "ecrRepo", ECR_REPO_ARN);

    const REPOSITORY_URI = ecrRepo.repositoryUri;

    const preBuildRole = new Role(this, "preBuildRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("codebuild.amazonaws.com"),
    });

    preBuildRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryFullAccess"
      )
    );

    const codeRepo = CodePipelineSource.connection(
      "andrewtdunn/fargatePipeline",
      "main",
      {
        connectionArn: GITHUB_CONNECTION_ARN,
      }
    );

    const preBuildStep = new CodeBuildStep("PreBuildStep", {
      input: codeRepo,
      commands: [
        'timeout 15 sh -c "until docker info; do echo .; sleep 1; done"',
        "aws --version",
        'export DOCKER_DEFAULT_PLATFORM="linux/amd64"',
        `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${REPOSITORY_URI}`,
        `export COMMIT_HASH=$CODEBUILD_BUILD_NUMBER`,
        "IMAGE_TAG=${COMMIT_HASH:=latest}",
        "echo Build started on `date`",
        "echo Building the Docker image...",
        `export REPOSITORY_URI='${REPOSITORY_URI}'`,
        "pwd",
        "cd sample_app",
        "ls",
        "docker build -f ./Dockerfile -t $REPOSITORY_URI:latest --platform linux/amd64 .",
        "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG",
        "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG",
        "cd ..",
        "echo Build completed on `date`",
        "echo Pushing the Docker images...",
        "docker push $REPOSITORY_URI:latest",
        "docker push $REPOSITORY_URI:$IMAGE_TAG",
        "echo Writing image definitions file...",
        `printf \'[{"name":"%s","imageUri":"%s"}]\' ${ecrRepo.repositoryName} $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json`,
      ],
      primaryOutputDirectory: "./",
      role: preBuildRole,
    });

    const pipeline = new CodePipeline(this, "FargatePipeline", {
      pipelineName: "FargatePipeline",
      crossAccountKeys: true,
      synth: new cdk.pipelines.ShellStep("SynthStep", {
        input: preBuildStep,
        commands: ["npm ci", "npm run build", "npx cdk synth"],
        env: {
          BUILD_ID: preBuildStep.exportedVariable("COMMIT_HASH"),
        },
      }),
    });

    pipeline.addStage(
      new FargatePipelineStage(this, "Dev", {
        env: {
          account: "730335377532",
          region: "us-east-1",
        },
      })
    );
  }
}
