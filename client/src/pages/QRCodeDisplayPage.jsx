import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';

const QRCodeDisplayPage = () => {
  const { studentId } = useParams();
  
  // Read from route params
  const studentNumber = studentId;
  const studentName = null; // No name provided in route params

  useEffect(() => {
    const generateAndDisplayQR = async () => {
      if (!studentNumber) {
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">No student number provided</div>';
        return;
      }

      try {
        // Detect if dark mode is active
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                          window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Use theme-appropriate colors
        const qrColors = isDarkMode ? {
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

        // Theme-appropriate styling
        const themeStyles = isDarkMode ? {
          bodyBg: '#111827',
          cardBg: '#1f2937',
          cardBorder: '#374151',
          textColor: '#f9fafb',
          subTextColor: '#d1d5db',
          refColor: '#60a5fa'
        } : {
          bodyBg: '#f3f4f6',
          cardBg: '#ffffff',
          cardBorder: '#800000',
          textColor: '#111827',
          subTextColor: '#6b7280',
          refColor: '#059669'
        };

        // Write themed HTML to document
        document.body.innerHTML = `
          <html>
            <head>
              <title>QR Code - ${studentName || 'Student'}</title>
              <style>
                body { 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100vh; 
                  margin: 0; 
                  font-family: sans-serif; 
                  background: ${themeStyles.bodyBg}; 
                  color: ${themeStyles.textColor};
                }
                .card { 
                  background: ${themeStyles.cardBg}; 
                  padding: 2rem; 
                  border-radius: 1rem; 
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
                  text-align: center; 
                  border: 4px solid ${themeStyles.cardBorder};
                }
                img { 
                  width: 300px; 
                  height: 300px; 
                  margin-bottom: 1rem; 
                  border-radius: 8px;
                  background: ${qrColors.light};
                  padding: 8px;
                }
                h1 { 
                  margin: 0; 
                  color: ${themeStyles.textColor}; 
                  font-size: 1.5rem; 
                }
                p { 
                  margin: 0.5rem 0 0; 
                  color: ${themeStyles.subTextColor}; 
                  font-size: 1rem; 
                }
                .ref { 
                  font-family: monospace; 
                  font-weight: bold; 
                  color: ${themeStyles.refColor}; 
                  margin-top: 0.5rem; 
                  font-size: 1.2rem;
                }
                @media print {
                  body { background: white; color: black; }
                  .card { 
                    background: white; 
                    box-shadow: none; 
                    border: 2px solid #800000;
                    color: black;
                  }
                  .ref { color: #059669; }
                  img { background: white; }
                }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${qrDataUrl}" alt="QR Code" />
                <h1>${studentName || 'Student'}</h1>
                <p>Student Number: <span class="ref">${studentNumber}</span></p>
              </div>
            </body>
          </html>
        `;
      } catch (error) {
        console.error('Error generating QR code:', error);
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: red;">Failed to generate QR code</div>';
      }
    };

    generateAndDisplayQR();
  }, [studentNumber]);

  // No JSX - we write directly to document
  return null;
};

export default QRCodeDisplayPage;
