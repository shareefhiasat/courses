/**
 * Digital Scratch Pad Component (Phase 4.1)
 * Canvas-based notepad for working out problems
 */

import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Download, Pen, Eraser } from 'lucide-react';
import { Button } from '../ui';
import styles from './ScratchPad.module.css';

const ScratchPad = ({ onClose, quizId, questionId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Load saved drawing if exists
    const savedDrawing = localStorage.getItem(`scratch_${quizId}_${questionId}`);
    if (savedDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedDrawing;
    }

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }, [quizId, questionId]);

  const startDrawing = (e) => {
    if (!context) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = lineWidth * 3;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (context) {
      context.closePath();
    }

    // Auto-save drawing
    saveDrawing();
  };

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    localStorage.setItem(`scratch_${quizId}_${questionId}`, dataUrl);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    localStorage.removeItem(`scratch_${quizId}_${questionId}`);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `scratch-pad-q${questionId}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={styles.scratchPad}>
      <div className={styles.header}>
        <h3>Scratch Pad</h3>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tools}>
          <button
            onClick={() => setTool('pen')}
            className={`${styles.toolBtn} ${tool === 'pen' ? styles.active : ''}`}
            title="Pen"
          >
            <Pen size={18} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`${styles.toolBtn} ${tool === 'eraser' ? styles.active : ''}`}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
        </div>

        <div className={styles.colorPicker}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorInput}
          />
        </div>

        <div className={styles.sizeControl}>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.sizeLabel}>{lineWidth}px</span>
        </div>

        <div className={styles.actions}>
          <button onClick={clearCanvas} className={styles.actionBtn} title="Clear">
            <Trash2 size={18} />
          </button>
          <button onClick={downloadImage} className={styles.actionBtn} title="Download">
            <Download size={18} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default ScratchPad;
