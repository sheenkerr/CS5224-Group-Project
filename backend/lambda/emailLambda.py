import json
import boto3
import os

sns = boto3.client("sns")


def lambda_handler(event, context):

    body = json.loads(event["body"]) if "body" in event else event

    subject = body.get("subject", "Default Subject")
    message = body.get("message", "Default Message")
    email = body.get("email")

    topic_arn = os.environ["SNS_TOPIC_ARN"]

    # subscribe email
    if email:
        try:
            if not is_email_subscribed(topic_arn, email):
                sns.subscribe(
                    TopicArn=topic_arn,
                    Protocol='email',
                    Endpoint=email
                )
                print("Subscription initiated:", email)
            else:
                print("Already subscribed:", email)

        except Exception as e:
            print("Subscription error:", str(e))

    # send email
    sns.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Email sent"})
    }
def is_email_subscribed(topic_arn, email):
    response = sns.list_subscriptions_by_topic(TopicArn=topic_arn)

    for sub in response.get("Subscriptions", []):
        if sub["Endpoint"] == email and sub["SubscriptionArn"] != "PendingConfirmation":
            return True

    return False