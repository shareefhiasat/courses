import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Share2 } from 'lucide-react';

export default function QRCodeGenerator({ url, title = 'QR Code', size = 256 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [url, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '-')}-qrcode.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div style={{ 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: 12, 
      border: '1px solid var(--border)',
      textAlign: 'center'
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1rem' }}>{title}</h3>
      
      <div style={{ 
        display: 'inline-block', 
        padding: '1rem', 
        background: '#f9fafb', 
        borderRadius: 12,
        marginBottom: '1rem'
      }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{ 
        padding: '0.75rem', 
        background: '#f3f4f6', 
        borderRadius: 8, 
        marginBottom: '1rem',
        fontSize: 12,
        fontFamily: 'monospace',
        wordBreak: 'break-all'
      }}>
        {url}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={handleCopyLink}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 14
          }}
        >
          <Copy size={16} />
          Copy Link
        </button>
        <button
          onClick={handleDownload}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 14
          }}
        >
          <Download size={16} />
          Download
        </button>
        <button
          onClick={handleShare}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 14
          }}
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}
