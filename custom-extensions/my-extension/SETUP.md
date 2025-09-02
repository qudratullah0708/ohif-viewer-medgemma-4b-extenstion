# 🤖 Enhanced AI Extension Setup Guide

This extension now includes database integration to persist AI comments and user messages associated with specific images.

## 🚀 Quick Setup

### 1. Backend Requirements
- Python FastAPI backend running on `http://localhost:8000`
- Database with `images` and `comments` tables
- Authentication system (optional for development)

### 2. Environment Configuration
Create a `.env` file in the extension root with:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Backend API Endpoints Used
- `POST /images/` - Register new image
- `GET /images/by-ohif-id/{image_id}` - Get image by OHIF ID
- `POST /comments/` - Create new comment
- `GET /comments/image/{image_id}` - Get comments for image

## 🔧 Features

### ✅ Implemented
- **Image Registration**: Automatically registers viewport images in database
- **Comment Persistence**: Saves both user messages and AI responses
- **Comment Retrieval**: Loads existing comments when viewing the same image
- **Visual Indicators**: Shows saved status with 💾 icon
- **Metadata Extraction**: Captures DICOM metadata when available

### 🎯 How It Works

1. **Image Identification**: Creates unique hash from canvas data
2. **Database Registration**: Stores image reference with metadata
3. **Comment Storage**: Saves messages with `is_ai_generated` flag
4. **Comment Loading**: Retrieves previous comments when viewing same image

### 📊 Database Schema

**Images Table:**
- `id` (Primary Key)
- `image_id` (Unique OHIF identifier)
- `study_instance_uid`, `series_instance_uid`, `sop_instance_uid`
- `patient_id`, `study_date`, `modality`

**Comments Table:**
- `id` (Primary Key)
- `content` (Message text)
- `image_id` (Foreign Key)
- `doctor_id` (NULL for AI comments)
- `is_ai_generated` (Boolean flag)
- `ai_model` (e.g., "gemini-2.0-flash")

## 🧪 Testing

1. Start your backend server
2. Load OHIF viewer with DICOM images
3. Open the AI extension panel
4. Send a message - it should be saved to database
5. Navigate to a different image and back - previous comments should load

## 🔍 Troubleshooting

### Common Issues
- **CORS Errors**: Ensure backend allows requests from OHIF domain
- **Authentication**: Backend may require authentication tokens
- **Image Registration**: Check browser console for registration errors

### Debug Mode
Enable debug logging by checking browser console for:
- Image registration messages
- Comment save/load operations
- API error details
