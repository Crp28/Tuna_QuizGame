# Bulk Question Upload Feature

## Overview
The Bulk Question Upload feature allows administrators to add multiple questions to a question bank at once by either pasting JSON text or uploading a JSON file. This significantly speeds up the process of populating question banks.

## How to Use

### 1. Access the Admin Panel
- Log in with an admin account
- Click the "Admin Panel" button in the user panel

### 2. Navigate to Bulk Upload Tab
- Click on the "Bulk Upload" tab in the admin panel
- Select the target question bank from the dropdown

### 3. Prepare Your Questions

#### JSON Format
Questions must be in JSON array format with the following structure:

```json
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "B"
  },
  {
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "answer": "B"
  }
]
```

#### Required Fields
- `question` (string): The question text
- `options` (array): Exactly 4 answer options
- `answer` (string): Must be "A", "B", "C", or "D"

### 4. Upload Questions

#### Option 1: Paste JSON
1. Copy your JSON array
2. Paste it into the text area
3. Click "Upload Questions"

#### Option 2: Upload File
1. Click "Choose File"
2. Select your `.json` file
3. The content will automatically populate the text area
4. Click "Upload Questions"

## Validation

The system validates:
- JSON syntax is correct
- Input is an array of questions
- Each question has all required fields
- Each question has exactly 4 options
- Answer is one of A, B, C, or D

## Error Handling

If validation fails, you'll see specific error messages:
- "Invalid JSON format" - JSON syntax error
- "JSON must be an array of questions" - Wrong data structure
- "Question X: missing required fields" - Missing question, options, or answer
- "Question X: must have exactly 4 options" - Wrong number of options
- "Question X: answer must be A, B, C, or D" - Invalid answer choice

## Success Feedback

Upon successful upload, you'll see:
- Number of questions uploaded
- Total questions now in the bank

Example: "Successfully uploaded 5 question(s)! Total in bank: 23"

## Tips

1. **Start Small**: Test with 2-3 questions first to ensure format is correct
2. **Validate JSON**: Use a JSON validator (like jsonlint.com) to check syntax
3. **Backup**: Keep your JSON files for future reference
4. **Organize**: Create separate JSON files for different topics

## Troubleshooting

### File Won't Upload
- Ensure file has `.json` extension
- Check file isn't corrupted
- Try pasting content directly instead

### Parse Errors
- Check for missing commas or brackets
- Ensure quotes are properly closed
- Remove trailing commas in arrays/objects

### Validation Errors
- Verify all questions have exactly 4 options
- Ensure answer letters match available options
- Check for special characters in text

## Example Use Cases

### Quick Setup
Upload 20-30 questions at once when setting up a new course

### Bulk Import
Convert existing question banks from spreadsheets to JSON

### Collaboration
Share question files with other administrators for review before upload

## Security

- Only admin accounts can bulk upload
- All uploads are validated server-side
- Failed uploads don't partially modify the question bank
