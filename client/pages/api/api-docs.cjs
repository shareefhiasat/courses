/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/programs:
 *   get:
 *     summary: Get all programs
 *     tags: [Programs]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of programs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Program'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new program
 *     tags: [Programs]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramInput'
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
*           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/activities:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new activity
 *     tags: [Activities]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityInput'
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
*           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
*                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceInput'
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
*                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
*               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
*                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/penalties:
 *   get:
 *     summary: Get all penalties
 *     tags: [Penalties]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of penalties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
*                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Penalty'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new penalty
 *     tags: [Penalties]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PenaltyInput'
 *     responses:
 *       201:
 *         description: Penalty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Penalty'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/participations:
 *   get:
 *     summary: Get all participations
 *     tags: [Participations]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of participations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
*                   items:
 *                     $ref: '#/components/schemas/Participation'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
*               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new participation
 *     tags: [Participations]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParticipationInput'
 *     responses:
 *       201:
 *         description: Participation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Participation'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/behaviors:
 *   get:
 *     summary: Get all behaviors
 *     tags: [Behaviors]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of behaviors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Behavior'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   post:
 *     summary: Create a new behavior
 *     tags: [Behaviors]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BehaviorInput'
 *     responses:
 *       201:
 *         description: Behavior created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Behavior'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/quiz-results:
 *   get:
 *     summary: Get all quiz results
 *     tags: [Quiz Results]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of quiz results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/QuizResult'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new quiz result
*     tags: [Quiz Results]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/QuizResultInput'
*     responses:
*       201:
*         description: Quiz result created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/QuizResult'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/quiz-submissions:
 *   get:
 *     summary: Get all quiz submissions
 *     tags: [Quiz Submissions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of quiz submissions
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/QuizSubmission'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new quiz submission
*     tags: [Quiz Submissions]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/QuizSubmissionInput'
*     responses:
*       201:
*         description: Quiz submission created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/QuizSubmission'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Notification'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new notification
*     tags: [Notifications]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/NotificationInput'
*     responses:
*       201:
*         description: Notification created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Notification'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Schedule'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new schedule
*     tags: [Schedules]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/ScheduleInput'
*     responses:
*       201:
*         description: Schedule created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Schedule'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Templates]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Template'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new template
*     tags: [Templates]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/TemplateInput'
*     responses:
*       201:
*         description: Template created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Template'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/gamifications:
 *   get:
 *     summary: Get all gamifications
 *     tags: [Gamifications]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of gamifications
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Gamification'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new gamification
*     tags: [Gamifications]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/GamificationInput'
*     responses:
*       201:
*         description: Gamification created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Gamification'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/bookmarks:
 *   get:
 *     summary: Get all bookmarks
 *     tags: [Bookmarks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarks
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Bookmark'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new bookmark
*     tags: [Bookmarks]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/BookmarkInput'
*     responses:
*       201:
*         description: Bookmark created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Bookmark'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [Attendance]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Attendance'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new attendance record
*     tags: [Attendance]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/AttendanceInput'
*     responses:
*       201:
*         description: Attendance record created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Attendance'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/attendance-sessions:
 *   get:
 *     summary: Get all attendance sessions
 *     tags: [Attendance Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of attendance sessions
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/AttendanceSession'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new attendance session
*     tags: [Attendance Sessions]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/AttendanceSessionInput'
*     responses:
*       201:
*         description: Attendance session created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/AttendanceSession'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/activity-logs:
 *   get:
 *     summary: Get all activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/ActivityLog'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new activity log
*     tags: [Activity Logs]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/ActivityLogInput'
*     responses:
*       201:
*         description: Activity log created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/ActivityLog'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/dashboards:
 *   get:
 *     summary: Get all dashboards
 *     tags: [Dashboards]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Dashboard'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new dashboard
*     tags: [Dashboards]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/DashboardInput'
*     responses:
*       201:
*         description: Dashboard created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Dashboard'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of enrollments
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Enrollment'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new enrollment
*     tags: [Enrollments]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/EnrollmentInput'
*     responses:
*       201:
*         description: Enrollment created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Enrollment'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/question-bank:
 *   get:
 *     summary: Get all question bank items
 *     tags: [Question Bank]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of question bank items
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/QuestionBank'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new question bank item
*     tags: [Question Bank]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/QuestionBankInput'
*     responses:
*       201:
*         description: Question bank item created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/QuestionBank'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/chat:
 *   get:
 *     summary: Get all chat messages
 *     tags: [Chat]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Chat'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new chat message
*     tags: [Chat]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/ChatInput'
*     responses:
*       201:
*         description: Chat message created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Chat'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/quizzes:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of quizzes
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/Quiz'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new quiz
*     tags: [Quizzes]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/QuizInput'
*     responses:
*       201:
*         description: Quiz created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/Quiz'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * @swagger
 * /api/v1/subject-enrollments:
 *   get:
 *     summary: Get all subject enrollments
 *     tags: [Subject Enrollments]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of subject enrollments
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/SubjectEnrollment'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*   
*   post:
*     summary: Create a new subject enrollment
*     tags: [Subject Enrollments]
*     security:
*       - ApiKeyAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/SubjectEnrollmentInput'
*     responses:
*       201:
*         description: Subject enrollment created successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                   example: true
*                 data:
*                   $ref: '#/components/schemas/SubjectEnrollment'
*       400:
*         description: Bad request
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       401:
*         description: Unauthorized
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       500:
*         description: Internal server error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*/

/**
 * Swagger API Documentation Route
 * Serves interactive API documentation
 */

const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('../../src/utils/swagger');

function handler(req, res) {
  try {
    // Serve Swagger UI
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)(req, res);
  } catch (error) {
    console.error('[API Docs] Error serving documentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load API documentation',
    });
  }
}

module.exports = handler;
