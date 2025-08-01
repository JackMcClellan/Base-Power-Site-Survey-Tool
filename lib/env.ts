/**
 * Environment variable validation
 * This file ensures all required environment variables are present at build time
 */

// Define required environment variables
const requiredEnvVars = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // API Key
  X_API_KEY: process.env.X_API_KEY,
  
  // AWS Configuration (renamed to avoid AWS_ prefix restriction in Amplify)
  APP_AWS_REGION: process.env.APP_AWS_REGION,
  APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID,
  APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
} as const

// Optional environment variables
const optionalEnvVars = {
  // Application
  DATABASE_SSL: process.env.DATABASE_SSL,
} as const

// Validate environment variables
function validateEnv() {
  const missingVars: string[] = []
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === '') {
      missingVars.push(key)
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars
        .map(v => `  - ${v}`)
        .join('\n')}\n\nPlease set these in your .env.local file or deployment environment.`
    )
  }
}

// Run validation
validateEnv()

// Export typed environment variables
export const env = {
  DATABASE_URL: requiredEnvVars.DATABASE_URL!,
  DATABASE_SSL: optionalEnvVars.DATABASE_SSL === 'true',
  AWS_REGION: requiredEnvVars.APP_AWS_REGION!,
  AWS_ACCESS_KEY_ID: requiredEnvVars.APP_AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: requiredEnvVars.APP_AWS_SECRET_ACCESS_KEY!,
  S3_BUCKET_NAME: requiredEnvVars.S3_BUCKET_NAME!,
  OPENAI_API_KEY: requiredEnvVars.OPENAI_API_KEY!,
  X_API_KEY: requiredEnvVars.X_API_KEY!,
} as const

// Type for environment variables
export type Env = typeof env 