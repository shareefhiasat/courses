import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Maximize2, Minimize2, Expand, Shrink } from 'lucide-react';
import './DraggableClock.css';

const DraggableClock = () => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [time, setTime] = useState(new Date());
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.clock-controls')) return;
    
    setIsDragging(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    initialPos.current = { ...position };
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  return (
    <div
      ref={dragRef}
      className="draggable-clock"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 9999
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="clock-header">
        <Clock size={16} />
        <span className="clock-title">Clock</span>
        <div className="clock-controls">
          <button
            onClick={(e) => {
              e.stopPropagation();
              dragRef.current.style.display = 'none';
            }}
            className="control-btn close-btn"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      
      <div className="clock-content">
        <div className="time-display">
          {formatTime(time)}
        </div>
        <div className="date-display">
          {time.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  );
};

export default DraggableClock;
