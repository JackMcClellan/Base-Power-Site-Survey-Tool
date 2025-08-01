# Test Images for Base Power Site Survey Tool

This folder contains test images for validating the AI image analysis functionality across all survey steps.

## Folder Structure

Each camera step has its own folder with `valid` and `invalid` subfolders:

**Note**: Guide steps (like step 0.5) don't require images and are not included in testing.

### Step 1 - Electricity Meter Close-up (step_1_meter_closeup/)
- **Valid**: Clear, close-up photos of electricity meters with readable numbers
- **Invalid**: Blurry, partial, or non-meter images

### Step 2 - Electricity Meter Wide Shot (step_2_meter_wide/)
- **Valid**: Wide shots showing meter and surrounding area
- **Invalid**: Too close, obstructed, or unclear context

### Step 3 - Service Panel Exterior (step_3_service_panel/)
- **Valid**: Clear photos of electrical service panels
- **Invalid**: Wrong equipment, unclear, or obstructed panels

### Step 4 - Main Breaker (step_4_main_breaker/)
- **Valid**: Clear photos of main breaker switches
- **Invalid**: Unclear, wrong breaker type, or obstructed view

### Step 5 - Amperage Label (step_5_amperage_label/)
- **Valid**: Clear photos with readable amperage labels (e.g., "200A", "400A")
- **Invalid**: Unreadable, missing, or unclear amperage markings
- **Note**: This is a data extraction step - AI should extract amperage values

### Step 6 - Electrical Room/Area (step_6_electrical_room/)
- **Valid**: Clear photos of electrical equipment areas
- **Invalid**: Non-electrical areas, unclear, or inappropriate spaces

### Step 7 - Panel Space Assessment (step_7_panel_space/)
- **Valid**: Photos showing adequate space around electrical panels
- **Invalid**: Obstructed, insufficient space, or unclear views

### Step 8 - Outdoor Electrical Equipment (step_8_outdoor_equipment/)
- **Valid**: Clear photos of outdoor electrical equipment
- **Invalid**: Indoor equipment, unclear, or wrong equipment type

### Step 9 - Utility Connection Point (step_9_utility_connection/)
- **Valid**: Clear photos of utility connection points
- **Invalid**: Unclear connections, wrong equipment, or obstructed views

### Step 10 - Transformer (step_10_transformer/)
- **Valid**: Clear photos of electrical transformers
- **Invalid**: Wrong equipment, unclear, or non-transformer images

### Step 11 - Amperage Confirmation (step_11_amperage_confirmation/)
- **Valid**: Clear confirmation photos with readable amperage values
- **Invalid**: Unreadable, unclear, or missing amperage information
- **Note**: This is a data extraction step - AI should extract and confirm amperage

## Image Requirements

### Valid Images Should:
- Be well-lit and in focus
- Show the requested equipment clearly
- Have readable text/numbers where required
- Be properly oriented
- Fill an appropriate portion of the frame

### Invalid Images Should:
- Be blurry, poorly lit, or out of focus
- Show wrong subject matter
- Have obstructed or partial views
- Contain unreadable text when text is required
- Be incorrectly oriented or framed

## File Naming Convention

Use descriptive names for test images:
- `clear_meter_digital_200a.jpg` - Clear digital meter showing 200A
- `blurry_meter_unreadable.jpg` - Blurry meter with unreadable display
- `main_breaker_closed.jpg` - Main breaker in closed position
- `panel_insufficient_space.jpg` - Panel with insufficient clearance

## Testing Usage

These images are used for:
1. **Manual Testing**: Upload through the web interface to verify AI analysis
2. **Automated Testing**: Use with the test script in TEST_PLAN.md
3. **Regression Testing**: Ensure changes don't break existing functionality
4. **Performance Testing**: Monitor AI analysis times with different image types

## API Testing

Use with the validation endpoint:
```bash
curl -X POST \
  -F "image=@test_images/step_1_meter_closeup/valid/clear_meter_1.jpg" \
  -F "stepNumber=1" \
  -F "surveyId=550e8400-e29b-41d4-a716-446655440000" \
  http://localhost:3000/api/validate
```

## Adding New Images

When adding new test images:
1. Place in appropriate step folder
2. Choose `valid` or `invalid` subfolder based on expected AI response
3. Use descriptive filenames
4. Test with actual API to verify expected behavior
5. Update this README if new categories are added
