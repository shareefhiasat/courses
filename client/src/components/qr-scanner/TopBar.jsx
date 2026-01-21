import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const LayoutDashboardIcon = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9"/>
    <rect x="14" y="3" width="7" height="5"/>
    <rect x="14" y="12" width="7" height="9"/>
    <rect x="3" y="16" width="7" height="5"/>
  </svg>
);

const ChevronDownIcon = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function TopBar({
  currentSubject = 'Computer Science',
  currentClass = 'Advanced Web Design',
  currentSection = 'Section A - Morning',
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header style={{
      height: '5rem',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: 600 }}>
          <LayoutDashboardIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
          <span>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '2rem' }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" style={{ gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>🎓</span>
                </div>
                <span style={{ fontSize: '0.875rem' }}>{currentSubject}</span>
                <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Computer Science</DropdownMenuItem>
              <DropdownMenuItem>Mathematics</DropdownMenuItem>
              <DropdownMenuItem>Physics</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" style={{ gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>📚</span>
                </div>
                <span style={{ fontSize: '0.875rem' }}>{currentClass}</span>
                <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Advanced Web Design</DropdownMenuItem>
              <DropdownMenuItem>Data Structures</DropdownMenuItem>
              <DropdownMenuItem>Algorithms</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" style={{ gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem' }}>👥</span>
                </div>
                <span style={{ fontSize: '0.875rem' }}>{currentSection}</span>
                <ChevronDownIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Section A - Morning</DropdownMenuItem>
              <DropdownMenuItem>Section B - Afternoon</DropdownMenuItem>
              <DropdownMenuItem>Section C - Evening</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: '#f3f4f6',
          borderRadius: '0.5rem'
        }}>
          <div style={{
            width: '0.5rem',
            height: '0.5rem',
            background: '#10b981',
            borderRadius: '9999px'
          }} />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {formattedTime}
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'white',
            borderRadius: '0.25rem'
          }}>
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
