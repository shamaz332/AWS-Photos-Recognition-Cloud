import * as cdk from "@aws-cdk/core";
import { Duration } from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as eventSources from "@aws-cdk/aws-lambda-event-sources";
import { table } from "console";

export class PhotorecogStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //========================================================
    //S3 Bucket for Image
    //========================================================

    const imageBucket = new s3.Bucket(this, "imageBucket", {});
    //========================================================
    //Table for sorting Image
    //========================================================
    const imageSortTable = new dynamodb.Table(this, "imageSortTable", {
      partitionKey: {
        name: "image",
        type: dynamodb.AttributeType.STRING,
      },
    });
    // =====================================================================================
    // Thumbnail Bucket
    // =====================================================================================
    const resizedBucket = new s3.Bucket(this, "resizedBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, "resizedBucket", {
      value: resizedBucket.bucketName,
    });

    // =====================================================================================
    // Building our AWS Lambda Function; compute for our serverless microservice
    //Lambda layer
    // =====================================================================================
    const layer = new lambda.LayerVersion(this, "pil", {
      code: lambda.Code.fromAsset("recogLayer"),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      license: "Apache-2.0",
      description:
        "A layer to enable the PIL library in our Rekognition Lambda",
    });

    //========================================================
    //Lambda func for Image recognition
    //========================================================

    const rekogFunc = new lambda.Function(this, "rekogFunc", {
      code: lambda.Code.fromAsset("recognitionFunction"),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: "index.handler",
      timeout: Duration.seconds(30),
      memorySize: 1024,
      layers:[layer],
      environment: {
        TABLE: imageSortTable.tableName,
        BUCKET: imageBucket.bucketName,
        RESIZEBUCKET:resizedBucket.bucketName
      },
    });

    rekogFunc.addEventSource(
      new eventSources.S3EventSource(imageBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );
    imageBucket.grantRead(rekogFunc);
    resizedBucket.grantPut(rekogFunc);
    imageSortTable.grantWriteData(rekogFunc);

    rekogFunc.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["rekognition:DetectLabels"],
        resources: ["*"],
      })
    );
  }
}
