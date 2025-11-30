import React, { useEffect, useRef } from 'react';
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

function RichTextEditor({
  value = '',
  onChange,
  label,
  helperText,
  error,
  placeholder = 'Write something...',
  readOnly = false,
  className = '',
  height = 200,
}) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);

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

    // Handle text changes
    quill.on('text-change', () => {
      if (isUpdatingRef.current) return;
      const html = quill.root.innerHTML;
      if (onChange) {
        onChange(html === '<p><br></p>' ? '' : html);
      }
    });

    return () => {
      if (quillRef.current) {
        // Properly destroy Quill instance
        const toolbar = editorRef.current?.parentElement?.querySelector('.ql-toolbar');
        if (toolbar) {
          toolbar.remove();
        }
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (!quillRef.current) return;
    
    const currentContent = quillRef.current.root.innerHTML;
    const normalizedValue = value || '';
    const normalizedCurrent = currentContent === '<p><br></p>' ? '' : currentContent;

    if (normalizedValue !== normalizedCurrent) {
      isUpdatingRef.current = true;
      if (normalizedValue === '') {
        quillRef.current.setText('');
      } else {
        quillRef.current.root.innerHTML = normalizedValue;
      }
      isUpdatingRef.current = false;
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
}

export default RichTextEditor;
