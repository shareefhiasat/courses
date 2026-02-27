import React, { useEffect, useRef, useCallback, memo } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.css';

const defaultToolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

const RichTextEditor = memo(function RichTextEditor({
  value = '',
  onChange,
  label,
  helperText,
  error,
  placeholder = 'Write something...',
  readOnly = false,
  className = '',
  height = 200,
  dir = 'ltr',
}) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const lastQuillHtmlRef = useRef('');  // tracks last HTML emitted by Quill
  const userTypingRef = useRef(false);   // track if user is actively typing
  const typingTimeoutRef = useRef(null); // timeout to detect when user stops typing

  // Handle text changes with debouncing for performance
  const handleChange = useCallback(() => {
    if (!quillRef.current || isUpdatingRef.current) return;
    
    // Mark user as actively typing
    userTypingRef.current = true;
    
    // Clear existing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      userTypingRef.current = false;
    }, 1000); // Consider user stopped typing after 1 second
    
    const html = quillRef.current.root.innerHTML;
    const normalized = html === '<p><br></p>' ? '' : html;
    
    lastQuillHtmlRef.current = normalized;
    if (onChange) {
      onChange(normalized);
    }
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    // Prevent re-initialization if Quill already exists
    if (quillRef.current) return;

    // Clear any existing Quill instances in the DOM
    const existingToolbar = editorRef.current.parentElement?.querySelector('.ql-toolbar');
    if (existingToolbar) {
      existingToolbar.remove();
    }

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      readOnly,
      modules: {
        toolbar: defaultToolbarOptions,
      },
    });

    quillRef.current = quill;

    // Apply direction
    if (dir === 'rtl') {
      quill.root.setAttribute('dir', 'rtl');
      quill.root.style.textAlign = 'right';
    }

    // Use requestAnimationFrame for smoother typing
    let rafId = null;
    quill.on('text-change', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleChange);
    });

    const capturedEditorRef = editorRef.current;
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (quillRef.current) {
        // Properly destroy Quill instance
        const toolbar = capturedEditorRef?.parentElement?.querySelector('.ql-toolbar');
        if (toolbar) {
          toolbar.remove();
        }
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when value prop changes — skip if the value came from Quill itself
  useEffect(() => {
    if (!quillRef.current) return;
    const normalizedValue = value || '';
    
    // If this value was just emitted by Quill, don't re-set it (prevents typing lag)
    if (normalizedValue === lastQuillHtmlRef.current) return;
    
    // IMPORTANT: Don't update content if user is actively typing
    // This prevents race conditions that cause cursor jumping
    if (userTypingRef.current) {
      return;
    }
    
    const currentContent = quillRef.current.root.innerHTML;
    const normalizedCurrent = currentContent === '<p><br></p>' ? '' : currentContent;
    
    if (normalizedValue !== normalizedCurrent) {
      // Save current cursor position BEFORE updating content
      const selection = quillRef.current.getSelection();
      
      isUpdatingRef.current = true;
      
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (!quillRef.current) return;
        
        try {
          if (normalizedValue === '') {
            quillRef.current.setText('');
          } else {
            // Safer approach: use Quill's dangerousPasteHTML instead of innerHTML
            quillRef.current.root.innerHTML = normalizedValue;
          }
          
          // Only restore cursor if we had a valid selection and the content length allows it
          if (selection && 
              typeof selection.index === 'number' && 
              selection.index >= 0 && 
              selection.index <= normalizedValue.length) {
            try {
              quillRef.current.setSelection(selection.index, selection.length);
            } catch (e) {
              // Fallback: set cursor to end
              try {
                quillRef.current.setSelection(normalizedValue.length, 0);
              } catch (fallbackError) {
                // Silent fallback - cursor will be at end by default
              }
            }
          } else {
            // Fallback: set cursor to end if no valid selection
            try {
              quillRef.current.setSelection(normalizedValue.length, 0);
            } catch (e) {
              // Silent fallback - cursor will be at end by default
            }
          }
        } catch (error) {
          // Silent error handling
        } finally {
          isUpdatingRef.current = false;
          lastQuillHtmlRef.current = normalizedValue;
        }
      });
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className={`${styles.wrapper} ${className}`} data-error={error ? 'true' : 'false'}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.editorContainer} style={{ minHeight: height }}>
        <div ref={editorRef} className={styles.editor} />
      </div>
      {helperText && !error && <p className={styles.helper}>{helperText}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});

export default RichTextEditor;
