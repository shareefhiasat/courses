import React, { useState, useEffect, useRef } from 'react';
import { useHelp } from '../contexts/HelpContext';
import { useLang } from '../contexts/LangContext';
import { X, Search, ChevronDown, ChevronUp, ChevronsUpDown, ChevronsUp } from 'lucide-react';

const HelpDrawer = () => {
  const { isOpen, currentHelp, closeHelp } = useHelp();
  const { t } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [filteredContent, setFilteredContent] = useState([]);
  const drawerRef = React.useRef(null);
  
  // Using currentHelp from useHook context

  // Reset state when help content changes or when drawer is opened
  useEffect(() => {
    console.log('HelpDrawer - currentHelp changed or drawer opened:', {
      isOpen,
      title: currentHelp?.title,
      contentLength: currentHelp?.content?.length,
      timestamp: currentHelp?._timestamp
    });
    
    if (currentHelp && isOpen) {
      console.log('Resetting HelpDrawer state for new help content');
      setSearchTerm('');
      setExpandedSections({});
      
      // Always update the filtered content when the drawer is opened or help content changes
      const newContent = Array.isArray(currentHelp.content) ? currentHelp.content : [];
      console.log('Setting new filtered content with', newContent.length, 'sections');
      setFilteredContent(newContent);
    }
  }, [currentHelp, isOpen, currentHelp?._timestamp]);
  
  // Handle search filtering and content updates
  useEffect(() => {
    console.log('HelpDrawer - Search effect running', {
      isOpen,
      hasHelpContent: !!currentHelp?.content,
      searchTerm,
      helpContentTitle: currentHelp?.title
    });
    
    if (!isOpen) {
      console.log('HelpDrawer - Drawer is closed, skipping filter');
      return;
    }
    
    if (!currentHelp?.content) {
      console.log('HelpDrawer - No help content available');
      setFilteredContent([]);
      return;
    }
    
    // If there's no search term, use the current help content directly
    if (!searchTerm.trim()) {
      console.log('HelpDrawer - No search term, using full help content');
      setFilteredContent(Array.isArray(currentHelp.content) ? currentHelp.content : []);
      return;
    }
    
    // Only filter if we have a search term and content
    const filterContent = () => {
      console.log('Filtering content with searchTerm:', searchTerm);
      const filtered = currentHelp.content.map(section => {
        if (!section.items || !Array.isArray(section.items)) return null;
        
        const filteredItems = section.items.filter(item => 
          (item.text && item.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        return filteredItems.length > 0 ? { ...section, items: filteredItems } : null;
      }).filter(Boolean); // Remove null/undefined sections
      
      console.log('Filtered content result:', {
        originalSections: currentHelp.content.length,
        filteredSections: filtered.length,
        hasSearchTerm: !!searchTerm
      });
      
      setFilteredContent(filtered);
    };
    
    filterContent();
  }, [searchTerm, currentHelp, isOpen]);
  
  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        const trigger = event.target.closest('.nav-icon-btn');
        if (!trigger) {
          closeHelp();
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeHelp]);
  
  // Early return if not open - AFTER all hooks
  if (!isOpen) return null;

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Expand all sections
  const expandAllSections = () => {
    const allExpanded = {};
    filteredContent.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedSections(allExpanded);
  };
  
  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSections({});
  };
  
  // Helper to safely render content
  const renderContent = () => {
    try {
      if (!filteredContent || filteredContent.length === 0) {
        return (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary, #666)'
          }}>
            {t('no_results_found', 'No matching results found')}
          </div>
        );
      }
      
      return filteredContent.map((section, sectionIndex) => {
        const isExpanded = expandedSections[sectionIndex] === true; // Default to collapsed
        const hasItems = section.items && section.items.length > 0;
        
        return (
          <div 
            key={sectionIndex} 
            style={{ 
              marginBottom: '1rem',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--border-color, #e0e0e0)'
            }}
          >
            <div 
              onClick={() => toggleSection(sectionIndex)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--panel-bg, #f5f5f5a3)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: isExpanded ? '1px solid var(--border-color, #e0e0e0)' : 'none',
                userSelect: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, #eee)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-bg, #f5f5f5a3)'}
            >
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                padding: '0.5rem 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary, #333)'
              }}>
                {section.title || t('untitled_section', 'Untitled Section')}
                <span style={{ 
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary, #666)',
                  marginLeft: '0.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </span>
              </h3>
            </div>

            {isExpanded && hasItems && (
              <div style={{ 
                backgroundColor: 'var(--bg-color, #fff)',
                padding: '0.5rem 0'
              }}>
                <ul style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }}>
                  {section.items.map((item, itemIndex) => (
                    <li 
                      key={itemIndex}
                      style={{
                        padding: '0.5rem 1.5rem',
                        borderBottom: '1px solid var(--border-color, #f0f0f0)'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 500,
                        marginBottom: item.description ? '0.25rem' : 0,
                        color: 'var(--text-color, #333)'
                      }}>
                        {item.text}
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary, #666)',
                          lineHeight: 1.5
                        }}>
                          {item.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      });
    } catch (error) {
      console.error('[HelpDrawer] Error rendering help content:', error);
      return (
        <div style={{ 
          padding: '1rem',
          backgroundColor: 'var(--danger-bg, #fff5f5)',
          color: 'var(--danger-text, #dc3545)',
          borderRadius: '4px',
          margin: '1rem 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {t('error_loading_content', 'Error loading help content. Please try again later.')}
              {currentHelp?.title && (
                <h2 style={{ 
                  margin: '0.5rem 0 0 0', 
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--primary-color, #D4AF37)'
                }}>
                  {currentHelp.title}
                </h2>
              )}
            </div>
            <button
              onClick={closeHelp}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-color, #666)',
                padding: '0.25rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f5f5f5a3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label={t('close_help', 'Close help')}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      ref={drawerRef}
      style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? '0' : '-450px',
        width: '450px',
        height: '100vh',
        backgroundColor: 'var(--bg-color, #fff)',
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        transition: 'right 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #e0e0e0)',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--bg-color, #fff)',
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            {currentHelp?.title && (
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--primary-color, #D4AF37)'
              }}>
                {currentHelp.title}
              </h2>
            )}
            <button
              onClick={closeHelp}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-color, #666)',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f5f5f5a3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label={t('close_help', 'Close help')}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder={t('search_help', 'Search help...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #ddd)',
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--input-bg, #fff)',
                    color: 'var(--text-color, #333)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color, #D4AF37)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #ddd)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#374151'
                }} />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary, #999)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f0f0f0)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label={t('clear_search', 'Clear search')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary, #666)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={expandAllSections}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color, #ddd)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #666)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.backgroundColor = 'var(--hover-bg, #f5f5f5a3)';
                  e.currentTarget.borderColor = 'var(--border-hover, #ccc)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.backgroundColor = 'transparent';
                  e.currentTarget.borderColor = 'var(--border-color, #ddd)';
                }}
              >
                <ChevronsUp size={14} />
                <span>{t('expand_all', 'Expand All')}</span>
              </button>
              <button
                onClick={collapseAllSections}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color, #ddd)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #666)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.backgroundColor = 'var(--hover-bg, #f5f5f5a3)';
                  e.currentTarget.borderColor = 'var(--border-hover, #ccc)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.backgroundColor = 'transparent';
                  e.currentTarget.borderColor = 'var(--border-color, #ddd)';
                }}
              >
                <ChevronsUpDown size={14} />
                <span>{t('collapse_all', 'Collapse All')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          padding: '1.25rem 1.5rem',
          overflowY: 'auto'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HelpDrawer;
