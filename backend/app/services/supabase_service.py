import asyncio
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings


class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
    
    async def upload_file(
        self,
        bucket: str,
        path: str,
        file_content: bytes,
        content_type: Optional[str] = None
    ) -> str:
        """Upload a file to Supabase Storage"""
        try:
            # Create bucket if it doesn't exist
            try:
                self.client.storage.get_bucket(bucket)
            except Exception:
                self.client.storage.create_bucket(bucket, public=False)
            
            # Upload file
            result = self.client.storage.from_(bucket).upload(
                path=path,
                file=file_content,
                file_options={"content-type": content_type} if content_type else None
            )
            
            return result
        except Exception as e:
            raise Exception(f"Failed to upload file to Supabase: {str(e)}")
    
    async def download_file(self, bucket: str, path: str) -> bytes:
        """Download a file from Supabase Storage"""
        try:
            result = self.client.storage.from_(bucket).download(path)
            return result
        except Exception as e:
            raise Exception(f"Failed to download file from Supabase: {str(e)}")
    
    async def delete_file(self, bucket: str, path: str) -> bool:
        """Delete a file from Supabase Storage"""
        try:
            result = self.client.storage.from_(bucket).remove([path])
            return True
        except Exception as e:
            raise Exception(f"Failed to delete file from Supabase: {str(e)}")
    
    async def get_file_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for file access"""
        try:
            result = self.client.storage.from_(bucket).create_signed_url(
                path=path,
                expires_in=expires_in
            )
            return result["signedURL"]
        except Exception as e:
            raise Exception(f"Failed to get file URL from Supabase: {str(e)}")
    
    async def list_files(self, bucket: str, folder: str = "") -> list:
        """List files in a bucket/folder"""
        try:
            result = self.client.storage.from_(bucket).list(folder)
            return result
        except Exception as e:
            raise Exception(f"Failed to list files from Supabase: {str(e)}") 