import os
import boto3

sns = boto3.client("sns")

def lambda_handler(event, context):

    topic_arn = os.environ["SNS_TOPIC_ARN"]

    sns.publish(
        TopicArn=topic_arn,
        Subject="Scheduled Email",
        Message="This is your scheduled email notification."
    )

    return {
        "statusCode": 200,
        "body": "Email sent successfully"
    }