import * as cdk from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const GITHUB_CONNECTION_ARN: string =
  "arn:aws:codestar-connections:us-east-1:637423577773:connection/78b54ada-1f46-4e0d-8b5c-572f1c8ee882";

export class FargatePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const codeRepo = CodePipelineSource.connection(
      "andrewtdunn/fargatePipeline",
      "main",
      {
        connectionArn: GITHUB_CONNECTION_ARN,
      }
    );

    const pipeline = new CodePipeline(this, "FargatePipeline", {
      pipelineName: "FargatePipeline",
      crossAccountKeys: true,
      synth: new cdk.pipelines.ShellStep("SynthStep", {
        input: codeRepo,
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }
}
