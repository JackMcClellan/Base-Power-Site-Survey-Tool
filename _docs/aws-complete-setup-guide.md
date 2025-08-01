# Complete AWS Setup Guide - Base Power Site Survey Tool

This comprehensive guide will walk you through setting up the complete AWS infrastructure for the Base Power Site Survey Tool, from initial setup to deployment. Follow each section in order to replicate this setup on your own AWS account.

## Overview

This guide creates a secure, cost-effective AWS infrastructure using:
- **AWS Amplify** for frontend hosting (Next.js SSR)
- **AWS RDS PostgreSQL** for database storage
- **AWS S3** for secure image storage
- **IAM** for minimal security permissions
- **VPC** with simplified networking (no NAT gateways for cost savings)

**Estimated Monthly Cost:** ~$30/month

## Prerequisites

- AWS Account with administrative access
- OpenAI API key
- Domain name (optional, Amplify provides one)

---

## Part 1: Core Infrastructure Setup

### 1. Security Group Creation

**Navigate to Security Groups:**
- AWS Console → Services → EC2
- Left sidebar → Network & Security → Security Groups
- Click "Create security group"

**Create RDS Security Group:**
- **Security group name:** `basepower-survey-rds-sg`
- **Description:** `PostgreSQL access for Base Power Survey RDS instance`
- **VPC:** Select your default VPC

**Inbound rules:**
- Click "Add rule"
- Type: PostgreSQL
- Port range: 5432 (auto-filled)
- Source: Custom → `172.31.0.0/16` (default VPC CIDR)
- Description: `Allow PostgreSQL from within VPC`

**Tags:**
- Key: `Name`, Value: `basepower-survey-rds-sg`
- Key: `Project`, Value: `BasePowerSurvey`

Click "Create security group"

### 2. RDS PostgreSQL Database

**Navigate to RDS:**
- AWS Console → Services → RDS
- Click "Create database"

**Database Configuration:**

**Step 1 - Creation method:** Standard create  
**Step 2 - Engine:** PostgreSQL 15.4 (or latest 15.x)  
**Step 3 - Templates:** Free tier (if available)

**Step 4 - Settings:**
- DB instance identifier: `basepower-survey-db`
- Master username: `postgres`
- Credentials: Self managed
- Master password: Auto generate ✓ (**SAVE THIS PASSWORD!**)

**Step 5 - Instance:** db.t3.micro  
**Step 6 - Storage:** 20 GiB, autoscaling enabled (max 100 GiB)

**Step 7 - Connectivity:**
- Compute resource: Don't connect to EC2
- VPC: Default VPC
- Public access: No
- VPC security group: Choose existing → `basepower-survey-rds-sg`

**Step 8 - Authentication:** Password authentication

**Step 9 - Additional configuration:**
- Database name: `basepowersurvey`
- Backup retention: 7 days
- Enable encryption ✓
- Log exports: Select all

**Tags:**
- Key: `Name`, Value: `basepower-survey-db`
- Key: `Project`, Value: `BasePowerSurvey`

Click "Create database" (**Takes 5-10 minutes**)

### 3. S3 Bucket Setup

**Navigate to S3:**
- AWS Console → Services → S3
- Click "Create bucket"

**Bucket Configuration:**
- **Bucket name:** `basepower-survey-images` (must be globally unique)
- **Region:** US East (Ohio) us-east-2
- **Object Ownership:** ACLs disabled
- **Block Public Access:** Keep all 4 options checked ✓
- **Versioning:** Enable
- **Encryption:** SSE-S3
- **Object Lock:** Disable

**Tags:**
- Key: `Name`, Value: `basepower-survey-images`
- Key: `Project`, Value: `BasePowerSurvey`

Click "Create bucket"

**Configure CORS (after bucket creation):**
- Click bucket → Permissions → Cross-origin resource sharing (CORS)
- Add this JSON:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

**Create Lifecycle Rule:**
- Management tab → Create lifecycle rule
- Name: `basepower-survey-storage-transition`
- Scope: Apply to all objects
- Transitions:
  - Standard-IA: 30 days
  - Glacier Flexible Retrieval: 90 days

### 4. IAM User and Permissions

**Navigate to IAM:**
- AWS Console → Services → IAM → Users → Create user

**User Details:**
- User name: `basepower-survey-app`
- Console access: Disabled

**Create Custom Policy:**
- Click "Create policy" → JSON tab
- Replace with:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::basepower-survey-images/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::basepower-survey-images"
            ]
        }
    ]
}
```

- Policy name: `basepower-survey-s3-policy`
- Description: `S3 access for Base Power Survey application`
- Create policy

**Attach Policy to User:**
- Attach `basepower-survey-s3-policy`
- Add tags (same as above)
- Create user

**Create Access Keys:**
- Click username → Security credentials → Create access key
- Use case: "Application running outside AWS"
- Description: `Amplify app access`
- **🚨 SAVE BOTH VALUES:**
  - Access key ID
  - Secret access key

---

## Part 2: Database Setup

### 1. Get Database Connection Details

**From RDS Console:**
- Go to RDS → Databases → `basepower-survey-db`
- Copy the "Endpoint" from Connectivity section
- Note: Port is 5432

### 2. Create Database Schema

**Connect to database and run:**

```sql
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Survey Data Fields
    meter_photos JSONB,
    analysis_results JSONB,
    survey_responses JSONB,
    
    -- Metadata
    device_info JSONB,
    session_metadata JSONB
);

CREATE INDEX idx_surveys_user_id ON surveys(user_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_surveys_updated_at 
    BEFORE UPDATE ON surveys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Part 3: AWS Amplify Setup

### 1. Create Amplify App

**Navigate to Amplify:**
- AWS Console → Services → AWS Amplify
- Click "New app" → "Deploy without Git"

**App Configuration:**
- App name: `basepower-survey`
- Click "Next" → "Save and deploy"

### 2. Configure Environment Variables

**Critical Setup for SSR/API Routes:**
Go to Environment variables → Manage variables

**⚠️ REQUIRED VARIABLES** (Build will fail if missing):

1. **DATABASE_URL**
   ```
   postgresql://postgres:[YOUR_RDS_PASSWORD]@[YOUR_RDS_ENDPOINT]:5432/basepowersurvey
   ```

2. **APP_AWS_REGION**
   ```
   us-east-2
   ```
   *Note: Use `APP_` prefix - AWS reserves `AWS_` prefix*

3. **APP_AWS_ACCESS_KEY_ID**
   ```
   [Your IAM access key ID]
   ```

4. **APP_AWS_SECRET_ACCESS_KEY**
   ```
   [Your IAM secret access key]
   ```

5. **S3_BUCKET_NAME**
   ```
   basepower-survey-images
   ```

6. **OPENAI_API_KEY**
   ```
   [Your OpenAI API key]
   ```

**Optional Variables:**

7. **DATABASE_SSL** (defaults to false)
   ```
   true
   ```

8. **NEXT_PUBLIC_APP_URL** (update after first deploy)
   ```
   https://[branch-name].[app-id].amplifyapp.com
   ```

### 3. Critical Build Configuration

**⚠️ ESSENTIAL:** Ensure your project has `amplify.yml` in the root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        # Write environment variables to .env for SSR access
        - echo "DATABASE_URL=$DATABASE_URL" > .env
        - echo "APP_AWS_REGION=$APP_AWS_REGION" >> .env
        - echo "APP_AWS_ACCESS_KEY_ID=$APP_AWS_ACCESS_KEY_ID" >> .env
        - echo "APP_AWS_SECRET_ACCESS_KEY=$APP_AWS_SECRET_ACCESS_KEY" >> .env
        - echo "S3_BUCKET_NAME=$S3_BUCKET_NAME" >> .env
        - echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
        - echo "DATABASE_SSL=$DATABASE_SSL" >> .env
        - echo "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL" >> .env
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Why This Is Critical:**
- AWS Amplify environment variables are only available during BUILD time
- They are NOT available to server-side runtime by default
- The `amplify.yml` writes them to `.env` for API routes access
- **Without this file, deployed app will fail with "Missing environment variables"**

---

## Part 4: Application Architecture

### API Endpoints

The application provides these endpoints:

```typescript
// Survey Management
GET  /api/survey/[uuid]        // Get survey status and data
POST /api/survey/[uuid]        // Create or update survey
PUT  /api/survey/[uuid]/step   // Update current step
POST /api/survey/[uuid]/complete // Mark survey as completed

// File Upload Management
POST /api/upload/presigned     // Get pre-signed upload URL
POST /api/upload/confirm       // Confirm successful upload
GET  /api/images/[uuid]        // Get pre-signed download URLs

// System Health
GET  /api/health              // System health check
```

### Data Flow

1. **User Access:** Receives email with UUID link (`/survey/[uuid]`)
2. **Survey Check:** Amplify app checks survey status in RDS
3. **Data Persistence:** User progress saved to RDS
4. **Image Upload:** Photos uploaded to S3 via pre-signed URLs
5. **Review:** Images downloaded from S3 (time-limited URLs)

### Security Model

- **Database:** Private subnets, VPC-only access
- **S3:** Private bucket, IAM-based access only
- **Images:** Pre-signed URLs (15min upload, 60min download)
- **Network:** No public database access
- **Encryption:** At rest for RDS and S3, in transit via HTTPS

---

## Part 5: Final Configuration

### 1. Update S3 CORS with Amplify URL

After first deployment:
- Get Amplify URL: `https://[branch-name].[app-id].amplifyapp.com`
- Update S3 CORS:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://main.[YOUR-APP-ID].amplifyapp.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### 2. Update Environment Variables

- Update `NEXT_PUBLIC_APP_URL` in Amplify with your actual URL
- Redeploy to apply changes

---

## Part 6: Deployment and Testing

### 1. Deploy Application

**Manual Deployment:**
1. Build your Next.js app: `npm run build`
2. Zip the `.next` folder and `package.json`
3. Upload to Amplify via console

**Git-based Deployment (Optional):**
1. Connect your GitHub repository
2. Select branch
3. Amplify builds automatically on push

### 2. Verify Deployment

**Test Health Endpoint:**
Visit: `https://your-amplify-url.amplifyapp.com/api/health`

Expected response:
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

**Test Survey Flow:**
Visit: `https://your-amplify-url.amplifyapp.com/survey/test-uuid`

---

## Part 7: Local Development Setup

### 1. Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:[password]@[rds-endpoint]:5432/basepowersurvey"
DATABASE_SSL=true

# AWS Configuration
APP_AWS_REGION="us-east-2"
APP_AWS_ACCESS_KEY_ID="[your-access-key]"
APP_AWS_SECRET_ACCESS_KEY="[your-secret-key]"
S3_BUCKET_NAME="basepower-survey-images"

# Application
OPENAI_API_KEY="[your-openai-key]"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Local Testing

```bash
npm install
npm run dev
# Visit http://localhost:3000/api/health
```

---

## Part 8: Cost Optimization & Monitoring

### Monthly Cost Breakdown
- **RDS t3.micro:** ~$15/month
- **S3 Storage:** ~$5/month (varies with usage)
- **AWS Amplify:** ~$10/month
- **Total:** ~$30/month

### Cost Optimizations Applied
- **No NAT Gateways:** Saves ~$90/month
- **Default VPC:** No additional networking costs
- **S3 Lifecycle Rules:** Automatic cost reduction over time
- **t3.micro RDS:** Sufficient for most workloads

### Monitoring Setup
- **CloudWatch:** RDS metrics, S3 usage
- **Amplify Logs:** Build and runtime logs
- **Health Checks:** `/api/health` endpoint

---

## Part 9: Security Checklist

### Infrastructure Security
- [ ] RDS in private subnets only
- [ ] S3 bucket blocks all public access
- [ ] Security groups restrict PostgreSQL to VPC only
- [ ] IAM user has minimal required permissions
- [ ] All data encrypted at rest and in transit

### Application Security
- [ ] HTTPS enforced by Amplify
- [ ] Environment variables stored securely
- [ ] Pre-signed URLs time-limited
- [ ] UUID-based survey access
- [ ] No hardcoded credentials

### Operational Security
- [ ] Regular AWS key rotation
- [ ] CloudTrail enabled for audit logs
- [ ] Backup retention configured
- [ ] Monitoring alerts configured

---

## Part 10: Troubleshooting

### Common Issues

**Database Connection Fails:**
- Check security group allows port 5432 from VPC CIDR
- Verify DATABASE_URL format and credentials
- Confirm RDS is in "Available" status

**S3 Upload/Download Fails:**
- Check IAM permissions for S3 actions
- Verify CORS configuration includes your domain
- Confirm bucket name matches environment variable

**Build Failures in Amplify:**
- Check all required environment variables are set
- Verify `amplify.yml` exists and is properly formatted
- Review build logs in Amplify console

**API Routes Return 500 Errors:**
- Check environment variables are written to `.env` in build
- Verify database connectivity from Amplify
- Review application logs in CloudWatch

### Debug Commands

```bash
# Check RDS status
aws rds describe-db-instances --region us-east-2

# List S3 objects
aws s3 ls s3://basepower-survey-images/ --region us-east-2

# View Amplify apps
aws amplify list-apps --region us-east-2

# Test database connection
psql "postgresql://postgres:[password]@[endpoint]:5432/basepowersurvey" -c "SELECT 1;"
```

---

## Part 11: Scaling Considerations

### Current Capacity
- **RDS:** Handles thousands of concurrent surveys
- **S3:** Unlimited storage capacity
- **Amplify:** Auto-scales for traffic

### Scaling Path
1. **Database:** Upgrade RDS instance class if needed
2. **Global Distribution:** Add CloudFront for international users
3. **Caching:** Add ElastiCache for frequent queries
4. **Analytics:** Integrate QuickSight for reporting

### Performance Monitoring
- Monitor RDS CPU and storage utilization
- Track S3 request metrics and costs
- Watch Amplify build times and deployment success rates

---

## Summary

You now have a complete, production-ready AWS infrastructure for the Base Power Site Survey Tool with:

### Created Resources
| Resource | Name | Purpose |
|----------|------|---------|
| Security Group | `basepower-survey-rds-sg` | Database access control |
| RDS Instance | `basepower-survey-db` | PostgreSQL database |
| S3 Bucket | `basepower-survey-images` | Image storage |
| IAM User | `basepower-survey-app` | Application access |
| IAM Policy | `basepower-survey-s3-policy` | S3 permissions |
| Amplify App | `basepower-survey` | Frontend hosting |

### Key Benefits
- **Secure:** Private database, controlled S3 access
- **Cost-effective:** ~$30/month vs $120+ with NAT gateways
- **Scalable:** Auto-scaling components
- **Maintainable:** Simple architecture, comprehensive monitoring

All resources are tagged with `Project: BasePowerSurvey` for easy identification and cost tracking.

Your survey tool is now ready for production use with a robust, secure, and cost-effective AWS backend!
