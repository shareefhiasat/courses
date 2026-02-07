import React, { useState, useRef, useEffect } from 'react';
import { Minus, Maximize2, Pin, PinOff } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { formatLocalizedDateTime } from '@utils/date';
import './DraggableClock.css';

const DraggableClock = ({ 
  initialPosition = { x: 100, y: 100 },
  showSeconds = true,
  onTimeUpdate = null,
  className = '',
  defaultPinned = undefined // undefined to check localStorage first
}) => {
  // Check localStorage for pinned preference, default to true for new users
  const getStoredPinnedPreference = () => {
    try {
      const stored = localStorage.getItem('draggableClock_pinned');
      return stored !== null ? JSON.parse(stored) : true; // Default to pinned for new users
    } catch {
      return true;
    }
  };

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(defaultPinned !== undefined ? defaultPinned : getStoredPinnedPreference());
  const { t, lang } = useLang();
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Store pinned preference in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('draggableClock_pinned', JSON.stringify(isPinned));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [isPinned]);

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
    const localized = formatLocalizedDateTime(date, t, lang);
    
    // Extract time part and localize AM/PM
    let timeStr = localized.time;
    if (lang === 'ar') {
      timeStr = timeStr.replace('AM', t('am') || 'ص');
      timeStr = timeStr.replace('PM', t('pm') || 'م');
    }
    
    if (!showSeconds) {
      // Remove seconds if not needed
      timeStr = timeStr.replace(/:\d{2}\s/, ' ');
    }
    
    return timeStr;
  };

  const formatDate = (date) => {
    const localized = formatLocalizedDateTime(date, t, lang);
    return localized.date;
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
