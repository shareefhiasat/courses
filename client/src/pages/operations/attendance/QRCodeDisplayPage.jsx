import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';const QRCodeDisplayPage = () => {
  const { studentId } = useParams();
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  
  // Get primary color from CSS variable
  const getPrimaryColor = () => {
    if (typeof window === 'undefined') return '#800020';
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#800020';
  };

  const primaryColor = getPrimaryColor();
  
  // Read from route params
  const studentNumber = studentId;
  const studentName = null; // No name provided in route params

  useEffect(() => {
    const generateAndDisplayQR = async () => {
      if (!studentNumber) {
        document.body.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">No student number provided</div>`;
        return;
      }

      try {
        // Use theme-appropriate colors
        const qrColors = isDark ? {
          dark: '#ffffff',  // White QR code for dark mode
          light: '#1f2937'  // Dark background for QR code
        } : {
          dark: '#000000',  // Black QR code for light mode
          light: '#ffffff'  // White background for QR code
        };

        // Generate QR code with theme colors
        const qrDataUrl = await QRCode.toDataURL(studentNumber, {
          width: 300,
          margin: 2,
          color: qrColors
        });

        // Theme-appropriate styling matching the second image
        const themeStyles = isDark ? {
          bodyBg: '#0f172a',
          cardBg: '#1e293b',
          cardBorder: primaryColor,
          textColor: '#f8fafc',
          subTextColor: '#cbd5e1',
          refColor: '#60a5fa'
        } : {
          bodyBg: '#f8fafc',
          cardBg: '#ffffff',
          cardBorder: primaryColor,
          textColor: '#1e293b',
          subTextColor: '#64748b',
          refColor: '#059669'
        };

        // Write themed HTML to document
        document.body.innerHTML = `
          <html>
            <head>
              <title>Student QR Code</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  background: ${themeStyles.bodyBg}; 
                  color: ${themeStyles.textColor};
                }
                .card { 
                  background: ${themeStyles.cardBg}; 
                  padding: 3rem 2rem; 
                  border-radius: 1.5rem; 
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); 
                  text-align: center; 
                  border: 4px solid ${themeStyles.cardBorder};
                  max-width: 400px;
                  margin: 2rem;
                }
                img { 
                  width: 280px; 
                  height: 280px; 
                  margin-bottom: 1.5rem; 
                  border-radius: 1rem;
                  background: ${qrColors.light};
                  padding: 12px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                h1 { 
                  margin: 0 0 0.5rem 0; 
                  color: ${themeStyles.textColor}; 
                  font-size: 1.75rem; 
                  font-weight: 700;
                }
                p { 
                  margin: 0; 
                  color: ${themeStyles.subTextColor}; 
                  font-size: 1rem; 
                  font-weight: 500;
                }
                .ref { 
                  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace; 
                  font-weight: 700; 
                  color: ${themeStyles.refColor}; 
                  margin-top: 0.5rem; 
                  font-size: 1.25rem;
                  display: inline-block;
                  padding: 0.25rem 0.75rem;
                  background: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(5, 150, 105, 0.1)'};
                  border-radius: 0.5rem;
                  border: 1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(5, 150, 105, 0.2)'};
                }
                @media print {
                  body { 
                    background: white !important; 
                    color: black !important;
                    margin: 0;
                    padding: 1rem;
                  }
                  .card { 
                    background: white !important; 
                    box-shadow: none !important; 
                    border: 3px solid ${primaryColor} !important;
                    color: black !important;
                    padding: 2rem !important;
                    margin: 0 !important;
                    max-width: none !important;
                  }
                  .ref { 
                    color: #059669 !important;
                    background: transparent !important;
                    border: none !important;
                  }
                  img { 
                    background: white !important;
                    box-shadow: none !important;
                  }
                  h1 { color: black !important; }
                  p { color: #666 !important; }
                }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${qrDataUrl}" alt="Student QR Code" />
                <h1>Student</h1>
                <p>Student Number</p>
                <div class="ref">${studentNumber}</div>
              </div>
            </body>
          </html>
        `;
      } catch (error) {
        console.error('Error generating QR code:', error);
        document.body.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: red;">Failed to generate QR code</div>`;
      }
    };

    generateAndDisplayQR();
  }, [studentNumber, isDark, primaryColor]);

  // No JSX - we write directly to document
  return null;
};

export default QRCodeDisplayPage;
