import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateSandboxStack } from "./fargate_sandbox-stack";
export class FargatePipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);
    const fargateService = new FargateSandboxStack(
      this,
      "FargatePipelineStack"
    );
  }
}
