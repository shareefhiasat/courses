import React from 'react';
import { generateStudentQRCode } from '@utils/qrCode';
import { getFunctions } from '@firebaseServices/config';
import logger from '@utils/logger';

// Component for displaying QR code in new tab
export const QRCodeDisplay = ({ student }) => {
  const openQRCodeInNewTab = async (student) => {
    try {
      const studentNumber = student.studentNumber;
      if (!studentNumber) {
        logger.error('Student number is required to generate QR code');
        alert('Student number is required to generate QR code');
        return;
      }
      
      const qrDataUrl = await generateStudentQRCode(studentNumber, {width: 512, margin: 4});

      const newTab = window.open();
      newTab.document.write(`
        <html>
          <head>
            <title>QR Code - ${student.displayName || student.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #f3f4f6; }
              .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; }
              img { width: 300px; height: 300px; margin-bottom: 1rem; }
              h1 { margin: 0; color: #111827; font-size: 1.5rem; }
              p { margin: 0.5rem 0 0; color: #6b7280; font-size: 1rem; }
              .ref { font-family: monospace; font-weight: bold; color: #059669; margin-top: 0.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <img src="${qrDataUrl}" alt="QR Code" />
              <h1>${student.displayName || student.name}</h1>
              <p>${student.email || 'No email'}</p>
              <div class="ref">${studentNumber}</div>
            </div>
          </body>
        </html>
      `);
      newTab.document.close();
    } catch (error) {
      logger.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  return { openQRCodeInNewTab };
};

// Hook for QR code email functionality
export const useQRCodeEmail = () => {
  const sendQRCodeEmail = async (student, setSendingEmails) => {
    setSendingEmails(
        prev => ({...prev, [student.id]: {...prev[student.id], qrCode: true}}));
    try {
      // Call the backend function to send QR code email
      const functions = getFunctions();
      const sendQRCodeEmail = functions.httpsCallable('sendQRCodeEmail');

      const result = await sendQRCodeEmail({
        studentId: student.id,
        studentEmail: student.email
      });

      if (result.data?.success) {
        logger.debug('QR code email sent successfully');
        alert('QR Code email sent successfully!');
      } else {
        logger.error('Failed to send QR code email:', result.data?.message);
        alert('Failed to send QR Code email');
      }
    } catch (error) {
      logger.error('Error sending QR code email:', error);
      alert('Failed to send QR Code email');
    } finally {
      setSendingEmails(prev => ({
        ...prev,
        [student.id]: {...prev[student.id], qrCode: false}
      }));
    }
  };

  return { sendQRCodeEmail };
};
