# 🤖 Enhanced AI Extension Setup Guide

This extension now includes:
- Stable image tracking (prefers DICOM SOPInstanceUID) and per-image threads
- JWT-based doctor authentication (Register, Sign in, Logout)
- Separate tabs for AI chat vs Doctor comments vs View Comments

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

Secured (requires JWT):
- `POST /api/v1/images/` - Register new image
- `GET  /api/v1/images/by-ohif-id/{image_id}` - Fetch image by OHIF ID
- `POST /api/v1/comments/` - Create comment (doctor or AI)
- `GET  /api/v1/comments/image/{image_id}` - Fetch comments for image
- `POST /api/v1/auth/register` - Register doctor
- `POST /api/v1/auth/login` - Login, returns JWT
- `GET  /api/v1/auth/me` - Current doctor information

Development (no auth, for local testing):
- `POST /api/v1/dev/images/`
- `GET  /api/v1/dev/images/by-ohif-id/{image_id}`
- `POST /api/v1/dev/comments/`
- `GET  /api/v1/dev/comments/image/{image_id}`

## 🔧 Features

### ✅ Implemented
- **Two-row Tabs**: Row 1 → Analyze with AI, Add your comment; Row 2 → View Comments (right-aligned)
- **Tab-Scoped Inputs**:
  - Analyze with AI: prompt input + Use active image + Send (AI-only)
  - Add your comment: doctor input + Send, shown only after auth
  - View Comments: read-only aggregate thread (AI + doctor) for the active image
- **Per-Image Threads**: Saved comments are tied to the active image (SOPInstanceUID preferred)
- **Auth & JWT**: Register, Sign in, Logout; JWT stored in localStorage and applied to requests
- **Comment Persistence & Retrieval**: Doctor + AI comments saved and displayed in View Comments
- **Visual Indicators**: Saved 💾 tag; signed-in doctor name shown; image registered message

### 🎯 How It Works

1. **Image Identification**: Uses `dicom-${SOPInstanceUID}` when available; otherwise a canvas-based fingerprint
2. **Database Registration**: Auto-registers or fetches the active image from backend
3. **Comment Storage**:
   - Doctor comments require JWT; saved with `is_ai_generated=false`
   - AI chat replies saved with `is_ai_generated=true`
4. **Comment Loading**: Switching images reloads the saved thread for that image into View Comments

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
2. Load OHIF viewer and open the custom panel
3. Analyze with AI
   - Type a prompt, optionally click “Use active image”, then Send
   - Switch to View Comments → AI reply appears under the active image thread
4. Add your comment (doctor)
   - Click Add your comment → Sign in or Register
   - After login, type your comment and click Send → appears in View Comments
5. Change images
   - Switch the active viewport image → View Comments reloads the correct thread

## 🔍 Troubleshooting

### Common Issues
- **Auth not applied**: Ensure `localStorage.DOCTOR_JWT` exists after login; the client will use secured endpoints
- **Comments not loading**: Verify image is identified (see console logs for DICOM ID or canvas-based ID)
- **CORS Errors**: Ensure backend allows requests from OHIF origin
- **Dev vs Secured endpoints**: Without JWT, client uses `/api/v1/dev/...` endpoints for local testing

### Debug Mode
Enable debug logging by checking browser console for:
- Image ID selection (DICOM-based or canvas-based)
- Registration/fetch calls for images
- Create/fetch calls for comments
- Auth status and `/auth/me` result
