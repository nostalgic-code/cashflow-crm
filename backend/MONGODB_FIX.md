# MongoDB Connection String Options for Render

## Current Issue:
SSL handshake errors when connecting from Render to MongoDB Atlas

## Solutions Implemented:

### 1. Multiple Connection Methods
- Try SSL disabled first (fastest)
- Fallback to SSL with relaxed security
- Final fallback to default connection

### 2. Environment Variable Check
- Check both MONGODB_URI and MONGO_URI
- Ensure connection string is properly set in Render dashboard

### 3. Connection String Format
Your connection string should be:
```
mongodb+srv://tcityhorizon88_db_user:kHGmFJIUqsm51mYo@cluster0.pmt1i7t.mongodb.net/cashflowloans?retryWrites=true&w=majority&ssl=true
```

Or for SSL issues, try:
```
mongodb+srv://tcityhorizon88_db_user:kHGmFJIUqsm51mYo@cluster0.pmt1i7t.mongodb.net/cashflowloans?retryWrites=true&w=majority&ssl=false
```

### 4. Alternative: Use MongoDB Connection String with SSL Options
```
mongodb+srv://tcityhorizon88_db_user:kHGmFJIUqsm51mYo@cluster0.pmt1i7t.mongodb.net/cashflowloans?ssl=true&ssl_cert_reqs=CERT_NONE
```

The updated database.py will try these methods automatically.