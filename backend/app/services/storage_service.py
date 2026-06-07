"""
MinIO / S3 file storage service.
"""

import logging
import uuid

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

_s3_client = None


def get_s3_client():
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


def upload_file(file_bytes: bytes, content_type: str, prefix: str = "uploads") -> str | None:
    """
    Upload file bytes to S3/MinIO.
    Returns the public URL, or None on failure.
    """
    ext = content_type.split("/")[-1] if "/" in content_type else "bin"
    key = f"{prefix}/{uuid.uuid4().hex}.{ext}"

    try:
        client = get_s3_client()
        client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        # Build public URL
        url = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{key}"
        return url
    except ClientError as exc:
        logger.error(f"S3 upload failed: {exc}")
        return None


def delete_file(url: str) -> bool:
    """Delete a file from S3/MinIO by its URL."""
    try:
        # Extract the key from the URL
        prefix = f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/"
        if not url.startswith(prefix):
            return False
        key = url[len(prefix) :]
        client = get_s3_client()
        client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
        return True
    except ClientError as exc:
        logger.error(f"S3 delete failed: {exc}")
        return False
