import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import './DraggableClock.css';

const DraggableClock = ({ 
  initialPosition = { x: 100, y: 100 },
  showSeconds = true,
  onTimeUpdate = null,
  className = ''
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (onTimeUpdate) {
        onTimeUpdate(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUpdate]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      ref={dragRef}
      className={`draggable-clock ${className}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="clock-header">
        <Clock size={16} />
        <span className="clock-time">{formatTime(currentTime)}</span>
      </div>
      <div className="clock-date">{formatDate(currentTime)}</div>
    </div>
  );
};

export default DraggableClock;
