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
        // Generate simple QR code
        const qrDataUrl = await QRCode.toDataURL(studentNumber, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Write simple HTML to document
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
                  background: #f3f4f6; 
                }
                .card { 
                  background: white; 
                  padding: 2rem; 
                  border-radius: 1rem; 
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
                  text-align: center; 
                  border: 4px solid #800000;
                }
                img { 
                  width: 300px; 
                  height: 300px; 
                  margin-bottom: 1rem; 
                  border-radius: 8px;
                }
                h1 { 
                  margin: 0; 
                  color: #111827; 
                  font-size: 1.5rem; 
                }
                p { 
                  margin: 0.5rem 0 0; 
                  color: #6b7280; 
                  font-size: 1rem; 
                }
                .ref { 
                  font-family: monospace; 
                  font-weight: bold; 
                  color: #059669; 
                  margin-top: 0.5rem; 
                  font-size: 1.2rem;
                }
                @media print {
                  body { background: white; }
                  .card { box-shadow: none; border: 2px solid #800000; }
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
