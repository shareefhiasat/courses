import React, { useState, useRef, useEffect } from 'react';
import { Minus, Maximize2, Pin, PinOff } from 'lucide-react';
import './DraggableClock.css';

const DraggableClock = ({ 
  initialPosition = { x: 100, y: 100 },
  showSeconds = true,
  onTimeUpdate = null,
  className = '',
  defaultPinned = undefined // undefined to check localStorage first
}) => {
  // Check localStorage for preferences, default to true for new users
  const getStoredPreferences = () => {
    try {
      const stored = localStorage.getItem('draggableClock_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return {
          pinned: prefs.pinned !== undefined ? prefs.pinned : true,
          minimized: prefs.minimized !== undefined ? prefs.minimized : false
        };
      }
      return { pinned: true, minimized: false }; // Default to pinned for new users
    } catch {
      return { pinned: true, minimized: false };
    }
  };

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMinimized, setIsMinimized] = useState(defaultPinned !== undefined ? defaultPinned : getStoredPreferences().minimized);
  const [isPinned, setIsPinned] = useState(defaultPinned !== undefined ? defaultPinned : getStoredPreferences().pinned);
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Store preferences in localStorage
  useEffect(() => {
    try {
      const preferences = {
        pinned: isPinned,
        minimized: isMinimized
      };
      localStorage.setItem('draggableClock_preferences', JSON.stringify(preferences));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isPinned, isMinimized]);

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
    if (isPinned) return; // Don't allow dragging when pinned
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
      className={`draggable-clock ${isMinimized ? 'minimized' : ''} ${isPinned ? 'pinned' : ''} ${className}`}
      style={{
        position: isPinned ? 'static' : 'fixed',
        left: isPinned ? 'auto' : `${position.x}px`,
        top: isPinned ? 'auto' : `${position.y}px`,
        cursor: isPinned ? 'default' : (isDragging ? 'grabbing' : 'grab')
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="clock-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="clock-time">{formatTime(currentTime)}</span>
        </div>
        <div className="clock-controls">
          <button
            className="control-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned(!isPinned);
            }}
            title={isPinned ? 'Unpin from navbar' : 'Pin to navbar'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            className="control-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="clock-content">
          <div className="clock-date">{formatDate(currentTime)}</div>
        </div>
      )}
    </div>
  );
};

export default DraggableClock;
