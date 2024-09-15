import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateSandboxStack } from "./fargate_sandbox-stack";

interface FargatePipelineStageProps extends StageProps {
  commitId: string;
}

export class FargatePipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: FargatePipelineStageProps) {
    super(scope, id, props);
    const fargateService = new FargateSandboxStack(
      this,
      "FargatePipelineStack",
      {
        commitId: props.commitId,
      }
    );
  }
}
