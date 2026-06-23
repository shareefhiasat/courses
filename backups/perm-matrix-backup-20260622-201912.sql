--
-- PostgreSQL database dump
--

\restrict pgcz2AFsKpGXDwZxuUUtISgGrXlU3s1sdC4ColdyZuOhm9Y5fJwt6ObRCQ3QYhT

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: military_lms
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO military_lms;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: military_lms
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BucketType; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."BucketType" AS ENUM (
    'PRIVATE',
    'WORKFLOW',
    'SHARED'
);


ALTER TYPE public."BucketType" OWNER TO military_lms;

--
-- Name: NotificationCategory; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."NotificationCategory" AS ENUM (
    'SYSTEM',
    'ACADEMIC',
    'ATTENDANCE',
    'ASSESSMENT',
    'COMMUNICATION',
    'ANNOUNCEMENT',
    'WORKFLOW',
    'FILE',
    'QR',
    'BEHAVIOR'
);


ALTER TYPE public."NotificationCategory" OWNER TO military_lms;

--
-- Name: NotificationPriority; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."NotificationPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."NotificationPriority" OWNER TO military_lms;

--
-- Name: SharePermission; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."SharePermission" AS ENUM (
    'VIEW',
    'DOWNLOAD',
    'COMMENT',
    'EDIT'
);


ALTER TYPE public."SharePermission" OWNER TO military_lms;

--
-- Name: ShareSubjectType; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."ShareSubjectType" AS ENUM (
    'USER',
    'ROLE'
);


ALTER TYPE public."ShareSubjectType" OWNER TO military_lms;

--
-- Name: WorkflowDocumentStatus; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."WorkflowDocumentStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'UNDER_HR_REVIEW',
    'UNDER_ADMIN_REVIEW',
    'APPROVED',
    'REJECTED',
    'AMENDED'
);


ALTER TYPE public."WorkflowDocumentStatus" OWNER TO military_lms;

--
-- Name: WorkflowInstanceStatus; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."WorkflowInstanceStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."WorkflowInstanceStatus" OWNER TO military_lms;

--
-- Name: WorkflowStatus; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."WorkflowStatus" AS ENUM (
    'DRAFT',
    'REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."WorkflowStatus" OWNER TO military_lms;

--
-- Name: WorkflowStepStatus; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."WorkflowStepStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'SKIPPED'
);


ALTER TYPE public."WorkflowStepStatus" OWNER TO military_lms;

--
-- Name: WorkflowType; Type: TYPE; Schema: public; Owner: military_lms
--

CREATE TYPE public."WorkflowType" AS ENUM (
    'ATTENDANCE_DAILY',
    'ATTENDANCE_WEEKLY',
    'GENERAL_HR',
    'GENERAL_ADMIN',
    'GENERAL_MIXED_HR_ADMIN',
    'GENERAL_MIXED_ADMIN_HR'
);


ALTER TYPE public."WorkflowType" OWNER TO military_lms;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO military_lms;

--
-- Name: academic_terms; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.academic_terms (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.academic_terms OWNER TO military_lms;

--
-- Name: academic_terms_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.academic_terms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.academic_terms_id_seq OWNER TO military_lms;

--
-- Name: academic_terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.academic_terms_id_seq OWNED BY public.academic_terms.id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.activities (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "typeId" integer NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "maxScore" double precision,
    weight double precision DEFAULT 1.0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descriptionAr" text,
    "descriptionEn" text,
    "allowRetake" boolean DEFAULT false NOT NULL,
    "imageUrl" text,
    link text,
    "quizId" integer
);


ALTER TABLE public.activities OWNER TO military_lms;

--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activities_id_seq OWNER TO military_lms;

--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.activities_id_seq OWNED BY public.activities.id;


--
-- Name: activity_log_action_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.activity_log_action_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activity_log_action_types OWNER TO military_lms;

--
-- Name: activity_log_action_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.activity_log_action_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_log_action_types_id_seq OWNER TO military_lms;

--
-- Name: activity_log_action_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.activity_log_action_types_id_seq OWNED BY public.activity_log_action_types.id;


--
-- Name: activity_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.activity_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    icon text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activity_types OWNER TO military_lms;

--
-- Name: activity_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.activity_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_types_id_seq OWNER TO military_lms;

--
-- Name: activity_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.activity_types_id_seq OWNED BY public.activity_types.id;


--
-- Name: admin_scopes; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.admin_scopes (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "scopeType" text NOT NULL,
    "programId" integer,
    "classroomId" integer,
    "instructorUserId" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_scopes OWNER TO military_lms;

--
-- Name: admin_scopes_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.admin_scopes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_scopes_id_seq OWNER TO military_lms;

--
-- Name: admin_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.admin_scopes_id_seq OWNED BY public.admin_scopes.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "priorityId" integer NOT NULL,
    "targetAudienceId" integer NOT NULL,
    "programId" integer,
    "classId" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "publishAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descriptionEn" text,
    "descriptionAr" text,
    "subjectId" integer
);


ALTER TABLE public.announcements OWNER TO military_lms;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.announcements_id_seq OWNER TO military_lms;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: answers; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.answers (
    id integer NOT NULL,
    "questionId" integer NOT NULL,
    "quizAttemptId" integer NOT NULL,
    answer text NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    points double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.answers OWNER TO military_lms;

--
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.answers_id_seq OWNER TO military_lms;

--
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- Name: assessment_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.assessment_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.assessment_types OWNER TO military_lms;

--
-- Name: assessment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.assessment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assessment_types_id_seq OWNER TO military_lms;

--
-- Name: assessment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.assessment_types_id_seq OWNED BY public.assessment_types.id;


--
-- Name: attendance_amendments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.attendance_amendments (
    id integer NOT NULL,
    "attendanceId" integer NOT NULL,
    "fromStatusId" integer NOT NULL,
    "toStatusId" integer NOT NULL,
    reason text NOT NULL,
    "amendedBy" integer NOT NULL,
    "amendedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attendance_amendments OWNER TO military_lms;

--
-- Name: attendance_amendments_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.attendance_amendments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attendance_amendments_id_seq OWNER TO military_lms;

--
-- Name: attendance_amendments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.attendance_amendments_id_seq OWNED BY public.attendance_amendments.id;


--
-- Name: attendance_status_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.attendance_status_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.attendance_status_types OWNER TO military_lms;

--
-- Name: attendance_status_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.attendance_status_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attendance_status_types_id_seq OWNER TO military_lms;

--
-- Name: attendance_status_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.attendance_status_types_id_seq OWNED BY public.attendance_status_types.id;


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.attendances (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "classId" integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "statusId" integer NOT NULL,
    notes text,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "programId" integer,
    "subjectId" integer
);


ALTER TABLE public.attendances OWNER TO military_lms;

--
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attendances_id_seq OWNER TO military_lms;

--
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- Name: behavior_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.behavior_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    category text DEFAULT 'neutral'::text,
    points integer DEFAULT 0 NOT NULL,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.behavior_types OWNER TO military_lms;

--
-- Name: behavior_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.behavior_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.behavior_types_id_seq OWNER TO military_lms;

--
-- Name: behavior_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.behavior_types_id_seq OWNED BY public.behavior_types.id;


--
-- Name: behaviors; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.behaviors (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "classId" integer,
    "programId" integer,
    "subjectId" integer,
    "typeId" integer NOT NULL,
    "descriptionEn" text NOT NULL,
    "descriptionAr" text,
    points integer DEFAULT 0 NOT NULL,
    comment text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.behaviors OWNER TO military_lms;

--
-- Name: behaviors_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.behaviors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.behaviors_id_seq OWNER TO military_lms;

--
-- Name: behaviors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.behaviors_id_seq OWNED BY public.behaviors.id;


--
-- Name: break_sessions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.break_sessions (
    id integer NOT NULL,
    "programId" integer NOT NULL,
    "instructorUserId" integer,
    "classroomId" integer,
    "timeSlotId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "breakType" text NOT NULL,
    notes text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurrencePattern" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "seriesId" text
);


ALTER TABLE public.break_sessions OWNER TO military_lms;

--
-- Name: break_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.break_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.break_sessions_id_seq OWNER TO military_lms;

--
-- Name: break_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.break_sessions_id_seq OWNED BY public.break_sessions.id;


--
-- Name: category_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.category_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    icon text,
    color text,
    sort integer DEFAULT 0 NOT NULL,
    "categoryType" text DEFAULT 'ACADEMIC'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.category_types OWNER TO military_lms;

--
-- Name: category_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.category_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_types_id_seq OWNER TO military_lms;

--
-- Name: category_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.category_types_id_seq OWNED BY public.category_types.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "maxCapacity" integer,
    capacity integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "programId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "instructorId" integer,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descriptionAr" text,
    "descriptionEn" text,
    "locationAr" text,
    "locationEn" text,
    "ownerEmail" text,
    term text,
    year text,
    schedule jsonb,
    "classroomId" integer,
    "substituteInstructorId" integer
);


ALTER TABLE public.classes OWNER TO military_lms;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classes_id_seq OWNER TO military_lms;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: classroom_availability; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.classroom_availability (
    id integer NOT NULL,
    "classroomId" integer NOT NULL,
    "dayOfWeek" text[],
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.classroom_availability OWNER TO military_lms;

--
-- Name: classroom_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.classroom_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classroom_availability_id_seq OWNER TO military_lms;

--
-- Name: classroom_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.classroom_availability_id_seq OWNED BY public.classroom_availability.id;


--
-- Name: classroom_availability_slot; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.classroom_availability_slot (
    id integer NOT NULL,
    "availabilityId" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.classroom_availability_slot OWNER TO military_lms;

--
-- Name: classroom_availability_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.classroom_availability_slot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classroom_availability_slot_id_seq OWNER TO military_lms;

--
-- Name: classroom_availability_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.classroom_availability_slot_id_seq OWNED BY public.classroom_availability_slot.id;


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.classrooms (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "locationEn" text,
    "locationAr" text,
    capacity integer NOT NULL,
    floor text,
    "roomNumber" text,
    equipment text[],
    "availableDays" text[],
    status text DEFAULT 'Available'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.classrooms OWNER TO military_lms;

--
-- Name: classrooms_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.classrooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.classrooms_id_seq OWNER TO military_lms;

--
-- Name: classrooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.classrooms_id_seq OWNED BY public.classrooms.id;


--
-- Name: config_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.config_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.config_types OWNER TO military_lms;

--
-- Name: config_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.config_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.config_types_id_seq OWNER TO military_lms;

--
-- Name: config_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.config_types_id_seq OWNED BY public.config_types.id;


--
-- Name: enrollment_status_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.enrollment_status_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.enrollment_status_types OWNER TO military_lms;

--
-- Name: enrollment_status_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.enrollment_status_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.enrollment_status_types_id_seq OWNER TO military_lms;

--
-- Name: enrollment_status_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.enrollment_status_types_id_seq OWNED BY public.enrollment_status_types.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "programId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "classId" integer NOT NULL,
    "statusId" integer NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.enrollments OWNER TO military_lms;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.enrollments_id_seq OWNER TO military_lms;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: file_activities; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.file_activities (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.file_activities OWNER TO military_lms;

--
-- Name: file_comments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.file_comments (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "userId" integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.file_comments OWNER TO military_lms;

--
-- Name: file_shares; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.file_shares (
    id text NOT NULL,
    "fileId" text,
    "folderId" text,
    "subjectType" public."ShareSubjectType" NOT NULL,
    "subjectUserId" integer,
    "subjectRole" text,
    permission public."SharePermission" DEFAULT 'VIEW'::public."SharePermission" NOT NULL,
    "grantedById" integer NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.file_shares OWNER TO military_lms;

--
-- Name: file_versions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.file_versions (
    id text NOT NULL,
    "fileId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    "s3Key" text NOT NULL,
    size integer NOT NULL,
    "uploadedById" integer NOT NULL,
    "changeNote" text,
    "minioVersionId" text,
    "checksumSha256" text,
    "isCurrent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.file_versions OWNER TO military_lms;

--
-- Name: files; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.files (
    id text NOT NULL,
    "s3Key" text NOT NULL,
    bucket public."BucketType" NOT NULL,
    name text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    "ownerId" integer NOT NULL,
    "folderId" text,
    "folderPath" text,
    "currentVersionId" text,
    "checksumSha256" text,
    "workflowStatus" text DEFAULT 'DRAFT'::text,
    "publicLinkToken" text,
    "publicLinkExpiry" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "isStarred" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedById" integer,
    "searchVector" tsvector,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.files OWNER TO military_lms;

--
-- Name: flexible_schedule_sessions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.flexible_schedule_sessions (
    id integer NOT NULL,
    "programId" integer NOT NULL,
    "courseId" integer,
    "subjectId" integer,
    "instructorUserId" integer NOT NULL,
    "classroomId" integer,
    "timeSlotId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "recurrenceRule" text,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "parentSessionId" integer,
    notes text,
    "isCancelled" boolean DEFAULT false NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelReason" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flexible_schedule_sessions OWNER TO military_lms;

--
-- Name: flexible_schedule_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.flexible_schedule_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flexible_schedule_sessions_id_seq OWNER TO military_lms;

--
-- Name: flexible_schedule_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.flexible_schedule_sessions_id_seq OWNED BY public.flexible_schedule_sessions.id;


--
-- Name: folders; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.folders (
    id text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "ownerId" integer NOT NULL,
    path text NOT NULL,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "isStarred" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.folders OWNER TO military_lms;

--
-- Name: help_items; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.help_items (
    id integer NOT NULL,
    page text NOT NULL,
    section text NOT NULL,
    key text NOT NULL,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "contentEn" text NOT NULL,
    "contentAr" text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.help_items OWNER TO military_lms;

--
-- Name: help_items_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.help_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.help_items_id_seq OWNER TO military_lms;

--
-- Name: help_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.help_items_id_seq OWNED BY public.help_items.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    "programId" integer,
    "descriptionEn" text NOT NULL,
    "descriptionAr" text,
    type text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurrencePattern" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "seriesId" text
);


ALTER TABLE public.holidays OWNER TO military_lms;

--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.holidays_id_seq OWNER TO military_lms;

--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: instructor_assignment_history; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.instructor_assignment_history (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "sessionId" integer,
    "oldInstructorId" integer,
    "newInstructorId" integer,
    "effectiveFrom" timestamp(3) without time zone NOT NULL,
    "effectiveTo" timestamp(3) without time zone,
    "changedBy" integer,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.instructor_assignment_history OWNER TO military_lms;

--
-- Name: instructor_assignment_history_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.instructor_assignment_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.instructor_assignment_history_id_seq OWNER TO military_lms;

--
-- Name: instructor_assignment_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.instructor_assignment_history_id_seq OWNED BY public.instructor_assignment_history.id;


--
-- Name: instructor_availability; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.instructor_availability (
    id integer NOT NULL,
    "instructorUserId" integer NOT NULL,
    "maxSessionsPerDay" integer DEFAULT 3 NOT NULL,
    "maxHoursPerWeek" integer,
    status text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dayOfWeek" text[],
    "endDate" timestamp(3) without time zone NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "classId" integer,
    "programId" integer,
    "subjectId" integer
);


ALTER TABLE public.instructor_availability OWNER TO military_lms;

--
-- Name: instructor_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.instructor_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.instructor_availability_id_seq OWNER TO military_lms;

--
-- Name: instructor_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.instructor_availability_id_seq OWNED BY public.instructor_availability.id;


--
-- Name: instructor_availability_slot; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.instructor_availability_slot (
    id integer NOT NULL,
    "availabilityId" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.instructor_availability_slot OWNER TO military_lms;

--
-- Name: instructor_availability_slot_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.instructor_availability_slot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.instructor_availability_slot_id_seq OWNER TO military_lms;

--
-- Name: instructor_availability_slot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.instructor_availability_slot_id_seq OWNED BY public.instructor_availability_slot.id;


--
-- Name: marks_distributions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.marks_distributions (
    id integer NOT NULL,
    "subjectId" integer NOT NULL,
    "midTermExam" double precision DEFAULT 20 NOT NULL,
    "finalExam" double precision DEFAULT 40 NOT NULL,
    homework double precision DEFAULT 5 NOT NULL,
    "labsProjectResearch" double precision DEFAULT 10 NOT NULL,
    quizzes double precision DEFAULT 5 NOT NULL,
    participation double precision DEFAULT 10 NOT NULL,
    attendance double precision DEFAULT 10 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.marks_distributions OWNER TO military_lms;

--
-- Name: marks_distributions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.marks_distributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.marks_distributions_id_seq OWNER TO military_lms;

--
-- Name: marks_distributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.marks_distributions_id_seq OWNED BY public.marks_distributions.id;


--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.notification_deliveries (
    id text NOT NULL,
    "notificationId" text NOT NULL,
    channel text NOT NULL,
    status text NOT NULL,
    "providerMsgId" text,
    error text,
    attempts integer DEFAULT 0 NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_deliveries OWNER TO military_lms;

--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.notification_log (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deliveryStatus" text DEFAULT 'sent'::text NOT NULL,
    "sessionId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_log OWNER TO military_lms;

--
-- Name: notification_log_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.notification_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_log_id_seq OWNER TO military_lms;

--
-- Name: notification_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.notification_log_id_seq OWNED BY public.notification_log.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "inAppEnabled" boolean DEFAULT true NOT NULL,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    "smsEnabled" boolean DEFAULT false NOT NULL,
    "pushEnabled" boolean DEFAULT false NOT NULL,
    matrix jsonb DEFAULT '{}'::jsonb NOT NULL,
    "soundEnabled" boolean DEFAULT true NOT NULL,
    "vibrationEnabled" boolean DEFAULT true NOT NULL,
    "browserNotifEnabled" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO military_lms;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_preferences_id_seq OWNER TO military_lms;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" integer NOT NULL,
    category public."NotificationCategory" NOT NULL,
    event text NOT NULL,
    priority public."NotificationPriority" DEFAULT 'NORMAL'::public."NotificationPriority" NOT NULL,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "bodyEn" text NOT NULL,
    "bodyAr" text,
    link text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "groupKey" text,
    "createdById" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO military_lms;

--
-- Name: operations; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.operations (
    id integer NOT NULL,
    "screenId" integer NOT NULL,
    "operationKey" text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    category text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.operations OWNER TO military_lms;

--
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operations_id_seq OWNER TO military_lms;

--
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- Name: participation_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.participation_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isPositive" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.participation_types OWNER TO military_lms;

--
-- Name: participation_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.participation_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.participation_types_id_seq OWNER TO military_lms;

--
-- Name: participation_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.participation_types_id_seq OWNED BY public.participation_types.id;


--
-- Name: participations; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.participations (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "classId" integer,
    "programId" integer,
    "subjectId" integer,
    "typeId" integer NOT NULL,
    points integer DEFAULT 0,
    "descriptionEn" text,
    "descriptionAr" text,
    comment text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.participations OWNER TO military_lms;

--
-- Name: participations_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.participations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.participations_id_seq OWNER TO military_lms;

--
-- Name: participations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.participations_id_seq OWNED BY public.participations.id;


--
-- Name: penalties; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.penalties (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "classId" integer,
    "programId" integer,
    "subjectId" integer,
    "typeId" integer NOT NULL,
    "descriptionEn" text NOT NULL,
    "descriptionAr" text,
    points integer DEFAULT 0 NOT NULL,
    comment text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.penalties OWNER TO military_lms;

--
-- Name: penalties_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.penalties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.penalties_id_seq OWNER TO military_lms;

--
-- Name: penalties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.penalties_id_seq OWNED BY public.penalties.id;


--
-- Name: penalty_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.penalty_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    severity text DEFAULT 'medium'::text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.penalty_types OWNER TO military_lms;

--
-- Name: penalty_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.penalty_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.penalty_types_id_seq OWNER TO military_lms;

--
-- Name: penalty_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.penalty_types_id_seq OWNED BY public.penalty_types.id;


--
-- Name: permission_denial_audit; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.permission_denial_audit (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    reason text NOT NULL,
    "userRole" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permission_denial_audit OWNER TO military_lms;

--
-- Name: permission_denial_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.permission_denial_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permission_denial_audit_id_seq OWNER TO military_lms;

--
-- Name: permission_denial_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.permission_denial_audit_id_seq OWNED BY public.permission_denial_audit.id;


--
-- Name: priority_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.priority_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    level integer DEFAULT 0 NOT NULL,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.priority_types OWNER TO military_lms;

--
-- Name: priority_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.priority_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.priority_types_id_seq OWNER TO military_lms;

--
-- Name: priority_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.priority_types_id_seq OWNED BY public.priority_types.id;


--
-- Name: programs; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.programs (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    "durationYears" integer,
    "minGPA" double precision,
    "totalCreditHours" integer,
    "durationType" text DEFAULT 'ACADEMIC_SEMESTER'::text NOT NULL,
    "durationValue" integer,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "categoryId" integer,
    "targetAudience" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.programs OWNER TO military_lms;

--
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.programs_id_seq OWNER TO military_lms;

--
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- Name: public_links; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.public_links (
    id text NOT NULL,
    "fileId" text,
    "folderId" text,
    token text NOT NULL,
    "passwordHash" text,
    "maxDownloads" integer,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "createdById" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.public_links OWNER TO military_lms;

--
-- Name: question_difficulty_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.question_difficulty_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.question_difficulty_types OWNER TO military_lms;

--
-- Name: question_difficulty_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.question_difficulty_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_difficulty_types_id_seq OWNER TO military_lms;

--
-- Name: question_difficulty_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.question_difficulty_types_id_seq OWNED BY public.question_difficulty_types.id;


--
-- Name: question_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.question_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.question_types OWNER TO military_lms;

--
-- Name: question_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.question_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.question_types_id_seq OWNER TO military_lms;

--
-- Name: question_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.question_types_id_seq OWNED BY public.question_types.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    "quizId" integer NOT NULL,
    "questionEn" text NOT NULL,
    "questionAr" text,
    "explanationEn" text,
    "explanationAr" text,
    "typeId" integer NOT NULL,
    options text,
    "correctAnswer" text,
    points double precision DEFAULT 1 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.questions OWNER TO military_lms;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.questions_id_seq OWNER TO military_lms;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.quiz_attempts (
    id integer NOT NULL,
    "quizId" integer NOT NULL,
    "userId" integer NOT NULL,
    score double precision,
    "maxScore" double precision,
    percentage double precision,
    passed boolean,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "timeSpent" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quiz_attempts OWNER TO military_lms;

--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.quiz_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quiz_attempts_id_seq OWNER TO military_lms;

--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.quiz_attempts_id_seq OWNED BY public.quiz_attempts.id;


--
-- Name: quiz_status_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.quiz_status_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quiz_status_types OWNER TO military_lms;

--
-- Name: quiz_status_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.quiz_status_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quiz_status_types_id_seq OWNER TO military_lms;

--
-- Name: quiz_status_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.quiz_status_types_id_seq OWNED BY public.quiz_status_types.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    difficulty text DEFAULT 'medium'::text NOT NULL,
    duration integer DEFAULT 60 NOT NULL,
    "maxAttempts" integer DEFAULT 1 NOT NULL,
    "passingScore" double precision DEFAULT 60 NOT NULL,
    "randomizeQuestions" boolean DEFAULT false NOT NULL,
    "randomizeAnswers" boolean DEFAULT false NOT NULL,
    "showCorrectAnswers" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quizzes OWNER TO military_lms;

--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quizzes_id_seq OWNER TO military_lms;

--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: requirement_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.requirement_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.requirement_types OWNER TO military_lms;

--
-- Name: requirement_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.requirement_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.requirement_types_id_seq OWNER TO military_lms;

--
-- Name: requirement_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.requirement_types_id_seq OWNED BY public.requirement_types.id;


--
-- Name: resource_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.resource_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.resource_types OWNER TO military_lms;

--
-- Name: resource_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.resource_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resource_types_id_seq OWNER TO military_lms;

--
-- Name: resource_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.resource_types_id_seq OWNED BY public.resource_types.id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    "classId" integer,
    "titleEn" text NOT NULL,
    "titleAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    "typeId" integer NOT NULL,
    "categoryId" integer,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    "programId" integer,
    "subjectId" integer,
    "dueDate" timestamp(3) without time zone,
    featured boolean DEFAULT false NOT NULL,
    url text
);


ALTER TABLE public.resources OWNER TO military_lms;

--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resources_id_seq OWNER TO military_lms;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role text NOT NULL,
    "screenId" integer NOT NULL,
    "operationId" integer,
    allowed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO military_lms;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO military_lms;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: schedule_sessions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.schedule_sessions (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "instructorUserId" integer NOT NULL,
    "classroomId" integer,
    "timeSlotId" integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    notes text,
    "isCancelled" boolean DEFAULT false NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelReason" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.schedule_sessions OWNER TO military_lms;

--
-- Name: schedule_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.schedule_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schedule_sessions_id_seq OWNER TO military_lms;

--
-- Name: schedule_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.schedule_sessions_id_seq OWNED BY public.schedule_sessions.id;


--
-- Name: schedule_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.schedule_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    icon text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.schedule_types OWNER TO military_lms;

--
-- Name: schedule_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.schedule_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.schedule_types_id_seq OWNER TO military_lms;

--
-- Name: schedule_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.schedule_types_id_seq OWNED BY public.schedule_types.id;


--
-- Name: scheduled_sessions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.scheduled_sessions (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "instructorId" integer,
    "classroomId" integer,
    "startDateTime" timestamp(3) without time zone NOT NULL,
    "endDateTime" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isRecurringInstance" boolean DEFAULT false NOT NULL,
    "parentSessionId" integer,
    "recurrenceCount" integer,
    "recurrenceDays" text[] DEFAULT ARRAY[]::text[],
    "recurrenceEndDate" timestamp(3) without time zone,
    "recurrenceType" text,
    "seriesId" integer,
    "capacityOverridden" boolean DEFAULT false NOT NULL,
    "capacityOverrideReason" text,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" integer,
    "deletionReason" text,
    "recurrenceSeriesId" text
);


ALTER TABLE public.scheduled_sessions OWNER TO military_lms;

--
-- Name: scheduled_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.scheduled_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scheduled_sessions_id_seq OWNER TO military_lms;

--
-- Name: scheduled_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.scheduled_sessions_id_seq OWNED BY public.scheduled_sessions.id;


--
-- Name: screens; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.screens (
    id integer NOT NULL,
    "screenId" text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    "descriptionEn" text,
    "descriptionAr" text,
    category text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.screens OWNER TO military_lms;

--
-- Name: screens_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.screens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.screens_id_seq OWNER TO military_lms;

--
-- Name: screens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.screens_id_seq OWNED BY public.screens.id;


--
-- Name: session_series; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.session_series (
    id integer NOT NULL,
    name text NOT NULL,
    pattern text NOT NULL,
    "recurrenceType" text NOT NULL,
    "recurrenceDays" text[],
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "totalSessions" integer NOT NULL,
    "completedSessions" integer DEFAULT 0 NOT NULL,
    "cancelledSessions" integer DEFAULT 0 NOT NULL,
    "classId" integer NOT NULL,
    "instructorId" integer NOT NULL,
    "classroomId" integer NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.session_series OWNER TO military_lms;

--
-- Name: session_series_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.session_series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_series_id_seq OWNER TO military_lms;

--
-- Name: session_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.session_series_id_seq OWNED BY public.session_series.id;


--
-- Name: standup_attendances; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.standup_attendances (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "statusId" integer NOT NULL,
    notes text,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "programId" integer
);


ALTER TABLE public.standup_attendances OWNER TO military_lms;

--
-- Name: standup_attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.standup_attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.standup_attendances_id_seq OWNER TO military_lms;

--
-- Name: standup_attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.standup_attendances_id_seq OWNED BY public.standup_attendances.id;


--
-- Name: student_marks; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.student_marks (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "classId" integer NOT NULL,
    "midTermExam" double precision,
    "finalExam" double precision,
    homework double precision,
    "labsProjectResearch" double precision,
    quizzes double precision,
    participation double precision,
    attendance double precision,
    "totalMarks" double precision,
    "letterGrade" text,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isRepeated" boolean DEFAULT false NOT NULL,
    "gradeType" text DEFAULT 'calculated'::text NOT NULL
);


ALTER TABLE public.student_marks OWNER TO military_lms;

--
-- Name: student_marks_history; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.student_marks_history (
    id integer NOT NULL,
    "studentMarksId" integer NOT NULL,
    "userId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "classId" integer NOT NULL,
    "actionType" text NOT NULL,
    "actionBy" integer,
    "previousState" jsonb,
    "newState" jsonb NOT NULL,
    "changedFields" jsonb,
    "isRepeated" boolean,
    "gradeType" text,
    "midTermExam" double precision,
    "finalExam" double precision,
    homework double precision,
    "labsProjectResearch" double precision,
    quizzes double precision,
    participation double precision,
    attendance double precision,
    "totalMarks" double precision,
    "letterGrade" text,
    "actionReason" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.student_marks_history OWNER TO military_lms;

--
-- Name: student_marks_history_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.student_marks_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_marks_history_id_seq OWNER TO military_lms;

--
-- Name: student_marks_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.student_marks_history_id_seq OWNED BY public.student_marks_history.id;


--
-- Name: student_marks_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.student_marks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_marks_id_seq OWNER TO military_lms;

--
-- Name: student_marks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.student_marks_id_seq OWNED BY public.student_marks.id;


--
-- Name: subject_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.subject_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subject_types OWNER TO military_lms;

--
-- Name: subject_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.subject_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subject_types_id_seq OWNER TO military_lms;

--
-- Name: subject_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.subject_types_id_seq OWNED BY public.subject_types.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    credits integer DEFAULT 3 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "programId" integer NOT NULL,
    "typeId" integer NOT NULL,
    "requirementTypeId" integer NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descriptionAr" text,
    "descriptionEn" text
);


ALTER TABLE public.subjects OWNER TO military_lms;

--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subjects_id_seq OWNER TO military_lms;

--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: submission_status_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.submission_status_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.submission_status_types OWNER TO military_lms;

--
-- Name: submission_status_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.submission_status_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.submission_status_types_id_seq OWNER TO military_lms;

--
-- Name: submission_status_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.submission_status_types_id_seq OWNED BY public.submission_status_types.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "activityId" integer NOT NULL,
    content text,
    "fileUrl" text,
    "fileName" text,
    "fileSize" integer,
    "statusId" integer NOT NULL,
    score double precision,
    "maxScore" double precision,
    feedback text,
    "gradedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.submissions OWNER TO military_lms;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.submissions_id_seq OWNER TO military_lms;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: target_audience_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.target_audience_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.target_audience_types OWNER TO military_lms;

--
-- Name: target_audience_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.target_audience_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.target_audience_types_id_seq OWNER TO military_lms;

--
-- Name: target_audience_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.target_audience_types_id_seq OWNED BY public.target_audience_types.id;


--
-- Name: teacher_availability; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.teacher_availability (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "availableDays" text[],
    "maxSessionsPerDay" integer DEFAULT 3 NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    "contactPhone" text,
    "contactEmail" text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_availability OWNER TO military_lms;

--
-- Name: teacher_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.teacher_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.teacher_availability_id_seq OWNER TO military_lms;

--
-- Name: teacher_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.teacher_availability_id_seq OWNED BY public.teacher_availability.id;


--
-- Name: template_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.template_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.template_types OWNER TO military_lms;

--
-- Name: template_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.template_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.template_types_id_seq OWNER TO military_lms;

--
-- Name: template_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.template_types_id_seq OWNED BY public.template_types.id;


--
-- Name: time_slots; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.time_slots (
    id integer NOT NULL,
    "programId" integer NOT NULL,
    "labelEn" text NOT NULL,
    "labelAr" text,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "durationMinutes" integer NOT NULL,
    "isBreak" boolean DEFAULT false NOT NULL,
    "breakType" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.time_slots OWNER TO military_lms;

--
-- Name: time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.time_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.time_slots_id_seq OWNER TO military_lms;

--
-- Name: time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.time_slots_id_seq OWNED BY public.time_slots.id;


--
-- Name: user_category_access; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_category_access (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "categoryId" integer NOT NULL,
    "roleId" integer,
    "canView" boolean DEFAULT true NOT NULL,
    "canManage" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "classId" integer,
    "programId" integer,
    "subjectId" integer
);


ALTER TABLE public.user_category_access OWNER TO military_lms;

--
-- Name: user_category_access_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_category_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_category_access_id_seq OWNER TO military_lms;

--
-- Name: user_category_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_category_access_id_seq OWNED BY public.user_category_access.id;


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_favorites (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "favoriteType" text NOT NULL,
    "targetId" text NOT NULL,
    metadata jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_favorites OWNER TO military_lms;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_favorites_id_seq OWNER TO military_lms;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_favorites_id_seq OWNED BY public.user_favorites.id;


--
-- Name: user_file_preferences; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_file_preferences (
    "userId" integer NOT NULL,
    "fileId" text NOT NULL,
    starred boolean DEFAULT false NOT NULL,
    pinned boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_file_preferences OWNER TO military_lms;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    settings jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO military_lms;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_preferences_id_seq OWNER TO military_lms;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_role_assignments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_role_assignments (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedBy" integer
);


ALTER TABLE public.user_role_assignments OWNER TO military_lms;

--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_role_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_role_assignments_id_seq OWNER TO military_lms;

--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_role_assignments_id_seq OWNED BY public.user_role_assignments.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    level integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_roles OWNER TO military_lms;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_id_seq OWNER TO military_lms;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: user_status_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.user_status_types (
    id integer NOT NULL,
    code text NOT NULL,
    "nameEn" text NOT NULL,
    "nameAr" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_status_types OWNER TO military_lms;

--
-- Name: user_status_types_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.user_status_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_status_types_id_seq OWNER TO military_lms;

--
-- Name: user_status_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.user_status_types_id_seq OWNED BY public.user_status_types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    "firstName" text,
    "lastName" text,
    "displayName" text,
    "realName" text,
    "studentNumber" text,
    sequence integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "keycloakId" text,
    "additionalImageUrl" text,
    "militaryIdImageUrl" text,
    "profileImageUrl" text,
    "qidImageUrl" text,
    "displayNameAr" text,
    "firstNameAr" text,
    "lastNameAr" text
);


ALTER TABLE public.users OWNER TO military_lms;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO military_lms;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workflow_comments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_comments (
    id integer NOT NULL,
    "workflowDocumentId" integer NOT NULL,
    "authorId" integer NOT NULL,
    comment text NOT NULL,
    action text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workflow_comments OWNER TO military_lms;

--
-- Name: workflow_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.workflow_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflow_comments_id_seq OWNER TO military_lms;

--
-- Name: workflow_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.workflow_comments_id_seq OWNED BY public.workflow_comments.id;


--
-- Name: workflow_definitions; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_definitions (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workflow_definitions OWNER TO military_lms;

--
-- Name: workflow_documents; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_documents (
    id integer NOT NULL,
    "workflowType" public."WorkflowType" NOT NULL,
    title text NOT NULL,
    description text,
    status public."WorkflowDocumentStatus" DEFAULT 'DRAFT'::public."WorkflowDocumentStatus" NOT NULL,
    "fileId" text,
    "fileVersionId" text,
    "submitterId" integer NOT NULL,
    "currentAssigneeId" integer,
    "classId" integer,
    "instructorId" integer,
    date timestamp(3) without time zone,
    program text,
    subject text,
    "reviewCycleCount" integer DEFAULT 0 NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workflow_documents OWNER TO military_lms;

--
-- Name: workflow_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.workflow_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflow_documents_id_seq OWNER TO military_lms;

--
-- Name: workflow_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.workflow_documents_id_seq OWNED BY public.workflow_documents.id;


--
-- Name: workflow_history; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_history (
    id bigint NOT NULL,
    "instanceId" text NOT NULL,
    "stepId" text,
    "eventType" text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    comment text,
    "actorId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workflow_history OWNER TO military_lms;

--
-- Name: workflow_history_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.workflow_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflow_history_id_seq OWNER TO military_lms;

--
-- Name: workflow_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.workflow_history_id_seq OWNED BY public.workflow_history.id;


--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_instances (
    id text NOT NULL,
    "definitionId" text NOT NULL,
    "fileId" text,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public."WorkflowInstanceStatus" DEFAULT 'DRAFT'::public."WorkflowInstanceStatus" NOT NULL,
    "currentStageId" text,
    "assignedUserId" integer,
    "assignedRole" text,
    "rejectionReason" text,
    "revisionCount" integer DEFAULT 0 NOT NULL,
    "lastRevisedAt" timestamp(3) without time zone,
    "initiatedById" integer NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workflow_instances OWNER TO military_lms;

--
-- Name: workflow_stages; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_stages (
    id text NOT NULL,
    "definitionId" text NOT NULL,
    "stageOrder" integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "assignedRole" text NOT NULL,
    "allowedActions" text[],
    "onApproveGoto" integer,
    "onRejectGoto" integer,
    "isTerminalApproved" boolean DEFAULT false NOT NULL,
    "slaHours" integer
);


ALTER TABLE public.workflow_stages OWNER TO military_lms;

--
-- Name: workflow_status_history; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_status_history (
    id integer NOT NULL,
    "workflowDocumentId" integer NOT NULL,
    "fromStatus" public."WorkflowDocumentStatus",
    "toStatus" public."WorkflowDocumentStatus" NOT NULL,
    "actorId" integer NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workflow_status_history OWNER TO military_lms;

--
-- Name: workflow_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.workflow_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workflow_status_history_id_seq OWNER TO military_lms;

--
-- Name: workflow_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.workflow_status_history_id_seq OWNED BY public.workflow_status_history.id;


--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.workflow_steps (
    id text NOT NULL,
    "instanceId" text NOT NULL,
    "stageId" text NOT NULL,
    "assignedUserId" integer,
    "assignedRole" text NOT NULL,
    status public."WorkflowStepStatus" DEFAULT 'PENDING'::public."WorkflowStepStatus" NOT NULL,
    "actionTaken" text,
    comments text,
    "actedById" integer,
    "enteredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "dueAt" timestamp(3) without time zone
);


ALTER TABLE public.workflow_steps OWNER TO military_lms;

--
-- Name: academic_terms id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.academic_terms ALTER COLUMN id SET DEFAULT nextval('public.academic_terms_id_seq'::regclass);


--
-- Name: activities id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities ALTER COLUMN id SET DEFAULT nextval('public.activities_id_seq'::regclass);


--
-- Name: activity_log_action_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_log_action_types ALTER COLUMN id SET DEFAULT nextval('public.activity_log_action_types_id_seq'::regclass);


--
-- Name: activity_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_types ALTER COLUMN id SET DEFAULT nextval('public.activity_types_id_seq'::regclass);


--
-- Name: admin_scopes id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes ALTER COLUMN id SET DEFAULT nextval('public.admin_scopes_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- Name: assessment_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.assessment_types ALTER COLUMN id SET DEFAULT nextval('public.assessment_types_id_seq'::regclass);


--
-- Name: attendance_amendments id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments ALTER COLUMN id SET DEFAULT nextval('public.attendance_amendments_id_seq'::regclass);


--
-- Name: attendance_status_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_status_types ALTER COLUMN id SET DEFAULT nextval('public.attendance_status_types_id_seq'::regclass);


--
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- Name: behavior_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behavior_types ALTER COLUMN id SET DEFAULT nextval('public.behavior_types_id_seq'::regclass);


--
-- Name: behaviors id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors ALTER COLUMN id SET DEFAULT nextval('public.behaviors_id_seq'::regclass);


--
-- Name: break_sessions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions ALTER COLUMN id SET DEFAULT nextval('public.break_sessions_id_seq'::regclass);


--
-- Name: category_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.category_types ALTER COLUMN id SET DEFAULT nextval('public.category_types_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: classroom_availability id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability ALTER COLUMN id SET DEFAULT nextval('public.classroom_availability_id_seq'::regclass);


--
-- Name: classroom_availability_slot id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability_slot ALTER COLUMN id SET DEFAULT nextval('public.classroom_availability_slot_id_seq'::regclass);


--
-- Name: classrooms id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classrooms ALTER COLUMN id SET DEFAULT nextval('public.classrooms_id_seq'::regclass);


--
-- Name: config_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.config_types ALTER COLUMN id SET DEFAULT nextval('public.config_types_id_seq'::regclass);


--
-- Name: enrollment_status_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollment_status_types ALTER COLUMN id SET DEFAULT nextval('public.enrollment_status_types_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: flexible_schedule_sessions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions ALTER COLUMN id SET DEFAULT nextval('public.flexible_schedule_sessions_id_seq'::regclass);


--
-- Name: help_items id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items ALTER COLUMN id SET DEFAULT nextval('public.help_items_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: instructor_assignment_history id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history ALTER COLUMN id SET DEFAULT nextval('public.instructor_assignment_history_id_seq'::regclass);


--
-- Name: instructor_availability id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability ALTER COLUMN id SET DEFAULT nextval('public.instructor_availability_id_seq'::regclass);


--
-- Name: instructor_availability_slot id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability_slot ALTER COLUMN id SET DEFAULT nextval('public.instructor_availability_slot_id_seq'::regclass);


--
-- Name: marks_distributions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.marks_distributions ALTER COLUMN id SET DEFAULT nextval('public.marks_distributions_id_seq'::regclass);


--
-- Name: notification_log id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_log ALTER COLUMN id SET DEFAULT nextval('public.notification_log_id_seq'::regclass);


--
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- Name: participation_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participation_types ALTER COLUMN id SET DEFAULT nextval('public.participation_types_id_seq'::regclass);


--
-- Name: participations id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations ALTER COLUMN id SET DEFAULT nextval('public.participations_id_seq'::regclass);


--
-- Name: penalties id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties ALTER COLUMN id SET DEFAULT nextval('public.penalties_id_seq'::regclass);


--
-- Name: penalty_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalty_types ALTER COLUMN id SET DEFAULT nextval('public.penalty_types_id_seq'::regclass);


--
-- Name: permission_denial_audit id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.permission_denial_audit ALTER COLUMN id SET DEFAULT nextval('public.permission_denial_audit_id_seq'::regclass);


--
-- Name: priority_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.priority_types ALTER COLUMN id SET DEFAULT nextval('public.priority_types_id_seq'::regclass);


--
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- Name: question_difficulty_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_difficulty_types ALTER COLUMN id SET DEFAULT nextval('public.question_difficulty_types_id_seq'::regclass);


--
-- Name: question_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_types ALTER COLUMN id SET DEFAULT nextval('public.question_types_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz_attempts id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempts_id_seq'::regclass);


--
-- Name: quiz_status_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_status_types ALTER COLUMN id SET DEFAULT nextval('public.quiz_status_types_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: requirement_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.requirement_types ALTER COLUMN id SET DEFAULT nextval('public.requirement_types_id_seq'::regclass);


--
-- Name: resource_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resource_types ALTER COLUMN id SET DEFAULT nextval('public.resource_types_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: schedule_sessions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions ALTER COLUMN id SET DEFAULT nextval('public.schedule_sessions_id_seq'::regclass);


--
-- Name: schedule_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types ALTER COLUMN id SET DEFAULT nextval('public.schedule_types_id_seq'::regclass);


--
-- Name: scheduled_sessions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions ALTER COLUMN id SET DEFAULT nextval('public.scheduled_sessions_id_seq'::regclass);


--
-- Name: screens id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.screens ALTER COLUMN id SET DEFAULT nextval('public.screens_id_seq'::regclass);


--
-- Name: session_series id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series ALTER COLUMN id SET DEFAULT nextval('public.session_series_id_seq'::regclass);


--
-- Name: standup_attendances id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances ALTER COLUMN id SET DEFAULT nextval('public.standup_attendances_id_seq'::regclass);


--
-- Name: student_marks id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks ALTER COLUMN id SET DEFAULT nextval('public.student_marks_id_seq'::regclass);


--
-- Name: student_marks_history id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks_history ALTER COLUMN id SET DEFAULT nextval('public.student_marks_history_id_seq'::regclass);


--
-- Name: subject_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_types ALTER COLUMN id SET DEFAULT nextval('public.subject_types_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: submission_status_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submission_status_types ALTER COLUMN id SET DEFAULT nextval('public.submission_status_types_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: target_audience_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.target_audience_types ALTER COLUMN id SET DEFAULT nextval('public.target_audience_types_id_seq'::regclass);


--
-- Name: teacher_availability id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.teacher_availability ALTER COLUMN id SET DEFAULT nextval('public.teacher_availability_id_seq'::regclass);


--
-- Name: template_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types ALTER COLUMN id SET DEFAULT nextval('public.template_types_id_seq'::regclass);


--
-- Name: time_slots id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.time_slots ALTER COLUMN id SET DEFAULT nextval('public.time_slots_id_seq'::regclass);


--
-- Name: user_category_access id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access ALTER COLUMN id SET DEFAULT nextval('public.user_category_access_id_seq'::regclass);


--
-- Name: user_favorites id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_favorites ALTER COLUMN id SET DEFAULT nextval('public.user_favorites_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: user_role_assignments id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_role_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_role_assignments_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: user_status_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_status_types ALTER COLUMN id SET DEFAULT nextval('public.user_status_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workflow_comments id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_comments ALTER COLUMN id SET DEFAULT nextval('public.workflow_comments_id_seq'::regclass);


--
-- Name: workflow_documents id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents ALTER COLUMN id SET DEFAULT nextval('public.workflow_documents_id_seq'::regclass);


--
-- Name: workflow_history id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_history ALTER COLUMN id SET DEFAULT nextval('public.workflow_history_id_seq'::regclass);


--
-- Name: workflow_status_history id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_status_history ALTER COLUMN id SET DEFAULT nextval('public.workflow_status_history_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c04900a9-d2d3-4ceb-9f4b-18516e12c95a	6f51c613ed4b5413963be80a47da15e27d511d8eb127acb6be5cd509888904f6	2026-04-14 05:45:56.010859+00	0_init_baseline		\N	2026-04-14 05:45:56.010859+00	0
\.


--
-- Data for Name: academic_terms; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.academic_terms (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	2024-FALL	Fall 2024	خريف 2024	Fall semester 2024	t	\N	\N	2026-03-27 17:22:49.085	2026-03-27 17:22:49.085
2	2025-SPRING	Spring 2025	ربيع 2025	Spring semester 2025	f	\N	\N	2026-03-27 17:22:49.093	2026-03-27 17:22:49.093
3	2025-SUMMER	Summer 2025	صيف 2025	Summer semester 2025	f	\N	\N	2026-03-27 17:22:49.098	2026-03-27 17:22:49.098
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.activities (id, "classId", "titleEn", "titleAr", "typeId", "dueDate", "maxScore", weight, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn", "allowRetake", "imageUrl", link, "quizId") FROM stdin;
\.


--
-- Data for Name: activity_log_action_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.activity_log_action_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	CREATE	Create	إنشاء	Record created	t	\N	\N	2026-03-27 17:22:48.719	2026-03-27 17:22:48.719
2	UPDATE	Update	تحديث	Record updated	t	\N	\N	2026-03-27 17:22:48.725	2026-03-27 17:22:48.725
3	DELETE	Delete	حذف	Record deleted	t	\N	\N	2026-03-27 17:22:48.73	2026-03-27 17:22:48.73
4	LOGIN	Login	تسجيل الدخول	User logged in	t	\N	\N	2026-03-27 17:22:48.735	2026-03-27 17:22:48.735
5	LOGOUT	Logout	تسجيل الخروج	User logged out	t	\N	\N	2026-03-27 17:22:48.74	2026-03-27 17:22:48.74
6	ENROLL	Enroll	تسجيل	User enrolled in program	t	\N	\N	2026-03-27 17:22:48.746	2026-03-27 17:22:48.746
7	WITHDRAW	Withdraw	انسحاب	User withdrew from program	t	\N	\N	2026-03-27 17:22:48.751	2026-03-27 17:22:48.751
8	SUBMIT	Submit	تقديم	Assignment submitted	t	\N	\N	2026-03-27 17:22:48.755	2026-03-27 17:22:48.755
9	GRADE	Grade	تقدير	Grade assigned	t	\N	\N	2026-03-27 17:22:48.761	2026-03-27 17:22:48.761
\.


--
-- Data for Name: activity_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.activity_types (id, code, "nameEn", "nameAr", description, icon, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	LECTURE	Lecture	محاضرة	Classroom lecture session	\N	\N	t	\N	\N	2026-03-27 17:22:48.67	2026-03-27 17:22:48.67
2	LAB	Lab Session	جلسة معمل	Laboratory practical session	\N	\N	t	\N	\N	2026-03-27 17:22:48.677	2026-03-27 17:22:48.677
3	SEMINAR	Seminar	ندوة	Interactive seminar session	\N	\N	t	\N	\N	2026-03-27 17:22:48.682	2026-03-27 17:22:48.682
4	WORKSHOP	Workshop	ورشة عمل	Hands-on workshop session	\N	\N	t	\N	\N	2026-03-27 17:22:48.688	2026-03-27 17:22:48.688
5	EXAM	Exam	امتحان	Formal examination	\N	\N	t	\N	\N	2026-03-27 17:22:48.693	2026-03-27 17:22:48.693
6	ASSIGNMENT	Assignment	واجب	Course assignment	\N	\N	t	\N	\N	2026-03-27 17:22:48.699	2026-03-27 17:22:48.699
7	PROJECT	Project	مشروع	Course project	\N	\N	t	\N	\N	2026-03-27 17:22:48.704	2026-03-27 17:22:48.704
8	PRESENTATION	Presentation	عرض تقديمي	Student presentation	\N	\N	t	\N	\N	2026-03-27 17:22:48.709	2026-03-27 17:22:48.709
\.


--
-- Data for Name: admin_scopes; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.admin_scopes (id, "userId", "scopeType", "programId", "classroomId", "instructorUserId", "isActive", "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.announcements (id, "titleEn", "titleAr", "priorityId", "targetAudienceId", "programId", "classId", "isActive", "createdBy", "updatedBy", "publishAt", "expiresAt", "createdAt", "updatedAt", "descriptionEn", "descriptionAr", "subjectId") FROM stdin;
1	Welcome to Spring Semester 2025	مرحبا بكم في فصل الربيع 2025	2	1	1	\N	t	1	\N	\N	\N	2026-04-01 13:26:47.939	2026-04-01 13:26:47.939	We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.	نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.	\N
2	Python Lab Schedule Update	تحديث جدول مختبر بايثون	2	2	\N	1	t	1	\N	\N	\N	2026-04-01 13:26:47.949	2026-04-01 13:26:47.949	The Python lab schedule has been updated. Please check the new timing for CS101 sections.	تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.	\N
4	New Resources Available	موارد جديدة متاحة	2	1	2	\N	t	1	\N	\N	\N	2026-04-01 13:26:47.961	2026-04-01 13:26:47.961	New learning resources have been uploaded for all courses. Check the resources section.	تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.	\N
5	Instructor Meeting	اجتماع المدربين	2	3	\N	\N	t	1	\N	\N	\N	2026-04-01 13:26:47.966	2026-04-01 13:26:47.966	Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.	اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.	\N
8	Career Fair Announcement	إعلان معرض الوظائف	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:26:47.991	2026-04-01 13:26:47.991	Annual engineering career fair will be held next month. All students are encouraged to attend.	سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.	\N
9	HR Policy Update	تحديث سياسة الموارد البشرية	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:26:47.996	2026-04-01 13:26:47.996	New HR policies have been updated. Please review the changes.	تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.	\N
10	System Maintenance Notice	إشعار صيانة النظام	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:26:48.002	2026-04-01 13:26:48.002	System maintenance scheduled for this weekend. Please save your work.	صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.	\N
11	Welcome to Spring Semester 2025	مرحبا بكم في فصل الربيع 2025	2	1	1	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.725	2026-04-01 13:27:36.725	We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.	نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.	\N
12	Python Lab Schedule Update	تحديث جدول مختبر بايثون	2	2	\N	1	t	1	\N	\N	\N	2026-04-01 13:27:36.734	2026-04-01 13:27:36.734	The Python lab schedule has been updated. Please check the new timing for CS101 sections.	تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.	\N
14	New Resources Available	موارد جديدة متاحة	2	1	2	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.746	2026-04-01 13:27:36.746	New learning resources have been uploaded for all courses. Check the resources section.	تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.	\N
15	Instructor Meeting	اجتماع المدربين	2	3	\N	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.751	2026-04-01 13:27:36.751	Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.	اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.	\N
18	Career Fair Announcement	إعلان معرض الوظائف	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.765	2026-04-01 13:27:36.765	Annual engineering career fair will be held next month. All students are encouraged to attend.	سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.	\N
19	HR Policy Update	تحديث سياسة الموارد البشرية	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.77	2026-04-01 13:27:36.77	New HR policies have been updated. Please review the changes.	تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.	\N
20	System Maintenance Notice	إشعار صيانة النظام	2	1	\N	\N	t	1	\N	\N	\N	2026-04-01 13:27:36.775	2026-04-01 13:27:36.775	System maintenance scheduled for this weekend. Please save your work.	صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.	\N
21	Welcome to Spring Semester 2025	مرحبا بكم في فصل الربيع 2025	2	1	1	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.835	2026-04-24 17:48:05.835	We are excited to welcome all students to the Spring 2025 semester. Please check your class schedules and prepare for the upcoming term.	نحن سعداء بترحيب جميع الطلاب في فصل الربيع 2025. يرجى التحقق من جداول الفصول الدراسية والاستعداد للفصل القادم.	\N
22	Python Lab Schedule Update	تحديث جدول مختبر بايثون	2	2	\N	1	t	1	\N	\N	\N	2026-04-24 17:48:05.851	2026-04-24 17:48:05.851	The Python lab schedule has been updated. Please check the new timing for CS101 sections.	تم تحديث جدول مختبر بايثون. يرجى التحقق من التوقيت الجديد لأقسام CS101.	\N
24	New Resources Available	موارد جديدة متاحة	2	1	2	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.863	2026-04-24 17:48:05.863	New learning resources have been uploaded for all courses. Check the resources section.	تم رفع موارد تعليمية جديدة لجميع الدورات. تحقق من قسم الموارد.	\N
25	Instructor Meeting	اجتماع المدربين	2	3	\N	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.868	2026-04-24 17:48:05.868	Monthly instructor meeting scheduled for next Monday. Please confirm your attendance.	اجتماع المدربين الشهري المجدول يوم الاثنين القادم. يرجى تأكيد حضوركم.	\N
28	Career Fair Announcement	إعلان معرض الوظائف	2	1	\N	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.883	2026-04-24 17:48:05.883	Annual engineering career fair will be held next month. All students are encouraged to attend.	سيتم عرض وظائف الهندسة السنوي الشهر القادم. يشجع جميع الطلاب على الحضور.	\N
29	HR Policy Update	تحديث سياسة الموارد البشرية	2	1	\N	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.887	2026-04-24 17:48:05.887	New HR policies have been updated. Please review the changes.	تم تحديث سياسات الموارد البشرية الجديدة. يرجى مراجعة التغييرات.	\N
30	System Maintenance Notice	إشعار صيانة النظام	2	1	\N	\N	t	1	\N	\N	\N	2026-04-24 17:48:05.891	2026-04-24 17:48:05.891	System maintenance scheduled for this weekend. Please save your work.	صيانة النظام المجدولة لهذا نهاية الأسبوع. يرجى حفظ عملك.	\N
\.


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.answers (id, "questionId", "quizAttemptId", answer, "isCorrect", points, "createdAt") FROM stdin;
\.


--
-- Data for Name: assessment_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.assessment_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	QUIZ	Quiz	اختبار قصير	Short knowledge assessment	t	\N	\N	2026-03-27 17:22:48.771	2026-03-27 17:22:48.771
2	MIDTERM	Midterm Exam	امتحان منتصف الفصل	Mid-term examination	t	\N	\N	2026-03-27 17:22:48.779	2026-03-27 17:22:48.779
3	FINAL	Final Exam	امتحان نهائي	Final examination	t	\N	\N	2026-03-27 17:22:48.784	2026-03-27 17:22:48.784
4	ASSIGNMENT	Assignment	واجب	Course assignment	t	\N	\N	2026-03-27 17:22:48.789	2026-03-27 17:22:48.789
5	PROJECT	Project	مشروع	Course project	t	\N	\N	2026-03-27 17:22:48.796	2026-03-27 17:22:48.796
6	PARTICIPATION	Participation	مشاركة	Class participation	t	\N	\N	2026-03-27 17:22:48.801	2026-03-27 17:22:48.801
7	PRESENTATION	Presentation	عرض تقديمي	Oral presentation	t	\N	\N	2026-03-27 17:22:48.808	2026-03-27 17:22:48.808
8	LAB_WORK	Lab Work	عمل معمل	Laboratory work	t	\N	\N	2026-03-27 17:22:48.815	2026-03-27 17:22:48.815
\.


--
-- Data for Name: attendance_amendments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.attendance_amendments (id, "attendanceId", "fromStatusId", "toStatusId", reason, "amendedBy", "amendedAt") FROM stdin;
\.


--
-- Data for Name: attendance_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.attendance_status_types (id, code, "nameEn", "nameAr", description, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
5	SICK_LEAVE	Sick Leave	إجازة مرضية	Student on sick leave	\N	t	\N	\N	2026-03-27 17:22:49.026	2026-03-27 17:22:49.026
6	EARLY_DEPARTURE	Early Departure	مغادرة مبكرة	Student left early	\N	t	\N	\N	2026-03-27 17:22:49.032	2026-03-27 17:22:49.032
7	STANDUP_PRESENT	Standup Present	حاضر يومياً	Morning Present	\N	t	\N	\N	2026-04-01 13:26:46.441	2026-06-21 14:37:05.126
8	STANDUP_LATE	Standup Late	متأخر يومياً	Morning Late	\N	t	\N	\N	2026-04-01 13:26:46.441	2026-06-21 14:37:05.139
9	STANDUP_ABSENT	Standup Absent	غائب يومياً	Morning Absent	\N	t	\N	\N	2026-04-01 13:26:46.441	2026-06-21 14:37:05.141
10	STANDUP_CLINIC	Standup Clinic	عيادة	Morning Absent	\N	t	\N	\N	2026-04-01 13:26:46.441	2026-06-21 14:37:05.144
1	PRESENT	Present	حاضر	Student is present	\N	t	\N	\N	2026-03-27 17:22:49.002	2026-06-21 14:37:05.147
3	LATE	Late	متأخر	Student arrived late	\N	t	\N	\N	2026-03-27 17:22:49.015	2026-06-21 14:37:05.15
2	ABSENT	Absent	غائب	Student is absent	\N	t	\N	\N	2026-03-27 17:22:49.01	2026-06-21 14:37:05.152
4	EXCUSED	Excused	معذور	Student has excused absence	\N	t	\N	\N	2026-03-27 17:22:49.021	2026-06-21 14:37:05.154
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.attendances (id, "userId", "classId", date, "statusId", notes, "createdBy", "updatedBy", "createdAt", "updatedAt", "programId", "subjectId") FROM stdin;
1	26	3	2026-05-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.736	2026-06-21 14:36:42.736	1	2
2	23	4	2026-05-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.742	2026-06-21 14:36:42.742	1	3
3	22	5	2026-05-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.744	2026-06-21 14:36:42.744	1	4
4	23	1	2026-05-09 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.758	2026-06-21 14:36:42.758	1	5
5	22	3	2026-05-09 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.76	2026-06-21 14:36:42.76	1	2
6	21	1	2026-05-10 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.765	2026-06-21 14:36:42.765	1	5
7	26	5	2026-05-11 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.769	2026-06-21 14:36:42.769	1	4
8	25	4	2026-05-12 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.772	2026-06-21 14:36:42.772	1	3
9	24	5	2026-05-12 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.774	2026-06-21 14:36:42.774	1	4
10	26	3	2026-05-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.783	2026-06-21 14:36:42.783	1	2
11	23	4	2026-05-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.787	2026-06-21 14:36:42.787	1	3
12	22	5	2026-05-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.79	2026-06-21 14:36:42.79	1	4
13	25	1	2026-05-14 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.794	2026-06-21 14:36:42.794	1	5
14	24	3	2026-05-14 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.798	2026-06-21 14:36:42.798	1	2
15	21	4	2026-05-14 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.8	2026-06-21 14:36:42.8	1	3
16	21	1	2026-05-16 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.804	2026-06-21 14:36:42.804	1	5
17	26	5	2026-05-17 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.808	2026-06-21 14:36:42.808	1	4
18	25	4	2026-05-18 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.813	2026-06-21 14:36:42.813	1	3
19	24	5	2026-05-18 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.818	2026-06-21 14:36:42.818	1	4
20	26	3	2026-05-19 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.821	2026-06-21 14:36:42.821	1	2
21	23	4	2026-05-19 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.823	2026-06-21 14:36:42.823	1	3
22	22	5	2026-05-19 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.824	2026-06-21 14:36:42.824	1	4
23	25	1	2026-05-20 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.84	2026-06-21 14:36:42.84	1	5
24	24	3	2026-05-20 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.847	2026-06-21 14:36:42.847	1	2
25	21	4	2026-05-20 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.849	2026-06-21 14:36:42.849	1	3
26	23	1	2026-05-21 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.854	2026-06-21 14:36:42.854	1	5
27	22	3	2026-05-21 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.86	2026-06-21 14:36:42.86	1	2
28	26	5	2026-05-23 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.865	2026-06-21 14:36:42.865	1	4
29	25	4	2026-05-24 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.869	2026-06-21 14:36:42.869	1	3
30	24	5	2026-05-24 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.871	2026-06-21 14:36:42.871	1	4
31	26	3	2026-05-25 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.875	2026-06-21 14:36:42.875	1	2
32	23	4	2026-05-25 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.876	2026-06-21 14:36:42.876	1	3
33	22	5	2026-05-25 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.878	2026-06-21 14:36:42.878	1	4
34	25	1	2026-05-26 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.882	2026-06-21 14:36:42.882	1	5
35	24	3	2026-05-26 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.884	2026-06-21 14:36:42.884	1	2
36	21	4	2026-05-26 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.885	2026-06-21 14:36:42.885	1	3
37	23	1	2026-05-27 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.891	2026-06-21 14:36:42.891	1	5
38	22	3	2026-05-27 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.902	2026-06-21 14:36:42.902	1	2
39	21	1	2026-05-28 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.909	2026-06-21 14:36:42.909	1	5
40	25	4	2026-05-30 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.916	2026-06-21 14:36:42.916	1	3
41	24	5	2026-05-30 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.918	2026-06-21 14:36:42.918	1	4
42	26	3	2026-05-31 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.923	2026-06-21 14:36:42.923	1	2
43	23	4	2026-05-31 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.925	2026-06-21 14:36:42.925	1	3
44	22	5	2026-05-31 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.927	2026-06-21 14:36:42.927	1	4
45	25	1	2026-06-01 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.934	2026-06-21 14:36:42.934	1	5
46	24	3	2026-06-01 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.94	2026-06-21 14:36:42.94	1	2
47	21	4	2026-06-01 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.946	2026-06-21 14:36:42.946	1	3
48	23	1	2026-06-02 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.953	2026-06-21 14:36:42.953	1	5
49	22	3	2026-06-02 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.956	2026-06-21 14:36:42.956	1	2
50	21	1	2026-06-03 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.96	2026-06-21 14:36:42.96	1	5
51	26	5	2026-06-04 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.965	2026-06-21 14:36:42.965	1	4
52	26	3	2026-06-06 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.969	2026-06-21 14:36:42.969	1	2
53	23	4	2026-06-06 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.971	2026-06-21 14:36:42.971	1	3
54	22	5	2026-06-06 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.974	2026-06-21 14:36:42.974	1	4
55	25	1	2026-06-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.981	2026-06-21 14:36:42.981	1	5
56	24	3	2026-06-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.983	2026-06-21 14:36:42.983	1	2
57	21	4	2026-06-07 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.985	2026-06-21 14:36:42.985	1	3
58	23	1	2026-06-08 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.99	2026-06-21 14:36:42.99	1	5
59	22	3	2026-06-08 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.992	2026-06-21 14:36:42.992	1	2
60	21	1	2026-06-09 06:00:00	1	\N	16	\N	2026-06-21 14:36:42.999	2026-06-21 14:36:42.999	1	5
61	26	5	2026-06-10 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.004	2026-06-21 14:36:43.004	1	4
62	25	4	2026-06-11 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.01	2026-06-21 14:36:43.01	1	3
63	24	5	2026-06-11 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.012	2026-06-21 14:36:43.012	1	4
64	25	1	2026-06-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.02	2026-06-21 14:36:43.02	1	5
65	24	3	2026-06-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.022	2026-06-21 14:36:43.022	1	2
66	21	4	2026-06-13 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.024	2026-06-21 14:36:43.024	1	3
67	23	1	2026-06-14 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.029	2026-06-21 14:36:43.029	1	5
68	22	3	2026-06-14 06:00:00	1	\N	16	\N	2026-06-21 14:36:43.031	2026-06-21 14:36:43.031	1	2
69	21	1	2026-06-15 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.328	2026-06-21 14:37:05.328	1	5
70	26	5	2026-06-16 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.342	2026-06-21 14:37:05.342	1	4
71	25	4	2026-06-17 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.354	2026-06-21 14:37:05.354	1	3
72	24	5	2026-06-17 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.358	2026-06-21 14:37:05.358	1	4
73	26	5	2026-06-17 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.362	2026-06-21 14:37:05.362	1	4
74	26	3	2026-06-18 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.374	2026-06-21 14:37:05.374	1	2
75	23	4	2026-06-18 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.378	2026-06-21 14:37:05.378	1	3
76	25	4	2026-06-18 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.38	2026-06-21 14:37:05.38	1	3
77	22	5	2026-06-18 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.385	2026-06-21 14:37:05.385	1	4
78	24	5	2026-06-18 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.389	2026-06-21 14:37:05.389	1	4
79	26	5	2026-06-18 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.394	2026-06-21 14:37:05.394	1	4
80	23	1	2026-06-20 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.412	2026-06-21 14:37:05.412	1	5
81	25	1	2026-06-20 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.415	2026-06-21 14:37:05.415	1	5
82	22	3	2026-06-20 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.42	2026-06-21 14:37:05.42	1	2
83	24	3	2026-06-20 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.423	2026-06-21 14:37:05.423	1	2
84	26	3	2026-06-20 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.427	2026-06-21 14:37:05.427	1	2
85	21	4	2026-06-20 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.431	2026-06-21 14:37:05.431	1	3
86	23	4	2026-06-20 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.434	2026-06-21 14:37:05.434	1	3
87	25	4	2026-06-20 06:00:00	2	\N	16	\N	2026-06-21 14:37:05.44	2026-06-21 14:37:05.44	1	3
88	22	5	2026-06-20 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.444	2026-06-21 14:37:05.444	1	4
89	24	5	2026-06-20 06:00:00	2	\N	16	\N	2026-06-21 14:37:05.448	2026-06-21 14:37:05.448	1	4
90	26	5	2026-06-20 06:00:00	4	\N	16	\N	2026-06-21 14:37:05.451	2026-06-21 14:37:05.451	1	4
91	21	1	2026-06-21 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.488	2026-06-21 14:37:05.488	1	5
92	23	1	2026-06-21 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.491	2026-06-21 14:37:05.491	1	5
93	25	1	2026-06-21 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.495	2026-06-21 14:37:05.495	1	5
94	22	3	2026-06-21 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.499	2026-06-21 14:37:05.499	1	2
95	24	3	2026-06-21 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.503	2026-06-21 14:37:05.503	1	2
96	26	3	2026-06-21 06:00:00	2	\N	16	\N	2026-06-21 14:37:05.506	2026-06-21 14:37:05.506	1	2
97	21	4	2026-06-21 06:00:00	3	\N	16	\N	2026-06-21 14:37:05.51	2026-06-21 14:37:05.51	1	3
98	23	4	2026-06-21 06:00:00	2	\N	16	\N	2026-06-21 14:37:05.513	2026-06-21 14:37:05.513	1	3
99	25	4	2026-06-21 06:00:00	4	\N	16	\N	2026-06-21 14:37:05.518	2026-06-21 14:37:05.518	1	3
100	22	5	2026-06-21 06:00:00	2	\N	16	\N	2026-06-21 14:37:05.522	2026-06-21 14:37:05.522	1	4
101	24	5	2026-06-21 06:00:00	4	\N	16	\N	2026-06-21 14:37:05.525	2026-06-21 14:37:05.525	1	4
102	26	5	2026-06-21 06:00:00	1	\N	16	\N	2026-06-21 14:37:05.528	2026-06-21 14:37:05.528	1	4
\.


--
-- Data for Name: behavior_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.behavior_types (id, code, "nameEn", "nameAr", description, category, points, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	EXCELLENT_PARTICIPATION	Excellent Participation	مشاركة ممتازة	Outstanding class participation	positive	5	#28A745	t	\N	\N	2026-03-27 17:22:24.808	2026-03-27 17:22:24.808
2	HELPING_PEERS	Helping Peers	مساعدة الزملاء	Helping other students	positive	3	#20C997	t	\N	\N	2026-03-27 17:22:24.827	2026-03-27 17:22:24.827
3	LEADERSHIP	Leadership	قيادة	Demonstrating leadership skills	positive	5	#17A2B8	t	\N	\N	2026-03-27 17:22:24.905	2026-03-27 17:22:24.905
4	CREATIVITY	Creativity	إبداع	Creative problem solving	positive	4	#6F42C1	t	\N	\N	2026-03-27 17:22:24.914	2026-03-27 17:22:24.914
5	IMPROVEMENT	Significant Improvement	تحسن ملحوظ	Notable academic improvement	positive	4	#007BFF	t	\N	\N	2026-03-27 17:22:24.925	2026-03-27 17:22:24.925
6	DISRUPTIVE	Disruptive Behavior	سلوك مزعج	Disrupting class	negative	-3	#FFC107	t	\N	\N	2026-03-27 17:22:24.937	2026-03-27 17:22:24.937
7	DISRESPECTFUL	Disrespectful	عدم احترام	Disrespectful to instructor or peers	negative	-5	#DC3545	t	\N	\N	2026-03-27 17:22:24.946	2026-03-27 17:22:24.946
8	UNPREPARED	Unprepared	غير مستعد	Consistently unprepared for class	negative	-2	#FD7E14	t	\N	\N	2026-03-27 17:22:24.954	2026-03-27 17:22:24.954
\.


--
-- Data for Name: behaviors; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.behaviors (id, "userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", points, comment, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: break_sessions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.break_sessions (id, "programId", "instructorUserId", "classroomId", "timeSlotId", date, "breakType", notes, "isRecurring", "recurrencePattern", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "seriesId") FROM stdin;
13	4	\N	\N	1	2026-06-21 06:00:00	TeaBreak	\N	f	\N	t	1	1	2026-06-22 17:09:41.409	2026-06-22 17:09:41.409	\N
\.


--
-- Data for Name: category_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.category_types (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", icon, color, sort, "categoryType", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
12	ACADEMIC	Academic	أكاديمي	Academic resources and materials	الموارد والمواد الأكاديمية	book	#3b82f6	1	ACADEMIC	t	1	1	2026-03-27 17:23:02.332	2026-03-27 17:23:02.332
13	ADMINISTRATIVE	Administrative	إداري	Administrative documents and forms	الوثائق والنماذج الإدارية	file	#10b981	2	ACADEMIC	t	1	1	2026-03-27 17:23:02.34	2026-03-27 17:23:02.34
14	TECHNICAL	Technical	تقني	Technical guides and documentation	الأدلة والوثائق التقنية	settings	#f59e0b	3	ACADEMIC	t	1	1	2026-03-27 17:23:02.344	2026-03-27 17:23:02.344
15	GENERAL	General	عام	General information and resources	معلومات وموارد عامة	folder	#8b5cf6	4	ACADEMIC	t	1	1	2026-03-27 17:23:02.349	2026-03-27 17:23:02.349
3	READING	Reading Material	مواد القراءة	Required reading materials	مواد القراءة المطلوبة	book	\N	0	ACADEMIC	t	\N	\N	2026-04-01 13:26:45.529	2026-04-01 13:26:45.529
4	REFERENCE	Reference	مرجع	Reference materials	مواد مرجعية	bookmark	\N	0	ACADEMIC	t	\N	\N	2026-04-01 13:26:45.537	2026-04-01 13:26:45.537
5	TUTORIAL	Tutorial	درس تعليمي	Tutorial materials	مواد تعليمية	help-circle	\N	0	ACADEMIC	t	\N	\N	2026-04-01 13:26:45.545	2026-04-01 13:26:45.545
7	SUPPLEMENTARY	Supplementary	تكميلي	Supplementary materials	مواد تكميلية	plus-circle	\N	0	ACADEMIC	t	\N	\N	2026-04-01 13:26:45.564	2026-04-01 13:26:45.564
10	ASDF	yyyyy	asdf	asdg			#3b82f6	1	ACADEMIC	f	\N	\N	2026-04-05 07:28:20.027	2026-04-05 07:30:37.99
8	gggg	zzzz	ssssss			code	#3b82f6	1	ACADEMIC	f	\N	\N	2026-04-05 07:25:36.837	2026-04-05 07:30:41.145
9	ZZZZ	zzzz	ssssss				#3b82f6	1	ACADEMIC	f	\N	\N	2026-04-05 07:25:54.03	2026-04-05 07:30:44.757
2	ASSIGNMENT	Assignment	واجب	Assignment materials	مواد الواجب	clipboard	#3b82f6	1	ACADEMIC	t	\N	1	2026-04-01 13:26:45.52	2026-04-05 08:27:38.484
6	EXAM_PREP	Exam Preparation	تحضير الامتحان	Exam preparation materials	مواد تحضير الامتحان	file-check	#3b82f6	1	ACADEMIC	t	\N	1	2026-04-01 13:26:45.554	2026-04-05 08:27:41.787
1	LECTURE_NOTES	Lecture Notes	ملاحظات المحاضرة	Lecture notes and slides	ملاحظات المحاضرة والشرائح	book-open	#3b82f6	1	ACADEMIC	t	\N	1	2026-04-01 13:26:45.507	2026-04-05 08:47:58.993
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.classes (id, code, "nameEn", "nameAr", "maxCapacity", capacity, "isActive", "programId", "subjectId", "instructorId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn", "locationAr", "locationEn", "ownerEmail", term, year, schedule, "classroomId", "substituteInstructorId") FROM stdin;
3	CS102-A	CS102 Section A	شريحة أ من مادة CS102	25	\N	t	1	2	1	1	\N	2026-04-01 13:26:47.324	2026-04-24 17:46:10.6	\N	\N	\N	\N	\N	2025-SPRING	2025	\N	\N	\N
4	CS201-A	CS201 Section A	شريحة أ من مادة CS201	20	\N	t	1	3	1	1	\N	2026-04-01 13:26:47.334	2026-04-24 17:46:10.605	\N	\N	\N	\N	\N	2025-SPRING	2025	\N	\N	\N
1	PY-I	Python I	بايثون 1	5	5	t	1	5	15	1	1	2026-03-27 18:08:42.467	2026-06-02 16:44:28.642	eeeeeeeeeeee	wwwwwwwwwww	b	a	instructor4@example.com	Fall	2024	\N	\N	\N
5	ME101-A	ME101 Section A	شريحة أ من مادة ME101	25	\N	t	1	4	14	1	1	2026-04-01 13:26:47.341	2026-06-18 07:49:03.422	ddddd	ccccc	bbbbb	aaaa	instructor3@example.com	Fall	2025	\N	1	\N
\.


--
-- Data for Name: classroom_availability; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.classroom_availability (id, "classroomId", "dayOfWeek", "startDate", "endDate", status, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	1	{Sun,Tue}	2026-01-01 00:00:00	2027-08-01 00:00:00	\N	t	1	1	2026-05-31 06:44:34.142	2026-05-31 12:38:40.031
\.


--
-- Data for Name: classroom_availability_slot; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.classroom_availability_slot (id, "availabilityId", "startTime", "endTime", "createdAt", "updatedAt") FROM stdin;
10	1	09:00	10:00	2026-05-31 12:38:40.031	2026-05-31 12:38:40.031
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.classrooms (id, code, "nameEn", "nameAr", "locationEn", "locationAr", capacity, floor, "roomNumber", equipment, "availableDays", status, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	a code	b room en	c room ar	d building		30	e floor	1	{}	{Sun,Mon,Tue,Wed,Thu}	Available	t	1	1	2026-05-31 06:43:23.728	2026-06-13 07:54:51.271
\.


--
-- Data for Name: config_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.config_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	SYSTEM	System Config	إعدادات النظام	System-wide configuration	t	\N	\N	2026-03-27 17:22:48.967	2026-03-27 17:22:48.967
2	ACADEMIC	Academic Config	إعدادات أكاديمية	Academic settings	t	\N	\N	2026-03-27 17:22:48.974	2026-03-27 17:22:48.974
3	NOTIFICATION	Notification Config	إعدادات الإشعارات	Notification settings	t	\N	\N	2026-03-27 17:22:48.98	2026-03-27 17:22:48.98
4	SECURITY	Security Config	إعدادات الأمان	Security settings	t	\N	\N	2026-03-27 17:22:48.985	2026-03-27 17:22:48.985
5	INTEGRATION	Integration Config	إعدادات التكامل	Third-party integrations	t	\N	\N	2026-03-27 17:22:48.991	2026-03-27 17:22:48.991
\.


--
-- Data for Name: enrollment_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.enrollment_status_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	ENROLLED	Enrolled	مسجل	Student is enrolled in the program	t	\N	\N	2026-03-27 17:22:24.548	2026-03-27 17:22:24.548
2	PENDING	Pending	في الانتظار	Enrollment is pending approval	t	\N	\N	2026-03-27 17:22:24.559	2026-03-27 17:22:24.559
3	APPROVED	Approved	موافق عليه	Enrollment has been approved	t	\N	\N	2026-03-27 17:22:24.57	2026-03-27 17:22:24.57
4	REJECTED	Rejected	مرفوض	Enrollment has been rejected	t	\N	\N	2026-03-27 17:22:24.579	2026-03-27 17:22:24.579
5	COMPLETED	Completed	مكتمل	Student has completed the program	t	\N	\N	2026-03-27 17:22:24.587	2026-03-27 17:22:24.587
6	DROPPED	Dropped	منسحب	Student has dropped from the program	t	\N	\N	2026-03-27 17:22:24.596	2026-03-27 17:22:24.596
7	SUSPENDED	Suspended	موقوف	Student enrollment is suspended	t	\N	\N	2026-03-27 17:22:24.605	2026-03-27 17:22:24.605
8	ACTIVE	Active	نشط	\N	t	\N	\N	2026-03-29 11:18:00.93	2026-03-29 11:18:00.93
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.enrollments (id, "userId", "programId", "subjectId", "classId", "statusId", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
5	21	1	2	3	1	1	\N	2026-04-01 13:26:47.702	2026-04-24 17:48:05.292
6	22	1	2	3	1	1	\N	2026-04-01 13:26:47.71	2026-04-24 17:48:05.302
7	23	1	3	4	1	1	\N	2026-04-01 13:26:47.719	2026-04-24 17:48:05.382
8	24	1	3	4	1	1	\N	2026-04-01 13:26:47.729	2026-04-24 17:48:05.396
9	25	2	5	5	1	1	\N	2026-04-01 13:26:47.736	2026-04-24 17:48:05.413
10	26	2	5	5	1	1	\N	2026-04-01 13:26:47.746	2026-04-24 17:48:05.431
\.


--
-- Data for Name: file_activities; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.file_activities (id, "fileId", "userId", action, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: file_comments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.file_comments (id, "fileId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: file_shares; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.file_shares (id, "fileId", "folderId", "subjectType", "subjectUserId", "subjectRole", permission, "grantedById", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: file_versions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.file_versions (id, "fileId", "versionNumber", "s3Key", size, "uploadedById", "changeNote", "minioVersionId", "checksumSha256", "isCurrent", "createdAt") FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.files (id, "s3Key", bucket, name, "mimeType", size, "ownerId", "folderId", "folderPath", "currentVersionId", "checksumSha256", "workflowStatus", "publicLinkToken", "publicLinkExpiry", "isActive", "isStarred", "isDeleted", "deletedAt", "deletedById", "searchVector", "createdAt", "updatedAt") FROM stdin;
bc930527-06ec-4d3c-ae1e-14af9befe2ba	lms-private/1/bc930527-06ec-4d3c-ae1e-14af9befe2ba/personal.png	PRIVATE	personal.png	image/png	10642	1	\N	\N	\N	\N	DRAFT	2cae0f3a-e644-4a0c-bfaf-0e8d46dd9425	2026-04-26 16:32:20.86	t	f	f	\N	\N	'personal.png':1A	2026-04-18 10:42:58.284	2026-04-19 16:32:20.881
3c602be9-9973-4ae1-b2a3-8d3a90ddf486	lms-private/1/3c602be9-9973-4ae1-b2a3-8d3a90ddf486/.keep	PRIVATE	ffff	application/x-directory	0	1	\N		\N	\N	DRAFT	\N	\N	t	f	f	\N	\N	'ffff':1A	2026-04-19 16:50:57.475	2026-04-19 16:50:57.475
baefe753-770e-4a56-b0b2-d21eae0656af	lms-private/1/baefe753-770e-4a56-b0b2-d21eae0656af/personal.png	PRIVATE	personal.png	image/png	10642	1	\N	\N	\N	\N	DRAFT	\N	\N	t	f	f	\N	\N	'personal.png':1A	2026-04-19 16:51:35.571	2026-04-19 16:51:35.77
f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	PRIVATE/101/f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8/placeholder	PRIVATE	short.png	image/png	50231	1	\N	\N	\N	\N	DRAFT	\N	\N	t	f	t	2026-05-04 09:12:35.766	101	'short.png':1A	2026-05-03 17:23:39.893	2026-05-16 17:59:41.498
6bb6feab-16c9-43e3-8e9a-0a51745b259a	PRIVATE/101/6bb6feab-16c9-43e3-8e9a-0a51745b259a/placeholder	PRIVATE	mailchimp-receipt-MC25599553.pdf	application/pdf	28801	1	\N	\N	\N	\N	DRAFT	\N	\N	t	f	f	\N	\N	'mailchimp-receipt-mc25599553.pdf':1A	2026-05-16 17:44:23.828	2026-05-16 17:59:41.498
ce3ebc74-9c51-4580-bb82-54978f990832	lms-private/1/ce3ebc74-9c51-4580-bb82-54978f990832/.keep	PRIVATE	aaa	application/x-directory	0	1	\N	aaa	\N	\N	DRAFT	\N	\N	t	f	f	\N	\N	'aaa':1A,2B	2026-04-19 16:34:16.03	2026-05-03 10:41:54.321
3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	lms-private/1/3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7/.keep	PRIVATE	ggg	application/x-directory	0	1	\N	ffff	\N	\N	DRAFT	\N	\N	t	f	f	\N	\N	'ffff':2B 'ggg':1A	2026-04-19 17:47:17.1	2026-05-03 14:51:15.946
\.


--
-- Data for Name: flexible_schedule_sessions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.flexible_schedule_sessions (id, "programId", "courseId", "subjectId", "instructorUserId", "classroomId", "timeSlotId", date, "recurrenceRule", "isRecurring", "parentSessionId", notes, "isCancelled", "cancelledAt", "cancelReason", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.folders (id, name, "parentId", "ownerId", path, "isPrivate", "isStarred", "isDeleted", "deletedAt", "deletedById", "createdAt", "updatedAt") FROM stdin;
76f6ca67-0675-4a68-9153-3bfc66992b8a	fffff	\N	1	/fffff	f	f	f	\N	\N	2026-04-25 17:07:43.045	2026-04-25 17:07:43.045
494bec5b-21b2-407a-b71e-a8e0d22e6564	ttttt	\N	1	/ttttt	f	f	f	\N	\N	2026-05-03 07:22:07.749	2026-05-03 07:22:07.749
ffb125a3-d7b9-4b1d-be19-f259b487de9b	zzzzzz	76f6ca67-0675-4a68-9153-3bfc66992b8a	1	/fffff/zzzzzz	f	f	f	\N	\N	2026-05-03 08:30:47.812	2026-05-03 08:30:47.812
48b104c2-0577-41b9-b8d2-fb258ca637c6	aaaaaaaaa	\N	101	/aaaaaaaaa	f	f	f	\N	\N	2026-05-16 17:57:35.146	2026-05-16 17:57:35.146
\.


--
-- Data for Name: help_items; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.help_items (id, page, section, key, "titleEn", "titleAr", "contentEn", "contentAr", "order", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.holidays (id, "programId", "descriptionEn", "descriptionAr", type, "startDate", "endDate", "isRecurring", "recurrencePattern", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "seriesId") FROM stdin;
1	1	Demo National Holiday	عطلة وطنية تجريبية	National	2026-07-05 03:59:51.355	2026-07-07 03:59:51.355	f	\N	t	\N	\N	2026-06-21 03:59:51.591	2026-06-21 03:59:51.591	\N
14	\N	Test Holiday 2	\N	Public	2026-07-18 00:00:00	2026-07-18 23:59:59.999	f	\N	t	1	1	2026-06-22 14:07:38.018	2026-06-22 14:07:38.018	\N
\.


--
-- Data for Name: instructor_assignment_history; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.instructor_assignment_history (id, "classId", "sessionId", "oldInstructorId", "newInstructorId", "effectiveFrom", "effectiveTo", "changedBy", "changedAt", reason, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: instructor_availability; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.instructor_availability (id, "instructorUserId", "maxSessionsPerDay", "maxHoursPerWeek", status, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "dayOfWeek", "endDate", "startDate", "classId", "programId", "subjectId") FROM stdin;
1	14	3	\N	\N	t	1	1	2026-06-02 16:11:49.328	2026-06-02 16:27:56.588	{Sun}	2222-11-20 21:00:00	1111-11-09 20:33:52	\N	\N	8
2	15	3	\N	\N	t	1	\N	2026-06-02 16:45:44.841	2026-06-02 16:45:44.841	{Mon,Sun}	2026-07-31 21:00:00	2026-05-31 21:00:00	\N	4	\N
\.


--
-- Data for Name: instructor_availability_slot; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.instructor_availability_slot (id, "availabilityId", "startTime", "endTime", "createdAt", "updatedAt") FROM stdin;
2	1	09:00	10:00	2026-06-02 16:27:56.588	2026-06-02 16:27:56.588
3	2	07:00	08:00	2026-06-02 16:45:44.841	2026-06-02 16:45:44.841
\.


--
-- Data for Name: marks_distributions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.marks_distributions (id, "subjectId", "midTermExam", "finalExam", homework, "labsProjectResearch", quizzes, participation, attendance, "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
2	4	22	38	5	10	5	10	10	\N	\N	2026-04-02 17:28:55.436	2026-04-02 17:28:55.436
1	3	18	42	5	10	5	10	10	\N	\N	2026-04-02 16:18:30.181	2026-04-02 17:35:16.113
\.


--
-- Data for Name: notification_deliveries; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.notification_deliveries (id, "notificationId", channel, status, "providerMsgId", error, attempts, "sentAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notification_log; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.notification_log (id, "userId", type, subject, body, "sentAt", "deliveryStatus", "sessionId", "createdAt") FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.notification_preferences (id, "userId", "inAppEnabled", "emailEnabled", "smsEnabled", "pushEnabled", matrix, "soundEnabled", "vibrationEnabled", "browserNotifEnabled", "updatedAt") FROM stdin;
2	101	t	t	f	f	{}	t	t	t	2026-05-03 17:09:13.451
1	1	t	t	f	f	{}	t	t	t	2026-06-19 19:43:05.531
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.notifications (id, "userId", category, event, priority, "titleEn", "titleAr", "bodyEn", "bodyAr", link, metadata, "isRead", "readAt", "isArchived", "archivedAt", "groupKey", "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.operations (id, "screenId", "operationKey", "nameEn", "nameAr", "descriptionEn", "descriptionAr", category, "isActive", "createdAt", "updatedAt") FROM stdin;
2	2	viewUserAccess	View User Access	View User Access	\N	\N	read	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
3	2	createUserAccess	Create User Access	Create User Access	\N	\N	create	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
4	2	editUserAccess	Edit User Access	Edit User Access	\N	\N	update	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
5	2	deleteUserAccess	Delete User Access	Delete User Access	\N	\N	delete	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
6	3	viewRoomAvailability	View Room Availability	View Room Availability	\N	\N	read	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
7	3	createRoomAvailability	Create Room Availability	Create Room Availability	\N	\N	create	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
8	3	editRoomAvailability	Edit Room Availability	Edit Room Availability	\N	\N	update	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
9	3	deleteRoomAvailability	Delete Room Availability	Delete Room Availability	\N	\N	delete	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
10	4	viewRoomsManagement	View Rooms Management	View Rooms Management	\N	\N	read	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
11	4	createRoomsManagement	Create Rooms Management	Create Rooms Management	\N	\N	create	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
12	4	editRoomsManagement	Edit Rooms Management	Edit Rooms Management	\N	\N	update	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
13	4	deleteRoomsManagement	Delete Rooms Management	Delete Rooms Management	\N	\N	delete	t	2026-05-31 14:37:10.02	2026-05-31 14:37:10.02
17	6	scheduling-calendar.canCreate	Create	إنشاء	Create on scheduling-calendar	إنشاء — scheduling-calendar	create	t	2026-06-20 14:31:55.307	2026-06-22 17:06:55.08
18	6	scheduling-calendar.canUpdate	Update	تحديث	Update on scheduling-calendar	تحديث — scheduling-calendar	update	t	2026-06-20 14:31:55.342	2026-06-22 17:06:55.086
19	6	scheduling-calendar.canDelete	Delete	حذف	Delete on scheduling-calendar	حذف — scheduling-calendar	delete	t	2026-06-20 14:31:55.394	2026-06-22 17:06:55.092
20	7	classes-availability.canView	View	عرض	View on classes-availability	عرض — classes-availability	view	t	2026-06-20 14:31:55.428	2026-06-22 17:06:55.101
22	9	room-availability-view.canView	View	عرض	View on room-availability-view	عرض — room-availability-view	view	t	2026-06-20 14:31:55.504	2026-06-22 17:06:55.115
23	10	instructor-availability-setup.canView	View	عرض	View on instructor-availability-setup	عرض — instructor-availability-setup	view	t	2026-06-20 14:31:55.556	2026-06-22 17:06:55.122
24	10	instructor-availability-setup.canCreate	Create	إنشاء	Create on instructor-availability-setup	إنشاء — instructor-availability-setup	create	t	2026-06-20 14:31:55.589	2026-06-22 17:06:55.127
25	10	instructor-availability-setup.canUpdate	Update	تحديث	Update on instructor-availability-setup	تحديث — instructor-availability-setup	update	t	2026-06-20 14:31:55.626	2026-06-22 17:06:55.134
26	10	instructor-availability-setup.canDelete	Delete	حذف	Delete on instructor-availability-setup	حذف — instructor-availability-setup	delete	t	2026-06-20 14:31:55.674	2026-06-22 17:06:55.144
27	11	room-availability-setup.canView	View	عرض	View on room-availability-setup	عرض — room-availability-setup	view	t	2026-06-20 14:31:55.7	2026-06-22 17:06:55.151
28	11	room-availability-setup.canCreate	Create	إنشاء	Create on room-availability-setup	إنشاء — room-availability-setup	create	t	2026-06-20 14:31:55.733	2026-06-22 17:06:55.157
29	11	room-availability-setup.canUpdate	Update	تحديث	Update on room-availability-setup	تحديث — room-availability-setup	update	t	2026-06-20 14:31:55.761	2026-06-22 17:06:55.162
30	11	room-availability-setup.canDelete	Delete	حذف	Delete on room-availability-setup	حذف — room-availability-setup	delete	t	2026-06-20 14:31:55.784	2026-06-22 17:06:55.167
31	12	rooms-management.canView	View	عرض	View on rooms-management	عرض — rooms-management	view	t	2026-06-20 14:31:55.806	2026-06-22 17:06:55.175
32	12	rooms-management.canCreate	Create	إنشاء	Create on rooms-management	إنشاء — rooms-management	create	t	2026-06-20 14:31:55.856	2026-06-22 17:06:55.18
33	12	rooms-management.canUpdate	Update	تحديث	Update on rooms-management	تحديث — rooms-management	update	t	2026-06-20 14:31:55.927	2026-06-22 17:06:55.186
34	12	rooms-management.canDelete	Delete	حذف	Delete on rooms-management	حذف — rooms-management	delete	t	2026-06-20 14:31:55.97	2026-06-22 17:06:55.191
35	13	user-category-access.canView	View	عرض	View on user-category-access	عرض — user-category-access	view	t	2026-06-20 14:31:55.997	2026-06-22 17:06:55.197
36	13	user-category-access.canCreate	Create	إنشاء	Create on user-category-access	إنشاء — user-category-access	create	t	2026-06-20 14:31:56.027	2026-06-22 17:06:55.202
37	13	user-category-access.canUpdate	Update	تحديث	Update on user-category-access	تحديث — user-category-access	update	t	2026-06-20 14:31:56.049	2026-06-22 17:06:55.208
38	13	user-category-access.canDelete	Delete	حذف	Delete on user-category-access	حذف — user-category-access	delete	t	2026-06-20 14:31:56.075	2026-06-22 17:06:55.215
39	14	announcements.canView	View	عرض	View on announcements	عرض — announcements	view	t	2026-06-20 14:31:56.1	2026-06-22 17:06:55.221
40	14	announcements.canCreate	Create	إنشاء	Create on announcements	إنشاء — announcements	create	t	2026-06-20 14:31:56.12	2026-06-22 17:06:55.226
41	14	announcements.canUpdate	Update	تحديث	Update on announcements	تحديث — announcements	update	t	2026-06-20 14:31:56.139	2026-06-22 17:06:55.233
42	14	announcements.canDelete	Delete	حذف	Delete on announcements	حذف — announcements	delete	t	2026-06-20 14:31:56.153	2026-06-22 17:06:55.24
43	15	users.canView	View	عرض	View on users	عرض — users	view	t	2026-06-20 14:31:56.196	2026-06-22 17:06:55.246
44	15	users.canCreate	Create	إنشاء	Create on users	إنشاء — users	create	t	2026-06-20 14:31:56.219	2026-06-22 17:06:55.253
45	15	users.canUpdate	Update	تحديث	Update on users	تحديث — users	update	t	2026-06-20 14:31:56.244	2026-06-22 17:06:55.258
46	15	users.canDelete	Delete	حذف	Delete on users	حذف — users	delete	t	2026-06-20 14:31:56.274	2026-06-22 17:06:55.264
47	16	classes.canView	View	عرض	View on classes	عرض — classes	view	t	2026-06-20 14:31:56.297	2026-06-22 17:06:55.274
48	16	classes.canCreate	Create	إنشاء	Create on classes	إنشاء — classes	create	t	2026-06-20 14:31:56.317	2026-06-22 17:06:55.282
49	16	classes.canUpdate	Update	تحديث	Update on classes	تحديث — classes	update	t	2026-06-20 14:31:56.334	2026-06-22 17:06:55.292
50	16	classes.canDelete	Delete	حذف	Delete on classes	حذف — classes	delete	t	2026-06-20 14:31:56.36	2026-06-22 17:06:55.298
51	17	email-templates.canView	View	عرض	View on email-templates	عرض — email-templates	view	t	2026-06-20 14:31:56.393	2026-06-22 17:06:55.312
52	17	email-templates.canCreate	Create	إنشاء	Create on email-templates	إنشاء — email-templates	create	t	2026-06-20 14:31:56.413	2026-06-22 17:06:55.321
53	17	email-templates.canUpdate	Update	تحديث	Update on email-templates	تحديث — email-templates	update	t	2026-06-20 14:31:56.43	2026-06-22 17:06:55.327
15	5	summary-dashboard.canExport	Export	تصدير	Export on summary-dashboard	تصدير — summary-dashboard	view	t	2026-06-20 14:31:55.231	2026-06-22 17:06:55.064
16	6	scheduling-calendar.canView	View	عرض	View on scheduling-calendar	عرض — scheduling-calendar	view	t	2026-06-20 14:31:55.281	2026-06-22 17:06:55.075
58	19	activity-types.canUpdate	Update	تحديث	Update on activity-types	تحديث — activity-types	update	t	2026-06-20 14:31:56.533	2026-06-22 17:06:55.369
59	19	activity-types.canDelete	Delete	حذف	Delete on activity-types	حذف — activity-types	delete	t	2026-06-20 14:31:56.55	2026-06-22 17:06:55.374
60	20	behavior-types.canView	View	عرض	View on behavior-types	عرض — behavior-types	view	t	2026-06-20 14:31:56.577	2026-06-22 17:06:55.381
61	20	behavior-types.canCreate	Create	إنشاء	Create on behavior-types	إنشاء — behavior-types	create	t	2026-06-20 14:31:56.591	2026-06-22 17:06:55.386
62	20	behavior-types.canUpdate	Update	تحديث	Update on behavior-types	تحديث — behavior-types	update	t	2026-06-20 14:31:56.603	2026-06-22 17:06:55.394
63	20	behavior-types.canDelete	Delete	حذف	Delete on behavior-types	حذف — behavior-types	delete	t	2026-06-20 14:31:56.615	2026-06-22 17:06:55.399
64	21	participation-types.canView	View	عرض	View on participation-types	عرض — participation-types	view	t	2026-06-20 14:31:56.627	2026-06-22 17:06:55.406
65	21	participation-types.canCreate	Create	إنشاء	Create on participation-types	إنشاء — participation-types	create	t	2026-06-20 14:31:56.64	2026-06-22 17:06:55.413
66	21	participation-types.canUpdate	Update	تحديث	Update on participation-types	تحديث — participation-types	update	t	2026-06-20 14:31:56.649	2026-06-22 17:06:55.418
67	21	participation-types.canDelete	Delete	حذف	Delete on participation-types	حذف — participation-types	delete	t	2026-06-20 14:31:56.659	2026-06-22 17:06:55.427
68	22	penalty-types.canView	View	عرض	View on penalty-types	عرض — penalty-types	view	t	2026-06-20 14:31:56.668	2026-06-22 17:06:55.434
69	22	penalty-types.canCreate	Create	إنشاء	Create on penalty-types	إنشاء — penalty-types	create	t	2026-06-20 14:31:56.678	2026-06-22 17:06:55.44
70	22	penalty-types.canUpdate	Update	تحديث	Update on penalty-types	تحديث — penalty-types	update	t	2026-06-20 14:31:56.687	2026-06-22 17:06:55.446
71	22	penalty-types.canDelete	Delete	حذف	Delete on penalty-types	حذف — penalty-types	delete	t	2026-06-20 14:31:56.694	2026-06-22 17:06:55.451
72	23	resource-types.canView	View	عرض	View on resource-types	عرض — resource-types	view	t	2026-06-20 14:31:56.701	2026-06-22 17:06:55.459
73	23	resource-types.canCreate	Create	إنشاء	Create on resource-types	إنشاء — resource-types	create	t	2026-06-20 14:31:56.707	2026-06-22 17:06:55.464
74	23	resource-types.canUpdate	Update	تحديث	Update on resource-types	تحديث — resource-types	update	t	2026-06-20 14:31:56.712	2026-06-22 17:06:55.473
75	23	resource-types.canDelete	Delete	حذف	Delete on resource-types	حذف — resource-types	delete	t	2026-06-20 14:31:56.721	2026-06-22 17:06:55.481
76	24	priority-types.canView	View	عرض	View on priority-types	عرض — priority-types	view	t	2026-06-20 14:31:56.728	2026-06-22 17:06:55.486
77	24	priority-types.canCreate	Create	إنشاء	Create on priority-types	إنشاء — priority-types	create	t	2026-06-20 14:31:56.737	2026-06-22 17:06:55.492
78	24	priority-types.canUpdate	Update	تحديث	Update on priority-types	تحديث — priority-types	update	t	2026-06-20 14:31:56.745	2026-06-22 17:06:55.497
79	24	priority-types.canDelete	Delete	حذف	Delete on priority-types	حذف — priority-types	delete	t	2026-06-20 14:31:56.755	2026-06-22 17:06:55.504
80	25	user-roles.canView	View	عرض	View on user-roles	عرض — user-roles	view	t	2026-06-20 14:31:56.766	2026-06-22 17:06:55.514
81	25	user-roles.canCreate	Create	إنشاء	Create on user-roles	إنشاء — user-roles	create	t	2026-06-20 14:31:56.775	2026-06-22 17:06:55.521
82	25	user-roles.canUpdate	Update	تحديث	Update on user-roles	تحديث — user-roles	update	t	2026-06-20 14:31:56.79	2026-06-22 17:06:55.526
83	25	user-roles.canDelete	Delete	حذف	Delete on user-roles	حذف — user-roles	delete	t	2026-06-20 14:31:56.799	2026-06-22 17:06:55.534
84	26	subject-types.canView	View	عرض	View on subject-types	عرض — subject-types	view	t	2026-06-20 14:31:56.808	2026-06-22 17:06:55.542
85	26	subject-types.canCreate	Create	إنشاء	Create on subject-types	إنشاء — subject-types	create	t	2026-06-20 14:31:56.815	2026-06-22 17:06:55.548
86	26	subject-types.canUpdate	Update	تحديث	Update on subject-types	تحديث — subject-types	update	t	2026-06-20 14:31:56.83	2026-06-22 17:06:55.554
87	26	subject-types.canDelete	Delete	حذف	Delete on subject-types	حذف — subject-types	delete	t	2026-06-20 14:31:56.837	2026-06-22 17:06:55.56
88	27	assessment-types.canView	View	عرض	View on assessment-types	عرض — assessment-types	view	t	2026-06-20 14:31:56.846	2026-06-22 17:06:55.566
89	27	assessment-types.canCreate	Create	إنشاء	Create on assessment-types	إنشاء — assessment-types	create	t	2026-06-20 14:31:56.855	2026-06-22 17:06:55.571
90	27	assessment-types.canUpdate	Update	تحديث	Update on assessment-types	تحديث — assessment-types	update	t	2026-06-20 14:31:56.862	2026-06-22 17:06:55.576
91	27	assessment-types.canDelete	Delete	حذف	Delete on assessment-types	حذف — assessment-types	delete	t	2026-06-20 14:31:56.873	2026-06-22 17:06:55.586
92	28	question-types.canView	View	عرض	View on question-types	عرض — question-types	view	t	2026-06-20 14:31:56.881	2026-06-22 17:06:55.593
93	28	question-types.canCreate	Create	إنشاء	Create on question-types	إنشاء — question-types	create	t	2026-06-20 14:31:56.891	2026-06-22 17:06:55.6
94	28	question-types.canUpdate	Update	تحديث	Update on question-types	تحديث — question-types	update	t	2026-06-20 14:31:56.907	2026-06-22 17:06:55.609
95	28	question-types.canDelete	Delete	حذف	Delete on question-types	حذف — question-types	delete	t	2026-06-20 14:31:56.915	2026-06-22 17:06:55.615
97	29	attendance-status-types.canCreate	Create	إنشاء	Create on attendance-status-types	إنشاء — attendance-status-types	create	t	2026-06-20 14:31:56.946	2026-06-22 17:06:55.628
98	29	attendance-status-types.canUpdate	Update	تحديث	Update on attendance-status-types	تحديث — attendance-status-types	update	t	2026-06-20 14:31:56.955	2026-06-22 17:06:55.636
99	29	attendance-status-types.canDelete	Delete	حذف	Delete on attendance-status-types	حذف — attendance-status-types	delete	t	2026-06-20 14:31:56.964	2026-06-22 17:06:55.642
100	30	enrollment-status-types.canView	View	عرض	View on enrollment-status-types	عرض — enrollment-status-types	view	t	2026-06-20 14:31:56.98	2026-06-22 17:06:55.651
101	30	enrollment-status-types.canCreate	Create	إنشاء	Create on enrollment-status-types	إنشاء — enrollment-status-types	create	t	2026-06-20 14:31:56.995	2026-06-22 17:06:55.656
102	30	enrollment-status-types.canUpdate	Update	تحديث	Update on enrollment-status-types	تحديث — enrollment-status-types	update	t	2026-06-20 14:31:57.008	2026-06-22 17:06:55.662
103	30	enrollment-status-types.canDelete	Delete	حذف	Delete on enrollment-status-types	حذف — enrollment-status-types	delete	t	2026-06-20 14:31:57.015	2026-06-22 17:06:55.668
104	31	my-attendance.canView	View	عرض	View on my-attendance	عرض — my-attendance	view	t	2026-06-20 14:31:57.03	2026-06-22 17:06:55.674
55	18	notification-logs.canView	View	عرض	View on notification-logs	عرض — notification-logs	view	t	2026-06-20 14:31:56.473	2026-06-22 17:06:55.34
56	19	activity-types.canView	View	عرض	View on activity-types	عرض — activity-types	view	t	2026-06-20 14:31:56.496	2026-06-22 17:06:55.353
107	244	categories.canView	View	عرض	View on categories	عرض — categories	view	t	2026-06-20 14:58:25.794	2026-06-22 17:06:54.391
108	244	categories.canCreate	Create	إنشاء	Create on categories	إنشاء — categories	create	t	2026-06-20 14:58:25.813	2026-06-22 17:06:54.404
109	244	categories.canUpdate	Update	تحديث	Update on categories	تحديث — categories	update	t	2026-06-20 14:58:25.83	2026-06-22 17:06:54.416
110	244	categories.canDelete	Delete	حذف	Delete on categories	حذف — categories	delete	t	2026-06-20 14:58:25.845	2026-06-22 17:06:54.426
112	246	student-profile.canView	View	عرض	View on student-profile	عرض — student-profile	view	t	2026-06-20 14:58:25.908	2026-06-22 17:06:54.457
113	246	student-profile.canUpdate	Update	تحديث	Update on student-profile	تحديث — student-profile	update	t	2026-06-20 14:58:25.925	2026-06-22 17:06:54.469
114	247	activities.canView	View	عرض	View on activities	عرض — activities	view	t	2026-06-20 14:58:25.944	2026-06-22 17:06:54.48
115	247	activities.canCreate	Create	إنشاء	Create on activities	إنشاء — activities	create	t	2026-06-20 14:58:25.957	2026-06-22 17:06:54.492
116	247	activities.canUpdate	Update	تحديث	Update on activities	تحديث — activities	update	t	2026-06-20 14:58:25.974	2026-06-22 17:06:54.506
117	247	activities.canDelete	Delete	حذف	Delete on activities	حذف — activities	delete	t	2026-06-20 14:58:25.989	2026-06-22 17:06:54.512
118	277	resources.canView	View	عرض	View on resources	عرض — resources	view	t	2026-06-20 14:58:26.014	2026-06-22 17:06:54.522
119	277	resources.canCreate	Create	إنشاء	Create on resources	إنشاء — resources	create	t	2026-06-20 14:58:26.029	2026-06-22 17:06:54.53
120	277	resources.canUpdate	Update	تحديث	Update on resources	تحديث — resources	update	t	2026-06-20 14:58:26.054	2026-06-22 17:06:54.539
121	277	resources.canDelete	Delete	حذف	Delete on resources	حذف — resources	delete	t	2026-06-20 14:58:26.079	2026-06-22 17:06:54.547
122	248	quizzes.canView	View	عرض	View on quizzes	عرض — quizzes	view	t	2026-06-20 14:58:26.098	2026-06-22 17:06:54.554
123	248	quizzes.canCreate	Create	إنشاء	Create on quizzes	إنشاء — quizzes	create	t	2026-06-20 14:58:26.117	2026-06-22 17:06:54.561
124	248	quizzes.canUpdate	Update	تحديث	Update on quizzes	تحديث — quizzes	update	t	2026-06-20 14:58:26.134	2026-06-22 17:06:54.568
125	248	quizzes.canDelete	Delete	حذف	Delete on quizzes	حذف — quizzes	delete	t	2026-06-20 14:58:26.151	2026-06-22 17:06:54.575
126	249	attendance.canView	View	عرض	View on attendance	عرض — attendance	view	t	2026-06-20 14:58:26.173	2026-06-22 17:06:54.583
127	249	attendance.canCreate	Create	إنشاء	Create on attendance	إنشاء — attendance	create	t	2026-06-20 14:58:26.192	2026-06-22 17:06:54.599
128	249	attendance.canUpdate	Update	تحديث	Update on attendance	تحديث — attendance	update	t	2026-06-20 14:58:26.211	2026-06-22 17:06:54.609
129	249	attendance.canDelete	Delete	حذف	Delete on attendance	حذف — attendance	delete	t	2026-06-20 14:58:26.226	2026-06-22 17:06:54.62
130	250	hr-attendance.canView	View	عرض	View on hr-attendance	عرض — hr-attendance	view	t	2026-06-20 14:58:26.241	2026-06-22 17:06:54.627
131	250	hr-attendance.canCreate	Create	إنشاء	Create on hr-attendance	إنشاء — hr-attendance	create	t	2026-06-20 14:58:26.253	2026-06-22 17:06:54.639
132	250	hr-attendance.canUpdate	Update	تحديث	Update on hr-attendance	تحديث — hr-attendance	update	t	2026-06-20 14:58:26.267	2026-06-22 17:06:54.647
133	250	hr-attendance.canDelete	Delete	حذف	Delete on hr-attendance	حذف — hr-attendance	delete	t	2026-06-20 14:58:26.283	2026-06-22 17:06:54.655
134	251	penalty.canView	View	عرض	View on penalty	عرض — penalty	view	t	2026-06-20 14:58:26.303	2026-06-22 17:06:54.666
135	251	penalty.canCreate	Create	إنشاء	Create on penalty	إنشاء — penalty	create	t	2026-06-20 14:58:26.318	2026-06-22 17:06:54.673
136	251	penalty.canUpdate	Update	تحديث	Update on penalty	تحديث — penalty	update	t	2026-06-20 14:58:26.333	2026-06-22 17:06:54.687
137	251	penalty.canDelete	Delete	حذف	Delete on penalty	حذف — penalty	delete	t	2026-06-20 14:58:26.345	2026-06-22 17:06:54.693
138	252	participation.canView	View	عرض	View on participation	عرض — participation	view	t	2026-06-20 14:58:26.363	2026-06-22 17:06:54.7
139	252	participation.canCreate	Create	إنشاء	Create on participation	إنشاء — participation	create	t	2026-06-20 14:58:26.376	2026-06-22 17:06:54.707
140	252	participation.canUpdate	Update	تحديث	Update on participation	تحديث — participation	update	t	2026-06-20 14:58:26.391	2026-06-22 17:06:54.713
141	252	participation.canDelete	Delete	حذف	Delete on participation	حذف — participation	delete	t	2026-06-20 14:58:26.407	2026-06-22 17:06:54.719
142	253	behavior.canView	View	عرض	View on behavior	عرض — behavior	view	t	2026-06-20 14:58:26.425	2026-06-22 17:06:54.725
143	253	behavior.canCreate	Create	إنشاء	Create on behavior	إنشاء — behavior	create	t	2026-06-20 14:58:26.439	2026-06-22 17:06:54.735
144	253	behavior.canUpdate	Update	تحديث	Update on behavior	تحديث — behavior	update	t	2026-06-20 14:58:26.449	2026-06-22 17:06:54.746
145	253	behavior.canDelete	Delete	حذف	Delete on behavior	حذف — behavior	delete	t	2026-06-20 14:58:26.459	2026-06-22 17:06:54.752
146	255	enrollments.canView	View	عرض	View on enrollments	عرض — enrollments	view	t	2026-06-20 14:58:26.47	2026-06-22 17:06:54.76
147	256	manage-enrollments.canView	View	عرض	View on manage-enrollments	عرض — manage-enrollments	view	t	2026-06-20 14:58:26.48	2026-06-22 17:06:54.766
149	256	manage-enrollments.canUpdate	Update	تحديث	Update on manage-enrollments	تحديث — manage-enrollments	update	t	2026-06-20 14:58:26.496	2026-06-22 17:06:54.777
150	256	manage-enrollments.canDelete	Delete	حذف	Delete on manage-enrollments	حذف — manage-enrollments	delete	t	2026-06-20 14:58:26.507	2026-06-22 17:06:54.782
151	257	programs.canView	View	عرض	View on programs	عرض — programs	view	t	2026-06-20 14:58:26.516	2026-06-22 17:06:54.789
152	257	programs.canCreate	Create	إنشاء	Create on programs	إنشاء — programs	create	t	2026-06-20 14:58:26.522	2026-06-22 17:06:54.795
153	257	programs.canUpdate	Update	تحديث	Update on programs	تحديث — programs	update	t	2026-06-20 14:58:26.529	2026-06-22 17:06:54.801
154	257	programs.canDelete	Delete	حذف	Delete on programs	حذف — programs	delete	t	2026-06-20 14:58:26.536	2026-06-22 17:06:54.806
155	258	subjects.canView	View	عرض	View on subjects	عرض — subjects	view	t	2026-06-20 14:58:26.544	2026-06-22 17:06:54.813
156	258	subjects.canCreate	Create	إنشاء	Create on subjects	إنشاء — subjects	create	t	2026-06-20 14:58:26.55	2026-06-22 17:06:54.818
157	258	subjects.canUpdate	Update	تحديث	Update on subjects	تحديث — subjects	update	t	2026-06-20 14:58:26.558	2026-06-22 17:06:54.825
158	258	subjects.canDelete	Delete	حذف	Delete on subjects	حذف — subjects	delete	t	2026-06-20 14:58:26.565	2026-06-22 17:06:54.831
159	259	marks-entry.canView	View	عرض	View on marks-entry	عرض — marks-entry	view	t	2026-06-20 14:58:26.572	2026-06-22 17:06:54.842
160	259	marks-entry.canUpdate	Update	تحديث	Update on marks-entry	تحديث — marks-entry	update	t	2026-06-20 14:58:26.578	2026-06-22 17:06:54.849
161	272	quiz-results.canView	View	عرض	View on quiz-results	عرض — quiz-results	view	t	2026-06-20 14:58:26.584	2026-06-22 17:06:54.858
106	243	dashboard.canView	View	عرض	View on dashboard	عرض — dashboard	view	t	2026-06-20 14:58:25.77	2026-06-22 17:06:54.376
163	273	homework-results.canView	View	عرض	View on homework-results	عرض — homework-results	view	t	2026-06-20 14:58:26.6	2026-06-22 17:06:54.872
164	273	homework-results.canExport	Export	تصدير	Export on homework-results	تصدير — homework-results	view	t	2026-06-20 14:58:26.606	2026-06-22 17:06:54.88
165	274	training-results.canView	View	عرض	View on training-results	عرض — training-results	view	t	2026-06-20 14:58:26.614	2026-06-22 17:06:54.889
166	274	training-results.canExport	Export	تصدير	Export on training-results	تصدير — training-results	view	t	2026-06-20 14:58:26.622	2026-06-22 17:06:54.895
167	275	lab-results.canView	View	عرض	View on lab-results	عرض — lab-results	view	t	2026-06-20 14:58:26.629	2026-06-22 17:06:54.902
168	275	lab-results.canExport	Export	تصدير	Export on lab-results	تصدير — lab-results	view	t	2026-06-20 14:58:26.636	2026-06-22 17:06:54.907
169	262	analytics.canView	View	عرض	View on analytics	عرض — analytics	view	t	2026-06-20 14:58:26.647	2026-06-22 17:06:54.914
170	263	advanced-analytics.canView	View	عرض	View on advanced-analytics	عرض — advanced-analytics	view	t	2026-06-20 14:58:26.656	2026-06-22 17:06:54.92
171	264	chat.canView	View	عرض	View on chat	عرض — chat	view	t	2026-06-20 14:58:26.664	2026-06-22 17:06:54.927
172	264	chat.canCreate	Create	إنشاء	Create on chat	إنشاء — chat	create	t	2026-06-20 14:58:26.674	2026-06-22 17:06:54.934
173	265	notifications.canView	View	عرض	View on notifications	عرض — notifications	view	t	2026-06-20 14:58:26.685	2026-06-22 17:06:54.941
174	265	notifications.canUpdate	Update	تحديث	Update on notifications	تحديث — notifications	update	t	2026-06-20 14:58:26.694	2026-06-22 17:06:54.947
175	266	scheduled-reports.canView	View	عرض	View on scheduled-reports	عرض — scheduled-reports	view	t	2026-06-20 14:58:26.702	2026-06-22 17:06:54.954
176	266	scheduled-reports.canCreate	Create	إنشاء	Create on scheduled-reports	إنشاء — scheduled-reports	create	t	2026-06-20 14:58:26.714	2026-06-22 17:06:54.962
177	266	scheduled-reports.canUpdate	Update	تحديث	Update on scheduled-reports	تحديث — scheduled-reports	update	t	2026-06-20 14:58:26.724	2026-06-22 17:06:54.967
178	266	scheduled-reports.canDelete	Delete	حذف	Delete on scheduled-reports	حذف — scheduled-reports	delete	t	2026-06-20 14:58:26.731	2026-06-22 17:06:54.972
179	267	workflow.canView	View	عرض	View on workflow	عرض — workflow	view	t	2026-06-20 14:58:26.739	2026-06-22 17:06:54.98
180	267	workflow.canCreate	Create	إنشاء	Create on workflow	إنشاء — workflow	create	t	2026-06-20 14:58:26.748	2026-06-22 17:06:54.987
181	267	workflow.canUpdate	Update	تحديث	Update on workflow	تحديث — workflow	update	t	2026-06-20 14:58:26.756	2026-06-22 17:06:54.993
182	267	workflow.canDelete	Delete	حذف	Delete on workflow	حذف — workflow	delete	t	2026-06-20 14:58:26.765	2026-06-22 17:06:54.998
183	268	drive.canView	View	عرض	View on drive	عرض — drive	view	t	2026-06-20 14:58:26.776	2026-06-22 17:06:55.005
184	268	drive.canCreate	Create	إنشاء	Create on drive	إنشاء — drive	create	t	2026-06-20 14:58:26.782	2026-06-22 17:06:55.01
185	268	drive.canUpdate	Update	تحديث	Update on drive	تحديث — drive	update	t	2026-06-20 14:58:26.789	2026-06-22 17:06:55.015
186	268	drive.canDelete	Delete	حذف	Delete on drive	حذف — drive	delete	t	2026-06-20 14:58:26.796	2026-06-22 17:06:55.021
187	270	profile.canView	View	عرض	View on profile	عرض — profile	view	t	2026-06-20 14:58:26.806	2026-06-22 17:06:55.028
188	270	profile.canUpdate	Update	تحديث	Update on profile	تحديث — profile	update	t	2026-06-20 14:58:26.814	2026-06-22 17:06:55.033
189	271	permission-matrix.canView	View	عرض	View on permission-matrix	عرض — permission-matrix	view	t	2026-06-20 14:58:26.825	2026-06-22 17:06:55.04
190	271	permission-matrix.canUpdate	Update	تحديث	Update on permission-matrix	تحديث — permission-matrix	update	t	2026-06-20 14:58:26.832	2026-06-22 17:06:55.045
191	276	timer.canView	View	عرض	View on timer	عرض — timer	view	t	2026-06-20 14:58:26.842	2026-06-22 17:06:55.051
14	5	summary-dashboard.canView	View	عرض	View on summary-dashboard	عرض — summary-dashboard	view	t	2026-06-20 14:31:55.177	2026-06-22 17:06:55.057
21	8	instructor-availability-view.canView	View	عرض	View on instructor-availability-view	عرض — instructor-availability-view	view	t	2026-06-20 14:31:55.471	2026-06-22 17:06:55.107
54	17	email-templates.canDelete	Delete	حذف	Delete on email-templates	حذف — email-templates	delete	t	2026-06-20 14:31:56.447	2026-06-22 17:06:55.332
57	19	activity-types.canCreate	Create	إنشاء	Create on activity-types	إنشاء — activity-types	create	t	2026-06-20 14:31:56.519	2026-06-22 17:06:55.359
96	29	attendance-status-types.canView	View	عرض	View on attendance-status-types	عرض — attendance-status-types	view	t	2026-06-20 14:31:56.934	2026-06-22 17:06:55.621
192	254	qr-scanner.canMarkAttendance	Mark Attendance	تسجيل الحضور	Mark Attendance	تسجيل الحضور	create	t	2026-06-20 14:58:27.552	2026-06-22 17:06:55.684
193	254	qr-scanner.canUseQRScanner	Use QR Scanner	استخدام ماسح QR	Use QR Scanner	استخدام ماسح QR	create	t	2026-06-20 14:58:27.557	2026-06-22 17:06:55.691
194	254	qr-scanner.canManualInput	Manual Input	إدخال يدوي	Manual Input	إدخال يدوي	create	t	2026-06-20 14:58:27.563	2026-06-22 17:06:55.696
195	254	qr-scanner.canEditAttendance	Edit Attendance	تعديل الحضور	Edit Attendance	تعديل الحضور	update	t	2026-06-20 14:58:27.571	2026-06-22 17:06:55.702
196	254	qr-scanner.canDeleteAttendance	Delete Attendance	حذف الحضور	Delete Attendance	حذف الحضور	delete	t	2026-06-20 14:58:27.578	2026-06-22 17:06:55.708
197	254	qr-scanner.canClearToday	Clear Today	مسح اليوم	Clear Today	مسح اليوم	delete	t	2026-06-20 14:58:27.589	2026-06-22 17:06:55.713
198	254	qr-scanner.canBulkScan	Bulk Scan	مسح جماعي	Bulk Scan	مسح جماعي	create	t	2026-06-20 14:58:27.594	2026-06-22 17:06:55.718
199	254	qr-scanner.canUseStatsPanel	Stats Panel	لوحة الإحصائيات	Stats Panel	لوحة الإحصائيات	view	t	2026-06-20 14:58:27.602	2026-06-22 17:06:55.723
200	254	qr-scanner.canUseZapPanel	Zap Panel	لوحة Zap	Zap Panel	لوحة Zap	view	t	2026-06-20 14:58:27.614	2026-06-22 17:06:55.728
201	254	qr-scanner.canSeeStandupMode	Standup Mode	وضع الوقوف	Standup Mode	وضع الوقوف	view	t	2026-06-20 14:58:27.622	2026-06-22 17:06:55.733
202	254	qr-scanner.canSeeQuickButtons	Quick Buttons	أزرار سريعة	Quick Buttons	أزرار سريعة	view	t	2026-06-20 14:58:27.628	2026-06-22 17:06:55.739
203	254	qr-scanner.canExport	Export	تصدير	Export	تصدير	view	t	2026-06-20 14:58:27.635	2026-06-22 17:06:55.746
204	254	qr-scanner.canExportSummary	Export Summary	تصدير الملخص	Export Summary	تصدير الملخص	view	t	2026-06-20 14:58:27.642	2026-06-22 17:06:55.752
105	242	home.canView	View	عرض	View on home	عرض — home	view	t	2026-06-20 14:58:25.744	2026-06-22 17:06:54.349
111	245	student-dashboard.canView	View	عرض	View on student-dashboard	عرض — student-dashboard	view	t	2026-06-20 14:58:25.862	2026-06-22 17:06:54.44
148	256	manage-enrollments.canCreate	Create	إنشاء	Create on manage-enrollments	إنشاء — manage-enrollments	create	t	2026-06-20 14:58:26.488	2026-06-22 17:06:54.772
162	272	quiz-results.canExport	Export	تصدير	Export on quiz-results	تصدير — quiz-results	view	t	2026-06-20 14:58:26.589	2026-06-22 17:06:54.864
\.


--
-- Data for Name: participation_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.participation_types (id, code, "nameEn", "nameAr", description, "isPositive", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	POSITIVE	Positive Participation	مشاركة إيجابية	Positive classroom participation	t	t	\N	\N	2026-04-01 13:26:45.867	2026-04-01 13:26:45.867
2	LATE	Late Arrival	تأخر عن الحضور	Student arrived late to class	f	t	\N	\N	2026-04-01 13:26:45.89	2026-04-01 13:26:45.89
3	HELPFUL	Helpful Behavior	سلوك مساعد	Student helped others	t	t	\N	\N	2026-04-01 13:26:45.899	2026-04-01 13:26:45.899
4	DISRUPTIVE	Disruptive Behavior	سلوك مزعج	Student caused disruption in class	f	t	\N	\N	2026-04-01 13:26:45.909	2026-04-01 13:26:45.909
5	EXCELLENT	Excellent Work	عمل ممتاز	Student demonstrated excellent understanding	t	t	\N	\N	2026-04-01 13:26:45.922	2026-04-01 13:26:45.922
\.


--
-- Data for Name: participations; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.participations (id, "userId", "classId", "programId", "subjectId", "typeId", points, "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
41	17	3	1	2	5	5	Exceptional algorithm implementation	تنفيذ خوارزميات استثنائي	\N	f	1	1	2026-04-24 17:48:05.95	2026-04-25 12:15:19.945
31	17	1	1	1	1	3	Active participation in class discussion	مشاركة نشطة في مناقشة الفصل	\N	t	1	\N	2026-04-24 17:48:05.905	2026-04-24 17:48:05.905
32	18	1	1	1	5	5	Excellent presentation on algorithms	عرض ممتاز حول الخوارزميات	\N	t	1	\N	2026-04-24 17:48:05.913	2026-04-24 17:48:05.913
35	21	4	1	3	5	5	Outstanding database design project	مشروع تصميم قواعد بيانات ممتاز	\N	t	1	\N	2026-04-24 17:48:05.925	2026-04-24 17:48:05.925
36	22	5	2	5	3	4	Assisted classmates with math problems	ساعد الزملاء في مسائل الرياضيات	\N	t	1	\N	2026-04-24 17:48:05.93	2026-04-24 17:48:05.93
40	26	1	1	1	1	3	Consistent class participation	مشاركة صفية مستمرة	\N	t	1	\N	2026-04-24 17:48:05.946	2026-04-24 17:48:05.946
42	18	4	1	3	3	4	Mentored junior students	وجه الطلاب الجدد	\N	t	1	\N	2026-04-24 17:48:05.955	2026-04-24 17:48:05.955
43	19	5	2	5	1	3	Active in group discussions	نشط في المناقشات الجماعية	\N	t	1	\N	2026-04-24 17:48:05.959	2026-04-24 17:48:05.959
34	20	3	1	2	1	3	Good questions during lecture	أسئلة جيدة خلال المحاضرة	\N	f	1	1	2026-04-24 17:48:05.921	2026-04-25 12:15:23.41
33	19	\N	1	1	3	4	Helped peers with lab exercises	ساعد الزملاء في تمارين المختبر	\N	t	1	\N	2026-04-24 17:48:05.917	2026-04-24 17:48:05.917
\.


--
-- Data for Name: penalties; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.penalties (id, "userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", points, comment, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: penalty_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.penalty_types (id, code, "nameEn", "nameAr", description, severity, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	LATE_SUBMISSION	Late Submission	تقديم متأخر	Assignment submitted after deadline	low	#FFA500	t	\N	\N	2026-03-27 17:22:24.727	2026-03-27 17:22:24.727
2	ABSENCE	Unexcused Absence	غياب بدون عذر	Absent without valid excuse	medium	#FF6347	t	\N	\N	2026-03-27 17:22:24.737	2026-03-27 17:22:24.737
3	MISCONDUCT	Misconduct	سوء سلوك	Behavioral misconduct	high	#DC143C	t	\N	\N	2026-03-27 17:22:24.759	2026-03-27 17:22:24.759
4	CHEATING	Cheating	غش	Academic dishonesty	high	#8B0000	t	\N	\N	2026-03-27 17:22:24.766	2026-03-27 17:22:24.766
5	PLAGIARISM	Plagiarism	انتحال	Plagiarized work	high	#8B0000	t	\N	\N	2026-03-27 17:22:24.778	2026-03-27 17:22:24.778
6	DISRUPTION	Class Disruption	تعطيل الفصل	Disrupting class activities	medium	#FF4500	t	\N	\N	2026-03-27 17:22:24.786	2026-03-27 17:22:24.786
7	DRESS_CODE	Dress Code Violation	مخالفة قواعد اللباس	Violation of dress code	low	#FFD700	t	\N	\N	2026-03-27 17:22:24.793	2026-03-27 17:22:24.793
\.


--
-- Data for Name: permission_denial_audit; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.permission_denial_audit (id, "userId", action, resource, reason, "userRole", "createdAt") FROM stdin;
\.


--
-- Data for Name: priority_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.priority_types (id, code, "nameEn", "nameAr", description, level, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	LOW	Low Priority	أولوية منخفضة	Low priority announcement	1	#6C757D	t	\N	\N	2026-03-27 17:22:24.965	2026-03-27 17:22:24.965
2	NORMAL	Normal Priority	أولوية عادية	Normal priority announcement	2	#007BFF	t	\N	\N	2026-03-27 17:22:24.973	2026-03-27 17:22:24.973
3	HIGH	High Priority	أولوية عالية	High priority announcement	3	#FFC107	t	\N	\N	2026-03-27 17:22:24.978	2026-03-27 17:22:24.978
4	URGENT	Urgent	عاجل	Urgent announcement	4	#DC3545	t	\N	\N	2026-03-27 17:22:24.984	2026-03-27 17:22:24.984
5	CRITICAL	Critical	حرج	Critical announcement	5	#8B0000	t	\N	\N	2026-03-27 17:22:24.991	2026-03-27 17:22:24.991
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.programs (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "durationType", "durationValue", "startDate", "endDate", "categoryId", "targetAudience", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	IT	Information Technology Diploma	دبلوم تقنية المعلومات	Information Technology Diploma	دبلوم تقنية المعلومات	2	1.5	70	ACADEMIC_SEMESTER	\N	\N	\N	\N	\N	t	1	1	2026-03-27 17:25:10.047	2026-03-28 12:12:27.923
2	sadf	sadf	sadf	asdf	sadf	2	1.5	70	ACADEMIC_SEMESTER	\N	\N	\N	\N	\N	f	1	1	2026-03-28 12:12:31.729	2026-03-28 12:12:37.811
3	EE-ENG	Electrical Engineering	الهندسة الكهربائية	Bachelor degree in Electrical Engineering	بكالوريوس في الهندسة الكهربائية	4	\N	\N	ACADEMIC_SEMESTER	\N	\N	\N	\N	\N	t	1	\N	2026-04-01 13:26:47.114	2026-04-24 17:46:10.515
4	CE-ENG	Civil Engineering	الهندسة المدنية	Bachelor degree in Civil Engineering	بكالوريوس في الهندسة المدنية	4	\N	\N	ACADEMIC_SEMESTER	\N	\N	\N	\N	\N	t	1	\N	2026-04-01 13:26:47.124	2026-04-24 17:46:10.521
\.


--
-- Data for Name: public_links; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.public_links (id, "fileId", "folderId", token, "passwordHash", "maxDownloads", "downloadCount", "expiresAt", "revokedAt", "createdById", "createdAt") FROM stdin;
31033e46-d804-4775-9aca-e53cfccb4337	bc930527-06ec-4d3c-ae1e-14af9befe2ba	\N	2cae0f3a-e644-4a0c-bfaf-0e8d46dd9425	\N	\N	0	2026-04-26 16:32:20.86	\N	1	2026-04-18 10:42:58.284
e1940f05-97fa-4702-95ed-fc4604ccb1a9	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	4uTfvksdhPDlUtJMYe7TpMDHJGMHAJyrZQAj6D4KUo4	\N	\N	0	2026-05-02 17:12:57.095	\N	1	2026-04-25 17:12:57.098
5aa08dc3-0375-4e34-afed-c0e60ef446d9	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	pJFaIDaZSlM4lFTF9aQMWa9Ap0hyP6ZeVFRq0alB5rI	\N	\N	0	2026-05-03 07:38:37.542	\N	1	2026-04-26 07:38:37.545
83579b00-710a-4021-a600-2483b57c669a	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	Xa3gZLUd-TkEmiN9LP_LtFu-v3VvVyiSMqPdmT4Eqt4	\N	\N	0	2026-05-03 07:38:42.496	\N	1	2026-04-26 07:38:42.498
ae43c6e9-3639-4451-b8ba-669e9002a0a4	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	sj-RSS078yA_qX7gK4-X_gylapt84ajDAPXeL469XL4	\N	\N	0	2026-05-03 07:38:47.798	\N	1	2026-04-26 07:38:47.8
7cb9a0bd-056c-40dd-a773-b3711ce75d57	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	pxBeVIvd9J2yB6cN2og1BXfZgN9gnYR65c39w3FoFBk	\N	\N	0	2026-05-03 07:39:22.262	\N	1	2026-04-26 07:39:22.264
0eaac905-e40b-43f1-95ef-1d5315952d63	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	h6FJRShl6cbtcH92NvydCuRS1hj3nKJCaIS7NkSJG5M	\N	\N	0	2026-05-03 07:47:31.698	\N	1	2026-04-26 07:47:31.702
04dc280a-c848-4ff5-b293-dd26999504ad	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	3AtiKGSn6Q42KnA-9UKZrHM__bbWx6WyMpMFoNFYme4	\N	\N	0	2026-07-25 07:47:35.569	\N	1	2026-04-26 07:47:35.57
a372f1fa-d00d-4774-8be7-8ddbcccd4121	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	WPrQV0bJhz57xSLGMO4ljytrShdWbgfSP0-l5HIufRw	\N	\N	0	2026-05-03 07:56:45.784	\N	1	2026-04-26 07:56:45.786
4ac07419-dfb9-461d-982b-25b4c6e906f8	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	Oo_hm57crFflwO1K_tv6qHcHy-3tuf7jW16LrU07oPs	\N	\N	0	2026-05-03 08:02:31.744	\N	1	2026-04-26 08:02:31.746
806aaf8e-61d6-46c0-926b-8f9d742d1773	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	r_nESDzb0WwbqhkCurO8b_1c8MnjqPVMclfqDXUmRJM	\N	\N	0	2026-05-03 08:05:16.061	\N	1	2026-04-26 08:05:16.064
81552ea9-5d45-4165-8b63-6ccb5f3f6f7a	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	MnCpMY8Y1D9Cj93dSY7m-ArYwtuo67aKXqMIOkujlHs	\N	\N	0	2026-05-03 08:07:06.79	\N	1	2026-04-26 08:07:06.792
c7a556f5-1679-440c-865f-80d03f7bcdb6	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	qhmMm-O0w4HuQWw5OSOiw45kK0g_sy4QnsvM5fw8Ju0	\N	\N	0	2026-05-03 08:26:35.429	\N	1	2026-04-26 08:26:35.435
42dc7ff3-4800-4fb7-b693-3264987c209e	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	XROdT4JBWekrpyc6_-e-teM5nTuhcSAjJObpFT0rCbc	\N	\N	0	2026-05-03 08:37:04.943	\N	1	2026-04-26 08:37:04.945
99e8e4f0-fa13-4190-890e-3701b4879ca6	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	sTiEURT72lZ5LFYbt0BZ_UcKW-CcnQb_MymT5OLEZyY	\N	\N	1	2026-05-03 08:48:09.225	\N	1	2026-04-26 08:48:09.227
b06cfebb-8a93-4bd5-9729-7d1c4fc484c9	3f3b21c6-2ae9-4ed4-a065-dfd7f1ca5ed7	\N	_HjhWIEDjKyJOZQ1PeapldM5YHuT40l2HNbCQtJa1-I	\N	\N	1	2026-05-10 08:53:54.981	\N	1	2026-05-03 08:53:54.984
793cb0cd-1a53-4686-9220-8d339eb73c50	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	zVFpQQZ92Vj1daGbrRZDyeVsLwZnEvCiUuCYPd59yjU	\N	\N	0	2026-05-11 03:20:32.39	\N	101	2026-05-04 03:20:32.392
867b3daf-a193-4993-8128-40fca5003e84	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	b3Bam19OU-ltIe8oa6PjzIeWj3RlG1oy9dWJTCdy_z0	\N	\N	0	2026-05-05 03:21:07.896	\N	101	2026-05-04 03:21:07.898
08c93ab4-02cb-4d7f-8ac3-bb14d3b9d78f	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	6MgUoAWW2R2DSMlbzkf1SPT4mLNjx1S1FDklBboZqB0	\N	\N	2	2026-05-10 17:27:39.604	\N	101	2026-05-03 17:27:39.606
94f32802-94bc-4938-ac28-b3f59e00ba22	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	RPm6ZKh7VUIt8xhZFwKqheiSklr0QcfqY0ZzKv-u7cI	\N	\N	1	2026-05-05 03:22:09.258	\N	101	2026-05-04 03:22:09.259
721c8885-0c83-4055-a173-78b1bf1281d0	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	SmgwWNjekdjwUtjQwBqeZumhhpjix9XYLqVs_kijV74	\N	\N	1	2026-05-11 03:26:23.699	\N	101	2026-05-04 03:26:23.701
1afaaf1e-738a-4f28-b41d-65b2b0415d5d	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	1ciKwrBjViy1moEx1y6XciMqyhpBXyx2aGDSdFZyhmk	\N	\N	1	2026-05-11 03:33:00.289	\N	101	2026-05-04 03:33:00.29
559acb5d-dd55-47c2-8f74-5d6eb66432c4	f72e2d23-cdc9-4aea-8b15-1b0ed5895ad8	\N	MwDnPJop6VE6-yfO0j-ueT0mLVpm05kOl6mJLMZhyC0	\N	\N	1	2026-05-11 07:44:01.866	\N	101	2026-05-04 07:44:01.878
\.


--
-- Data for Name: question_difficulty_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.question_difficulty_types (id, code, "nameEn", "nameAr", description, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	EASY	Easy	سهل	Basic difficulty level	\N	t	\N	\N	2026-03-27 17:22:48.868	2026-03-27 17:22:48.868
2	MEDIUM	Medium	متوسط	Intermediate difficulty level	\N	t	\N	\N	2026-03-27 17:22:48.875	2026-03-27 17:22:48.875
3	HARD	Hard	صعب	Advanced difficulty level	\N	t	\N	\N	2026-03-27 17:22:48.881	2026-03-27 17:22:48.881
4	EXPERT	Expert	خبير	Expert difficulty level	\N	t	\N	\N	2026-03-27 17:22:48.886	2026-03-27 17:22:48.886
\.


--
-- Data for Name: question_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.question_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	MULTIPLE_CHOICE	Multiple Choice	اختيار من متعدد	Multiple choice question	t	\N	\N	2026-03-27 17:22:48.595	2026-03-27 17:22:48.595
2	TRUE_FALSE	True/False	صح/خطأ	True or false question	t	\N	\N	2026-03-27 17:22:48.603	2026-03-27 17:22:48.603
3	SHORT_ANSWER	Short Answer	إجابة قصيرة	Short answer question	t	\N	\N	2026-03-27 17:22:48.609	2026-03-27 17:22:48.609
4	ESSAY	Essay	مقال	Essay question	t	\N	\N	2026-03-27 17:22:48.614	2026-03-27 17:22:48.614
5	FILL_BLANK	Fill in the Blank	املأ الفراغ	Fill in the blank question	t	\N	\N	2026-03-27 17:22:48.62	2026-03-27 17:22:48.62
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.questions (id, "quizId", "questionEn", "questionAr", "explanationEn", "explanationAr", "typeId", options, "correctAnswer", points, "order", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.quiz_attempts (id, "quizId", "userId", score, "maxScore", percentage, passed, "startedAt", "completedAt", "timeSpent", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: quiz_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.quiz_status_types (id, code, "nameEn", "nameAr", description, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	DRAFT	Draft	مسودة	Quiz is being created	\N	t	\N	\N	2026-03-27 17:22:48.826	2026-03-27 17:22:48.826
2	PUBLISHED	Published	منشور	Quiz is published and available	\N	t	\N	\N	2026-03-27 17:22:48.834	2026-03-27 17:22:48.834
3	ACTIVE	Active	نشط	Quiz is currently active	\N	t	\N	\N	2026-03-27 17:22:48.84	2026-03-27 17:22:48.84
4	CLOSED	Closed	مغلق	Quiz is closed for submissions	\N	t	\N	\N	2026-03-27 17:22:48.846	2026-03-27 17:22:48.846
5	GRADED	Graded	مصحح	Quiz has been graded	\N	t	\N	\N	2026-03-27 17:22:48.851	2026-03-27 17:22:48.851
6	ARCHIVED	Archived	مؤرشف	Quiz is archived	\N	t	\N	\N	2026-03-27 17:22:48.857	2026-03-27 17:22:48.857
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.quizzes (id, "titleEn", "titleAr", "descriptionEn", "descriptionAr", difficulty, duration, "maxAttempts", "passingScore", "randomizeQuestions", "randomizeAnswers", "showCorrectAnswers", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: requirement_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.requirement_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	MANDATORY	Mandatory	إلزامي	Required subject for graduation	t	\N	\N	2026-03-27 17:22:24.682	2026-03-27 17:22:24.682
2	OPTIONAL	Optional	اختياري	Not required but recommended	t	\N	\N	2026-03-27 17:22:24.693	2026-03-27 17:22:24.693
3	PREREQUISITE	Prerequisite	مطلب سابق	Required before taking other subjects	t	\N	\N	2026-03-27 17:22:24.705	2026-03-27 17:22:24.705
\.


--
-- Data for Name: resource_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.resource_types (id, code, "nameEn", "nameAr", description, icon, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	DOCUMENT	Document	مستند	Document file	file-text	t	\N	\N	2026-03-27 17:22:25.003	2026-03-27 17:22:25.003
2	VIDEO	Video	فيديو	Video file	video	t	\N	\N	2026-03-27 17:22:25.009	2026-03-27 17:22:25.009
3	AUDIO	Audio	صوت	Audio file	music	t	\N	\N	2026-03-27 17:22:25.015	2026-03-27 17:22:25.015
4	IMAGE	Image	صورة	Image file	image	t	\N	\N	2026-03-27 17:22:25.021	2026-03-27 17:22:25.021
5	PRESENTATION	Presentation	عرض تقديمي	Presentation file	presentation	t	\N	\N	2026-03-27 17:22:25.027	2026-03-27 17:22:25.027
6	SPREADSHEET	Spreadsheet	جدول بيانات	Spreadsheet file	table	t	\N	\N	2026-03-27 17:22:25.033	2026-03-27 17:22:25.033
7	LINK	External Link	رابط خارجي	External URL	link	t	\N	\N	2026-03-27 17:22:25.04	2026-03-27 17:22:25.04
8	ARCHIVE	Archive	أرشيف	Compressed archive	archive	t	\N	\N	2026-03-27 17:22:25.047	2026-03-27 17:22:25.047
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.resources (id, "classId", "titleEn", "titleAr", "descriptionEn", "descriptionAr", "typeId", "categoryId", "isRequired", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "downloadCount", "programId", "subjectId", "dueDate", featured, url) FROM stdin;
2	3	Data Structures Video Tutorial	فيديو تعليمي لهياكل البيانات	Video tutorial on data structures	فيديو تعليمي لهياكل البيانات	2	5	f	t	1	\N	2026-04-01 13:26:47.84	2026-04-01 13:26:47.84	0	\N	2	\N	f	/resources/data-structures.mp4
3	5	Engineering Mathematics Textbook	كتاب الرياضيات الهندسية	Complete textbook for engineering mathematics	كتاب كامل للرياضيات الهندسية	1	4	f	t	1	\N	2026-04-01 13:26:47.845	2026-04-01 13:26:47.845	0	\N	5	\N	f	/resources/math-textbook.pdf
5	3	Algorithm Visualization	تصور الخوارزميات	Interactive algorithm visualizations	تصورات تفاعلية للخوارزميات	2	5	f	t	1	\N	2026-04-01 13:26:47.858	2026-04-01 13:26:47.858	0	\N	2	\N	f	/resources/algorithms-visualization.mp4
7	4	Database Design Tutorial	دليل تصميم قواعد البيانات	Step-by-step database design guide	دليل خطوة بخطوة لتصميم قواعد البيانات	2	5	f	t	1	\N	2026-04-01 13:26:47.871	2026-04-01 13:26:47.871	0	\N	3	\N	f	/resources/database-tutorial.mp4
9	4	Software Engineering Case Studies	دراسات حالة في هندسة البرمجيات	Real-world software engineering case studies	دراسات حالة واقعية في هندسة البرمجيات	1	4	f	t	1	\N	2026-04-01 13:26:47.882	2026-04-01 13:26:47.882	0	\N	4	\N	f	/resources/se-case-studies.pdf
12	5	Engineering Mathematics Solutions	حلول الرياضيات الهندسية	Step-by-step solutions to engineering math problems	حلول خطوة بخطوة لمسائل الرياضيات الهندسية	1	4	f	t	1	\N	2026-04-01 13:26:47.899	2026-04-01 13:26:47.899	0	\N	5	\N	f	/resources/math-solutions.pdf
17	3	Data Structures Video Tutorial	فيديو تعليمي لهياكل البيانات	Video tutorial on data structures	فيديو تعليمي لهياكل البيانات	2	5	f	t	1	\N	2026-04-01 13:27:36.624	2026-04-01 13:27:36.624	0	\N	2	\N	f	/resources/data-structures.mp4
18	5	Engineering Mathematics Textbook	كتاب الرياضيات الهندسية	Complete textbook for engineering mathematics	كتاب كامل للرياضيات الهندسية	1	4	f	t	1	\N	2026-04-01 13:27:36.631	2026-04-01 13:27:36.631	0	\N	5	\N	f	/resources/math-textbook.pdf
20	3	Algorithm Visualization	تصور الخوارزميات	Interactive algorithm visualizations	تصورات تفاعلية للخوارزميات	2	5	f	t	1	\N	2026-04-01 13:27:36.644	2026-04-01 13:27:36.644	0	\N	2	\N	f	/resources/algorithms-visualization.mp4
22	4	Database Design Tutorial	دليل تصميم قواعد البيانات	Step-by-step database design guide	دليل خطوة بخطوة لتصميم قواعد البيانات	2	5	f	t	1	\N	2026-04-01 13:27:36.658	2026-04-01 13:27:36.658	0	\N	3	\N	f	/resources/database-tutorial.mp4
24	4	Software Engineering Case Studies	دراسات حالة في هندسة البرمجيات	Real-world software engineering case studies	دراسات حالة واقعية في هندسة البرمجيات	1	4	f	t	1	\N	2026-04-01 13:27:36.67	2026-04-01 13:27:36.67	0	\N	4	\N	f	/resources/se-case-studies.pdf
27	5	Engineering Mathematics Solutions	حلول الرياضيات الهندسية	Step-by-step solutions to engineering math problems	حلول خطوة بخطوة لمسائل الرياضيات الهندسية	1	4	f	t	1	\N	2026-04-01 13:27:36.687	2026-04-01 13:27:36.687	0	\N	5	\N	f	/resources/math-solutions.pdf
32	3	Data Structures Video Tutorial	فيديو تعليمي لهياكل البيانات	Video tutorial on data structures	فيديو تعليمي لهياكل البيانات	2	5	f	t	1	\N	2026-04-24 17:48:05.681	2026-04-24 17:48:05.681	0	\N	2	\N	f	/resources/data-structures.mp4
33	5	Engineering Mathematics Textbook	كتاب الرياضيات الهندسية	Complete textbook for engineering mathematics	كتاب كامل للرياضيات الهندسية	1	4	f	t	1	\N	2026-04-24 17:48:05.69	2026-04-24 17:48:05.69	0	\N	5	\N	f	/resources/math-textbook.pdf
35	3	Algorithm Visualization	تصور الخوارزميات	Interactive algorithm visualizations	تصورات تفاعلية للخوارزميات	2	5	f	t	1	\N	2026-04-24 17:48:05.708	2026-04-24 17:48:05.708	0	\N	2	\N	f	/resources/algorithms-visualization.mp4
37	4	Database Design Tutorial	دليل تصميم قواعد البيانات	Step-by-step database design guide	دليل خطوة بخطوة لتصميم قواعد البيانات	2	5	f	t	1	\N	2026-04-24 17:48:05.724	2026-04-24 17:48:05.724	0	\N	3	\N	f	/resources/database-tutorial.mp4
39	4	Software Engineering Case Studies	دراسات حالة في هندسة البرمجيات	Real-world software engineering case studies	دراسات حالة واقعية في هندسة البرمجيات	1	4	f	t	1	\N	2026-04-24 17:48:05.748	2026-04-24 17:48:05.748	0	\N	4	\N	f	/resources/se-case-studies.pdf
42	5	Engineering Mathematics Solutions	حلول الرياضيات الهندسية	Step-by-step solutions to engineering math problems	حلول خطوة بخطوة لمسائل الرياضيات الهندسية	1	4	f	t	1	\N	2026-04-24 17:48:05.771	2026-04-24 17:48:05.771	0	\N	5	\N	f	/resources/math-solutions.pdf
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.role_permissions (id, role, "screenId", "operationId", allowed, "createdAt", "updatedAt") FROM stdin;
7	super_admin	2	2	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
8	super_admin	2	3	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
9	super_admin	2	4	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
10	super_admin	2	5	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
11	super_admin	3	6	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
12	super_admin	3	7	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
13	super_admin	3	8	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
14	super_admin	3	9	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
15	super_admin	4	10	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
16	super_admin	4	11	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
17	super_admin	4	12	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
18	super_admin	4	13	t	2026-05-31 14:37:41.153	2026-05-31 14:37:41.153
19	admin	2	2	f	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
20	admin	2	3	f	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
21	admin	2	4	f	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
22	admin	2	5	f	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
23	admin	3	6	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
24	admin	3	7	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
25	admin	3	8	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
26	admin	3	9	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
27	admin	4	10	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
28	admin	4	11	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
29	admin	4	12	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
30	admin	4	13	t	2026-05-31 14:37:48.402	2026-05-31 14:37:48.402
31	hr	2	2	f	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
32	hr	2	3	f	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
33	hr	2	4	f	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
34	hr	2	5	f	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
35	hr	3	6	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
36	hr	3	7	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
37	hr	3	8	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
38	hr	3	9	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
39	hr	4	10	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
40	hr	4	11	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
41	hr	4	12	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
42	hr	4	13	t	2026-05-31 14:37:55.545	2026-05-31 14:37:55.545
46	instructor	5	14	t	2026-06-20 14:31:55.216	2026-06-22 17:06:55.062
47	student	5	14	f	2026-06-20 14:31:55.222	2026-06-22 17:06:55.063
48	super_admin	5	15	t	2026-06-20 14:31:55.237	2026-06-22 17:06:55.07
49	hr	5	15	t	2026-06-20 14:31:55.245	2026-06-22 17:06:55.071
50	admin	5	15	t	2026-06-20 14:31:55.251	2026-06-22 17:06:55.072
51	instructor	5	15	f	2026-06-20 14:31:55.263	2026-06-22 17:06:55.073
52	student	5	15	f	2026-06-20 14:31:55.27	2026-06-22 17:06:55.074
53	super_admin	6	16	t	2026-06-20 14:31:55.286	2026-06-22 17:06:55.076
54	hr	6	16	t	2026-06-20 14:31:55.291	2026-06-22 17:06:55.077
55	admin	6	16	t	2026-06-20 14:31:55.295	2026-06-22 17:06:55.078
56	instructor	6	16	t	2026-06-20 14:31:55.299	2026-06-22 17:06:55.079
57	student	6	16	t	2026-06-20 14:31:55.302	2026-06-22 17:06:55.08
58	super_admin	6	17	t	2026-06-20 14:31:55.316	2026-06-22 17:06:55.081
59	hr	6	17	t	2026-06-20 14:31:55.322	2026-06-22 17:06:55.082
60	admin	6	17	t	2026-06-20 14:31:55.33	2026-06-22 17:06:55.083
61	instructor	6	17	t	2026-06-20 14:31:55.334	2026-06-22 17:06:55.084
62	student	6	17	f	2026-06-20 14:31:55.338	2026-06-22 17:06:55.085
63	super_admin	6	18	t	2026-06-20 14:31:55.348	2026-06-22 17:06:55.087
64	hr	6	18	t	2026-06-20 14:31:55.355	2026-06-22 17:06:55.088
65	admin	6	18	t	2026-06-20 14:31:55.359	2026-06-22 17:06:55.089
66	instructor	6	18	t	2026-06-20 14:31:55.375	2026-06-22 17:06:55.09
67	student	6	18	f	2026-06-20 14:31:55.387	2026-06-22 17:06:55.091
68	super_admin	6	19	t	2026-06-20 14:31:55.401	2026-06-22 17:06:55.094
69	hr	6	19	f	2026-06-20 14:31:55.409	2026-06-22 17:06:55.095
70	admin	6	19	f	2026-06-20 14:31:55.414	2026-06-22 17:06:55.096
71	instructor	6	19	f	2026-06-20 14:31:55.418	2026-06-22 17:06:55.097
72	student	6	19	f	2026-06-20 14:31:55.422	2026-06-22 17:06:55.098
73	super_admin	7	20	t	2026-06-20 14:31:55.437	2026-06-22 17:06:55.102
74	hr	7	20	t	2026-06-20 14:31:55.443	2026-06-22 17:06:55.103
75	admin	7	20	t	2026-06-20 14:31:55.45	2026-06-22 17:06:55.104
76	instructor	7	20	t	2026-06-20 14:31:55.457	2026-06-22 17:06:55.104
77	student	7	20	t	2026-06-20 14:31:55.461	2026-06-22 17:06:55.106
78	super_admin	8	21	t	2026-06-20 14:31:55.474	2026-06-22 17:06:55.108
79	hr	8	21	t	2026-06-20 14:31:55.479	2026-06-22 17:06:55.109
80	admin	8	21	t	2026-06-20 14:31:55.482	2026-06-22 17:06:55.11
81	instructor	8	21	t	2026-06-20 14:31:55.485	2026-06-22 17:06:55.111
82	student	8	21	t	2026-06-20 14:31:55.487	2026-06-22 17:06:55.112
83	super_admin	9	22	t	2026-06-20 14:31:55.512	2026-06-22 17:06:55.117
84	hr	9	22	t	2026-06-20 14:31:55.519	2026-06-22 17:06:55.118
85	admin	9	22	t	2026-06-20 14:31:55.525	2026-06-22 17:06:55.119
86	instructor	9	22	t	2026-06-20 14:31:55.534	2026-06-22 17:06:55.12
87	student	9	22	t	2026-06-20 14:31:55.545	2026-06-22 17:06:55.12
88	super_admin	10	23	t	2026-06-20 14:31:55.564	2026-06-22 17:06:55.123
89	hr	10	23	t	2026-06-20 14:31:55.57	2026-06-22 17:06:55.124
90	admin	10	23	t	2026-06-20 14:31:55.575	2026-06-22 17:06:55.125
91	instructor	10	23	f	2026-06-20 14:31:55.579	2026-06-22 17:06:55.126
92	student	10	23	f	2026-06-20 14:31:55.585	2026-06-22 17:06:55.126
93	super_admin	10	24	t	2026-06-20 14:31:55.595	2026-06-22 17:06:55.129
94	hr	10	24	t	2026-06-20 14:31:55.6	2026-06-22 17:06:55.13
95	admin	10	24	t	2026-06-20 14:31:55.604	2026-06-22 17:06:55.131
96	instructor	10	24	f	2026-06-20 14:31:55.608	2026-06-22 17:06:55.132
97	student	10	24	f	2026-06-20 14:31:55.62	2026-06-22 17:06:55.133
98	super_admin	10	25	t	2026-06-20 14:31:55.629	2026-06-22 17:06:55.135
99	hr	10	25	t	2026-06-20 14:31:55.64	2026-06-22 17:06:55.136
100	admin	10	25	t	2026-06-20 14:31:55.65	2026-06-22 17:06:55.136
101	instructor	10	25	f	2026-06-20 14:31:55.656	2026-06-22 17:06:55.138
102	student	10	25	f	2026-06-20 14:31:55.668	2026-06-22 17:06:55.138
103	super_admin	10	26	t	2026-06-20 14:31:55.679	2026-06-22 17:06:55.146
104	hr	10	26	f	2026-06-20 14:31:55.682	2026-06-22 17:06:55.147
105	admin	10	26	f	2026-06-20 14:31:55.688	2026-06-22 17:06:55.148
106	instructor	10	26	f	2026-06-20 14:31:55.691	2026-06-22 17:06:55.149
107	student	10	26	f	2026-06-20 14:31:55.694	2026-06-22 17:06:55.15
108	super_admin	11	27	t	2026-06-20 14:31:55.704	2026-06-22 17:06:55.152
109	hr	11	27	t	2026-06-20 14:31:55.712	2026-06-22 17:06:55.153
110	admin	11	27	t	2026-06-20 14:31:55.72	2026-06-22 17:06:55.154
111	instructor	11	27	f	2026-06-20 14:31:55.723	2026-06-22 17:06:55.155
112	student	11	27	f	2026-06-20 14:31:55.729	2026-06-22 17:06:55.156
113	super_admin	11	28	t	2026-06-20 14:31:55.737	2026-06-22 17:06:55.158
114	hr	11	28	t	2026-06-20 14:31:55.741	2026-06-22 17:06:55.159
115	admin	11	28	t	2026-06-20 14:31:55.744	2026-06-22 17:06:55.159
230	admin	17	51	t	2026-06-20 14:31:56.404	2026-06-22 17:06:55.315
44	hr	5	14	t	2026-06-20 14:31:55.204	2026-06-22 17:06:55.06
45	admin	5	14	t	2026-06-20 14:31:55.209	2026-06-22 17:06:55.061
119	hr	11	29	t	2026-06-20 14:31:55.769	2026-06-22 17:06:55.164
120	admin	11	29	t	2026-06-20 14:31:55.772	2026-06-22 17:06:55.165
121	instructor	11	29	f	2026-06-20 14:31:55.775	2026-06-22 17:06:55.166
122	student	11	29	f	2026-06-20 14:31:55.778	2026-06-22 17:06:55.167
123	super_admin	11	30	t	2026-06-20 14:31:55.788	2026-06-22 17:06:55.168
124	hr	11	30	f	2026-06-20 14:31:55.79	2026-06-22 17:06:55.169
125	admin	11	30	f	2026-06-20 14:31:55.793	2026-06-22 17:06:55.17
126	instructor	11	30	f	2026-06-20 14:31:55.796	2026-06-22 17:06:55.171
127	student	11	30	f	2026-06-20 14:31:55.799	2026-06-22 17:06:55.174
128	super_admin	12	31	t	2026-06-20 14:31:55.809	2026-06-22 17:06:55.176
129	hr	12	31	t	2026-06-20 14:31:55.815	2026-06-22 17:06:55.177
130	admin	12	31	t	2026-06-20 14:31:55.824	2026-06-22 17:06:55.178
132	student	12	31	f	2026-06-20 14:31:55.852	2026-06-22 17:06:55.179
133	super_admin	12	32	t	2026-06-20 14:31:55.865	2026-06-22 17:06:55.181
134	hr	12	32	t	2026-06-20 14:31:55.868	2026-06-22 17:06:55.182
135	admin	12	32	t	2026-06-20 14:31:55.884	2026-06-22 17:06:55.183
136	instructor	12	32	f	2026-06-20 14:31:55.888	2026-06-22 17:06:55.184
137	student	12	32	f	2026-06-20 14:31:55.891	2026-06-22 17:06:55.185
138	super_admin	12	33	t	2026-06-20 14:31:55.93	2026-06-22 17:06:55.186
139	hr	12	33	t	2026-06-20 14:31:55.934	2026-06-22 17:06:55.187
140	admin	12	33	t	2026-06-20 14:31:55.949	2026-06-22 17:06:55.188
141	instructor	12	33	f	2026-06-20 14:31:55.953	2026-06-22 17:06:55.189
142	student	12	33	f	2026-06-20 14:31:55.967	2026-06-22 17:06:55.19
143	super_admin	12	34	t	2026-06-20 14:31:55.974	2026-06-22 17:06:55.192
144	hr	12	34	f	2026-06-20 14:31:55.978	2026-06-22 17:06:55.193
145	admin	12	34	f	2026-06-20 14:31:55.982	2026-06-22 17:06:55.194
146	instructor	12	34	f	2026-06-20 14:31:55.987	2026-06-22 17:06:55.195
147	student	12	34	f	2026-06-20 14:31:55.991	2026-06-22 17:06:55.195
149	hr	13	35	t	2026-06-20 14:31:56.002	2026-06-22 17:06:55.199
150	admin	13	35	f	2026-06-20 14:31:56.003	2026-06-22 17:06:55.199
151	instructor	13	35	f	2026-06-20 14:31:56.016	2026-06-22 17:06:55.2
152	student	13	35	f	2026-06-20 14:31:56.022	2026-06-22 17:06:55.201
153	super_admin	13	36	t	2026-06-20 14:31:56.031	2026-06-22 17:06:55.203
154	hr	13	36	f	2026-06-20 14:31:56.035	2026-06-22 17:06:55.204
155	admin	13	36	f	2026-06-20 14:31:56.039	2026-06-22 17:06:55.205
156	instructor	13	36	f	2026-06-20 14:31:56.041	2026-06-22 17:06:55.206
157	student	13	36	f	2026-06-20 14:31:56.044	2026-06-22 17:06:55.207
158	super_admin	13	37	t	2026-06-20 14:31:56.053	2026-06-22 17:06:55.209
159	hr	13	37	f	2026-06-20 14:31:56.056	2026-06-22 17:06:55.212
160	admin	13	37	f	2026-06-20 14:31:56.064	2026-06-22 17:06:55.212
161	instructor	13	37	f	2026-06-20 14:31:56.068	2026-06-22 17:06:55.213
162	student	13	37	f	2026-06-20 14:31:56.071	2026-06-22 17:06:55.214
163	super_admin	13	38	t	2026-06-20 14:31:56.079	2026-06-22 17:06:55.216
164	hr	13	38	f	2026-06-20 14:31:56.082	2026-06-22 17:06:55.217
165	admin	13	38	f	2026-06-20 14:31:56.087	2026-06-22 17:06:55.218
166	instructor	13	38	f	2026-06-20 14:31:56.089	2026-06-22 17:06:55.219
167	student	13	38	f	2026-06-20 14:31:56.092	2026-06-22 17:06:55.219
169	hr	14	39	t	2026-06-20 14:31:56.106	2026-06-22 17:06:55.223
170	admin	14	39	t	2026-06-20 14:31:56.108	2026-06-22 17:06:55.223
171	instructor	14	39	f	2026-06-20 14:31:56.111	2026-06-22 17:06:55.224
172	student	14	39	f	2026-06-20 14:31:56.115	2026-06-22 17:06:55.225
173	super_admin	14	40	t	2026-06-20 14:31:56.122	2026-06-22 17:06:55.227
174	hr	14	40	t	2026-06-20 14:31:56.126	2026-06-22 17:06:55.227
175	admin	14	40	t	2026-06-20 14:31:56.129	2026-06-22 17:06:55.228
176	instructor	14	40	f	2026-06-20 14:31:56.132	2026-06-22 17:06:55.23
177	student	14	40	f	2026-06-20 14:31:56.135	2026-06-22 17:06:55.231
178	super_admin	14	41	t	2026-06-20 14:31:56.141	2026-06-22 17:06:55.234
179	hr	14	41	t	2026-06-20 14:31:56.143	2026-06-22 17:06:55.235
180	admin	14	41	t	2026-06-20 14:31:56.145	2026-06-22 17:06:55.236
181	instructor	14	41	f	2026-06-20 14:31:56.148	2026-06-22 17:06:55.239
182	student	14	41	f	2026-06-20 14:31:56.15	2026-06-22 17:06:55.24
183	super_admin	14	42	t	2026-06-20 14:31:56.161	2026-06-22 17:06:55.241
184	hr	14	42	f	2026-06-20 14:31:56.164	2026-06-22 17:06:55.242
185	admin	14	42	f	2026-06-20 14:31:56.167	2026-06-22 17:06:55.243
187	student	14	42	f	2026-06-20 14:31:56.191	2026-06-22 17:06:55.245
188	super_admin	15	43	t	2026-06-20 14:31:56.2	2026-06-22 17:06:55.247
189	hr	15	43	t	2026-06-20 14:31:56.204	2026-06-22 17:06:55.248
190	admin	15	43	t	2026-06-20 14:31:56.207	2026-06-22 17:06:55.251
191	instructor	15	43	f	2026-06-20 14:31:56.21	2026-06-22 17:06:55.252
192	student	15	43	f	2026-06-20 14:31:56.213	2026-06-22 17:06:55.253
193	super_admin	15	44	t	2026-06-20 14:31:56.222	2026-06-22 17:06:55.254
194	hr	15	44	t	2026-06-20 14:31:56.226	2026-06-22 17:06:55.255
195	admin	15	44	t	2026-06-20 14:31:56.229	2026-06-22 17:06:55.256
196	instructor	15	44	f	2026-06-20 14:31:56.231	2026-06-22 17:06:55.257
197	student	15	44	f	2026-06-20 14:31:56.239	2026-06-22 17:06:55.257
198	super_admin	15	45	t	2026-06-20 14:31:56.255	2026-06-22 17:06:55.259
199	hr	15	45	t	2026-06-20 14:31:56.259	2026-06-22 17:06:55.26
200	admin	15	45	t	2026-06-20 14:31:56.262	2026-06-22 17:06:55.261
201	instructor	15	45	f	2026-06-20 14:31:56.267	2026-06-22 17:06:55.262
202	student	15	45	f	2026-06-20 14:31:56.27	2026-06-22 17:06:55.263
203	super_admin	15	46	t	2026-06-20 14:31:56.278	2026-06-22 17:06:55.267
204	hr	15	46	f	2026-06-20 14:31:56.281	2026-06-22 17:06:55.268
205	admin	15	46	f	2026-06-20 14:31:56.283	2026-06-22 17:06:55.269
207	student	15	46	f	2026-06-20 14:31:56.29	2026-06-22 17:06:55.271
208	super_admin	16	47	t	2026-06-20 14:31:56.301	2026-06-22 17:06:55.275
209	hr	16	47	t	2026-06-20 14:31:56.304	2026-06-22 17:06:55.276
210	admin	16	47	t	2026-06-20 14:31:56.308	2026-06-22 17:06:55.277
211	instructor	16	47	t	2026-06-20 14:31:56.31	2026-06-22 17:06:55.278
212	student	16	47	f	2026-06-20 14:31:56.314	2026-06-22 17:06:55.279
213	super_admin	16	48	t	2026-06-20 14:31:56.32	2026-06-22 17:06:55.283
214	hr	16	48	t	2026-06-20 14:31:56.322	2026-06-22 17:06:55.285
215	admin	16	48	t	2026-06-20 14:31:56.325	2026-06-22 17:06:55.286
216	instructor	16	48	t	2026-06-20 14:31:56.328	2026-06-22 17:06:55.288
217	student	16	48	f	2026-06-20 14:31:56.331	2026-06-22 17:06:55.291
218	super_admin	16	49	t	2026-06-20 14:31:56.34	2026-06-22 17:06:55.293
219	hr	16	49	t	2026-06-20 14:31:56.345	2026-06-22 17:06:55.294
220	admin	16	49	t	2026-06-20 14:31:56.349	2026-06-22 17:06:55.295
221	instructor	16	49	t	2026-06-20 14:31:56.353	2026-06-22 17:06:55.296
222	student	16	49	f	2026-06-20 14:31:56.356	2026-06-22 17:06:55.297
223	super_admin	16	50	t	2026-06-20 14:31:56.362	2026-06-22 17:06:55.303
224	hr	16	50	f	2026-06-20 14:31:56.365	2026-06-22 17:06:55.306
225	admin	16	50	f	2026-06-20 14:31:56.368	2026-06-22 17:06:55.309
227	student	16	50	f	2026-06-20 14:31:56.387	2026-06-22 17:06:55.311
228	super_admin	17	51	t	2026-06-20 14:31:56.397	2026-06-22 17:06:55.313
229	hr	17	51	t	2026-06-20 14:31:56.4	2026-06-22 17:06:55.314
117	student	11	28	f	2026-06-20 14:31:55.757	2026-06-22 17:06:55.161
118	super_admin	11	29	t	2026-06-20 14:31:55.765	2026-06-22 17:06:55.163
234	hr	17	52	t	2026-06-20 14:31:56.42	2026-06-22 17:06:55.323
235	admin	17	52	t	2026-06-20 14:31:56.422	2026-06-22 17:06:55.324
236	instructor	17	52	f	2026-06-20 14:31:56.424	2026-06-22 17:06:55.325
237	student	17	52	f	2026-06-20 14:31:56.427	2026-06-22 17:06:55.326
238	super_admin	17	53	t	2026-06-20 14:31:56.432	2026-06-22 17:06:55.328
239	hr	17	53	t	2026-06-20 14:31:56.435	2026-06-22 17:06:55.329
240	admin	17	53	t	2026-06-20 14:31:56.437	2026-06-22 17:06:55.33
241	instructor	17	53	f	2026-06-20 14:31:56.44	2026-06-22 17:06:55.33
242	student	17	53	f	2026-06-20 14:31:56.443	2026-06-22 17:06:55.331
243	super_admin	17	54	t	2026-06-20 14:31:56.451	2026-06-22 17:06:55.333
244	hr	17	54	f	2026-06-20 14:31:56.455	2026-06-22 17:06:55.334
245	admin	17	54	f	2026-06-20 14:31:56.459	2026-06-22 17:06:55.335
247	student	17	54	f	2026-06-20 14:31:56.467	2026-06-22 17:06:55.337
248	super_admin	18	55	t	2026-06-20 14:31:56.477	2026-06-22 17:06:55.341
249	hr	18	55	t	2026-06-20 14:31:56.48	2026-06-22 17:06:55.342
250	admin	18	55	t	2026-06-20 14:31:56.483	2026-06-22 17:06:55.35
251	instructor	18	55	f	2026-06-20 14:31:56.487	2026-06-22 17:06:55.351
252	student	18	55	f	2026-06-20 14:31:56.489	2026-06-22 17:06:55.352
253	super_admin	19	56	t	2026-06-20 14:31:56.501	2026-06-22 17:06:55.354
254	hr	19	56	t	2026-06-20 14:31:56.504	2026-06-22 17:06:55.355
255	admin	19	56	t	2026-06-20 14:31:56.508	2026-06-22 17:06:55.356
256	instructor	19	56	f	2026-06-20 14:31:56.511	2026-06-22 17:06:55.357
257	student	19	56	f	2026-06-20 14:31:56.513	2026-06-22 17:06:55.358
258	super_admin	19	57	t	2026-06-20 14:31:56.521	2026-06-22 17:06:55.36
259	hr	19	57	f	2026-06-20 14:31:56.525	2026-06-22 17:06:55.361
260	admin	19	57	f	2026-06-20 14:31:56.527	2026-06-22 17:06:55.362
261	instructor	19	57	f	2026-06-20 14:31:56.529	2026-06-22 17:06:55.363
262	student	19	57	f	2026-06-20 14:31:56.531	2026-06-22 17:06:55.365
264	hr	19	58	f	2026-06-20 14:31:56.54	2026-06-22 17:06:55.371
265	admin	19	58	f	2026-06-20 14:31:56.542	2026-06-22 17:06:55.372
266	instructor	19	58	f	2026-06-20 14:31:56.545	2026-06-22 17:06:55.372
267	student	19	58	f	2026-06-20 14:31:56.547	2026-06-22 17:06:55.373
268	super_admin	19	59	t	2026-06-20 14:31:56.552	2026-06-22 17:06:55.375
269	hr	19	59	f	2026-06-20 14:31:56.563	2026-06-22 17:06:55.377
270	admin	19	59	f	2026-06-20 14:31:56.567	2026-06-22 17:06:55.378
271	instructor	19	59	f	2026-06-20 14:31:56.57	2026-06-22 17:06:55.379
272	student	19	59	f	2026-06-20 14:31:56.572	2026-06-22 17:06:55.379
273	super_admin	20	60	t	2026-06-20 14:31:56.579	2026-06-22 17:06:55.382
274	hr	20	60	t	2026-06-20 14:31:56.581	2026-06-22 17:06:55.383
275	admin	20	60	t	2026-06-20 14:31:56.583	2026-06-22 17:06:55.384
276	instructor	20	60	f	2026-06-20 14:31:56.585	2026-06-22 17:06:55.385
277	student	20	60	f	2026-06-20 14:31:56.589	2026-06-22 17:06:55.386
278	super_admin	20	61	t	2026-06-20 14:31:56.593	2026-06-22 17:06:55.388
279	hr	20	61	f	2026-06-20 14:31:56.595	2026-06-22 17:06:55.389
280	admin	20	61	f	2026-06-20 14:31:56.596	2026-06-22 17:06:55.39
281	instructor	20	61	f	2026-06-20 14:31:56.598	2026-06-22 17:06:55.392
282	student	20	61	f	2026-06-20 14:31:56.601	2026-06-22 17:06:55.393
284	hr	20	62	f	2026-06-20 14:31:56.608	2026-06-22 17:06:55.395
285	admin	20	62	f	2026-06-20 14:31:56.609	2026-06-22 17:06:55.396
286	instructor	20	62	f	2026-06-20 14:31:56.611	2026-06-22 17:06:55.397
287	student	20	62	f	2026-06-20 14:31:56.613	2026-06-22 17:06:55.398
288	super_admin	20	63	t	2026-06-20 14:31:56.618	2026-06-22 17:06:55.4
289	hr	20	63	f	2026-06-20 14:31:56.62	2026-06-22 17:06:55.401
290	admin	20	63	f	2026-06-20 14:31:56.622	2026-06-22 17:06:55.402
291	instructor	20	63	f	2026-06-20 14:31:56.623	2026-06-22 17:06:55.403
292	student	20	63	f	2026-06-20 14:31:56.624	2026-06-22 17:06:55.404
293	super_admin	21	64	t	2026-06-20 14:31:56.63	2026-06-22 17:06:55.407
294	hr	21	64	t	2026-06-20 14:31:56.632	2026-06-22 17:06:55.409
295	admin	21	64	t	2026-06-20 14:31:56.635	2026-06-22 17:06:55.41
296	instructor	21	64	f	2026-06-20 14:31:56.637	2026-06-22 17:06:55.411
297	student	21	64	f	2026-06-20 14:31:56.638	2026-06-22 17:06:55.411
298	super_admin	21	65	t	2026-06-20 14:31:56.641	2026-06-22 17:06:55.414
299	hr	21	65	f	2026-06-20 14:31:56.643	2026-06-22 17:06:55.414
300	admin	21	65	f	2026-06-20 14:31:56.645	2026-06-22 17:06:55.415
302	student	21	65	f	2026-06-20 14:31:56.647	2026-06-22 17:06:55.417
303	super_admin	21	66	t	2026-06-20 14:31:56.652	2026-06-22 17:06:55.419
304	hr	21	66	f	2026-06-20 14:31:56.654	2026-06-22 17:06:55.421
305	admin	21	66	f	2026-06-20 14:31:56.655	2026-06-22 17:06:55.423
306	instructor	21	66	f	2026-06-20 14:31:56.656	2026-06-22 17:06:55.425
307	student	21	66	f	2026-06-20 14:31:56.658	2026-06-22 17:06:55.426
308	super_admin	21	67	t	2026-06-20 14:31:56.661	2026-06-22 17:06:55.428
309	hr	21	67	f	2026-06-20 14:31:56.662	2026-06-22 17:06:55.429
310	admin	21	67	f	2026-06-20 14:31:56.663	2026-06-22 17:06:55.43
311	instructor	21	67	f	2026-06-20 14:31:56.665	2026-06-22 17:06:55.431
312	student	21	67	f	2026-06-20 14:31:56.666	2026-06-22 17:06:55.431
313	super_admin	22	68	t	2026-06-20 14:31:56.671	2026-06-22 17:06:55.435
314	hr	22	68	t	2026-06-20 14:31:56.672	2026-06-22 17:06:55.436
315	admin	22	68	t	2026-06-20 14:31:56.673	2026-06-22 17:06:55.437
316	instructor	22	68	f	2026-06-20 14:31:56.674	2026-06-22 17:06:55.438
317	student	22	68	f	2026-06-20 14:31:56.675	2026-06-22 17:06:55.439
318	super_admin	22	69	t	2026-06-20 14:31:56.679	2026-06-22 17:06:55.441
319	hr	22	69	f	2026-06-20 14:31:56.683	2026-06-22 17:06:55.442
320	admin	22	69	f	2026-06-20 14:31:56.684	2026-06-22 17:06:55.444
322	student	22	69	f	2026-06-20 14:31:56.686	2026-06-22 17:06:55.445
323	super_admin	22	70	t	2026-06-20 14:31:56.688	2026-06-22 17:06:55.447
324	hr	22	70	f	2026-06-20 14:31:56.689	2026-06-22 17:06:55.448
325	admin	22	70	f	2026-06-20 14:31:56.69	2026-06-22 17:06:55.449
326	instructor	22	70	f	2026-06-20 14:31:56.692	2026-06-22 17:06:55.45
327	student	22	70	f	2026-06-20 14:31:56.693	2026-06-22 17:06:55.451
328	super_admin	22	71	t	2026-06-20 14:31:56.695	2026-06-22 17:06:55.452
329	hr	22	71	f	2026-06-20 14:31:56.696	2026-06-22 17:06:55.453
330	admin	22	71	f	2026-06-20 14:31:56.697	2026-06-22 17:06:55.454
331	instructor	22	71	f	2026-06-20 14:31:56.698	2026-06-22 17:06:55.455
332	student	22	71	f	2026-06-20 14:31:56.699	2026-06-22 17:06:55.455
333	super_admin	23	72	t	2026-06-20 14:31:56.702	2026-06-22 17:06:55.46
334	hr	23	72	t	2026-06-20 14:31:56.702	2026-06-22 17:06:55.46
335	admin	23	72	t	2026-06-20 14:31:56.704	2026-06-22 17:06:55.461
336	instructor	23	72	f	2026-06-20 14:31:56.705	2026-06-22 17:06:55.462
337	student	23	72	f	2026-06-20 14:31:56.706	2026-06-22 17:06:55.463
338	super_admin	23	73	t	2026-06-20 14:31:56.708	2026-06-22 17:06:55.465
339	hr	23	73	f	2026-06-20 14:31:56.709	2026-06-22 17:06:55.466
340	admin	23	73	f	2026-06-20 14:31:56.71	2026-06-22 17:06:55.468
342	student	23	73	f	2026-06-20 14:31:56.711	2026-06-22 17:06:55.472
343	super_admin	23	74	t	2026-06-20 14:31:56.715	2026-06-22 17:06:55.474
344	hr	23	74	f	2026-06-20 14:31:56.716	2026-06-22 17:06:55.475
232	student	17	51	f	2026-06-20 14:31:56.41	2026-06-22 17:06:55.317
233	super_admin	17	52	t	2026-06-20 14:31:56.416	2026-06-22 17:06:55.322
348	super_admin	23	75	t	2026-06-20 14:31:56.723	2026-06-22 17:06:55.481
349	hr	23	75	f	2026-06-20 14:31:56.724	2026-06-22 17:06:55.482
350	admin	23	75	f	2026-06-20 14:31:56.725	2026-06-22 17:06:55.483
351	instructor	23	75	f	2026-06-20 14:31:56.726	2026-06-22 17:06:55.484
352	student	23	75	f	2026-06-20 14:31:56.727	2026-06-22 17:06:55.485
353	super_admin	24	76	t	2026-06-20 14:31:56.731	2026-06-22 17:06:55.487
354	hr	24	76	t	2026-06-20 14:31:56.732	2026-06-22 17:06:55.488
355	admin	24	76	t	2026-06-20 14:31:56.733	2026-06-22 17:06:55.489
357	student	24	76	f	2026-06-20 14:31:56.736	2026-06-22 17:06:55.491
358	super_admin	24	77	t	2026-06-20 14:31:56.738	2026-06-22 17:06:55.493
359	hr	24	77	f	2026-06-20 14:31:56.739	2026-06-22 17:06:55.494
360	admin	24	77	f	2026-06-20 14:31:56.74	2026-06-22 17:06:55.495
361	instructor	24	77	f	2026-06-20 14:31:56.741	2026-06-22 17:06:55.496
362	student	24	77	f	2026-06-20 14:31:56.743	2026-06-22 17:06:55.497
363	super_admin	24	78	t	2026-06-20 14:31:56.746	2026-06-22 17:06:55.498
364	hr	24	78	f	2026-06-20 14:31:56.747	2026-06-22 17:06:55.499
365	admin	24	78	f	2026-06-20 14:31:56.748	2026-06-22 17:06:55.5
366	instructor	24	78	f	2026-06-20 14:31:56.749	2026-06-22 17:06:55.502
367	student	24	78	f	2026-06-20 14:31:56.754	2026-06-22 17:06:55.503
368	super_admin	24	79	t	2026-06-20 14:31:56.757	2026-06-22 17:06:55.509
369	hr	24	79	f	2026-06-20 14:31:56.759	2026-06-22 17:06:55.509
370	admin	24	79	f	2026-06-20 14:31:56.76	2026-06-22 17:06:55.51
371	instructor	24	79	f	2026-06-20 14:31:56.761	2026-06-22 17:06:55.511
372	student	24	79	f	2026-06-20 14:31:56.762	2026-06-22 17:06:55.512
373	super_admin	25	80	t	2026-06-20 14:31:56.767	2026-06-22 17:06:55.515
374	hr	25	80	t	2026-06-20 14:31:56.768	2026-06-22 17:06:55.516
375	admin	25	80	t	2026-06-20 14:31:56.769	2026-06-22 17:06:55.518
377	student	25	80	f	2026-06-20 14:31:56.774	2026-06-22 17:06:55.52
378	super_admin	25	81	t	2026-06-20 14:31:56.782	2026-06-22 17:06:55.522
379	hr	25	81	f	2026-06-20 14:31:56.783	2026-06-22 17:06:55.523
380	admin	25	81	f	2026-06-20 14:31:56.785	2026-06-22 17:06:55.523
381	instructor	25	81	f	2026-06-20 14:31:56.786	2026-06-22 17:06:55.525
382	student	25	81	f	2026-06-20 14:31:56.787	2026-06-22 17:06:55.525
383	super_admin	25	82	t	2026-06-20 14:31:56.792	2026-06-22 17:06:55.527
384	hr	25	82	f	2026-06-20 14:31:56.793	2026-06-22 17:06:55.528
385	admin	25	82	f	2026-06-20 14:31:56.796	2026-06-22 17:06:55.529
386	instructor	25	82	f	2026-06-20 14:31:56.797	2026-06-22 17:06:55.532
387	student	25	82	f	2026-06-20 14:31:56.798	2026-06-22 17:06:55.533
388	super_admin	25	83	t	2026-06-20 14:31:56.802	2026-06-22 17:06:55.536
389	hr	25	83	f	2026-06-20 14:31:56.802	2026-06-22 17:06:55.537
390	admin	25	83	f	2026-06-20 14:31:56.803	2026-06-22 17:06:55.538
391	instructor	25	83	f	2026-06-20 14:31:56.804	2026-06-22 17:06:55.539
392	student	25	83	f	2026-06-20 14:31:56.806	2026-06-22 17:06:55.54
393	super_admin	26	84	t	2026-06-20 14:31:56.809	2026-06-22 17:06:55.543
394	hr	26	84	t	2026-06-20 14:31:56.809	2026-06-22 17:06:55.544
395	admin	26	84	t	2026-06-20 14:31:56.811	2026-06-22 17:06:55.545
397	student	26	84	f	2026-06-20 14:31:56.814	2026-06-22 17:06:55.547
398	super_admin	26	85	t	2026-06-20 14:31:56.816	2026-06-22 17:06:55.549
399	hr	26	85	f	2026-06-20 14:31:56.818	2026-06-22 17:06:55.55
400	admin	26	85	f	2026-06-20 14:31:56.82	2026-06-22 17:06:55.551
401	instructor	26	85	f	2026-06-20 14:31:56.824	2026-06-22 17:06:55.552
402	student	26	85	f	2026-06-20 14:31:56.825	2026-06-22 17:06:55.553
403	super_admin	26	86	t	2026-06-20 14:31:56.831	2026-06-22 17:06:55.555
404	hr	26	86	f	2026-06-20 14:31:56.832	2026-06-22 17:06:55.556
405	admin	26	86	f	2026-06-20 14:31:56.834	2026-06-22 17:06:55.557
406	instructor	26	86	f	2026-06-20 14:31:56.835	2026-06-22 17:06:55.558
407	student	26	86	f	2026-06-20 14:31:56.836	2026-06-22 17:06:55.559
408	super_admin	26	87	t	2026-06-20 14:31:56.839	2026-06-22 17:06:55.56
409	hr	26	87	f	2026-06-20 14:31:56.84	2026-06-22 17:06:55.561
410	admin	26	87	f	2026-06-20 14:31:56.842	2026-06-22 17:06:55.562
411	instructor	26	87	f	2026-06-20 14:31:56.843	2026-06-22 17:06:55.563
412	student	26	87	f	2026-06-20 14:31:56.844	2026-06-22 17:06:55.564
414	hr	27	88	t	2026-06-20 14:31:56.848	2026-06-22 17:06:55.568
415	admin	27	88	t	2026-06-20 14:31:56.849	2026-06-22 17:06:55.569
416	instructor	27	88	f	2026-06-20 14:31:56.851	2026-06-22 17:06:55.57
417	student	27	88	f	2026-06-20 14:31:56.854	2026-06-22 17:06:55.57
418	super_admin	27	89	t	2026-06-20 14:31:56.856	2026-06-22 17:06:55.572
419	hr	27	89	f	2026-06-20 14:31:56.857	2026-06-22 17:06:55.573
420	admin	27	89	f	2026-06-20 14:31:56.858	2026-06-22 17:06:55.574
421	instructor	27	89	f	2026-06-20 14:31:56.859	2026-06-22 17:06:55.575
422	student	27	89	f	2026-06-20 14:31:56.86	2026-06-22 17:06:55.576
423	super_admin	27	90	t	2026-06-20 14:31:56.867	2026-06-22 17:06:55.578
424	hr	27	90	f	2026-06-20 14:31:56.868	2026-06-22 17:06:55.579
425	admin	27	90	f	2026-06-20 14:31:56.869	2026-06-22 17:06:55.58
426	instructor	27	90	f	2026-06-20 14:31:56.87	2026-06-22 17:06:55.582
427	student	27	90	f	2026-06-20 14:31:56.871	2026-06-22 17:06:55.585
428	super_admin	27	91	t	2026-06-20 14:31:56.874	2026-06-22 17:06:55.587
429	hr	27	91	f	2026-06-20 14:31:56.875	2026-06-22 17:06:55.588
430	admin	27	91	f	2026-06-20 14:31:56.876	2026-06-22 17:06:55.589
431	instructor	27	91	f	2026-06-20 14:31:56.877	2026-06-22 17:06:55.59
432	student	27	91	f	2026-06-20 14:31:56.879	2026-06-22 17:06:55.592
434	hr	28	92	t	2026-06-20 14:31:56.884	2026-06-22 17:06:55.596
435	admin	28	92	t	2026-06-20 14:31:56.885	2026-06-22 17:06:55.597
436	instructor	28	92	f	2026-06-20 14:31:56.887	2026-06-22 17:06:55.598
437	student	28	92	f	2026-06-20 14:31:56.889	2026-06-22 17:06:55.599
438	super_admin	28	93	t	2026-06-20 14:31:56.893	2026-06-22 17:06:55.601
439	hr	28	93	f	2026-06-20 14:31:56.894	2026-06-22 17:06:55.605
440	admin	28	93	f	2026-06-20 14:31:56.895	2026-06-22 17:06:55.606
441	instructor	28	93	f	2026-06-20 14:31:56.903	2026-06-22 17:06:55.607
442	student	28	93	f	2026-06-20 14:31:56.904	2026-06-22 17:06:55.608
443	super_admin	28	94	t	2026-06-20 14:31:56.909	2026-06-22 17:06:55.61
444	hr	28	94	f	2026-06-20 14:31:56.91	2026-06-22 17:06:55.611
445	admin	28	94	f	2026-06-20 14:31:56.911	2026-06-22 17:06:55.612
446	instructor	28	94	f	2026-06-20 14:31:56.913	2026-06-22 17:06:55.613
447	student	28	94	f	2026-06-20 14:31:56.914	2026-06-22 17:06:55.614
448	super_admin	28	95	t	2026-06-20 14:31:56.918	2026-06-22 17:06:55.616
449	hr	28	95	f	2026-06-20 14:31:56.919	2026-06-22 17:06:55.617
450	admin	28	95	f	2026-06-20 14:31:56.92	2026-06-22 17:06:55.617
452	student	28	95	f	2026-06-20 14:31:56.924	2026-06-22 17:06:55.62
453	super_admin	29	96	t	2026-06-20 14:31:56.935	2026-06-22 17:06:55.622
454	hr	29	96	t	2026-06-20 14:31:56.937	2026-06-22 17:06:55.623
455	admin	29	96	t	2026-06-20 14:31:56.942	2026-06-22 17:06:55.625
456	instructor	29	96	f	2026-06-20 14:31:56.943	2026-06-22 17:06:55.626
457	student	29	96	f	2026-06-20 14:31:56.945	2026-06-22 17:06:55.627
458	super_admin	29	97	t	2026-06-20 14:31:56.947	2026-06-22 17:06:55.629
346	instructor	23	74	f	2026-06-20 14:31:56.718	2026-06-22 17:06:55.479
347	student	23	74	f	2026-06-20 14:31:56.72	2026-06-22 17:06:55.48
462	student	29	97	f	2026-06-20 14:31:56.954	2026-06-22 17:06:55.636
463	super_admin	29	98	t	2026-06-20 14:31:56.957	2026-06-22 17:06:55.638
464	hr	29	98	f	2026-06-20 14:31:56.959	2026-06-22 17:06:55.638
465	admin	29	98	f	2026-06-20 14:31:56.96	2026-06-22 17:06:55.639
466	instructor	29	98	f	2026-06-20 14:31:56.961	2026-06-22 17:06:55.64
467	student	29	98	f	2026-06-20 14:31:56.962	2026-06-22 17:06:55.641
468	super_admin	29	99	t	2026-06-20 14:31:56.965	2026-06-22 17:06:55.643
469	hr	29	99	f	2026-06-20 14:31:56.966	2026-06-22 17:06:55.644
470	admin	29	99	f	2026-06-20 14:31:56.968	2026-06-22 17:06:55.645
471	instructor	29	99	f	2026-06-20 14:31:56.97	2026-06-22 17:06:55.647
472	student	29	99	f	2026-06-20 14:31:56.973	2026-06-22 17:06:55.648
474	hr	30	100	t	2026-06-20 14:31:56.984	2026-06-22 17:06:55.653
475	admin	30	100	t	2026-06-20 14:31:56.986	2026-06-22 17:06:55.654
476	instructor	30	100	f	2026-06-20 14:31:56.987	2026-06-22 17:06:55.654
477	student	30	100	f	2026-06-20 14:31:56.993	2026-06-22 17:06:55.655
478	super_admin	30	101	t	2026-06-20 14:31:56.996	2026-06-22 17:06:55.657
479	hr	30	101	f	2026-06-20 14:31:57	2026-06-22 17:06:55.658
480	admin	30	101	f	2026-06-20 14:31:57.005	2026-06-22 17:06:55.659
481	instructor	30	101	f	2026-06-20 14:31:57.006	2026-06-22 17:06:55.66
482	student	30	101	f	2026-06-20 14:31:57.007	2026-06-22 17:06:55.661
483	super_admin	30	102	t	2026-06-20 14:31:57.009	2026-06-22 17:06:55.663
484	hr	30	102	f	2026-06-20 14:31:57.011	2026-06-22 17:06:55.664
485	admin	30	102	f	2026-06-20 14:31:57.012	2026-06-22 17:06:55.665
486	instructor	30	102	f	2026-06-20 14:31:57.013	2026-06-22 17:06:55.666
487	student	30	102	f	2026-06-20 14:31:57.014	2026-06-22 17:06:55.667
488	super_admin	30	103	t	2026-06-20 14:31:57.016	2026-06-22 17:06:55.669
489	hr	30	103	f	2026-06-20 14:31:57.018	2026-06-22 17:06:55.67
490	admin	30	103	f	2026-06-20 14:31:57.02	2026-06-22 17:06:55.671
492	student	30	103	f	2026-06-20 14:31:57.023	2026-06-22 17:06:55.673
493	super_admin	31	104	t	2026-06-20 14:31:57.031	2026-06-22 17:06:55.676
494	hr	31	104	t	2026-06-20 14:31:57.034	2026-06-22 17:06:55.679
495	admin	31	104	t	2026-06-20 14:31:57.038	2026-06-22 17:06:55.68
496	instructor	31	104	t	2026-06-20 14:31:57.044	2026-06-22 17:06:55.681
497	student	31	104	t	2026-06-20 14:31:57.045	2026-06-22 17:06:55.682
498	super_admin	242	105	t	2026-06-20 14:58:25.751	2026-06-22 17:06:54.355
499	hr	242	105	t	2026-06-20 14:58:25.756	2026-06-22 17:06:54.361
500	admin	242	105	t	2026-06-20 14:58:25.759	2026-06-22 17:06:54.364
501	instructor	242	105	t	2026-06-20 14:58:25.762	2026-06-22 17:06:54.368
502	student	242	105	t	2026-06-20 14:58:25.764	2026-06-22 17:06:54.37
503	super_admin	243	106	t	2026-06-20 14:58:25.773	2026-06-22 17:06:54.381
504	hr	243	106	t	2026-06-20 14:58:25.777	2026-06-22 17:06:54.383
505	admin	243	106	t	2026-06-20 14:58:25.781	2026-06-22 17:06:54.385
506	instructor	243	106	t	2026-06-20 14:58:25.788	2026-06-22 17:06:54.386
507	student	243	106	f	2026-06-20 14:58:25.79	2026-06-22 17:06:54.388
508	super_admin	244	107	t	2026-06-20 14:58:25.796	2026-06-22 17:06:54.393
509	hr	244	107	t	2026-06-20 14:58:25.802	2026-06-22 17:06:54.395
510	admin	244	107	t	2026-06-20 14:58:25.804	2026-06-22 17:06:54.398
512	student	244	107	f	2026-06-20 14:58:25.809	2026-06-22 17:06:54.402
513	super_admin	244	108	t	2026-06-20 14:58:25.817	2026-06-22 17:06:54.406
514	hr	244	108	t	2026-06-20 14:58:25.821	2026-06-22 17:06:54.407
515	admin	244	108	t	2026-06-20 14:58:25.823	2026-06-22 17:06:54.409
516	instructor	244	108	f	2026-06-20 14:58:25.825	2026-06-22 17:06:54.411
517	student	244	108	f	2026-06-20 14:58:25.828	2026-06-22 17:06:54.413
518	super_admin	244	109	t	2026-06-20 14:58:25.832	2026-06-22 17:06:54.418
519	hr	244	109	t	2026-06-20 14:58:25.834	2026-06-22 17:06:54.419
520	admin	244	109	t	2026-06-20 14:58:25.838	2026-06-22 17:06:54.421
521	instructor	244	109	f	2026-06-20 14:58:25.84	2026-06-22 17:06:54.423
522	student	244	109	f	2026-06-20 14:58:25.842	2026-06-22 17:06:54.425
523	super_admin	244	110	t	2026-06-20 14:58:25.847	2026-06-22 17:06:54.429
524	hr	244	110	f	2026-06-20 14:58:25.85	2026-06-22 17:06:54.431
525	admin	244	110	f	2026-06-20 14:58:25.853	2026-06-22 17:06:54.433
526	instructor	244	110	f	2026-06-20 14:58:25.855	2026-06-22 17:06:54.435
527	student	244	110	f	2026-06-20 14:58:25.857	2026-06-22 17:06:54.437
528	super_admin	245	111	t	2026-06-20 14:58:25.865	2026-06-22 17:06:54.442
529	hr	245	111	t	2026-06-20 14:58:25.867	2026-06-22 17:06:54.444
530	admin	245	111	t	2026-06-20 14:58:25.892	2026-06-22 17:06:54.445
532	student	245	111	t	2026-06-20 14:58:25.9	2026-06-22 17:06:54.454
533	super_admin	246	112	t	2026-06-20 14:58:25.91	2026-06-22 17:06:54.459
534	hr	246	112	t	2026-06-20 14:58:25.912	2026-06-22 17:06:54.46
535	admin	246	112	t	2026-06-20 14:58:25.915	2026-06-22 17:06:54.464
536	instructor	246	112	t	2026-06-20 14:58:25.918	2026-06-22 17:06:54.466
537	student	246	112	t	2026-06-20 14:58:25.923	2026-06-22 17:06:54.468
538	super_admin	246	113	t	2026-06-20 14:58:25.927	2026-06-22 17:06:54.471
539	hr	246	113	t	2026-06-20 14:58:25.93	2026-06-22 17:06:54.472
540	admin	246	113	t	2026-06-20 14:58:25.933	2026-06-22 17:06:54.474
541	instructor	246	113	t	2026-06-20 14:58:25.934	2026-06-22 17:06:54.475
542	student	246	113	f	2026-06-20 14:58:25.936	2026-06-22 17:06:54.477
543	super_admin	247	114	t	2026-06-20 14:58:25.946	2026-06-22 17:06:54.481
544	hr	247	114	t	2026-06-20 14:58:25.947	2026-06-22 17:06:54.485
545	admin	247	114	t	2026-06-20 14:58:25.95	2026-06-22 17:06:54.486
546	instructor	247	114	t	2026-06-20 14:58:25.953	2026-06-22 17:06:54.488
547	student	247	114	t	2026-06-20 14:58:25.955	2026-06-22 17:06:54.489
549	hr	247	115	t	2026-06-20 14:58:25.962	2026-06-22 17:06:54.497
550	admin	247	115	t	2026-06-20 14:58:25.965	2026-06-22 17:06:54.499
551	instructor	247	115	t	2026-06-20 14:58:25.967	2026-06-22 17:06:54.501
552	student	247	115	f	2026-06-20 14:58:25.97	2026-06-22 17:06:54.504
553	super_admin	247	116	t	2026-06-20 14:58:25.977	2026-06-22 17:06:54.507
554	hr	247	116	t	2026-06-20 14:58:25.979	2026-06-22 17:06:54.508
555	admin	247	116	t	2026-06-20 14:58:25.982	2026-06-22 17:06:54.509
556	instructor	247	116	t	2026-06-20 14:58:25.984	2026-06-22 17:06:54.51
557	student	247	116	f	2026-06-20 14:58:25.986	2026-06-22 17:06:54.511
558	super_admin	247	117	t	2026-06-20 14:58:25.991	2026-06-22 17:06:54.513
559	hr	247	117	f	2026-06-20 14:58:25.994	2026-06-22 17:06:54.515
560	admin	247	117	f	2026-06-20 14:58:25.997	2026-06-22 17:06:54.517
561	instructor	247	117	f	2026-06-20 14:58:25.999	2026-06-22 17:06:54.518
562	student	247	117	f	2026-06-20 14:58:26.006	2026-06-22 17:06:54.52
563	super_admin	277	118	t	2026-06-20 14:58:26.017	2026-06-22 17:06:54.523
564	hr	277	118	t	2026-06-20 14:58:26.019	2026-06-22 17:06:54.525
565	admin	277	118	t	2026-06-20 14:58:26.023	2026-06-22 17:06:54.526
566	instructor	277	118	t	2026-06-20 14:58:26.025	2026-06-22 17:06:54.527
567	student	277	118	t	2026-06-20 14:58:26.027	2026-06-22 17:06:54.528
569	hr	277	119	t	2026-06-20 14:58:26.037	2026-06-22 17:06:54.534
570	admin	277	119	t	2026-06-20 14:58:26.042	2026-06-22 17:06:54.536
571	instructor	277	119	t	2026-06-20 14:58:26.05	2026-06-22 17:06:54.537
572	student	277	119	f	2026-06-20 14:58:26.052	2026-06-22 17:06:54.538
460	admin	29	97	f	2026-06-20 14:31:56.949	2026-06-22 17:06:55.631
461	instructor	29	97	f	2026-06-20 14:31:56.953	2026-06-22 17:06:55.635
575	admin	277	120	t	2026-06-20 14:58:26.068	2026-06-22 17:06:54.544
576	instructor	277	120	t	2026-06-20 14:58:26.072	2026-06-22 17:06:54.545
577	student	277	120	f	2026-06-20 14:58:26.076	2026-06-22 17:06:54.546
578	super_admin	277	121	t	2026-06-20 14:58:26.082	2026-06-22 17:06:54.548
579	hr	277	121	f	2026-06-20 14:58:26.084	2026-06-22 17:06:54.549
580	admin	277	121	f	2026-06-20 14:58:26.086	2026-06-22 17:06:54.55
581	instructor	277	121	f	2026-06-20 14:58:26.088	2026-06-22 17:06:54.551
582	student	277	121	f	2026-06-20 14:58:26.093	2026-06-22 17:06:54.552
583	super_admin	248	122	t	2026-06-20 14:58:26.102	2026-06-22 17:06:54.555
584	hr	248	122	t	2026-06-20 14:58:26.106	2026-06-22 17:06:54.556
585	admin	248	122	t	2026-06-20 14:58:26.109	2026-06-22 17:06:54.557
587	student	248	122	t	2026-06-20 14:58:26.114	2026-06-22 17:06:54.559
588	super_admin	248	123	t	2026-06-20 14:58:26.121	2026-06-22 17:06:54.562
589	hr	248	123	t	2026-06-20 14:58:26.124	2026-06-22 17:06:54.563
590	admin	248	123	t	2026-06-20 14:58:26.126	2026-06-22 17:06:54.565
591	instructor	248	123	t	2026-06-20 14:58:26.128	2026-06-22 17:06:54.566
592	student	248	123	f	2026-06-20 14:58:26.13	2026-06-22 17:06:54.567
593	super_admin	248	124	t	2026-06-20 14:58:26.136	2026-06-22 17:06:54.57
594	hr	248	124	t	2026-06-20 14:58:26.139	2026-06-22 17:06:54.571
595	admin	248	124	t	2026-06-20 14:58:26.142	2026-06-22 17:06:54.572
596	instructor	248	124	t	2026-06-20 14:58:26.147	2026-06-22 17:06:54.573
597	student	248	124	f	2026-06-20 14:58:26.149	2026-06-22 17:06:54.574
598	super_admin	248	125	t	2026-06-20 14:58:26.154	2026-06-22 17:06:54.576
599	hr	248	125	f	2026-06-20 14:58:26.161	2026-06-22 17:06:54.578
600	admin	248	125	f	2026-06-20 14:58:26.164	2026-06-22 17:06:54.578
601	instructor	248	125	f	2026-06-20 14:58:26.166	2026-06-22 17:06:54.58
602	student	248	125	f	2026-06-20 14:58:26.168	2026-06-22 17:06:54.581
603	super_admin	249	126	t	2026-06-20 14:58:26.176	2026-06-22 17:06:54.586
604	hr	249	126	t	2026-06-20 14:58:26.181	2026-06-22 17:06:54.587
605	admin	249	126	t	2026-06-20 14:58:26.184	2026-06-22 17:06:54.593
607	student	249	126	f	2026-06-20 14:58:26.19	2026-06-22 17:06:54.598
608	super_admin	249	127	t	2026-06-20 14:58:26.198	2026-06-22 17:06:54.602
609	hr	249	127	t	2026-06-20 14:58:26.2	2026-06-22 17:06:54.604
610	admin	249	127	t	2026-06-20 14:58:26.203	2026-06-22 17:06:54.605
611	instructor	249	127	t	2026-06-20 14:58:26.205	2026-06-22 17:06:54.606
612	student	249	127	f	2026-06-20 14:58:26.208	2026-06-22 17:06:54.607
613	super_admin	249	128	t	2026-06-20 14:58:26.214	2026-06-22 17:06:54.61
614	hr	249	128	t	2026-06-20 14:58:26.216	2026-06-22 17:06:54.613
615	admin	249	128	t	2026-06-20 14:58:26.219	2026-06-22 17:06:54.614
616	instructor	249	128	t	2026-06-20 14:58:26.221	2026-06-22 17:06:54.615
617	student	249	128	f	2026-06-20 14:58:26.224	2026-06-22 17:06:54.616
618	super_admin	249	129	t	2026-06-20 14:58:26.228	2026-06-22 17:06:54.621
619	hr	249	129	f	2026-06-20 14:58:26.23	2026-06-22 17:06:54.622
620	admin	249	129	f	2026-06-20 14:58:26.232	2026-06-22 17:06:54.623
621	instructor	249	129	f	2026-06-20 14:58:26.235	2026-06-22 17:06:54.624
622	student	249	129	f	2026-06-20 14:58:26.237	2026-06-22 17:06:54.625
623	super_admin	250	130	t	2026-06-20 14:58:26.243	2026-06-22 17:06:54.629
624	hr	250	130	t	2026-06-20 14:58:26.245	2026-06-22 17:06:54.63
625	admin	250	130	t	2026-06-20 14:58:26.247	2026-06-22 17:06:54.631
627	student	250	130	f	2026-06-20 14:58:26.251	2026-06-22 17:06:54.633
628	super_admin	250	131	t	2026-06-20 14:58:26.254	2026-06-22 17:06:54.641
629	hr	250	131	t	2026-06-20 14:58:26.258	2026-06-22 17:06:54.643
630	admin	250	131	t	2026-06-20 14:58:26.259	2026-06-22 17:06:54.644
631	instructor	250	131	f	2026-06-20 14:58:26.262	2026-06-22 17:06:54.645
632	student	250	131	f	2026-06-20 14:58:26.264	2026-06-22 17:06:54.646
633	super_admin	250	132	t	2026-06-20 14:58:26.269	2026-06-22 17:06:54.648
634	hr	250	132	t	2026-06-20 14:58:26.271	2026-06-22 17:06:54.649
635	admin	250	132	t	2026-06-20 14:58:26.274	2026-06-22 17:06:54.65
636	instructor	250	132	f	2026-06-20 14:58:26.278	2026-06-22 17:06:54.651
637	student	250	132	f	2026-06-20 14:58:26.28	2026-06-22 17:06:54.654
638	super_admin	250	133	t	2026-06-20 14:58:26.287	2026-06-22 17:06:54.657
639	hr	250	133	f	2026-06-20 14:58:26.289	2026-06-22 17:06:54.659
640	admin	250	133	f	2026-06-20 14:58:26.292	2026-06-22 17:06:54.66
641	instructor	250	133	f	2026-06-20 14:58:26.294	2026-06-22 17:06:54.661
642	student	250	133	f	2026-06-20 14:58:26.296	2026-06-22 17:06:54.663
644	hr	251	134	t	2026-06-20 14:58:26.308	2026-06-22 17:06:54.668
645	admin	251	134	t	2026-06-20 14:58:26.311	2026-06-22 17:06:54.67
646	instructor	251	134	t	2026-06-20 14:58:26.313	2026-06-22 17:06:54.671
647	student	251	134	f	2026-06-20 14:58:26.316	2026-06-22 17:06:54.672
648	super_admin	251	135	t	2026-06-20 14:58:26.32	2026-06-22 17:06:54.675
649	hr	251	135	t	2026-06-20 14:58:26.322	2026-06-22 17:06:54.676
650	admin	251	135	t	2026-06-20 14:58:26.324	2026-06-22 17:06:54.681
651	instructor	251	135	t	2026-06-20 14:58:26.328	2026-06-22 17:06:54.685
652	student	251	135	f	2026-06-20 14:58:26.331	2026-06-22 17:06:54.686
653	super_admin	251	136	t	2026-06-20 14:58:26.335	2026-06-22 17:06:54.688
654	hr	251	136	t	2026-06-20 14:58:26.337	2026-06-22 17:06:54.689
655	admin	251	136	t	2026-06-20 14:58:26.339	2026-06-22 17:06:54.69
656	instructor	251	136	t	2026-06-20 14:58:26.341	2026-06-22 17:06:54.691
657	student	251	136	f	2026-06-20 14:58:26.343	2026-06-22 17:06:54.692
658	super_admin	251	137	t	2026-06-20 14:58:26.347	2026-06-22 17:06:54.694
659	hr	251	137	f	2026-06-20 14:58:26.349	2026-06-22 17:06:54.695
660	admin	251	137	f	2026-06-20 14:58:26.351	2026-06-22 17:06:54.696
661	instructor	251	137	f	2026-06-20 14:58:26.354	2026-06-22 17:06:54.697
662	student	251	137	f	2026-06-20 14:58:26.356	2026-06-22 17:06:54.698
664	hr	252	138	t	2026-06-20 14:58:26.367	2026-06-22 17:06:54.702
665	admin	252	138	t	2026-06-20 14:58:26.37	2026-06-22 17:06:54.703
666	instructor	252	138	t	2026-06-20 14:58:26.372	2026-06-22 17:06:54.704
667	student	252	138	f	2026-06-20 14:58:26.374	2026-06-22 17:06:54.706
668	super_admin	252	139	t	2026-06-20 14:58:26.378	2026-06-22 17:06:54.708
669	hr	252	139	t	2026-06-20 14:58:26.38	2026-06-22 17:06:54.709
670	admin	252	139	t	2026-06-20 14:58:26.383	2026-06-22 17:06:54.71
671	instructor	252	139	t	2026-06-20 14:58:26.385	2026-06-22 17:06:54.711
672	student	252	139	f	2026-06-20 14:58:26.388	2026-06-22 17:06:54.712
673	super_admin	252	140	t	2026-06-20 14:58:26.394	2026-06-22 17:06:54.714
674	hr	252	140	t	2026-06-20 14:58:26.397	2026-06-22 17:06:54.715
675	admin	252	140	t	2026-06-20 14:58:26.399	2026-06-22 17:06:54.716
676	instructor	252	140	t	2026-06-20 14:58:26.402	2026-06-22 17:06:54.717
677	student	252	140	f	2026-06-20 14:58:26.405	2026-06-22 17:06:54.718
678	super_admin	252	141	t	2026-06-20 14:58:26.409	2026-06-22 17:06:54.72
679	hr	252	141	f	2026-06-20 14:58:26.412	2026-06-22 17:06:54.721
680	admin	252	141	f	2026-06-20 14:58:26.416	2026-06-22 17:06:54.721
682	student	252	141	f	2026-06-20 14:58:26.421	2026-06-22 17:06:54.723
683	super_admin	253	142	t	2026-06-20 14:58:26.428	2026-06-22 17:06:54.726
684	hr	253	142	t	2026-06-20 14:58:26.429	2026-06-22 17:06:54.727
685	admin	253	142	t	2026-06-20 14:58:26.432	2026-06-22 17:06:54.727
686	instructor	253	142	t	2026-06-20 14:58:26.434	2026-06-22 17:06:54.732
574	hr	277	120	t	2026-06-20 14:58:26.065	2026-06-22 17:06:54.542
689	hr	253	143	t	2026-06-20 14:58:26.443	2026-06-22 17:06:54.741
690	admin	253	143	t	2026-06-20 14:58:26.445	2026-06-22 17:06:54.742
691	instructor	253	143	t	2026-06-20 14:58:26.446	2026-06-22 17:06:54.743
692	student	253	143	f	2026-06-20 14:58:26.448	2026-06-22 17:06:54.744
693	super_admin	253	144	t	2026-06-20 14:58:26.451	2026-06-22 17:06:54.747
694	hr	253	144	t	2026-06-20 14:58:26.452	2026-06-22 17:06:54.748
695	admin	253	144	t	2026-06-20 14:58:26.454	2026-06-22 17:06:54.749
696	instructor	253	144	t	2026-06-20 14:58:26.456	2026-06-22 17:06:54.75
697	student	253	144	f	2026-06-20 14:58:26.458	2026-06-22 17:06:54.751
698	super_admin	253	145	t	2026-06-20 14:58:26.46	2026-06-22 17:06:54.754
699	hr	253	145	f	2026-06-20 14:58:26.462	2026-06-22 17:06:54.755
700	admin	253	145	f	2026-06-20 14:58:26.463	2026-06-22 17:06:54.756
702	student	253	145	f	2026-06-20 14:58:26.468	2026-06-22 17:06:54.758
703	super_admin	255	146	t	2026-06-20 14:58:26.472	2026-06-22 17:06:54.761
704	hr	255	146	t	2026-06-20 14:58:26.473	2026-06-22 17:06:54.762
705	admin	255	146	t	2026-06-20 14:58:26.474	2026-06-22 17:06:54.763
706	instructor	255	146	t	2026-06-20 14:58:26.476	2026-06-22 17:06:54.763
707	student	255	146	t	2026-06-20 14:58:26.477	2026-06-22 17:06:54.764
708	super_admin	256	147	t	2026-06-20 14:58:26.481	2026-06-22 17:06:54.767
709	hr	256	147	t	2026-06-20 14:58:26.483	2026-06-22 17:06:54.768
710	admin	256	147	t	2026-06-20 14:58:26.484	2026-06-22 17:06:54.769
711	instructor	256	147	t	2026-06-20 14:58:26.486	2026-06-22 17:06:54.77
712	student	256	147	f	2026-06-20 14:58:26.487	2026-06-22 17:06:54.771
713	super_admin	256	148	t	2026-06-20 14:58:26.49	2026-06-22 17:06:54.773
714	hr	256	148	t	2026-06-20 14:58:26.491	2026-06-22 17:06:54.774
715	admin	256	148	t	2026-06-20 14:58:26.492	2026-06-22 17:06:54.774
716	instructor	256	148	t	2026-06-20 14:58:26.493	2026-06-22 17:06:54.775
717	student	256	148	f	2026-06-20 14:58:26.495	2026-06-22 17:06:54.776
718	super_admin	256	149	t	2026-06-20 14:58:26.498	2026-06-22 17:06:54.778
719	hr	256	149	t	2026-06-20 14:58:26.499	2026-06-22 17:06:54.779
720	admin	256	149	t	2026-06-20 14:58:26.503	2026-06-22 17:06:54.779
722	student	256	149	f	2026-06-20 14:58:26.506	2026-06-22 17:06:54.781
723	super_admin	256	150	t	2026-06-20 14:58:26.508	2026-06-22 17:06:54.783
724	hr	256	150	f	2026-06-20 14:58:26.51	2026-06-22 17:06:54.784
725	admin	256	150	f	2026-06-20 14:58:26.511	2026-06-22 17:06:54.785
726	instructor	256	150	f	2026-06-20 14:58:26.513	2026-06-22 17:06:54.786
727	student	256	150	f	2026-06-20 14:58:26.514	2026-06-22 17:06:54.787
728	super_admin	257	151	t	2026-06-20 14:58:26.518	2026-06-22 17:06:54.79
729	hr	257	151	t	2026-06-20 14:58:26.519	2026-06-22 17:06:54.791
730	admin	257	151	t	2026-06-20 14:58:26.52	2026-06-22 17:06:54.792
731	instructor	257	151	t	2026-06-20 14:58:26.52	2026-06-22 17:06:54.793
732	student	257	151	f	2026-06-20 14:58:26.522	2026-06-22 17:06:54.794
733	super_admin	257	152	t	2026-06-20 14:58:26.524	2026-06-22 17:06:54.797
734	hr	257	152	t	2026-06-20 14:58:26.525	2026-06-22 17:06:54.798
735	admin	257	152	t	2026-06-20 14:58:26.526	2026-06-22 17:06:54.798
736	instructor	257	152	t	2026-06-20 14:58:26.527	2026-06-22 17:06:54.799
737	student	257	152	f	2026-06-20 14:58:26.528	2026-06-22 17:06:54.8
739	hr	257	153	t	2026-06-20 14:58:26.532	2026-06-22 17:06:54.803
740	admin	257	153	t	2026-06-20 14:58:26.533	2026-06-22 17:06:54.804
741	instructor	257	153	t	2026-06-20 14:58:26.534	2026-06-22 17:06:54.805
742	student	257	153	f	2026-06-20 14:58:26.535	2026-06-22 17:06:54.805
743	super_admin	257	154	t	2026-06-20 14:58:26.539	2026-06-22 17:06:54.807
744	hr	257	154	f	2026-06-20 14:58:26.539	2026-06-22 17:06:54.808
745	admin	257	154	f	2026-06-20 14:58:26.54	2026-06-22 17:06:54.809
746	instructor	257	154	f	2026-06-20 14:58:26.541	2026-06-22 17:06:54.81
747	student	257	154	f	2026-06-20 14:58:26.542	2026-06-22 17:06:54.811
748	super_admin	258	155	t	2026-06-20 14:58:26.545	2026-06-22 17:06:54.814
749	hr	258	155	t	2026-06-20 14:58:26.546	2026-06-22 17:06:54.815
750	admin	258	155	t	2026-06-20 14:58:26.547	2026-06-22 17:06:54.816
751	instructor	258	155	t	2026-06-20 14:58:26.548	2026-06-22 17:06:54.817
752	student	258	155	f	2026-06-20 14:58:26.549	2026-06-22 17:06:54.817
753	super_admin	258	156	t	2026-06-20 14:58:26.552	2026-06-22 17:06:54.819
754	hr	258	156	t	2026-06-20 14:58:26.553	2026-06-22 17:06:54.82
755	admin	258	156	t	2026-06-20 14:58:26.555	2026-06-22 17:06:54.821
756	instructor	258	156	t	2026-06-20 14:58:26.556	2026-06-22 17:06:54.822
757	student	258	156	f	2026-06-20 14:58:26.557	2026-06-22 17:06:54.824
759	hr	258	157	t	2026-06-20 14:58:26.56	2026-06-22 17:06:54.827
760	admin	258	157	t	2026-06-20 14:58:26.562	2026-06-22 17:06:54.828
761	instructor	258	157	t	2026-06-20 14:58:26.562	2026-06-22 17:06:54.829
762	student	258	157	f	2026-06-20 14:58:26.563	2026-06-22 17:06:54.83
763	super_admin	258	158	t	2026-06-20 14:58:26.565	2026-06-22 17:06:54.832
764	hr	258	158	f	2026-06-20 14:58:26.566	2026-06-22 17:06:54.834
765	admin	258	158	f	2026-06-20 14:58:26.567	2026-06-22 17:06:54.836
766	instructor	258	158	f	2026-06-20 14:58:26.568	2026-06-22 17:06:54.837
767	student	258	158	f	2026-06-20 14:58:26.569	2026-06-22 17:06:54.839
768	super_admin	259	159	t	2026-06-20 14:58:26.574	2026-06-22 17:06:54.843
769	hr	259	159	t	2026-06-20 14:58:26.575	2026-06-22 17:06:54.844
770	admin	259	159	t	2026-06-20 14:58:26.575	2026-06-22 17:06:54.845
771	instructor	259	159	t	2026-06-20 14:58:26.576	2026-06-22 17:06:54.846
772	student	259	159	f	2026-06-20 14:58:26.577	2026-06-22 17:06:54.848
773	super_admin	259	160	t	2026-06-20 14:58:26.579	2026-06-22 17:06:54.85
774	hr	259	160	t	2026-06-20 14:58:26.58	2026-06-22 17:06:54.851
775	admin	259	160	t	2026-06-20 14:58:26.581	2026-06-22 17:06:54.852
777	student	259	160	f	2026-06-20 14:58:26.582	2026-06-22 17:06:54.854
778	super_admin	272	161	t	2026-06-20 14:58:26.585	2026-06-22 17:06:54.859
779	hr	272	161	t	2026-06-20 14:58:26.586	2026-06-22 17:06:54.86
780	admin	272	161	t	2026-06-20 14:58:26.586	2026-06-22 17:06:54.861
781	instructor	272	161	t	2026-06-20 14:58:26.587	2026-06-22 17:06:54.862
782	student	272	161	t	2026-06-20 14:58:26.588	2026-06-22 17:06:54.864
783	super_admin	272	162	t	2026-06-20 14:58:26.59	2026-06-22 17:06:54.866
784	hr	272	162	t	2026-06-20 14:58:26.591	2026-06-22 17:06:54.867
785	admin	272	162	t	2026-06-20 14:58:26.594	2026-06-22 17:06:54.868
786	instructor	272	162	f	2026-06-20 14:58:26.595	2026-06-22 17:06:54.869
787	student	272	162	f	2026-06-20 14:58:26.596	2026-06-22 17:06:54.87
788	super_admin	273	163	t	2026-06-20 14:58:26.601	2026-06-22 17:06:54.873
789	hr	273	163	t	2026-06-20 14:58:26.602	2026-06-22 17:06:54.875
790	admin	273	163	t	2026-06-20 14:58:26.603	2026-06-22 17:06:54.876
791	instructor	273	163	t	2026-06-20 14:58:26.604	2026-06-22 17:06:54.877
792	student	273	163	t	2026-06-20 14:58:26.605	2026-06-22 17:06:54.879
793	super_admin	273	164	t	2026-06-20 14:58:26.607	2026-06-22 17:06:54.881
794	hr	273	164	t	2026-06-20 14:58:26.608	2026-06-22 17:06:54.882
795	admin	273	164	t	2026-06-20 14:58:26.609	2026-06-22 17:06:54.884
797	student	273	164	f	2026-06-20 14:58:26.611	2026-06-22 17:06:54.886
798	super_admin	274	165	t	2026-06-20 14:58:26.615	2026-06-22 17:06:54.89
799	hr	274	165	t	2026-06-20 14:58:26.617	2026-06-22 17:06:54.891
800	admin	274	165	t	2026-06-20 14:58:26.618	2026-06-22 17:06:54.892
688	super_admin	253	143	t	2026-06-20 14:58:26.441	2026-06-22 17:06:54.736
803	super_admin	274	166	t	2026-06-20 14:58:26.623	2026-06-22 17:06:54.896
804	hr	274	166	t	2026-06-20 14:58:26.624	2026-06-22 17:06:54.897
805	admin	274	166	t	2026-06-20 14:58:26.625	2026-06-22 17:06:54.898
806	instructor	274	166	f	2026-06-20 14:58:26.626	2026-06-22 17:06:54.899
807	student	274	166	f	2026-06-20 14:58:26.627	2026-06-22 17:06:54.9
808	super_admin	275	167	t	2026-06-20 14:58:26.631	2026-06-22 17:06:54.903
809	hr	275	167	t	2026-06-20 14:58:26.632	2026-06-22 17:06:54.904
810	admin	275	167	t	2026-06-20 14:58:26.633	2026-06-22 17:06:54.905
811	instructor	275	167	t	2026-06-20 14:58:26.634	2026-06-22 17:06:54.905
812	student	275	167	t	2026-06-20 14:58:26.635	2026-06-22 17:06:54.906
813	super_admin	275	168	t	2026-06-20 14:58:26.637	2026-06-22 17:06:54.908
814	hr	275	168	t	2026-06-20 14:58:26.638	2026-06-22 17:06:54.909
815	admin	275	168	t	2026-06-20 14:58:26.64	2026-06-22 17:06:54.91
817	student	275	168	f	2026-06-20 14:58:26.642	2026-06-22 17:06:54.912
818	super_admin	262	169	t	2026-06-20 14:58:26.647	2026-06-22 17:06:54.915
819	hr	262	169	t	2026-06-20 14:58:26.649	2026-06-22 17:06:54.915
820	admin	262	169	t	2026-06-20 14:58:26.65	2026-06-22 17:06:54.916
821	instructor	262	169	f	2026-06-20 14:58:26.651	2026-06-22 17:06:54.917
822	student	262	169	f	2026-06-20 14:58:26.652	2026-06-22 17:06:54.918
823	super_admin	263	170	t	2026-06-20 14:58:26.657	2026-06-22 17:06:54.921
824	hr	263	170	t	2026-06-20 14:58:26.658	2026-06-22 17:06:54.922
825	admin	263	170	t	2026-06-20 14:58:26.66	2026-06-22 17:06:54.923
826	instructor	263	170	f	2026-06-20 14:58:26.66	2026-06-22 17:06:54.924
827	student	263	170	f	2026-06-20 14:58:26.661	2026-06-22 17:06:54.925
828	super_admin	264	171	t	2026-06-20 14:58:26.665	2026-06-22 17:06:54.928
829	hr	264	171	t	2026-06-20 14:58:26.666	2026-06-22 17:06:54.929
830	admin	264	171	t	2026-06-20 14:58:26.667	2026-06-22 17:06:54.93
831	instructor	264	171	t	2026-06-20 14:58:26.668	2026-06-22 17:06:54.931
832	student	264	171	t	2026-06-20 14:58:26.67	2026-06-22 17:06:54.932
834	hr	264	172	t	2026-06-20 14:58:26.678	2026-06-22 17:06:54.936
835	admin	264	172	t	2026-06-20 14:58:26.68	2026-06-22 17:06:54.937
836	instructor	264	172	t	2026-06-20 14:58:26.682	2026-06-22 17:06:54.938
837	student	264	172	f	2026-06-20 14:58:26.683	2026-06-22 17:06:54.939
838	super_admin	265	173	t	2026-06-20 14:58:26.686	2026-06-22 17:06:54.942
839	hr	265	173	t	2026-06-20 14:58:26.688	2026-06-22 17:06:54.943
840	admin	265	173	t	2026-06-20 14:58:26.689	2026-06-22 17:06:54.944
841	instructor	265	173	t	2026-06-20 14:58:26.691	2026-06-22 17:06:54.945
842	student	265	173	t	2026-06-20 14:58:26.693	2026-06-22 17:06:54.946
843	super_admin	265	174	t	2026-06-20 14:58:26.696	2026-06-22 17:06:54.949
844	hr	265	174	t	2026-06-20 14:58:26.697	2026-06-22 17:06:54.95
845	admin	265	174	t	2026-06-20 14:58:26.697	2026-06-22 17:06:54.951
846	instructor	265	174	t	2026-06-20 14:58:26.699	2026-06-22 17:06:54.952
847	student	265	174	f	2026-06-20 14:58:26.701	2026-06-22 17:06:54.953
848	super_admin	266	175	t	2026-06-20 14:58:26.703	2026-06-22 17:06:54.955
849	hr	266	175	t	2026-06-20 14:58:26.706	2026-06-22 17:06:54.958
850	admin	266	175	t	2026-06-20 14:58:26.708	2026-06-22 17:06:54.959
851	instructor	266	175	f	2026-06-20 14:58:26.71	2026-06-22 17:06:54.96
852	student	266	175	f	2026-06-20 14:58:26.712	2026-06-22 17:06:54.961
854	hr	266	176	t	2026-06-20 14:58:26.718	2026-06-22 17:06:54.963
855	admin	266	176	t	2026-06-20 14:58:26.719	2026-06-22 17:06:54.964
856	instructor	266	176	f	2026-06-20 14:58:26.721	2026-06-22 17:06:54.965
857	student	266	176	f	2026-06-20 14:58:26.723	2026-06-22 17:06:54.966
858	super_admin	266	177	t	2026-06-20 14:58:26.725	2026-06-22 17:06:54.968
859	hr	266	177	t	2026-06-20 14:58:26.726	2026-06-22 17:06:54.969
860	admin	266	177	t	2026-06-20 14:58:26.727	2026-06-22 17:06:54.97
861	instructor	266	177	f	2026-06-20 14:58:26.729	2026-06-22 17:06:54.971
862	student	266	177	f	2026-06-20 14:58:26.73	2026-06-22 17:06:54.971
863	super_admin	266	178	t	2026-06-20 14:58:26.733	2026-06-22 17:06:54.973
864	hr	266	178	f	2026-06-20 14:58:26.735	2026-06-22 17:06:54.974
865	admin	266	178	f	2026-06-20 14:58:26.735	2026-06-22 17:06:54.976
866	instructor	266	178	f	2026-06-20 14:58:26.736	2026-06-22 17:06:54.977
867	student	266	178	f	2026-06-20 14:58:26.737	2026-06-22 17:06:54.978
868	super_admin	267	179	t	2026-06-20 14:58:26.742	2026-06-22 17:06:54.982
869	hr	267	179	t	2026-06-20 14:58:26.743	2026-06-22 17:06:54.983
870	admin	267	179	t	2026-06-20 14:58:26.744	2026-06-22 17:06:54.984
872	student	267	179	f	2026-06-20 14:58:26.747	2026-06-22 17:06:54.986
873	super_admin	267	180	t	2026-06-20 14:58:26.749	2026-06-22 17:06:54.988
874	hr	267	180	t	2026-06-20 14:58:26.751	2026-06-22 17:06:54.989
875	admin	267	180	t	2026-06-20 14:58:26.752	2026-06-22 17:06:54.99
876	instructor	267	180	t	2026-06-20 14:58:26.753	2026-06-22 17:06:54.991
877	student	267	180	f	2026-06-20 14:58:26.755	2026-06-22 17:06:54.992
878	super_admin	267	181	t	2026-06-20 14:58:26.757	2026-06-22 17:06:54.994
879	hr	267	181	t	2026-06-20 14:58:26.758	2026-06-22 17:06:54.995
880	admin	267	181	t	2026-06-20 14:58:26.759	2026-06-22 17:06:54.996
881	instructor	267	181	t	2026-06-20 14:58:26.762	2026-06-22 17:06:54.996
882	student	267	181	f	2026-06-20 14:58:26.763	2026-06-22 17:06:54.997
883	super_admin	267	182	t	2026-06-20 14:58:26.767	2026-06-22 17:06:54.999
884	hr	267	182	f	2026-06-20 14:58:26.768	2026-06-22 17:06:55
885	admin	267	182	f	2026-06-20 14:58:26.77	2026-06-22 17:06:55.001
886	instructor	267	182	f	2026-06-20 14:58:26.772	2026-06-22 17:06:55.002
887	student	267	182	f	2026-06-20 14:58:26.774	2026-06-22 17:06:55.003
888	super_admin	268	183	t	2026-06-20 14:58:26.777	2026-06-22 17:06:55.006
889	hr	268	183	t	2026-06-20 14:58:26.778	2026-06-22 17:06:55.007
890	admin	268	183	t	2026-06-20 14:58:26.779	2026-06-22 17:06:55.008
892	student	268	183	f	2026-06-20 14:58:26.781	2026-06-22 17:06:55.01
893	super_admin	268	184	t	2026-06-20 14:58:26.783	2026-06-22 17:06:55.011
894	hr	268	184	t	2026-06-20 14:58:26.785	2026-06-22 17:06:55.012
895	admin	268	184	t	2026-06-20 14:58:26.786	2026-06-22 17:06:55.013
896	instructor	268	184	t	2026-06-20 14:58:26.787	2026-06-22 17:06:55.014
897	student	268	184	f	2026-06-20 14:58:26.788	2026-06-22 17:06:55.015
898	super_admin	268	185	t	2026-06-20 14:58:26.79	2026-06-22 17:06:55.017
899	hr	268	185	t	2026-06-20 14:58:26.793	2026-06-22 17:06:55.017
900	admin	268	185	t	2026-06-20 14:58:26.794	2026-06-22 17:06:55.018
901	instructor	268	185	t	2026-06-20 14:58:26.795	2026-06-22 17:06:55.019
902	student	268	185	f	2026-06-20 14:58:26.796	2026-06-22 17:06:55.02
903	super_admin	268	186	t	2026-06-20 14:58:26.797	2026-06-22 17:06:55.022
904	hr	268	186	f	2026-06-20 14:58:26.798	2026-06-22 17:06:55.023
905	admin	268	186	f	2026-06-20 14:58:26.799	2026-06-22 17:06:55.024
906	instructor	268	186	f	2026-06-20 14:58:26.8	2026-06-22 17:06:55.025
907	student	268	186	f	2026-06-20 14:58:26.801	2026-06-22 17:06:55.026
908	super_admin	270	187	t	2026-06-20 14:58:26.807	2026-06-22 17:06:55.029
909	hr	270	187	t	2026-06-20 14:58:26.809	2026-06-22 17:06:55.03
910	admin	270	187	t	2026-06-20 14:58:26.81	2026-06-22 17:06:55.03
912	student	270	187	t	2026-06-20 14:58:26.813	2026-06-22 17:06:55.032
913	super_admin	270	188	t	2026-06-20 14:58:26.815	2026-06-22 17:06:55.034
914	hr	270	188	t	2026-06-20 14:58:26.816	2026-06-22 17:06:55.035
802	student	274	165	t	2026-06-20 14:58:26.621	2026-06-22 17:06:54.894
917	student	270	188	f	2026-06-20 14:58:26.822	2026-06-22 17:06:55.038
918	super_admin	271	189	t	2026-06-20 14:58:26.826	2026-06-22 17:06:55.041
919	hr	271	189	f	2026-06-20 14:58:26.827	2026-06-22 17:06:55.042
920	admin	271	189	f	2026-06-20 14:58:26.828	2026-06-22 17:06:55.042
921	instructor	271	189	f	2026-06-20 14:58:26.83	2026-06-22 17:06:55.043
922	student	271	189	f	2026-06-20 14:58:26.831	2026-06-22 17:06:55.044
923	super_admin	271	190	t	2026-06-20 14:58:26.833	2026-06-22 17:06:55.046
924	hr	271	190	f	2026-06-20 14:58:26.835	2026-06-22 17:06:55.047
925	admin	271	190	f	2026-06-20 14:58:26.836	2026-06-22 17:06:55.047
926	instructor	271	190	f	2026-06-20 14:58:26.837	2026-06-22 17:06:55.048
927	student	271	190	f	2026-06-20 14:58:26.84	2026-06-22 17:06:55.049
928	super_admin	276	191	t	2026-06-20 14:58:26.844	2026-06-22 17:06:55.052
929	hr	276	191	t	2026-06-20 14:58:26.845	2026-06-22 17:06:55.053
930	admin	276	191	t	2026-06-20 14:58:26.846	2026-06-22 17:06:55.054
931	instructor	276	191	t	2026-06-20 14:58:26.848	2026-06-22 17:06:55.054
932	student	276	191	t	2026-06-20 14:58:26.849	2026-06-22 17:06:55.055
43	super_admin	5	14	t	2026-06-20 14:31:55.193	2026-06-22 17:06:55.058
131	instructor	12	31	f	2026-06-20 14:31:55.849	2026-06-22 17:06:55.179
148	super_admin	13	35	t	2026-06-20 14:31:56	2026-06-22 17:06:55.198
168	super_admin	14	39	t	2026-06-20 14:31:56.103	2026-06-22 17:06:55.222
186	instructor	14	42	f	2026-06-20 14:31:56.17	2026-06-22 17:06:55.244
206	instructor	15	46	f	2026-06-20 14:31:56.287	2026-06-22 17:06:55.27
226	instructor	16	50	f	2026-06-20 14:31:56.382	2026-06-22 17:06:55.31
231	instructor	17	51	f	2026-06-20 14:31:56.407	2026-06-22 17:06:55.316
246	instructor	17	54	f	2026-06-20 14:31:56.462	2026-06-22 17:06:55.336
263	super_admin	19	58	t	2026-06-20 14:31:56.535	2026-06-22 17:06:55.37
283	super_admin	20	62	t	2026-06-20 14:31:56.605	2026-06-22 17:06:55.395
301	instructor	21	65	f	2026-06-20 14:31:56.646	2026-06-22 17:06:55.416
321	instructor	22	69	f	2026-06-20 14:31:56.686	2026-06-22 17:06:55.445
341	instructor	23	73	f	2026-06-20 14:31:56.711	2026-06-22 17:06:55.469
345	admin	23	74	f	2026-06-20 14:31:56.717	2026-06-22 17:06:55.476
356	instructor	24	76	f	2026-06-20 14:31:56.735	2026-06-22 17:06:55.49
376	instructor	25	80	f	2026-06-20 14:31:56.773	2026-06-22 17:06:55.519
396	instructor	26	84	f	2026-06-20 14:31:56.813	2026-06-22 17:06:55.546
413	super_admin	27	88	t	2026-06-20 14:31:56.847	2026-06-22 17:06:55.567
451	instructor	28	95	f	2026-06-20 14:31:56.922	2026-06-22 17:06:55.619
459	hr	29	97	f	2026-06-20 14:31:56.948	2026-06-22 17:06:55.63
473	super_admin	30	100	t	2026-06-20 14:31:56.982	2026-06-22 17:06:55.652
491	instructor	30	103	f	2026-06-20 14:31:57.021	2026-06-22 17:06:55.672
933	super_admin	254	192	t	2026-06-20 14:58:27.553	2026-06-22 17:06:55.685
934	hr	254	192	t	2026-06-20 14:58:27.554	2026-06-22 17:06:55.686
935	admin	254	192	t	2026-06-20 14:58:27.555	2026-06-22 17:06:55.687
936	instructor	254	192	t	2026-06-20 14:58:27.556	2026-06-22 17:06:55.689
937	student	254	192	f	2026-06-20 14:58:27.556	2026-06-22 17:06:55.69
938	super_admin	254	193	t	2026-06-20 14:58:27.558	2026-06-22 17:06:55.692
939	hr	254	193	t	2026-06-20 14:58:27.559	2026-06-22 17:06:55.693
940	admin	254	193	t	2026-06-20 14:58:27.56	2026-06-22 17:06:55.694
941	instructor	254	193	t	2026-06-20 14:58:27.56	2026-06-22 17:06:55.694
942	student	254	193	f	2026-06-20 14:58:27.561	2026-06-22 17:06:55.695
943	super_admin	254	194	t	2026-06-20 14:58:27.564	2026-06-22 17:06:55.697
944	hr	254	194	t	2026-06-20 14:58:27.565	2026-06-22 17:06:55.698
945	admin	254	194	t	2026-06-20 14:58:27.566	2026-06-22 17:06:55.7
946	instructor	254	194	t	2026-06-20 14:58:27.568	2026-06-22 17:06:55.7
947	student	254	194	f	2026-06-20 14:58:27.569	2026-06-22 17:06:55.701
949	hr	254	195	t	2026-06-20 14:58:27.574	2026-06-22 17:06:55.705
950	admin	254	195	t	2026-06-20 14:58:27.575	2026-06-22 17:06:55.705
951	instructor	254	195	t	2026-06-20 14:58:27.576	2026-06-22 17:06:55.706
952	student	254	195	f	2026-06-20 14:58:27.577	2026-06-22 17:06:55.707
953	super_admin	254	196	t	2026-06-20 14:58:27.579	2026-06-22 17:06:55.709
954	hr	254	196	t	2026-06-20 14:58:27.58	2026-06-22 17:06:55.709
955	admin	254	196	t	2026-06-20 14:58:27.581	2026-06-22 17:06:55.71
956	instructor	254	196	f	2026-06-20 14:58:27.582	2026-06-22 17:06:55.711
957	student	254	196	f	2026-06-20 14:58:27.587	2026-06-22 17:06:55.712
958	super_admin	254	197	t	2026-06-20 14:58:27.59	2026-06-22 17:06:55.713
959	hr	254	197	t	2026-06-20 14:58:27.591	2026-06-22 17:06:55.714
960	admin	254	197	f	2026-06-20 14:58:27.591	2026-06-22 17:06:55.716
961	instructor	254	197	f	2026-06-20 14:58:27.592	2026-06-22 17:06:55.717
962	student	254	197	f	2026-06-20 14:58:27.593	2026-06-22 17:06:55.717
963	super_admin	254	198	t	2026-06-20 14:58:27.595	2026-06-22 17:06:55.719
964	hr	254	198	t	2026-06-20 14:58:27.596	2026-06-22 17:06:55.72
965	admin	254	198	t	2026-06-20 14:58:27.598	2026-06-22 17:06:55.721
967	student	254	198	f	2026-06-20 14:58:27.601	2026-06-22 17:06:55.722
968	super_admin	254	199	t	2026-06-20 14:58:27.605	2026-06-22 17:06:55.724
969	hr	254	199	t	2026-06-20 14:58:27.609	2026-06-22 17:06:55.725
970	admin	254	199	t	2026-06-20 14:58:27.61	2026-06-22 17:06:55.726
971	instructor	254	199	t	2026-06-20 14:58:27.611	2026-06-22 17:06:55.727
972	student	254	199	f	2026-06-20 14:58:27.613	2026-06-22 17:06:55.727
973	super_admin	254	200	t	2026-06-20 14:58:27.616	2026-06-22 17:06:55.729
974	hr	254	200	t	2026-06-20 14:58:27.617	2026-06-22 17:06:55.73
975	admin	254	200	t	2026-06-20 14:58:27.618	2026-06-22 17:06:55.73
976	instructor	254	200	t	2026-06-20 14:58:27.62	2026-06-22 17:06:55.731
977	student	254	200	f	2026-06-20 14:58:27.621	2026-06-22 17:06:55.732
978	super_admin	254	201	t	2026-06-20 14:58:27.623	2026-06-22 17:06:55.734
979	hr	254	201	t	2026-06-20 14:58:27.624	2026-06-22 17:06:55.735
980	admin	254	201	t	2026-06-20 14:58:27.625	2026-06-22 17:06:55.736
981	instructor	254	201	t	2026-06-20 14:58:27.626	2026-06-22 17:06:55.737
982	student	254	201	f	2026-06-20 14:58:27.627	2026-06-22 17:06:55.738
983	super_admin	254	202	t	2026-06-20 14:58:27.631	2026-06-22 17:06:55.739
984	hr	254	202	t	2026-06-20 14:58:27.631	2026-06-22 17:06:55.74
985	admin	254	202	t	2026-06-20 14:58:27.632	2026-06-22 17:06:55.742
987	student	254	202	f	2026-06-20 14:58:27.634	2026-06-22 17:06:55.745
988	super_admin	254	203	t	2026-06-20 14:58:27.636	2026-06-22 17:06:55.747
989	hr	254	203	t	2026-06-20 14:58:27.638	2026-06-22 17:06:55.748
990	admin	254	203	t	2026-06-20 14:58:27.639	2026-06-22 17:06:55.749
991	instructor	254	203	t	2026-06-20 14:58:27.64	2026-06-22 17:06:55.75
992	student	254	203	f	2026-06-20 14:58:27.641	2026-06-22 17:06:55.751
993	super_admin	254	204	t	2026-06-20 14:58:27.643	2026-06-22 17:06:55.753
994	hr	254	204	t	2026-06-20 14:58:27.644	2026-06-22 17:06:55.753
995	admin	254	204	t	2026-06-20 14:58:27.645	2026-06-22 17:06:55.754
996	instructor	254	204	t	2026-06-20 14:58:27.646	2026-06-22 17:06:55.755
997	student	254	204	f	2026-06-20 14:58:27.647	2026-06-22 17:06:55.756
511	instructor	244	107	f	2026-06-20 14:58:25.806	2026-06-22 17:06:54.4
531	instructor	245	111	f	2026-06-20 14:58:25.897	2026-06-22 17:06:54.451
548	super_admin	247	115	t	2026-06-20 14:58:25.959	2026-06-22 17:06:54.495
568	super_admin	277	119	t	2026-06-20 14:58:26.032	2026-06-22 17:06:54.532
915	admin	270	188	t	2026-06-20 14:58:26.818	2026-06-22 17:06:55.036
573	super_admin	277	120	t	2026-06-20 14:58:26.055	2026-06-22 17:06:54.541
586	instructor	248	122	t	2026-06-20 14:58:26.111	2026-06-22 17:06:54.558
606	instructor	249	126	t	2026-06-20 14:58:26.187	2026-06-22 17:06:54.596
626	instructor	250	130	f	2026-06-20 14:58:26.249	2026-06-22 17:06:54.632
643	super_admin	251	134	t	2026-06-20 14:58:26.306	2026-06-22 17:06:54.667
663	super_admin	252	138	t	2026-06-20 14:58:26.365	2026-06-22 17:06:54.701
681	instructor	252	141	f	2026-06-20 14:58:26.419	2026-06-22 17:06:54.722
687	student	253	142	f	2026-06-20 14:58:26.436	2026-06-22 17:06:54.734
701	instructor	253	145	f	2026-06-20 14:58:26.465	2026-06-22 17:06:54.757
721	instructor	256	149	t	2026-06-20 14:58:26.505	2026-06-22 17:06:54.78
738	super_admin	257	153	t	2026-06-20 14:58:26.531	2026-06-22 17:06:54.802
758	super_admin	258	157	t	2026-06-20 14:58:26.559	2026-06-22 17:06:54.826
776	instructor	259	160	t	2026-06-20 14:58:26.581	2026-06-22 17:06:54.853
796	instructor	273	164	f	2026-06-20 14:58:26.61	2026-06-22 17:06:54.885
801	instructor	274	165	t	2026-06-20 14:58:26.62	2026-06-22 17:06:54.893
816	instructor	275	168	f	2026-06-20 14:58:26.641	2026-06-22 17:06:54.911
833	super_admin	264	172	t	2026-06-20 14:58:26.677	2026-06-22 17:06:54.935
853	super_admin	266	176	t	2026-06-20 14:58:26.716	2026-06-22 17:06:54.962
871	instructor	267	179	t	2026-06-20 14:58:26.745	2026-06-22 17:06:54.985
891	instructor	268	183	t	2026-06-20 14:58:26.779	2026-06-22 17:06:55.009
911	instructor	270	187	t	2026-06-20 14:58:26.812	2026-06-22 17:06:55.031
916	instructor	270	188	t	2026-06-20 14:58:26.82	2026-06-22 17:06:55.037
116	instructor	11	28	f	2026-06-20 14:31:55.748	2026-06-22 17:06:55.16
433	super_admin	28	92	t	2026-06-20 14:31:56.883	2026-06-22 17:06:55.595
948	super_admin	254	195	t	2026-06-20 14:58:27.572	2026-06-22 17:06:55.703
966	instructor	254	198	f	2026-06-20 14:58:27.599	2026-06-22 17:06:55.721
986	instructor	254	202	t	2026-06-20 14:58:27.633	2026-06-22 17:06:55.744
\.


--
-- Data for Name: schedule_sessions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.schedule_sessions (id, "classId", "subjectId", "instructorUserId", "classroomId", "timeSlotId", date, notes, "isCancelled", "cancelledAt", "cancelReason", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: schedule_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.schedule_types (id, code, "nameEn", "nameAr", description, icon, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	REGULAR	Regular Class	فصل عادي	Regular scheduled class	\N	\N	t	\N	\N	2026-03-27 17:22:48.896	2026-03-27 17:22:48.896
2	MAKEUP	Makeup Class	فصل تعويضي	Makeup class session	\N	\N	t	\N	\N	2026-03-27 17:22:48.901	2026-03-27 17:22:48.901
3	EXTRA	Extra Class	فصل إضافي	Extra help session	\N	\N	t	\N	\N	2026-03-27 17:22:48.907	2026-03-27 17:22:48.907
4	REVIEW	Review Session	جلسة مراجعة	Exam review session	\N	\N	t	\N	\N	2026-03-27 17:22:48.912	2026-03-27 17:22:48.912
5	LAB	Lab Session	جلسة معمل	Laboratory session	\N	\N	t	\N	\N	2026-03-27 17:22:48.917	2026-03-27 17:22:48.917
6	TUTORIAL	Tutorial	درس تعليمي	Tutorial session	\N	\N	t	\N	\N	2026-03-27 17:22:48.923	2026-03-27 17:22:48.923
\.


--
-- Data for Name: scheduled_sessions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.scheduled_sessions (id, "classId", "instructorId", "classroomId", "startDateTime", "endDateTime", status, notes, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "isRecurringInstance", "parentSessionId", "recurrenceCount", "recurrenceDays", "recurrenceEndDate", "recurrenceType", "seriesId", "capacityOverridden", "capacityOverrideReason", "deletedAt", "deletedBy", "deletionReason", "recurrenceSeriesId") FROM stdin;
7	1	12	1	2026-03-23 06:00:00	2026-03-23 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.357	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
8	3	13	1	2026-03-24 07:00:00	2026-03-24 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.379	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
10	1	12	1	2026-03-30 06:00:00	2026-03-30 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.388	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
12	4	14	1	2026-04-01 08:00:00	2026-04-01 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.395	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
13	1	12	1	2026-04-06 06:00:00	2026-04-06 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.402	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
15	4	14	1	2026-04-08 08:00:00	2026-04-08 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.407	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
17	3	13	1	2026-04-14 07:00:00	2026-04-14 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.415	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
18	4	14	1	2026-04-15 08:00:00	2026-04-15 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.417	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
20	3	13	1	2026-04-21 07:00:00	2026-04-21 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.422	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
22	1	12	1	2026-04-27 06:00:00	2026-04-27 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.427	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
5	1	15	\N	2026-06-13 06:00:00	2026-06-13 08:00:00	completed	Scheduled via calendar	t	\N	\N	2026-06-13 12:48:51.793	2026-06-18 05:38:42.995	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
4	5	14	\N	2026-06-13 12:00:00	2026-06-13 13:00:00	completed	Scheduled via calendar	t	\N	1	2026-06-13 09:54:07.122	2026-06-18 05:38:42.995	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
6	5	14	1	2026-06-28 06:00:00	2026-06-28 07:00:00	scheduled	Scheduled via calendar	t	\N	1	2026-06-18 07:49:03.436	2026-06-18 14:17:37.929	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
9	4	14	1	2026-03-25 08:00:00	2026-03-25 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.384	2026-06-21 03:59:51.384	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
11	3	13	1	2026-03-31 07:00:00	2026-03-31 08:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.391	2026-06-21 03:59:51.391	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
14	3	13	1	2026-04-07 07:00:00	2026-04-07 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.403	2026-06-21 03:59:51.403	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
16	1	12	1	2026-04-13 06:00:00	2026-04-13 07:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.413	2026-06-21 03:59:51.413	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
19	1	12	1	2026-04-20 06:00:00	2026-04-20 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.42	2026-06-21 03:59:51.42	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
21	4	14	1	2026-04-22 08:00:00	2026-04-22 09:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.424	2026-06-21 03:59:51.424	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
24	4	14	1	2026-04-29 08:00:00	2026-04-29 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.443	2026-06-21 03:59:51.443	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
26	3	13	1	2026-05-05 07:00:00	2026-05-05 08:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.447	2026-06-21 03:59:51.447	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
29	3	13	1	2026-05-12 07:00:00	2026-05-12 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.457	2026-06-21 03:59:51.457	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
31	1	12	1	2026-05-18 06:00:00	2026-05-18 07:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.462	2026-06-21 03:59:51.462	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
34	1	12	1	2026-05-25 06:00:00	2026-05-25 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.468	2026-06-21 03:59:51.468	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
36	4	14	1	2026-05-27 08:00:00	2026-05-27 09:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.473	2026-06-21 03:59:51.473	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
39	4	14	1	2026-06-03 08:00:00	2026-06-03 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.479	2026-06-21 03:59:51.479	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
41	3	13	1	2026-06-09 07:00:00	2026-06-09 08:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.482	2026-06-21 03:59:51.482	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
44	3	13	1	2026-06-16 07:00:00	2026-06-16 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.493	2026-06-21 03:59:51.493	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
47	3	13	1	2026-06-23 07:00:00	2026-06-23 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.503	2026-06-21 03:59:51.503	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
48	4	14	1	2026-06-24 08:00:00	2026-06-24 09:30:00	in_progress	\N	t	\N	\N	2026-06-21 03:59:51.505	2026-06-21 03:59:51.505	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
49	1	12	1	2026-06-29 06:00:00	2026-06-29 07:30:00	in_progress	\N	t	\N	\N	2026-06-21 03:59:51.508	2026-06-21 03:59:51.508	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
50	3	13	1	2026-06-30 07:00:00	2026-06-30 08:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.51	2026-06-21 03:59:51.51	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
51	4	14	1	2026-07-01 08:00:00	2026-07-01 09:30:00	scheduled	\N	t	\N	\N	2026-06-21 03:59:51.512	2026-06-21 03:59:51.512	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
52	1	12	1	2026-07-06 06:00:00	2026-07-06 07:30:00	scheduled	\N	t	\N	\N	2026-06-21 03:59:51.513	2026-06-21 03:59:51.513	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
53	3	13	1	2026-07-07 07:00:00	2026-07-07 08:30:00	scheduled	\N	t	\N	\N	2026-06-21 03:59:51.516	2026-06-21 03:59:51.516	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
54	4	14	1	2026-07-08 08:00:00	2026-07-08 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.518	2026-06-21 03:59:51.518	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
55	1	12	1	2026-07-13 06:00:00	2026-07-13 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.52	2026-06-21 03:59:51.52	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
56	3	13	1	2026-07-14 07:00:00	2026-07-14 08:30:00	in_progress	\N	t	\N	\N	2026-06-21 03:59:51.521	2026-06-21 03:59:51.521	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
57	4	14	1	2026-07-15 08:00:00	2026-07-15 09:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.523	2026-06-21 03:59:51.523	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
58	1	12	1	2026-07-20 06:00:00	2026-07-20 07:30:00	cancelled	\N	t	\N	\N	2026-06-21 03:59:51.531	2026-06-21 03:59:51.531	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
59	3	13	1	2026-07-21 07:00:00	2026-07-21 08:30:00	scheduled	\N	t	\N	\N	2026-06-21 03:59:51.534	2026-06-21 03:59:51.534	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
60	4	14	1	2026-07-22 08:00:00	2026-07-22 09:30:00	scheduled	\N	t	\N	\N	2026-06-21 03:59:51.543	2026-06-21 03:59:51.543	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
23	3	13	1	2026-04-28 07:00:00	2026-04-28 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.429	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
25	1	12	1	2026-05-04 06:00:00	2026-05-04 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.446	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
27	4	14	1	2026-05-06 08:00:00	2026-05-06 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.449	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
28	1	12	1	2026-05-11 06:00:00	2026-05-11 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.452	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
30	4	14	1	2026-05-13 08:00:00	2026-05-13 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.46	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
32	3	13	1	2026-05-19 07:00:00	2026-05-19 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.464	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
33	4	14	1	2026-05-20 08:00:00	2026-05-20 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.466	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
35	3	13	1	2026-05-26 07:00:00	2026-05-26 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.469	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
37	1	12	1	2026-06-01 06:00:00	2026-06-01 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.475	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
38	3	13	1	2026-06-02 07:00:00	2026-06-02 08:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.477	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
40	1	12	1	2026-06-08 06:00:00	2026-06-08 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.481	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
42	4	14	1	2026-06-10 08:00:00	2026-06-10 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.487	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
43	1	12	1	2026-06-15 06:00:00	2026-06-15 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.489	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
45	4	14	1	2026-06-17 08:00:00	2026-06-17 09:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.497	2026-06-21 18:51:21.361	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
46	1	12	1	2026-06-22 06:00:00	2026-06-22 07:30:00	completed	\N	t	\N	\N	2026-06-21 03:59:51.499	2026-06-22 10:31:43.127	f	\N	\N	{}	\N	\N	\N	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: screens; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.screens (id, "screenId", "nameEn", "nameAr", "descriptionEn", "descriptionAr", category, "isActive", "createdAt", "updatedAt") FROM stdin;
245	student-dashboard	Student Dashboard	لوحة الطالب	Student personal dashboard	لوحة التحكم الشخصية للطالب	student	t	2026-04-19 03:42:06.838	2026-06-22 17:06:54.438
246	student-profile	Student Profile	ملف الطالب	View and manage student profile	عرض وإدارة ملف الطالب	student	t	2026-04-19 03:42:06.843	2026-06-22 17:06:54.455
247	activities	Activities	الأنشطة	View activity details	عرض تفاصيل النشاط	academic	t	2026-04-19 03:42:06.847	2026-06-22 17:06:54.478
277	resources	Resources	الموارد	View resources	عرض الموارد	academic	t	2026-04-19 03:42:06.974	2026-06-22 17:06:54.521
248	quizzes	Quizzes	الاختبارات	Create and manage quizzes	إنشاء وإدارة الاختبارات	academic	t	2026-04-19 03:42:06.852	2026-06-22 17:06:54.553
249	attendance	Attendance	الحضور	View and manage attendance records	عرض وإدارة سجلات الحضور	operations	t	2026-04-19 03:42:06.856	2026-06-22 17:06:54.582
250	hr-attendance	HR Attendance	حضور الموارد البشرية	HR attendance management	إدارة حضور الموارد البشرية	operations	t	2026-04-19 03:42:06.873	2026-06-22 17:06:54.626
254	qr-scanner	QR Scanner (Daily Scan)	المسح اليومي	Daily attendance scanning via QR codes	مسح الحضور اليومي عبر رموز QR	operations	t	2026-04-19 03:42:06.886	2026-06-22 17:06:54.664
251	penalty	Penalty	العقوبات	Manage student penalties	إدارة عقوبات الطلاب	operations	t	2026-04-19 03:42:06.876	2026-06-22 17:06:54.665
252	participation	Participation	المشاركة	Track student participation	تتبع مشاركة الطلاب	operations	t	2026-04-19 03:42:06.879	2026-06-22 17:06:54.699
253	behavior	Behavior	السلوك	Track student behavior	تتبع سلوك الطلاب	operations	t	2026-04-19 03:42:06.882	2026-06-22 17:06:54.724
255	enrollments	Enrollments	التسجيلات	View student enrollments	عرض تسجيلات الطلاب	academic	t	2026-04-19 03:42:06.89	2026-06-22 17:06:54.759
256	manage-enrollments	Manage Enrollments	إدارة التسجيلات	Manage student enrollments	إدارة تسجيلات الطلاب	academic	t	2026-04-19 03:42:06.894	2026-06-22 17:06:54.765
257	programs	Programs	البرامج	Manage academic programs	إدارة البرامج الأكاديمية	academic	t	2026-04-19 03:42:06.898	2026-06-22 17:06:54.788
258	subjects	Subjects	المواد	Manage subjects and curriculum	إدارة المواد والمنهج الدراسي	academic	t	2026-04-19 03:42:06.903	2026-06-22 17:06:54.812
259	marks-entry	Marks Entry	إدخال الدرجات	Enter student marks	إدخال درجات الطلاب	academic	t	2026-04-19 03:42:06.906	2026-06-22 17:06:54.84
272	quiz-results	Quiz Results	نتائج الاختبارات	View quiz results	عرض نتائج الاختبارات	reports	t	2026-04-19 03:42:06.956	2026-06-22 17:06:54.855
273	homework-results	Homework Results	نتائج الواجبات	View homework results	عرض نتائج الواجبات المنزلية	reports	t	2026-04-19 03:42:06.96	2026-06-22 17:06:54.871
274	training-results	Training Results	نتائج التدريب	View training results	عرض نتائج التدريب	reports	t	2026-04-19 03:42:06.963	2026-06-22 17:06:54.887
275	lab-results	Lab Results	نتائج المختبر	View lab results	عرض نتائج المعمل	reports	t	2026-04-19 03:42:06.967	2026-06-22 17:06:54.901
262	analytics	Analytics	التحليلات	View analytics reports	عرض تقارير التحليلات	reports	t	2026-04-19 03:42:06.919	2026-06-22 17:06:54.912
263	advanced-analytics	Advanced Analytics	التحليلات المتقدمة	Advanced analytics dashboard	لوحة تحكم التحليلات المتقدمة	reports	t	2026-04-19 03:42:06.923	2026-06-22 17:06:54.919
264	chat	Chat	المحادثة	Communication chat	محادثة الاتصال	communication	t	2026-04-19 03:42:06.926	2026-06-22 17:06:54.926
265	notifications	Notifications	الإشعارات	View notifications	عرض الإشعارات	communication	t	2026-04-19 03:42:06.929	2026-06-22 17:06:54.94
266	scheduled-reports	Scheduled Reports	التقارير المجدولة	Manage scheduled reports	إدارة التقارير المجدولة	reports	t	2026-04-19 03:42:06.933	2026-06-22 17:06:54.953
267	workflow	Workflow	سير العمل	Document workflow management	إدارة سير العمل للمستندات	workflow	t	2026-04-19 03:42:06.936	2026-06-22 17:06:54.978
268	drive	Smart Drive	محرك الأقراص	Personal and shared file management	إدارة الملفات الشخصية والمشتركة	tools	t	2026-04-19 03:42:06.94	2026-06-22 17:06:55.003
270	profile	Profile Settings	إعدادات الملف	User profile settings	إعدادات الملف الشخصي	general	t	2026-04-19 03:42:06.948	2026-06-22 17:06:55.027
271	permission-matrix	Permission Matrix	مصفوفة الصلاحيات	Manage role permissions	إدارة صلاحيات الأدوار	admin	t	2026-04-19 03:42:06.951	2026-06-22 17:06:55.039
276	timer	Timer	المؤقت	Timer widget	أداة المؤقت	tools	t	2026-04-19 03:42:06.971	2026-06-22 17:06:55.05
5	summary-dashboard	Summary Dashboard	لوحة الملخص	Summary Dashboard	لوحة الملخص	scheduling	t	2026-06-20 14:31:55.133	2026-06-22 17:06:55.056
6	scheduling-calendar	Scheduling Calendar	جدول الجدولة	Scheduling Calendar	جدول الجدولة	scheduling	t	2026-06-20 14:31:55.273	2026-06-22 17:06:55.074
7	classes-availability	Classes Availability	توفر الصفوف	Classes Availability	توفر الصفوف	scheduling	t	2026-06-20 14:31:55.424	2026-06-22 17:06:55.099
260	class-schedules	Class Schedules	جداول الفصول	View class schedules	عرض جداول الفصول	academic	f	2026-04-19 03:42:06.912	2026-06-22 17:06:55.758
243	dashboard	Dashboard	لوحة التحكم	Admin dashboard overview	نظرة عامة على لوحة تحكم المسؤول	admin	t	2026-04-19 03:42:06.83	2026-06-22 17:06:54.371
244	categories	Categories	الفئات	Manage activity categories	إدارة فئات الأنشطة	academic	t	2026-04-19 03:42:06.834	2026-06-22 17:06:54.389
261	schedule-overview	Schedule Overview	نظرة عامة على الجدول	View schedule overview	عرض نظرة عامة على الجدول	academic	f	2026-04-19 03:42:06.916	2026-06-22 17:06:55.759
269	workspace	Workspace	مساحة العمل	Personal workspace for documents	مساحة العمل الشخصية للمستندات	files	f	2026-04-19 03:42:06.944	2026-06-22 17:06:55.76
278	scheduling	Scheduling	جدولة	Schedule management	إدارة الجدولة	communication	f	2026-04-19 03:42:06.977	2026-06-22 17:06:55.761
279	dashboards	Dashboards	لوحات التحكم	View dashboards	عرض لوحات التحكم	reports	f	2026-04-19 03:42:06.982	2026-06-22 17:06:55.762
280	performance	Performance	الأداء	View performance metrics	عرض مقاييس الأداء	reports	f	2026-04-19 03:42:06.985	2026-06-22 17:06:55.763
281	settings	Settings	الإعدادات	System settings	إعدادات النظام	admin	f	2026-04-19 03:42:06.988	2026-06-22 17:06:55.763
2	userCategoryAccess	User Access	User Access	\N	\N	Administration	f	2026-05-31 14:36:15.015	2026-06-22 17:06:55.764
3	classroomAvailability	Room Availability	Room Availability	\N	\N	Administration	f	2026-05-31 14:36:15.015	2026-06-22 17:06:55.764
4	classroomsManagement	Rooms Management	Rooms Management	\N	\N	Administration	f	2026-05-31 14:36:15.015	2026-06-22 17:06:55.765
242	home	Home	الرئيسية	Main dashboard and activities	لوحة التحكم الرئيسية والأنشطة	general	t	2026-04-19 03:42:06.821	2026-06-22 17:06:54.321
14	announcements	Announcements	الإعلانات	Announcements	الإعلانات	communication	t	2026-06-20 14:31:56.097	2026-06-22 17:06:55.22
15	users	Users	المستخدمون	Users	المستخدمون	admin	t	2026-06-20 14:31:56.193	2026-06-22 17:06:55.245
16	classes	Classes	الفصول	Classes	الفصول	academic	t	2026-06-20 14:31:56.293	2026-06-22 17:06:55.273
17	email-templates	Email Templates	قوالب البريد	Email Templates	قوالب البريد	communication	t	2026-06-20 14:31:56.389	2026-06-22 17:06:55.311
18	notification-logs	Notification Logs	سجلات الإشعارات	Notification Logs	سجلات الإشعارات	communication	t	2026-06-20 14:31:56.469	2026-06-22 17:06:55.337
19	activity-types	Activity Types	أنواع الأنشطة	Activity Types	أنواع الأنشطة	settings	t	2026-06-20 14:31:56.493	2026-06-22 17:06:55.352
20	behavior-types	Behavior Types	أنواع السلوك	Behavior Types	أنواع السلوك	settings	t	2026-06-20 14:31:56.574	2026-06-22 17:06:55.38
21	participation-types	Participation Types	أنواع المشاركة	Participation Types	أنواع المشاركة	settings	t	2026-06-20 14:31:56.626	2026-06-22 17:06:55.404
22	penalty-types	Penalty Types	أنواع العقوبات	Penalty Types	أنواع العقوبات	settings	t	2026-06-20 14:31:56.667	2026-06-22 17:06:55.433
23	resource-types	Resource Types	أنواع الموارد	Resource Types	أنواع الموارد	settings	t	2026-06-20 14:31:56.7	2026-06-22 17:06:55.456
24	priority-types	Priority Types	أنواع الأولويات	Priority Types	أنواع الأولويات	settings	t	2026-06-20 14:31:56.728	2026-06-22 17:06:55.485
25	user-roles	User Roles	أدوار المستخدمين	User Roles	أدوار المستخدمين	settings	t	2026-06-20 14:31:56.763	2026-06-22 17:06:55.513
26	subject-types	Subject Types	أنواع المواد	Subject Types	أنواع المواد	settings	t	2026-06-20 14:31:56.806	2026-06-22 17:06:55.541
27	assessment-types	Assessment Types	أنواع التقييمات	Assessment Types	أنواع التقييمات	settings	t	2026-06-20 14:31:56.845	2026-06-22 17:06:55.565
28	question-types	Question Types	أنواع الأسئلة	Question Types	أنواع الأسئلة	settings	t	2026-06-20 14:31:56.88	2026-06-22 17:06:55.592
29	attendance-status-types	Attendance Status Types	حالة الحضور	Attendance Status Types	حالة الحضور	settings	t	2026-06-20 14:31:56.932	2026-06-22 17:06:55.62
30	enrollment-status-types	Enrollment Status Types	حالة التسجيل	Enrollment Status Types	حالة التسجيل	settings	t	2026-06-20 14:31:56.976	2026-06-22 17:06:55.65
31	my-attendance	My Attendance	حضوري	My Attendance	حضوري	student	t	2026-06-20 14:31:57.027	2026-06-22 17:06:55.673
8	instructor-availability-view	Instructor Availability (Calendar)	توفر المدرب (التقويم)	Instructor Availability (Calendar)	توفر المدرب (التقويم)	scheduling	t	2026-06-20 14:31:55.468	2026-06-22 17:06:55.106
9	room-availability-view	Room Availability (Calendar)	توفر الغرفة (التقويم)	Room Availability (Calendar)	توفر الغرفة (التقويم)	scheduling	t	2026-06-20 14:31:55.489	2026-06-22 17:06:55.113
10	instructor-availability-setup	Instructor Availability Setup	إعداد توفر المدرب	Instructor Availability Setup	إعداد توفر المدرب	scheduling	t	2026-06-20 14:31:55.55	2026-06-22 17:06:55.121
11	room-availability-setup	Room Availability Setup	إعداد توفر الغرفة	Room Availability Setup	إعداد توفر الغرفة	scheduling	t	2026-06-20 14:31:55.696	2026-06-22 17:06:55.15
12	rooms-management	Rooms Management	إدارة الغرف	Rooms Management	إدارة الغرف	scheduling	t	2026-06-20 14:31:55.802	2026-06-22 17:06:55.174
13	user-category-access	User Category Access	وصول المستخدم للفئة	User Category Access	وصول المستخدم للفئة	admin	t	2026-06-20 14:31:55.993	2026-06-22 17:06:55.196
\.


--
-- Data for Name: session_series; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.session_series (id, name, pattern, "recurrenceType", "recurrenceDays", "startDate", "endDate", "totalSessions", "completedSessions", "cancelledSessions", "classId", "instructorId", "classroomId", status, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: standup_attendances; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.standup_attendances (id, "userId", date, "statusId", notes, "createdBy", "updatedBy", "createdAt", "updatedAt", "programId") FROM stdin;
63	24	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	\N	2026-04-12 18:01:02.896	2026-04-12 18:01:02.896	1
64	23	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	\N	2026-04-12 18:01:02.971	2026-04-12 18:01:02.971	1
65	22	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	\N	2026-04-12 18:01:03.037	2026-04-12 18:01:03.037	1
66	21	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	\N	2026-04-12 18:01:03.168	2026-04-12 18:01:03.168	1
59	20	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	1	2026-04-12 17:41:38.338	2026-04-12 18:01:03.242	1
62	19	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	1	2026-04-12 17:59:54.233	2026-04-12 18:01:03.329	1
60	18	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	1	2026-04-12 17:41:41.926	2026-04-12 18:01:03.355	1
58	17	2026-04-12 00:00:00	10	STANDUP_CLINIC	1	1	2026-04-12 17:41:34.438	2026-04-12 18:01:03.381	1
68	17	2026-04-13 00:00:00	7	STANDUP_PRESENT	6	\N	2026-04-13 13:15:32.929	2026-04-13 13:15:32.929	1
69	17	2026-04-19 00:00:00	8	STANDUP_LATE	1	1	2026-04-19 09:04:11.759	2026-04-19 09:05:00.064	1
72	24	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.678	2026-04-22 05:58:23.678	1
73	23	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.708	2026-04-22 05:58:23.708	1
43	22	2026-04-11 00:00:00	7	STANDUP_PRESENT	\N	\N	2026-04-11 10:04:43.332	2026-04-11 10:26:27.69	1
44	21	2026-04-11 00:00:00	7	STANDUP_PRESENT	\N	\N	2026-04-11 10:04:43.354	2026-04-11 10:26:27.744	1
45	20	2026-04-11 00:00:00	7	STANDUP_PRESENT	\N	\N	2026-04-11 10:04:43.378	2026-04-11 10:26:27.938	1
46	19	2026-04-11 00:00:00	7	STANDUP_PRESENT	\N	\N	2026-04-11 10:04:43.403	2026-04-11 10:26:28.001	1
74	22	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.732	2026-04-22 05:58:23.732	1
75	21	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.756	2026-04-22 05:58:23.756	1
71	20	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	1	2026-04-22 05:57:56.396	2026-04-22 05:58:23.778	1
76	19	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.806	2026-04-22 05:58:23.806	1
77	18	2026-04-22 00:00:00	7	STANDUP_PRESENT	1	\N	2026-04-22 05:58:23.834	2026-04-22 05:58:23.834	1
70	17	2026-04-22 00:00:00	10	STANDUP_CLINIC	1	1	2026-04-22 05:57:17.203	2026-04-22 05:58:34.587	1
41	24	2026-04-11 00:00:00	8	STANDUP_LATE	\N	\N	2026-04-11 10:04:43.254	2026-04-11 11:28:04.959	1
40	18	2026-04-11 00:00:00	10	STANDUP_CLINIC	\N	\N	2026-04-11 09:52:37.551	2026-04-11 11:30:10.077	1
48	17	2026-04-11 00:00:00	10	STANDUP_CLINIC	\N	\N	2026-04-11 10:53:41.348	2026-04-11 12:00:22.422	1
42	23	2026-04-11 00:00:00	10	STANDUP_CLINIC	\N	\N	2026-04-11 10:04:43.311	2026-04-11 13:02:56.967	1
1	21	2026-05-07 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.747	2026-06-21 14:36:42.747	1
2	26	2026-05-07 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.756	2026-06-21 14:36:42.756	1
3	24	2026-05-09 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.763	2026-06-21 14:36:42.763	1
4	23	2026-05-10 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.767	2026-06-21 14:36:42.767	1
5	22	2026-05-11 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.771	2026-06-21 14:36:42.771	1
6	21	2026-05-12 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.778	2026-06-21 14:36:42.778	1
7	26	2026-05-12 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.78	2026-06-21 14:36:42.78	1
8	25	2026-05-13 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.792	2026-06-21 14:36:42.792	1
9	24	2026-05-14 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.801	2026-06-21 14:36:42.801	1
10	22	2026-05-16 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.806	2026-06-21 14:36:42.806	1
11	21	2026-05-17 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.809	2026-06-21 14:36:42.809	1
12	26	2026-05-17 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.811	2026-06-21 14:36:42.811	1
13	25	2026-05-18 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.82	2026-06-21 14:36:42.82	1
14	24	2026-05-19 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.83	2026-06-21 14:36:42.83	1
15	23	2026-05-20 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.852	2026-06-21 14:36:42.852	1
16	22	2026-05-21 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.863	2026-06-21 14:36:42.863	1
17	25	2026-05-23 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.866	2026-06-21 14:36:42.866	1
18	24	2026-05-24 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.873	2026-06-21 14:36:42.873	1
19	23	2026-05-25 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.88	2026-06-21 14:36:42.88	1
20	22	2026-05-26 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.888	2026-06-21 14:36:42.888	1
21	21	2026-05-27 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.905	2026-06-21 14:36:42.905	1
22	26	2026-05-27 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.906	2026-06-21 14:36:42.906	1
23	25	2026-05-28 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.911	2026-06-21 14:36:42.911	1
24	23	2026-05-30 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.92	2026-06-21 14:36:42.92	1
25	22	2026-05-31 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.93	2026-06-21 14:36:42.93	1
26	21	2026-06-01 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.948	2026-06-21 14:36:42.948	1
27	26	2026-06-01 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.951	2026-06-21 14:36:42.951	1
28	25	2026-06-02 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.958	2026-06-21 14:36:42.958	1
29	24	2026-06-03 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.963	2026-06-21 14:36:42.963	1
30	23	2026-06-04 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.967	2026-06-21 14:36:42.967	1
31	21	2026-06-06 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.976	2026-06-21 14:36:42.976	1
32	26	2026-06-06 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.979	2026-06-21 14:36:42.979	1
33	25	2026-06-07 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.987	2026-06-21 14:36:42.987	1
34	24	2026-06-08 06:00:00	7	\N	11	\N	2026-06-21 14:36:42.995	2026-06-21 14:36:42.995	1
35	23	2026-06-09 06:00:00	7	\N	11	\N	2026-06-21 14:36:43.001	2026-06-21 14:36:43.001	1
36	22	2026-06-10 06:00:00	7	\N	11	\N	2026-06-21 14:36:43.006	2026-06-21 14:36:43.006	1
37	21	2026-06-11 06:00:00	7	\N	11	\N	2026-06-21 14:36:43.014	2026-06-21 14:36:43.014	1
38	26	2026-06-11 06:00:00	7	\N	11	\N	2026-06-21 14:36:43.017	2026-06-21 14:36:43.017	1
39	24	2026-06-13 06:00:00	7	\N	11	\N	2026-06-21 14:36:43.027	2026-06-21 14:36:43.027	1
78	23	2026-06-14 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.322	2026-06-21 14:37:05.322	1
79	22	2026-06-15 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.337	2026-06-21 14:37:05.337	1
80	21	2026-06-16 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.346	2026-06-21 14:37:05.346	1
81	26	2026-06-16 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.351	2026-06-21 14:37:05.351	1
82	25	2026-06-17 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.367	2026-06-21 14:37:05.367	1
83	26	2026-06-17 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.372	2026-06-21 14:37:05.372	1
84	24	2026-06-18 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.399	2026-06-21 14:37:05.399	1
85	25	2026-06-18 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.404	2026-06-21 14:37:05.404	1
86	26	2026-06-18 06:00:00	8	\N	11	\N	2026-06-21 14:37:05.407	2026-06-21 14:37:05.407	1
87	22	2026-06-20 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.455	2026-06-21 14:37:05.455	1
88	23	2026-06-20 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.461	2026-06-21 14:37:05.461	1
89	24	2026-06-20 06:00:00	8	\N	11	\N	2026-06-21 14:37:05.472	2026-06-21 14:37:05.472	1
90	25	2026-06-20 06:00:00	9	\N	11	\N	2026-06-21 14:37:05.477	2026-06-21 14:37:05.477	1
91	26	2026-06-20 06:00:00	10	\N	11	\N	2026-06-21 14:37:05.481	2026-06-21 14:37:05.481	1
92	21	2026-06-21 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.53	2026-06-21 14:37:05.53	1
93	22	2026-06-21 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.532	2026-06-21 14:37:05.532	1
94	23	2026-06-21 06:00:00	8	\N	11	\N	2026-06-21 14:37:05.535	2026-06-21 14:37:05.535	1
95	24	2026-06-21 06:00:00	9	\N	11	\N	2026-06-21 14:37:05.539	2026-06-21 14:37:05.539	1
96	25	2026-06-21 06:00:00	10	\N	11	\N	2026-06-21 14:37:05.544	2026-06-21 14:37:05.544	1
97	26	2026-06-21 06:00:00	7	\N	11	\N	2026-06-21 14:37:05.548	2026-06-21 14:37:05.548	1
\.


--
-- Data for Name: student_marks; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.student_marks (id, "userId", "subjectId", "classId", "midTermExam", "finalExam", homework, "labsProjectResearch", quizzes, participation, attendance, "totalMarks", "letterGrade", "createdBy", "updatedBy", "createdAt", "updatedAt", "isRepeated", "gradeType") FROM stdin;
1	1	3	1	85	90	95	88	92	87	95	89.44999999999999	B+	\N	\N	2026-04-02 18:04:28.144	2026-04-02 18:21:42.098	f	calculated
2	2	3	1	85	90	95	88	92	87	95	89.44999999999999	B+	\N	\N	2026-04-02 18:22:03.892	2026-04-02 18:22:03.892	t	calculated
9	24	3	4	2	0	0	0	5	0	0	7	F	\N	\N	2026-04-03 19:14:04.581	2026-04-04 11:17:58.883	f	calculated
5	21	2	3	18	35	5	6	5	10	2	0	F	\N	\N	2026-04-03 07:47:35.385	2026-04-04 06:26:40.629	t	calculated
4	21	2	3	18	35	5	6	5	10	0	0	F	\N	\N	2026-04-03 07:33:27.211	2026-04-04 06:26:54.137	f	calculated
10	24	3	4	2	7	4	0	1	5	6	25	F	\N	\N	2026-04-03 19:30:45.267	2026-04-04 11:32:33.707	t	calculated
6	23	3	4	18	30	5	10	5	10	10	88	B	\N	\N	2026-04-03 10:19:21.414	2026-04-04 11:32:54.105	t	calculated
3	23	3	4	18	30	5	8	5	10	10	86	B	\N	1	2026-04-02 19:59:43.561	2026-04-04 12:28:34.955	f	calculated
\.


--
-- Data for Name: student_marks_history; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.student_marks_history (id, "studentMarksId", "userId", "subjectId", "classId", "actionType", "actionBy", "previousState", "newState", "changedFields", "isRepeated", "gradeType", "midTermExam", "finalExam", homework, "labsProjectResearch", quizzes, participation, attendance, "totalMarks", "letterGrade", "actionReason", "ipAddress", "userAgent", "createdAt") FROM stdin;
6	3	23	3	4	updated	1	"{\\"id\\":3,\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":5,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":88,\\"letterGrade\\":\\"B+\\",\\"createdBy\\":null,\\"updatedBy\\":1,\\"createdAt\\":\\"2026-04-02T19:59:43.561Z\\",\\"updatedAt\\":\\"2026-04-04T12:28:15.459Z\\"}"	"{\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":8,\\"quizzes\\":5,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":86,\\"letterGrade\\":\\"B\\"}"	"[{\\"field\\":\\"labsProjectResearch\\",\\"oldValue\\":10,\\"newValue\\":8,\\"fieldName\\":\\"Labs/Projects\\"}]"	f	calculated	18	30	5	8	5	10	10	86	B	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 12:28:34.971
5	6	23	3	4	updated	1	"{\\"id\\":6,\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":2,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":85,\\"letterGrade\\":\\"B-\\",\\"createdBy\\":null,\\"updatedBy\\":null,\\"createdAt\\":\\"2026-04-03T10:19:21.414Z\\",\\"updatedAt\\":\\"2026-04-04T10:57:11.488Z\\"}"	"{\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":5,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":88,\\"letterGrade\\":\\"B\\"}"	"[{\\"field\\":\\"quizzes\\",\\"oldValue\\":2,\\"newValue\\":5,\\"fieldName\\":\\"Quizzes\\"}]"	t	calculated	18	30	5	10	5	10	10	88	B	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 11:32:48.237
1	3	23	3	4	updated	1	"{\\"id\\":3,\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":1,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":84,\\"letterGrade\\":\\"B\\",\\"createdBy\\":null,\\"updatedBy\\":null,\\"createdAt\\":\\"2026-04-02T19:59:43.561Z\\",\\"updatedAt\\":\\"2026-04-04T11:28:09.327Z\\"}"	"{\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":2,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":85,\\"letterGrade\\":\\"B\\"}"	"[{\\"field\\":\\"quizzes\\",\\"oldValue\\":1,\\"newValue\\":2,\\"fieldName\\":\\"Quizzes\\"}]"	f	calculated	18	30	5	10	2	10	10	85	B	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 11:30:55.66
2	3	23	3	4	updated	1	"{\\"id\\":3,\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":2,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":85,\\"letterGrade\\":\\"B\\",\\"createdBy\\":null,\\"updatedBy\\":null,\\"createdAt\\":\\"2026-04-02T19:59:43.561Z\\",\\"updatedAt\\":\\"2026-04-04T11:30:55.631Z\\"}"	"{\\"userId\\":23,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":false,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":18,\\"finalExam\\":30,\\"homework\\":5,\\"labsProjectResearch\\":10,\\"quizzes\\":5,\\"participation\\":10,\\"attendance\\":10,\\"totalMarks\\":88,\\"letterGrade\\":\\"B+\\"}"	"[{\\"field\\":\\"quizzes\\",\\"oldValue\\":2,\\"newValue\\":5,\\"fieldName\\":\\"Quizzes\\"}]"	f	calculated	18	30	5	10	5	10	10	88	B+	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 11:31:33.659
3	10	24	3	4	updated	1	"{\\"id\\":10,\\"userId\\":24,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":2,\\"finalExam\\":0,\\"homework\\":0,\\"labsProjectResearch\\":0,\\"quizzes\\":1,\\"participation\\":5,\\"attendance\\":6,\\"totalMarks\\":14,\\"letterGrade\\":\\"F\\",\\"createdBy\\":null,\\"updatedBy\\":null,\\"createdAt\\":\\"2026-04-03T19:30:45.267Z\\",\\"updatedAt\\":\\"2026-04-04T11:23:33.257Z\\"}"	"{\\"userId\\":24,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":2,\\"finalExam\\":0,\\"homework\\":4,\\"labsProjectResearch\\":0,\\"quizzes\\":1,\\"participation\\":5,\\"attendance\\":6,\\"totalMarks\\":18,\\"letterGrade\\":\\"F\\"}"	"[{\\"field\\":\\"homework\\",\\"oldValue\\":0,\\"newValue\\":4,\\"fieldName\\":\\"Homework\\"}]"	t	calculated	2	0	4	0	1	5	6	18	F	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 11:32:28.869
4	10	24	3	4	updated	1	"{\\"id\\":10,\\"userId\\":24,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":2,\\"finalExam\\":0,\\"homework\\":4,\\"labsProjectResearch\\":0,\\"quizzes\\":1,\\"participation\\":5,\\"attendance\\":6,\\"totalMarks\\":18,\\"letterGrade\\":\\"F\\",\\"createdBy\\":null,\\"updatedBy\\":null,\\"createdAt\\":\\"2026-04-03T19:30:45.267Z\\",\\"updatedAt\\":\\"2026-04-04T11:32:28.854Z\\"}"	"{\\"userId\\":24,\\"subjectId\\":3,\\"classId\\":4,\\"isRepeated\\":true,\\"gradeType\\":\\"calculated\\",\\"midTermExam\\":2,\\"finalExam\\":7,\\"homework\\":4,\\"labsProjectResearch\\":0,\\"quizzes\\":1,\\"participation\\":5,\\"attendance\\":6,\\"totalMarks\\":25,\\"letterGrade\\":\\"F\\"}"	"[{\\"field\\":\\"finalExam\\",\\"oldValue\\":0,\\"newValue\\":7,\\"fieldName\\":\\"Final Exam\\"}]"	t	calculated	2	7	4	0	1	5	6	25	F	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-04 11:32:33.737
\.


--
-- Data for Name: subject_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.subject_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	CORE	Core Subject	موضوع أساسي	Fundamental subject for the program	t	\N	\N	2026-03-27 17:22:24.619	2026-03-27 17:22:24.619
2	ELECTIVE	Elective Subject	موضوع اختياري	Optional subject students can choose	t	\N	\N	2026-03-27 17:22:24.637	2026-03-27 17:22:24.637
3	SPECIALIZATION	Specialization Subject	موضوع تخصص	Subject for specific specialization track	t	\N	\N	2026-03-27 17:22:24.65	2026-03-27 17:22:24.65
4	ddddd	aaaa	bbbbb	cccc	f	1	1	2026-04-05 17:05:05.282	2026-04-06 12:58:15.151
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.subjects (id, code, "nameEn", "nameAr", credits, "isActive", "programId", "typeId", "requirementTypeId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn") FROM stdin;
3	WEB101	Web Development Basics	أساسيات تطوير الويب	4	t	1	1	1	1	\N	2026-03-27 17:53:15.871	2026-03-27 17:53:15.871	مقدمة في HTML و CSS و JavaScript	Introduction to HTML, CSS, and JavaScript
4	DB101	Database Management	إدارة قواعد البيانات	3	t	1	1	1	1	\N	2026-03-27 17:53:15.878	2026-03-27 17:53:15.878	مقدمة في تصميم قواعد البيانات و SQL	Introduction to database design and SQL
5	NET101	Network Fundamentals	أساسيات الشبكات	3	t	1	1	1	1	\N	2026-03-27 17:53:15.886	2026-03-27 17:53:15.886	مقدمة في شبكات الكمبيوتر والبروتوكولات	Introduction to computer networks and protocols
2	CS101	Computer Science Fundamentals	أساسيات علوم الكمبيوتر	3	t	1	1	1	1	1	2026-03-27 17:53:15.863	2026-03-28 12:23:58.266	مقدمة في مفاهيم علوم الكمبيوتر	Introduction to computer science concepts
6	ME102	Thermodynamics	الديناميكا الحرارية	3	t	2	1	1	1	\N	2026-04-01 13:26:47.236	2026-04-24 17:46:10.567	\N	Principles of thermodynamics and heat transfer
7	EE101	Circuit Analysis	تحليل الدوائر	4	t	3	1	1	1	\N	2026-04-01 13:26:47.251	2026-04-24 17:46:10.572	\N	Basic circuit theory and analysis
8	EE102	Digital Logic Design	تصيم المنطق الرقمي	3	t	3	1	1	1	\N	2026-04-01 13:26:47.26	2026-04-24 17:46:10.577	\N	Digital systems and logic design
\.


--
-- Data for Name: submission_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.submission_status_types (id, code, "nameEn", "nameAr", description, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	DRAFT	Draft	مسودة	Submission is in draft	\N	t	\N	\N	2026-03-27 17:22:49.043	2026-03-27 17:22:49.043
2	SUBMITTED	Submitted	مقدم	Assignment has been submitted	\N	t	\N	\N	2026-03-27 17:22:49.05	2026-03-27 17:22:49.05
3	UNDER_REVIEW	Under Review	قيد المراجعة	Submission is being reviewed	\N	t	\N	\N	2026-03-27 17:22:49.056	2026-03-27 17:22:49.056
4	GRADED	Graded	مصحح	Submission has been graded	\N	t	\N	\N	2026-03-27 17:22:49.061	2026-03-27 17:22:49.061
5	RETURNED	Returned	معاد	Submission returned for revision	\N	t	\N	\N	2026-03-27 17:22:49.066	2026-03-27 17:22:49.066
6	APPROVED	Approved	موافق عليه	Submission is approved	\N	t	\N	\N	2026-03-27 17:22:49.071	2026-03-27 17:22:49.071
7	LATE	Late	متأخر	Submission was late	\N	t	\N	\N	2026-03-27 17:22:49.077	2026-03-27 17:22:49.077
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.submissions (id, "userId", "activityId", content, "fileUrl", "fileName", "fileSize", "statusId", score, "maxScore", feedback, "gradedAt", "submittedAt", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: target_audience_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.target_audience_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	ALL	All Users	جميع المستخدمين	All system users	t	\N	\N	2026-03-27 17:22:48.63	2026-03-27 17:22:48.63
2	STUDENTS	Students	الطلاب	Students only	t	\N	\N	2026-03-27 17:22:48.638	2026-03-27 17:22:48.638
3	INSTRUCTORS	Instructors	المدربون	Instructors only	t	\N	\N	2026-03-27 17:22:48.644	2026-03-27 17:22:48.644
4	ADMIN	Administrators	المسؤولون	Administrators only	t	\N	\N	2026-03-27 17:22:48.649	2026-03-27 17:22:48.649
5	PROGRAM	Program Specific	برنامج محدد	Specific program users	t	\N	\N	2026-03-27 17:22:48.655	2026-03-27 17:22:48.655
6	CLASS	Class Specific	فصل محدد	Specific class users	t	\N	\N	2026-03-27 17:22:48.66	2026-03-27 17:22:48.66
\.


--
-- Data for Name: teacher_availability; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.teacher_availability (id, "userId", "availableDays", "maxSessionsPerDay", status, "contactPhone", "contactEmail", notes, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: template_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.template_types (id, code, "nameEn", "nameAr", description, icon, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	EMAIL	Email Template	قالب بريد إلكتروني	Email notification template	\N	t	\N	\N	2026-03-27 17:22:48.931	2026-03-27 17:22:48.931
2	SMS	SMS Template	قالب رسالة نصية	SMS notification template	\N	t	\N	\N	2026-03-27 17:22:48.939	2026-03-27 17:22:48.939
3	CERTIFICATE	Certificate Template	قالب شهادة	Certificate template	\N	t	\N	\N	2026-03-27 17:22:48.945	2026-03-27 17:22:48.945
4	REPORT	Report Template	قالب تقرير	Report generation template	\N	t	\N	\N	2026-03-27 17:22:48.95	2026-03-27 17:22:48.95
5	FORM	Form Template	قالب نموذج	Form template	\N	t	\N	\N	2026-03-27 17:22:48.956	2026-03-27 17:22:48.956
\.


--
-- Data for Name: time_slots; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.time_slots (id, "programId", "labelEn", "labelAr", "startTime", "endTime", "durationMinutes", "isBreak", "breakType", "sortOrder", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
2	1	Custom Break	استراحة مخصصة	03:00	05:00	120	t	TeaBreak	999	t	1	\N	2026-06-22 10:35:58.101	2026-06-22 17:04:10.044
1	1	Tea Break	استراحة شاي	06:00	10:00	240	t	\N	99	t	\N	\N	2026-06-21 03:59:51.551	2026-06-22 17:09:27.783
8	1	Custom Break 05:45-07:00	استراحة مخصصة 05:45-07:00	05:45	07:00	75	t	LunchBreak	9266	t	\N	\N	2026-06-22 13:34:26.211	2026-06-22 13:34:26.211
7	1	Custom Break 05:45-08:00	استراحة مخصصة 05:45-08:00	16:30	17:30	60	t	PrayerBreak	9341	t	\N	\N	2026-06-22 12:12:21.419	2026-06-22 13:53:08.216
\.


--
-- Data for Name: user_category_access; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_category_access (id, "userId", "categoryId", "roleId", "canView", "canManage", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "classId", "programId", "subjectId") FROM stdin;
1	15	2	\N	t	f	t	1	1	2026-05-31 15:05:32.324	2026-06-02 09:16:59.959	4	1	3
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_favorites (id, "userId", "favoriteType", "targetId", metadata, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_file_preferences; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_file_preferences ("userId", "fileId", starred, pinned) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_preferences (id, "userId", settings, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	1	{"dashboards": {"scheduling_summary": {"widgets": [{"id": "sched_cnt_programs", "title": "Total programs available for scheduling", "layout": {"h": 3, "w": 3, "x": 0, "y": 0}, "filters": [], "groupBy": "", "statKey": "totalPrograms", "titleAr": "إجمالي البرامج المتاحة للجدولة", "titleEn": "Total programs available for scheduling", "chartType": "count", "dateRange": "current", "dataSource": "schedulingPrograms", "aggregation": "count", "countMetric": "totalPrograms"}, {"id": "sched_cnt_subjects", "title": "Total subjects available for scheduling", "layout": {"h": 3, "w": 3, "x": 3, "y": 0}, "filters": [], "groupBy": "", "statKey": "totalSubjects", "titleAr": "إجمالي المواد المتاحة للجدولة", "titleEn": "Total subjects available for scheduling", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSubjects", "aggregation": "count", "countMetric": "totalSubjects"}, {"id": "sched_cnt_classes", "title": "Total scheduled classes in current filters", "layout": {"h": 3, "w": 3, "x": 6, "y": 0}, "filters": [], "groupBy": "", "statKey": "totalClasses", "titleAr": "إجمالي الصفوف المجدولة حسب الفلاتر الحالية", "titleEn": "Total scheduled classes in current filters", "chartType": "count", "dateRange": "current", "dataSource": "schedulingClasses", "aggregation": "count", "countMetric": "totalClasses"}, {"id": "sched_cnt_sessions", "title": "Total sessions in current period", "layout": {"h": 3, "w": 3, "x": 9, "y": 0}, "filters": [], "groupBy": "", "statKey": "totalSessions", "titleAr": "إجمالي الجلسات في الفترة الحالية", "titleEn": "Total sessions in current period", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "totalSessions"}, {"id": "sched_cnt_scheduled", "title": "Scheduled sessions count", "layout": {"h": 3, "w": 3, "x": 0, "y": 3}, "filters": [], "groupBy": "", "statKey": "scheduledCount", "titleAr": "عدد الجلسات المجدولة", "titleEn": "Scheduled sessions count", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "scheduledCount"}, {"id": "sched_cnt_in_progress", "title": "In-progress sessions count", "layout": {"h": 3, "w": 3, "x": 3, "y": 3}, "filters": [], "groupBy": "", "statKey": "inProgressCount", "titleAr": "عدد الجلسات الجارية", "titleEn": "In-progress sessions count", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "inProgressCount"}, {"id": "sched_cnt_completed", "title": "Completed sessions count", "layout": {"h": 3, "w": 3, "x": 6, "y": 3}, "filters": [], "groupBy": "", "statKey": "completedCount", "titleAr": "عدد الجلسات المكتملة", "titleEn": "Completed sessions count", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "completedCount"}, {"id": "sched_cnt_cancelled", "title": "Cancelled sessions count", "layout": {"h": 3, "w": 3, "x": 9, "y": 3}, "filters": [], "groupBy": "", "statKey": "cancelledCount", "titleAr": "عدد الجلسات الملغاة", "titleEn": "Cancelled sessions count", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "cancelledCount"}, {"id": "sched_cnt_rooms_used", "title": "Rooms used by scheduled sessions", "layout": {"h": 3, "w": 3, "x": 0, "y": 6}, "filters": [], "groupBy": "", "statKey": "uniqueClassrooms", "titleAr": "القاعات المستخدمة بواسطة الجلسات المجدولة", "titleEn": "Rooms used by scheduled sessions", "chartType": "count", "dateRange": "current", "dataSource": "schedulingRooms", "aggregation": "count", "countMetric": "uniqueClassrooms"}, {"id": "sched_cnt_instructors", "title": "Instructors assigned to sessions", "layout": {"h": 3, "w": 3, "x": 3, "y": 6}, "filters": [], "groupBy": "", "statKey": "uniqueInstructors", "titleAr": "المدرسون المعينون على جلسات", "titleEn": "Instructors assigned to sessions", "chartType": "count", "dateRange": "current", "dataSource": "schedulingTeachers", "aggregation": "count", "countMetric": "uniqueInstructors"}, {"id": "sched_cnt_this_week", "title": "Sessions scheduled this week", "layout": {"h": 3, "w": 3, "x": 6, "y": 6}, "filters": [], "groupBy": "", "statKey": "thisWeekSessions", "titleAr": "الجلسات المجدولة هذا الأسبوع", "titleEn": "Sessions scheduled this week", "chartType": "count", "dateRange": "current", "dataSource": "schedulingSessions", "aggregation": "count", "countMetric": "thisWeekSessions"}, {"id": "sched_cnt_holidays", "title": "Upcoming holidays in current period", "layout": {"h": 3, "w": 3, "x": 9, "y": 6}, "filters": [], "groupBy": "", "statKey": "holidayCount", "titleAr": "العطل القادمة في الفترة الحالية", "titleEn": "Upcoming holidays in current period", "chartType": "count", "dateRange": "current", "dataSource": "schedulingHolidays", "aggregation": "count", "countMetric": "holidayCount"}, {"id": "sched_session_timeline_all", "layout": {"h": 4, "w": 12, "x": 0, "y": 9}, "filters": [], "groupBy": "date", "titleAr": "عدد الجلسات يومياً حسب الفلاتر الحالية", "titleEn": "sessions per day in current filters", "chartType": "line", "dateRange": "current", "dataSource": "schedulingSessionTimeline", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_session_timeline_bar", "layout": {"h": 5, "w": 12, "x": 0, "y": 13}, "filters": [], "groupBy": "date", "titleAr": "عدد الجلسات يومياً حسب الفلاتر الحالية", "titleEn": "sessions per day in current filters", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingSessionTimeline", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_status_donut", "layout": {"h": 5, "w": 6, "x": 0, "y": 18}, "filters": [], "groupBy": "status", "titleAr": "الجلسات حسب الحالة (مجدولة، جارية، مكتملة، ملغاة)", "titleEn": "sessions by status (scheduled, in progress, completed, cancelled)", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingSessions", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_status_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 18}, "filters": [], "groupBy": "status", "titleAr": "عدد الجلسات حسب الحالة", "titleEn": "session count by status", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingSessions", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_subject_pie", "layout": {"h": 5, "w": 6, "x": 0, "y": 23}, "filters": [], "groupBy": "subjectName", "titleAr": "الجلسات المجدولة حسب المادة", "titleEn": "scheduled sessions by subject", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingSessions", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_teacher_sessions_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 23}, "filters": [], "groupBy": "instructorName", "titleAr": "عبء المدرس حسب عدد الجلسات", "titleEn": "instructor workload by session count", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingTeachers", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_teacher_hours_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 28}, "filters": [], "groupBy": "instructorName", "titleAr": "عبء المدرس حسب ساعات التدريس", "titleEn": "instructor workload by teaching hours", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingTeachers", "valueField": "teachingHours", "aggregation": "sum"}, {"id": "sched_teacher_capacity_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 28}, "filters": [], "groupBy": "instructorName", "titleAr": "عبء المدرس المعين مقابل نسبة استغلال السعة", "titleEn": "instructor assigned workload versus capacity utilization percent", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingInstructorWorkload", "valueField": "utilizationPct", "aggregation": "sum"}, {"id": "sched_course_load_bar", "layout": {"h": 5, "w": 12, "x": 0, "y": 33}, "filters": [], "groupBy": "courseLabel", "titleAr": "حمل جلسات الصف حسب البرنامج · المادة · الصف", "titleEn": "class session load by program · subject · class", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingCourses", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_class_coverage_pie", "layout": {"h": 5, "w": 6, "x": 0, "y": 38}, "filters": [], "groupBy": "coverageType", "titleAr": "تغطية الصفوف (بجلسات مقابل بدون جلسات)", "titleEn": "class coverage (with sessions vs without)", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingClassCoverage", "valueField": "classCount", "aggregation": "sum"}, {"id": "sched_holiday_overlap_donut", "layout": {"h": 5, "w": 6, "x": 6, "y": 38}, "filters": [], "groupBy": "impactType", "titleAr": "تأثير العطل (جلسات متأثرة بالعطل مقابل غير متأثرة)", "titleEn": "holiday impact (sessions affected by holidays versus unaffected)", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingHolidayOverlap", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_recurrence_donut", "layout": {"h": 5, "w": 6, "x": 0, "y": 43}, "filters": [], "groupBy": "recurrenceType", "titleAr": "الجلسات المتكررة مقابل الجلسات لمرة واحدة", "titleEn": "recurring sessions versus one-off sessions", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingRecurrenceBreakdown", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_breaks_donut", "layout": {"h": 5, "w": 6, "x": 6, "y": 43}, "filters": [], "groupBy": "breakType", "titleAr": "جلسات الاستراحة حسب نوع الاستراحة", "titleEn": "break sessions by break type", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingBreaks", "aggregation": "count"}, {"id": "sched_calendar_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 48}, "filters": [], "groupBy": "eventType", "titleAr": "مدخلات جدول اليوم حسب النوع", "titleEn": "today's schedule entries by type", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingCalendar", "valueField": "sessionCount", "aggregation": "sum"}, {"id": "sched_room_availability_donut", "layout": {"h": 5, "w": 6, "x": 6, "y": 48}, "filters": [], "groupBy": "status", "titleAr": "حالة توفر القاعات من بيانات الجدولة", "titleEn": "room availability status from scheduling data", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingRoomAvailability", "valueField": "slotCount", "aggregation": "sum"}, {"id": "sched_teacher_effort_list", "layout": {"h": 6, "w": 6, "x": 0, "y": 53}, "filters": [], "groupBy": "instructorName", "titleAr": "تفاصيل جهد المدرسين مع الجلسات والساعات والمواد والصفوف", "titleEn": "instructor effort details with sessions, hours, subjects, and classes", "chartType": "list", "dateRange": "current", "listLimit": 100, "dataSource": "schedulingTeachers", "aggregation": "count"}, {"id": "sched_workload_capacity_list", "layout": {"h": 6, "w": 6, "x": 6, "y": 53}, "filters": [], "groupBy": "instructorName", "titleAr": "ساعات المدرس المعينة وساعات السعة ونسبة الاستغلال", "titleEn": "instructor assigned hours, capacity hours, and utilization percent", "chartType": "list", "dateRange": "current", "listLimit": 100, "dataSource": "schedulingInstructorWorkload", "aggregation": "count"}, {"id": "sched_course_load_list", "layout": {"h": 6, "w": 12, "x": 0, "y": 59}, "filters": [], "groupBy": "courseLabel", "titleAr": "حمل جلسات الصف حسب البرنامج والمادة والصف والموقع", "titleEn": "class session load by program, subject, class, location", "chartType": "list", "dateRange": "current", "listLimit": 100, "dataSource": "schedulingCourses", "aggregation": "count"}, {"id": "sched_att_cnt_total", "title": "Total attendance records in period", "layout": {"h": 3, "w": 3, "x": 0, "y": 65}, "filters": [], "groupBy": "", "statKey": "totalRecords", "titleAr": "إجمالي سجلات الحضور في الفترة", "titleEn": "Total attendance records in period", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "totalRecords"}, {"id": "sched_att_cnt_class", "title": "Class attendance records", "layout": {"h": 3, "w": 3, "x": 3, "y": 65}, "filters": [], "groupBy": "", "statKey": "classRecords", "titleAr": "سجلات حضور الصف", "titleEn": "Class attendance records", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "classRecords"}, {"id": "sched_att_cnt_daily", "title": "Daily attendance records", "layout": {"h": 3, "w": 3, "x": 6, "y": 65}, "filters": [], "groupBy": "", "statKey": "dailyRecords", "titleAr": "سجلات الحضور اليومي", "titleEn": "Daily attendance records", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "dailyRecords"}, {"id": "sched_att_cnt_present", "title": "Present attendance records", "layout": {"h": 3, "w": 3, "x": 9, "y": 65}, "filters": [], "groupBy": "", "statKey": "presentCount", "titleAr": "سجلات الحضور (حاضر)", "titleEn": "Present attendance records", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "presentCount"}, {"id": "sched_att_cnt_absent", "title": "Absent attendance records", "layout": {"h": 3, "w": 3, "x": 0, "y": 68}, "filters": [], "groupBy": "", "statKey": "absentCount", "titleAr": "سجلات الغياب", "titleEn": "Absent attendance records", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "absentCount"}, {"id": "sched_att_cnt_late", "title": "Late attendance records", "layout": {"h": 3, "w": 3, "x": 3, "y": 68}, "filters": [], "groupBy": "", "statKey": "lateCount", "titleAr": "سجلات التأخير", "titleEn": "Late attendance records", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "lateCount"}, {"id": "sched_att_cnt_students", "title": "Unique students with attendance", "layout": {"h": 3, "w": 3, "x": 6, "y": 68}, "filters": [], "groupBy": "", "statKey": "uniqueStudents", "titleAr": "طلاب فريدون مسجل حضورهم", "titleEn": "Unique students with attendance", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "uniqueStudents"}, {"id": "sched_att_cnt_classes", "title": "Unique classes with attendance", "layout": {"h": 3, "w": 3, "x": 9, "y": 68}, "filters": [], "groupBy": "", "statKey": "uniqueClasses", "titleAr": "صفوف فريدة بسجلات حضور", "titleEn": "Unique classes with attendance", "chartType": "count", "dateRange": "current", "dataSource": "schedulingAttendanceOverview", "aggregation": "count", "countMetric": "uniqueClasses"}, {"id": "sched_att_type_donut", "layout": {"h": 5, "w": 6, "x": 0, "y": 71}, "filters": [], "groupBy": "attendanceTypeLabel", "titleAr": "حضور الصف مقابل الحضور اليومي", "titleEn": "class vs daily attendance volume", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingAttendanceByType", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_type_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 71}, "filters": [], "groupBy": "attendanceTypeLabel", "titleAr": "حضور الصف مقابل الحضور اليومي", "titleEn": "class vs daily attendance volume", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingAttendanceByType", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_class_status_pie", "layout": {"h": 5, "w": 6, "x": 0, "y": 76}, "filters": [], "groupBy": "status", "titleAr": "حضور الصف حسب الحالة", "titleEn": "class attendance by status", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingClassAttendanceByStatus", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_daily_status_pie", "layout": {"h": 5, "w": 6, "x": 6, "y": 76}, "filters": [], "groupBy": "status", "titleAr": "الحضور اليومي حسب الحالة", "titleEn": "daily attendance by status", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingDailyAttendanceByStatus", "drillScope": "daily", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_class_status_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 81}, "filters": [], "groupBy": "status", "titleAr": "حضور الصف حسب الحالة", "titleEn": "class attendance by status", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingClassAttendanceByStatus", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_daily_status_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 81}, "filters": [], "groupBy": "status", "titleAr": "الحضور اليومي حسب الحالة", "titleEn": "daily attendance by status", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingDailyAttendanceByStatus", "drillScope": "daily", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_status_donut", "layout": {"h": 5, "w": 6, "x": 0, "y": 86}, "filters": [], "groupBy": "status", "titleAr": "كل الحضور حسب الحالة", "titleEn": "all attendance by status", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingAttendanceByStatus", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_status_pie", "layout": {"h": 5, "w": 6, "x": 6, "y": 86}, "filters": [], "groupBy": "status", "titleAr": "كل الحضور حسب الحالة", "titleEn": "all attendance by status", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingAttendanceByStatus", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_class_program_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 91}, "filters": [], "groupBy": "programName", "titleAr": "حضور الصف حسب البرنامج", "titleEn": "class attendance by program", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingClassAttendanceByProgram", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_daily_program_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 91}, "filters": [], "groupBy": "programName", "titleAr": "الحضور اليومي حسب البرنامج", "titleEn": "daily attendance by program", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingDailyAttendanceByProgram", "drillScope": "daily", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_instructor_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 96}, "filters": [], "groupBy": "instructorName", "titleAr": "حضور الصف حسب المدرس", "titleEn": "class attendance by instructor", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingAttendanceByInstructor", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_class_bar", "layout": {"h": 5, "w": 6, "x": 6, "y": 96}, "filters": [], "groupBy": "className", "titleAr": "حضور الصف حسب الصف", "titleEn": "class attendance by class", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingClassAttendanceByClass", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_class_timeline_line", "layout": {"h": 5, "w": 6, "x": 0, "y": 101}, "filters": [], "groupBy": "date", "titleAr": "حضور الصف يومياً", "titleEn": "class attendance per day", "chartType": "line", "dateRange": "current", "dataSource": "schedulingClassAttendanceTimeline", "drillScope": "class", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_daily_timeline_line", "layout": {"h": 5, "w": 6, "x": 6, "y": 101}, "filters": [], "groupBy": "date", "titleAr": "الحضور اليومي يومياً", "titleEn": "daily attendance per day", "chartType": "line", "dateRange": "current", "dataSource": "schedulingDailyAttendanceTimeline", "drillScope": "daily", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_timeline_bar", "layout": {"h": 4, "w": 12, "x": 0, "y": 106}, "filters": [], "groupBy": "date", "titleAr": "كل سجلات الحضور يومياً", "titleEn": "all attendance records per day", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingAttendanceTimeline", "valueField": "recordCount", "aggregation": "sum", "listDetailSource": "schedulingAttendanceRecords"}, {"id": "sched_att_records_list", "layout": {"h": 6, "w": 12, "x": 0, "y": 110}, "filters": [], "groupBy": "status", "titleAr": "تفاصيل سجلات الحضور", "titleEn": "attendance records detail", "chartType": "list", "dateRange": "current", "listLimit": 200, "dataSource": "schedulingAttendanceRecords", "aggregation": "count"}, {"id": "sched_wf_cnt_total", "title": "Total workflow documents in period", "layout": {"h": 3, "w": 3, "x": 0, "y": 116}, "filters": [], "groupBy": "", "statKey": "totalDocuments", "titleAr": "Total workflow documents in period", "titleEn": "Total workflow documents in period", "chartType": "count", "dateRange": "current", "dataSource": "schedulingWorkflowOverview", "aggregation": "count", "countMetric": "totalDocuments"}, {"id": "sched_wf_status_pie", "layout": {"h": 5, "w": 6, "x": 0, "y": 119}, "filters": [], "groupBy": "status", "titleAr": "مستندات سير العمل حسب الحالة", "titleEn": "workflow documents by status", "chartType": "pie", "dateRange": "current", "dataSource": "schedulingWorkflowByStatus", "valueField": "documentCount", "aggregation": "sum"}, {"id": "sched_wf_type_donut", "layout": {"h": 5, "w": 6, "x": 6, "y": 119}, "filters": [], "groupBy": "workflowType", "titleAr": "مستندات سير العمل حسب النوع", "titleEn": "workflow documents by type", "chartType": "donut", "dateRange": "current", "dataSource": "schedulingWorkflowByType", "valueField": "documentCount", "aggregation": "sum"}, {"id": "sched_wf_program_bar", "layout": {"h": 5, "w": 6, "x": 0, "y": 124}, "filters": [], "groupBy": "program", "titleAr": "مستندات سير العمل حسب البرنامج", "titleEn": "workflow documents by program", "chartType": "bar", "dateRange": "current", "dataSource": "schedulingWorkflowByProgram", "valueField": "documentCount", "aggregation": "sum"}, {"id": "sched_wf_timeline_line", "layout": {"h": 5, "w": 6, "x": 6, "y": 124}, "filters": [], "groupBy": "date", "titleAr": "مستندات سير العمل يومياً", "titleEn": "workflow documents per day", "chartType": "line", "dateRange": "current", "dataSource": "schedulingWorkflowTimeline", "valueField": "documentCount", "aggregation": "sum"}], "pinnedIds": [], "updatedAt": "2026-06-22T10:31:51.268Z"}, "student_dashboard_overview_student": {"widgets": [{"id": "student_overview_1_1782070447054", "role": "student", "title": "Enrollment Status", "layout": {"h": 3, "w": 4, "x": 0, "y": 0}, "filters": [], "groupBy": "", "chartType": "count", "dashboard": "overview", "dateRange": "current", "dataSource": "enrollments", "aggregation": "count"}, {"id": "student_overview_2_1782070447054", "role": "student", "title": "Attendance Rate", "layout": {"h": 3, "w": 4, "x": 4, "y": 0}, "filters": [], "groupBy": "status", "chartType": "pie", "dashboard": "overview", "dateRange": "current", "dataSource": "attendance", "aggregation": "count"}, {"id": "student_overview_3_1782070447054", "role": "student", "title": "Recent Marks", "layout": {"h": 3, "w": 4, "x": 8, "y": 0}, "filters": [], "groupBy": "date", "chartType": "line", "dashboard": "overview", "dateRange": "last30", "dataSource": "marks", "aggregation": "average"}], "pinnedIds": [], "updatedAt": "2026-06-22T16:54:04.787Z"}}}	t	1	1	2026-06-21 10:23:18.207	2026-06-22 16:54:04.79
\.


--
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_role_assignments (id, "userId", "roleId", "assignedAt", "assignedBy") FROM stdin;
1	2	3	2026-04-13 08:30:40.176	1
2	3	3	2026-04-13 08:30:40.475	1
3	4	3	2026-04-13 08:30:40.77	1
4	5	3	2026-04-13 08:30:41.063	1
5	6	3	2026-04-13 08:30:41.378	1
6	7	2	2026-04-13 08:30:41.704	1
7	8	2	2026-04-13 08:30:42.07	1
8	9	2	2026-04-13 08:30:42.501	1
9	10	2	2026-04-13 08:30:42.969	1
10	11	2	2026-04-13 08:30:43.468	1
11	12	4	2026-04-13 08:30:43.896	1
12	13	4	2026-04-13 08:30:44.199	1
13	14	4	2026-04-13 08:30:44.524	1
14	15	4	2026-04-13 08:30:44.847	1
15	16	4	2026-04-13 08:30:45.184	1
16	17	5	2026-04-13 08:30:45.649	1
17	18	5	2026-04-13 08:30:45.931	1
18	19	5	2026-04-13 08:30:46.225	1
19	20	5	2026-04-13 08:30:46.534	1
20	25	5	2026-04-13 08:30:46.819	1
21	26	5	2026-04-13 08:30:47.107	1
22	1	1	2026-04-13 08:38:51.813	1
23	56	1	2026-04-16 18:33:56.756	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_roles (id, code, "nameEn", "nameAr", description, level, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	SUPER_ADMIN	Super Admin	مدير عام	\N	100	t	\N	\N	2026-03-27 17:21:24.308	2026-03-27 17:21:24.308
2	ADMIN	Administrator	مدير النظام	System Administrator	0	t	\N	\N	2026-03-27 17:22:24.431	2026-03-27 17:22:24.431
3	HR	HR Manager	مدير الموارد البشرية	Human Resources Manager	0	t	\N	\N	2026-03-27 17:22:24.466	2026-03-27 17:22:24.466
4	INSTRUCTOR	Instructor	مدرب	Course Instructor	0	t	\N	\N	2026-03-27 17:22:24.475	2026-03-27 17:22:24.475
5	STUDENT	Student	طالب	Student User	0	t	\N	\N	2026-03-27 17:22:24.484	2026-03-27 17:22:24.484
6	super_admin	Super Admin	مدير عام	Super Administrator with full access	5	t	\N	\N	2026-03-28 10:33:44.636	2026-03-28 10:33:44.636
7	admin	Admin	مدير	Administrator with management access	4	t	\N	\N	2026-03-28 10:33:44.783	2026-03-28 10:33:44.783
8	hr	HR	الموارد البشرية	Human Resources staff	3	t	\N	\N	2026-03-28 10:33:44.794	2026-03-28 10:33:44.794
9	instructor	Instructor	مدرب	Course instructor	2	t	\N	\N	2026-03-28 10:33:44.804	2026-03-28 10:33:44.804
10	student	Student	طالب	Student user	1	t	\N	\N	2026-03-28 10:33:44.814	2026-03-28 10:33:44.814
\.


--
-- Data for Name: user_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_status_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	ACTIVE	Active	نشط	User is active and can access the system	t	\N	\N	2026-03-27 17:22:24.504	2026-03-27 17:22:24.504
2	INACTIVE	Inactive	غير نشط	User is inactive and cannot access the system	t	\N	\N	2026-03-27 17:22:24.516	2026-03-27 17:22:24.516
3	SUSPENDED	Suspended	موقوف	User is temporarily suspended	t	\N	\N	2026-03-27 17:22:24.524	2026-03-27 17:22:24.524
4	PENDING	Pending	في الانتظار	User account is pending approval	t	\N	\N	2026-03-27 17:22:24.533	2026-03-27 17:22:24.533
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.users (id, email, "firstName", "lastName", "displayName", "realName", "studentNumber", sequence, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "keycloakId", "additionalImageUrl", "militaryIdImageUrl", "profileImageUrl", "qidImageUrl", "displayNameAr", "firstNameAr", "lastNameAr") FROM stdin;
1	shareef.hiasat@gmail.com	Shareef	Hiasat	Shareef Hiasat	\N	\N	\N	t	\N	1	2026-05-31 06:37:37.277	2026-06-19 19:43:05.502	79d3cc1c-1257-4b94-8b39-10ee509cfb9e	\N	\N	\N	\N	شريف حياة	شريف	حياة
4	testuser@example.com	Test	User	Test User Multi-Role	Test Real Name with Audit Fields	STU2024001	3	t	\N	\N	2026-03-28 11:41:38.116	2026-06-19 11:54:29.465	5b4cef9d-9c27-497e-981c-0791505cd7aa	\N	\N	\N	\N	Test User	Test	User
5	instructor@instructor.com	instructor	X	instructor X	\N	\N	\N	t	\N	\N	2026-03-29 07:34:43.98	2026-06-19 11:54:29.47	2c148802-ea59-4034-9b44-a6b8c1dbaefb	\N	\N	\N	\N	مدرب X	مدرب	X
54	superadmin@example.com	Super	Admin	Super Admin	\N	\N	\N	t	\N	\N	2026-04-15 16:25:51.759	2026-06-19 11:54:29.475	c551a18f-5a3f-40f4-ae20-9065f373f2e4	\N	\N	\N	\N	Super مشرف	Super	مشرف
26	student10@example.com	Noura	Al-Fahad	Noura Al-Fahad	\N	STU010	\N	t	\N	\N	2026-04-01 13:26:47.642	2026-06-19 11:54:29.537	temp-student10@example.com	\N	\N	\N	\N	نورا الفهد	نورا	الفهد
14	instructor3@example.com	Dr. James	Wilson	Dr. James Wilson	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.53	2026-06-19 11:54:29.51	temp-instructor3@example.com	\N	\N	\N	\N	دكتور جيمس ويلسون	دكتور جيميس	ويللسون
13	instructor2@example.com	Prof. Michael	Chen	Prof. Michael Chen	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.52	2026-06-19 11:54:29.507	temp-instructor2@example.com	\N	\N	\N	\N	بروف ميشيل شن	بروف ميشيل	شن
15	instructor4@example.com	Dr. Maria	Gonzalez	Dr. Maria Gonzalez	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.538	2026-06-19 11:54:29.512	temp-instructor4@example.com	\N	\N	\N	\N	دكتور ماريا غونزالس	ماريا	غونزالس
25	student9@example.com	Abdullah	Khalifa	Abdullah Khalifa	Abdullah H. Khalifa	STU009	\N	t	\N	\N	2026-04-01 13:26:47.635	2026-06-19 11:54:29.535	temp-student9@example.com	\N	\N	\N	\N	عبدالله خليفة	عبدالله	خليفة
10	admin4@example.com	William	Martinez	William Martinez	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.492	2026-06-19 11:54:29.501	temp-admin4@example.com	\N	\N	\N	\N	ويلياممارتينز	ويليام	مارتينيز
9	admin3@example.com	Jennifer	Garcia	Jennifer Garcia	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.484	2026-06-19 11:54:29.498	temp-admin3@example.com	\N	\N	\N	\N	جينيفر جارسيا	جينيفر	جارسيا
3	hr2@example.com	David	Miller	David Miller	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.422	2026-06-19 11:54:29.486	temp-hr2@example.com	\N	\N	\N	\N	ديفيد ميلر	ديفيد	ميلر
56	admin@keycloak.local	Keycloak	Admin	Keycloak Admin	\N	\N	\N	t	\N	\N	2026-04-16 18:33:56.756	2026-06-19 11:54:29.48	47bce160-7c70-4bea-a7fc-dd5af40a12ea	\N	\N	\N	\N	مشرف كي كلوك	Keycloak	مشرف
17	student1@example.com	Ahmed	Mohammed	Ahmed Mohammed	\N	STU001	\N	t	\N	\N	2026-04-01 13:26:47.557	2026-06-19 11:54:29.516	temp-student1@example.com	\N	\N	\N	\N	أحمد محمد	أحمد	محمد
18	student2@example.com	Fatima	Ali	Fatima Ali	\N	STU002	\N	t	\N	\N	2026-04-01 13:26:47.568	2026-06-19 11:54:29.519	temp-student2@example.com	\N	\N	\N	\N	فاطمة علي	فاطمة	علي
19	student3@example.com	Mohammed	Khalid	Mohammed Khalid	\N	STU003	\N	t	\N	\N	2026-04-01 13:26:47.578	2026-06-19 11:54:29.521	temp-student3@example.com	\N	\N	\N	\N	محمد خالد	محمد	خالد
20	student4@example.com	Aisha	Hassan	Aisha Hassan	\N	STU004	\N	t	\N	\N	2026-04-01 13:26:47.586	2026-06-19 11:54:29.523	temp-student4@example.com	\N	\N	\N	\N	عائشة حسن	عائشة	حسن
21	student5@example.com	Omar	Ibrahim	Omar Ibrahim	\N	STU005	\N	t	\N	\N	2026-04-01 13:26:47.595	2026-06-19 11:54:29.526	temp-student5@example.com	\N	\N	\N	\N	عمر إبراهيم	عمر	إبراهيم
22	student6@example.com	Layla	Ahmad	Layla Ahmad	\N	STU006	\N	t	\N	\N	2026-04-01 13:26:47.604	2026-06-19 11:54:29.528	temp-student6@example.com	\N	\N	\N	\N	ليلى أحمد	ليلى	أحمد
24	student8@example.com	Mariam	Saeed	Mariam Saeed	\N	STU008	\N	t	\N	\N	2026-04-01 13:26:47.627	2026-06-19 11:54:29.533	temp-student8@example.com	\N	\N	\N	\N	مريم سعيد	مريم	سعيد
101	pending@example.com	Pending	Sync	\N	\N	\N	\N	t	\N	\N	2026-05-03 17:09:04.765	2026-06-19 11:54:29.54	\N	\N	\N	\N	\N	معلق مزامنة	معلق	مزامنة
8	admin2@example.com	Michael	Davis	Michael Davis	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.475	2026-06-19 11:54:29.496	temp-admin2@example.com	\N	\N	\N	\N	مايكل  ديفيس	مايكل	ديفيس
7	admin1@example.com	Robert	Johnson	Robert Johnson	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.464	2026-06-19 11:54:29.492	temp-admin1@example.com	\N	\N	\N	\N	روبرت جونسن	روبرت	جونسون
6	hr5@example.com	Lisa	Anderson	Lisa Anderson	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.454	2026-06-19 11:54:29.489	temp-hr5@example.com	\N	\N	\N	\N	ليزا اندرسون	ليزا	اندرسون
2	hr1@example.com	Emily	Brown	Emily Brown	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.4	2026-06-19 11:54:29.483	temp-hr1@example.com	\N	\N	\N	\N	ايميلي براون	ايميل	براون
23	student7@example.com	Youssef	Mahmoud	Youssef Mahmoud	\N	STU007	\N	t	\N	\N	2026-04-01 13:26:47.619	2026-06-19 11:54:29.531	temp-student7@example.com	\N	\N	\N	\N	يوسف محمود	يوسف	محمود
11	admin5@example.com	Patricia	Rodriguez	Patricia Rodriguez	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.501	2026-06-19 11:54:29.503	temp-admin5@example.com	\N	\N	\N	\N	باتريكا رودريغز	باتريكا	رودريغيز
16	instructor5@example.com	Prof. Ahmed	Khalid	Prof. Ahmed Khalid	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.548	2026-06-19 11:54:29.514	temp-instructor5@example.com	\N	\N	\N	\N	بروف خالد	احمد	خالد
12	instructor1@example.com	Dr. Sarah	Johnson	Dr. Sarah Johnson	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.511	2026-06-19 11:54:29.505	temp-instructor1@example.com	\N	\N	\N	\N	سارة جونسون	دكتور سارة	جونسون
57	hr3@example.com	Sarah	Wilson	Sarah Wilson	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.436	2026-06-19 11:54:29.542	temp-hr3@example.com	\N	\N	\N	\N	سارة ويلسون	سارة	ويلسون
58	hr4@example.com	James	Taylor	James Taylor	\N	\N	\N	t	\N	\N	2026-04-01 13:26:47.445	2026-06-19 11:54:29.544	temp-hr4@example.com	\N	\N	\N	\N	جيمس تايلون	جيمس	تايلور
\.


--
-- Data for Name: workflow_comments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_comments (id, "workflowDocumentId", "authorId", comment, action, "createdAt") FROM stdin;
\.


--
-- Data for Name: workflow_definitions; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_definitions (id, code, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
0cc614ae-69b6-462a-948b-c4eb58559ed3	ATTENDANCE_REPORT	Attendance Report Approval	Admin submits monthly attendance report; HR audits, approves or requests revisions; rejected reports return to Admin for re-upload; approved reports are filed.	t	2026-04-21 06:33:31.545	2026-04-21 06:33:31.545
\.


--
-- Data for Name: workflow_documents; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_documents (id, "workflowType", title, description, status, "fileId", "fileVersionId", "submitterId", "currentAssigneeId", "classId", "instructorId", date, program, subject, "reviewCycleCount", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workflow_history; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_history (id, "instanceId", "stepId", "eventType", payload, comment, "actorId", "createdAt") FROM stdin;
\.


--
-- Data for Name: workflow_instances; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_instances (id, "definitionId", "fileId", context, status, "currentStageId", "assignedUserId", "assignedRole", "rejectionReason", "revisionCount", "lastRevisedAt", "initiatedById", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workflow_stages; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_stages (id, "definitionId", "stageOrder", code, name, "assignedRole", "allowedActions", "onApproveGoto", "onRejectGoto", "isTerminalApproved", "slaHours") FROM stdin;
a6c28066-b477-46b2-96d3-1bca6d4b4a0b	0cc614ae-69b6-462a-948b-c4eb58559ed3	1	ADMIN_SUBMIT	Admin Submission	admin	{SUBMIT}	2	\N	f	\N
eaa9835b-fd7c-41d8-8337-a8650d07754e	0cc614ae-69b6-462a-948b-c4eb58559ed3	2	HR_REVIEW	HR Review	hr	{APPROVE,REJECT}	3	1	f	48
2103e9a5-54f3-413f-a994-af9c8cc56ce8	0cc614ae-69b6-462a-948b-c4eb58559ed3	3	HR_FILED	Filed	hr	{}	\N	\N	t	\N
\.


--
-- Data for Name: workflow_status_history; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_status_history (id, "workflowDocumentId", "fromStatus", "toStatus", "actorId", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.workflow_steps (id, "instanceId", "stageId", "assignedUserId", "assignedRole", status, "actionTaken", comments, "actedById", "enteredAt", "completedAt", "dueAt") FROM stdin;
\.


--
-- Name: academic_terms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.academic_terms_id_seq', 1, false);


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activities_id_seq', 1, false);


--
-- Name: activity_log_action_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activity_log_action_types_id_seq', 1, false);


--
-- Name: activity_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activity_types_id_seq', 1, false);


--
-- Name: admin_scopes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.admin_scopes_id_seq', 1, false);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.answers_id_seq', 1, false);


--
-- Name: assessment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.assessment_types_id_seq', 1, false);


--
-- Name: attendance_amendments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.attendance_amendments_id_seq', 1, false);


--
-- Name: attendance_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.attendance_status_types_id_seq', 16, true);


--
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.attendances_id_seq', 102, true);


--
-- Name: behavior_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.behavior_types_id_seq', 1, false);


--
-- Name: behaviors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.behaviors_id_seq', 1, false);


--
-- Name: break_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.break_sessions_id_seq', 13, true);


--
-- Name: category_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.category_types_id_seq', 1, false);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.classes_id_seq', 2, true);


--
-- Name: classroom_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.classroom_availability_id_seq', 4, true);


--
-- Name: classroom_availability_slot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.classroom_availability_slot_id_seq', 10, true);


--
-- Name: classrooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.classrooms_id_seq', 1, true);


--
-- Name: config_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.config_types_id_seq', 1, false);


--
-- Name: enrollment_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.enrollment_status_types_id_seq', 1, false);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- Name: flexible_schedule_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.flexible_schedule_sessions_id_seq', 1, false);


--
-- Name: help_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.help_items_id_seq', 1, false);


--
-- Name: holidays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.holidays_id_seq', 25, true);


--
-- Name: instructor_assignment_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.instructor_assignment_history_id_seq', 3, true);


--
-- Name: instructor_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.instructor_availability_id_seq', 2, true);


--
-- Name: instructor_availability_slot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.instructor_availability_slot_id_seq', 3, true);


--
-- Name: marks_distributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.marks_distributions_id_seq', 1, false);


--
-- Name: notification_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.notification_log_id_seq', 1, false);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 3, true);


--
-- Name: operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.operations_id_seq', 204, true);


--
-- Name: participation_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.participation_types_id_seq', 1, false);


--
-- Name: participations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.participations_id_seq', 1, false);


--
-- Name: penalties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.penalties_id_seq', 1, false);


--
-- Name: penalty_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.penalty_types_id_seq', 1, false);


--
-- Name: permission_denial_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.permission_denial_audit_id_seq', 1, false);


--
-- Name: priority_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.priority_types_id_seq', 1, false);


--
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.programs_id_seq', 2, true);


--
-- Name: question_difficulty_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.question_difficulty_types_id_seq', 1, false);


--
-- Name: question_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.question_types_id_seq', 1, false);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, false);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.quiz_attempts_id_seq', 1, false);


--
-- Name: quiz_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.quiz_status_types_id_seq', 1, false);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: requirement_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.requirement_types_id_seq', 1, false);


--
-- Name: resource_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.resource_types_id_seq', 1, false);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.resources_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 997, true);


--
-- Name: schedule_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.schedule_sessions_id_seq', 1, false);


--
-- Name: schedule_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.schedule_types_id_seq', 1, false);


--
-- Name: scheduled_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.scheduled_sessions_id_seq', 60, true);


--
-- Name: screens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.screens_id_seq', 211, true);


--
-- Name: session_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.session_series_id_seq', 1, false);


--
-- Name: standup_attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.standup_attendances_id_seq', 97, true);


--
-- Name: student_marks_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.student_marks_history_id_seq', 1, false);


--
-- Name: student_marks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.student_marks_id_seq', 1, false);


--
-- Name: subject_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.subject_types_id_seq', 1, false);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.subjects_id_seq', 5, true);


--
-- Name: submission_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.submission_status_types_id_seq', 1, false);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: target_audience_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.target_audience_types_id_seq', 1, false);


--
-- Name: teacher_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.teacher_availability_id_seq', 1, false);


--
-- Name: template_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.template_types_id_seq', 1, false);


--
-- Name: time_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.time_slots_id_seq', 8, true);


--
-- Name: user_category_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_category_access_id_seq', 3, true);


--
-- Name: user_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_favorites_id_seq', 1, false);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, true);


--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_role_assignments_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 1, false);


--
-- Name: user_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_status_types_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: workflow_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.workflow_comments_id_seq', 1, false);


--
-- Name: workflow_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.workflow_documents_id_seq', 1, false);


--
-- Name: workflow_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.workflow_history_id_seq', 1, false);


--
-- Name: workflow_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.workflow_status_history_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: academic_terms academic_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_log_action_types activity_log_action_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_log_action_types
    ADD CONSTRAINT activity_log_action_types_pkey PRIMARY KEY (id);


--
-- Name: activity_types activity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT activity_types_pkey PRIMARY KEY (id);


--
-- Name: admin_scopes admin_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes
    ADD CONSTRAINT admin_scopes_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: assessment_types assessment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.assessment_types
    ADD CONSTRAINT assessment_types_pkey PRIMARY KEY (id);


--
-- Name: attendance_amendments attendance_amendments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments
    ADD CONSTRAINT attendance_amendments_pkey PRIMARY KEY (id);


--
-- Name: attendance_status_types attendance_status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_status_types
    ADD CONSTRAINT attendance_status_types_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: behavior_types behavior_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behavior_types
    ADD CONSTRAINT behavior_types_pkey PRIMARY KEY (id);


--
-- Name: behaviors behaviors_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT behaviors_pkey PRIMARY KEY (id);


--
-- Name: break_sessions break_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions
    ADD CONSTRAINT break_sessions_pkey PRIMARY KEY (id);


--
-- Name: category_types category_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT category_types_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: classroom_availability classroom_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability
    ADD CONSTRAINT classroom_availability_pkey PRIMARY KEY (id);


--
-- Name: classroom_availability_slot classroom_availability_slot_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability_slot
    ADD CONSTRAINT classroom_availability_slot_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: config_types config_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.config_types
    ADD CONSTRAINT config_types_pkey PRIMARY KEY (id);


--
-- Name: enrollment_status_types enrollment_status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollment_status_types
    ADD CONSTRAINT enrollment_status_types_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: file_activities file_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_activities
    ADD CONSTRAINT file_activities_pkey PRIMARY KEY (id);


--
-- Name: file_comments file_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_comments
    ADD CONSTRAINT file_comments_pkey PRIMARY KEY (id);


--
-- Name: file_shares file_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_shares
    ADD CONSTRAINT file_shares_pkey PRIMARY KEY (id);


--
-- Name: file_versions file_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT flexible_schedule_sessions_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: help_items help_items_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items
    ADD CONSTRAINT help_items_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: instructor_assignment_history instructor_assignment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT instructor_assignment_history_pkey PRIMARY KEY (id);


--
-- Name: instructor_availability instructor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT instructor_availability_pkey PRIMARY KEY (id);


--
-- Name: instructor_availability_slot instructor_availability_slot_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability_slot
    ADD CONSTRAINT instructor_availability_slot_pkey PRIMARY KEY (id);


--
-- Name: marks_distributions marks_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.marks_distributions
    ADD CONSTRAINT marks_distributions_pkey PRIMARY KEY (id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- Name: participation_types participation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participation_types
    ADD CONSTRAINT participation_types_pkey PRIMARY KEY (id);


--
-- Name: participations participations_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_pkey PRIMARY KEY (id);


--
-- Name: penalties penalties_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT penalties_pkey PRIMARY KEY (id);


--
-- Name: penalty_types penalty_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalty_types
    ADD CONSTRAINT penalty_types_pkey PRIMARY KEY (id);


--
-- Name: permission_denial_audit permission_denial_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.permission_denial_audit
    ADD CONSTRAINT permission_denial_audit_pkey PRIMARY KEY (id);


--
-- Name: priority_types priority_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.priority_types
    ADD CONSTRAINT priority_types_pkey PRIMARY KEY (id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: public_links public_links_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT public_links_pkey PRIMARY KEY (id);


--
-- Name: question_difficulty_types question_difficulty_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_difficulty_types
    ADD CONSTRAINT question_difficulty_types_pkey PRIMARY KEY (id);


--
-- Name: question_types question_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_types
    ADD CONSTRAINT question_types_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_status_types quiz_status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_status_types
    ADD CONSTRAINT quiz_status_types_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: requirement_types requirement_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.requirement_types
    ADD CONSTRAINT requirement_types_pkey PRIMARY KEY (id);


--
-- Name: resource_types resource_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resource_types
    ADD CONSTRAINT resource_types_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: schedule_sessions schedule_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT schedule_sessions_pkey PRIMARY KEY (id);


--
-- Name: schedule_types schedule_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types
    ADD CONSTRAINT schedule_types_pkey PRIMARY KEY (id);


--
-- Name: scheduled_sessions scheduled_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT scheduled_sessions_pkey PRIMARY KEY (id);


--
-- Name: screens screens_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.screens
    ADD CONSTRAINT screens_pkey PRIMARY KEY (id);


--
-- Name: session_series session_series_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT session_series_pkey PRIMARY KEY (id);


--
-- Name: standup_attendances standup_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT standup_attendances_pkey PRIMARY KEY (id);


--
-- Name: student_marks_history student_marks_history_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks_history
    ADD CONSTRAINT student_marks_history_pkey PRIMARY KEY (id);


--
-- Name: student_marks student_marks_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT student_marks_pkey PRIMARY KEY (id);


--
-- Name: subject_types subject_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_types
    ADD CONSTRAINT subject_types_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: submission_status_types submission_status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submission_status_types
    ADD CONSTRAINT submission_status_types_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: target_audience_types target_audience_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.target_audience_types
    ADD CONSTRAINT target_audience_types_pkey PRIMARY KEY (id);


--
-- Name: teacher_availability teacher_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.teacher_availability
    ADD CONSTRAINT teacher_availability_pkey PRIMARY KEY (id);


--
-- Name: template_types template_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types
    ADD CONSTRAINT template_types_pkey PRIMARY KEY (id);


--
-- Name: time_slots time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);


--
-- Name: user_category_access user_category_access_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT user_category_access_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_file_preferences user_file_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_file_preferences
    ADD CONSTRAINT user_file_preferences_pkey PRIMARY KEY ("userId", "fileId");


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_status_types user_status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_status_types
    ADD CONSTRAINT user_status_types_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_comments workflow_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_comments
    ADD CONSTRAINT workflow_comments_pkey PRIMARY KEY (id);


--
-- Name: workflow_definitions workflow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_pkey PRIMARY KEY (id);


--
-- Name: workflow_documents workflow_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT workflow_documents_pkey PRIMARY KEY (id);


--
-- Name: workflow_history workflow_history_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT workflow_history_pkey PRIMARY KEY (id);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflow_stages workflow_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_pkey PRIMARY KEY (id);


--
-- Name: workflow_status_history workflow_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_status_history
    ADD CONSTRAINT workflow_status_history_pkey PRIMARY KEY (id);


--
-- Name: workflow_steps workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: academic_terms_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX academic_terms_code_key ON public.academic_terms USING btree (code);


--
-- Name: activity_log_action_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX activity_log_action_types_code_key ON public.activity_log_action_types USING btree (code);


--
-- Name: activity_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX activity_types_code_key ON public.activity_types USING btree (code);


--
-- Name: admin_scopes_userId_scopeType_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "admin_scopes_userId_scopeType_idx" ON public.admin_scopes USING btree ("userId", "scopeType");


--
-- Name: assessment_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX assessment_types_code_key ON public.assessment_types USING btree (code);


--
-- Name: attendance_amendments_amendedAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "attendance_amendments_amendedAt_idx" ON public.attendance_amendments USING btree ("amendedAt");


--
-- Name: attendance_amendments_attendanceId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "attendance_amendments_attendanceId_idx" ON public.attendance_amendments USING btree ("attendanceId");


--
-- Name: attendance_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX attendance_status_types_code_key ON public.attendance_status_types USING btree (code);


--
-- Name: attendances_userId_classId_date_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "attendances_userId_classId_date_key" ON public.attendances USING btree ("userId", "classId", date);


--
-- Name: behavior_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX behavior_types_code_key ON public.behavior_types USING btree (code);


--
-- Name: break_sessions_classroomId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "break_sessions_classroomId_date_idx" ON public.break_sessions USING btree ("classroomId", date);


--
-- Name: break_sessions_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX break_sessions_date_idx ON public.break_sessions USING btree (date);


--
-- Name: break_sessions_instructorUserId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "break_sessions_instructorUserId_date_idx" ON public.break_sessions USING btree ("instructorUserId", date);


--
-- Name: break_sessions_seriesId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "break_sessions_seriesId_idx" ON public.break_sessions USING btree ("seriesId");


--
-- Name: break_sessions_timeSlotId_date_instructorUserId_classroomId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "break_sessions_timeSlotId_date_instructorUserId_classroomId_key" ON public.break_sessions USING btree ("timeSlotId", date, "instructorUserId", "classroomId");


--
-- Name: category_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX category_types_code_key ON public.category_types USING btree (code);


--
-- Name: classes_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX classes_code_key ON public.classes USING btree (code);


--
-- Name: classes_substituteInstructorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "classes_substituteInstructorId_idx" ON public.classes USING btree ("substituteInstructorId");


--
-- Name: classroom_availability_classroomId_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "classroom_availability_classroomId_startDate_endDate_idx" ON public.classroom_availability USING btree ("classroomId", "startDate", "endDate");


--
-- Name: classroom_availability_slot_availabilityId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "classroom_availability_slot_availabilityId_idx" ON public.classroom_availability_slot USING btree ("availabilityId");


--
-- Name: classrooms_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX classrooms_code_key ON public.classrooms USING btree (code);


--
-- Name: config_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX config_types_code_key ON public.config_types USING btree (code);


--
-- Name: enrollment_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX enrollment_status_types_code_key ON public.enrollment_status_types USING btree (code);


--
-- Name: enrollments_userId_classId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "enrollments_userId_classId_key" ON public.enrollments USING btree ("userId", "classId");


--
-- Name: file_shares_fileId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "file_shares_fileId_idx" ON public.file_shares USING btree ("fileId");


--
-- Name: file_shares_folderId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "file_shares_folderId_idx" ON public.file_shares USING btree ("folderId");


--
-- Name: file_shares_subjectRole_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "file_shares_subjectRole_idx" ON public.file_shares USING btree ("subjectRole");


--
-- Name: file_shares_subjectUserId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "file_shares_subjectUserId_idx" ON public.file_shares USING btree ("subjectUserId");


--
-- Name: file_versions_fileId_isCurrent_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "file_versions_fileId_isCurrent_idx" ON public.file_versions USING btree ("fileId", "isCurrent");


--
-- Name: file_versions_fileId_versionNumber_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "file_versions_fileId_versionNumber_key" ON public.file_versions USING btree ("fileId", "versionNumber");


--
-- Name: file_versions_s3Key_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "file_versions_s3Key_key" ON public.file_versions USING btree ("s3Key");


--
-- Name: files_currentVersionId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "files_currentVersionId_key" ON public.files USING btree ("currentVersionId");


--
-- Name: files_folderId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "files_folderId_idx" ON public.files USING btree ("folderId");


--
-- Name: files_isDeleted_deletedAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "files_isDeleted_deletedAt_idx" ON public.files USING btree ("isDeleted", "deletedAt");


--
-- Name: files_ownerId_isDeleted_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "files_ownerId_isDeleted_idx" ON public.files USING btree ("ownerId", "isDeleted");


--
-- Name: files_publicLinkToken_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "files_publicLinkToken_key" ON public.files USING btree ("publicLinkToken");


--
-- Name: files_s3Key_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "files_s3Key_key" ON public.files USING btree ("s3Key");


--
-- Name: flexible_schedule_sessions_classroomId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "flexible_schedule_sessions_classroomId_date_idx" ON public.flexible_schedule_sessions USING btree ("classroomId", date);


--
-- Name: flexible_schedule_sessions_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX flexible_schedule_sessions_date_idx ON public.flexible_schedule_sessions USING btree (date);


--
-- Name: flexible_schedule_sessions_instructorUserId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "flexible_schedule_sessions_instructorUserId_date_idx" ON public.flexible_schedule_sessions USING btree ("instructorUserId", date);


--
-- Name: flexible_schedule_sessions_programId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "flexible_schedule_sessions_programId_date_idx" ON public.flexible_schedule_sessions USING btree ("programId", date);


--
-- Name: folders_ownerId_isDeleted_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "folders_ownerId_isDeleted_idx" ON public.folders USING btree ("ownerId", "isDeleted");


--
-- Name: folders_parentId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "folders_parentId_idx" ON public.folders USING btree ("parentId");


--
-- Name: folders_parentId_name_ownerId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "folders_parentId_name_ownerId_key" ON public.folders USING btree ("parentId", name, "ownerId");


--
-- Name: help_items_page_section_key_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX help_items_page_section_key_key ON public.help_items USING btree (page, section, key);


--
-- Name: holidays_seriesId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "holidays_seriesId_idx" ON public.holidays USING btree ("seriesId");


--
-- Name: holidays_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "holidays_startDate_endDate_idx" ON public.holidays USING btree ("startDate", "endDate");


--
-- Name: instructor_assignment_history_changedAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_assignment_history_changedAt_idx" ON public.instructor_assignment_history USING btree ("changedAt");


--
-- Name: instructor_assignment_history_classId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_assignment_history_classId_idx" ON public.instructor_assignment_history USING btree ("classId");


--
-- Name: instructor_assignment_history_newInstructorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_assignment_history_newInstructorId_idx" ON public.instructor_assignment_history USING btree ("newInstructorId");


--
-- Name: instructor_assignment_history_oldInstructorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_assignment_history_oldInstructorId_idx" ON public.instructor_assignment_history USING btree ("oldInstructorId");


--
-- Name: instructor_assignment_history_sessionId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_assignment_history_sessionId_idx" ON public.instructor_assignment_history USING btree ("sessionId");


--
-- Name: instructor_availability_instructorUserId_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_availability_instructorUserId_startDate_endDate_idx" ON public.instructor_availability USING btree ("instructorUserId", "startDate", "endDate");


--
-- Name: instructor_availability_slot_availabilityId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "instructor_availability_slot_availabilityId_idx" ON public.instructor_availability_slot USING btree ("availabilityId");


--
-- Name: marks_distributions_subjectId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "marks_distributions_subjectId_key" ON public.marks_distributions USING btree ("subjectId");


--
-- Name: notification_deliveries_notificationId_channel_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notification_deliveries_notificationId_channel_idx" ON public.notification_deliveries USING btree ("notificationId", channel);


--
-- Name: notification_log_sentAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notification_log_sentAt_idx" ON public.notification_log USING btree ("sentAt");


--
-- Name: notification_log_sessionId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notification_log_sessionId_idx" ON public.notification_log USING btree ("sessionId");


--
-- Name: notification_log_type_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX notification_log_type_idx ON public.notification_log USING btree (type);


--
-- Name: notification_log_userId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notification_log_userId_idx" ON public.notification_log USING btree ("userId");


--
-- Name: notification_preferences_userId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "notification_preferences_userId_key" ON public.notification_preferences USING btree ("userId");


--
-- Name: notifications_event_createdAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notifications_event_createdAt_idx" ON public.notifications USING btree (event, "createdAt");


--
-- Name: notifications_userId_category_createdAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notifications_userId_category_createdAt_idx" ON public.notifications USING btree ("userId", category, "createdAt");


--
-- Name: notifications_userId_isRead_isArchived_createdAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "notifications_userId_isRead_isArchived_createdAt_idx" ON public.notifications USING btree ("userId", "isRead", "isArchived", "createdAt");


--
-- Name: operations_operationKey_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "operations_operationKey_key" ON public.operations USING btree ("operationKey");


--
-- Name: participation_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX participation_types_code_key ON public.participation_types USING btree (code);


--
-- Name: penalty_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX penalty_types_code_key ON public.penalty_types USING btree (code);


--
-- Name: permission_denial_audit_createdAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "permission_denial_audit_createdAt_idx" ON public.permission_denial_audit USING btree ("createdAt");


--
-- Name: permission_denial_audit_userId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "permission_denial_audit_userId_idx" ON public.permission_denial_audit USING btree ("userId");


--
-- Name: priority_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX priority_types_code_key ON public.priority_types USING btree (code);


--
-- Name: programs_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX programs_code_key ON public.programs USING btree (code);


--
-- Name: public_links_fileId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "public_links_fileId_idx" ON public.public_links USING btree ("fileId");


--
-- Name: public_links_folderId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "public_links_folderId_idx" ON public.public_links USING btree ("folderId");


--
-- Name: public_links_token_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX public_links_token_key ON public.public_links USING btree (token);


--
-- Name: question_difficulty_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX question_difficulty_types_code_key ON public.question_difficulty_types USING btree (code);


--
-- Name: question_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX question_types_code_key ON public.question_types USING btree (code);


--
-- Name: quiz_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX quiz_status_types_code_key ON public.quiz_status_types USING btree (code);


--
-- Name: requirement_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX requirement_types_code_key ON public.requirement_types USING btree (code);


--
-- Name: resource_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX resource_types_code_key ON public.resource_types USING btree (code);


--
-- Name: role_permissions_role_screenId_operationId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "role_permissions_role_screenId_operationId_key" ON public.role_permissions USING btree (role, "screenId", "operationId");


--
-- Name: schedule_sessions_classId_timeSlotId_date_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "schedule_sessions_classId_timeSlotId_date_key" ON public.schedule_sessions USING btree ("classId", "timeSlotId", date);


--
-- Name: schedule_sessions_classroomId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "schedule_sessions_classroomId_date_idx" ON public.schedule_sessions USING btree ("classroomId", date);


--
-- Name: schedule_sessions_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX schedule_sessions_date_idx ON public.schedule_sessions USING btree (date);


--
-- Name: schedule_sessions_instructorUserId_date_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "schedule_sessions_instructorUserId_date_idx" ON public.schedule_sessions USING btree ("instructorUserId", date);


--
-- Name: schedule_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX schedule_types_code_key ON public.schedule_types USING btree (code);


--
-- Name: scheduled_sessions_classId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_classId_idx" ON public.scheduled_sessions USING btree ("classId");


--
-- Name: scheduled_sessions_classroomId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_classroomId_idx" ON public.scheduled_sessions USING btree ("classroomId");


--
-- Name: scheduled_sessions_deletedAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_deletedAt_idx" ON public.scheduled_sessions USING btree ("deletedAt");


--
-- Name: scheduled_sessions_instructorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_instructorId_idx" ON public.scheduled_sessions USING btree ("instructorId");


--
-- Name: scheduled_sessions_parentSessionId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_parentSessionId_idx" ON public.scheduled_sessions USING btree ("parentSessionId");


--
-- Name: scheduled_sessions_recurrenceSeriesId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_recurrenceSeriesId_idx" ON public.scheduled_sessions USING btree ("recurrenceSeriesId");


--
-- Name: scheduled_sessions_seriesId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_seriesId_idx" ON public.scheduled_sessions USING btree ("seriesId");


--
-- Name: scheduled_sessions_startDateTime_endDateTime_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "scheduled_sessions_startDateTime_endDateTime_idx" ON public.scheduled_sessions USING btree ("startDateTime", "endDateTime");


--
-- Name: scheduled_sessions_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX scheduled_sessions_status_idx ON public.scheduled_sessions USING btree (status);


--
-- Name: screens_screenId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "screens_screenId_key" ON public.screens USING btree ("screenId");


--
-- Name: session_series_classId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "session_series_classId_idx" ON public.session_series USING btree ("classId");


--
-- Name: session_series_classroomId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "session_series_classroomId_idx" ON public.session_series USING btree ("classroomId");


--
-- Name: session_series_instructorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "session_series_instructorId_idx" ON public.session_series USING btree ("instructorId");


--
-- Name: session_series_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "session_series_startDate_endDate_idx" ON public.session_series USING btree ("startDate", "endDate");


--
-- Name: standup_attendances_userId_date_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "standup_attendances_userId_date_key" ON public.standup_attendances USING btree ("userId", date);


--
-- Name: student_marks_userId_subjectId_classId_isRepeated_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "student_marks_userId_subjectId_classId_isRepeated_key" ON public.student_marks USING btree ("userId", "subjectId", "classId", "isRepeated");


--
-- Name: subject_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX subject_types_code_key ON public.subject_types USING btree (code);


--
-- Name: subjects_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX subjects_code_key ON public.subjects USING btree (code);


--
-- Name: submission_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX submission_status_types_code_key ON public.submission_status_types USING btree (code);


--
-- Name: submissions_userId_activityId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "submissions_userId_activityId_key" ON public.submissions USING btree ("userId", "activityId");


--
-- Name: target_audience_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX target_audience_types_code_key ON public.target_audience_types USING btree (code);


--
-- Name: teacher_availability_userId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "teacher_availability_userId_key" ON public.teacher_availability USING btree ("userId");


--
-- Name: template_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX template_types_code_key ON public.template_types USING btree (code);


--
-- Name: time_slots_programId_sortOrder_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "time_slots_programId_sortOrder_key" ON public.time_slots USING btree ("programId", "sortOrder");


--
-- Name: user_category_access_userId_categoryId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "user_category_access_userId_categoryId_key" ON public.user_category_access USING btree ("userId", "categoryId");


--
-- Name: user_favorites_userId_favoriteType_targetId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "user_favorites_userId_favoriteType_targetId_key" ON public.user_favorites USING btree ("userId", "favoriteType", "targetId");


--
-- Name: user_preferences_userId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "user_preferences_userId_key" ON public.user_preferences USING btree ("userId");


--
-- Name: user_role_assignments_userId_roleId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "user_role_assignments_userId_roleId_key" ON public.user_role_assignments USING btree ("userId", "roleId");


--
-- Name: user_roles_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX user_roles_code_key ON public.user_roles USING btree (code);


--
-- Name: user_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX user_status_types_code_key ON public.user_status_types USING btree (code);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_keycloakId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "users_keycloakId_key" ON public.users USING btree ("keycloakId");


--
-- Name: workflow_comments_authorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_comments_authorId_idx" ON public.workflow_comments USING btree ("authorId");


--
-- Name: workflow_comments_workflowDocumentId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_comments_workflowDocumentId_idx" ON public.workflow_comments USING btree ("workflowDocumentId");


--
-- Name: workflow_definitions_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX workflow_definitions_code_key ON public.workflow_definitions USING btree (code);


--
-- Name: workflow_documents_currentAssigneeId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_documents_currentAssigneeId_idx" ON public.workflow_documents USING btree ("currentAssigneeId");


--
-- Name: workflow_documents_date_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX workflow_documents_date_status_idx ON public.workflow_documents USING btree (date, status);


--
-- Name: workflow_documents_program_subject_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX workflow_documents_program_subject_idx ON public.workflow_documents USING btree (program, subject);


--
-- Name: workflow_documents_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX workflow_documents_status_idx ON public.workflow_documents USING btree (status);


--
-- Name: workflow_documents_submitterId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_documents_submitterId_idx" ON public.workflow_documents USING btree ("submitterId");


--
-- Name: workflow_documents_workflowType_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_documents_workflowType_idx" ON public.workflow_documents USING btree ("workflowType");


--
-- Name: workflow_documents_workflowType_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_documents_workflowType_status_idx" ON public.workflow_documents USING btree ("workflowType", status);


--
-- Name: workflow_history_instanceId_createdAt_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_history_instanceId_createdAt_idx" ON public.workflow_history USING btree ("instanceId", "createdAt");


--
-- Name: workflow_instances_assignedUserId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_instances_assignedUserId_idx" ON public.workflow_instances USING btree ("assignedUserId");


--
-- Name: workflow_instances_currentStageId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_instances_currentStageId_idx" ON public.workflow_instances USING btree ("currentStageId");


--
-- Name: workflow_instances_fileId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_instances_fileId_idx" ON public.workflow_instances USING btree ("fileId");


--
-- Name: workflow_instances_initiatedById_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_instances_initiatedById_idx" ON public.workflow_instances USING btree ("initiatedById");


--
-- Name: workflow_instances_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX workflow_instances_status_idx ON public.workflow_instances USING btree (status);


--
-- Name: workflow_stages_definitionId_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "workflow_stages_definitionId_code_key" ON public.workflow_stages USING btree ("definitionId", code);


--
-- Name: workflow_stages_definitionId_stageOrder_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "workflow_stages_definitionId_stageOrder_key" ON public.workflow_stages USING btree ("definitionId", "stageOrder");


--
-- Name: workflow_status_history_actorId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_status_history_actorId_idx" ON public.workflow_status_history USING btree ("actorId");


--
-- Name: workflow_status_history_workflowDocumentId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_status_history_workflowDocumentId_idx" ON public.workflow_status_history USING btree ("workflowDocumentId");


--
-- Name: workflow_steps_assignedRole_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_steps_assignedRole_status_idx" ON public.workflow_steps USING btree ("assignedRole", status);


--
-- Name: workflow_steps_assignedUserId_status_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_steps_assignedUserId_status_idx" ON public.workflow_steps USING btree ("assignedUserId", status);


--
-- Name: workflow_steps_instanceId_idx; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE INDEX "workflow_steps_instanceId_idx" ON public.workflow_steps USING btree ("instanceId");


--
-- Name: academic_terms academic_terms_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT "academic_terms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: academic_terms academic_terms_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT "academic_terms_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activities activities_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activities activities_quizId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.activity_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activities activities_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_log_action_types activity_log_action_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_log_action_types
    ADD CONSTRAINT "activity_log_action_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_log_action_types activity_log_action_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_log_action_types
    ADD CONSTRAINT "activity_log_action_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_types activity_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT "activity_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_types activity_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT "activity_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_scopes admin_scopes_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes
    ADD CONSTRAINT "admin_scopes_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_scopes admin_scopes_instructorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes
    ADD CONSTRAINT "admin_scopes_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_scopes admin_scopes_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes
    ADD CONSTRAINT "admin_scopes_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_scopes admin_scopes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.admin_scopes
    ADD CONSTRAINT "admin_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announcements announcements_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: announcements announcements_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: announcements announcements_priorityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES public.priority_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: announcements announcements_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: announcements announcements_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: announcements announcements_targetAudienceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_targetAudienceId_fkey" FOREIGN KEY ("targetAudienceId") REFERENCES public.target_audience_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: announcements announcements_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: answers answers_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: answers answers_quizAttemptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES public.quiz_attempts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assessment_types assessment_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.assessment_types
    ADD CONSTRAINT "assessment_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assessment_types assessment_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.assessment_types
    ADD CONSTRAINT "assessment_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_amendments attendance_amendments_amendedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments
    ADD CONSTRAINT "attendance_amendments_amendedBy_fkey" FOREIGN KEY ("amendedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_amendments attendance_amendments_attendanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments
    ADD CONSTRAINT "attendance_amendments_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES public.attendances(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_amendments attendance_amendments_fromStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments
    ADD CONSTRAINT "attendance_amendments_fromStatusId_fkey" FOREIGN KEY ("fromStatusId") REFERENCES public.attendance_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_amendments attendance_amendments_toStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_amendments
    ADD CONSTRAINT "attendance_amendments_toStatusId_fkey" FOREIGN KEY ("toStatusId") REFERENCES public.attendance_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_status_types attendance_status_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_status_types
    ADD CONSTRAINT "attendance_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_status_types attendance_status_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendance_status_types
    ADD CONSTRAINT "attendance_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendances attendances_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendances attendances_statusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES public.attendance_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendances attendances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: behavior_types behavior_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behavior_types
    ADD CONSTRAINT "behavior_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: behavior_types behavior_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behavior_types
    ADD CONSTRAINT "behavior_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: behaviors behaviors_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT "behaviors_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: behaviors behaviors_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT "behaviors_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: behaviors behaviors_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT "behaviors_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.behavior_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: behaviors behaviors_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT "behaviors_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: behaviors behaviors_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.behaviors
    ADD CONSTRAINT "behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: break_sessions break_sessions_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions
    ADD CONSTRAINT "break_sessions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: break_sessions break_sessions_instructorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions
    ADD CONSTRAINT "break_sessions_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: break_sessions break_sessions_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions
    ADD CONSTRAINT "break_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: break_sessions break_sessions_timeSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.break_sessions
    ADD CONSTRAINT "break_sessions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES public.time_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: category_types category_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT "category_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: category_types category_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.category_types
    ADD CONSTRAINT "category_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classes classes_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classes classes_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classes classes_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_substituteInstructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_substituteInstructorId_fkey" FOREIGN KEY ("substituteInstructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classes classes_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classroom_availability classroom_availability_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability
    ADD CONSTRAINT "classroom_availability_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classroom_availability classroom_availability_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability
    ADD CONSTRAINT "classroom_availability_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classroom_availability_slot classroom_availability_slot_availabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability_slot
    ADD CONSTRAINT "classroom_availability_slot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES public.classroom_availability(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: classroom_availability classroom_availability_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classroom_availability
    ADD CONSTRAINT "classroom_availability_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classrooms classrooms_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT "classrooms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: classrooms classrooms_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT "classrooms_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: config_types config_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.config_types
    ADD CONSTRAINT "config_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: config_types config_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.config_types
    ADD CONSTRAINT "config_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrollment_status_types enrollment_status_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollment_status_types
    ADD CONSTRAINT "enrollment_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrollment_status_types enrollment_status_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollment_status_types
    ADD CONSTRAINT "enrollment_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrollments enrollments_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrollments enrollments_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_statusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES public.enrollment_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enrollments enrollments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: file_activities file_activities_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_activities
    ADD CONSTRAINT "file_activities_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_activities file_activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_activities
    ADD CONSTRAINT "file_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_comments file_comments_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_comments
    ADD CONSTRAINT "file_comments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_comments file_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_comments
    ADD CONSTRAINT "file_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_shares file_shares_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_shares
    ADD CONSTRAINT "file_shares_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_shares file_shares_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_shares
    ADD CONSTRAINT "file_shares_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_shares file_shares_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_shares
    ADD CONSTRAINT "file_shares_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: file_shares file_shares_subjectUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_shares
    ADD CONSTRAINT "file_shares_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_versions file_versions_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT "file_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: file_versions file_versions_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT "file_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: files files_currentVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES public.file_versions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_deletedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT "flexible_schedule_sessions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_instructorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT "flexible_schedule_sessions_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_parentSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT "flexible_schedule_sessions_parentSessionId_fkey" FOREIGN KEY ("parentSessionId") REFERENCES public.flexible_schedule_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT "flexible_schedule_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: flexible_schedule_sessions flexible_schedule_sessions_timeSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.flexible_schedule_sessions
    ADD CONSTRAINT "flexible_schedule_sessions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES public.time_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: folders folders_deletedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: folders folders_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: help_items help_items_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items
    ADD CONSTRAINT "help_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: help_items help_items_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items
    ADD CONSTRAINT "help_items_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: holidays holidays_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT "holidays_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_assignment_history instructor_assignment_history_changedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT "instructor_assignment_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_assignment_history instructor_assignment_history_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT "instructor_assignment_history_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instructor_assignment_history instructor_assignment_history_newInstructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT "instructor_assignment_history_newInstructorId_fkey" FOREIGN KEY ("newInstructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_assignment_history instructor_assignment_history_oldInstructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT "instructor_assignment_history_oldInstructorId_fkey" FOREIGN KEY ("oldInstructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_assignment_history instructor_assignment_history_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_assignment_history
    ADD CONSTRAINT "instructor_assignment_history_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.scheduled_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_availability instructor_availability_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_availability instructor_availability_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_availability instructor_availability_instructorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: instructor_availability instructor_availability_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_availability_slot instructor_availability_slot_availabilityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability_slot
    ADD CONSTRAINT "instructor_availability_slot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES public.instructor_availability(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instructor_availability instructor_availability_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_availability instructor_availability_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT "instructor_availability_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: marks_distributions marks_distributions_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.marks_distributions
    ADD CONSTRAINT "marks_distributions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: marks_distributions marks_distributions_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.marks_distributions
    ADD CONSTRAINT "marks_distributions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: marks_distributions marks_distributions_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.marks_distributions
    ADD CONSTRAINT "marks_distributions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_deliveries notification_deliveries_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_log notification_log_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT "notification_log_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.scheduled_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_log notification_log_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT "notification_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: operations operations_screenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT "operations_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES public.screens(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: participation_types participation_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participation_types
    ADD CONSTRAINT "participation_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: participation_types participation_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participation_types
    ADD CONSTRAINT "participation_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: participations participations_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT "participations_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: participations participations_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT "participations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: participations participations_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT "participations_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.participation_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: participations participations_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT "participations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: participations participations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT "participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: penalties penalties_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT "penalties_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalties penalties_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT "penalties_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: penalties penalties_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT "penalties_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.penalty_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: penalties penalties_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT "penalties_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalties penalties_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalties
    ADD CONSTRAINT "penalties_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: penalty_types penalty_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalty_types
    ADD CONSTRAINT "penalty_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalty_types penalty_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.penalty_types
    ADD CONSTRAINT "penalty_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: permission_denial_audit permission_denial_audit_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.permission_denial_audit
    ADD CONSTRAINT "permission_denial_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: priority_types priority_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.priority_types
    ADD CONSTRAINT "priority_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: priority_types priority_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.priority_types
    ADD CONSTRAINT "priority_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: programs programs_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT "programs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.category_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: programs programs_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT "programs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: programs programs_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT "programs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: public_links public_links_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT "public_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: public_links public_links_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT "public_links_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public_links public_links_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.public_links
    ADD CONSTRAINT "public_links_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: question_difficulty_types question_difficulty_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_difficulty_types
    ADD CONSTRAINT "question_difficulty_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: question_difficulty_types question_difficulty_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_difficulty_types
    ADD CONSTRAINT "question_difficulty_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: question_types question_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_types
    ADD CONSTRAINT "question_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: question_types question_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.question_types
    ADD CONSTRAINT "question_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_quizId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.question_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: questions questions_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quiz_attempts quiz_attempts_quizId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quiz_attempts quiz_attempts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quiz_status_types quiz_status_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_status_types
    ADD CONSTRAINT "quiz_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quiz_status_types quiz_status_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quiz_status_types
    ADD CONSTRAINT "quiz_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quizzes quizzes_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "quizzes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quizzes quizzes_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "quizzes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: requirement_types requirement_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.requirement_types
    ADD CONSTRAINT "requirement_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: requirement_types requirement_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.requirement_types
    ADD CONSTRAINT "requirement_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resource_types resource_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resource_types
    ADD CONSTRAINT "resource_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resource_types resource_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resource_types
    ADD CONSTRAINT "resource_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources resources_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.category_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources resources_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources resources_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: resources resources_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources resources_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources resources_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.resource_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: resources resources_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT "resources_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_operationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES public.operations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_screenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES public.screens(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_sessions schedule_sessions_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT "schedule_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_sessions schedule_sessions_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT "schedule_sessions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: schedule_sessions schedule_sessions_instructorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT "schedule_sessions_instructorUserId_fkey" FOREIGN KEY ("instructorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_sessions schedule_sessions_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT "schedule_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_sessions schedule_sessions_timeSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_sessions
    ADD CONSTRAINT "schedule_sessions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES public.time_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_types schedule_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types
    ADD CONSTRAINT "schedule_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: schedule_types schedule_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types
    ADD CONSTRAINT "schedule_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_sessions scheduled_sessions_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_deletedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_parentSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_parentSessionId_fkey" FOREIGN KEY ("parentSessionId") REFERENCES public.scheduled_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public.session_series(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_sessions scheduled_sessions_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.scheduled_sessions
    ADD CONSTRAINT "scheduled_sessions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: session_series session_series_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT "session_series_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_series session_series_classroomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT "session_series_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES public.classrooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: session_series session_series_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT "session_series_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: session_series session_series_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT "session_series_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: session_series session_series_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.session_series
    ADD CONSTRAINT "session_series_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: standup_attendances standup_attendances_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT "standup_attendances_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: standup_attendances standup_attendances_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT "standup_attendances_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: standup_attendances standup_attendances_statusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT "standup_attendances_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES public.attendance_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: standup_attendances standup_attendances_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT "standup_attendances_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: standup_attendances standup_attendances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.standup_attendances
    ADD CONSTRAINT "standup_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_marks student_marks_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT "student_marks_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_marks student_marks_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT "student_marks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_marks_history student_marks_history_actionBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks_history
    ADD CONSTRAINT "student_marks_history_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_marks_history student_marks_history_studentMarksId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks_history
    ADD CONSTRAINT "student_marks_history_studentMarksId_fkey" FOREIGN KEY ("studentMarksId") REFERENCES public.student_marks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_marks student_marks_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT "student_marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_marks student_marks_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT "student_marks_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_marks student_marks_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.student_marks
    ADD CONSTRAINT "student_marks_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subject_types subject_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_types
    ADD CONSTRAINT "subject_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subject_types subject_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_types
    ADD CONSTRAINT "subject_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subjects subjects_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subjects subjects_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subjects subjects_requirementTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_requirementTypeId_fkey" FOREIGN KEY ("requirementTypeId") REFERENCES public.requirement_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subjects subjects_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public.subject_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subjects subjects_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT "subjects_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submission_status_types submission_status_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submission_status_types
    ADD CONSTRAINT "submission_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submission_status_types submission_status_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submission_status_types
    ADD CONSTRAINT "submission_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submissions submissions_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: submissions submissions_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submissions submissions_statusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES public.submission_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: submissions submissions_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: submissions submissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: target_audience_types target_audience_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.target_audience_types
    ADD CONSTRAINT "target_audience_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: target_audience_types target_audience_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.target_audience_types
    ADD CONSTRAINT "target_audience_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teacher_availability teacher_availability_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.teacher_availability
    ADD CONSTRAINT "teacher_availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_types template_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types
    ADD CONSTRAINT "template_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: template_types template_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types
    ADD CONSTRAINT "template_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_slots time_slots_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT "time_slots_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_category_access user_category_access_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.category_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_category_access user_category_access_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_category_access user_category_access_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_category_access user_category_access_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_programId_fkey" FOREIGN KEY ("programId") REFERENCES public.programs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_category_access user_category_access_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_category_access user_category_access_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_category_access user_category_access_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_category_access
    ADD CONSTRAINT "user_category_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_favorites user_favorites_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT "user_favorites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_favorites user_favorites_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT "user_favorites_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_favorites user_favorites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_file_preferences user_file_preferences_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_file_preferences
    ADD CONSTRAINT "user_file_preferences_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_file_preferences user_file_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_file_preferences
    ADD CONSTRAINT "user_file_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "user_preferences_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_preferences user_preferences_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "user_preferences_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_preferences user_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT "user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.user_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_roles user_roles_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_status_types user_status_types_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_status_types
    ADD CONSTRAINT "user_status_types_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_status_types user_status_types_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.user_status_types
    ADD CONSTRAINT "user_status_types_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_comments workflow_comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_comments
    ADD CONSTRAINT "workflow_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_comments workflow_comments_workflowDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_comments
    ADD CONSTRAINT "workflow_comments_workflowDocumentId_fkey" FOREIGN KEY ("workflowDocumentId") REFERENCES public.workflow_documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_documents workflow_documents_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT "workflow_documents_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_documents workflow_documents_currentAssigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT "workflow_documents_currentAssigneeId_fkey" FOREIGN KEY ("currentAssigneeId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_documents workflow_documents_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT "workflow_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_documents workflow_documents_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT "workflow_documents_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_documents workflow_documents_submitterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_documents
    ADD CONSTRAINT "workflow_documents_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_history workflow_history_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT "workflow_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_history workflow_history_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT "workflow_history_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public.workflow_instances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_history workflow_history_stepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_history
    ADD CONSTRAINT "workflow_history_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES public.workflow_steps(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_instances workflow_instances_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT "workflow_instances_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_instances workflow_instances_currentStageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT "workflow_instances_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES public.workflow_stages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_instances workflow_instances_definitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES public.workflow_definitions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_instances workflow_instances_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT "workflow_instances_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_instances workflow_instances_initiatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT "workflow_instances_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_stages workflow_stages_definitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT "workflow_stages_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES public.workflow_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_status_history workflow_status_history_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_status_history
    ADD CONSTRAINT "workflow_status_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_status_history workflow_status_history_workflowDocumentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_status_history
    ADD CONSTRAINT "workflow_status_history_workflowDocumentId_fkey" FOREIGN KEY ("workflowDocumentId") REFERENCES public.workflow_documents(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workflow_steps workflow_steps_actedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "workflow_steps_actedById_fkey" FOREIGN KEY ("actedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_steps workflow_steps_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "workflow_steps_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflow_steps workflow_steps_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "workflow_steps_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public.workflow_instances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflow_steps workflow_steps_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT "workflow_steps_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public.workflow_stages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: military_lms
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict pgcz2AFsKpGXDwZxuUUtISgGrXlU3s1sdC4ColdyZuOhm9Y5fJwt6ObRCQ3QYhT

