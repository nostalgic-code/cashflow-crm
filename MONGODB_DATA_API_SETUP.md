# 🔗 MongoDB Data API Setup Guide

## Why Use MongoDB Data API?

The MongoDB Data API bypasses SSL handshake issues on platforms like Render by using HTTP requests instead of direct database connections.

## Setup Steps

### 1. Enable Data API in MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Navigate to **Data API** section
3. Click **Enable Data API**
4. Choose your cluster (Cluster0)
5. Generate an API Key

### 2. Get Your Data API Configuration

After enabling, you'll get:
- **Data API App ID**: `data-abc123` (example)
- **API Key**: Your secret key
- **Base URL**: `https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action`

### 3. Update Your Environment Variables

In Render, add these environment variables:

```bash
MONGODB_API_KEY=your_api_key_here
```

### 4. Update the API Wrapper

Edit `mongodb_api_wrapper.py` and replace:

```python
# Replace this line:
self.base_url = "https://data.mongodb-api.com/app/data-abc123/endpoint/data/v1/action"

# With your actual App ID:
self.base_url = "https://data.mongodb-api.com/app/YOUR_ACTUAL_APP_ID/endpoint/data/v1/action"
```

## How It Works

✅ **HTTP Requests**: Uses standard HTTP instead of MongoDB protocol  
✅ **No SSL Issues**: Bypasses Render's SSL handshake problems  
✅ **Same Database**: Still connects to your existing MongoDB Atlas  
✅ **Easy Setup**: Just enable API and add one environment variable  

## Quick Test

After setup, your app will use HTTP requests like:
```
POST https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action/find
```

Instead of direct MongoDB connection with SSL.

## Alternative Options

If you prefer not to use Data API:

1. **Switch to Railway** (better MongoDB Atlas support)
2. **Use Supabase PostgreSQL** (migrate from MongoDB)
3. **Use MongoDB Community** (self-hosted)

**Recommended**: Try MongoDB Data API first - it's the simplest solution!