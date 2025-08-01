# Base Power Site Survey Tool - Test Plan

## Overview
This test plan covers endpoint validation, frontend functionality, and image processing to ensure the survey tool works correctly across all components.

## 1. API Endpoint Testing

### 1.1 Health Endpoint
**Endpoint:** `GET /api/health`
- ✅ Should return status "ok" and timestamp
- ✅ Should respond with 200 status code

**Test Commands:**
```bash
curl http://localhost:3000/api/health
```

### 1.2 Image Validation Endpoint
**Endpoint:** `POST /api/validate`

**Required Parameters:**
- `image` (File) - Image file to validate
- `stepNumber` (string) - Survey step number (supports decimals like 0.5, 1, 2, etc.)
- `surveyId` (string) - UUID for the survey

**Test Cases:**
1. **Valid Image Upload**
   - Upload valid meter image for step 1
   - Should return `isValid: true` with extracted data
   - Should upload to S3 successfully
   - Should update database with step data

2. **Invalid Image Upload**
   - Upload non-meter image for step 1
   - Should return `isValid: false` with explanation

3. **Missing Parameters**
   - Test without image: Should return 400 error
   - Test without stepNumber: Should return 400 error
   - Test without surveyId: Should return 400 error

4. **Invalid File Types**
   - Upload non-image file: Should return 400 error
   - Upload oversized image (>20MB): Should return 400 error

5. **Data Extraction Steps**
   - Test amperage reading steps with clear meter images
   - Should extract amperage values and return in `extractedValue`

**Test Commands:**
```bash
# Valid image test
curl -X POST \
  -F "image=@/path/to/test/meter-image.jpg" \
  -F "stepNumber=1" \
  -F "surveyId=550e8400-e29b-41d4-a716-446655440000" \
  http://localhost:3000/api/validate

# Invalid file type test
curl -X POST \
  -F "image=@/path/to/test/document.pdf" \
  -F "stepNumber=1" \
  -F "surveyId=550e8400-e29b-41d4-a716-446655440000" \
  http://localhost:3000/api/validate
```

### 1.3 Survey Management Endpoints
**Base Endpoint:** `/api/survey/[uuid]`

**1.3.1 GET - Fetch Survey**
- Should return survey data for valid UUID
- Should return 400 for invalid UUID format
- Should create new survey if none exists

**1.3.2 POST - Create/Update Survey**
- Should create new survey with valid data
- Should update existing survey
- Should validate schema with Zod

**1.3.3 PUT - Update Current Step**
- Should update only the current step
- Should return 404 for non-existent survey

**1.3.4 PATCH - Complete Survey**
- Should mark survey as COMPLETED
- Should handle already completed surveys gracefully

**Test Commands:**
```bash
# Test UUID: 550e8400-e29b-41d4-a716-446655440000

# Fetch survey
curl http://localhost:3000/api/survey/550e8400-e29b-41d4-a716-446655440000

# Update step
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"step": 2}' \
  http://localhost:3000/api/survey/550e8400-e29b-41d4-a716-446655440000

# Complete survey
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/api/survey/550e8400-e29b-41d4-a716-446655440000
```

## 2. Frontend Testing

### 2.1 Survey Step Components

**2.1.1 Camera Step Component (`components/steps/camera-step.tsx`)**

**Button States to Test:**
- "Take Picture" button - should trigger camera capture
- "Retake Photo" button - should clear current photo and allow retake
- "Continue" button - should proceed to next step when image is valid
- "Use Anyway" button - should proceed even with invalid image
- "Confirm & Continue" button - should confirm and proceed
- "Skip" button - should skip current step (if skippable)

**Loading States to Test:**
- `isLoadingRelatedImage` - should show spinner while loading related images
- `isAnalyzingCapture` - should show analysis spinner during AI processing
- Button disabled states during loading

**Test Cases:**
1. Take photo → verify loading state → check AI analysis result
2. Retake functionality → verify photo is cleared and camera reactivated
3. Skip functionality on skippable steps
4. Error handling for camera access denied
5. Image upload progress and S3 upload completion

**2.1.2 Review Step Component (`components/steps/review-step.tsx`)**

**Button States to Test:**
- "Edit Value" button - should allow editing extracted values
- "Complete This Step" button - should finalize step data
- "Finish Survey" button - should complete entire survey

**Loading States to Test:**
- `isLoadingSurvey` - should show loading while fetching survey data
- Survey completion loading state

**2.1.3 Welcome Step Component (`components/steps/welcome-step.tsx`)**

**Button States to Test:**
- "Start Survey" button - should begin survey process

**Loading States to Test:**
- `surveyData.currentlySyncing` - should disable start button during sync

**2.1.4 Guide Step Component (`components/steps/guide-step.tsx`)**

**Button States to Test:**
- Dynamic continue button text should match step configuration
- Button should advance to next step

### 2.2 Shared Components

**2.2.1 Survey Actions (`components/shared/survey-actions.tsx`)**
- "Capture & Continue" button functionality
- "Skip" button functionality  
- `isLoading` prop should disable buttons appropriately

**2.2.2 Button Component (`components/ui/button.tsx`)**
- Test all variants: default, destructive, outline, secondary, ghost, link
- Test all sizes: default, sm, lg, icon
- Test disabled and loading states

### 2.3 Frontend Test Scenarios

**Manual Testing Checklist:**
1. **Survey Flow**
   - [ ] Complete full survey from start to finish
   - [ ] Test step navigation (forward/backward)
   - [ ] Test survey data persistence
   - [ ] Test survey completion

2. **Camera Functionality**
   - [ ] Camera permission request
   - [ ] Photo capture on different devices
   - [ ] Photo retake functionality
   - [ ] HTTPS warning display (if on HTTP)

3. **Loading States**
   - [ ] All buttons show appropriate loading spinners
   - [ ] Buttons are disabled during loading
   - [ ] Loading states clear appropriately

4. **Error Handling**
   - [ ] Network errors display correctly
   - [ ] Invalid images show appropriate messages
   - [ ] Camera access denied handled gracefully

## 3. Image Validation Testing

### 3.1 Test Image Organization

**Current Status:** The `test_images` folder is empty. We need to create test images for each survey step.

**Recommended Test Image Structure:**
```
test_images/
├── step_0.5_guide/
├── step_1_meter_closeup/
│   ├── valid/
│   │   ├── clear_meter_1.jpg
│   │   ├── clear_meter_2.jpg
│   │   └── readable_numbers.jpg
│   └── invalid/
│       ├── blurry_meter.jpg
│       ├── partial_meter.jpg
│       └── wrong_object.jpg
├── step_2_meter_wide/
│   ├── valid/
│   └── invalid/
├── step_3_service_panel/
│   ├── valid/
│   └── invalid/
├── step_4_main_breaker/
│   ├── valid/
│   └── invalid/
├── step_5_amperage_label/
│   ├── valid/
│   └── invalid/
├── step_6_electrical_room/
│   ├── valid/
│   └── invalid/
├── step_7_panel_space/
│   ├── valid/
│   └── invalid/
├── step_8_outdoor_equipment/
│   ├── valid/
│   └── invalid/
├── step_9_utility_connection/
│   ├── valid/
│   └── invalid/
├── step_10_transformer/
│   ├── valid/
│   └── invalid/
└── step_11_amperage_confirmation/
    ├── valid/
    └── invalid/
```

### 3.2 Image Testing Protocol

**For Each Step:**
1. **Valid Images** - Should pass AI validation
   - Clear, well-lit photos of the requested subject
   - Correct orientation and framing
   - Readable text/numbers where required
   - Appropriate equipment type

2. **Invalid Images** - Should fail AI validation
   - Blurry or poorly lit photos
   - Wrong subject matter
   - Partial or obstructed views
   - Incorrect equipment types

### 3.3 Data Extraction Testing

**Steps with Data Extraction (amperage reading):**
- Step 5: Amperage label reading
- Step 11: Amperage confirmation

**Test Cases:**
1. **Clear amperage labels** - should extract correct values (e.g., "200A", "400A")
2. **Unclear labels** - should indicate extraction failure
3. **Multiple amperage values** - should extract the primary value
4. **Non-standard formats** - should handle variations in labeling

### 3.4 Automated Testing Script

**Create test automation script:**
```bash
#!/bin/bash
# test-image-validation.sh

SURVEY_ID="550e8400-e29b-41d4-a716-446655440000"
BASE_URL="http://localhost:3000"

for step in {1..11}; do
  echo "Testing Step $step..."
  
  # Test valid images
  for img in test_images/step_${step}_*/valid/*.jpg; do
    if [ -f "$img" ]; then
      echo "Testing valid image: $img"
      curl -X POST \
        -F "image=@$img" \
        -F "stepNumber=$step" \
        -F "surveyId=$SURVEY_ID" \
        "$BASE_URL/api/validate"
    fi
  done
  
  # Test invalid images
  for img in test_images/step_${step}_*/invalid/*.jpg; do
    if [ -f "$img" ]; then
      echo "Testing invalid image: $img"
      curl -X POST \
        -F "image=@$img" \
        -F "stepNumber=$step" \
        -F "surveyId=$SURVEY_ID" \
        "$BASE_URL/api/validate"
    fi
  done
done
```

## 4. Development Testing Commands

### 4.1 Build and Type Check
```bash
# Install dependencies
npm install

# Type check
npm run build

# Run development server
npm run dev

# Run any existing tests
npm test
```

### 4.2 Environment Setup
```bash
# Ensure environment variables are set
echo $OPENAI_API_KEY
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $DATABASE_URL
```

## 5. Performance Testing

### 5.1 Image Upload Performance
- Test large image uploads (up to 20MB)
- Monitor S3 upload times
- Test concurrent image uploads

### 5.2 AI Analysis Performance
- Monitor OpenAI API response times
- Test with various image qualities
- Monitor API usage and costs

### 5.3 Database Performance
- Test survey creation/updates
- Monitor step data storage
- Test concurrent survey operations

## 6. Regression Testing

### 6.1 Change Tracking
**When making changes, always test:**
1. Full survey completion flow
2. All button interactions and loading states
3. Image validation with known test images
4. API endpoints with curl commands
5. Error handling scenarios

### 6.2 Test Image Maintenance
**Keep test images updated:**
- Add new test cases for edge cases discovered
- Update images if validation logic changes
- Maintain clear organization by step and validity

## 7. Deployment Testing

### 7.1 Pre-deployment Checklist
- [ ] All tests pass locally
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] S3 bucket accessible
- [ ] OpenAI API key valid

### 7.2 Post-deployment Verification
- [ ] Health endpoint responds
- [ ] Image upload and validation works
- [ ] Survey creation and completion works
- [ ] Frontend loads and functions correctly

---

## Next Steps

1. **Create Test Images**: Populate the `test_images` folder with valid and invalid images for each survey step
2. **Implement Automated Tests**: Create test scripts for API endpoints and image validation
3. **Document Test Results**: Track which images pass/fail for each step
4. **Create CI/CD Integration**: Automate testing in deployment pipeline
