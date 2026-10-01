import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

export function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetCapture();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setLoadingCamera(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Primary camera mode failed, attempting generic camera constraints:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        setCameraError('Unable to access device camera. Please grant camera permissions in your browser or upload an image file.');
      }
    } finally {
      setLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const resetCapture = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="camera-backdrop">
      <div className="camera-card">
        
        {/* Header */}
        <div className="camera-header">
          <div className="camera-header-title">
            <Camera size={18} color="#2563eb" />
            <span>Scan Document with Camera</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Video or Captured Preview */}
        <div className="camera-video-area">
          {cameraError ? (
            <div style={{ padding: '24px', textAlign: 'center', maxWidth: '320px', color: '#ffffff' }}>
              <AlertCircle size={36} color="#f43f5e" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>{cameraError}</p>
              <button onClick={startCamera} className="btn-camera" style={{ fontSize: '12px', padding: '8px 16px' }}>
                Retry Permission
              </button>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Captured scan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="camera-guide-box">
                <span className="camera-guide-text">Align document within border</span>
                <span className="camera-guide-text" style={{ alignSelf: 'flex-end' }}>Hold still & ensure good light</span>
              </div>
            </>
          )}

          {loadingCamera && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '13px', gap: '8px' }}>
              <RefreshCw size={18} className="animate-spin" />
              <span>Connecting camera...</span>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="camera-footer">
          {!previewUrl ? (
            <>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="btn-camera"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                <FlipHorizontal size={14} />
                <span>Flip</span>
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={loadingCamera || !!cameraError}
                className="btn-browse"
                style={{ fontSize: '13px', padding: '10px 22px' }}
              >
                <Camera size={16} />
                <span>Capture Snapshot</span>
              </button>

              <div style={{ width: '60px' }} />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resetCapture}
                className="btn-camera"
                style={{ fontSize: '13px', padding: '10px 18px' }}
              >
                <RefreshCw size={14} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={confirmPhoto}
                className="btn-browse"
                style={{ background: '#16a34a', fontSize: '13px', padding: '10px 22px' }}
              >
                <Check size={16} />
                <span>Confirm Photo</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
