require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleWorkflowData() {
  try {
    console.log('🎯 Creating sample workflow data...');

    // Get users for assignment
    const admin = await prisma.user.findFirst({ where: { email: 'shareef.hiasat@gmail.com' } });
    const hrManager = await prisma.user.findFirst({ where: { email: 'hr.manager@example.com' } });
    const instructor1 = await prisma.user.findFirst({ where: { email: 'instructor1@example.com' } });
    const instructor2 = await prisma.user.findFirst({ where: { email: 'instructor2@example.com' } });

    if (!admin || !hrManager || !instructor1 || !instructor2) {
      throw new Error('Required users not found in database');
    }

    console.log('👤 Found users:', {
      admin: admin.displayName,
      hrManager: hrManager.displayName,
      instructor1: instructor1.displayName,
      instructor2: instructor2.displayName
    });

    // Create sample workflow documents
    const sampleDocuments = [
      {
        title: 'Course Curriculum Update - Mathematics 101',
        description: 'Proposed updates to the Mathematics 101 curriculum for the upcoming semester',
        documentType: 'CURRICULUM',
        currentOwnerId: instructor1.id,
        currentAssigneeId: hrManager.id,
        currentStatus: 'PENDING_REVIEW',
        createdBy: instructor1.id
      },
      {
        title: 'HR Policy - Remote Work Guidelines',
        description: 'New remote work policy guidelines for academic staff',
        documentType: 'POLICY',
        currentOwnerId: hrManager.id,
        currentAssigneeId: admin.id,
        currentStatus: 'PENDING_APPROVAL',
        createdBy: hrManager.id
      },
      {
        title: 'Student Leave Request - Medical',
        description: 'Medical leave request for student Ahmed Mohammed',
        documentType: 'LEAVE_REQUEST',
        currentOwnerId: instructor2.id,
        currentAssigneeId: hrManager.id,
        currentStatus: 'PENDING_REVIEW',
        createdBy: instructor2.id
      },
      {
        title: 'Equipment Purchase Request',
        description: 'Request for new laboratory equipment for Physics department',
        documentType: 'PURCHASE_REQUEST',
        currentOwnerId: instructor1.id,
        currentAssigneeId: admin.id,
        currentStatus: 'UNDER_REVIEW',
        createdBy: instructor1.id
      },
      {
        title: 'Academic Calendar 2026',
        description: 'Proposed academic calendar for 2026 with important dates and holidays',
        documentType: 'CALENDAR',
        currentOwnerId: admin.id,
        currentAssigneeId: instructor2.id,
        currentStatus: 'PENDING_FEEDBACK',
        createdBy: admin.id
      }
    ];

    // Create workflow documents
    const createdDocuments = [];
    for (const doc of sampleDocuments) {
      const workflowDoc = await prisma.workflowDocument.create({
        data: {
          title: doc.title,
          description: doc.description,
          documentType: doc.documentType,
          currentOwnerId: doc.currentOwnerId,
          currentAssigneeId: doc.currentAssigneeId,
          currentStatus: doc.currentStatus,
          createdBy: doc.createdBy
        }
      });
      createdDocuments.push(workflowDoc);
      console.log(`📄 Created document: ${doc.title}`);
    }

    // Create workflow actions for each document
    for (const document of createdDocuments) {
      // Create initial action (document creation)
      await prisma.workflowAction.create({
        data: {
          document: {
            connect: { id: document.id }
          },
          sender: {
            connect: { id: document.createdBy }
          },
          receiver: {
            connect: { id: document.currentAssigneeId }
          },
          action: 'CREATE',
          stateAfter: document.currentStatus,
          comment: 'Document created and submitted for review'
        }
      });

      // Create inbox items for relevant users
      const inboxUsers = [document.currentAssigneeId, document.currentOwnerId];
      for (const userId of inboxUsers) {
        const existingInbox = await prisma.workflowInboxItem.findFirst({
          where: {
            userId: userId,
            documentId: document.id
          }
        });

        if (!existingInbox) {
          const action = document.currentStatus === 'PENDING_REVIEW' ? 'review' : 
                        document.currentStatus === 'PENDING_APPROVAL' ? 'approve' : 
                        document.currentStatus === 'UNDER_REVIEW' ? 'review' : 'review';

          await prisma.workflowInboxItem.create({
            data: {
              userId: userId,
              documentId: document.id,
              action: action,
              isRead: userId === document.createdBy // Creator has read it
            }
          });
          console.log(`📬 Created inbox item for user ${userId} - action: ${action}`);
        }
      }
    }

    // Create some workflow transitions to show activity
    const transitions = [
      {
        documentId: createdDocuments[0].id, // Math curriculum
        actionType: 'SEND',
        userId: instructor1.id,
        newStatus: 'PENDING_REVIEW',
        comments: 'Sending to HR for initial review'
      },
      {
        documentId: createdDocuments[1].id, // HR Policy
        actionType: 'SEND',
        userId: hrManager.id,
        newStatus: 'PENDING_APPROVAL',
        comments: 'Forwarding to admin for final approval'
      }
    ];

    for (const transition of transitions) {
      // Get the document to find current assignee
      const doc = createdDocuments.find(d => d.id === transition.documentId);
      
      await prisma.workflowAction.create({
        data: {
          document: {
            connect: { id: transition.documentId }
          },
          sender: {
            connect: { id: transition.userId }
          },
          receiver: {
            connect: { id: doc?.currentAssigneeId || transition.userId }
          },
          action: transition.actionType,
          stateAfter: transition.newStatus,
          comment: transition.comments
        }
      });
      console.log(`🔄 Created transition: ${transition.actionType}`);
    }

    console.log('\n✅ Sample workflow data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Documents created: ${createdDocuments.length}`);
    console.log(`- Actions created: ${sampleDocuments.length + transitions.length}`);
    console.log(`- Inbox items created for users`);

    // Display created documents
    console.log('\n📋 Created Workflow Documents:');
    for (const doc of createdDocuments) {
      console.log(`  - ${doc.title} (${doc.documentType}) - Status: ${doc.currentStatus}`);
    }

  } catch (error) {
    console.error('❌ Error creating sample workflow data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSampleWorkflowData()
  .then(() => {
    console.log('🎉 Sample workflow data seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sample workflow data seeding failed:', error);
    process.exit(1);
  });
