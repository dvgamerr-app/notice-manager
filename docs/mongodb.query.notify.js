db.getCollection('db-service-bot').aggregate([
    { "$match": { "active": true, "userId": "U6e27176f34129a3cd1386b8849cb0906" } },
    { "$project": {"_id": 1, "name": 1, "service": 1, "client": 1, "secret": 1}},
    {"$sort": { "service": 1 }},
    {"$lookup": {
        "as":   "room",
        "from": "db-service-oauth",
        "let":  {"service": "$service"},
        "pipeline": [
                {"$match": { "accessToken": { "$ne": null }}},
                {"$match": {"$expr": {"$eq": ["$service", "$$service"]}}},
                {"$project": {"_id": 0, "accessToken": 1, "room": 1, "name": 1}},
                {"$sort": { "room": 1, "name": 1 }}
            ],
        }
    }
])