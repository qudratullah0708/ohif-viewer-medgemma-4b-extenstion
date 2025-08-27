import React from 'react';

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
};

const API_KEY = 'AIzaSyD-l0tRMme3ljv0AQ2DJPC7v8Ra38_17_c';
/**
 * DummyComponent - A simple chat UI wired to Gemini generateContent
 */
function DummyComponent({
  testId = 'dummy-component',
  apiKey = API_KEY,
  getSelectedImageData,
}: DummyComponentProps): React.ReactElement {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = React.useState<string | null>(null);
  const effectiveApiKey =
    apiKey || (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY) || '';

  const appendMessage = React.useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

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
    appendMessage({ role: 'user', text: userSummary || '(Image only)' });
    setInput('');

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

      appendMessage({ role: 'model', text: modelText || '(No response text)' });
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
      <div
        className="mt-3 rounded-md bg-white p-3"
        style={{ border: '1px solid #ddd', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
      >
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">Start the conversation by asking a question.</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span
                className="mr-1 font-semibold"
                style={{ color: msg.role === 'user' ? '#b71c1c' : '#1b5e20' }}
              >
                {msg.role === 'user' ? 'You' : 'AI'}:
              </span>
              <span className="whitespace-pre-wrap">{msg.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" style={{ flex: '0 0 auto' }}>
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
      </div>
      {imageBase64 && imageMimeType && (
        <div className="mt-2 text-xs" style={{ color: '#555' }}>
          Image attached ({imageMimeType}). It will be sent with your next prompt.
        </div>
      )}
      {!effectiveApiKey && (
        <div className="mt-2 text-xs text-red-700">
          No API key detected. Set <code>apiKey</code> prop or <code>window.GEMINI_API_KEY</code>.
        </div>
      )}
    </div>
  );
}

export default DummyComponent;
