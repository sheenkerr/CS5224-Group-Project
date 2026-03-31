import os
import json
import boto3

sns = boto3.client("sns")

def lambda_handler(event, context):

    topic_arn = os.environ["SNS_TOPIC_ARN"]

    # handle both direct JSON and stringified body
    if "body" in event:
        body = json.loads(event["body"])
    else:
        body = event

    subject = body.get("subject", "Default Subject")
    message = body.get("message", "Default Message")

    sns.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Email sent"})
    }