import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { Button, Card, CardBody, Loading } from '../components/ui';

const MigrationPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runMigration = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('🚀 Starting reference ID migration...');

      // Get all students
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);

      const students = [];
      querySnapshot.forEach((doc) => {
        students.push({
          uid: doc.id,
          docRef: doc.ref,
          ...doc.data()
        });
      });

      console.log(`📊 Found ${students.length} students`);

      let processed = 0;
      let skipped = 0;
      let errors = [];

      // Process in batches
      const batchSize = 100;

      for (let i = 0; i < students.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchStudents = students.slice(i, i + batchSize);

        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(students.length / batchSize)}`);

        for (const student of batchStudents) {
          try {
            // Check if already has valid reference ID
            if (student.referenceId && student.referenceId.startsWith('STU-')) {
              console.log(`⏭️  Skipping ${student.email || student.uid} - has ref: ${student.referenceId}`);
              skipped++;
              continue;
            }

            // Generate reference ID: STU-XXXXXX
            const generateReferenceId = (uid) => {
              const suffix = uid.slice(-6).toUpperCase();
              return `STU-${suffix}`;
            };

            const referenceId = generateReferenceId(student.uid);

            // Update student document
            batch.update(student.docRef, {
              referenceId: referenceId,
              qrGeneratedAt: new Date()
            });

            console.log(`✅ ${student.email || student.uid} -> ${referenceId}`);
            processed++;

          } catch (error) {
            console.error(`❌ Error with ${student.email || student.uid}:`, error);
            errors.push({
              student: student.email || student.uid,
              error: error.message
            });
          }
        }

        // Commit the batch
        await batch.commit();
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed`);
      }

      // Set results
      setResults({
        processed,
        skipped,
        errors,
        total: students.length
      });

      console.log('\n🎉 MIGRATION COMPLETE!');
      console.log(`✅ Processed: ${processed} students`);
      console.log(`⏭️  Skipped: ${skipped} students`);
      console.log(`❌ Errors: ${errors.length} students`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      setResults({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <CardBody>
          <h1 style={{ marginBottom: '1rem' }}>Reference ID Migration</h1>
          
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            This will add reference IDs (STU-XXXXXX format) to all students who don't have them.
            This is required for QR code scanning to work properly.
          </p>

          <Button
            onClick={runMigration}
            disabled={loading}
            variant="primary"
            size="lg"
          >
            {loading ? (
              <>
                <Loading size="sm" />
                Running Migration...
              </>
            ) : (
              'Run Reference ID Migration'
            )}
          </Button>

          {results && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              {results.error ? (
                <div style={{ color: '#dc2626' }}>
                  <h3>❌ Migration Failed</h3>
                  <p>{results.error}</p>
                </div>
              ) : (
                <div>
                  <h3>🎉 Migration Complete!</h3>
                  <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                    <div>📊 Total students: {results.total}</div>
                    <div>✅ Processed: {results.processed}</div>
                    <div>⏭️  Skipped: {results.skipped}</div>
                    <div>❌ Errors: {results.errors.length}</div>
                  </div>
                  
                  {results.errors.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4>Errors:</h4>
                      {results.errors.map((err, index) => (
                        <div key={index} style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                          {err.student}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
            <h4>📝 Instructions:</h4>
            <ol style={{ marginLeft: '1rem', fontSize: '0.875rem' }}>
              <li>Click "Run Reference ID Migration" button</li>
              <li>Wait for the migration to complete</li>
              <li>Check the results below</li>
              <li>After migration, QR codes should work properly</li>
              <li>You can delete this page after migration is complete</li>
            </ol>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default MigrationPage;
