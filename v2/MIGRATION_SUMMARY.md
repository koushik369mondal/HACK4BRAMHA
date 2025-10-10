# Migration from Supabase to MongoDB Atlas

This document outlines all the changes made to remove Supabase dependencies and replace them with MongoDB Atlas.

## Changes Made

### 1. Frontend Changes

#### Removed Files:
- `src/services/supabase.js` - Deleted Supabase service file

#### New Files:
- `src/services/auth.js` - New authentication service using backend API

#### Modified Files:
- `package.json` - Removed `@supabase/supabase-js` dependency
- `.env` - Removed all Supabase environment variables
- `src/components/SignUp.jsx` - Updated to use new auth service
- `src/components/SignIn.jsx` - Updated to use new auth service

#### Environment Variables Removed:
```
SUPABASE_URL
SUPABASE_PROJECT_REF
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 2. Backend Changes

#### New Files:
- `db/mongodb.js` - MongoDB connection configuration
- `models/UserProfile.js` - User profile MongoDB schema
- `models/Complaint.js` - Complaint MongoDB schema  
- `models/Department.js` - Department MongoDB schema
- `models/OtpCode.js` - OTP code MongoDB schema
- `models/index.js` - Models export file

#### Modified Files:
- `package.json` - Removed PostgreSQL and Supabase dependencies, added Mongoose
- `.env` - Replaced PostgreSQL config with MongoDB Atlas config
- `app.js` - Updated to use MongoDB connection
- `db/init.js` - Replaced PostgreSQL initialization with MongoDB
- `db/index.js` - Updated to use MongoDB connection

#### Dependencies Changed:
```json
// Removed:
"@supabase/supabase-js": "^2.58.0"
"pg": "^8.16.3"

// Added:
"mongoose": "^8.0.0"
```

#### Environment Variables Changed:
```bash
# OLD (PostgreSQL/Supabase):
DB_USER=postgres
DB_HOST=db.xmhxqetugtvyeqrpjdoi.supabase.co
DB_NAME=postgres
DB_PASSWORD=NayakSetu@123
DB_PORT=5432
DB_URL=postgresql://postgres:NayakSetu@123@db.xmhxqetugtvyeqrpjdoi.supabase.co:5432/postgres
SUPABASE_URL=https://xmhxqetugtvyeqrpjdoi.supabase.co

# NEW (MongoDB Atlas):
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/naiyaksetu?retryWrites=true&w=majority
DB_NAME=naiyaksetu
```

## Next Steps

### 1. Set up MongoDB Atlas
1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Update the `MONGODB_URI` in your `.env` file

### 2. Install Dependencies
```bash
# Frontend
cd Frontend
npm install

# Backend  
cd Backend
npm install
```

### 3. Initialize Database
```bash
cd Backend
npm run db:init
```

### 4. Update Controllers (Next Phase)
The controllers will need to be updated to use MongoDB/Mongoose instead of PostgreSQL queries. This includes:
- `controllers/authController.js`
- `controllers/userController.js` 
- `controllers/complaintController.js`

## MongoDB Schema Overview

### UserProfile Collection
- Stores user authentication and profile data
- Includes email, name, phone, password, role, verification status

### Complaint Collection  
- Main complaints with embedded subdocuments for:
  - Attachments
  - Status history
  - Comments
  - Aadhaar verification data

### Department Collection
- Government departments handling complaints

### OtpCode Collection
- Temporary OTP codes for verification
- Auto-expires using MongoDB TTL indexes

## Benefits of MongoDB Migration

1. **NoSQL Flexibility** - Better suited for document-based complaint data
2. **Embedded Documents** - Complaint attachments, comments, and history stored together
3. **Horizontal Scaling** - Better scalability than PostgreSQL
4. **Atlas Integration** - Built-in monitoring, backups, and security
5. **Cost Effective** - No more Supabase subscription needed