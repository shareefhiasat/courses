import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './ExpandablePanel.module.css';

// Controlled: pass isOpen/onToggle; Uncontrolled: omit both
export default function ExpandablePanel({
  title,
  icon,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  duration = 200,
  headerRight,
  className = '',
  titleClassName = '',
  accentColor,
  sideDrawer = false,
  width = '28rem'
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;
  const panelRef = useRef(null);
  const [height, setHeight] = useState(open ? 'auto' : 0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setHeight(h);
      const id = setTimeout(() => setHeight('auto'), duration);
      return () => clearTimeout(id);
    } else {
      const h = el.scrollHeight;
      // set to current height first to enable transition back to 0
      setHeight(h);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open, children, duration]);

  const toggle = () => (isControlled ? onToggle?.(!open) : setInternalOpen(v => !v));

  return (
    <div 
      className={`${styles.panel} ${className} ${sideDrawer ? styles.sideDrawer : ''}`}
      style={sideDrawer ? {
        position: 'fixed',
        top: 0,
        right: open ? 0 : `-${width}`,
        width: width,
        height: '100%',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 2000,
        transition: `right ${duration}ms ease`,
        borderRadius: 0
      } : {}}
    >
      <button className={styles.header} onClick={toggle} aria-expanded={open}>
        <div className={styles.titleWrap}>
          {icon ? <span className={styles.icon} style={accentColor ? { color: accentColor } : undefined}>{icon}</span> : null}
          <span className={`${styles.title} ${titleClassName}`} style={accentColor ? { color: accentColor } : undefined}>{title}</span>
        </div>
        <div className={styles.headerRight}>
          {headerRight}
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      <div
        className={styles.contentOuter}
        style={{ 
          height: sideDrawer ? 'calc(100% - 60px)' : height, 
          transitionDuration: `${duration}ms`,
          overflow: sideDrawer ? 'auto' : 'hidden'
        }}
        aria-hidden={!open}
      >
        <div ref={panelRef} className={styles.contentInner} style={sideDrawer ? { padding: '1.5rem' } : {}}>
          {children}
        </div>
      </div>
    </div>
  );
}
