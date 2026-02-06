#!/usr/bin/env python3
"""
Update Algolia Agent Studio configuration with the prompt from algolia_prompt.md
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APPLICATION_ID")
ALGOLIA_API_KEY = os.getenv("ALGOLIA_ADMIN_API_KEY")
AGENT_ID = os.getenv("NEXT_PUBLIC_ALGOLIA_AGENT_ID")

if not all([ALGOLIA_APP_ID, ALGOLIA_API_KEY, AGENT_ID]):
    print("Error: Missing required environment variables")
    exit(1)

# Read the prompt file
script_dir = Path(__file__).parent
prompt_path = script_dir.parent / "algolia" / "algolia_prompt.md"

with open(prompt_path, 'r') as f:
    prompt_content = f.read()

# Algolia Agent Studio API endpoint
# Based on standard Algolia API patterns
url = f"https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/agents/{AGENT_ID}"

headers = {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key": ALGOLIA_API_KEY,
    "Content-Type": "application/json"
}

# Update agent configuration
payload = {
    "systemPrompt": prompt_content,
    "indices": [
        {"indexName": "system-notes"}
    ]
}

print(f"🔧 Updating Algolia Agent {AGENT_ID}...")
print(f"📝 Prompt length: {len(prompt_content)} characters")
print()

try:
    response = requests.put(url, json=payload, headers=headers)
    
    if response.status_code in [200, 201, 204]:
        print("✅ Agent configuration updated successfully!")
        print()
        print("Updated settings:")
        print(f"  - System prompt: {len(prompt_content)} chars")
        print("  - Indices: projects, about, blog_posts")
    else:
        print(f"❌ Failed to update agent: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Try alternative endpoint
        print()
        print("Trying alternative API endpoint...")
        alt_url = f"https://{ALGOLIA_APP_ID}.algolia.net/1/agents/{AGENT_ID}"
        response = requests.put(alt_url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 204]:
            print("✅ Agent configuration updated successfully (alternative endpoint)!")
        else:
            print(f"❌ Alternative endpoint also failed: {response.status_code}")
            print(f"Response: {response.text}")
            
except Exception as e:
    print(f"❌ Error: {e}")
    print()
    print("Note: You may need to update the agent configuration manually in the Algolia dashboard:")
    print(f"  1. Go to https://dashboard.algolia.com/apps/{ALGOLIA_APP_ID}/agent-studio")
    print(f"  2. Select agent {AGENT_ID}")
    print(f"  3. Update the system prompt with content from {prompt_path}")
