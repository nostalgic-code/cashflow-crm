"""
Simple MongoDB wrapper that bypasses SSL issues
Uses HTTP requests to MongoDB Atlas Data API instead of direct connection
"""

import requests
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class MongoDBWrapper:
    """Simple MongoDB wrapper using Atlas Data API"""
    
    def __init__(self):
        # MongoDB Atlas Data API endpoints
        self.base_url = "https://data.mongodb-api.com/app/data-abc123/endpoint/data/v1/action"
        self.api_key = os.getenv('MONGODB_API_KEY')  # You'll need to create this in Atlas
        self.data_source = "Cluster0"
        self.database = "cashflowloans"
        
        self.headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
    
    def _make_request(self, action: str, collection: str, data: Dict = None) -> Dict:
        """Make request to MongoDB Data API"""
        url = f"{self.base_url}/{action}"
        
        payload = {
            "collection": collection,
            "database": self.database,
            "dataSource": self.data_source
        }
        
        if data:
            payload.update(data)
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"MongoDB API Error: {e}")
            return {"error": str(e)}
    
    def find_all(self, collection: str) -> List[Dict]:
        """Find all documents"""
        result = self._make_request("find", collection)
        return result.get("documents", [])
    
    def find_one(self, collection: str, filter_doc: Dict) -> Optional[Dict]:
        """Find one document"""
        result = self._make_request("findOne", collection, {"filter": filter_doc})
        return result.get("document")
    
    def insert_one(self, collection: str, document: Dict) -> Optional[str]:
        """Insert one document"""
        result = self._make_request("insertOne", collection, {"document": document})
        return result.get("insertedId")
    
    def update_one(self, collection: str, filter_doc: Dict, update_doc: Dict) -> bool:
        """Update one document"""
        result = self._make_request("updateOne", collection, {
            "filter": filter_doc,
            "update": update_doc
        })
        return result.get("modifiedCount", 0) > 0
    
    def delete_one(self, collection: str, filter_doc: Dict) -> bool:
        """Delete one document"""
        result = self._make_request("deleteOne", collection, {"filter": filter_doc})
        return result.get("deletedCount", 0) > 0

# Create global instance
mongo_api = MongoDBWrapper()