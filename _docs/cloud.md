# Cloud Architecture - AWS Backend Integration

## Overview
This document outlines the simplified architecture for the Base Power Site Survey Tool using AWS services. The system uses Next.js with AWS Amplify for hosting, RDS PostgreSQL for data persistence, and S3 for secure image storage.

## Architecture Components

### Core Services
- **Frontend & Hosting**: AWS Amplify (Next.js SSR)
- **Database**: AWS RDS PostgreSQL (t3.micro)
- **File Storage**: AWS S3 with pre-signed URLs
- **VPC**: Simple networking without NAT gateways
- **Region**: us-east-2 (Ohio)

### Data Flow
1. User receives email with UUID link (`/survey/[uuid]`)
2. Amplify-hosted app checks survey status in RDS
3. User progresses through steps, data saved to RDS
4. Photos uploaded to S3 via pre-signed URLs
5. Review step downloads images from S3 (60min signed URLs)

## Infrastructure Overview

### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **Public Subnets**: For Amplify and Internet Gateway
- **Private Subnets**: For RDS (no internet access)
- **No NAT Gateways**: Significant cost savings (~$90/month)
- **S3 VPC Endpoint**: For optimized S3 access

### Database Configuration
- **Engine**: PostgreSQL 15.4
- **Instance**: db.t3.micro (20GB storage)
- **Location**: Private subnets
- **Backups**: 7-day retention
- **Encryption**: At rest and in transit
- **Access**: Only from within VPC

### S3 Bucket Configuration
- **Purpose**: Survey image storage
- **Access**: Private only (no public URLs)
- **CORS**: Configured for Amplify and localhost
- **Lifecycle**: Transitions to cheaper storage tiers
- **Encryption**: AES-256

### AWS Amplify Configuration
- **Platform**: Next.js SSR support
- **SSL**: Automatic HTTPS certificates
- **CDN**: Global content delivery
- **Environment Variables**: Automatically configured
- **Deployment**: Manual or Git-based options

## Database Schema

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
```

## API Endpoints

### Survey Management
```typescript
// GET /api/survey/[uuid] - Get survey status and data
// POST /api/survey/[uuid] - Create or update survey
// PUT /api/survey/[uuid]/step - Update current step
// POST /api/survey/[uuid]/complete - Mark survey as completed
```

### File Upload Management
```typescript
// POST /api/upload/presigned - Get pre-signed upload URL
// POST /api/upload/confirm - Confirm successful upload
// GET /api/images/[uuid] - Get pre-signed download URLs for review
```

### Analysis Integration
```typescript
// POST /api/analyze-meter - Existing endpoint (enhance for S3 integration)
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@rds-endpoint:5432/surveys"
DATABASE_SSL=true

# AWS Configuration
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="base-power-survey-preview-survey-images"

# Application
NEXT_PUBLIC_APP_URL="https://[amplify-id].amplifyapp.com"
```

## Deployment Process

### 1. Infrastructure Setup
The infrastructure can be deployed using Terraform/OpenTofu, which creates:
- VPC with public/private subnets
- RDS PostgreSQL instance
- S3 bucket with proper security
- AWS Amplify app
- IAM roles and policies

### 2. Database Initialization
Run the database setup script to create tables and indexes:
```bash
psql $DATABASE_URL -f database-setup.sql
```

### 3. Application Deployment
Deploy the Next.js application to AWS Amplify:
1. Build the application: `npm run build`
2. Upload to Amplify via console or CLI
3. Amplify handles SSL, CDN, and scaling

## Security Considerations

### Network Security
- **RDS**: Private subnet, no internet access
- **Security Groups**: Restrict access to PostgreSQL port
- **VPC**: Isolated network environment
- **No NAT**: Eliminates unnecessary internet egress

### Data Protection
- **S3**: Private bucket, IAM-based access
- **Pre-signed URLs**: Time-limited (15min upload, 60min download)
- **Database**: SSL connections required
- **Encryption**: At rest for RDS and S3

### Application Security
- **HTTPS**: Enforced by Amplify
- **Environment Variables**: Stored securely in Amplify
- **IAM**: Minimal required permissions
- **UUID Validation**: Application-level checks

## Cost Breakdown

### Monthly Costs (Approximate)
- **RDS t3.micro**: $15/month
- **S3 Storage**: $5/month (varies with usage)
- **AWS Amplify**: $10/month
- **VPC**: $0 (no NAT gateways)
- **Total**: ~$30/month

### Cost Optimizations
- No NAT gateways saves $90/month
- S3 lifecycle policies for older data
- RDS t3.micro is sufficient for most workloads
- Amplify includes CDN and SSL at no extra cost

## Monitoring and Maintenance

### CloudWatch Metrics
- RDS CPU and storage utilization
- S3 bucket size and request metrics
- Amplify build and request logs
- Application error tracking

### Backup Strategy
- RDS automated backups (7 days)
- S3 versioning enabled
- Database snapshots before major changes

### Scaling Considerations
- RDS can scale storage automatically
- Amplify scales automatically
- Consider RDS read replicas if needed
- S3 scales infinitely

## Development Workflow

### Local Development
1. Use `.env.local` with production-like settings
2. Connect to RDS from local environment
3. Use same S3 bucket with different prefixes

### Testing
1. Create separate environment (staging)
2. Use same infrastructure pattern
3. Test with production-like data volumes

### CI/CD
1. Optional Git integration with Amplify
2. Automatic deployments on push
3. Environment-specific branches

## Troubleshooting

### Common Issues
1. **Database Connection**: Check security groups and VPC settings
2. **S3 CORS**: Verify Amplify URL in CORS configuration
3. **Build Failures**: Check Amplify build logs
4. **Performance**: Monitor RDS metrics

### Debug Commands
```bash
# Check RDS status
aws rds describe-db-instances --region us-east-2

# List S3 objects
aws s3 ls s3://bucket-name/ --region us-east-2

# View Amplify app
aws amplify list-apps --region us-east-2
```

## Future Considerations

### Potential Enhancements
1. **Caching**: Add ElastiCache if needed
2. **Search**: Consider OpenSearch for complex queries
3. **Analytics**: Add QuickSight for reporting
4. **Backups**: Implement cross-region backups

### Scaling Path
1. **Database**: Upgrade RDS instance class
2. **Storage**: S3 already scales infinitely
3. **Compute**: Amplify handles scaling
4. **Global**: Use CloudFront for global distribution

---

This simplified architecture provides a secure, scalable, and cost-effective foundation for the survey tool while maintaining operational simplicity. The absence of NAT gateways significantly reduces costs without compromising functionality. 