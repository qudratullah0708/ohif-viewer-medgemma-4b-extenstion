import React from 'react';
import { apiService, Comment, UpdateCommentRequest } from '../services/api';
import { createImageIdentifier, ImageMetadata } from '../utils/imageUtils';
import { GEMINI_API_KEY } from '../config';

interface DummyComponentProps {
  testId?: string;
  apiKey?: string;
  /**
   * Optional callback to fetch the currently selected OHIF viewport image as PNG base64 (no prefix).
   */
  getSelectedImageData?: () => Promise<{ dataBase64: string; mimeType: string }>;
}

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  commentId?: number; // Link to database comment if saved
  isSaved?: boolean; // Whether this message was saved to database
  fullComment?: Comment; // Full comment data from API for timestamps and permissions
};

const API_KEY = GEMINI_API_KEY || 'AIzaSyD-l0tRMme3ljv0AQ2DJPC7v8Ra38_17_c';

// Enhanced OHIF-specific system prompt for superior medical imaging AI assistance
const SYSTEM_PROMPT = `You are an expert medical imaging AI assistant specializing in OHIF (Open Health Imaging Foundation) viewer and comprehensive medical imaging analysis. Your core expertise encompasses:

**🏥 Medical Imaging Excellence:**
- Advanced DICOM image interpretation and analysis
- Multi-modality imaging: CT, MRI, X-ray, PET/CT, ultrasound, mammography
- Cross-sectional anatomy and pathology recognition
- Image quality assessment and optimization techniques
- Radiological findings correlation and differential diagnosis support
- Quantitative imaging biomarkers and measurements

**🔧 OHIF Viewer Mastery:**
- Complete OHIF platform functionality and navigation
- Advanced viewport manipulation and hanging protocols
- Measurement tools: length, area, volume, SUV calculations
- Multi-planar reconstruction (MPR) and 3D rendering
- Segmentation workflows and ROI analysis
- Annotation tools and markup techniques
- DICOM metadata interpretation and study management
- Viewport synchronization and comparison studies
- Custom extension development and integration

**📊 Clinical Workflow Integration:**
- Radiology reporting best practices
- Structured reporting templates (BI-RADS, RECIST, etc.)
- Image-guided procedure planning
- Treatment response assessment
- Quality assurance protocols
- PACS integration considerations

**🎯 Response Excellence Guidelines:**
- Provide step-by-step OHIF instructions with specific menu locations
- Use clear medical terminology with beginner-friendly explanations
- Structure responses with headers, bullet points, and numbered steps
- Include relevant keyboard shortcuts and workflow tips
- Emphasize evidence-based findings and standardized approaches
- Format technical information clearly for easy comprehension

**⚠️ Safety & Ethics Framework:**
- All analyses are for educational and research purposes only
- Never provide definitive clinical diagnoses
- Always recommend consultation with qualified radiologists
- Emphasize the importance of clinical correlation
- Clearly state AI limitations in medical decision-making
- Maintain patient privacy and HIPAA compliance awareness

**💡 Interactive Capabilities:**
- Analyze uploaded medical images when provided
- Guide users through specific OHIF workflows
- Troubleshoot technical issues and viewer problems
- Explain imaging findings in educational context
- Suggest optimal viewing parameters and window/level settings
- Provide comparative analysis techniques

Respond with professional accuracy, educational depth, and practical utility for medical imaging professionals, students, and researchers using OHIF viewer. and don't use markdown in response`;

/**
 * DummyComponent - A simple chat UI wired to Gemini generateContent
 */
function DummyComponent({
  testId = 'dummy-component',
  apiKey = API_KEY,
  getSelectedImageData,
}: DummyComponentProps): React.ReactElement {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]); // AI chat-only
  const [threadComments, setThreadComments] = React.useState<ChatMessage[]>([]); // Saved comments for View Comments
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [doctorInput, setDoctorInput] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'chat' | 'doctor' | 'comments'>('chat');
  const [authMode, setAuthMode] = React.useState<'none' | 'register' | 'login'>('none');
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [authName, setAuthName] = React.useState('');
  const [authIdCard, setAuthIdCard] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [doctorName, setDoctorName] = React.useState<string | null>(null);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = React.useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = React.useState<number | null>(null);
  const [currentImageMetadata, setCurrentImageMetadata] = React.useState<ImageMetadata | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editingContent, setEditingContent] = React.useState<string>('');
  const [currentDoctorId, setCurrentDoctorId] = React.useState<number | null>(null);
  const effectiveApiKey =
    apiKey || (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY) || '';

  // Initialize JWT token from window/localStorage if available
  React.useEffect(() => {
    apiService.setTokenFromWindow();
    // Initialize doctor display name if available
    const storedName = apiService.getStoredDoctorName();
    if (storedName) setDoctorName(storedName);
    // Try to fetch fresh name and ID if authenticated
    (async () => {
      if (apiService.isAuthenticated()) {
        const me = await apiService.getCurrentDoctor();
        const n = (me?.full_name || me?.name) as string | undefined;
        if (n) {
          setDoctorName(n);
          try { localStorage.setItem('DOCTOR_NAME', n); } catch {}
        }
        if (me?.id) {
          setCurrentDoctorId(me.id);
        }
      }
    })();
  }, []);

  const isAuthenticated = () => apiService.isAuthenticated();

  const appendMessage = React.useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const showToast = React.useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleDoctorSubmit = React.useCallback(async () => {
    if (!currentImageId || !isAuthenticated() || !doctorInput.trim()) {
      if (!isAuthenticated()) setAuthMode('login');
      return;
    }

    try {
      const saved = await apiService.createComment({
        content: doctorInput.trim(),
        image_id: currentImageId,
        is_ai_generated: false,
      });

      // Get doctor name for display
      const displayName = doctorName || 'Doctor';

      // Immediately reflect in View Comments (not in AI chat)
      setThreadComments(prev => [
        ...prev,
        {
          role: 'user',
          text: `${displayName}: ${doctorInput.trim()}`,
          commentId: saved.id,
          isSaved: true,
          fullComment: saved,
        },
      ]);

      // Switch to View Comments so the new comment is visible instantly
      setActiveTab('comments');

      // Toast confirmation
      showToast('Your comment was added and saved.');
      setDoctorInput('');

      // Update doctor name and ID if not already set
      if (!doctorName || !currentDoctorId) {
        const me = await apiService.getCurrentDoctor();
        const n = (me?.full_name || me?.name) as string | undefined;
        if (n && !doctorName) {
          setDoctorName(n);
          try { localStorage.setItem('DOCTOR_NAME', n); } catch {}
        }
        if (me?.id && !currentDoctorId) {
          setCurrentDoctorId(me.id);
        }
      }
    } catch (err: any) {
      showToast(`Error adding comment: ${err?.message || 'Unknown error'}`);
    }
  }, [currentImageId, doctorInput, doctorName, showToast]);

  const handleEditComment = React.useCallback((commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingContent(currentContent);
  }, []);

  const handleSaveEdit = React.useCallback(async (commentId: number) => {
    if (!editingContent.trim()) {
      showToast('Comment content cannot be empty');
      return;
    }

    try {
      const updatedComment = await apiService.updateComment(commentId, {
        content: editingContent.trim(),
      });

      // Update the thread comments with the new content and updated timestamp
      setThreadComments(prev =>
        prev.map(comment => {
          if (comment.commentId === commentId) {
            const authorPrefix = comment.text.split(': ')[0]; // Keep the author prefix
            return {
              ...comment,
              text: `${authorPrefix}: ${updatedComment.content}`,
              fullComment: updatedComment, // Update with fresh data including new updated_at
            };
          }
          return comment;
        })
      );

      setEditingCommentId(null);
      setEditingContent('');
      showToast('Comment updated successfully');
    } catch (error: any) {
      showToast(`Failed to update comment: ${error.message}`);
    }
  }, [editingContent, showToast]);

  const handleCancelEdit = React.useCallback(() => {
    setEditingCommentId(null);
    setEditingContent('');
  }, []);

  const handleDeleteComment = React.useCallback(async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await apiService.deleteComment(commentId);

      // Remove the comment from thread comments
      setThreadComments(prev =>
        prev.filter(comment => comment.commentId !== commentId)
      );

      showToast('Comment deleted successfully');
    } catch (error: any) {
      showToast(`Failed to delete comment: ${error.message}`);
    }
  }, [showToast]);

  const formatTimestamp = React.useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Load existing comments for the current image
  const loadExistingComments = React.useCallback(async (imageId: number) => {
    try {
      const comments = await apiService.getCommentsByImage(imageId);
      const commentMessages: ChatMessage[] = comments.map(comment => {
        const authorPrefix = comment.is_ai_generated
          ? 'AI Analysis'
          : (comment as any)?.doctor?.full_name || (comment as any)?.doctor?.name || 'Doctor';
        return {
          role: comment.is_ai_generated ? 'model' : 'user',
          text: `${authorPrefix}: ${comment.content}`,
          commentId: comment.id,
          isSaved: true,
          fullComment: comment,
        } as ChatMessage;
      });
      setThreadComments(commentMessages);
    } catch (error) {
      console.error('Failed to load existing comments:', error);
    }
  }, []);

  // Register or get image in database
  const registerImage = React.useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      const metadata = createImageIdentifier(canvas);
      setCurrentImageMetadata(metadata);

      // Try to get existing image first
      try {
        const existingImage = await apiService.getImageByOhifId(metadata.imageId);
        setCurrentImageId(existingImage.id);
        await loadExistingComments(existingImage.id);
        return existingImage.id;
      } catch (error) {
        // Image doesn't exist, create it
        const newImage = await apiService.createImage({
          image_id: metadata.imageId,
          study_instance_uid: metadata.studyInstanceUid,
          series_instance_uid: metadata.seriesInstanceUid,
          sop_instance_uid: metadata.sopInstanceUid,
          patient_id: metadata.patientId,
          study_date: metadata.studyDate,
          modality: metadata.modality,
        });
        setCurrentImageId(newImage.id);
        return newImage.id;
      }
    } catch (error) {
      console.error('Failed to register image:', error);
      return null;
    }
  }, [loadExistingComments]);

  // Detect active image changes and auto-load comments for that image
  React.useEffect(() => {
    let lastSeenImageKey: string | null = null;
    let isUnmounted = false;

    const checkActiveImage = async () => {
      try {
        const canvas = document.querySelector<HTMLCanvasElement>('.Viewport canvas, canvas');
        if (!canvas) {
          return;
        }

        // Build identifier (prefers DICOM metadata when available)
        const metadata = createImageIdentifier(canvas);
        const imageKey = metadata.imageId;

        if (imageKey && imageKey !== lastSeenImageKey) {
          lastSeenImageKey = imageKey;

          // If the image changed, reset unsaved chat and load comments for the new image
          setMessages(prev => prev.filter(m => m.isSaved));

          // Register (or fetch) the image and load comments
          const fetchedId = await (async () => {
            try {
              const existing = await apiService.getImageByOhifId(imageKey);
              return existing.id;
            } catch (_err) {
              // Not found, create
              const created = await apiService.createImage({
                image_id: imageKey,
                study_instance_uid: metadata.studyInstanceUid,
                series_instance_uid: metadata.seriesInstanceUid,
                sop_instance_uid: metadata.sopInstanceUid,
                patient_id: metadata.patientId,
                study_date: metadata.studyDate,
                modality: metadata.modality,
              });
              return created.id;
            }
          })();

          if (!isUnmounted) {
            setCurrentImageMetadata(metadata);
            setCurrentImageId(fetchedId);
            await loadExistingComments(fetchedId);
          }
        }
      } catch (e) {
        // Silent; polling continues
      }
    };

    const intervalId = window.setInterval(checkActiveImage, 1500);
    // Run once immediately to try to load on mount
    checkActiveImage();

    return () => {
      isUnmounted = true;
      window.clearInterval(intervalId);
    };
  }, [loadExistingComments]);

  const handleSend = async () => {
    const trimmed = input.trim();
    const hasImage = Boolean(imageBase64 && imageMimeType);
    if ((!trimmed && !hasImage) || isLoading) return;

    const userSummary = [
      trimmed ? `Prompt: ${trimmed}` : null,
      hasImage ? '(with active image)' : null,
    ]
      .filter(Boolean)
      .join(' ');

    const userMessage = userSummary || '(Image only)';
    appendMessage({ role: 'user', text: userMessage });
    setInput('');

    // Note: User prompts for AI analysis are NOT saved to database
    // Only the AI responses will be saved as they contain the actual analysis

    if (!effectiveApiKey) {
      appendMessage({
        role: 'model',
        text: 'Missing API key. Provide via apiKey prop or window.GEMINI_API_KEY.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const parts: any[] = [];
      if (trimmed) parts.push({ text: trimmed });
      if (hasImage) {
        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
          },
        });
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': effectiveApiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
              {
                parts,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const responseParts = candidate?.content?.parts || [];
      const modelText = responseParts
        .map((p: any) => p?.text)
        .filter(Boolean)
        .join('\n');

      const aiResponse = modelText || '(No response text)';
      appendMessage({ role: 'model', text: aiResponse });

      // Save AI response to database if we have an image ID
      if (currentImageId) {
        try {
          const savedComment = await apiService.createComment({
            content: aiResponse,
            image_id: currentImageId,
            is_ai_generated: true,
            ai_model: 'gemini-2.0-flash',
          });

          // Also reflect in thread comments so it appears in View Comments
          setThreadComments(prev => [
            ...prev,
            {
              role: 'model',
              text: `AI Analysis: ${aiResponse}`,
              commentId: savedComment.id,
              isSaved: true,
              fullComment: savedComment,
            },
          ]);
        } catch (error) {
          console.error('Failed to save AI response to database:', error);
        }
      }
    } catch (error: any) {
      console.error('Gemini API error', error);
      appendMessage({ role: 'model', text: `Error: ${error?.message || 'Unknown error'}` });
    } finally {
      setIsLoading(false);
      setImageBase64(null);
      setImageMimeType(null);
    }
  };

  const useActiveViewerImage = async () => {
    if (!getSelectedImageData) {
      appendMessage({ role: 'model', text: 'Active image capture is not available.' });
      return;
    }
    try {
      setIsLoading(true);
      const { dataBase64, mimeType } = await getSelectedImageData();
      setImageBase64(dataBase64);
      setImageMimeType(mimeType);
      appendMessage({ role: 'model', text: 'Active image attached.' });

      // Register the image in the database and load existing comments
      try {
        const canvas = document.querySelector<HTMLCanvasElement>('.Viewport canvas, canvas');
        if (canvas) {
          await registerImage(canvas);
        }
      } catch (error) {
        console.error('Failed to register image:', error);
      }
    } catch (e: any) {
      console.error('Failed to get active viewer image', e);
      appendMessage({ role: 'model', text: 'Could not fetch active image from viewer.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid={testId}
      className="m-2 rounded-md border p-3"
      style={{
        border: '1px solid #ddd',
        backgroundColor: '#fafafa',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Removed title card for cleaner top-tab layout */}

      {/* Top Tabs – Row 1 */}
      <div className="mb-1 flex gap-2" style={{ flex: '0 0 auto' }}>
        <button
          onClick={() => {
            setActiveTab('chat');
            setAuthMode('none');
          }}
          className="cursor-pointer rounded-md"
          style={{ backgroundColor: activeTab === 'chat' ? '#2563eb' : '#e5e7eb', color: activeTab === 'chat' ? '#fff' : '#111827', border: '1px solid #d1d5db', padding: '6px 10px', fontSize: '12px' }}
        >
          Analyze with AI
        </button>
        <button
          onClick={() => {
            if (isAuthenticated()) {
              setActiveTab('doctor');
              setAuthMode('none');
            } else {
              setActiveTab('doctor');
              setAuthMode('login');
            }
          }}
          className="cursor-pointer rounded-md"
          style={{ backgroundColor: activeTab === 'doctor' ? '#2563eb' : '#e5e7eb', color: activeTab === 'doctor' ? '#fff' : '#111827', border: '1px solid #d1d5db', padding: '6px 10px', fontSize: '12px' }}
        >
          {doctorName ? `Add your comment (${doctorName})` : 'Add your comment'}
        </button>
      </div>

      {/* Top Tabs – Row 2 (right aligned) */}
      <div className="mb-2 flex" style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setActiveTab('comments')}
          className="cursor-pointer rounded-md"
          style={{ backgroundColor: activeTab === 'comments' ? '#10b981' : '#e5e7eb', color: activeTab === 'comments' ? '#fff' : '#111827', border: '1px solid #d1d5db', padding: '6px 10px', fontSize: '12px' }}
        >
          View Comments
        </button>
      </div>

      <div
        className="rounded-md bg-white p-3"
        style={{
          border: '1px solid #ddd',
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
        }}
      >
        {activeTab === 'comments' ? (
          // View Comments: only saved comments
          (() => {
            const saved = threadComments;
            if (saved.length === 0) {
              return (
                <div
                  className="text-center text-gray-500"
                  style={{ padding: '20px', fontStyle: 'italic', backgroundColor: '#ffffff', borderRadius: '8px', border: '2px dashed #e2e8f0' }}
                >
                  No comments yet for this image.
                </div>
              );
            }
            return saved.map((msg, idx) => {
              const isOwnComment = msg.fullComment && !msg.fullComment.is_ai_generated && msg.fullComment.doctor_id === currentDoctorId;
              const isEditing = editingCommentId === msg.commentId;

              // Debug info (temporary)
              console.log('Debug comment:', {
                commentId: msg.commentId,
                isAI: msg.fullComment?.is_ai_generated,
                commentDoctorId: msg.fullComment?.doctor_id,
                currentDoctorId: currentDoctorId,
                isOwnComment: isOwnComment
              });

              return (
                <div key={idx} className="mb-3" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${msg.role === 'user' ? '#3b82f6' : '#10b981'}`, backgroundColor: msg.role === 'user' ? '#eff6ff' : '#ecfdf5', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
                    <div className="mb-2 flex justify-between items-start">
                      <div className="text-xs font-semibold" style={{ color: msg.role === 'user' ? '#1e40af' : '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {msg.isSaved && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.7 }}>
                            {msg.fullComment?.is_ai_generated ? 'AI (Gemini)' : 'DOCTOR'}
                          </span>
                        )}
                      </div>
                      {(isOwnComment || (!msg.fullComment?.is_ai_generated && isAuthenticated())) && !isEditing && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditComment(msg.commentId!, msg.fullComment!.content)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                            title="Edit comment"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteComment(msg.commentId!)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                            title="Delete comment"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-2 border rounded"
                          rows={3}
                          style={{ fontSize: '14px', resize: 'vertical' }}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(msg.commentId!)}
                            className="text-xs px-3 py-1 rounded"
                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs px-3 py-1 rounded"
                            style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap" style={{ color: '#374151', lineHeight: '1.5', fontSize: '14px' }}>
                        {msg.text}
                      </div>
                    )}

                    {msg.fullComment && (
                      <div className="mt-2 text-xs" style={{ color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                        <div>Created: {formatTimestamp(msg.fullComment.created_at)}</div>
                        {msg.fullComment.updated_at !== msg.fullComment.created_at && (
                          <div>Updated: {formatTimestamp(msg.fullComment.updated_at)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()
        ) : activeTab === 'doctor' ? (
          <div
            className="text-center text-gray-500"
            style={{
              padding: '20px',
              fontStyle: 'italic',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '2px dashed #e2e8f0',
            }}
          >
            {isAuthenticated() ? 'Add a comment below for this image.' : 'Sign in to add a doctor comment.'}
          </div>
        ) : messages.length === 0 ? (
          <div
            className="text-center text-gray-500"
            style={{
              padding: '20px',
              fontStyle: 'italic',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '2px dashed #e2e8f0',
            }}
          >
            👋 Start the conversation by asking a question!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="mb-3"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${msg.role === 'user' ? '#3b82f6' : '#10b981'}`,
                  backgroundColor: msg.role === 'user' ? '#eff6ff' : '#ecfdf5',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative',
                }}
              >
                <div
                  className="mb-1 text-xs font-semibold"
                  style={{
                    color: msg.role === 'user' ? '#1e40af' : '#047857',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {msg.role === 'user' ? '🙋‍♂️ You' : '🤖 AI Assistant'}
                  {msg.isSaved && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.7 }}>
                      💾 Saved
                    </span>
                  )}
                </div>
                <div
                  className="whitespace-pre-wrap"
                  style={{
                    color: '#374151',
                    lineHeight: '1.5',
                    fontSize: '14px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" style={{ flex: '0 0 auto' }}>
        {/* Doctor tab: auth and input only visible in doctor tab */}
        {activeTab === 'doctor' && authMode !== 'none' && !isAuthenticated() ? (
          <div className="w-full rounded-md border p-3" style={{ borderColor: '#ddd', backgroundColor: '#fff' }}>
            <div className="mb-2 flex gap-2">
              <button onClick={() => setAuthMode('login')} className="rounded-md px-3 py-1" style={{ backgroundColor: authMode === 'login' ? '#2563eb' : '#e5e7eb', color: authMode === 'login' ? '#fff' : '#111827' }}>Sign in</button>
              <button onClick={() => setAuthMode('register')} className="rounded-md px-3 py-1" style={{ backgroundColor: authMode === 'register' ? '#2563eb' : '#e5e7eb', color: authMode === 'register' ? '#fff' : '#111827' }}>Register</button>
            </div>
            {authError && <div className="mb-2 text-xs" style={{ color: '#b91c1c' }}>{authError}</div>}
            {authMode === 'register' && (
              <div className="flex flex-col gap-2">
                <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full name" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <input value={authIdCard} onChange={e => setAuthIdCard(e.target.value)} placeholder="ID Card Number" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <button onClick={async () => {
                  setAuthError(null);
                  try {
                    await apiService.registerDoctor({ name: authName.trim(), email: authEmail.trim(), password: authPassword, id_card_number: authIdCard.trim() });
                    const res = await apiService.loginDoctor({ email: authEmail.trim(), password: authPassword });
                    if (res?.access_token) {
                      setAuthMode('none');
                      // Update doctor info after successful login
                      const me = await apiService.getCurrentDoctor();
                      if (me?.id) {
                        setCurrentDoctorId(me.id);
                      }
                      const n = (me?.full_name || me?.name) as string | undefined;
                      if (n) {
                        setDoctorName(n);
                      }
                    }
                  } catch (e: any) {
                    setAuthError(e?.message || 'Registration failed');
                  }
                }} className="rounded-md px-3 py-2" style={{ backgroundColor: '#2563eb', color: '#fff' }}>Create account & Sign in</button>
              </div>
            )}
            {authMode === 'login' && (
              <div className="flex flex-col gap-2">
                <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" className="rounded-md border px-3 py-2" style={{ borderColor: '#ddd' }} />
                <button onClick={async () => {
                  setAuthError(null);
                  try {
                    const res = await apiService.loginDoctor({ email: authEmail.trim(), password: authPassword });
                    if (res?.access_token) {
                      setAuthMode('none');
                      // Update doctor info after successful login
                      const me = await apiService.getCurrentDoctor();
                      if (me?.id) {
                        setCurrentDoctorId(me.id);
                      }
                      const n = (me?.full_name || me?.name) as string | undefined;
                      if (n) {
                        setDoctorName(n);
                      }
                    }
                  } catch (e: any) {
                    setAuthError(e?.message || 'Login failed');
                  }
                }} className="rounded-md px-3 py-2" style={{ backgroundColor: '#2563eb', color: '#fff' }}>Sign in</button>
              </div>
            )}
          </div>
        ) : activeTab === 'doctor' ? (
          <>
            {/* Doctor header with logout */}
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm" style={{ color: '#374151' }}>
                {doctorName ? `Signed in as ${doctorName}` : 'Signed in'}
              </div>
              <button
                onClick={() => {
                  apiService.logout();
                  setDoctorName(null);
                  setCurrentDoctorId(null);
                  setAuthMode('login');
                }}
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: '#ef4444', color: '#fff', border: '1px solid #dc2626' }}
              >
                Logout
              </button>
            </div>
            <input
              type="text"
              value={doctorInput}
              onChange={e => setDoctorInput(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  await handleDoctorSubmit();
                }
              }}
              placeholder={isAuthenticated() ? 'Add doctor comment' : 'Sign in to add doctor comment'}
              className="flex-1 rounded-md border px-3 py-2"
              style={{ borderColor: '#ddd', flex: '1 1 260px' }}
              disabled={!isAuthenticated()}
            />
            <button
              onClick={handleDoctorSubmit}
              disabled={!isAuthenticated() || !doctorInput.trim() || !currentImageId}
              className="cursor-pointer rounded-md border-none px-4 py-2 text-white"
              style={{
                backgroundColor: (!isAuthenticated() || !doctorInput.trim() || !currentImageId) ? '#9e9e9e' : '#2563eb',
                flex: '0 0 auto'
              }}
            >
              Submit
            </button>
          </>
        ) : null}

        {/* Analyze with AI inputs visible only in chat tab */}
        {activeTab === 'chat' && (
          <>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask something..."
              className="flex-1 rounded-md border px-3 py-2"
              style={{ borderColor: '#ddd', flex: '1 1 260px' }}
            />
            <button
              onClick={useActiveViewerImage}
              disabled={isLoading}
              className="cursor-pointer rounded-md border px-3 py-2"
              style={{ borderColor: '#ddd', backgroundColor: '#fff', flex: '0 0 auto' }}
              title={
                getSelectedImageData
                  ? 'Attach the active viewport image'
                  : 'Active image capture not available'
              }
            >
              Use active image
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !(imageBase64 && imageMimeType))}
              className="cursor-pointer rounded-md border-none px-4 py-2 text-white"
              style={{ backgroundColor: isLoading ? '#9e9e9e' : '#616161', flex: '0 0 auto' }}
            >
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </>
        )}
      </div>
      {activeTab === 'chat' && imageBase64 && imageMimeType && (
        <div className="mt-2 text-xs" style={{ color: '#555' }}>
          Image attached ({imageMimeType}). It will be sent with your next prompt.
        </div>
      )}
      {activeTab === 'chat' && !effectiveApiKey && (
        <div className="mt-2 text-xs text-red-700">
          No API key detected. Set <code>apiKey</code> prop or <code>window.GEMINI_API_KEY</code>.
        </div>
      )}
      {currentImageId && (
        <div className="mt-2 text-xs" style={{ color: '#059669' }}>
          📊 Image registered (ID: {currentImageId}) - Comments will be saved to database
        </div>
      )}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 rounded-md px-4 py-2 text-white"
          style={{ backgroundColor: '#111827', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default DummyComponent;
