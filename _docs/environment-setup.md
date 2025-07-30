# Environment Setup Guide

This guide will help you set up the environment variables and configuration needed for the Base Power Site Survey Tool with AWS backend integration.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"
DATABASE_SSL=true

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
S3_BUCKET_NAME="survey-images-bucket"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Database Setup Options

### Option 1: AWS RDS PostgreSQL
1. Create an RDS PostgreSQL instance in AWS
2. Configure security groups to allow access
3. Use the connection string format:
   ```
   postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/database_name
   ```

### Option 2: Neon (Recommended for Development)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Use the provided connection string directly

### Option 3: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### Option 4: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb survey_tool`
3. Use connection string:
   ```
   postgresql://your_username:your_password@localhost:5432/survey_tool
   ```

## S3 Setup

### 1. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://survey-images-bucket --region us-east-1
```

### 2. Configure Bucket Policy
Apply this bucket policy for secure access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::survey-images-bucket/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::survey-images-bucket"
    }
  ]
}
```

### 3. Configure CORS
Add this CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": []
  }
]
```

## IAM User Setup

### 1. Create IAM User
1. Go to IAM in AWS Console
2. Create a new user with programmatic access
3. Attach the custom policy below

### 2. Custom IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::survey-images-bucket",
        "arn:aws:s3:::survey-images-bucket/*"
      ]
    }
  ]
}
```

## Database Migration

### 1. Run the Migration Script
Execute the SQL script to create the database schema:

```bash
# If using psql
psql "postgresql://username:password@hostname:5432/database_name" -f _docs/database-setup.sql

# Or connect and run manually
psql "your_connection_string"
\i _docs/database-setup.sql
```

### 2. Verify Schema
Check that the table was created correctly:

```sql
\d surveys;
\di surveys*;
```

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Configuration
Test your setup by checking the health endpoint:

```bash
npm run dev
# Visit http://localhost:3000/api/health
```

The health check should return:
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": true,
    "s3": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "message": "All services are operational"
}
```

### 3. Test Survey Flow
Visit `http://localhost:3000` to test the survey flow with the test UUID.

## Troubleshooting

### Database Connection Issues
- Check your connection string format
- Verify SSL settings match your database provider
- Ensure database exists and user has proper permissions

### S3 Connection Issues
- Verify AWS credentials are correct
- Check IAM permissions for S3 access
- Ensure bucket exists and is in the correct region
- Check CORS configuration for cross-origin requests

### General Issues
- Check all environment variables are set correctly
- Restart the development server after changing environment variables
- Check console logs for specific error messages

## Security Notes

1. **Never commit** `.env.local` or any file containing real credentials
2. Use different AWS credentials for development and production
3. Regularly rotate AWS access keys
4. Monitor S3 usage and costs
5. Enable AWS CloudTrail for audit logging

## Production Deployment

### Environment Variables for Production
- Use your hosting platform's environment variable system
- Ensure `NEXT_PUBLIC_APP_URL` points to your production domain
- Use production database and S3 bucket

### Security Checklist
- [ ] Database uses SSL connections
- [ ] S3 bucket has proper access policies
- [ ] IAM user has minimal required permissions
- [ ] Environment variables are securely stored
- [ ] CORS is configured for production domain
- [ ] CloudFront is configured for static assets (optional)

## Monitoring

Consider setting up monitoring for:
- Database connection health
- S3 upload/download success rates
- API response times
- Error rates and logging

This will help you identify and resolve issues quickly in production. 