"""
MinIO / S3 storage utilities.
"""
import boto3
from botocore.client import BaseClient

from app.core.config import settings

_s3_client: BaseClient | None = None


def get_s3_client() -> BaseClient:
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
        )
    return _s3_client


def get_presigned_upload_url(key: str, content_type: str, expires: int = 3600) -> str:
    """Generate a pre-signed URL for direct client-side uploads."""
    client = get_s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_BUCKET_NAME,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
    )


def get_presigned_download_url(key: str, expires: int = 3600) -> str:
    """Generate a pre-signed URL for file download/viewing."""
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires,
    )
