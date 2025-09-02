# OHIF Collaborative Imaging System Backend

This is the backend API for the OHIF Collaborative Image Review System. It provides authentication, database storage, and API endpoints for the collaborative features.

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with the following content:
```
# Database
DATABASE_URL=sqlite:///./collaborative_imaging.db

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=OHIF Collaborative Imaging System

# Logging
LOG_LEVEL=INFO

# Development flags
DEBUG=true
TESTING=false
```

4. Initialize the database:
```bash
# Option 1: The database will be automatically initialized when starting the app
# Option 2: Run the initialization script directly
python -m app.utils.init_db
```

5. Run the application:
```bash
uvicorn app.main:app --reload
```

6. Access the API documentation:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Troubleshooting

If you encounter database errors like "no such table", try:

1. Delete the existing database file:
```bash
rm collaborative_imaging.db
```

2. Restart the application or run the initialization script:
```bash
python -m app.utils.init_db
```

## API Endpoints

### Authentication Endpoints

- **Register a new doctor**:
  - `POST /api/v1/auth/register`
  - Body: `{ "name": "Dr. John Smith", "id_card_number": "12345678", "email": "john.smith@example.com", "password": "securepassword123" }`
  - Response: `{ "message": "Doctor registered successfully", "doctor_id": 1 }`

- **Login**:
  - `POST /api/v1/auth/login`
  - Body: `{ "email": "john.smith@example.com", "password": "securepassword123" }`
  - Response: `{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "token_type": "bearer", "expires_in": 1800, "doctor_info": {...} }`

- **Get current doctor information**:
  - `GET /api/v1/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }`

### Doctor Management Endpoints

- **Get all doctors**:
  - `GET /api/v1/doctors/`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=100`
  - Response: `[{ "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, ...]`

- **Get a specific doctor**:
  - `GET /api/v1/doctors/{doctor_id}`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }`

- **Get current doctor's information**:
  - `GET /api/v1/doctors/me/`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }`

- **Update current doctor's information**:
  - `PUT /api/v1/doctors/me/`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "name": "Dr. John Updated Smith", "email": "john.updated@example.com" }`
  - Response: `{ "id": 1, "name": "Dr. John Updated Smith", "email": "john.updated@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }`

- **Update a specific doctor**:
  - `PUT /api/v1/doctors/{doctor_id}`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "name": "Dr. John Updated Smith", "email": "john.updated@example.com" }`
  - Response: `{ "id": 1, "name": "Dr. John Updated Smith", "email": "john.updated@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }`

- **Get doctor statistics**:
  - `GET /api/v1/doctors/stats/`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "total_doctors": 10, "active_doctors": 8 }`

### Image Reference Endpoints

- **Register an image reference**:
  - `POST /api/v1/images/`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT" }`
  - Response: `{ "id": 1, "image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT", "created_at": "2023-01-01T12:00:00", "comment_count": 0 }`

- **Get all image references**:
  - `GET /api/v1/images/`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=50&patient_id=PATIENT-123&modality=CT`
  - Response: `[{ "id": 1, "image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT", "created_at": "2023-01-01T12:00:00", "comment_count": 2 }, ...]`

- **Get a specific image reference by ID**:
  - `GET /api/v1/images/{image_id}`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT", "created_at": "2023-01-01T12:00:00", "comment_count": 2 }`

- **Get a specific image reference by OHIF ID**:
  - `GET /api/v1/images/by-ohif-id/{ohif_image_id}`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT", "created_at": "2023-01-01T12:00:00", "comment_count": 2 }`

### Comment Management Endpoints

- **Create a new comment**:
  - `POST /api/v1/comments/`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "is_ai_generated": false }`
  - Response: `{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }`

- **Get all comments**:
  - `GET /api/v1/comments/`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=50&image_id=1&doctor_id=1&is_ai_generated=false`
  - Response: `[{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }, ...]`

- **Get comments for a specific image**:
  - `GET /api/v1/comments/image/{image_id}`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=50`
  - Response: `[{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }, ...]`

- **Get comments by a specific doctor**:
  - `GET /api/v1/comments/doctor/{doctor_id}`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=50`
  - Response: `[{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }, ...]`

- **Get comments by the current doctor**:
  - `GET /api/v1/comments/me/`
  - Header: `Authorization: Bearer <token>`
  - Query parameters: `skip=0&limit=50`
  - Response: `[{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }, ...]`

- **Get a specific comment**:
  - `GET /api/v1/comments/{comment_id}`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id": 1, "content": "This appears to be a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }`

- **Update a comment**:
  - `PUT /api/v1/comments/{comment_id}`
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "content": "Updated: This is definitely a fracture in the distal radius." }`
  - Response: `{ "id": 1, "content": "Updated: This is definitely a fracture in the distal radius.", "image_id": 1, "doctor": { "id": 1, "name": "Dr. John Smith", "email": "john.smith@example.com", "is_active": true, "created_at": "2023-01-01T12:00:00" }, "is_ai_generated": false, "ai_model": null, "created_at": "2023-01-01T12:00:00", "updated_at": "2023-01-01T12:00:00" }`

- **Delete a comment**:
  - `DELETE /api/v1/comments/{comment_id}`
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "message": "Comment deleted successfully" }`

For detailed API documentation, please refer to the Swagger UI or ReDoc.

## Security

- Password hashing is handled using bcrypt
- Authentication is managed with JWT tokens
- Token expiration is configurable via environment variables
- CORS is configured to allow requests only from trusted origins

## Testing the API

### Testing Authentication

You can test the authentication endpoints using curl:

```bash
# Register a new doctor
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. John Smith", "id_card_number": "12345678", "email": "john.smith@example.com", "password": "securepassword123"}'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@example.com", "password": "securepassword123"}'

# Get current doctor information
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing Doctor Management

You can test the doctor management endpoints using curl:

```bash
# Get all doctors
curl -X GET "http://localhost:8000/api/v1/doctors/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get a specific doctor
curl -X GET "http://localhost:8000/api/v1/doctors/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get current doctor's information
curl -X GET "http://localhost:8000/api/v1/doctors/me/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update current doctor's information
curl -X PUT "http://localhost:8000/api/v1/doctors/me/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Dr. John Updated Smith", "email": "john.updated@example.com"}'

# Get doctor statistics
curl -X GET "http://localhost:8000/api/v1/doctors/stats/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing Image Reference System

You can test the image reference endpoints using curl:

```bash
# Register an image reference
curl -X POST "http://localhost:8000/api/v1/images/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"image_id": "1.2.840.113619.2.5.1762583153.215519.978957063.122_0", "study_instance_uid": "1.2.840.113619.2.5.1762583153.215519.978957063.122", "patient_id": "PATIENT-123", "modality": "CT"}'

# Get all image references
curl -X GET "http://localhost:8000/api/v1/images/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all image references with filtering
curl -X GET "http://localhost:8000/api/v1/images/?patient_id=PATIENT-123&modality=CT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get a specific image reference by ID
curl -X GET "http://localhost:8000/api/v1/images/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get a specific image reference by OHIF ID
curl -X GET "http://localhost:8000/api/v1/images/by-ohif-id/1.2.840.113619.2.5.1762583153.215519.978957063.122_0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing Comment Management

You can test the comment management endpoints using curl:

```bash
# Create a new comment
curl -X POST "http://localhost:8000/api/v1/comments/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"content": "This appears to be a fracture in the distal radius.", "image_id": 1, "is_ai_generated": false}'

# Get all comments
curl -X GET "http://localhost:8000/api/v1/comments/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get comments for a specific image
curl -X GET "http://localhost:8000/api/v1/comments/image/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get comments by a specific doctor
curl -X GET "http://localhost:8000/api/v1/comments/doctor/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get comments by the current doctor
curl -X GET "http://localhost:8000/api/v1/comments/me/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get a specific comment
curl -X GET "http://localhost:8000/api/v1/comments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update a comment
curl -X PUT "http://localhost:8000/api/v1/comments/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"content": "Updated: This is definitely a fracture in the distal radius."}'

# Delete a comment
curl -X DELETE "http://localhost:8000/api/v1/comments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
