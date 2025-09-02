import React from 'react';
import DummyComponent from './DummyComponent';
import { apiService } from '../services/api';
import { createImageIdentifier } from '../utils/imageUtils';

/**
 * DummyPanel - A panel that contains our dummy component for testing
 */
function DummyPanel(): React.ReactElement {
  // Add console logging to debug
  console.log('DummyPanel is rendering!');

  // Auto-register current image when panel loads
  React.useEffect(() => {
    const registerCurrentImage = async () => {
      try {
        const canvas = document.querySelector<HTMLCanvasElement>('.Viewport canvas, canvas');
        if (canvas) {
          const metadata = createImageIdentifier(canvas);

          // Try to get existing image first
          try {
            await apiService.getImageByOhifId(metadata.imageId);
            console.log('Current image already registered');
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
            console.log('Registered new image:', newImage.id);
          }
        }
      } catch (error) {
        console.error('Failed to auto-register image:', error);
      }
    };

    // Small delay to ensure viewport is loaded
    const timer = setTimeout(registerCurrentImage, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getSelectedImageData = async (): Promise<{ dataBase64: string; mimeType: string }> => {
    // Try to access the Cornerstone active viewport canvas and export to PNG base64
    // This approach is resilient across OHIF versions as long as a canvas exists.
    // Fallbacks are handled if the viewport/canvas is not available.
    const activeViewport = (window as any)?.cornerstoneDICOMImageLoader?.activeViewport;
    try {
      // Prefer modern OHIF service if available
      const viewportGridService = (window as any)?.servicesManager?.services?.viewportGridService;
      if (viewportGridService?.getState) {
        const state = viewportGridService.getState();
        const activeIndex = state?.activeViewportIndex ?? 0;
        const viewport = state?.viewports?.[activeIndex];
        const element: HTMLDivElement | undefined = viewport?.htmlElement ?? viewport?.element;
        const canvas: HTMLCanvasElement | null = element?.querySelector?.('canvas') ?? null;
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1] ?? '';
          return { dataBase64: base64, mimeType: 'image/png' };
        }
      }

      // Fallback: look for any viewport canvas in DOM
      const anyCanvas = document.querySelector<HTMLCanvasElement>('.Viewport canvas, canvas');
      if (anyCanvas) {
        const dataUrl = anyCanvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] ?? '';
        return { dataBase64: base64, mimeType: 'image/png' };
      }

      // Last resort: use whatever the extension exposes (if exists)
      if (activeViewport?.canvas) {
        const dataUrl = activeViewport.canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] ?? '';
        return { dataBase64: base64, mimeType: 'image/png' };
      }

      throw new Error('No active viewport canvas found');
    } catch (e) {
      console.error('Failed to capture active viewport as PNG', e);
      throw e;
    }
  };

  return (
    <div
      className="p-2"
      style={{
        border: '2px solid green',
        backgroundColor: '#e8f5e8',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <DummyComponent getSelectedImageData={getSelectedImageData} />
      </div>
    </div>
  );
}

export default DummyPanel;
