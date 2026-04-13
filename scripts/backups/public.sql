/*
 Navicat Premium Dump SQL

 Source Server         : lms
 Source Server Type    : PostgreSQL
 Source Server Version : 150017 (150017)
 Source Host           : localhost:5432
 Source Catalog        : military_lms
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 150017 (150017)
 File Encoding         : 65001

 Date: 13/04/2026 17:09:19
*/


-- ----------------------------
-- Sequence structure for academic_terms_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."academic_terms_id_seq";
CREATE SEQUENCE "public"."academic_terms_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for activities_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."activities_id_seq";
CREATE SEQUENCE "public"."activities_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for activity_log_action_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."activity_log_action_types_id_seq";
CREATE SEQUENCE "public"."activity_log_action_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for activity_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."activity_types_id_seq";
CREATE SEQUENCE "public"."activity_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for announcements_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."announcements_id_seq";
CREATE SEQUENCE "public"."announcements_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for answers_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."answers_id_seq";
CREATE SEQUENCE "public"."answers_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for assessment_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."assessment_types_id_seq";
CREATE SEQUENCE "public"."assessment_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for attendance_status_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."attendance_status_types_id_seq";
CREATE SEQUENCE "public"."attendance_status_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for attendances_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."attendances_id_seq";
CREATE SEQUENCE "public"."attendances_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for behavior_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."behavior_types_id_seq";
CREATE SEQUENCE "public"."behavior_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for behaviors_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."behaviors_id_seq";
CREATE SEQUENCE "public"."behaviors_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for category_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."category_types_id_seq";
CREATE SEQUENCE "public"."category_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for classes_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."classes_id_seq";
CREATE SEQUENCE "public"."classes_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for config_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."config_types_id_seq";
CREATE SEQUENCE "public"."config_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for enrollment_status_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."enrollment_status_types_id_seq";
CREATE SEQUENCE "public"."enrollment_status_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for enrollments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."enrollments_id_seq";
CREATE SEQUENCE "public"."enrollments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for help_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."help_items_id_seq";
CREATE SEQUENCE "public"."help_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for marks_distributions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."marks_distributions_id_seq";
CREATE SEQUENCE "public"."marks_distributions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for participation_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."participation_types_id_seq";
CREATE SEQUENCE "public"."participation_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for participations_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."participations_id_seq";
CREATE SEQUENCE "public"."participations_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for penalties_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."penalties_id_seq";
CREATE SEQUENCE "public"."penalties_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for penalty_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."penalty_types_id_seq";
CREATE SEQUENCE "public"."penalty_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for priority_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."priority_types_id_seq";
CREATE SEQUENCE "public"."priority_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for private_workspace_links_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."private_workspace_links_id_seq";
CREATE SEQUENCE "public"."private_workspace_links_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for programs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."programs_id_seq";
CREATE SEQUENCE "public"."programs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for question_difficulty_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."question_difficulty_types_id_seq";
CREATE SEQUENCE "public"."question_difficulty_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for question_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."question_types_id_seq";
CREATE SEQUENCE "public"."question_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for questions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."questions_id_seq";
CREATE SEQUENCE "public"."questions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for quiz_attempts_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."quiz_attempts_id_seq";
CREATE SEQUENCE "public"."quiz_attempts_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for quiz_status_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."quiz_status_types_id_seq";
CREATE SEQUENCE "public"."quiz_status_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for quizzes_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."quizzes_id_seq";
CREATE SEQUENCE "public"."quizzes_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for requirement_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."requirement_types_id_seq";
CREATE SEQUENCE "public"."requirement_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for resource_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."resource_types_id_seq";
CREATE SEQUENCE "public"."resource_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for resources_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."resources_id_seq";
CREATE SEQUENCE "public"."resources_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for schedule_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."schedule_types_id_seq";
CREATE SEQUENCE "public"."schedule_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for standup_attendances_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."standup_attendances_id_seq";
CREATE SEQUENCE "public"."standup_attendances_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for student_marks_history_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."student_marks_history_id_seq";
CREATE SEQUENCE "public"."student_marks_history_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for student_marks_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."student_marks_id_seq";
CREATE SEQUENCE "public"."student_marks_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for subject_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."subject_types_id_seq";
CREATE SEQUENCE "public"."subject_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for subjects_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."subjects_id_seq";
CREATE SEQUENCE "public"."subjects_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for submission_status_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."submission_status_types_id_seq";
CREATE SEQUENCE "public"."submission_status_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for submissions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."submissions_id_seq";
CREATE SEQUENCE "public"."submissions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for target_audience_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."target_audience_types_id_seq";
CREATE SEQUENCE "public"."target_audience_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for template_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."template_types_id_seq";
CREATE SEQUENCE "public"."template_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_favorites_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_favorites_id_seq";
CREATE SEQUENCE "public"."user_favorites_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_preferences_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_preferences_id_seq";
CREATE SEQUENCE "public"."user_preferences_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_role_assignments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_role_assignments_id_seq";
CREATE SEQUENCE "public"."user_role_assignments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_roles_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_roles_id_seq";
CREATE SEQUENCE "public"."user_roles_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for user_status_types_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."user_status_types_id_seq";
CREATE SEQUENCE "public"."user_status_types_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."users_id_seq";
CREATE SEQUENCE "public"."users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for workflow_actions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."workflow_actions_id_seq";
CREATE SEQUENCE "public"."workflow_actions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for workflow_documents_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."workflow_documents_id_seq";
CREATE SEQUENCE "public"."workflow_documents_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for workflow_inbox_items_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."workflow_inbox_items_id_seq";
CREATE SEQUENCE "public"."workflow_inbox_items_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for workflow_versions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."workflow_versions_id_seq";
CREATE SEQUENCE "public"."workflow_versions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."_prisma_migrations";
CREATE TABLE "public"."_prisma_migrations" (
  "id" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "checksum" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "finished_at" timestamptz(6),
  "migration_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "logs" text COLLATE "pg_catalog"."default",
  "rolled_back_at" timestamptz(6),
  "started_at" timestamptz(6) NOT NULL DEFAULT now(),
  "applied_steps_count" int4 NOT NULL DEFAULT 0
)
;

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
INSERT INTO "public"."_prisma_migrations" VALUES ('be6f46eb-9bad-4012-adc8-ffeca2c188c1', '5d0d23871a4ae3427b9b40974b5c0bfc82d8477a535f9d7c4d86f6cab07c3761', '2026-04-01 13:26:39.143143+00', '20260401132637_init', NULL, NULL, '2026-04-01 13:26:37.52583+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('e76ea3ae-3995-490f-b5be-77eb9f82c0fc', '7eb1dcdfd9d8dac3b1aba227a6a8d11f2656012ef47374afb222738704bc9f94', '2026-04-02 17:53:25.898934+00', '20260402175325_add_is_repeated_to_student_marks', NULL, NULL, '2026-04-02 17:53:25.859864+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('77426e94-d70b-4f2e-95d7-e0de2d38866a', '3c1289b283dca69869055e92a40978c1cdc5d6f53e8cfb6691af1db165f89371', '2026-04-03 08:22:55.255094+00', '20260403082255_add_grade_type_to_student_marks', NULL, NULL, '2026-04-03 08:22:55.234772+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('1fd282bc-55bc-41c2-8ade-23fb46f54bf7', '605b4397629eb5d4af235d67bd37430e47955433f7ab7af7203c3457cad5f3bc', '2026-04-04 11:12:39.32782+00', '20260404111239_add_student_marks_history', NULL, NULL, '2026-04-04 11:12:39.246974+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('72e97fbf-fd17-41a5-b0e6-360b0833db3a', 'a04f98b387968a0336ea45ef002696e9bda966d9ffce2cde6b80d63cb939e629', '2026-04-04 11:21:39.919767+00', '20260404112139_fix_student_marks_history_relation', NULL, NULL, '2026-04-04 11:21:39.894754+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('37fa2959-d5a4-4a9e-8978-c00311ab686d', '467809145e1318929b1b3c42b53526e81b2e9631528828bead28834cb3e57bef', '2026-04-04 15:45:03.602994+00', '20260404154503_simplify_attendance_table', NULL, NULL, '2026-04-04 15:45:03.49978+00', 1);
INSERT INTO "public"."_prisma_migrations" VALUES ('33d0960b-30c2-4160-af64-ef9ca0686b9d', 'a5369e311a5b24079633b03038ce71b553ed6cc2a3417feef743eebbaa5a867e', '2026-04-04 15:50:15.29198+00', '20260404155015_revise_attendance_structure', NULL, NULL, '2026-04-04 15:50:15.223297+00', 1);

-- ----------------------------
-- Table structure for academic_terms
-- ----------------------------
DROP TABLE IF EXISTS "public"."academic_terms";
CREATE TABLE "public"."academic_terms" (
  "id" int4 NOT NULL DEFAULT nextval('academic_terms_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of academic_terms
-- ----------------------------
INSERT INTO "public"."academic_terms" VALUES (1, '2024-FALL', 'Fall 2024', 'خريف 2024', 'Fall semester 2024', 't', NULL, NULL, '2026-04-01 13:26:46.57', '2026-04-01 13:26:46.57');
INSERT INTO "public"."academic_terms" VALUES (2, '2025-SPRING', 'Spring 2025', 'ربيع 2025', 'Spring semester 2025', 'f', NULL, NULL, '2026-04-01 13:26:46.579', '2026-04-01 13:26:46.579');
INSERT INTO "public"."academic_terms" VALUES (3, '2025-SUMMER', 'Summer 2025', 'صيف 2025', 'Summer semester 2025', 'f', NULL, NULL, '2026-04-01 13:26:46.586', '2026-04-01 13:26:46.586');

-- ----------------------------
-- Table structure for activities
-- ----------------------------
DROP TABLE IF EXISTS "public"."activities";
CREATE TABLE "public"."activities" (
  "id" int4 NOT NULL DEFAULT nextval('activities_id_seq'::regclass),
  "classId" int4 NOT NULL,
  "titleEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleAr" text COLLATE "pg_catalog"."default",
  "typeId" int4 NOT NULL,
  "dueDate" timestamp(3),
  "maxScore" float8,
  "weight" float8 NOT NULL DEFAULT 1.0,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "allowRetake" bool NOT NULL DEFAULT false,
  "imageUrl" text COLLATE "pg_catalog"."default",
  "link" text COLLATE "pg_catalog"."default",
  "quizId" int4
)
;

-- ----------------------------
-- Records of activities
-- ----------------------------

-- ----------------------------
-- Table structure for activity_log_action_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_log_action_types";
CREATE TABLE "public"."activity_log_action_types" (
  "id" int4 NOT NULL DEFAULT nextval('activity_log_action_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of activity_log_action_types
-- ----------------------------
INSERT INTO "public"."activity_log_action_types" VALUES (1, 'CREATE', 'Create', 'إنشاء', 'Record created', 't', NULL, NULL, '2026-04-01 13:26:46.03', '2026-04-01 13:26:46.03');
INSERT INTO "public"."activity_log_action_types" VALUES (2, 'UPDATE', 'Update', 'تحديث', 'Record updated', 't', NULL, NULL, '2026-04-01 13:26:46.04', '2026-04-01 13:26:46.04');
INSERT INTO "public"."activity_log_action_types" VALUES (3, 'DELETE', 'Delete', 'حذف', 'Record deleted', 't', NULL, NULL, '2026-04-01 13:26:46.047', '2026-04-01 13:26:46.047');
INSERT INTO "public"."activity_log_action_types" VALUES (4, 'LOGIN', 'Login', 'تسجيل الدخول', 'User logged in', 't', NULL, NULL, '2026-04-01 13:26:46.055', '2026-04-01 13:26:46.055');
INSERT INTO "public"."activity_log_action_types" VALUES (5, 'LOGOUT', 'Logout', 'تسجيل الخروج', 'User logged out', 't', NULL, NULL, '2026-04-01 13:26:46.063', '2026-04-01 13:26:46.063');
INSERT INTO "public"."activity_log_action_types" VALUES (6, 'ENROLL', 'Enroll', 'تسجيل', 'User enrolled in program', 't', NULL, NULL, '2026-04-01 13:26:46.071', '2026-04-01 13:26:46.071');
INSERT INTO "public"."activity_log_action_types" VALUES (7, 'WITHDRAW', 'Withdraw', 'انسحاب', 'User withdrew from program', 't', NULL, NULL, '2026-04-01 13:26:46.079', '2026-04-01 13:26:46.079');
INSERT INTO "public"."activity_log_action_types" VALUES (8, 'SUBMIT', 'Submit', 'تقديم', 'Assignment submitted', 't', NULL, NULL, '2026-04-01 13:26:46.086', '2026-04-01 13:26:46.086');
INSERT INTO "public"."activity_log_action_types" VALUES (9, 'GRADE', 'Grade', 'تقدير', 'Grade assigned', 't', NULL, NULL, '2026-04-01 13:26:46.093', '2026-04-01 13:26:46.093');

-- ----------------------------
-- Table structure for activity_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."activity_types";
CREATE TABLE "public"."activity_types" (
  "id" int4 NOT NULL DEFAULT nextval('activity_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "icon" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of activity_types
-- ----------------------------
INSERT INTO "public"."activity_types" VALUES (1, 'LECTURE', 'Lecture', 'محاضرة', 'Classroom lecture session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.944', '2026-04-01 13:26:45.944');
INSERT INTO "public"."activity_types" VALUES (2, 'LAB', 'Lab Session', 'جلسة معمل', 'Laboratory practical session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.957', '2026-04-01 13:26:45.957');
INSERT INTO "public"."activity_types" VALUES (3, 'SEMINAR', 'Seminar', 'ندوة', 'Interactive seminar session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.97', '2026-04-01 13:26:45.97');
INSERT INTO "public"."activity_types" VALUES (4, 'WORKSHOP', 'Workshop', 'ورشة عمل', 'Hands-on workshop session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.979', '2026-04-01 13:26:45.979');
INSERT INTO "public"."activity_types" VALUES (5, 'EXAM', 'Exam', 'امتحان', 'Formal examination', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.987', '2026-04-01 13:26:45.987');
INSERT INTO "public"."activity_types" VALUES (6, 'ASSIGNMENT', 'Assignment', 'واجب', 'Course assignment', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:45.996', '2026-04-01 13:26:45.996');
INSERT INTO "public"."activity_types" VALUES (7, 'PROJECT', 'Project', 'مشروع', 'Course project', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.006', '2026-04-01 13:26:46.006');
INSERT INTO "public"."activity_types" VALUES (8, 'PRESENTATION', 'Presentation', 'عرض تقديمي', 'Student presentation', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.015', '2026-04-01 13:26:46.015');

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
DROP TABLE IF EXISTS "public"."announcements";
CREATE TABLE "public"."announcements" (
  "id" int4 NOT NULL DEFAULT nextval('announcements_id_seq'::regclass),
  "titleEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleAr" text COLLATE "pg_catalog"."default",
  "priorityId" int4 NOT NULL,
  "targetAudienceId" int4 NOT NULL,
  "programId" int4,
  "classId" int4,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "publishAt" timestamp(3),
  "expiresAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "subjectId" int4
)
;

-- ----------------------------
-- Records of announcements
-- ----------------------------
INSERT INTO "public"."announcements" VALUES (1, 'Welcome to Spring Semester 2025', 'مرحبا بكم في فصل الربيع 2025', 2, 1, 1, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.939', '2026-04-01 13:26:47.939', 'We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.', 'نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.', NULL);
INSERT INTO "public"."announcements" VALUES (2, 'Python Lab Schedule Update', 'تحديث جدول مختبر بايثون', 2, 2, NULL, 1, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.949', '2026-04-01 13:26:47.949', 'The Python lab schedule has been updated. Please check the new timing for CS101 sections.', 'تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.', NULL);
INSERT INTO "public"."announcements" VALUES (3, 'Engineering Mathematics Midterm', 'امتحان منتصف الفصل للرياضيات الهندسية', 2, 2, NULL, 5, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.956', '2026-04-01 13:26:47.956', 'Midterm exam for Engineering Mathematics will be held next week. Please prepare accordingly.', 'سيتم عقد امتحان منتصف الفصل للرياضيات الهندسية الأسبوع القادم. يرجى الاستعداد وفقا لذلك.', NULL);
INSERT INTO "public"."announcements" VALUES (4, 'New Resources Available', 'موارد جديدة متاحة', 2, 1, 2, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.961', '2026-04-01 13:26:47.961', 'New learning resources have been uploaded for all courses. Check the resources section.', 'تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.', NULL);
INSERT INTO "public"."announcements" VALUES (5, 'Instructor Meeting', 'اجتماع المدربين', 2, 3, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.966', '2026-04-01 13:26:47.966', 'Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.', 'اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.', NULL);
INSERT INTO "public"."announcements" VALUES (6, 'Digital Logic Lab Assignment', 'واجب مختبر المنطق الرقمي', 2, 2, NULL, 8, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.973', '2026-04-01 13:26:47.973', 'New lab assignment for Digital Logic Design has been posted. Due date is next Friday.', 'تم نشر واجب مختبر جديد لتصميم المنطق الرقمي. الموعد النهائي هو الجمعة القادمة.', NULL);
INSERT INTO "public"."announcements" VALUES (7, 'Database Project Guidelines', 'إرشادات مشروع قواعد البيانات', 2, 2, NULL, 4, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.98', '2026-04-01 13:26:47.98', 'Guidelines for the database systems project have been uploaded. Please review carefully.', 'تم رفع إرشادات مشروع أنظمة قواعد البيانات. يرجى المراجعة بعناية.', NULL);
INSERT INTO "public"."announcements" VALUES (8, 'Career Fair Announcement', 'إعلان معرض الوظائف', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.991', '2026-04-01 13:26:47.991', 'Annual engineering career fair will be held next month. All students are encouraged to attend.', 'سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.', NULL);
INSERT INTO "public"."announcements" VALUES (9, 'HR Policy Update', 'تحديث سياسة الموارد البشرية', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:47.996', '2026-04-01 13:26:47.996', 'New HR policies have been updated. Please review the changes.', 'تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.', NULL);
INSERT INTO "public"."announcements" VALUES (10, 'System Maintenance Notice', 'إشعار صيانة النظام', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:26:48.002', '2026-04-01 13:26:48.002', 'System maintenance scheduled for this weekend. Please save your work.', 'صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.', NULL);
INSERT INTO "public"."announcements" VALUES (11, 'Welcome to Spring Semester 2025', 'مرحبا بكم في فصل الربيع 2025', 2, 1, 1, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.725', '2026-04-01 13:27:36.725', 'We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.', 'نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.', NULL);
INSERT INTO "public"."announcements" VALUES (12, 'Python Lab Schedule Update', 'تحديث جدول مختبر بايثون', 2, 2, NULL, 1, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.734', '2026-04-01 13:27:36.734', 'The Python lab schedule has been updated. Please check the new timing for CS101 sections.', 'تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.', NULL);
INSERT INTO "public"."announcements" VALUES (13, 'Engineering Mathematics Midterm', 'امتحان منتصف الفصل للرياضيات الهندسية', 2, 2, NULL, 5, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.741', '2026-04-01 13:27:36.741', 'Midterm exam for Engineering Mathematics will be held next week. Please prepare accordingly.', 'سيتم عقد امتحان منتصف الفصل للرياضيات الهندسية الأسبوع القادم. يرجى الاستعداد وفقا لذلك.', NULL);
INSERT INTO "public"."announcements" VALUES (14, 'New Resources Available', 'موارد جديدة متاحة', 2, 1, 2, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.746', '2026-04-01 13:27:36.746', 'New learning resources have been uploaded for all courses. Check the resources section.', 'تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.', NULL);
INSERT INTO "public"."announcements" VALUES (15, 'Instructor Meeting', 'اجتماع المدربين', 2, 3, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.751', '2026-04-01 13:27:36.751', 'Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.', 'اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.', NULL);
INSERT INTO "public"."announcements" VALUES (16, 'Digital Logic Lab Assignment', 'واجب مختبر المنطق الرقمي', 2, 2, NULL, 8, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.757', '2026-04-01 13:27:36.757', 'New lab assignment for Digital Logic Design has been posted. Due date is next Friday.', 'تم نشر واجب مختبر جديد لتصميم المنطق الرقمي. الموعد النهائي هو الجمعة القادمة.', NULL);
INSERT INTO "public"."announcements" VALUES (17, 'Database Project Guidelines', 'إرشادات مشروع قواعد البيانات', 2, 2, NULL, 4, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.761', '2026-04-01 13:27:36.761', 'Guidelines for the database systems project have been uploaded. Please review carefully.', 'تم رفع إرشادات مشروع أنظمة قواعد البيانات. يرجى المراجعة بعناية.', NULL);
INSERT INTO "public"."announcements" VALUES (18, 'Career Fair Announcement', 'إعلان معرض الوظائف', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.765', '2026-04-01 13:27:36.765', 'Annual engineering career fair will be held next month. All students are encouraged to attend.', 'سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.', NULL);
INSERT INTO "public"."announcements" VALUES (19, 'HR Policy Update', 'تحديث سياسة الموارد البشرية', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.77', '2026-04-01 13:27:36.77', 'New HR policies have been updated. Please review the changes.', 'تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.', NULL);
INSERT INTO "public"."announcements" VALUES (20, 'System Maintenance Notice', 'إشعار صيانة النظام', 2, 1, NULL, NULL, 't', 1, NULL, NULL, NULL, '2026-04-01 13:27:36.775', '2026-04-01 13:27:36.775', 'System maintenance scheduled for this weekend. Please save your work.', 'صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.', NULL);

-- ----------------------------
-- Table structure for answers
-- ----------------------------
DROP TABLE IF EXISTS "public"."answers";
CREATE TABLE "public"."answers" (
  "id" int4 NOT NULL DEFAULT nextval('answers_id_seq'::regclass),
  "questionId" int4 NOT NULL,
  "quizAttemptId" int4 NOT NULL,
  "answer" text COLLATE "pg_catalog"."default" NOT NULL,
  "isCorrect" bool NOT NULL DEFAULT false,
  "points" float8 NOT NULL DEFAULT 0,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of answers
-- ----------------------------

-- ----------------------------
-- Table structure for assessment_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."assessment_types";
CREATE TABLE "public"."assessment_types" (
  "id" int4 NOT NULL DEFAULT nextval('assessment_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of assessment_types
-- ----------------------------
INSERT INTO "public"."assessment_types" VALUES (1, 'QUIZ', 'Quiz', 'اختبار قصير', 'Short knowledge assessment', 't', NULL, NULL, '2026-04-01 13:26:46.111', '2026-04-01 13:26:46.111');
INSERT INTO "public"."assessment_types" VALUES (2, 'MIDTERM', 'Midterm Exam', 'امتحان منتصف الفصل', 'Mid-term examination', 't', NULL, NULL, '2026-04-01 13:26:46.122', '2026-04-01 13:26:46.122');
INSERT INTO "public"."assessment_types" VALUES (3, 'FINAL', 'Final Exam', 'امتحان نهائي', 'Final examination', 't', NULL, NULL, '2026-04-01 13:26:46.131', '2026-04-01 13:26:46.131');
INSERT INTO "public"."assessment_types" VALUES (4, 'ASSIGNMENT', 'Assignment', 'واجب', 'Course assignment', 't', NULL, NULL, '2026-04-01 13:26:46.141', '2026-04-01 13:26:46.141');
INSERT INTO "public"."assessment_types" VALUES (5, 'PROJECT', 'Project', 'مشروع', 'Course project', 't', NULL, NULL, '2026-04-01 13:26:46.152', '2026-04-01 13:26:46.152');
INSERT INTO "public"."assessment_types" VALUES (6, 'PARTICIPATION', 'Participation', 'مشاركة', 'Class participation', 't', NULL, NULL, '2026-04-01 13:26:46.16', '2026-04-01 13:26:46.16');
INSERT INTO "public"."assessment_types" VALUES (7, 'PRESENTATION', 'Presentation', 'عرض تقديمي', 'Oral presentation', 't', NULL, NULL, '2026-04-01 13:26:46.169', '2026-04-01 13:26:46.169');
INSERT INTO "public"."assessment_types" VALUES (8, 'LAB_WORK', 'Lab Work', 'عمل معمل', 'Laboratory work', 't', NULL, NULL, '2026-04-01 13:26:46.177', '2026-04-01 13:26:46.177');

-- ----------------------------
-- Table structure for attendance_status_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."attendance_status_types";
CREATE TABLE "public"."attendance_status_types" (
  "id" int4 NOT NULL DEFAULT nextval('attendance_status_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of attendance_status_types
-- ----------------------------
INSERT INTO "public"."attendance_status_types" VALUES (1, 'PRESENT', 'Present', 'حاضر', 'Student is present', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.441', '2026-04-01 13:26:46.441');
INSERT INTO "public"."attendance_status_types" VALUES (3, 'LATE', 'Late', 'متأخر', 'Student arrived late', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.46', '2026-04-01 13:26:46.46');
INSERT INTO "public"."attendance_status_types" VALUES (2, 'ABSENT_NO_EXCUSE', 'Absent', 'غائب', 'Student is absent', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.451', '2026-04-01 13:26:46.451');
INSERT INTO "public"."attendance_status_types" VALUES (4, 'ABSENT_WITH_EXCUSE', 'Absent with excuse', 'غياب بعذر', 'Student has excused absence', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.467', '2026-04-01 13:26:46.467');
INSERT INTO "public"."attendance_status_types" VALUES (7, 'STANDUP_PRESENT', 'Standup Present', 'حاضر تكميل صباحي', 'Morning Present', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.441', '2026-04-01 13:26:46.441');
INSERT INTO "public"."attendance_status_types" VALUES (6, 'HUMAN_CASE', 'Human Case', 'حالة انسانية', 'Human case absent', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.483', '2026-04-01 13:26:46.483');
INSERT INTO "public"."attendance_status_types" VALUES (8, 'STANDUP_LATE', 'Standup Late', ' متأخر تكميل صباحي', 'Morning Late', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.441', '2026-04-01 13:26:46.441');
INSERT INTO "public"."attendance_status_types" VALUES (10, 'STANDUP_CLINIC', 'Standup Clinic', ' غائب عيادة تكميل صباحي', 'Morning Absent', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.441', '2026-04-01 13:26:46.441');
INSERT INTO "public"."attendance_status_types" VALUES (9, 'STANDUP_ABSENT', 'Standup Absent', ' غائب تكميل صباحي', 'Morning Absent', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.441', '2026-04-01 13:26:46.441');
INSERT INTO "public"."attendance_status_types" VALUES (5, 'EXCUSED_LEAVE', 'Excused Leave', 'استئذان', 'Student official leave', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.475', '2026-04-01 13:26:46.475');

-- ----------------------------
-- Table structure for attendances
-- ----------------------------
DROP TABLE IF EXISTS "public"."attendances";
CREATE TABLE "public"."attendances" (
  "id" int4 NOT NULL DEFAULT nextval('attendances_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "classId" int4 NOT NULL,
  "date" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusId" int4 NOT NULL,
  "notes" text COLLATE "pg_catalog"."default",
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "programId" int4,
  "subjectId" int4
)
;

-- ----------------------------
-- Records of attendances
-- ----------------------------
INSERT INTO "public"."attendances" VALUES (74, 22, 3, '2026-04-12 00:00:00', 6, 'BULK_HUMAN_CASE', 1, 1, '2026-04-12 18:10:33.385', '2026-04-12 18:39:06.114', 1, 2);
INSERT INTO "public"."attendances" VALUES (72, 21, 3, '2026-04-12 00:00:00', 6, 'BULK_HUMAN_CASE', 1, 1, '2026-04-12 18:10:04.902', '2026-04-12 18:39:06.149', 1, 2);
INSERT INTO "public"."attendances" VALUES (76, 22, 3, '2026-04-13 00:00:00', 1, 'QUICK_PRESENT', 1, 1, '2026-04-13 03:35:44.78', '2026-04-13 08:32:56.251', 1, 2);

-- ----------------------------
-- Table structure for behavior_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."behavior_types";
CREATE TABLE "public"."behavior_types" (
  "id" int4 NOT NULL DEFAULT nextval('behavior_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "category" text COLLATE "pg_catalog"."default" DEFAULT 'neutral'::text,
  "points" int4 NOT NULL DEFAULT 0,
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of behavior_types
-- ----------------------------
INSERT INTO "public"."behavior_types" VALUES (1, 'EXCELLENT_PARTICIPATION', 'Excellent Participation', 'مشاركة ممتازة', 'Outstanding class participation', 'positive', 5, '#28A745', 't', NULL, NULL, '2026-04-01 13:26:45.021', '2026-04-01 13:26:45.021');
INSERT INTO "public"."behavior_types" VALUES (2, 'HELPING_PEERS', 'Helping Peers', 'مساعدة الزملاء', 'Helping other students', 'positive', 3, '#20C997', 't', NULL, NULL, '2026-04-01 13:26:45.078', '2026-04-01 13:26:45.078');
INSERT INTO "public"."behavior_types" VALUES (3, 'LEADERSHIP', 'Leadership', 'قيادة', 'Demonstrating leadership skills', 'positive', 5, '#17A2B8', 't', NULL, NULL, '2026-04-01 13:26:45.093', '2026-04-01 13:26:45.093');
INSERT INTO "public"."behavior_types" VALUES (4, 'CREATIVITY', 'Creativity', 'إبداع', 'Creative problem solving', 'positive', 4, '#6F42C1', 't', NULL, NULL, '2026-04-01 13:26:45.117', '2026-04-01 13:26:45.117');
INSERT INTO "public"."behavior_types" VALUES (5, 'IMPROVEMENT', 'Significant Improvement', 'تحسن ملحوظ', 'Notable academic improvement', 'positive', 4, '#007BFF', 't', NULL, NULL, '2026-04-01 13:26:45.138', '2026-04-01 13:26:45.138');
INSERT INTO "public"."behavior_types" VALUES (6, 'DISRUPTIVE', 'Disruptive Behavior', 'سلوك مزعج', 'Disrupting class', 'negative', -3, '#FFC107', 't', NULL, NULL, '2026-04-01 13:26:45.162', '2026-04-01 13:26:45.162');
INSERT INTO "public"."behavior_types" VALUES (7, 'DISRESPECTFUL', 'Disrespectful', 'عدم احترام', 'Disrespectful to instructor or peers', 'negative', -5, '#DC3545', 't', NULL, NULL, '2026-04-01 13:26:45.185', '2026-04-01 13:26:45.185');
INSERT INTO "public"."behavior_types" VALUES (8, 'UNPREPARED', 'Unprepared', 'غير مستعد', 'Consistently unprepared for class', 'negative', -2, '#FD7E14', 't', NULL, NULL, '2026-04-01 13:26:45.203', '2026-04-01 13:26:45.203');

-- ----------------------------
-- Table structure for behaviors
-- ----------------------------
DROP TABLE IF EXISTS "public"."behaviors";
CREATE TABLE "public"."behaviors" (
  "id" int4 NOT NULL DEFAULT nextval('behaviors_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "classId" int4,
  "programId" int4,
  "subjectId" int4,
  "typeId" int4 NOT NULL,
  "descriptionEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "points" int4 NOT NULL DEFAULT 0,
  "comment" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of behaviors
-- ----------------------------

-- ----------------------------
-- Table structure for category_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."category_types";
CREATE TABLE "public"."category_types" (
  "id" int4 NOT NULL DEFAULT nextval('category_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "icon" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "sort" int4 NOT NULL DEFAULT 0,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of category_types
-- ----------------------------
INSERT INTO "public"."category_types" VALUES (3, 'READING', 'Reading Material', 'مواد القراءة', 'Required reading materials', 'مواد القراءة المطلوبة', 'book', NULL, 0, 't', NULL, NULL, '2026-04-01 13:26:45.529', '2026-04-01 13:26:45.529');
INSERT INTO "public"."category_types" VALUES (4, 'REFERENCE', 'Reference', 'مرجع', 'Reference materials', 'مواد مرجعية', 'bookmark', NULL, 0, 't', NULL, NULL, '2026-04-01 13:26:45.537', '2026-04-01 13:26:45.537');
INSERT INTO "public"."category_types" VALUES (5, 'TUTORIAL', 'Tutorial', 'درس تعليمي', 'Tutorial materials', 'مواد تعليمية', 'help-circle', NULL, 0, 't', NULL, NULL, '2026-04-01 13:26:45.545', '2026-04-01 13:26:45.545');
INSERT INTO "public"."category_types" VALUES (7, 'SUPPLEMENTARY', 'Supplementary', 'تكميلي', 'Supplementary materials', 'مواد تكميلية', 'plus-circle', NULL, 0, 't', NULL, NULL, '2026-04-01 13:26:45.564', '2026-04-01 13:26:45.564');
INSERT INTO "public"."category_types" VALUES (10, 'ASDF', 'yyyyy', 'asdf', 'asdg', '', '', '#3b82f6', 1, 'f', NULL, NULL, '2026-04-05 07:28:20.027', '2026-04-05 07:30:37.99');
INSERT INTO "public"."category_types" VALUES (8, 'gggg', 'zzzz', 'ssssss', '', '', 'code', '#3b82f6', 1, 'f', NULL, NULL, '2026-04-05 07:25:36.837', '2026-04-05 07:30:41.145');
INSERT INTO "public"."category_types" VALUES (9, 'ZZZZ', 'zzzz', 'ssssss', '', '', '', '#3b82f6', 1, 'f', NULL, NULL, '2026-04-05 07:25:54.03', '2026-04-05 07:30:44.757');
INSERT INTO "public"."category_types" VALUES (2, 'ASSIGNMENT', 'Assignment', 'واجب', 'Assignment materials', 'مواد الواجب', 'clipboard', '#3b82f6', 1, 't', NULL, 1, '2026-04-01 13:26:45.52', '2026-04-05 08:27:38.484');
INSERT INTO "public"."category_types" VALUES (6, 'EXAM_PREP', 'Exam Preparation', 'تحضير الامتحان', 'Exam preparation materials', 'مواد تحضير الامتحان', 'file-check', '#3b82f6', 1, 't', NULL, 1, '2026-04-01 13:26:45.554', '2026-04-05 08:27:41.787');
INSERT INTO "public"."category_types" VALUES (12, 'sdfsd', 'aaa', 'fff', 'sadf', 'asdf', 'code', '#3b82f6', 1, 'f', 1, 1, '2026-04-05 08:27:56.763', '2026-04-05 08:37:08.447');
INSERT INTO "public"."category_types" VALUES (13, 'A', 'a', 'b', 'c', '', 'book', '#3b82f6', 1, 'f', 1, 1, '2026-04-05 08:37:25.166', '2026-04-05 08:37:31.111');
INSERT INTO "public"."category_types" VALUES (1, 'LECTURE_NOTES', 'Lecture Notes', 'ملاحظات المحاضرة', 'Lecture notes and slides', 'ملاحظات المحاضرة والشرائح', 'book-open', '#3b82f6', 1, 't', NULL, 1, '2026-04-01 13:26:45.507', '2026-04-05 08:47:58.993');

-- ----------------------------
-- Table structure for classes
-- ----------------------------
DROP TABLE IF EXISTS "public"."classes";
CREATE TABLE "public"."classes" (
  "id" int4 NOT NULL DEFAULT nextval('classes_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "maxCapacity" int4,
  "isActive" bool NOT NULL DEFAULT true,
  "programId" int4 NOT NULL,
  "subjectId" int4 NOT NULL,
  "instructorId" int4,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "locationAr" text COLLATE "pg_catalog"."default",
  "locationEn" text COLLATE "pg_catalog"."default",
  "ownerEmail" text COLLATE "pg_catalog"."default",
  "term" text COLLATE "pg_catalog"."default",
  "year" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of classes
-- ----------------------------
INSERT INTO "public"."classes" VALUES (1, 'CS101-A', 'CS101 Section A', 'شريحة أ من مادة CS101', 30, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.277', '2026-04-01 13:27:35.995', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (2, 'CS101-B', 'CS101 Section B', 'شريحة ب من مادة CS101', 30, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.299', '2026-04-01 13:27:36.004', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (3, 'CS102-A', 'CS102 Section A', 'شريحة أ من مادة CS102', 25, 't', 1, 2, 1, 1, NULL, '2026-04-01 13:26:47.324', '2026-04-01 13:27:36.009', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (4, 'CS201-A', 'CS201 Section A', 'شريحة أ من مادة CS201', 20, 't', 1, 3, 1, 1, NULL, '2026-04-01 13:26:47.334', '2026-04-01 13:27:36.016', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (5, 'ME101-A', 'ME101 Section A', 'شريحة أ من مادة ME101', 25, 't', 2, 5, 12, 1, NULL, '2026-04-01 13:26:47.341', '2026-04-01 13:27:36.022', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (8, 'EE102-A', 'EE102 Section A', 'شريحة أ من مادة EE102', 20, 't', 3, 8, 13, 1, NULL, '2026-04-01 13:26:47.372', '2026-04-01 13:27:36.04', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (7, 'EE101-A', 'EE101 Section A', 'شريحة أ من مادة EE101', 25, 't', 3, 7, 12, 1, NULL, '2026-04-01 13:26:47.362', '2026-04-01 13:27:36.034', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');
INSERT INTO "public"."classes" VALUES (6, 'ME102-A', 'ME102 Section A', 'شريحة أ من مادة ME102', 20, 't', 2, 6, 13, 1, NULL, '2026-04-01 13:26:47.349', '2026-04-01 13:27:36.028', NULL, NULL, NULL, NULL, NULL, '2025-SPRING', '2025');

-- ----------------------------
-- Table structure for config_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."config_types";
CREATE TABLE "public"."config_types" (
  "id" int4 NOT NULL DEFAULT nextval('config_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of config_types
-- ----------------------------
INSERT INTO "public"."config_types" VALUES (1, 'SYSTEM', 'System Config', 'إعدادات النظام', 'System-wide configuration', 't', NULL, NULL, '2026-04-01 13:26:46.393', '2026-04-01 13:26:46.393');
INSERT INTO "public"."config_types" VALUES (2, 'ACADEMIC', 'Academic Config', 'إعدادات أكاديمية', 'Academic settings', 't', NULL, NULL, '2026-04-01 13:26:46.404', '2026-04-01 13:26:46.404');
INSERT INTO "public"."config_types" VALUES (3, 'NOTIFICATION', 'Notification Config', 'إعدادات الإشعارات', 'Notification settings', 't', NULL, NULL, '2026-04-01 13:26:46.411', '2026-04-01 13:26:46.411');
INSERT INTO "public"."config_types" VALUES (4, 'SECURITY', 'Security Config', 'إعدادات الأمان', 'Security settings', 't', NULL, NULL, '2026-04-01 13:26:46.419', '2026-04-01 13:26:46.419');
INSERT INTO "public"."config_types" VALUES (5, 'INTEGRATION', 'Integration Config', 'إعدادات التكامل', 'Third-party integrations', 't', NULL, NULL, '2026-04-01 13:26:46.427', '2026-04-01 13:26:46.427');

-- ----------------------------
-- Table structure for enrollment_status_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."enrollment_status_types";
CREATE TABLE "public"."enrollment_status_types" (
  "id" int4 NOT NULL DEFAULT nextval('enrollment_status_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of enrollment_status_types
-- ----------------------------
INSERT INTO "public"."enrollment_status_types" VALUES (1, 'ENROLLED', 'Enrolled', 'مسجل', 'Student is enrolled in the program', 't', NULL, NULL, '2026-04-01 13:26:44.527', '2026-04-01 13:26:44.527');
INSERT INTO "public"."enrollment_status_types" VALUES (2, 'PENDING', 'Pending', 'في الانتظار', 'Enrollment is pending approval', 't', NULL, NULL, '2026-04-01 13:26:44.563', '2026-04-01 13:26:44.563');
INSERT INTO "public"."enrollment_status_types" VALUES (3, 'APPROVED', 'Approved', 'موافق عليه', 'Enrollment has been approved', 't', NULL, NULL, '2026-04-01 13:26:44.578', '2026-04-01 13:26:44.578');
INSERT INTO "public"."enrollment_status_types" VALUES (4, 'REJECTED', 'Rejected', 'مرفوض', 'Enrollment has been rejected', 't', NULL, NULL, '2026-04-01 13:26:44.586', '2026-04-01 13:26:44.586');
INSERT INTO "public"."enrollment_status_types" VALUES (5, 'COMPLETED', 'Completed', 'مكتمل', 'Student has completed the program', 't', NULL, NULL, '2026-04-01 13:26:44.614', '2026-04-01 13:26:44.614');
INSERT INTO "public"."enrollment_status_types" VALUES (6, 'DROPPED', 'Dropped', 'منسحب', 'Student has dropped from the program', 't', NULL, NULL, '2026-04-01 13:26:44.655', '2026-04-01 13:26:44.655');
INSERT INTO "public"."enrollment_status_types" VALUES (7, 'SUSPENDED', 'Suspended', 'موقوف', 'Student enrollment is suspended', 't', NULL, NULL, '2026-04-01 13:26:44.687', '2026-04-01 13:26:44.687');

-- ----------------------------
-- Table structure for enrollments
-- ----------------------------
DROP TABLE IF EXISTS "public"."enrollments";
CREATE TABLE "public"."enrollments" (
  "id" int4 NOT NULL DEFAULT nextval('enrollments_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "programId" int4 NOT NULL,
  "subjectId" int4 NOT NULL,
  "classId" int4 NOT NULL,
  "statusId" int4 NOT NULL,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of enrollments
-- ----------------------------
INSERT INTO "public"."enrollments" VALUES (1, 17, 1, 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.662', '2026-04-01 13:27:36.34');
INSERT INTO "public"."enrollments" VALUES (2, 18, 1, 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.676', '2026-04-01 13:27:36.356');
INSERT INTO "public"."enrollments" VALUES (3, 19, 1, 1, 2, 1, 1, NULL, '2026-04-01 13:26:47.684', '2026-04-01 13:27:36.375');
INSERT INTO "public"."enrollments" VALUES (4, 20, 1, 1, 2, 1, 1, NULL, '2026-04-01 13:26:47.693', '2026-04-01 13:27:36.391');
INSERT INTO "public"."enrollments" VALUES (5, 21, 1, 2, 3, 1, 1, NULL, '2026-04-01 13:26:47.702', '2026-04-01 13:27:36.416');
INSERT INTO "public"."enrollments" VALUES (6, 22, 1, 2, 3, 1, 1, NULL, '2026-04-01 13:26:47.71', '2026-04-01 13:27:36.427');
INSERT INTO "public"."enrollments" VALUES (7, 23, 1, 3, 4, 1, 1, NULL, '2026-04-01 13:26:47.719', '2026-04-01 13:27:36.44');
INSERT INTO "public"."enrollments" VALUES (8, 24, 1, 3, 4, 1, 1, NULL, '2026-04-01 13:26:47.729', '2026-04-01 13:27:36.455');
INSERT INTO "public"."enrollments" VALUES (9, 25, 2, 5, 5, 1, 1, NULL, '2026-04-01 13:26:47.736', '2026-04-01 13:27:36.468');
INSERT INTO "public"."enrollments" VALUES (10, 26, 2, 5, 5, 1, 1, NULL, '2026-04-01 13:26:47.746', '2026-04-01 13:27:36.483');
INSERT INTO "public"."enrollments" VALUES (11, 17, 2, 6, 6, 1, 1, NULL, '2026-04-01 13:26:47.753', '2026-04-01 13:27:36.492');
INSERT INTO "public"."enrollments" VALUES (12, 18, 2, 6, 6, 1, 1, NULL, '2026-04-01 13:26:47.759', '2026-04-01 13:27:36.5');
INSERT INTO "public"."enrollments" VALUES (13, 19, 3, 7, 7, 1, 1, NULL, '2026-04-01 13:26:47.767', '2026-04-01 13:27:36.52');
INSERT INTO "public"."enrollments" VALUES (14, 20, 3, 7, 7, 1, 1, NULL, '2026-04-01 13:26:47.776', '2026-04-01 13:27:36.535');
INSERT INTO "public"."enrollments" VALUES (15, 21, 3, 8, 8, 1, 1, NULL, '2026-04-01 13:26:47.785', '2026-04-01 13:27:36.552');
INSERT INTO "public"."enrollments" VALUES (16, 22, 3, 8, 8, 1, 1, NULL, '2026-04-01 13:26:47.794', '2026-04-01 13:27:36.567');

-- ----------------------------
-- Table structure for help_items
-- ----------------------------
DROP TABLE IF EXISTS "public"."help_items";
CREATE TABLE "public"."help_items" (
  "id" int4 NOT NULL DEFAULT nextval('help_items_id_seq'::regclass),
  "page" text COLLATE "pg_catalog"."default" NOT NULL,
  "section" text COLLATE "pg_catalog"."default" NOT NULL,
  "key" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleAr" text COLLATE "pg_catalog"."default",
  "contentEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "contentAr" text COLLATE "pg_catalog"."default",
  "order" int4 NOT NULL DEFAULT 0,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of help_items
-- ----------------------------

-- ----------------------------
-- Table structure for marks_distributions
-- ----------------------------
DROP TABLE IF EXISTS "public"."marks_distributions";
CREATE TABLE "public"."marks_distributions" (
  "id" int4 NOT NULL DEFAULT nextval('marks_distributions_id_seq'::regclass),
  "subjectId" int4 NOT NULL,
  "midTermExam" float8 NOT NULL DEFAULT 20,
  "finalExam" float8 NOT NULL DEFAULT 40,
  "homework" float8 NOT NULL DEFAULT 5,
  "labsProjectResearch" float8 NOT NULL DEFAULT 10,
  "quizzes" float8 NOT NULL DEFAULT 5,
  "participation" float8 NOT NULL DEFAULT 10,
  "attendance" float8 NOT NULL DEFAULT 10,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of marks_distributions
-- ----------------------------
INSERT INTO "public"."marks_distributions" VALUES (2, 4, 22, 38, 5, 10, 5, 10, 10, NULL, NULL, '2026-04-02 17:28:55.436', '2026-04-02 17:28:55.436');
INSERT INTO "public"."marks_distributions" VALUES (1, 3, 18, 42, 5, 10, 5, 10, 10, NULL, NULL, '2026-04-02 16:18:30.181', '2026-04-02 17:35:16.113');

-- ----------------------------
-- Table structure for participation_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."participation_types";
CREATE TABLE "public"."participation_types" (
  "id" int4 NOT NULL DEFAULT nextval('participation_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isPositive" bool NOT NULL DEFAULT true,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of participation_types
-- ----------------------------
INSERT INTO "public"."participation_types" VALUES (1, 'POSITIVE', 'Positive Participation', 'مشاركة إيجابية', 'Positive classroom participation', 't', 't', NULL, NULL, '2026-04-01 13:26:45.867', '2026-04-01 13:26:45.867');
INSERT INTO "public"."participation_types" VALUES (2, 'LATE', 'Late Arrival', 'تأخر عن الحضور', 'Student arrived late to class', 'f', 't', NULL, NULL, '2026-04-01 13:26:45.89', '2026-04-01 13:26:45.89');
INSERT INTO "public"."participation_types" VALUES (3, 'HELPFUL', 'Helpful Behavior', 'سلوك مساعد', 'Student helped others', 't', 't', NULL, NULL, '2026-04-01 13:26:45.899', '2026-04-01 13:26:45.899');
INSERT INTO "public"."participation_types" VALUES (4, 'DISRUPTIVE', 'Disruptive Behavior', 'سلوك مزعج', 'Student caused disruption in class', 'f', 't', NULL, NULL, '2026-04-01 13:26:45.909', '2026-04-01 13:26:45.909');
INSERT INTO "public"."participation_types" VALUES (5, 'EXCELLENT', 'Excellent Work', 'عمل ممتاز', 'Student demonstrated excellent understanding', 't', 't', NULL, NULL, '2026-04-01 13:26:45.922', '2026-04-01 13:26:45.922');

-- ----------------------------
-- Table structure for participations
-- ----------------------------
DROP TABLE IF EXISTS "public"."participations";
CREATE TABLE "public"."participations" (
  "id" int4 NOT NULL DEFAULT nextval('participations_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "classId" int4,
  "programId" int4,
  "subjectId" int4,
  "typeId" int4 NOT NULL,
  "points" int4 DEFAULT 0,
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "comment" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of participations
-- ----------------------------

-- ----------------------------
-- Table structure for penalties
-- ----------------------------
DROP TABLE IF EXISTS "public"."penalties";
CREATE TABLE "public"."penalties" (
  "id" int4 NOT NULL DEFAULT nextval('penalties_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "classId" int4,
  "programId" int4,
  "subjectId" int4,
  "typeId" int4 NOT NULL,
  "descriptionEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "points" int4 NOT NULL DEFAULT 0,
  "comment" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of penalties
-- ----------------------------

-- ----------------------------
-- Table structure for penalty_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."penalty_types";
CREATE TABLE "public"."penalty_types" (
  "id" int4 NOT NULL DEFAULT nextval('penalty_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "severity" text COLLATE "pg_catalog"."default" DEFAULT 'medium'::text,
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of penalty_types
-- ----------------------------
INSERT INTO "public"."penalty_types" VALUES (1, 'LATE_SUBMISSION', 'Late Submission', 'تقديم متأخر', 'Assignment submitted after deadline', 'low', '#FFA500', 't', NULL, NULL, '2026-04-01 13:26:44.847', '2026-04-01 13:26:44.847');
INSERT INTO "public"."penalty_types" VALUES (2, 'ABSENCE', 'Unexcused Absence', 'غياب بدون عذر', 'Absent without valid excuse', 'medium', '#FF6347', 't', NULL, NULL, '2026-04-01 13:26:44.878', '2026-04-01 13:26:44.878');
INSERT INTO "public"."penalty_types" VALUES (3, 'MISCONDUCT', 'Misconduct', 'سوء سلوك', 'Behavioral misconduct', 'high', '#DC143C', 't', NULL, NULL, '2026-04-01 13:26:44.921', '2026-04-01 13:26:44.921');
INSERT INTO "public"."penalty_types" VALUES (4, 'CHEATING', 'Cheating', 'غش', 'Academic dishonesty', 'high', '#8B0000', 't', NULL, NULL, '2026-04-01 13:26:44.943', '2026-04-01 13:26:44.943');
INSERT INTO "public"."penalty_types" VALUES (5, 'PLAGIARISM', 'Plagiarism', 'انتحال', 'Plagiarized work', 'high', '#8B0000', 't', NULL, NULL, '2026-04-01 13:26:44.96', '2026-04-01 13:26:44.96');
INSERT INTO "public"."penalty_types" VALUES (6, 'DISRUPTION', 'Class Disruption', 'تعطيل الفصل', 'Disrupting class activities', 'medium', '#FF4500', 't', NULL, NULL, '2026-04-01 13:26:44.975', '2026-04-01 13:26:44.975');
INSERT INTO "public"."penalty_types" VALUES (7, 'DRESS_CODE', 'Dress Code Violation', 'مخالفة قواعد اللباس', 'Violation of dress code', 'low', '#FFD700', 't', NULL, NULL, '2026-04-01 13:26:44.991', '2026-04-01 13:26:44.991');

-- ----------------------------
-- Table structure for priority_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."priority_types";
CREATE TABLE "public"."priority_types" (
  "id" int4 NOT NULL DEFAULT nextval('priority_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "level" int4 NOT NULL DEFAULT 0,
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of priority_types
-- ----------------------------
INSERT INTO "public"."priority_types" VALUES (1, 'LOW', 'Low Priority', 'أولوية منخفضة', 'Low priority announcement', 1, '#6C757D', 't', NULL, NULL, '2026-04-01 13:26:45.252', '2026-04-01 13:26:45.252');
INSERT INTO "public"."priority_types" VALUES (2, 'NORMAL', 'Normal Priority', 'أولوية عادية', 'Normal priority announcement', 2, '#007BFF', 't', NULL, NULL, '2026-04-01 13:26:45.276', '2026-04-01 13:26:45.276');
INSERT INTO "public"."priority_types" VALUES (3, 'HIGH', 'High Priority', 'أولوية عالية', 'High priority announcement', 3, '#FFC107', 't', NULL, NULL, '2026-04-01 13:26:45.29', '2026-04-01 13:26:45.29');
INSERT INTO "public"."priority_types" VALUES (4, 'URGENT', 'Urgent', 'عاجل', 'Urgent announcement', 4, '#DC3545', 't', NULL, NULL, '2026-04-01 13:26:45.306', '2026-04-01 13:26:45.306');
INSERT INTO "public"."priority_types" VALUES (5, 'CRITICAL', 'Critical', 'حرج', 'Critical announcement', 5, '#8B0000', 't', NULL, NULL, '2026-04-01 13:26:45.326', '2026-04-01 13:26:45.326');

-- ----------------------------
-- Table structure for private_workspace_links
-- ----------------------------
DROP TABLE IF EXISTS "public"."private_workspace_links";
CREATE TABLE "public"."private_workspace_links" (
  "id" int4 NOT NULL DEFAULT nextval('private_workspace_links_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "nextcloudFolderId" text COLLATE "pg_catalog"."default" NOT NULL,
  "nextcloudFolderPath" text COLLATE "pg_catalog"."default" NOT NULL,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of private_workspace_links
-- ----------------------------

-- ----------------------------
-- Table structure for programs
-- ----------------------------
DROP TABLE IF EXISTS "public"."programs";
CREATE TABLE "public"."programs" (
  "id" int4 NOT NULL DEFAULT nextval('programs_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "durationYears" int4,
  "minGPA" float8,
  "totalCreditHours" int4,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of programs
-- ----------------------------
INSERT INTO "public"."programs" VALUES (1, 'CS-ENG', 'Computer Science Engineering', 'هندسة علوم الحاسوب', 'Bachelor degree in Computer Science Engineering', 'بكالوريوس في هندسة علوم الحاسوب', 4, NULL, NULL, 't', 1, NULL, '2026-04-01 13:26:47.081', '2026-04-01 13:27:35.885');
INSERT INTO "public"."programs" VALUES (2, 'ME-ENG', 'Mechanical Engineering', 'الهندسة الميكانيكية', 'Bachelor degree in Mechanical Engineering', 'بكالوريوس في الهندسة الميكانيكية', 4, NULL, NULL, 't', 1, NULL, '2026-04-01 13:26:47.106', '2026-04-01 13:27:35.894');
INSERT INTO "public"."programs" VALUES (3, 'EE-ENG', 'Electrical Engineering', 'الهندسة الكهربائية', 'Bachelor degree in Electrical Engineering', 'بكالوريوس في الهندسة الكهربائية', 4, NULL, NULL, 't', 1, NULL, '2026-04-01 13:26:47.114', '2026-04-01 13:27:35.899');
INSERT INTO "public"."programs" VALUES (4, 'CE-ENG', 'Civil Engineering', 'الهندسة المدنية', 'Bachelor degree in Civil Engineering', 'بكالوريوس في الهندسة المدنية', 4, NULL, NULL, 't', 1, NULL, '2026-04-01 13:26:47.124', '2026-04-01 13:27:35.905');

-- ----------------------------
-- Table structure for question_difficulty_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."question_difficulty_types";
CREATE TABLE "public"."question_difficulty_types" (
  "id" int4 NOT NULL DEFAULT nextval('question_difficulty_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of question_difficulty_types
-- ----------------------------
INSERT INTO "public"."question_difficulty_types" VALUES (1, 'EASY', 'Easy', 'سهل', 'Basic difficulty level', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.252', '2026-04-01 13:26:46.252');
INSERT INTO "public"."question_difficulty_types" VALUES (2, 'MEDIUM', 'Medium', 'متوسط', 'Intermediate difficulty level', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.262', '2026-04-01 13:26:46.262');
INSERT INTO "public"."question_difficulty_types" VALUES (3, 'HARD', 'Hard', 'صعب', 'Advanced difficulty level', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.269', '2026-04-01 13:26:46.269');
INSERT INTO "public"."question_difficulty_types" VALUES (4, 'EXPERT', 'Expert', 'خبير', 'Expert difficulty level', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.277', '2026-04-01 13:26:46.277');

-- ----------------------------
-- Table structure for question_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."question_types";
CREATE TABLE "public"."question_types" (
  "id" int4 NOT NULL DEFAULT nextval('question_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of question_types
-- ----------------------------
INSERT INTO "public"."question_types" VALUES (1, 'MULTIPLE_CHOICE', 'Multiple Choice', 'اختيار من متعدد', 'Multiple choice question', 't', NULL, NULL, '2026-04-01 13:26:45.585', '2026-04-01 13:26:45.585');
INSERT INTO "public"."question_types" VALUES (2, 'TRUE_FALSE', 'True/False', 'صح/خطأ', 'True or false question', 't', NULL, NULL, '2026-04-01 13:26:45.61', '2026-04-01 13:26:45.61');
INSERT INTO "public"."question_types" VALUES (3, 'SHORT_ANSWER', 'Short Answer', 'إجابة قصيرة', 'Short answer question', 't', NULL, NULL, '2026-04-01 13:26:45.622', '2026-04-01 13:26:45.622');
INSERT INTO "public"."question_types" VALUES (4, 'ESSAY', 'Essay', 'مقال', 'Essay question', 't', NULL, NULL, '2026-04-01 13:26:45.632', '2026-04-01 13:26:45.632');
INSERT INTO "public"."question_types" VALUES (5, 'FILL_BLANK', 'Fill in the Blank', 'املأ الفراغ', 'Fill in the blank question', 't', NULL, NULL, '2026-04-01 13:26:45.656', '2026-04-01 13:26:45.656');

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS "public"."questions";
CREATE TABLE "public"."questions" (
  "id" int4 NOT NULL DEFAULT nextval('questions_id_seq'::regclass),
  "quizId" int4 NOT NULL,
  "questionEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "questionAr" text COLLATE "pg_catalog"."default",
  "typeId" int4 NOT NULL,
  "options" text COLLATE "pg_catalog"."default",
  "correctAnswer" text COLLATE "pg_catalog"."default",
  "points" float8 NOT NULL DEFAULT 1,
  "order" int4 NOT NULL DEFAULT 0,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of questions
-- ----------------------------

-- ----------------------------
-- Table structure for quiz_attempts
-- ----------------------------
DROP TABLE IF EXISTS "public"."quiz_attempts";
CREATE TABLE "public"."quiz_attempts" (
  "id" int4 NOT NULL DEFAULT nextval('quiz_attempts_id_seq'::regclass),
  "quizId" int4 NOT NULL,
  "userId" int4 NOT NULL,
  "score" float8,
  "maxScore" float8,
  "percentage" float8,
  "passed" bool,
  "startedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" timestamp(3),
  "timeSpent" int4,
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of quiz_attempts
-- ----------------------------

-- ----------------------------
-- Table structure for quiz_status_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."quiz_status_types";
CREATE TABLE "public"."quiz_status_types" (
  "id" int4 NOT NULL DEFAULT nextval('quiz_status_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of quiz_status_types
-- ----------------------------
INSERT INTO "public"."quiz_status_types" VALUES (1, 'DRAFT', 'Draft', 'مسودة', 'Quiz is being created', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.193', '2026-04-01 13:26:46.193');
INSERT INTO "public"."quiz_status_types" VALUES (2, 'PUBLISHED', 'Published', 'منشور', 'Quiz is published and available', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.203', '2026-04-01 13:26:46.203');
INSERT INTO "public"."quiz_status_types" VALUES (3, 'ACTIVE', 'Active', 'نشط', 'Quiz is currently active', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.211', '2026-04-01 13:26:46.211');
INSERT INTO "public"."quiz_status_types" VALUES (4, 'CLOSED', 'Closed', 'مغلق', 'Quiz is closed for submissions', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.219', '2026-04-01 13:26:46.219');
INSERT INTO "public"."quiz_status_types" VALUES (5, 'GRADED', 'Graded', 'مصحح', 'Quiz has been graded', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.227', '2026-04-01 13:26:46.227');
INSERT INTO "public"."quiz_status_types" VALUES (6, 'ARCHIVED', 'Archived', 'مؤرشف', 'Quiz is archived', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.238', '2026-04-01 13:26:46.238');

-- ----------------------------
-- Table structure for quizzes
-- ----------------------------
DROP TABLE IF EXISTS "public"."quizzes";
CREATE TABLE "public"."quizzes" (
  "id" int4 NOT NULL DEFAULT nextval('quizzes_id_seq'::regclass),
  "titleEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "duration" int4 NOT NULL DEFAULT 60,
  "maxAttempts" int4 NOT NULL DEFAULT 1,
  "passingScore" float8 NOT NULL DEFAULT 60,
  "randomizeQuestions" bool NOT NULL DEFAULT false,
  "randomizeAnswers" bool NOT NULL DEFAULT false,
  "showCorrectAnswers" bool NOT NULL DEFAULT false,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of quizzes
-- ----------------------------

-- ----------------------------
-- Table structure for requirement_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."requirement_types";
CREATE TABLE "public"."requirement_types" (
  "id" int4 NOT NULL DEFAULT nextval('requirement_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of requirement_types
-- ----------------------------
INSERT INTO "public"."requirement_types" VALUES (1, 'MANDATORY', 'Mandatory', 'إلزامي', 'Required subject for graduation', 't', NULL, NULL, '2026-04-01 13:26:44.781', '2026-04-01 13:26:44.781');
INSERT INTO "public"."requirement_types" VALUES (2, 'OPTIONAL', 'Optional', 'اختياري', 'Not required but recommended', 't', NULL, NULL, '2026-04-01 13:26:44.808', '2026-04-01 13:26:44.808');
INSERT INTO "public"."requirement_types" VALUES (3, 'PREREQUISITE', 'Prerequisite', 'مطلب سابق', 'Required before taking other subjects', 't', NULL, NULL, '2026-04-01 13:26:44.822', '2026-04-01 13:26:44.822');

-- ----------------------------
-- Table structure for resource_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."resource_types";
CREATE TABLE "public"."resource_types" (
  "id" int4 NOT NULL DEFAULT nextval('resource_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "icon" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of resource_types
-- ----------------------------
INSERT INTO "public"."resource_types" VALUES (1, 'DOCUMENT', 'Document', 'مستند', 'Document file', 'file-text', 't', NULL, NULL, '2026-04-01 13:26:45.364', '2026-04-01 13:26:45.364');
INSERT INTO "public"."resource_types" VALUES (2, 'VIDEO', 'Video', 'فيديو', 'Video file', 'video', 't', NULL, NULL, '2026-04-01 13:26:45.383', '2026-04-01 13:26:45.383');
INSERT INTO "public"."resource_types" VALUES (3, 'AUDIO', 'Audio', 'صوت', 'Audio file', 'music', 't', NULL, NULL, '2026-04-01 13:26:45.399', '2026-04-01 13:26:45.399');
INSERT INTO "public"."resource_types" VALUES (4, 'IMAGE', 'Image', 'صورة', 'Image file', 'image', 't', NULL, NULL, '2026-04-01 13:26:45.431', '2026-04-01 13:26:45.431');
INSERT INTO "public"."resource_types" VALUES (5, 'PRESENTATION', 'Presentation', 'عرض تقديمي', 'Presentation file', 'presentation', 't', NULL, NULL, '2026-04-01 13:26:45.449', '2026-04-01 13:26:45.449');
INSERT INTO "public"."resource_types" VALUES (6, 'SPREADSHEET', 'Spreadsheet', 'جدول بيانات', 'Spreadsheet file', 'table', 't', NULL, NULL, '2026-04-01 13:26:45.463', '2026-04-01 13:26:45.463');
INSERT INTO "public"."resource_types" VALUES (7, 'LINK', 'External Link', 'رابط خارجي', 'External URL', 'link', 't', NULL, NULL, '2026-04-01 13:26:45.475', '2026-04-01 13:26:45.475');
INSERT INTO "public"."resource_types" VALUES (8, 'ARCHIVE', 'Archive', 'أرشيف', 'Compressed archive', 'archive', 't', NULL, NULL, '2026-04-01 13:26:45.484', '2026-04-01 13:26:45.484');

-- ----------------------------
-- Table structure for resources
-- ----------------------------
DROP TABLE IF EXISTS "public"."resources";
CREATE TABLE "public"."resources" (
  "id" int4 NOT NULL DEFAULT nextval('resources_id_seq'::regclass),
  "classId" int4,
  "titleEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "titleAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default",
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "typeId" int4 NOT NULL,
  "categoryId" int4,
  "isRequired" bool NOT NULL DEFAULT false,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "downloadCount" int4 NOT NULL DEFAULT 0,
  "programId" int4,
  "subjectId" int4,
  "dueDate" timestamp(3),
  "featured" bool NOT NULL DEFAULT false,
  "url" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of resources
-- ----------------------------
INSERT INTO "public"."resources" VALUES (1, 1, 'Python Programming Guide', 'دليل برمجة بايثون', 'Comprehensive guide to Python programming', 'دليل شامل لبرمجة بايثون', 1, 1, 'f', 't', 1, NULL, '2026-04-01 13:26:47.829', '2026-04-01 13:26:47.829', 0, NULL, 1, NULL, 'f', '/resources/python-guide.pdf');
INSERT INTO "public"."resources" VALUES (2, 3, 'Data Structures Video Tutorial', 'فيديو تعليمي لهياكل البيانات', 'Video tutorial on data structures', 'فيديو تعليمي لهياكل البيانات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:26:47.84', '2026-04-01 13:26:47.84', 0, NULL, 2, NULL, 'f', '/resources/data-structures.mp4');
INSERT INTO "public"."resources" VALUES (3, 5, 'Engineering Mathematics Textbook', 'كتاب الرياضيات الهندسية', 'Complete textbook for engineering mathematics', 'كتاب كامل للرياضيات الهندسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:26:47.845', '2026-04-01 13:26:47.845', 0, NULL, 5, NULL, 'f', '/resources/math-textbook.pdf');
INSERT INTO "public"."resources" VALUES (4, 1, 'Python Lab Manual', 'دليل مختبر بايثون', 'Laboratory manual for Python programming', 'دليل المختبر لبرمجة بايثون', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:26:47.852', '2026-04-01 13:26:47.852', 0, NULL, 1, NULL, 'f', '/resources/lab-manual.pdf');
INSERT INTO "public"."resources" VALUES (5, 3, 'Algorithm Visualization', 'تصور الخوارزميات', 'Interactive algorithm visualizations', 'تصورات تفاعلية للخوارزميات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:26:47.858', '2026-04-01 13:26:47.858', 0, NULL, 2, NULL, 'f', '/resources/algorithms-visualization.mp4');
INSERT INTO "public"."resources" VALUES (6, 7, 'Circuit Analysis Notes', 'ملاحظات تحليل الدوائر', 'Comprehensive notes on circuit analysis', 'ملاحظات شاملة حول تحليل الدوائر', 1, 1, 'f', 't', 1, NULL, '2026-04-01 13:26:47.866', '2026-04-01 13:26:47.866', 0, NULL, 7, NULL, 'f', '/resources/circuit-notes.pdf');
INSERT INTO "public"."resources" VALUES (7, 4, 'Database Design Tutorial', 'دليل تصميم قواعد البيانات', 'Step-by-step database design guide', 'دليل خطوة بخطوة لتصميم قواعد البيانات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:26:47.871', '2026-04-01 13:26:47.871', 0, NULL, 3, NULL, 'f', '/resources/database-tutorial.mp4');
INSERT INTO "public"."resources" VALUES (8, 6, 'Thermodynamics Formulas', 'معادلات الديناميكا الحرارية', 'Essential thermodynamics formulas and equations', 'معادلات الديناميكا الحرارية الأساسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:26:47.876', '2026-04-01 13:26:47.876', 0, NULL, 6, NULL, 'f', '/resources/thermo-formulas.pdf');
INSERT INTO "public"."resources" VALUES (9, 4, 'Software Engineering Case Studies', 'دراسات حالة في هندسة البرمجيات', 'Real-world software engineering case studies', 'دراسات حالة واقعية في هندسة البرمجيات', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:26:47.882', '2026-04-01 13:26:47.882', 0, NULL, 4, NULL, 'f', '/resources/se-case-studies.pdf');
INSERT INTO "public"."resources" VALUES (10, 8, 'Digital Logic Lab Guide', 'دليل مختبر المنطق الرقمي', 'Laboratory guide for digital logic experiments', 'دليل المختبر لتجارب المنطق الرقمي', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:26:47.888', '2026-04-01 13:26:47.888', 0, NULL, 8, NULL, 'f', '/resources/digital-lab-guide.pdf');
INSERT INTO "public"."resources" VALUES (11, 2, 'Programming Exercises', 'تمارين البرمجة', 'Collection of programming exercises and solutions', 'مجموعة من تمارين البرمجة والحلول', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:26:47.894', '2026-04-01 13:26:47.894', 0, NULL, 1, NULL, 'f', '/resources/programming-exercises.pdf');
INSERT INTO "public"."resources" VALUES (12, 5, 'Engineering Mathematics Solutions', 'حلول الرياضيات الهندسية', 'Step-by-step solutions to engineering math problems', 'حلول خطوة بخطوة لمسائل الرياضيات الهندسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:26:47.899', '2026-04-01 13:26:47.899', 0, NULL, 5, NULL, 'f', '/resources/math-solutions.pdf');
INSERT INTO "public"."resources" VALUES (13, 2, 'Advanced Python Topics', 'مواضيع بايثون المتقدمة', 'Advanced Python programming concepts and techniques', 'مفاهيم وتقنيات برمجة بايثون المتقدمة', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:26:47.905', '2026-04-01 13:26:47.905', 0, NULL, 1, NULL, 'f', '/resources/advanced-python.mp4');
INSERT INTO "public"."resources" VALUES (14, 6, 'Mechanical Engineering Workshop', 'ورشة هندسة ميكانيكية', 'Practical workshop for mechanical engineering students', 'ورشة عملية لطلاب الهندسة الميكانيكية', 1, 5, 'f', 't', 1, NULL, '2026-04-01 13:26:47.912', '2026-04-01 13:26:47.912', 0, NULL, 6, NULL, 'f', '/resources/me-workshop.pdf');
INSERT INTO "public"."resources" VALUES (15, 7, 'Electrical Safety Guidelines', 'إرشادات السلامة الكهربائية', 'Safety guidelines for electrical engineering labs', 'إرشادات السلامة لمختبرات الهندسة الكهربائية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:26:47.917', '2026-04-01 13:26:47.917', 0, NULL, 7, NULL, 'f', '/resources/electrical-safety.pdf');
INSERT INTO "public"."resources" VALUES (16, 1, 'Python Programming Guide', 'دليل برمجة بايثون', 'Comprehensive guide to Python programming', 'دليل شامل لبرمجة بايثون', 1, 1, 'f', 't', 1, NULL, '2026-04-01 13:27:36.61', '2026-04-01 13:27:36.61', 0, NULL, 1, NULL, 'f', '/resources/python-guide.pdf');
INSERT INTO "public"."resources" VALUES (17, 3, 'Data Structures Video Tutorial', 'فيديو تعليمي لهياكل البيانات', 'Video tutorial on data structures', 'فيديو تعليمي لهياكل البيانات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:27:36.624', '2026-04-01 13:27:36.624', 0, NULL, 2, NULL, 'f', '/resources/data-structures.mp4');
INSERT INTO "public"."resources" VALUES (18, 5, 'Engineering Mathematics Textbook', 'كتاب الرياضيات الهندسية', 'Complete textbook for engineering mathematics', 'كتاب كامل للرياضيات الهندسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:27:36.631', '2026-04-01 13:27:36.631', 0, NULL, 5, NULL, 'f', '/resources/math-textbook.pdf');
INSERT INTO "public"."resources" VALUES (19, 1, 'Python Lab Manual', 'دليل مختبر بايثون', 'Laboratory manual for Python programming', 'دليل المختبر لبرمجة بايثون', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:27:36.637', '2026-04-01 13:27:36.637', 0, NULL, 1, NULL, 'f', '/resources/lab-manual.pdf');
INSERT INTO "public"."resources" VALUES (20, 3, 'Algorithm Visualization', 'تصور الخوارزميات', 'Interactive algorithm visualizations', 'تصورات تفاعلية للخوارزميات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:27:36.644', '2026-04-01 13:27:36.644', 0, NULL, 2, NULL, 'f', '/resources/algorithms-visualization.mp4');
INSERT INTO "public"."resources" VALUES (21, 7, 'Circuit Analysis Notes', 'ملاحظات تحليل الدوائر', 'Comprehensive notes on circuit analysis', 'ملاحظات شاملة حول تحليل الدوائر', 1, 1, 'f', 't', 1, NULL, '2026-04-01 13:27:36.652', '2026-04-01 13:27:36.652', 0, NULL, 7, NULL, 'f', '/resources/circuit-notes.pdf');
INSERT INTO "public"."resources" VALUES (22, 4, 'Database Design Tutorial', 'دليل تصميم قواعد البيانات', 'Step-by-step database design guide', 'دليل خطوة بخطوة لتصميم قواعد البيانات', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:27:36.658', '2026-04-01 13:27:36.658', 0, NULL, 3, NULL, 'f', '/resources/database-tutorial.mp4');
INSERT INTO "public"."resources" VALUES (23, 6, 'Thermodynamics Formulas', 'معادلات الديناميكا الحرارية', 'Essential thermodynamics formulas and equations', 'معادلات الديناميكا الحرارية الأساسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:27:36.664', '2026-04-01 13:27:36.664', 0, NULL, 6, NULL, 'f', '/resources/thermo-formulas.pdf');
INSERT INTO "public"."resources" VALUES (24, 4, 'Software Engineering Case Studies', 'دراسات حالة في هندسة البرمجيات', 'Real-world software engineering case studies', 'دراسات حالة واقعية في هندسة البرمجيات', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:27:36.67', '2026-04-01 13:27:36.67', 0, NULL, 4, NULL, 'f', '/resources/se-case-studies.pdf');
INSERT INTO "public"."resources" VALUES (25, 8, 'Digital Logic Lab Guide', 'دليل مختبر المنطق الرقمي', 'Laboratory guide for digital logic experiments', 'دليل المختبر لتجارب المنطق الرقمي', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:27:36.676', '2026-04-01 13:27:36.676', 0, NULL, 8, NULL, 'f', '/resources/digital-lab-guide.pdf');
INSERT INTO "public"."resources" VALUES (26, 2, 'Programming Exercises', 'تمارين البرمجة', 'Collection of programming exercises and solutions', 'مجموعة من تمارين البرمجة والحلول', 1, 2, 'f', 't', 1, NULL, '2026-04-01 13:27:36.682', '2026-04-01 13:27:36.682', 0, NULL, 1, NULL, 'f', '/resources/programming-exercises.pdf');
INSERT INTO "public"."resources" VALUES (27, 5, 'Engineering Mathematics Solutions', 'حلول الرياضيات الهندسية', 'Step-by-step solutions to engineering math problems', 'حلول خطوة بخطوة لمسائل الرياضيات الهندسية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:27:36.687', '2026-04-01 13:27:36.687', 0, NULL, 5, NULL, 'f', '/resources/math-solutions.pdf');
INSERT INTO "public"."resources" VALUES (28, 2, 'Advanced Python Topics', 'مواضيع بايثون المتقدمة', 'Advanced Python programming concepts and techniques', 'مفاهيم وتقنيات برمجة بايثون المتقدمة', 2, 5, 'f', 't', 1, NULL, '2026-04-01 13:27:36.693', '2026-04-01 13:27:36.693', 0, NULL, 1, NULL, 'f', '/resources/advanced-python.mp4');
INSERT INTO "public"."resources" VALUES (29, 6, 'Mechanical Engineering Workshop', 'ورشة هندسة ميكانيكية', 'Practical workshop for mechanical engineering students', 'ورشة عملية لطلاب الهندسة الميكانيكية', 1, 5, 'f', 't', 1, NULL, '2026-04-01 13:27:36.7', '2026-04-01 13:27:36.7', 0, NULL, 6, NULL, 'f', '/resources/me-workshop.pdf');
INSERT INTO "public"."resources" VALUES (30, 7, 'Electrical Safety Guidelines', 'إرشادات السلامة الكهربائية', 'Safety guidelines for electrical engineering labs', 'إرشادات السلامة لمختبرات الهندسة الكهربائية', 1, 4, 'f', 't', 1, NULL, '2026-04-01 13:27:36.705', '2026-04-01 13:27:36.705', 0, NULL, 7, NULL, 'f', '/resources/electrical-safety.pdf');

-- ----------------------------
-- Table structure for schedule_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."schedule_types";
CREATE TABLE "public"."schedule_types" (
  "id" int4 NOT NULL DEFAULT nextval('schedule_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "icon" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of schedule_types
-- ----------------------------
INSERT INTO "public"."schedule_types" VALUES (1, 'REGULAR', 'Regular Class', 'فصل عادي', 'Regular scheduled class', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.292', '2026-04-01 13:26:46.292');
INSERT INTO "public"."schedule_types" VALUES (2, 'MAKEUP', 'Makeup Class', 'فصل تعويضي', 'Makeup class session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.304', '2026-04-01 13:26:46.304');
INSERT INTO "public"."schedule_types" VALUES (3, 'EXTRA', 'Extra Class', 'فصل إضافي', 'Extra help session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.311', '2026-04-01 13:26:46.311');
INSERT INTO "public"."schedule_types" VALUES (4, 'REVIEW', 'Review Session', 'جلسة مراجعة', 'Exam review session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.318', '2026-04-01 13:26:46.318');
INSERT INTO "public"."schedule_types" VALUES (5, 'LAB', 'Lab Session', 'جلسة معمل', 'Laboratory session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.326', '2026-04-01 13:26:46.326');
INSERT INTO "public"."schedule_types" VALUES (6, 'TUTORIAL', 'Tutorial', 'درس تعليمي', 'Tutorial session', NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:46.333', '2026-04-01 13:26:46.333');

-- ----------------------------
-- Table structure for standup_attendances
-- ----------------------------
DROP TABLE IF EXISTS "public"."standup_attendances";
CREATE TABLE "public"."standup_attendances" (
  "id" int4 NOT NULL DEFAULT nextval('standup_attendances_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "date" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusId" int4 NOT NULL,
  "notes" text COLLATE "pg_catalog"."default",
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "programId" int4
)
;

-- ----------------------------
-- Records of standup_attendances
-- ----------------------------
INSERT INTO "public"."standup_attendances" VALUES (63, 24, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, NULL, '2026-04-12 18:01:02.896', '2026-04-12 18:01:02.896', 1);
INSERT INTO "public"."standup_attendances" VALUES (64, 23, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, NULL, '2026-04-12 18:01:02.971', '2026-04-12 18:01:02.971', 1);
INSERT INTO "public"."standup_attendances" VALUES (65, 22, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, NULL, '2026-04-12 18:01:03.037', '2026-04-12 18:01:03.037', 1);
INSERT INTO "public"."standup_attendances" VALUES (66, 21, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, NULL, '2026-04-12 18:01:03.168', '2026-04-12 18:01:03.168', 1);
INSERT INTO "public"."standup_attendances" VALUES (59, 20, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, 1, '2026-04-12 17:41:38.338', '2026-04-12 18:01:03.242', 1);
INSERT INTO "public"."standup_attendances" VALUES (62, 19, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, 1, '2026-04-12 17:59:54.233', '2026-04-12 18:01:03.329', 1);
INSERT INTO "public"."standup_attendances" VALUES (60, 18, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, 1, '2026-04-12 17:41:41.926', '2026-04-12 18:01:03.355', 1);
INSERT INTO "public"."standup_attendances" VALUES (58, 17, '2026-04-12 00:00:00', 10, 'STANDUP_CLINIC', 1, 1, '2026-04-12 17:41:34.438', '2026-04-12 18:01:03.381', 1);
INSERT INTO "public"."standup_attendances" VALUES (68, 17, '2026-04-13 00:00:00', 7, 'STANDUP_PRESENT', 6, NULL, '2026-04-13 13:15:32.929', '2026-04-13 13:15:32.929', 1);
INSERT INTO "public"."standup_attendances" VALUES (43, 22, '2026-04-11 00:00:00', 7, 'STANDUP_PRESENT', NULL, NULL, '2026-04-11 10:04:43.332', '2026-04-11 10:26:27.69', 1);
INSERT INTO "public"."standup_attendances" VALUES (44, 21, '2026-04-11 00:00:00', 7, 'STANDUP_PRESENT', NULL, NULL, '2026-04-11 10:04:43.354', '2026-04-11 10:26:27.744', 1);
INSERT INTO "public"."standup_attendances" VALUES (45, 20, '2026-04-11 00:00:00', 7, 'STANDUP_PRESENT', NULL, NULL, '2026-04-11 10:04:43.378', '2026-04-11 10:26:27.938', 1);
INSERT INTO "public"."standup_attendances" VALUES (46, 19, '2026-04-11 00:00:00', 7, 'STANDUP_PRESENT', NULL, NULL, '2026-04-11 10:04:43.403', '2026-04-11 10:26:28.001', 1);
INSERT INTO "public"."standup_attendances" VALUES (41, 24, '2026-04-11 00:00:00', 8, 'STANDUP_LATE', NULL, NULL, '2026-04-11 10:04:43.254', '2026-04-11 11:28:04.959', 1);
INSERT INTO "public"."standup_attendances" VALUES (40, 18, '2026-04-11 00:00:00', 10, 'STANDUP_CLINIC', NULL, NULL, '2026-04-11 09:52:37.551', '2026-04-11 11:30:10.077', 1);
INSERT INTO "public"."standup_attendances" VALUES (48, 17, '2026-04-11 00:00:00', 10, 'STANDUP_CLINIC', NULL, NULL, '2026-04-11 10:53:41.348', '2026-04-11 12:00:22.422', 1);
INSERT INTO "public"."standup_attendances" VALUES (42, 23, '2026-04-11 00:00:00', 10, 'STANDUP_CLINIC', NULL, NULL, '2026-04-11 10:04:43.311', '2026-04-11 13:02:56.967', 1);

-- ----------------------------
-- Table structure for student_marks
-- ----------------------------
DROP TABLE IF EXISTS "public"."student_marks";
CREATE TABLE "public"."student_marks" (
  "id" int4 NOT NULL DEFAULT nextval('student_marks_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "subjectId" int4 NOT NULL,
  "classId" int4 NOT NULL,
  "midTermExam" float8,
  "finalExam" float8,
  "homework" float8,
  "labsProjectResearch" float8,
  "quizzes" float8,
  "participation" float8,
  "attendance" float8,
  "totalMarks" float8,
  "letterGrade" text COLLATE "pg_catalog"."default",
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "isRepeated" bool NOT NULL DEFAULT false,
  "gradeType" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'calculated'::text
)
;

-- ----------------------------
-- Records of student_marks
-- ----------------------------
INSERT INTO "public"."student_marks" VALUES (1, 1, 3, 1, 85, 90, 95, 88, 92, 87, 95, 89.44999999999999, 'B+', NULL, NULL, '2026-04-02 18:04:28.144', '2026-04-02 18:21:42.098', 'f', 'calculated');
INSERT INTO "public"."student_marks" VALUES (2, 2, 3, 1, 85, 90, 95, 88, 92, 87, 95, 89.44999999999999, 'B+', NULL, NULL, '2026-04-02 18:22:03.892', '2026-04-02 18:22:03.892', 't', 'calculated');
INSERT INTO "public"."student_marks" VALUES (9, 24, 3, 4, 2, 0, 0, 0, 5, 0, 0, 7, 'F', NULL, NULL, '2026-04-03 19:14:04.581', '2026-04-04 11:17:58.883', 'f', 'calculated');
INSERT INTO "public"."student_marks" VALUES (5, 21, 2, 3, 18, 35, 5, 6, 5, 10, 2, 0, 'F', NULL, NULL, '2026-04-03 07:47:35.385', '2026-04-04 06:26:40.629', 't', 'calculated');
INSERT INTO "public"."student_marks" VALUES (4, 21, 2, 3, 18, 35, 5, 6, 5, 10, 0, 0, 'F', NULL, NULL, '2026-04-03 07:33:27.211', '2026-04-04 06:26:54.137', 'f', 'calculated');
INSERT INTO "public"."student_marks" VALUES (10, 24, 3, 4, 2, 7, 4, 0, 1, 5, 6, 25, 'F', NULL, NULL, '2026-04-03 19:30:45.267', '2026-04-04 11:32:33.707', 't', 'calculated');
INSERT INTO "public"."student_marks" VALUES (6, 23, 3, 4, 18, 30, 5, 10, 5, 10, 10, 88, 'B', NULL, NULL, '2026-04-03 10:19:21.414', '2026-04-04 11:32:54.105', 't', 'calculated');
INSERT INTO "public"."student_marks" VALUES (7, 19, 7, 7, 0, 0, 2, 0, 0, 0, 5, 0, 'F', NULL, NULL, '2026-04-03 18:54:08.558', '2026-04-03 18:58:15.846', 'f', 'calculated');
INSERT INTO "public"."student_marks" VALUES (8, 21, 8, 8, 20, 0, 0, 0, 0, 0, 0, 0, 'F', NULL, NULL, '2026-04-03 18:59:09.453', '2026-04-03 18:59:09.453', 'f', 'calculated');
INSERT INTO "public"."student_marks" VALUES (3, 23, 3, 4, 18, 30, 5, 8, 5, 10, 10, 86, 'B', NULL, 1, '2026-04-02 19:59:43.561', '2026-04-04 12:28:34.955', 'f', 'calculated');

-- ----------------------------
-- Table structure for student_marks_history
-- ----------------------------
DROP TABLE IF EXISTS "public"."student_marks_history";
CREATE TABLE "public"."student_marks_history" (
  "id" int4 NOT NULL DEFAULT nextval('student_marks_history_id_seq'::regclass),
  "studentMarksId" int4 NOT NULL,
  "userId" int4 NOT NULL,
  "subjectId" int4 NOT NULL,
  "classId" int4 NOT NULL,
  "actionType" text COLLATE "pg_catalog"."default" NOT NULL,
  "actionBy" int4,
  "previousState" jsonb,
  "newState" jsonb NOT NULL,
  "changedFields" jsonb,
  "isRepeated" bool,
  "gradeType" text COLLATE "pg_catalog"."default",
  "midTermExam" float8,
  "finalExam" float8,
  "homework" float8,
  "labsProjectResearch" float8,
  "quizzes" float8,
  "participation" float8,
  "attendance" float8,
  "totalMarks" float8,
  "letterGrade" text COLLATE "pg_catalog"."default",
  "actionReason" text COLLATE "pg_catalog"."default",
  "ipAddress" text COLLATE "pg_catalog"."default",
  "userAgent" text COLLATE "pg_catalog"."default",
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of student_marks_history
-- ----------------------------
INSERT INTO "public"."student_marks_history" VALUES (6, 3, 23, 3, 4, 'updated', 1, '"{\"id\":3,\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":5,\"participation\":10,\"attendance\":10,\"totalMarks\":88,\"letterGrade\":\"B+\",\"createdBy\":null,\"updatedBy\":1,\"createdAt\":\"2026-04-02T19:59:43.561Z\",\"updatedAt\":\"2026-04-04T12:28:15.459Z\"}"', '"{\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":8,\"quizzes\":5,\"participation\":10,\"attendance\":10,\"totalMarks\":86,\"letterGrade\":\"B\"}"', '"[{\"field\":\"labsProjectResearch\",\"oldValue\":10,\"newValue\":8,\"fieldName\":\"Labs/Projects\"}]"', 'f', 'calculated', 18, 30, 5, 8, 5, 10, 10, 86, 'B', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 12:28:34.971');
INSERT INTO "public"."student_marks_history" VALUES (5, 6, 23, 3, 4, 'updated', 1, '"{\"id\":6,\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":2,\"participation\":10,\"attendance\":10,\"totalMarks\":85,\"letterGrade\":\"B-\",\"createdBy\":null,\"updatedBy\":null,\"createdAt\":\"2026-04-03T10:19:21.414Z\",\"updatedAt\":\"2026-04-04T10:57:11.488Z\"}"', '"{\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":5,\"participation\":10,\"attendance\":10,\"totalMarks\":88,\"letterGrade\":\"B\"}"', '"[{\"field\":\"quizzes\",\"oldValue\":2,\"newValue\":5,\"fieldName\":\"Quizzes\"}]"', 't', 'calculated', 18, 30, 5, 10, 5, 10, 10, 88, 'B', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 11:32:48.237');
INSERT INTO "public"."student_marks_history" VALUES (1, 3, 23, 3, 4, 'updated', 1, '"{\"id\":3,\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":1,\"participation\":10,\"attendance\":10,\"totalMarks\":84,\"letterGrade\":\"B\",\"createdBy\":null,\"updatedBy\":null,\"createdAt\":\"2026-04-02T19:59:43.561Z\",\"updatedAt\":\"2026-04-04T11:28:09.327Z\"}"', '"{\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":2,\"participation\":10,\"attendance\":10,\"totalMarks\":85,\"letterGrade\":\"B\"}"', '"[{\"field\":\"quizzes\",\"oldValue\":1,\"newValue\":2,\"fieldName\":\"Quizzes\"}]"', 'f', 'calculated', 18, 30, 5, 10, 2, 10, 10, 85, 'B', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 11:30:55.66');
INSERT INTO "public"."student_marks_history" VALUES (2, 3, 23, 3, 4, 'updated', 1, '"{\"id\":3,\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":2,\"participation\":10,\"attendance\":10,\"totalMarks\":85,\"letterGrade\":\"B\",\"createdBy\":null,\"updatedBy\":null,\"createdAt\":\"2026-04-02T19:59:43.561Z\",\"updatedAt\":\"2026-04-04T11:30:55.631Z\"}"', '"{\"userId\":23,\"subjectId\":3,\"classId\":4,\"isRepeated\":false,\"gradeType\":\"calculated\",\"midTermExam\":18,\"finalExam\":30,\"homework\":5,\"labsProjectResearch\":10,\"quizzes\":5,\"participation\":10,\"attendance\":10,\"totalMarks\":88,\"letterGrade\":\"B+\"}"', '"[{\"field\":\"quizzes\",\"oldValue\":2,\"newValue\":5,\"fieldName\":\"Quizzes\"}]"', 'f', 'calculated', 18, 30, 5, 10, 5, 10, 10, 88, 'B+', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 11:31:33.659');
INSERT INTO "public"."student_marks_history" VALUES (3, 10, 24, 3, 4, 'updated', 1, '"{\"id\":10,\"userId\":24,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":2,\"finalExam\":0,\"homework\":0,\"labsProjectResearch\":0,\"quizzes\":1,\"participation\":5,\"attendance\":6,\"totalMarks\":14,\"letterGrade\":\"F\",\"createdBy\":null,\"updatedBy\":null,\"createdAt\":\"2026-04-03T19:30:45.267Z\",\"updatedAt\":\"2026-04-04T11:23:33.257Z\"}"', '"{\"userId\":24,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":2,\"finalExam\":0,\"homework\":4,\"labsProjectResearch\":0,\"quizzes\":1,\"participation\":5,\"attendance\":6,\"totalMarks\":18,\"letterGrade\":\"F\"}"', '"[{\"field\":\"homework\",\"oldValue\":0,\"newValue\":4,\"fieldName\":\"Homework\"}]"', 't', 'calculated', 2, 0, 4, 0, 1, 5, 6, 18, 'F', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 11:32:28.869');
INSERT INTO "public"."student_marks_history" VALUES (4, 10, 24, 3, 4, 'updated', 1, '"{\"id\":10,\"userId\":24,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":2,\"finalExam\":0,\"homework\":4,\"labsProjectResearch\":0,\"quizzes\":1,\"participation\":5,\"attendance\":6,\"totalMarks\":18,\"letterGrade\":\"F\",\"createdBy\":null,\"updatedBy\":null,\"createdAt\":\"2026-04-03T19:30:45.267Z\",\"updatedAt\":\"2026-04-04T11:32:28.854Z\"}"', '"{\"userId\":24,\"subjectId\":3,\"classId\":4,\"isRepeated\":true,\"gradeType\":\"calculated\",\"midTermExam\":2,\"finalExam\":7,\"homework\":4,\"labsProjectResearch\":0,\"quizzes\":1,\"participation\":5,\"attendance\":6,\"totalMarks\":25,\"letterGrade\":\"F\"}"', '"[{\"field\":\"finalExam\",\"oldValue\":0,\"newValue\":7,\"fieldName\":\"Final Exam\"}]"', 't', 'calculated', 2, 7, 4, 0, 1, 5, 6, 25, 'F', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-04-04 11:32:33.737');

-- ----------------------------
-- Table structure for subject_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."subject_types";
CREATE TABLE "public"."subject_types" (
  "id" int4 NOT NULL DEFAULT nextval('subject_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of subject_types
-- ----------------------------
INSERT INTO "public"."subject_types" VALUES (2, 'ELECTIVE', 'Elective Subject', 'موضوع اختياري', 'Optional subject students can choose', 't', NULL, NULL, '2026-04-01 13:26:44.738', '2026-04-01 13:26:44.738');
INSERT INTO "public"."subject_types" VALUES (3, 'SPECIALIZATION', 'Specialization Subject', 'موضوع تخصص', 'Subject for specific specialization track', 't', NULL, NULL, '2026-04-01 13:26:44.757', '2026-04-01 13:26:44.757');
INSERT INTO "public"."subject_types" VALUES (1, 'CORE', 'Core Subject', 'موضوع أساسي', 'Fundamental subject for the program', 't', NULL, 1, '2026-04-01 13:26:44.721', '2026-04-01 13:26:44.721');
INSERT INTO "public"."subject_types" VALUES (4, 'ddddd', 'aaaa', 'bbbbb', 'cccc', 'f', 1, 1, '2026-04-05 17:05:05.282', '2026-04-06 12:58:15.151');

-- ----------------------------
-- Table structure for subjects
-- ----------------------------
DROP TABLE IF EXISTS "public"."subjects";
CREATE TABLE "public"."subjects" (
  "id" int4 NOT NULL DEFAULT nextval('subjects_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "credits" int4 NOT NULL DEFAULT 3,
  "isActive" bool NOT NULL DEFAULT true,
  "programId" int4 NOT NULL,
  "typeId" int4 NOT NULL,
  "requirementTypeId" int4 NOT NULL,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "descriptionAr" text COLLATE "pg_catalog"."default",
  "descriptionEn" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of subjects
-- ----------------------------
INSERT INTO "public"."subjects" VALUES (1, 'CS101', 'Introduction to Programming', 'مقدمة في البرمجة', 4, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.168', '2026-04-01 13:27:35.922', NULL, 'Fundamentals of programming using Python');
INSERT INTO "public"."subjects" VALUES (2, 'CS102', 'Data Structures and Algorithms', 'هياكل البيانات والخوارزميات', 4, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.189', '2026-04-01 13:27:35.931', NULL, 'Data structures and algorithm analysis');
INSERT INTO "public"."subjects" VALUES (3, 'CS201', 'Database Systems', 'أنظمة قواعد البيانات', 3, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.201', '2026-04-01 13:27:35.938', NULL, 'Relational database design and SQL');
INSERT INTO "public"."subjects" VALUES (4, 'CS202', 'Software Engineering', 'هندسة البرمجيات', 3, 't', 1, 1, 1, 1, NULL, '2026-04-01 13:26:47.214', '2026-04-01 13:27:35.944', NULL, 'Software development methodologies');
INSERT INTO "public"."subjects" VALUES (5, 'ME101', 'Engineering Mathematics', 'الرياضيات الهندسية', 4, 't', 2, 1, 1, 1, NULL, '2026-04-01 13:26:47.227', '2026-04-01 13:27:35.95', NULL, 'Mathematical foundations for engineering');
INSERT INTO "public"."subjects" VALUES (6, 'ME102', 'Thermodynamics', 'الديناميكا الحرارية', 3, 't', 2, 1, 1, 1, NULL, '2026-04-01 13:26:47.236', '2026-04-01 13:27:35.956', NULL, 'Principles of thermodynamics and heat transfer');
INSERT INTO "public"."subjects" VALUES (7, 'EE101', 'Circuit Analysis', 'تحليل الدوائر', 4, 't', 3, 1, 1, 1, NULL, '2026-04-01 13:26:47.251', '2026-04-01 13:27:35.962', NULL, 'Basic circuit theory and analysis');
INSERT INTO "public"."subjects" VALUES (8, 'EE102', 'Digital Logic Design', 'تصيم المنطق الرقمي', 3, 't', 3, 1, 1, 1, NULL, '2026-04-01 13:26:47.26', '2026-04-01 13:27:35.968', NULL, 'Digital systems and logic design');

-- ----------------------------
-- Table structure for submission_status_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."submission_status_types";
CREATE TABLE "public"."submission_status_types" (
  "id" int4 NOT NULL DEFAULT nextval('submission_status_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "color" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of submission_status_types
-- ----------------------------
INSERT INTO "public"."submission_status_types" VALUES (1, 'DRAFT', 'Draft', 'مسودة', 'Submission is in draft', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.499', '2026-04-01 13:26:46.499');
INSERT INTO "public"."submission_status_types" VALUES (2, 'SUBMITTED', 'Submitted', 'مقدم', 'Assignment has been submitted', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.508', '2026-04-01 13:26:46.508');
INSERT INTO "public"."submission_status_types" VALUES (3, 'UNDER_REVIEW', 'Under Review', 'قيد المراجعة', 'Submission is being reviewed', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.516', '2026-04-01 13:26:46.516');
INSERT INTO "public"."submission_status_types" VALUES (4, 'GRADED', 'Graded', 'مصحح', 'Submission has been graded', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.524', '2026-04-01 13:26:46.524');
INSERT INTO "public"."submission_status_types" VALUES (5, 'RETURNED', 'Returned', 'معاد', 'Submission returned for revision', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.536', '2026-04-01 13:26:46.536');
INSERT INTO "public"."submission_status_types" VALUES (6, 'APPROVED', 'Approved', 'موافق عليه', 'Submission is approved', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.545', '2026-04-01 13:26:46.545');
INSERT INTO "public"."submission_status_types" VALUES (7, 'LATE', 'Late', 'متأخر', 'Submission was late', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.556', '2026-04-01 13:26:46.556');

-- ----------------------------
-- Table structure for submissions
-- ----------------------------
DROP TABLE IF EXISTS "public"."submissions";
CREATE TABLE "public"."submissions" (
  "id" int4 NOT NULL DEFAULT nextval('submissions_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "activityId" int4 NOT NULL,
  "content" text COLLATE "pg_catalog"."default",
  "fileUrl" text COLLATE "pg_catalog"."default",
  "fileName" text COLLATE "pg_catalog"."default",
  "fileSize" int4,
  "statusId" int4 NOT NULL,
  "score" float8,
  "maxScore" float8,
  "feedback" text COLLATE "pg_catalog"."default",
  "gradedAt" timestamp(3),
  "submittedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of submissions
-- ----------------------------

-- ----------------------------
-- Table structure for target_audience_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."target_audience_types";
CREATE TABLE "public"."target_audience_types" (
  "id" int4 NOT NULL DEFAULT nextval('target_audience_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of target_audience_types
-- ----------------------------
INSERT INTO "public"."target_audience_types" VALUES (1, 'ALL', 'All Users', 'جميع المستخدمين', 'All system users', 't', NULL, NULL, '2026-04-01 13:26:45.687', '2026-04-01 13:26:45.687');
INSERT INTO "public"."target_audience_types" VALUES (2, 'STUDENTS', 'Students', 'الطلاب', 'Students only', 't', NULL, NULL, '2026-04-01 13:26:45.709', '2026-04-01 13:26:45.709');
INSERT INTO "public"."target_audience_types" VALUES (3, 'INSTRUCTORS', 'Instructors', 'المدربون', 'Instructors only', 't', NULL, NULL, '2026-04-01 13:26:45.725', '2026-04-01 13:26:45.725');
INSERT INTO "public"."target_audience_types" VALUES (4, 'ADMIN', 'Administrators', 'المسؤولون', 'Administrators only', 't', NULL, NULL, '2026-04-01 13:26:45.741', '2026-04-01 13:26:45.741');
INSERT INTO "public"."target_audience_types" VALUES (5, 'PROGRAM', 'Program Specific', 'برنامج محدد', 'Specific program users', 't', NULL, NULL, '2026-04-01 13:26:45.785', '2026-04-01 13:26:45.785');
INSERT INTO "public"."target_audience_types" VALUES (6, 'CLASS', 'Class Specific', 'فصل محدد', 'Specific class users', 't', NULL, NULL, '2026-04-01 13:26:45.826', '2026-04-01 13:26:45.826');

-- ----------------------------
-- Table structure for template_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."template_types";
CREATE TABLE "public"."template_types" (
  "id" int4 NOT NULL DEFAULT nextval('template_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "icon" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of template_types
-- ----------------------------
INSERT INTO "public"."template_types" VALUES (1, 'EMAIL', 'Email Template', 'قالب بريد إلكتروني', 'Email notification template', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.348', '2026-04-01 13:26:46.348');
INSERT INTO "public"."template_types" VALUES (2, 'SMS', 'SMS Template', 'قالب رسالة نصية', 'SMS notification template', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.359', '2026-04-01 13:26:46.359');
INSERT INTO "public"."template_types" VALUES (3, 'CERTIFICATE', 'Certificate Template', 'قالب شهادة', 'Certificate template', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.367', '2026-04-01 13:26:46.367');
INSERT INTO "public"."template_types" VALUES (4, 'REPORT', 'Report Template', 'قالب تقرير', 'Report generation template', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.374', '2026-04-01 13:26:46.374');
INSERT INTO "public"."template_types" VALUES (5, 'FORM', 'Form Template', 'قالب نموذج', 'Form template', NULL, 't', NULL, NULL, '2026-04-01 13:26:46.38', '2026-04-01 13:26:46.38');

-- ----------------------------
-- Table structure for user_favorites
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_favorites";
CREATE TABLE "public"."user_favorites" (
  "id" int4 NOT NULL DEFAULT nextval('user_favorites_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "favoriteType" text COLLATE "pg_catalog"."default" NOT NULL,
  "targetId" text COLLATE "pg_catalog"."default" NOT NULL,
  "metadata" jsonb,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of user_favorites
-- ----------------------------

-- ----------------------------
-- Table structure for user_preferences
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_preferences";
CREATE TABLE "public"."user_preferences" (
  "id" int4 NOT NULL DEFAULT nextval('user_preferences_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "settings" jsonb,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of user_preferences
-- ----------------------------

-- ----------------------------
-- Table structure for user_role_assignments
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_role_assignments";
CREATE TABLE "public"."user_role_assignments" (
  "id" int4 NOT NULL DEFAULT nextval('user_role_assignments_id_seq'::regclass),
  "userId" int4 NOT NULL,
  "roleId" int4 NOT NULL,
  "assignedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" int4
)
;

-- ----------------------------
-- Records of user_role_assignments
-- ----------------------------
INSERT INTO "public"."user_role_assignments" VALUES (1, 2, 3, '2026-04-13 08:30:40.176', 1);
INSERT INTO "public"."user_role_assignments" VALUES (2, 3, 3, '2026-04-13 08:30:40.475', 1);
INSERT INTO "public"."user_role_assignments" VALUES (3, 4, 3, '2026-04-13 08:30:40.77', 1);
INSERT INTO "public"."user_role_assignments" VALUES (4, 5, 3, '2026-04-13 08:30:41.063', 1);
INSERT INTO "public"."user_role_assignments" VALUES (5, 6, 3, '2026-04-13 08:30:41.378', 1);
INSERT INTO "public"."user_role_assignments" VALUES (6, 7, 2, '2026-04-13 08:30:41.704', 1);
INSERT INTO "public"."user_role_assignments" VALUES (7, 8, 2, '2026-04-13 08:30:42.07', 1);
INSERT INTO "public"."user_role_assignments" VALUES (8, 9, 2, '2026-04-13 08:30:42.501', 1);
INSERT INTO "public"."user_role_assignments" VALUES (9, 10, 2, '2026-04-13 08:30:42.969', 1);
INSERT INTO "public"."user_role_assignments" VALUES (10, 11, 2, '2026-04-13 08:30:43.468', 1);
INSERT INTO "public"."user_role_assignments" VALUES (11, 12, 4, '2026-04-13 08:30:43.896', 1);
INSERT INTO "public"."user_role_assignments" VALUES (12, 13, 4, '2026-04-13 08:30:44.199', 1);
INSERT INTO "public"."user_role_assignments" VALUES (13, 14, 4, '2026-04-13 08:30:44.524', 1);
INSERT INTO "public"."user_role_assignments" VALUES (14, 15, 4, '2026-04-13 08:30:44.847', 1);
INSERT INTO "public"."user_role_assignments" VALUES (15, 16, 4, '2026-04-13 08:30:45.184', 1);
INSERT INTO "public"."user_role_assignments" VALUES (16, 17, 5, '2026-04-13 08:30:45.649', 1);
INSERT INTO "public"."user_role_assignments" VALUES (17, 18, 5, '2026-04-13 08:30:45.931', 1);
INSERT INTO "public"."user_role_assignments" VALUES (18, 19, 5, '2026-04-13 08:30:46.225', 1);
INSERT INTO "public"."user_role_assignments" VALUES (19, 20, 5, '2026-04-13 08:30:46.534', 1);
INSERT INTO "public"."user_role_assignments" VALUES (20, 25, 5, '2026-04-13 08:30:46.819', 1);
INSERT INTO "public"."user_role_assignments" VALUES (21, 26, 5, '2026-04-13 08:30:47.107', 1);
INSERT INTO "public"."user_role_assignments" VALUES (22, 1, 1, '2026-04-13 08:38:51.813', 1);

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_roles";
CREATE TABLE "public"."user_roles" (
  "id" int4 NOT NULL DEFAULT nextval('user_roles_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "level" int4 NOT NULL DEFAULT 0,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of user_roles
-- ----------------------------
INSERT INTO "public"."user_roles" VALUES (1, 'SUPER_ADMIN', 'Super Administrator', 'مدير النظام الأعلى', 'Super Administrator with full system access', 0, 't', NULL, NULL, '2026-04-01 13:26:44.381', '2026-04-01 13:26:44.381');
INSERT INTO "public"."user_roles" VALUES (2, 'ADMIN', 'Administrator', 'مدير النظام', 'System Administrator', 0, 't', NULL, NULL, '2026-04-01 13:26:44.399', '2026-04-01 13:26:44.399');
INSERT INTO "public"."user_roles" VALUES (3, 'HR', 'HR Manager', 'مدير الموارد البشرية', 'Human Resources Manager', 0, 't', NULL, NULL, '2026-04-01 13:26:44.41', '2026-04-01 13:26:44.41');
INSERT INTO "public"."user_roles" VALUES (4, 'INSTRUCTOR', 'Instructor', 'مدرب', 'Course Instructor', 0, 't', NULL, NULL, '2026-04-01 13:26:44.419', '2026-04-01 13:26:44.419');
INSERT INTO "public"."user_roles" VALUES (5, 'STUDENT', 'Student', 'طالب', 'Student User', 0, 't', NULL, NULL, '2026-04-01 13:26:44.431', '2026-04-01 13:26:44.431');

-- ----------------------------
-- Table structure for user_status_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_status_types";
CREATE TABLE "public"."user_status_types" (
  "id" int4 NOT NULL DEFAULT nextval('user_status_types_id_seq'::regclass),
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameEn" text COLLATE "pg_catalog"."default" NOT NULL,
  "nameAr" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of user_status_types
-- ----------------------------
INSERT INTO "public"."user_status_types" VALUES (1, 'ACTIVE', 'Active', 'نشط', 'User is active and can access the system', 't', NULL, NULL, '2026-04-01 13:26:44.453', '2026-04-01 13:26:44.453');
INSERT INTO "public"."user_status_types" VALUES (2, 'INACTIVE', 'Inactive', 'غير نشط', 'User is inactive and cannot access the system', 't', NULL, NULL, '2026-04-01 13:26:44.465', '2026-04-01 13:26:44.465');
INSERT INTO "public"."user_status_types" VALUES (3, 'SUSPENDED', 'Suspended', 'موقوف', 'User is temporarily suspended', 't', NULL, NULL, '2026-04-01 13:26:44.474', '2026-04-01 13:26:44.474');
INSERT INTO "public"."user_status_types" VALUES (4, 'PENDING', 'Pending', 'في الانتظار', 'User account is pending approval', 't', NULL, NULL, '2026-04-01 13:26:44.488', '2026-04-01 13:26:44.488');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "firstName" text COLLATE "pg_catalog"."default",
  "lastName" text COLLATE "pg_catalog"."default",
  "displayName" text COLLATE "pg_catalog"."default",
  "realName" text COLLATE "pg_catalog"."default",
  "studentNumber" text COLLATE "pg_catalog"."default",
  "sequence" int4,
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL,
  "keycloakId" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES (1, 'shareef.hiasat@gmail.com', 'Shareef', 'Hiasat', 'Shareef Hiasat', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.038', '2026-04-01 13:26:47.038', 'admin-keycloak-id');
INSERT INTO "public"."users" VALUES (2, 'hr1@example.com', 'Emily', 'Brown', 'Emily Brown', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.4', '2026-04-01 13:27:36.049', NULL);
INSERT INTO "public"."users" VALUES (3, 'hr2@example.com', 'David', 'Miller', 'David Miller', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.422', '2026-04-01 13:27:36.059', NULL);
INSERT INTO "public"."users" VALUES (4, 'hr3@example.com', 'Sarah', 'Wilson', 'Sarah Wilson', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.436', '2026-04-01 13:27:36.067', NULL);
INSERT INTO "public"."users" VALUES (5, 'hr4@example.com', 'James', 'Taylor', 'James Taylor', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.445', '2026-04-01 13:27:36.073', NULL);
INSERT INTO "public"."users" VALUES (6, 'hr5@example.com', 'Lisa', 'Anderson', 'Lisa Anderson', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.454', '2026-04-01 13:27:36.079', NULL);
INSERT INTO "public"."users" VALUES (7, 'admin1@example.com', 'Robert', 'Johnson', 'Robert Johnson', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.464', '2026-04-01 13:27:36.087', NULL);
INSERT INTO "public"."users" VALUES (8, 'admin2@example.com', 'Michael', 'Davis', 'Michael Davis', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.475', '2026-04-01 13:27:36.095', NULL);
INSERT INTO "public"."users" VALUES (9, 'admin3@example.com', 'Jennifer', 'Garcia', 'Jennifer Garcia', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.484', '2026-04-01 13:27:36.102', NULL);
INSERT INTO "public"."users" VALUES (10, 'admin4@example.com', 'William', 'Martinez', 'William Martinez', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.492', '2026-04-01 13:27:36.111', NULL);
INSERT INTO "public"."users" VALUES (11, 'admin5@example.com', 'Patricia', 'Rodriguez', 'Patricia Rodriguez', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.501', '2026-04-01 13:27:36.118', NULL);
INSERT INTO "public"."users" VALUES (12, 'instructor1@example.com', 'Dr. Sarah', 'Johnson', 'Dr. Sarah Johnson', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.511', '2026-04-01 13:27:36.125', NULL);
INSERT INTO "public"."users" VALUES (13, 'instructor2@example.com', 'Prof. Michael', 'Chen', 'Prof. Michael Chen', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.52', '2026-04-01 13:27:36.154', NULL);
INSERT INTO "public"."users" VALUES (14, 'instructor3@example.com', 'Dr. James', 'Wilson', 'Dr. James Wilson', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.53', '2026-04-01 13:27:36.172', NULL);
INSERT INTO "public"."users" VALUES (15, 'instructor4@example.com', 'Dr. Maria', 'Gonzalez', 'Dr. Maria Gonzalez', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.538', '2026-04-01 13:27:36.181', NULL);
INSERT INTO "public"."users" VALUES (16, 'instructor5@example.com', 'Prof. Ahmed', 'Khalid', 'Prof. Ahmed Khalid', NULL, NULL, NULL, 't', NULL, NULL, '2026-04-01 13:26:47.548', '2026-04-01 13:27:36.19', NULL);
INSERT INTO "public"."users" VALUES (17, 'student1@example.com', 'Ahmed', 'Mohammed', 'Ahmed Mohammed', NULL, 'STU001', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.557', '2026-04-01 13:27:36.203', NULL);
INSERT INTO "public"."users" VALUES (18, 'student2@example.com', 'Fatima', 'Ali', 'Fatima Ali', NULL, 'STU002', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.568', '2026-04-01 13:27:36.219', NULL);
INSERT INTO "public"."users" VALUES (19, 'student3@example.com', 'Mohammed', 'Khalid', 'Mohammed Khalid', NULL, 'STU003', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.578', '2026-04-01 13:27:36.23', NULL);
INSERT INTO "public"."users" VALUES (20, 'student4@example.com', 'Aisha', 'Hassan', 'Aisha Hassan', NULL, 'STU004', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.586', '2026-04-01 13:27:36.239', NULL);
INSERT INTO "public"."users" VALUES (25, 'student9@example.com', 'Abdullah', 'Khalifa', 'Abdullah Khalifa', NULL, 'STU009', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.635', '2026-04-01 13:27:36.304', NULL);
INSERT INTO "public"."users" VALUES (26, 'student10@example.com', 'Noura', 'Al-Fahad', 'Noura Al-Fahad', NULL, 'STU010', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.642', '2026-04-01 13:27:36.313', NULL);
INSERT INTO "public"."users" VALUES (21, 'student5@example.com', 'Omar', 'Ibrahim', 'Omar Ibrahim', NULL, 'STU005', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.595', '2026-04-03 18:51:17.412', NULL);
INSERT INTO "public"."users" VALUES (22, 'student6@example.com', 'Layla', 'Ahmad', 'Layla Ahmad', NULL, 'STU006', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.604', '2026-04-03 18:51:17.434', NULL);
INSERT INTO "public"."users" VALUES (23, 'student7@example.com', 'Youssef', 'Mahmoud', 'Youssef Mahmoud', NULL, 'STU007', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.619', '2026-04-03 18:51:17.441', NULL);
INSERT INTO "public"."users" VALUES (24, 'student8@example.com', 'Mariam', 'Saeed', 'Mariam Saeed', NULL, 'STU008', NULL, 't', NULL, NULL, '2026-04-01 13:26:47.627', '2026-04-03 18:51:17.449', NULL);

-- ----------------------------
-- Table structure for workflow_actions
-- ----------------------------
DROP TABLE IF EXISTS "public"."workflow_actions";
CREATE TABLE "public"."workflow_actions" (
  "id" int4 NOT NULL DEFAULT nextval('workflow_actions_id_seq'::regclass),
  "documentId" int4 NOT NULL,
  "senderId" int4 NOT NULL,
  "receiverId" int4 NOT NULL,
  "action" text COLLATE "pg_catalog"."default" NOT NULL,
  "comment" text COLLATE "pg_catalog"."default",
  "stateBefore" text COLLATE "pg_catalog"."default",
  "stateAfter" text COLLATE "pg_catalog"."default",
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of workflow_actions
-- ----------------------------
INSERT INTO "public"."workflow_actions" VALUES (1, 6, 1, 26, 'send', 'ssdfsdf', 'draft', 'pending', '2026-04-06 03:25:34.378');
INSERT INTO "public"."workflow_actions" VALUES (2, 7, 1, 23, 'send', NULL, 'draft', 'pending', '2026-04-06 03:31:54.22');

-- ----------------------------
-- Table structure for workflow_documents
-- ----------------------------
DROP TABLE IF EXISTS "public"."workflow_documents";
CREATE TABLE "public"."workflow_documents" (
  "id" int4 NOT NULL DEFAULT nextval('workflow_documents_id_seq'::regclass),
  "title" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "documentType" text COLLATE "pg_catalog"."default" NOT NULL,
  "currentStatus" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'draft'::text,
  "currentOwnerId" int4,
  "currentAssigneeId" int4,
  "nextcloudFileId" text COLLATE "pg_catalog"."default",
  "nextcloudFilePath" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdBy" int4 NOT NULL,
  "updatedBy" int4,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
)
;

-- ----------------------------
-- Records of workflow_documents
-- ----------------------------
INSERT INTO "public"."workflow_documents" VALUES (1, 'asdf', 'ffff', 'LEAVE_REQUEST', 'draft', 1, 1, '', '', 't', 1, NULL, '2026-04-05 16:54:03.998', '2026-04-05 16:54:03.998');
INSERT INTO "public"."workflow_documents" VALUES (2, 'adfasdf', 'asdfsdf', 'POLICY', 'draft', 1, 1, '', '', 't', 1, NULL, '2026-04-05 16:54:22.387', '2026-04-05 16:54:22.387');
INSERT INTO "public"."workflow_documents" VALUES (3, 'safdsdf', 'sfasdfsdaf', 'LEAVE_REQUEST', 'draft', 1, 1, '', '', 't', 1, NULL, '2026-04-05 16:54:44.217', '2026-04-05 16:54:44.217');
INSERT INTO "public"."workflow_documents" VALUES (4, 'asdf', 'sdag', 'CURRICULUM', 'draft', 1, 1, '', '', 't', 1, NULL, '2026-04-05 16:57:33.325', '2026-04-05 16:57:33.325');
INSERT INTO "public"."workflow_documents" VALUES (5, 'sdfsdf', 'asf', 'POLICY', 'draft', 1, 1, NULL, 'users/e75976d2-1fb3-4882-bdac-5b95e3345ca4/personal/Uploads/HTML Course Cheat Sheet - A4 Printable.pdf', 't', 1, NULL, '2026-04-05 17:06:38.959', '2026-04-05 17:06:38.959');
INSERT INTO "public"."workflow_documents" VALUES (6, 'aaaa', 'ffff', 'LEAVE_REQUEST', 'pending', 1, 26, '', '', 't', 1, 1, '2026-04-06 03:25:34.193', '2026-04-06 03:25:34.406');
INSERT INTO "public"."workflow_documents" VALUES (7, 'new document', 'aaaa', 'PURCHASE_REQUEST', 'pending', 1, 23, '', '', 't', 1, 1, '2026-04-06 03:31:54.182', '2026-04-06 03:31:54.234');

-- ----------------------------
-- Table structure for workflow_inbox_items
-- ----------------------------
DROP TABLE IF EXISTS "public"."workflow_inbox_items";
CREATE TABLE "public"."workflow_inbox_items" (
  "id" int4 NOT NULL DEFAULT nextval('workflow_inbox_items_id_seq'::regclass),
  "documentId" int4 NOT NULL,
  "userId" int4 NOT NULL,
  "action" text COLLATE "pg_catalog"."default" NOT NULL,
  "isRead" bool NOT NULL DEFAULT false,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" timestamp(3)
)
;

-- ----------------------------
-- Records of workflow_inbox_items
-- ----------------------------
INSERT INTO "public"."workflow_inbox_items" VALUES (1, 6, 26, 'review', 'f', '2026-04-06 03:25:34.441', NULL);
INSERT INTO "public"."workflow_inbox_items" VALUES (2, 7, 23, 'review', 'f', '2026-04-06 03:31:54.247', NULL);

-- ----------------------------
-- Table structure for workflow_versions
-- ----------------------------
DROP TABLE IF EXISTS "public"."workflow_versions";
CREATE TABLE "public"."workflow_versions" (
  "id" int4 NOT NULL DEFAULT nextval('workflow_versions_id_seq'::regclass),
  "documentId" int4 NOT NULL,
  "versionNumber" int4 NOT NULL DEFAULT 1,
  "storagePath" text COLLATE "pg_catalog"."default" NOT NULL,
  "uploadedBy" int4 NOT NULL,
  "fileHash" text COLLATE "pg_catalog"."default",
  "notes" text COLLATE "pg_catalog"."default",
  "isActive" bool NOT NULL DEFAULT true,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of workflow_versions
-- ----------------------------

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."academic_terms_id_seq"
OWNED BY "public"."academic_terms"."id";
SELECT setval('"public"."academic_terms_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."activities_id_seq"
OWNED BY "public"."activities"."id";
SELECT setval('"public"."activities_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."activity_log_action_types_id_seq"
OWNED BY "public"."activity_log_action_types"."id";
SELECT setval('"public"."activity_log_action_types_id_seq"', 9, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."activity_types_id_seq"
OWNED BY "public"."activity_types"."id";
SELECT setval('"public"."activity_types_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."announcements_id_seq"
OWNED BY "public"."announcements"."id";
SELECT setval('"public"."announcements_id_seq"', 20, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."answers_id_seq"
OWNED BY "public"."answers"."id";
SELECT setval('"public"."answers_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."assessment_types_id_seq"
OWNED BY "public"."assessment_types"."id";
SELECT setval('"public"."assessment_types_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."attendance_status_types_id_seq"
OWNED BY "public"."attendance_status_types"."id";
SELECT setval('"public"."attendance_status_types_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."attendances_id_seq"
OWNED BY "public"."attendances"."id";
SELECT setval('"public"."attendances_id_seq"', 76, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."behavior_types_id_seq"
OWNED BY "public"."behavior_types"."id";
SELECT setval('"public"."behavior_types_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."behaviors_id_seq"
OWNED BY "public"."behaviors"."id";
SELECT setval('"public"."behaviors_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."category_types_id_seq"
OWNED BY "public"."category_types"."id";
SELECT setval('"public"."category_types_id_seq"', 13, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."classes_id_seq"
OWNED BY "public"."classes"."id";
SELECT setval('"public"."classes_id_seq"', 16, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."config_types_id_seq"
OWNED BY "public"."config_types"."id";
SELECT setval('"public"."config_types_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."enrollment_status_types_id_seq"
OWNED BY "public"."enrollment_status_types"."id";
SELECT setval('"public"."enrollment_status_types_id_seq"', 7, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."enrollments_id_seq"
OWNED BY "public"."enrollments"."id";
SELECT setval('"public"."enrollments_id_seq"', 32, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."help_items_id_seq"
OWNED BY "public"."help_items"."id";
SELECT setval('"public"."help_items_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."marks_distributions_id_seq"
OWNED BY "public"."marks_distributions"."id";
SELECT setval('"public"."marks_distributions_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."participation_types_id_seq"
OWNED BY "public"."participation_types"."id";
SELECT setval('"public"."participation_types_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."participations_id_seq"
OWNED BY "public"."participations"."id";
SELECT setval('"public"."participations_id_seq"', 30, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."penalties_id_seq"
OWNED BY "public"."penalties"."id";
SELECT setval('"public"."penalties_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."penalty_types_id_seq"
OWNED BY "public"."penalty_types"."id";
SELECT setval('"public"."penalty_types_id_seq"', 7, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."priority_types_id_seq"
OWNED BY "public"."priority_types"."id";
SELECT setval('"public"."priority_types_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."private_workspace_links_id_seq"
OWNED BY "public"."private_workspace_links"."id";
SELECT setval('"public"."private_workspace_links_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."programs_id_seq"
OWNED BY "public"."programs"."id";
SELECT setval('"public"."programs_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."question_difficulty_types_id_seq"
OWNED BY "public"."question_difficulty_types"."id";
SELECT setval('"public"."question_difficulty_types_id_seq"', 4, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."question_types_id_seq"
OWNED BY "public"."question_types"."id";
SELECT setval('"public"."question_types_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."questions_id_seq"
OWNED BY "public"."questions"."id";
SELECT setval('"public"."questions_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."quiz_attempts_id_seq"
OWNED BY "public"."quiz_attempts"."id";
SELECT setval('"public"."quiz_attempts_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."quiz_status_types_id_seq"
OWNED BY "public"."quiz_status_types"."id";
SELECT setval('"public"."quiz_status_types_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."quizzes_id_seq"
OWNED BY "public"."quizzes"."id";
SELECT setval('"public"."quizzes_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."requirement_types_id_seq"
OWNED BY "public"."requirement_types"."id";
SELECT setval('"public"."requirement_types_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."resource_types_id_seq"
OWNED BY "public"."resource_types"."id";
SELECT setval('"public"."resource_types_id_seq"', 8, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."resources_id_seq"
OWNED BY "public"."resources"."id";
SELECT setval('"public"."resources_id_seq"', 30, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."schedule_types_id_seq"
OWNED BY "public"."schedule_types"."id";
SELECT setval('"public"."schedule_types_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."standup_attendances_id_seq"
OWNED BY "public"."standup_attendances"."id";
SELECT setval('"public"."standup_attendances_id_seq"', 68, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."student_marks_history_id_seq"
OWNED BY "public"."student_marks_history"."id";
SELECT setval('"public"."student_marks_history_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."student_marks_id_seq"
OWNED BY "public"."student_marks"."id";
SELECT setval('"public"."student_marks_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."subject_types_id_seq"
OWNED BY "public"."subject_types"."id";
SELECT setval('"public"."subject_types_id_seq"', 4, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."subjects_id_seq"
OWNED BY "public"."subjects"."id";
SELECT setval('"public"."subjects_id_seq"', 16, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."submission_status_types_id_seq"
OWNED BY "public"."submission_status_types"."id";
SELECT setval('"public"."submission_status_types_id_seq"', 7, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."submissions_id_seq"
OWNED BY "public"."submissions"."id";
SELECT setval('"public"."submissions_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."target_audience_types_id_seq"
OWNED BY "public"."target_audience_types"."id";
SELECT setval('"public"."target_audience_types_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."template_types_id_seq"
OWNED BY "public"."template_types"."id";
SELECT setval('"public"."template_types_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_favorites_id_seq"
OWNED BY "public"."user_favorites"."id";
SELECT setval('"public"."user_favorites_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_preferences_id_seq"
OWNED BY "public"."user_preferences"."id";
SELECT setval('"public"."user_preferences_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_role_assignments_id_seq"
OWNED BY "public"."user_role_assignments"."id";
SELECT setval('"public"."user_role_assignments_id_seq"', 22, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_roles_id_seq"
OWNED BY "public"."user_roles"."id";
SELECT setval('"public"."user_roles_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."user_status_types_id_seq"
OWNED BY "public"."user_status_types"."id";
SELECT setval('"public"."user_status_types_id_seq"', 4, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."users_id_seq"
OWNED BY "public"."users"."id";
SELECT setval('"public"."users_id_seq"', 51, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."workflow_actions_id_seq"
OWNED BY "public"."workflow_actions"."id";
SELECT setval('"public"."workflow_actions_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."workflow_documents_id_seq"
OWNED BY "public"."workflow_documents"."id";
SELECT setval('"public"."workflow_documents_id_seq"', 7, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."workflow_inbox_items_id_seq"
OWNED BY "public"."workflow_inbox_items"."id";
SELECT setval('"public"."workflow_inbox_items_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."workflow_versions_id_seq"
OWNED BY "public"."workflow_versions"."id";
SELECT setval('"public"."workflow_versions_id_seq"', 1, false);

-- ----------------------------
-- Primary Key structure for table _prisma_migrations
-- ----------------------------
ALTER TABLE "public"."_prisma_migrations" ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table academic_terms
-- ----------------------------
CREATE UNIQUE INDEX "academic_terms_code_key" ON "public"."academic_terms" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table academic_terms
-- ----------------------------
ALTER TABLE "public"."academic_terms" ADD CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table activities
-- ----------------------------
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table activity_log_action_types
-- ----------------------------
CREATE UNIQUE INDEX "activity_log_action_types_code_key" ON "public"."activity_log_action_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table activity_log_action_types
-- ----------------------------
ALTER TABLE "public"."activity_log_action_types" ADD CONSTRAINT "activity_log_action_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table activity_types
-- ----------------------------
CREATE UNIQUE INDEX "activity_types_code_key" ON "public"."activity_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table activity_types
-- ----------------------------
ALTER TABLE "public"."activity_types" ADD CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table announcements
-- ----------------------------
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table answers
-- ----------------------------
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table assessment_types
-- ----------------------------
CREATE UNIQUE INDEX "assessment_types_code_key" ON "public"."assessment_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table assessment_types
-- ----------------------------
ALTER TABLE "public"."assessment_types" ADD CONSTRAINT "assessment_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table attendance_status_types
-- ----------------------------
CREATE UNIQUE INDEX "attendance_status_types_code_key" ON "public"."attendance_status_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table attendance_status_types
-- ----------------------------
ALTER TABLE "public"."attendance_status_types" ADD CONSTRAINT "attendance_status_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table attendances
-- ----------------------------
CREATE UNIQUE INDEX "attendances_userId_classId_date_key" ON "public"."attendances" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "classId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "date" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table attendances
-- ----------------------------
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table behavior_types
-- ----------------------------
CREATE UNIQUE INDEX "behavior_types_code_key" ON "public"."behavior_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table behavior_types
-- ----------------------------
ALTER TABLE "public"."behavior_types" ADD CONSTRAINT "behavior_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table behaviors
-- ----------------------------
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table category_types
-- ----------------------------
CREATE UNIQUE INDEX "category_types_code_key" ON "public"."category_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table category_types
-- ----------------------------
ALTER TABLE "public"."category_types" ADD CONSTRAINT "category_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table classes
-- ----------------------------
CREATE UNIQUE INDEX "classes_code_key" ON "public"."classes" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table classes
-- ----------------------------
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table config_types
-- ----------------------------
CREATE UNIQUE INDEX "config_types_code_key" ON "public"."config_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table config_types
-- ----------------------------
ALTER TABLE "public"."config_types" ADD CONSTRAINT "config_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table enrollment_status_types
-- ----------------------------
CREATE UNIQUE INDEX "enrollment_status_types_code_key" ON "public"."enrollment_status_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table enrollment_status_types
-- ----------------------------
ALTER TABLE "public"."enrollment_status_types" ADD CONSTRAINT "enrollment_status_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table enrollments
-- ----------------------------
CREATE UNIQUE INDEX "enrollments_userId_classId_key" ON "public"."enrollments" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "classId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table enrollments
-- ----------------------------
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table help_items
-- ----------------------------
CREATE UNIQUE INDEX "help_items_page_section_key_key" ON "public"."help_items" USING btree (
  "page" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "section" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "key" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table help_items
-- ----------------------------
ALTER TABLE "public"."help_items" ADD CONSTRAINT "help_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table marks_distributions
-- ----------------------------
CREATE UNIQUE INDEX "marks_distributions_subjectId_key" ON "public"."marks_distributions" USING btree (
  "subjectId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table marks_distributions
-- ----------------------------
ALTER TABLE "public"."marks_distributions" ADD CONSTRAINT "marks_distributions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table participation_types
-- ----------------------------
CREATE UNIQUE INDEX "participation_types_code_key" ON "public"."participation_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table participation_types
-- ----------------------------
ALTER TABLE "public"."participation_types" ADD CONSTRAINT "participation_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table participations
-- ----------------------------
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table penalties
-- ----------------------------
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table penalty_types
-- ----------------------------
CREATE UNIQUE INDEX "penalty_types_code_key" ON "public"."penalty_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table penalty_types
-- ----------------------------
ALTER TABLE "public"."penalty_types" ADD CONSTRAINT "penalty_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table priority_types
-- ----------------------------
CREATE UNIQUE INDEX "priority_types_code_key" ON "public"."priority_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table priority_types
-- ----------------------------
ALTER TABLE "public"."priority_types" ADD CONSTRAINT "priority_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table private_workspace_links
-- ----------------------------
CREATE UNIQUE INDEX "private_workspace_links_userId_key" ON "public"."private_workspace_links" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table private_workspace_links
-- ----------------------------
ALTER TABLE "public"."private_workspace_links" ADD CONSTRAINT "private_workspace_links_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table programs
-- ----------------------------
CREATE UNIQUE INDEX "programs_code_key" ON "public"."programs" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table programs
-- ----------------------------
ALTER TABLE "public"."programs" ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table question_difficulty_types
-- ----------------------------
CREATE UNIQUE INDEX "question_difficulty_types_code_key" ON "public"."question_difficulty_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table question_difficulty_types
-- ----------------------------
ALTER TABLE "public"."question_difficulty_types" ADD CONSTRAINT "question_difficulty_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table question_types
-- ----------------------------
CREATE UNIQUE INDEX "question_types_code_key" ON "public"."question_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table question_types
-- ----------------------------
ALTER TABLE "public"."question_types" ADD CONSTRAINT "question_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table questions
-- ----------------------------
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table quiz_attempts
-- ----------------------------
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table quiz_status_types
-- ----------------------------
CREATE UNIQUE INDEX "quiz_status_types_code_key" ON "public"."quiz_status_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table quiz_status_types
-- ----------------------------
ALTER TABLE "public"."quiz_status_types" ADD CONSTRAINT "quiz_status_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table quizzes
-- ----------------------------
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table requirement_types
-- ----------------------------
CREATE UNIQUE INDEX "requirement_types_code_key" ON "public"."requirement_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table requirement_types
-- ----------------------------
ALTER TABLE "public"."requirement_types" ADD CONSTRAINT "requirement_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table resource_types
-- ----------------------------
CREATE UNIQUE INDEX "resource_types_code_key" ON "public"."resource_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table resource_types
-- ----------------------------
ALTER TABLE "public"."resource_types" ADD CONSTRAINT "resource_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table resources
-- ----------------------------
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table schedule_types
-- ----------------------------
CREATE UNIQUE INDEX "schedule_types_code_key" ON "public"."schedule_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table schedule_types
-- ----------------------------
ALTER TABLE "public"."schedule_types" ADD CONSTRAINT "schedule_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table standup_attendances
-- ----------------------------
CREATE UNIQUE INDEX "standup_attendances_userId_date_key" ON "public"."standup_attendances" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "date" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table standup_attendances
-- ----------------------------
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table student_marks
-- ----------------------------
CREATE UNIQUE INDEX "student_marks_userId_subjectId_classId_isRepeated_key" ON "public"."student_marks" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "subjectId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "classId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "isRepeated" "pg_catalog"."bool_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table student_marks
-- ----------------------------
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table student_marks_history
-- ----------------------------
ALTER TABLE "public"."student_marks_history" ADD CONSTRAINT "student_marks_history_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table subject_types
-- ----------------------------
CREATE UNIQUE INDEX "subject_types_code_key" ON "public"."subject_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table subject_types
-- ----------------------------
ALTER TABLE "public"."subject_types" ADD CONSTRAINT "subject_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table subjects
-- ----------------------------
CREATE UNIQUE INDEX "subjects_code_key" ON "public"."subjects" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table subjects
-- ----------------------------
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table submission_status_types
-- ----------------------------
CREATE UNIQUE INDEX "submission_status_types_code_key" ON "public"."submission_status_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table submission_status_types
-- ----------------------------
ALTER TABLE "public"."submission_status_types" ADD CONSTRAINT "submission_status_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table submissions
-- ----------------------------
CREATE UNIQUE INDEX "submissions_userId_activityId_key" ON "public"."submissions" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "activityId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table submissions
-- ----------------------------
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table target_audience_types
-- ----------------------------
CREATE UNIQUE INDEX "target_audience_types_code_key" ON "public"."target_audience_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table target_audience_types
-- ----------------------------
ALTER TABLE "public"."target_audience_types" ADD CONSTRAINT "target_audience_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table template_types
-- ----------------------------
CREATE UNIQUE INDEX "template_types_code_key" ON "public"."template_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table template_types
-- ----------------------------
ALTER TABLE "public"."template_types" ADD CONSTRAINT "template_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_favorites
-- ----------------------------
CREATE UNIQUE INDEX "user_favorites_userId_favoriteType_targetId_key" ON "public"."user_favorites" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "favoriteType" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "targetId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_favorites
-- ----------------------------
ALTER TABLE "public"."user_favorites" ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_preferences
-- ----------------------------
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "public"."user_preferences" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_preferences
-- ----------------------------
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_role_assignments
-- ----------------------------
CREATE UNIQUE INDEX "user_role_assignments_userId_roleId_key" ON "public"."user_role_assignments" USING btree (
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "roleId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_role_assignments
-- ----------------------------
ALTER TABLE "public"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_roles
-- ----------------------------
CREATE UNIQUE INDEX "user_roles_code_key" ON "public"."user_roles" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user_status_types
-- ----------------------------
CREATE UNIQUE INDEX "user_status_types_code_key" ON "public"."user_status_types" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user_status_types
-- ----------------------------
ALTER TABLE "public"."user_status_types" ADD CONSTRAINT "user_status_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "users_keycloakId_key" ON "public"."users" USING btree (
  "keycloakId" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table workflow_actions
-- ----------------------------
ALTER TABLE "public"."workflow_actions" ADD CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table workflow_documents
-- ----------------------------
ALTER TABLE "public"."workflow_documents" ADD CONSTRAINT "workflow_documents_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table workflow_inbox_items
-- ----------------------------
CREATE UNIQUE INDEX "workflow_inbox_items_documentId_userId_key" ON "public"."workflow_inbox_items" USING btree (
  "documentId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "userId" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table workflow_inbox_items
-- ----------------------------
ALTER TABLE "public"."workflow_inbox_items" ADD CONSTRAINT "workflow_inbox_items_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table workflow_versions
-- ----------------------------
CREATE UNIQUE INDEX "workflow_versions_documentId_versionNumber_key" ON "public"."workflow_versions" USING btree (
  "documentId" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "versionNumber" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table workflow_versions
-- ----------------------------
ALTER TABLE "public"."workflow_versions" ADD CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table academic_terms
-- ----------------------------
ALTER TABLE "public"."academic_terms" ADD CONSTRAINT "academic_terms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."academic_terms" ADD CONSTRAINT "academic_terms_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table activities
-- ----------------------------
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."activity_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table activity_log_action_types
-- ----------------------------
ALTER TABLE "public"."activity_log_action_types" ADD CONSTRAINT "activity_log_action_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."activity_log_action_types" ADD CONSTRAINT "activity_log_action_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table activity_types
-- ----------------------------
ALTER TABLE "public"."activity_types" ADD CONSTRAINT "activity_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."activity_types" ADD CONSTRAINT "activity_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table announcements
-- ----------------------------
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "public"."priority_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES "public"."target_audience_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table answers
-- ----------------------------
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "public"."quiz_attempts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table assessment_types
-- ----------------------------
ALTER TABLE "public"."assessment_types" ADD CONSTRAINT "assessment_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."assessment_types" ADD CONSTRAINT "assessment_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table attendance_status_types
-- ----------------------------
ALTER TABLE "public"."attendance_status_types" ADD CONSTRAINT "attendance_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."attendance_status_types" ADD CONSTRAINT "attendance_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table attendances
-- ----------------------------
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."attendance_status_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table behavior_types
-- ----------------------------
ALTER TABLE "public"."behavior_types" ADD CONSTRAINT "behavior_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."behavior_types" ADD CONSTRAINT "behavior_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table behaviors
-- ----------------------------
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."behavior_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."behaviors" ADD CONSTRAINT "behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table category_types
-- ----------------------------
ALTER TABLE "public"."category_types" ADD CONSTRAINT "category_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."category_types" ADD CONSTRAINT "category_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table classes
-- ----------------------------
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table config_types
-- ----------------------------
ALTER TABLE "public"."config_types" ADD CONSTRAINT "config_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."config_types" ADD CONSTRAINT "config_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table enrollment_status_types
-- ----------------------------
ALTER TABLE "public"."enrollment_status_types" ADD CONSTRAINT "enrollment_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."enrollment_status_types" ADD CONSTRAINT "enrollment_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table enrollments
-- ----------------------------
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."enrollment_status_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table help_items
-- ----------------------------
ALTER TABLE "public"."help_items" ADD CONSTRAINT "help_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."help_items" ADD CONSTRAINT "help_items_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table marks_distributions
-- ----------------------------
ALTER TABLE "public"."marks_distributions" ADD CONSTRAINT "marks_distributions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."marks_distributions" ADD CONSTRAINT "marks_distributions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."marks_distributions" ADD CONSTRAINT "marks_distributions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table participation_types
-- ----------------------------
ALTER TABLE "public"."participation_types" ADD CONSTRAINT "participation_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."participation_types" ADD CONSTRAINT "participation_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table participations
-- ----------------------------
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."participation_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."participations" ADD CONSTRAINT "participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table penalties
-- ----------------------------
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."penalty_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table penalty_types
-- ----------------------------
ALTER TABLE "public"."penalty_types" ADD CONSTRAINT "penalty_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."penalty_types" ADD CONSTRAINT "penalty_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table priority_types
-- ----------------------------
ALTER TABLE "public"."priority_types" ADD CONSTRAINT "priority_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."priority_types" ADD CONSTRAINT "priority_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table private_workspace_links
-- ----------------------------
ALTER TABLE "public"."private_workspace_links" ADD CONSTRAINT "private_workspace_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table programs
-- ----------------------------
ALTER TABLE "public"."programs" ADD CONSTRAINT "programs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."programs" ADD CONSTRAINT "programs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table question_difficulty_types
-- ----------------------------
ALTER TABLE "public"."question_difficulty_types" ADD CONSTRAINT "question_difficulty_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."question_difficulty_types" ADD CONSTRAINT "question_difficulty_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table question_types
-- ----------------------------
ALTER TABLE "public"."question_types" ADD CONSTRAINT "question_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."question_types" ADD CONSTRAINT "question_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table questions
-- ----------------------------
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."question_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table quiz_attempts
-- ----------------------------
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."quizzes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table quiz_status_types
-- ----------------------------
ALTER TABLE "public"."quiz_status_types" ADD CONSTRAINT "quiz_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."quiz_status_types" ADD CONSTRAINT "quiz_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table quizzes
-- ----------------------------
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table requirement_types
-- ----------------------------
ALTER TABLE "public"."requirement_types" ADD CONSTRAINT "requirement_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."requirement_types" ADD CONSTRAINT "requirement_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table resource_types
-- ----------------------------
ALTER TABLE "public"."resource_types" ADD CONSTRAINT "resource_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."resource_types" ADD CONSTRAINT "resource_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table resources
-- ----------------------------
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."resource_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."resources" ADD CONSTRAINT "resources_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table schedule_types
-- ----------------------------
ALTER TABLE "public"."schedule_types" ADD CONSTRAINT "schedule_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."schedule_types" ADD CONSTRAINT "schedule_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table standup_attendances
-- ----------------------------
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."attendance_status_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."standup_attendances" ADD CONSTRAINT "standup_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table student_marks
-- ----------------------------
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."student_marks" ADD CONSTRAINT "student_marks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table student_marks_history
-- ----------------------------
ALTER TABLE "public"."student_marks_history" ADD CONSTRAINT "student_marks_history_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."student_marks_history" ADD CONSTRAINT "student_marks_history_studentMarksId_fkey" FOREIGN KEY ("studentMarksId") REFERENCES "public"."student_marks" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table subject_types
-- ----------------------------
ALTER TABLE "public"."subject_types" ADD CONSTRAINT "subject_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."subject_types" ADD CONSTRAINT "subject_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table subjects
-- ----------------------------
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_requirementTypeId_fkey" FOREIGN KEY ("requirementTypeId") REFERENCES "public"."requirement_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."subject_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table submission_status_types
-- ----------------------------
ALTER TABLE "public"."submission_status_types" ADD CONSTRAINT "submission_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."submission_status_types" ADD CONSTRAINT "submission_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table submissions
-- ----------------------------
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."activities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."submission_status_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table target_audience_types
-- ----------------------------
ALTER TABLE "public"."target_audience_types" ADD CONSTRAINT "target_audience_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."target_audience_types" ADD CONSTRAINT "target_audience_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table template_types
-- ----------------------------
ALTER TABLE "public"."template_types" ADD CONSTRAINT "template_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."template_types" ADD CONSTRAINT "template_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table user_favorites
-- ----------------------------
ALTER TABLE "public"."user_favorites" ADD CONSTRAINT "user_favorites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_favorites" ADD CONSTRAINT "user_favorites_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_favorites" ADD CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table user_preferences
-- ----------------------------
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table user_role_assignments
-- ----------------------------
ALTER TABLE "public"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."user_roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table user_status_types
-- ----------------------------
ALTER TABLE "public"."user_status_types" ADD CONSTRAINT "user_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."user_status_types" ADD CONSTRAINT "user_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table workflow_actions
-- ----------------------------
ALTER TABLE "public"."workflow_actions" ADD CONSTRAINT "workflow_actions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."workflow_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_actions" ADD CONSTRAINT "workflow_actions_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_actions" ADD CONSTRAINT "workflow_actions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table workflow_documents
-- ----------------------------
ALTER TABLE "public"."workflow_documents" ADD CONSTRAINT "workflow_documents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_documents" ADD CONSTRAINT "workflow_documents_currentAssigneeId_fkey" FOREIGN KEY ("currentAssigneeId") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_documents" ADD CONSTRAINT "workflow_documents_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_documents" ADD CONSTRAINT "workflow_documents_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table workflow_inbox_items
-- ----------------------------
ALTER TABLE "public"."workflow_inbox_items" ADD CONSTRAINT "workflow_inbox_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."workflow_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_inbox_items" ADD CONSTRAINT "workflow_inbox_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table workflow_versions
-- ----------------------------
ALTER TABLE "public"."workflow_versions" ADD CONSTRAINT "workflow_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."workflow_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."workflow_versions" ADD CONSTRAINT "workflow_versions_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
