--
-- PostgreSQL database dump
--

\restrict fthOt4xFDuQUQn5gYkY9kb2cAx2vQqS1hBday2ICXMddvF2Itw0sk9jUGOj2fLH

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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
    "checkInTime" timestamp(3) without time zone,
    "checkOutTime" timestamp(3) without time zone,
    notes text,
    "recordedBy" integer,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "typeId" integer NOT NULL,
    "descriptionAr" text,
    points integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    comment text,
    "descriptionEn" text NOT NULL,
    "programId" integer,
    "subjectId" integer
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
    year text
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
    "classId" integer NOT NULL,
    "statusId" integer NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "programId" integer NOT NULL,
    "subjectId" integer NOT NULL
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
-- Name: participation_types; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.participation_types (
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
    "typeId" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "classId" integer,
    comment text,
    "descriptionAr" text,
    "descriptionEn" text,
    points integer DEFAULT 0,
    "programId" integer,
    "subjectId" integer
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
    "typeId" integer NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer NOT NULL,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    comment text,
    "descriptionAr" text,
    "descriptionEn" text NOT NULL,
    "programId" integer,
    "subjectId" integer
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
-- Name: subject_enrollments; Type: TABLE; Schema: public; Owner: military_lms
--

CREATE TABLE public.subject_enrollments (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "subjectId" integer NOT NULL,
    "statusId" integer NOT NULL,
    "enrolledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "finalGrade" double precision,
    "creditsEarned" double precision,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subject_enrollments OWNER TO military_lms;

--
-- Name: subject_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: military_lms
--

CREATE SEQUENCE public.subject_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subject_enrollments_id_seq OWNER TO military_lms;

--
-- Name: subject_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: military_lms
--

ALTER SEQUENCE public.subject_enrollments_id_seq OWNED BY public.subject_enrollments.id;


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
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" integer,
    "updatedBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "keycloakId" text,
    "realName" text,
    sequence integer,
    "studentNumber" text
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
-- Name: category_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.category_types ALTER COLUMN id SET DEFAULT nextval('public.category_types_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


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
-- Name: help_items id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items ALTER COLUMN id SET DEFAULT nextval('public.help_items_id_seq'::regclass);


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
-- Name: schedule_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types ALTER COLUMN id SET DEFAULT nextval('public.schedule_types_id_seq'::regclass);


--
-- Name: subject_enrollments id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments ALTER COLUMN id SET DEFAULT nextval('public.subject_enrollments_id_seq'::regclass);


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
-- Name: template_types id; Type: DEFAULT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types ALTER COLUMN id SET DEFAULT nextval('public.template_types_id_seq'::regclass);


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
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4adebad3-cc0a-4e5f-b6c8-e739bb50fb60	a3b70798e2e448a82366b78e36ce5b2701e534c4ddc41689a1945be44011ed27	2026-03-27 17:16:43.954631+00	20260327171642_add_sort_to_category_types	\N	\N	2026-03-27 17:16:42.958322+00	1
c89908ad-8f11-4c3f-9059-8e6d43207eb1	fcc964f5fd9e0a45443c554498456deeb0a01739e7b1251bf78ae13ddf1bcb5e	2026-03-27 18:15:16.151572+00	20260327181516_add_class_fields	\N	\N	2026-03-27 18:15:16.131704+00	1
c7d395e4-cee0-484b-b1de-92591cd4200f	4f58dd351c55735056e010ceb0d90790b344dfbf91e96a7e9aaf86986b8f23a6	2026-03-28 12:57:23.032864+00	20260328125722_make_class_id_optional_in_resources	\N	\N	2026-03-28 12:57:22.951211+00	1
ff9c0ab0-9402-47b3-b801-7abb92fbfea7	9efcbb1cd17c7f042b03d3d99aa118c96e744267d4efea95c08ff4c9b7643c30	2026-03-28 12:59:59.774968+00	20260328125959_add_program_subject_to_resources	\N	\N	2026-03-28 12:59:59.753855+00	1
6db10e6c-6772-46fc-b946-fb580ac6625a	c7bd930f73ed9b252db5e89404bb5e1b02e9abf2adb9e9c010dafdecfc5b893b	2026-03-28 13:07:30.569821+00	20260328130730_add_due_date_featured_to_resources	\N	\N	2026-03-28 13:07:30.552213+00	1
979dee47-67ba-44ef-9efe-3162da204bbe	c5406f36775279e7fd517de68fb86c496255e21158539b05e858d07229891a37	2026-03-28 15:42:07.391258+00	20260328154205_cleanup_resource_fields	\N	\N	2026-03-28 15:42:07.370502+00	1
37abb177-5bff-4efa-8eec-5582781798d8	68f93b5687f3d9dcd55f0e22e831fec9bca97db1e6fe7a64b6cfd4e86dc20299	2026-03-28 16:50:04.267945+00	20260328165004_remove_resource_type_column	\N	\N	2026-03-28 16:50:04.251405+00	1
92ddfc3a-7dd8-4251-b444-9c3a9d45d995	78d40a6effe436e895f6821517655dbfca205785eff6c29536880f1e11fff83d	2026-03-29 04:12:49.846829+00	20260329041249_add_subject_id_to_announcements	\N	\N	2026-03-29 04:12:49.790013+00	1
4423a506-9df5-4c9d-a3dd-0cf07bbe92f4	b1ea01d3c3a48f7742009a0219d7dfe9bb0e3df5a0b69fab20690efe19684271	2026-03-29 04:36:24.538429+00	20260329043624_add_keycloak_and_realname_fields	\N	\N	2026-03-29 04:36:24.449201+00	1
210b13fc-31bf-45c1-a0dc-081e210d66ef	0e1252c3c3fa7c5d9fcf6d6231e835c0d784d36fdce1c0a243741ba88d8ed37b	2026-03-29 05:34:06.753942+00	20260329053406_add_student_number_and_sequence	\N	\N	2026-03-29 05:34:06.532649+00	1
9f700bc3-5a45-44b3-b3f2-9ba569835ec3	62f384560cb3f414cf148ef882aa8784b55790196b4ef9a12ec91ce9cc02e575	2026-03-29 06:01:37.26074+00	20260329060137_remove_primary_role_from_users	\N	\N	2026-03-29 06:01:37.239156+00	1
b3558e07-cf2c-4f5b-8383-18df9620d23a	42d0e125931a9766dcdc813c89b7da80b6a37880b675ab78536a241e9a78d102	2026-03-29 08:51:29.845488+00	20260329085129_add_program_subject_to_enrollments	\N	\N	2026-03-29 08:51:29.809232+00	1
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
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.announcements (id, "titleEn", "titleAr", "priorityId", "targetAudienceId", "programId", "classId", "isActive", "createdBy", "updatedBy", "publishAt", "expiresAt", "createdAt", "updatedAt", "descriptionEn", "descriptionAr", "subjectId") FROM stdin;
1	aaaa	bvbbbbb	2	3	1	2	t	1	1	\N	\N	2026-03-28 17:38:22.132	2026-03-29 04:16:46.208	<p><br></p><p>aaaaaaaaa</p>	<p class="ql-align-right ql-direction-rtl">fffffffffffff</p><p><br></p>	5
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
-- Data for Name: attendance_status_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.attendance_status_types (id, code, "nameEn", "nameAr", description, color, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	PRESENT	Present	حاضر	Student is present	\N	t	\N	\N	2026-03-27 17:22:49.002	2026-03-27 17:22:49.002
2	ABSENT	Absent	غائب	Student is absent	\N	t	\N	\N	2026-03-27 17:22:49.01	2026-03-27 17:22:49.01
3	LATE	Late	متأخر	Student arrived late	\N	t	\N	\N	2026-03-27 17:22:49.015	2026-03-27 17:22:49.015
4	EXCUSED	Excused	معذور	Student has excused absence	\N	t	\N	\N	2026-03-27 17:22:49.021	2026-03-27 17:22:49.021
5	SICK_LEAVE	Sick Leave	إجازة مرضية	Student on sick leave	\N	t	\N	\N	2026-03-27 17:22:49.026	2026-03-27 17:22:49.026
6	EARLY_DEPARTURE	Early Departure	مغادرة مبكرة	Student left early	\N	t	\N	\N	2026-03-27 17:22:49.032	2026-03-27 17:22:49.032
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.attendances (id, "userId", "classId", date, "statusId", "checkInTime", "checkOutTime", notes, "recordedBy", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
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

COPY public.behaviors (id, "userId", "classId", "typeId", "descriptionAr", points, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", comment, "descriptionEn", "programId", "subjectId") FROM stdin;
\.


--
-- Data for Name: category_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.category_types (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", icon, color, sort, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
12	ACADEMIC	Academic	أكاديمي	Academic resources and materials	الموارد والمواد الأكاديمية	book	#3b82f6	1	t	1	1	2026-03-27 17:23:02.332	2026-03-27 17:23:02.332
13	ADMINISTRATIVE	Administrative	إداري	Administrative documents and forms	الوثائق والنماذج الإدارية	file	#10b981	2	t	1	1	2026-03-27 17:23:02.34	2026-03-27 17:23:02.34
14	TECHNICAL	Technical	تقني	Technical guides and documentation	الأدلة والوثائق التقنية	settings	#f59e0b	3	t	1	1	2026-03-27 17:23:02.344	2026-03-27 17:23:02.344
15	GENERAL	General	عام	General information and resources	معلومات وموارد عامة	folder	#8b5cf6	4	t	1	1	2026-03-27 17:23:02.349	2026-03-27 17:23:02.349
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.classes (id, code, "nameEn", "nameAr", "maxCapacity", "isActive", "programId", "subjectId", "instructorId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn", "locationAr", "locationEn", "ownerEmail", term, year) FROM stdin;
2	c	a	b	5	t	1	5	\N	1	1	2026-03-28 12:35:09.158	2026-03-28 12:35:16.596	g	f	e	d		Spring	2025
1	PY-I	Python I	بايثون 1	5	t	1	5	5	1	1	2026-03-27 18:08:42.467	2026-03-29 07:46:52.43	eeeeeeeeeeee	wwwwwwwwwww	b	a	instructor@instructor.com	Fall	2024
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

COPY public.enrollments (id, "userId", "classId", "statusId", "createdBy", "updatedBy", "createdAt", "updatedAt", "programId", "subjectId") FROM stdin;
1	4	1	8	\N	\N	2026-03-29 11:40:38.923	2026-03-29 11:40:38.923	1	2
\.


--
-- Data for Name: help_items; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.help_items (id, page, section, key, "titleEn", "titleAr", "contentEn", "contentAr", "order", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: participation_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.participation_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: participations; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.participations (id, "userId", "typeId", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "classId", comment, "descriptionAr", "descriptionEn", points, "programId", "subjectId") FROM stdin;
\.


--
-- Data for Name: penalties; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.penalties (id, "userId", "classId", "typeId", points, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", comment, "descriptionAr", "descriptionEn", "programId", "subjectId") FROM stdin;
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

COPY public.programs (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	IT	Information Technology Diploma	دبلوم تقنية المعلومات	Information Technology Diploma	دبلوم تقنية المعلومات	2	1.5	70	t	1	1	2026-03-27 17:25:10.047	2026-03-28 12:12:27.923
2	sadf	sadf	sadf	asdf	sadf	2	1.5	70	f	1	1	2026-03-28 12:12:31.729	2026-03-28 12:12:37.811
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

COPY public.questions (id, "quizId", "questionEn", "questionAr", "typeId", options, "correctAnswer", points, "order", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
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

COPY public.quizzes (id, "titleEn", "titleAr", "descriptionEn", "descriptionAr", duration, "maxAttempts", "passingScore", "randomizeQuestions", "randomizeAnswers", "showCorrectAnswers", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
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
8	2	aa	aaa	<p>a</p>	<p>b</p>	3	14	f	t	1	\N	2026-03-28 17:08:50.206	2026-03-29 03:24:00.282	0	1	5	2222-02-02 08:02:00	t	https://www.google.com
9	1	pppppppppppp	oooooooooooooooooo	<p><br></p><p>kkkkkkkkkkkkkkk</p>	<p class="ql-align-right ql-direction-rtl"><br></p><p>mmmmmmmmmmmmmmmm</p>	4	14	f	t	1	\N	2026-03-29 03:25:48.993	2026-03-29 04:17:48.14	0	1	5	\N	f	https://www.google.com
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
-- Data for Name: subject_enrollments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.subject_enrollments (id, "userId", "subjectId", "statusId", "enrolledAt", "completedAt", "finalGrade", "creditsEarned", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: subject_types; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.subject_types (id, code, "nameEn", "nameAr", description, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
1	CORE	Core Subject	موضوع أساسي	Fundamental subject for the program	t	\N	\N	2026-03-27 17:22:24.619	2026-03-27 17:22:24.619
2	ELECTIVE	Elective Subject	موضوع اختياري	Optional subject students can choose	t	\N	\N	2026-03-27 17:22:24.637	2026-03-27 17:22:24.637
3	SPECIALIZATION	Specialization Subject	موضوع تخصص	Subject for specific specialization track	t	\N	\N	2026-03-27 17:22:24.65	2026-03-27 17:22:24.65
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.subjects (id, code, "nameEn", "nameAr", credits, "isActive", "programId", "typeId", "requirementTypeId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn") FROM stdin;
3	WEB101	Web Development Basics	أساسيات تطوير الويب	4	t	1	1	1	1	\N	2026-03-27 17:53:15.871	2026-03-27 17:53:15.871	مقدمة في HTML و CSS و JavaScript	Introduction to HTML, CSS, and JavaScript
4	DB101	Database Management	إدارة قواعد البيانات	3	t	1	1	1	1	\N	2026-03-27 17:53:15.878	2026-03-27 17:53:15.878	مقدمة في تصميم قواعد البيانات و SQL	Introduction to database design and SQL
5	NET101	Network Fundamentals	أساسيات الشبكات	3	t	1	1	1	1	\N	2026-03-27 17:53:15.886	2026-03-27 17:53:15.886	مقدمة في شبكات الكمبيوتر والبروتوكولات	Introduction to computer networks and protocols
2	CS101	Computer Science Fundamentals	أساسيات علوم الكمبيوتر	3	t	1	1	1	1	1	2026-03-27 17:53:15.863	2026-03-28 12:23:58.266	مقدمة في مفاهيم علوم الكمبيوتر	Introduction to computer science concepts
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
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: public; Owner: military_lms
--

COPY public.user_role_assignments (id, "userId", "roleId", "assignedAt", "assignedBy") FROM stdin;
1	1	1	2026-03-29 05:11:06.154	1
33	4	10	2026-03-29 07:34:14.672	1
34	5	9	2026-03-29 07:34:43.986	\N
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

COPY public.users (id, email, "firstName", "lastName", "displayName", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "keycloakId", "realName", sequence, "studentNumber") FROM stdin;
1	shareef.hiasat@gmail.com	Shareef	Hiasat	Shareef Hiasat	t	\N	\N	2026-03-27 17:21:46.968	2026-03-29 05:04:43.41	79d3cc1c-1257-4b94-8b39-10ee509cfb9e	\N	\N	\N
4	testuser@example.com	Test	User	Test User Multi-Role	t	\N	\N	2026-03-28 11:41:38.116	2026-03-29 07:34:14.553	5b4cef9d-9c27-497e-981c-0791505cd7aa	Test Real Name with Audit Fields	3	STU2024001
5	instructor@instructor.com	instructor	X	instructor X	t	\N	\N	2026-03-29 07:34:43.98	2026-03-29 07:34:43.98	2c148802-ea59-4034-9b44-a6b8c1dbaefb	\N	\N	\N
\.


--
-- Name: academic_terms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.academic_terms_id_seq', 3, true);


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activities_id_seq', 1, false);


--
-- Name: activity_log_action_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activity_log_action_types_id_seq', 9, true);


--
-- Name: activity_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.activity_types_id_seq', 8, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.announcements_id_seq', 3, true);


--
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.answers_id_seq', 1, false);


--
-- Name: assessment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.assessment_types_id_seq', 8, true);


--
-- Name: attendance_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.attendance_status_types_id_seq', 6, true);


--
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.attendances_id_seq', 1, false);


--
-- Name: behavior_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.behavior_types_id_seq', 8, true);


--
-- Name: behaviors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.behaviors_id_seq', 1, false);


--
-- Name: category_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.category_types_id_seq', 15, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.classes_id_seq', 2, true);


--
-- Name: config_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.config_types_id_seq', 5, true);


--
-- Name: enrollment_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.enrollment_status_types_id_seq', 8, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, true);


--
-- Name: help_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.help_items_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.penalty_types_id_seq', 7, true);


--
-- Name: priority_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.priority_types_id_seq', 5, true);


--
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.programs_id_seq', 2, true);


--
-- Name: question_difficulty_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.question_difficulty_types_id_seq', 4, true);


--
-- Name: question_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.question_types_id_seq', 5, true);


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

SELECT pg_catalog.setval('public.quiz_status_types_id_seq', 6, true);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: requirement_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.requirement_types_id_seq', 3, true);


--
-- Name: resource_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.resource_types_id_seq', 8, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.resources_id_seq', 9, true);


--
-- Name: schedule_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.schedule_types_id_seq', 6, true);


--
-- Name: subject_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.subject_enrollments_id_seq', 1, false);


--
-- Name: subject_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.subject_types_id_seq', 3, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.subjects_id_seq', 7, true);


--
-- Name: submission_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.submission_status_types_id_seq', 7, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: target_audience_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.target_audience_types_id_seq', 6, true);


--
-- Name: template_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.template_types_id_seq', 5, true);


--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_role_assignments_id_seq', 34, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 10, true);


--
-- Name: user_status_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.user_status_types_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: military_lms
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


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
-- Name: help_items help_items_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.help_items
    ADD CONSTRAINT help_items_pkey PRIMARY KEY (id);


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
-- Name: schedule_types schedule_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.schedule_types
    ADD CONSTRAINT schedule_types_pkey PRIMARY KEY (id);


--
-- Name: subject_enrollments subject_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT subject_enrollments_pkey PRIMARY KEY (id);


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
-- Name: template_types template_types_pkey; Type: CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.template_types
    ADD CONSTRAINT template_types_pkey PRIMARY KEY (id);


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
-- Name: assessment_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX assessment_types_code_key ON public.assessment_types USING btree (code);


--
-- Name: attendance_status_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX attendance_status_types_code_key ON public.attendance_status_types USING btree (code);


--
-- Name: behavior_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX behavior_types_code_key ON public.behavior_types USING btree (code);


--
-- Name: category_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX category_types_code_key ON public.category_types USING btree (code);


--
-- Name: classes_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX classes_code_key ON public.classes USING btree (code);


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
-- Name: help_items_page_section_key_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX help_items_page_section_key_key ON public.help_items USING btree (page, section, key);


--
-- Name: participation_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX participation_types_code_key ON public.participation_types USING btree (code);


--
-- Name: penalty_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX penalty_types_code_key ON public.penalty_types USING btree (code);


--
-- Name: priority_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX priority_types_code_key ON public.priority_types USING btree (code);


--
-- Name: programs_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX programs_code_key ON public.programs USING btree (code);


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
-- Name: schedule_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX schedule_types_code_key ON public.schedule_types USING btree (code);


--
-- Name: subject_enrollments_userId_subjectId_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX "subject_enrollments_userId_subjectId_key" ON public.subject_enrollments USING btree ("userId", "subjectId");


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
-- Name: template_types_code_key; Type: INDEX; Schema: public; Owner: military_lms
--

CREATE UNIQUE INDEX template_types_code_key ON public.template_types USING btree (code);


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
-- Name: attendances attendances_recordedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: classes classes_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: subject_enrollments subject_enrollments_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT "subject_enrollments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subject_enrollments subject_enrollments_statusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT "subject_enrollments_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES public.enrollment_status_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subject_enrollments subject_enrollments_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT "subject_enrollments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subject_enrollments subject_enrollments_updatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT "subject_enrollments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subject_enrollments subject_enrollments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: military_lms
--

ALTER TABLE ONLY public.subject_enrollments
    ADD CONSTRAINT "subject_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: military_lms
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict fthOt4xFDuQUQn5gYkY9kb2cAx2vQqS1hBday2ICXMddvF2Itw0sk9jUGOj2fLH

