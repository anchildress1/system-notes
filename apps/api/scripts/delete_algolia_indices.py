#!/usr/bin/env python3
"""
Delete all Algolia indices and reupload fresh data.
"""
import os
import asyncio
from algoliasearch.search.client import SearchClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APPLICATION_ID")
ALGOLIA_API_KEY = os.getenv("ALGOLIA_ADMIN_API_KEY")

if not ALGOLIA_APP_ID or not ALGOLIA_API_KEY:
    print("Error: ALGOLIA_APPLICATION_ID or ALGOLIA_ADMIN_API_KEY not found in environment.")
    exit(1)

async def delete_all_indices():
    """Delete all existing Algolia indices."""
    client = SearchClient(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
    
    # List of indices to delete
    indices_to_delete = ['projects', 'about', 'facts', 'artwork', 'blog_posts']
    
    print("🗑️  Deleting all existing indices...")
    
    for index_name in indices_to_delete:
        try:
            print(f"  - Deleting {index_name}...")
            await client.delete_index(index_name)
            print(f"    ✓ Deleted {index_name}")
        except Exception:
            # Index might not exist, that's okay
            print(f"    ℹ️  {index_name} not found or already deleted")
    
    await client.close()
    print("\n✅ All indices deleted\n")

if __name__ == "__main__":
    asyncio.run(delete_all_indices())
