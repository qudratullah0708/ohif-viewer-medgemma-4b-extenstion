### Comment Storage and Unique Retrieval (Doctors & AI)

This document explains how doctor and AI comments are stored in the database and how they are uniquely retrieved using DICOM identifiers, in a way that integrates with OHIF/DICOMweb.

---

## What makes a DICOM image unique?

- **StudyInstanceUID**: Uniquely identifies the exam/study
- **SeriesInstanceUID**: Uniquely identifies a series within a study
- **SOPInstanceUID**: Uniquely identifies a single image (slice)

OHIF fetches images over DICOMweb but internally every instance is referenced by these UIDs. Our backend captures those UIDs on the `images` table and ties comments to a specific `image` record.

---

## Data model overview

- `images` (table)
  - `id` (PK)
  - `image_id` (string, unique): OHIF image identifier (e.g., Cornerstone imageId)
  - `study_instance_uid` (string, nullable)
  - `series_instance_uid` (string, nullable)
  - `sop_instance_uid` (string, nullable)
  - Other metadata (patient_id, modality, etc.)

- `comments` (table)
  - `id` (PK)
  - `content` (text)
  - `image_id` (FK → `images.id`) — ties a comment to a specific image/instance context
  - `doctor_id` (FK → `doctors.id`, nullable) — NULL for AI-generated comments
  - `is_ai_generated` (bool) — flags AI vs doctor comment
  - `ai_model` (string, nullable) — model name/version for traceability
  - `created_at`, `updated_at`

Relationships:
- `Image.comments` ↔ `Comment.image`
- `Doctor.comments` ↔ `Comment.doctor`

Why this design?
- We normalize DICOM identifiers on `images`. Comments link via `image_id` (FK). This ensures each comment is anchored to a single image context which already contains the `StudyInstanceUID`, `SeriesInstanceUID`, and `SOPInstanceUID` for unique retrieval and auditing.

---

## Storing comments (doctor vs AI)

- Doctor comment:
  - `is_ai_generated = false`
  - `doctor_id` is set to the authenticated doctor
- AI comment:
  - `is_ai_generated = true`
  - `doctor_id = NULL`
  - `ai_model` optionally populated (e.g., "gemma-4b", "med-gpt"), for provenance

Before creating a comment, the corresponding `Image` record must exist (registered via the Images API) so we have the UIDs captured and a stable FK to link to.

---

## API endpoints (aligned with implementation)

Base path: `/api/v1/comments`

- Create comment (doctor or AI)
  - `POST /`
  - Body:
```json
{
  "content": "Possible lesion at L3 vertebra",
  "image_id": 1,
  "is_ai_generated": false,
  "ai_model": null
}
```
  - Notes: For AI, set `is_ai_generated: true` and optionally `ai_model: "your-model"`.

- List comments with filters
  - `GET /?skip=0&limit=50&image_id=1&doctor_id=2&is_ai_generated=false`

- List comments for a specific image
  - `GET /image/{image_id}`

- List comments by StudyInstanceUID
  - `GET /by-uids/study/{study_uid}`

- List comments by StudyInstanceUID + SeriesInstanceUID
  - `GET /by-uids/study/{study_uid}/series/{series_uid}`

- List comments by StudyInstanceUID + SeriesInstanceUID + SOPInstanceUID
  - `GET /by-uids/study/{study_uid}/series/{series_uid}/instances/{sop_instance_uid}`

- List comments by a specific doctor
  - `GET /doctor/{doctor_id}`

- List comments by current doctor
  - `GET /me/`

- Get a single comment
  - `GET /{comment_id}`

- Update a comment (only the author; AI-generated comments cannot be updated)
  - `PUT /{comment_id}`

- Delete a comment (only the author)
  - `DELETE /{comment_id}`

All comment responses include timestamps and, when applicable, the doctor object.

---

## How uniqueness works end-to-end

1. The frontend (OHIF extension) extracts UIDs from the active image:
   - `StudyInstanceUID`, `SeriesInstanceUID`, `SOPInstanceUID`
2. The frontend calls the Images API to ensure an `Image` row exists with these UIDs and an `image_id` that maps to the OHIF image (if not already present).
3. Comments are created against that `Image.id`.
4. When retrieving, you can:
   - Query comments by `image_id` directly, or
   - Resolve `image_id` first by searching `images` with the UIDs and then fetch comments for that `image_id`.

This guarantees comments are uniquely attached to the exact instance and can be reloaded deterministically.

---

## Practical examples

### 1) Register the image reference (once per instance)

`POST /api/v1/images`
```json
{
  "image_id": "wadors:...:1.2.840.113619.2.312.4120.67890",
  "study_instance_uid": "1.2.840.113619.2.312.4120.12345",
  "series_instance_uid": "1.2.840.113619.2.312.4120.54321",
  "sop_instance_uid": "1.2.840.113619.2.312.4120.67890",
  "patient_id": "PATIENT-123",
  "modality": "CT"
}
```
Response includes `id` which becomes the foreign key for comments.

### 2) Create a doctor comment

`POST /api/v1/comments`
```json
{
  "content": "Possible lesion at L3 vertebra",
  "image_id": 1,
  "is_ai_generated": false
}
```

### 3) Create an AI comment

`POST /api/v1/comments`
```json
{
  "content": "AI: 0.86 probability of lesion at L3",
  "image_id": 1,
  "is_ai_generated": true,
  "ai_model": "medgemma-4b"
}
```

Alternatively, you can create using UIDs instead of `image_id`:

`POST /api/v1/comments`
```json
{
  "content": "Finding at L3",
  "is_ai_generated": false,
  "study_instance_uid": "1.2.840.113619.2.312.4120.12345",
  "series_instance_uid": "1.2.840.113619.2.312.4120.54321",
  "sop_instance_uid": "1.2.840.113619.2.312.4120.67890"
}
```

### 4) Retrieve comments for the exact image instance

`GET /api/v1/comments/image/1`

If you only have UIDs on the client, resolve the image first:
- `GET /api/v1/images/by-ohif-id/{ohif_image_id}` or
- filter your own `images` by `study_instance_uid` + `series_instance_uid` + `sop_instance_uid`, then read `id` and call `GET /comments/image/{id}`.

---

## Indexing & performance recommendations

- Add indexes for fast lookups:
  - `images.image_id` (already unique + indexed)
  - `images.study_instance_uid`, `images.series_instance_uid`, `images.sop_instance_uid`
  - `comments.image_id`, `comments.doctor_id`, `comments.is_ai_generated`
- Keep `ai_model` populated for AI comments to aid traceability and audits.

---

## Frontend (OHIF) integration tips

- From the active viewport, extract the current image UIDs and locate/create the `Image` row.
- Use the returned `Image.id` when creating comments so later retrieval is a single hop.
- For multi-frame objects, ensure you are consistent with the OHIF `image_id` you store, so comments map to the viewed frame/instance you expect.

### Frontend wiring example (using UIDs)

Create comment by UIDs (no `image_id` needed):

```javascript
async function postCommentByUIDs({ token, studyUID, seriesUID, sopUID, content, isAI = false, aiModel = null }) {
  const res = await fetch("/api/v1/comments/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content,
      is_ai_generated: isAI,
      ai_model: aiModel,
      study_instance_uid: studyUID,
      series_instance_uid: seriesUID,
      sop_instance_uid: sopUID,
    }),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

async function getCommentsByStudy({ token, studyUID }) {
  const res = await fetch(`/api/v1/comments/by-uids/study/${encodeURIComponent(studyUID)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

async function getCommentsBySeries({ token, studyUID, seriesUID }) {
  const url = `/api/v1/comments/by-uids/study/${encodeURIComponent(studyUID)}/series/${encodeURIComponent(seriesUID)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

async function getCommentsByInstance({ token, studyUID, seriesUID, sopUID }) {
  const url = `/api/v1/comments/by-uids/study/${encodeURIComponent(studyUID)}/series/${encodeURIComponent(seriesUID)}/instances/${encodeURIComponent(sopUID)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}
```

---

## Summary

- Comments are uniquely tied to images via `comments.image_id`.
- Each `Image` stores the DICOM UIDs, ensuring unambiguous mapping back to Study/Series/Instance.
- Doctor vs AI is differentiated by `is_ai_generated` and `doctor_id` (NULL for AI), with optional `ai_model` for provenance.
