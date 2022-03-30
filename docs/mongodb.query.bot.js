// db.getCollection('db-line-bot').getPlanCache().clear()

// db.getCollection('db-line-bot').aggregate([

// {"$match":{ "active": true, "userId": "U9e0a870c01ca97da20a4ec462bf72991" }},

// {"$project": {_id: 1, "name": 1, "botname": 1}},

// {"$lookup": {

//     "as":   "room",

//     "from": "db-line-bot-room",

//     "let":  {"botname": "$botname"},

//     "pipeline": [

//             {"$match": {"active": true}},

//             {"$match": {"$expr": {"$eq": ["$botname", "$$botname"]}}},

//             {"$project": {"_id": 0, "type": 1, "botname": 1, "name": 1}},

//             {"$sort": { "botname": 1, "name": 1 }}

//         ],

//     }

// }

// ])
