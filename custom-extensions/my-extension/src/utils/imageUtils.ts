// Utility functions for image identification and metadata extraction

export interface ImageMetadata {
  imageId: string;
  studyInstanceUid?: string;
  seriesInstanceUid?: string;
  sopInstanceUid?: string;
  patientId?: string;
  studyDate?: string;
  modality?: string;
}

/**
 * Generate a unique identifier for the current viewport image
 * This creates a hash based on the canvas data to identify the same image
 */
export function generateImageId(canvas: HTMLCanvasElement): string {
  // Create a simple hash from canvas dimensions and a sample of pixel data
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }

  const width = canvas.width;
  const height = canvas.height;

  // Sample pixels from corners and center to create a fingerprint
  const samplePoints = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width / 2), y: Math.floor(height / 2) }
  ];

  let hash = `${width}x${height}`;

  try {
    samplePoints.forEach(point => {
      const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
      hash += `-${pixel[0]}-${pixel[1]}-${pixel[2]}`;
    });
  } catch (error) {
    // If we can't read pixels (CORS issues), use timestamp as fallback
    hash += `-${Date.now()}`;
  }

  console.log('🔍 Generated image hash:', hash);
  return hash;
}

/**
 * Extract DICOM metadata from OHIF viewport
 * This tries to get metadata from various OHIF services
 */
export function extractImageMetadata(): Partial<ImageMetadata> {
  const metadata: Partial<ImageMetadata> = {};

  try {
    // Try to get metadata from OHIF services
    const servicesManager = (window as any)?.servicesManager;

    if (servicesManager?.services?.viewportGridService) {
      const state = servicesManager.services.viewportGridService.getState();
      const activeIndex = state?.activeViewportIndex ?? 0;
      const viewport = state?.viewports?.[activeIndex];

      if (viewport?.displaySet) {
        const displaySet = viewport.displaySet;
        const instance = displaySet?.instances?.[0];

        if (instance) {
          metadata.studyInstanceUid = instance.StudyInstanceUID;
          metadata.seriesInstanceUid = instance.SeriesInstanceUID;
          metadata.sopInstanceUid = instance.SOPInstanceUID;
          metadata.patientId = instance.PatientID;
          metadata.studyDate = instance.StudyDate;
          metadata.modality = instance.Modality;
        }
      }
    }

    // Fallback: try to get from cornerstone
    if (!metadata.studyInstanceUid) {
      const cornerstone = (window as any)?.cornerstone;
      if (cornerstone?.getEnabledElement) {
        const element = document.querySelector('.Viewport canvas')?.closest('.Viewport');
        if (element) {
          const enabledElement = cornerstone.getEnabledElement(element);
          if (enabledElement?.image) {
            const image = enabledElement.image;
            metadata.studyInstanceUid = image.data?.string?.('StudyInstanceUID');
            metadata.seriesInstanceUid = image.data?.string?.('SeriesInstanceUID');
            metadata.sopInstanceUid = image.data?.string?.('SOPInstanceUID');
            metadata.patientId = image.data?.string?.('PatientID');
            metadata.studyDate = image.data?.string?.('StudyDate');
            metadata.modality = image.data?.string?.('Modality');
          }
        }
      }
    }

  } catch (error) {
    console.warn('Failed to extract image metadata:', error);
  }

  return metadata;
}

/**
 * Create a complete image identifier with metadata
 */
export function createImageIdentifier(canvas: HTMLCanvasElement): ImageMetadata {
  const metadata = extractImageMetadata();

  // If we have DICOM metadata, use it for more stable identification
  if (metadata.sopInstanceUid) {
    const dicomId = `dicom-${metadata.sopInstanceUid}`;
    console.log('🔍 Using DICOM-based ID:', dicomId);
    return {
      imageId: dicomId,
      ...metadata
    };
  }

  // Fallback to canvas-based fingerprinting
  const baseId = generateImageId(canvas);
  console.log('🔍 Using canvas-based ID:', baseId);

  return {
    imageId: baseId,
    ...metadata
  };
}
