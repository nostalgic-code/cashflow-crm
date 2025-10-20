# 🔗 MongoDB Atlas Data API - Visual Setup Guide

## Step-by-Step Instructions

### 1. Login to MongoDB Atlas
Go to: **https://cloud.mongodb.com**

### 2. Navigate to Data API Section

**Option A: From Left Sidebar**
```
📊 Dashboard
📂 Database
🔗 Data API          ← Click here!
⚙️  Network Access
👥 Database Access
```

**Option B: From Top Menu**
```
Overview | Data Services | App Services | Charts | Triggers
                ↑
         Click "App Services"
```

### 3. Enable Data API

You'll see a page like this:

```
┌─────────────────────────────────────────┐
│  Data API                               │
│                                         │
│  ⚡ Enable Data API                    │
│  │                                     │
│  │  Get started with the Data API      │
│  │  to access your data via HTTPS      │
│  │                                     │
│  │  [Enable Data API Button]          │ ← Click this!
│  └─────────────────────────────────────┘
```

### 4. Configure Data API

After clicking "Enable Data API":

1. **Choose your cluster**: Select "Cluster0" (or your cluster name)
2. **Create API Key**: 
   - Click "Create API Key"
   - Copy the generated key (save it!)
3. **Get App ID**: You'll see something like `data-abc123def`

### 5. Important Information to Copy

After setup, you'll see:

```
┌─────────────────────────────────────────┐
│  Data API Enabled ✅                   │
│                                         │
│  App ID: data-abc123def                 │ ← Copy this!
│  API Key: [Hidden - click to reveal]    │ ← Copy this!
│  Base URL: https://data.mongodb-api.com │
│          /app/data-abc123def/endpoint   │
│          /data/v1/action                │
│                                         │
│  Data Source: Cluster0                  │
│  Database: cashflowloans                │
└─────────────────────────────────────────┘
```

## Quick Alternative Navigation

If you can't find "Data API" in the sidebar:

1. Go to **Atlas homepage**
2. Click on your **Project name**
3. Look for **"App Services"** tab
4. Click **"Build a New App"**
5. Choose **"Data API"** template
6. Follow the setup wizard

## After You Enable It

### Update Your Code

1. **Edit `mongodb_api_wrapper.py`**:
   ```python
   # Replace this line:
   self.base_url = "https://data.mongodb-api.com/app/data-abc123/endpoint/data/v1/action"
   
   # With your actual App ID:
   self.base_url = "https://data.mongodb-api.com/app/YOUR_ACTUAL_APP_ID/endpoint/data/v1/action"
   ```

2. **Add to Render Environment Variables**:
   ```
   MONGODB_API_KEY=your_copied_api_key_here
   ```

## Troubleshooting

**Can't find Data API?**
- Make sure you're in the correct project
- Try refreshing the page
- Look under "App Services" instead

**Already have App Services?**
- Click on existing app
- Go to "Data API" section
- Enable it there

**Need help?**
- MongoDB Atlas UI changes sometimes
- Look for anything related to "Data API" or "App Services"
- The key is to enable HTTP access to your database

---

**📞 Need Help?** The exact location might vary, but look for:
- "Data API" 
- "App Services"
- "HTTP Access"
- "REST API"

All refer to the same feature!