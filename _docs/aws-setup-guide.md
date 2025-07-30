# AWS Setup Guide - Base Power Survey Tool

## Overview
This guide walks through setting up the AWS infrastructure for the Base Power Survey Tool using the default VPC for simplicity. All resources use the naming convention: `mcclellan-basepower-survey-*`.

## Resource Summary
By the end of this guide, you'll have created:
- **Security Group**: `mcclellan-basepower-survey-rds-sg`
- **RDS Instance**: `mcclellan-basepower-survey-db`
- **Database Name**: `basepowersurvey`
- **S3 Bucket**: `mcclellan-basepower-survey-images`
- **IAM User**: `mcclellan-basepower-survey-app`
- **IAM Policy**: `mcclellan-basepower-survey-s3-policy`
- **Amplify App**: `mcclellan-basepower-survey`

---

## 1. Security Group Creation

**Navigate to Security Groups:**
- AWS Console → Services → EC2
- Left sidebar → Network & Security → Security Groups
- Click "Create security group" (orange button)

**Create RDS Security Group:**
- **Basic details:**
  - Security group name: `mcclellan-basepower-survey-rds-sg`
  - Description: `PostgreSQL access for Base Power Survey RDS instance`
  - VPC: Select your default VPC (should be pre-selected)

- **Inbound rules:**
  - Click "Add rule"
  - Type: PostgreSQL
  - Protocol: TCP (auto-filled)
  - Port range: 5432 (auto-filled)
  - Source: Custom → `172.31.0.0/16` (default VPC CIDR)
  - Description: `Allow PostgreSQL from within VPC`

- **Outbound rules:**
  - Leave default (all traffic allowed out)

- **Tags:**
  - Key: `Name`, Value: `mcclellan-basepower-survey-rds-sg`
  - Key: `Project`, Value: `BasePowerSurvey`

- Click "Create security group"

---

## 2. RDS PostgreSQL Database

**Navigate to RDS:**
- AWS Console → Services → RDS
- Click "Create database" (orange button)

**Database Creation Settings:**

### Step 1 - Choose database creation method:
- Select "Standard create"

### Step 2 - Engine options:
- Engine type: PostgreSQL
- Engine Version: PostgreSQL 15.4-R3 (or latest 15.x)

### Step 3 - Templates:
- Choose "Free tier" if available, otherwise "Production"

### Step 4 - Settings:
- DB instance identifier: `mcclellan-basepower-survey-db`
- Master username: `postgres`
- Credentials management: Self managed
- Master password: Auto generate password ✓
- Click "View password" after generation and **SAVE IT!**

### Step 5 - Instance configuration:
- DB instance class: Burstable classes → `db.t3.micro`

### Step 6 - Storage:
- Storage type: General Purpose SSD (gp3)
- Allocated storage: 20 GiB
- Storage autoscaling: Enable ✓
- Maximum storage threshold: 100 GiB

### Step 7 - Connectivity:
- Compute resource: Don't connect to EC2
- Network type: IPv4
- Virtual private cloud: Default VPC
- DB subnet group: default
- Public access: No
- VPC security group: Choose existing
  - Remove default security group
  - Add `mcclellan-basepower-survey-rds-sg`
- Availability Zone: No preference
- Certificate authority: Default

### Step 8 - Database authentication:
- Database authentication: Password authentication

### Step 9 - Additional configuration:
- Database name: `basepowersurvey` (no hyphens allowed)
- DB parameter group: default.postgres15
- Option group: default:postgres-15
- **Backup:**
  - Enable automated backups ✓
  - Backup retention period: 7 days
  - Backup window: No preference
  - Copy tags to snapshots ✓
- **Encryption:**
  - Enable encryption ✓
  - AWS KMS key: (default) aws/rds
- **Log exports:** Select all (error, general, slow query)
- **Maintenance:**
  - Enable auto minor version upgrade ✓
  - Maintenance window: No preference
- **Deletion protection:** Disable (for now)

### Tags:
- Key: `Name`, Value: `mcclellan-basepower-survey-db`
- Key: `Project`, Value: `BasePowerSurvey`

Click "Create database" - **This will take 5-10 minutes**

---

## 3. S3 Bucket

**Navigate to S3:**
- AWS Console → Services → S3
- Click "Create bucket"

**Bucket Configuration:**

### General configuration:
- Bucket name: `mcclellan-basepower-survey-images`
  - **Note:** Must be globally unique. If taken, add your initials or date
- AWS Region: US East (Ohio) us-east-2

### Object Ownership:
- ACLs disabled (recommended)

### Block Public Access settings:
- Block all public access: ✓ (keep all 4 options checked)

### Bucket Versioning:
- Bucket Versioning: Enable

### Tags:
- Key: `Name`, Value: `mcclellan-basepower-survey-images`
- Key: `Project`, Value: `BasePowerSurvey`

### Default encryption:
- Encryption type: Server-side encryption with Amazon S3 managed keys (SSE-S3)
- Bucket Key: Enable

### Advanced settings:
- Object Lock: Disable

Click "Create bucket"

### Configure CORS (after bucket creation):
- Click on your new bucket
- Go to "Permissions" tab
- Scroll to "Cross-origin resource sharing (CORS)"
- Click "Edit"
- Add this JSON (update after you get Amplify URL):

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

### Create Lifecycle Rule:
- Go to "Management" tab
- Click "Create lifecycle rule"
- Lifecycle rule name: `mcclellan-basepower-survey-storage-transition`
- Rule scope: Apply to all objects
- Lifecycle rule actions:
  - ✓ Transition current versions of objects between storage classes
  - Transitions:
    - Standard-IA: 30 days
    - Glacier Flexible Retrieval: 90 days
- Click "Create rule"

---

## 4. IAM User and Policy

**Navigate to IAM:**
- AWS Console → Services → IAM
- Left sidebar → Users → Create user

### User Details:
- User name: `mcclellan-basepower-survey-app`
- Access type: Do not provide console access

### Set permissions:
- Select "Attach policies directly"
- Click "Create policy" (opens new tab)

### Create Custom Policy (in new tab):
- Click "JSON" tab
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
                "arn:aws:s3:::mcclellan-basepower-survey-images/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::mcclellan-basepower-survey-images"
            ]
        }
    ]
}
```

- Click "Next"
- Policy name: `mcclellan-basepower-survey-s3-policy`
- Description: `S3 access for Base Power Survey application`
- Click "Create policy"

### Back to User Creation Tab:
- Refresh policy list
- Search for `mcclellan-basepower-survey-s3-policy`
- Check the box to select it
- Click "Next"

### Tags:
- Key: `Name`, Value: `mcclellan-basepower-survey-app`
- Key: `Project`, Value: `BasePowerSurvey`

### Review and create:
- Click "Create user"

### Create Access Keys:
- Click on the username you just created
- Go to "Security credentials" tab
- Scroll to "Access keys"
- Click "Create access key"
- Use case: "Application running outside AWS"
- Check "I understand..." box
- Click "Next"
- Description: `Amplify app access`
- Click "Create access key"
- **🚨 IMPORTANT**: Save both values:
  - Access key ID
  - Secret access key (you won't see this again!)
- Click "Done"

---

## 5. AWS Amplify

**Navigate to Amplify:**
- AWS Console → Services → AWS Amplify
- Click "New app" → "Deploy without Git"

### App Configuration:

#### Step 1 - Deploy without Git:
- App name: `mcclellan-basepower-survey`
- Click "Next"

#### Step 2 - Manual deploy:
- You'll deploy your code later
- For now, click "Save and deploy" to create the app

### Configure Environment Variables:
- Click on your app name
- Go to "Environment variables" in left sidebar
- Click "Manage variables"

#### Add these environment variables:
**⚠️ IMPORTANT: Variables marked with (Required) MUST be set. The build will fail if any required variables are missing.**

Click "Add variable" for each:

**Required Variables:**

1. **DATABASE_URL** (Required)
   - Value: `postgresql://postgres:[YOUR_RDS_PASSWORD]@[YOUR_RDS_ENDPOINT]:5432/basepowersurvey`
   - (You'll update this after RDS is ready)

2. **APP_AWS_REGION** (Required)
   - Value: `us-east-2`
   - Note: We use `APP_` prefix because AWS reserves the `AWS_` prefix

3. **APP_AWS_ACCESS_KEY_ID** (Required)
   - Value: [Your IAM access key ID]

4. **APP_AWS_SECRET_ACCESS_KEY** (Required)
   - Value: [Your IAM secret access key]

5. **S3_BUCKET_NAME** (Required)
   - Value: `mcclellan-basepower-survey-images`

6. **OPENAI_API_KEY** (Required)
   - Value: [Your OpenAI API key from OpenAI dashboard]

**Optional Variables:**

7. **DATABASE_SSL** (Optional, defaults to false)
   - Value: `true` (recommended for AWS RDS)

8. **NEXT_PUBLIC_APP_URL** (Optional)
   - Value: (Leave empty for now, will update after first deploy)
   - This will be: `https://[branch-name].[app-id].amplifyapp.com`

Click "Save" after adding all variables

**Note:** The application uses strict environment variable validation. If any required variables are missing, the build will fail with a clear error message listing the missing variables.

---

## 6. Getting Connection Details

### Get RDS Endpoint:
- Go to RDS Console
- Click "Databases" in left sidebar
- Click on `mcclellan-basepower-survey-db`
- In "Connectivity & security" section:
  - Copy the "Endpoint" (looks like: mcclellan-basepower-survey-db.xxxxx.us-east-2.rds.amazonaws.com)
  - Note the port: 5432

### Update DATABASE_URL in Amplify:
- Go back to Amplify → Environment variables
- Update DATABASE_URL with actual endpoint and password:
  ```
  postgresql://postgres:[SAVED_PASSWORD]@[COPIED_ENDPOINT]:5432/basepowersurvey
  ```

### Get Amplify URL (after first deployment):
- Your app URL will be: `https://[branch-name].[app-id].amplifyapp.com`
- Update NEXT_PUBLIC_APP_URL environment variable
- Update S3 CORS to include this URL

---

## 7. Final S3 CORS Update

### Update CORS with Amplify URL:
- S3 Console → Your bucket → Permissions → CORS
- Update to include your Amplify URL:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://main.YOUR-APP-ID.amplifyapp.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

---

## 8. Database Setup

### Connect to Database:
You'll need to run your database setup script. Since RDS is in a private subnet, you can:

1. **Connect from local machine** (temporarily allow your IP in security group)
2. **Connect from EC2 instance** in the same VPC
3. **Use RDS Query Editor** in AWS Console

### Run Database Script:
Execute your `database-setup.sql` script to create tables and indexes.

---

## 9. Verification Checklist

After completing all steps, verify:

- [ ] RDS instance is running and accessible
- [ ] S3 bucket created with proper CORS and lifecycle rules
- [ ] IAM user has access keys saved securely
- [ ] Amplify app is created with all environment variables
- [ ] Security group allows PostgreSQL access from VPC
- [ ] Database tables are created successfully

---

## Important Notes

### Security:
- RDS is in private subnets (no internet access)
- S3 bucket blocks all public access
- IAM user has minimal required permissions
- All communications encrypted in transit

### Cost Optimization:
- Using default VPC saves ~$90/month (no NAT gateways)
- RDS t3.micro is cost-effective for small workloads
- S3 lifecycle rules reduce storage costs over time

### Troubleshooting:
- If RDS connection fails, check security group rules
- If S3 CORS issues, verify Amplify URL in allowed origins
- Save all passwords and access keys securely

---

## Next Steps

1. Deploy your Next.js application to Amplify
2. Test database connectivity
3. Test S3 image upload/download functionality
4. Monitor CloudWatch for any issues

## Resources Created Summary

| Resource Type | Name | Purpose |
|---------------|------|---------|
| Security Group | `mcclellan-basepower-survey-rds-sg` | PostgreSQL access control |
| RDS Instance | `mcclellan-basepower-survey-db` | PostgreSQL database |
| S3 Bucket | `mcclellan-basepower-survey-images` | Image storage |
| IAM User | `mcclellan-basepower-survey-app` | Application access |
| IAM Policy | `mcclellan-basepower-survey-s3-policy` | S3 permissions |
| Amplify App | `mcclellan-basepower-survey` | Frontend hosting |

All resources tagged with `Project: BasePowerSurvey` for easy identification and cost tracking. 