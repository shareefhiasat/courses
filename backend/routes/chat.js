/**
 * Chat Routes
 */

import express from 'express';
import chatController from '../controllers/chatController.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/chat/rooms:
 *   get:
 *     summary: Get user's chat rooms
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of chat rooms
 */
router.get('/rooms', chatController.getRooms);

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Get messages for a room
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: before
 *         schema:
 *           type: integer
 *       - in: query
 *         name: after
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/rooms/:roomId/messages', chatController.getMessages);

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, voice, file, poll]
 *               content:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileName:
 *                 type: string
 *               pollOptions:
 *                 type: array
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post('/rooms/:roomId/messages', chatController.sendMessage);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}:
 *   put:
 *     summary: Update a message
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated
 */
router.put('/messages/:messageId', chatController.updateMessage);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete('/messages/:messageId', chatController.deleteMessage);

/**
 * @swagger
 * /api/v1/chat/dm:
 *   post:
 *     summary: Create or get DM room
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: DM room created or retrieved
 */
router.post('/dm', chatController.createDM);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}/reactions:
 *   post:
 *     summary: Add or remove reaction
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reactionType:
 *                 type: string
 *               remove:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Reaction toggled
 */
router.post('/messages/:messageId/reactions', chatController.toggleReaction);

/**
 * @swagger
 * /api/v1/chat/messages/{messageId}/vote:
 *   post:
 *     summary: Vote on a poll
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optionIndex:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vote recorded
 */
router.post('/messages/:messageId/vote', chatController.votePoll);

/**
 * @swagger
 * /api/v1/chat/users:
 *   get:
 *     summary: Get users available for DM
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of available users
 */
router.get('/users', chatController.getAvailableUsers);

/**
 * @swagger
 * /api/v1/chat/rooms/group:
 *   post:
 *     summary: Create group chat room (staff only)
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - participantIds
 *             properties:
 *               name:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Group chat created
 *       403:
 *         description: Only staff can create groups
 */
router.post('/rooms/group', chatController.createGroupRoom);

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/participants:
 *   post:
 *     summary: Add participant to group chat (creator only)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Participant added
 *       403:
 *         description: Only creator can add participants
 */
router.post('/rooms/:roomId/participants', chatController.addParticipant);

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}/participants/{participantUserId}:
 *   delete:
 *     summary: Remove participant from group chat (creator only)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: participantUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Participant removed
 *       403:
 *         description: Only creator can remove participants
 */
router.delete('/rooms/:roomId/participants/:participantUserId', chatController.removeParticipant);

/**
 * @swagger
 * /api/v1/chat/rooms/{roomId}:
 *   patch:
 *     summary: Update group chat name (creator only)
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group chat updated
 *       403:
 *         description: Only creator can update group
 */
router.patch('/rooms/:roomId', chatController.updateGroupRoom);

export default router;
