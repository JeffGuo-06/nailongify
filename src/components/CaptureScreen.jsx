import { useRef, useEffect, useState } from 'react';

function CaptureScreen({ captureData, onBack }) {
  const canvasRef = useRef(null);
  const [shareableImage, setShareableImage] = useState(null);

  useEffect(() => {
    if (!captureData) return;

    const createShareableGraphic = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');

      // Set canvas size (side by side layout)
      const targetWidth = 300;
      const targetHeight = 300;
      const padding = 40;
      const gap = 20;

      canvas.width = targetWidth * 2 + gap + padding * 2;
      canvas.height = targetHeight + padding * 2 + 100; // Extra space for text

      // Fill background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load user image
      const userImg = new Image();
      userImg.src = captureData.userImage;

      await new Promise((resolve) => {
        userImg.onload = resolve;
      });

      // Load meme image
      const memeImg = new Image();
      memeImg.src = captureData.match.meme.path;

      await new Promise((resolve) => {
        memeImg.onload = resolve;
      });

      // Draw user image (left side)
      const userAspect = userImg.width / userImg.height;
      let userDrawWidth = targetWidth;
      let userDrawHeight = targetWidth / userAspect;

      if (userDrawHeight > targetHeight) {
        userDrawHeight = targetHeight;
        userDrawWidth = targetHeight * userAspect;
      }

      const userX = padding + (targetWidth - userDrawWidth) / 2;
      const userY = padding + 60;

      ctx.drawImage(userImg, userX, userY, userDrawWidth, userDrawHeight);

      // Draw meme image (right side)
      const memeAspect = memeImg.width / memeImg.height;
      let memeDrawWidth = targetWidth;
      let memeDrawHeight = targetWidth / memeAspect;

      if (memeDrawHeight > targetHeight) {
        memeDrawHeight = targetHeight;
        memeDrawWidth = targetHeight * memeAspect;
      }

      const memeX = padding + targetWidth + gap + (targetWidth - memeDrawWidth) / 2;
      const memeY = padding + 60;

      ctx.drawImage(memeImg, memeX, memeY, memeDrawWidth, memeDrawHeight);

      // Draw title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nailongify Match!', canvas.width / 2, 40);

      // Draw labels
      ctx.font = '16px sans-serif';
      ctx.fillText('You', padding + targetWidth / 2, userY + userDrawHeight + 30);
      ctx.fillText(
        captureData.match.meme.name,
        padding + targetWidth + gap + targetWidth / 2,
        memeY + memeDrawHeight + 30
      );

      // Draw match percentage
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(
        `${captureData.match.confidence}% Match`,
        canvas.width / 2,
        canvas.height - 30
      );

      // Convert to image
      const dataUrl = canvas.toDataURL('image/png');
      setShareableImage(dataUrl);
    };

    createShareableGraphic();
  }, [captureData]);

  const handleDownload = () => {
    if (!shareableImage) return;

    const link = document.createElement('a');
    link.download = `nailongify-${Date.now()}.png`;
    link.href = shareableImage;
    link.click();
  };

  if (!captureData) {
    return null;
  }

  return (
    <div className="capture-screen">
      <div className="capture-container">
        <h2>Your Nailong Match!</h2>

        <div className="shareable-graphic">
          <canvas ref={canvasRef} />
        </div>

        <div className="capture-actions">
          <button onClick={handleDownload} className="btn-primary">
            Download Image
          </button>
          <button onClick={onBack} className="btn-secondary">
            Take Another
          </button>
        </div>

        <p className="capture-details">
          Matched with <strong>{captureData.match.meme.name}</strong> at{' '}
          <strong>{captureData.match.confidence}% confidence</strong>
        </p>
      </div>
    </div>
  );
}

export default CaptureScreen;
