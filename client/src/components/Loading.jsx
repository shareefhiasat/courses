import React from 'react';
import './Loading.css';

const Loading = ({ message = 'Loading...', fullscreen = false, size = 48 }) => {
  return (
    <div className={fullscreen ? 'loading-container loading-fullscreen' : 'loading-container'}>
      <div
        className="loading-spinner"
        style={{ width: size, height: size }}
        role="status"
        aria-live="polite"
        aria-label={message}
      />
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;
