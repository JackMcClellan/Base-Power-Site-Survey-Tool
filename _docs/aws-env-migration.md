# AWS Environment Variable Migration Guide

## Why the Change?

AWS Amplify reserves environment variables that start with `AWS_` for internal AWS services. Custom application variables cannot use this prefix.

## Migration Steps

If you've already configured your AWS Amplify environment variables with the old names, follow these steps:

### 1. Update Environment Variables in AWS Amplify

Navigate to your Amplify app → Environment variables, and rename:

| Old Variable Name | New Variable Name |
|-------------------|-------------------|
| `AWS_REGION` | `APP_AWS_REGION` |
| `AWS_ACCESS_KEY_ID` | `APP_AWS_ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY` | `APP_AWS_SECRET_ACCESS_KEY` |

**Note:** Keep the same values, just change the variable names.

### 2. Update Local Development Environment

Update your `.env.local` file:

```env
# Old (remove these)
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"

# New (add these)
APP_AWS_REGION="us-east-2"
APP_AWS_ACCESS_KEY_ID="your_key"
APP_AWS_SECRET_ACCESS_KEY="your_secret"
```

### 3. Redeploy

After updating the environment variables:
1. Save the changes in Amplify
2. Trigger a new deployment by pushing code or manually redeploying

## Complete List of Required Variables

After migration, your environment should have:

- `DATABASE_URL`
- `APP_AWS_REGION` (previously AWS_REGION)
- `APP_AWS_ACCESS_KEY_ID` (previously AWS_ACCESS_KEY_ID)
- `APP_AWS_SECRET_ACCESS_KEY` (previously AWS_SECRET_ACCESS_KEY)
- `S3_BUCKET_NAME`
- `OPENAI_API_KEY`

## Troubleshooting

If you see an error about missing environment variables after deployment, double-check that:
1. All variables are renamed correctly in Amplify
2. The deployment has been triggered after the changes
3. There are no typos in the variable names 