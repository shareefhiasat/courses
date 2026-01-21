import React from 'react';

const LayoutDashboardIcon = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9"/>
    <rect x="14" y="3" width="7" height="5"/>
    <rect x="14" y="12" width="7" height="9"/>
    <rect x="3" y="16" width="7" height="5"/>
  </svg>
);

export default function Sidebar() {
  return (
    <aside style={{
      width: '5rem',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem 0'
    }}>
      <div style={{
        width: '3rem',
        height: '3rem',
        background: '#8b5cf6',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <LayoutDashboardIcon style={{
          width: '1.5rem',
          height: '1.5rem',
          color: 'white'
        }} />
      </div>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Additional nav items can be added here */}
      </nav>
    </aside>
  );
}
