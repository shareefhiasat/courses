--
-- PostgreSQL database dump
--

\restrict HPQzsTr7BbpN0WlaClKn16iPAk9FOrgcoKK4g0T6dHwfdu5K7K61KyHBMfIbvYm

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: oc_accounts; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_accounts (
    uid character varying(64) DEFAULT ''::character varying NOT NULL,
    data text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.oc_accounts OWNER TO oc_admin;

--
-- Name: oc_accounts_data; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_accounts_data (
    id bigint NOT NULL,
    uid character varying(64) NOT NULL,
    name character varying(64) NOT NULL,
    value character varying(255) DEFAULT ''::character varying
);


ALTER TABLE public.oc_accounts_data OWNER TO oc_admin;

--
-- Name: oc_accounts_data_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_accounts_data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_accounts_data_id_seq OWNER TO oc_admin;

--
-- Name: oc_accounts_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_accounts_data_id_seq OWNED BY public.oc_accounts_data.id;


--
-- Name: oc_activity; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_activity (
    activity_id bigint NOT NULL,
    "timestamp" integer DEFAULT 0 NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    type character varying(255) DEFAULT NULL::character varying,
    "user" character varying(64) DEFAULT NULL::character varying,
    affecteduser character varying(64) NOT NULL,
    app character varying(32) NOT NULL,
    subject character varying(255) NOT NULL,
    subjectparams text NOT NULL,
    message character varying(255) DEFAULT NULL::character varying,
    messageparams text,
    file character varying(4000) DEFAULT NULL::character varying,
    link character varying(4000) DEFAULT NULL::character varying,
    object_type character varying(255) DEFAULT NULL::character varying,
    object_id bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_activity OWNER TO oc_admin;

--
-- Name: oc_activity_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_activity_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_activity_activity_id_seq OWNER TO oc_admin;

--
-- Name: oc_activity_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_activity_activity_id_seq OWNED BY public.oc_activity.activity_id;


--
-- Name: oc_activity_mq; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_activity_mq (
    mail_id bigint NOT NULL,
    amq_timestamp integer DEFAULT 0 NOT NULL,
    amq_latest_send integer DEFAULT 0 NOT NULL,
    amq_type character varying(255) NOT NULL,
    amq_affecteduser character varying(64) NOT NULL,
    amq_appid character varying(32) NOT NULL,
    amq_subject character varying(255) NOT NULL,
    amq_subjectparams text,
    object_type character varying(255) DEFAULT NULL::character varying,
    object_id bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_activity_mq OWNER TO oc_admin;

--
-- Name: oc_activity_mq_mail_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_activity_mq_mail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_activity_mq_mail_id_seq OWNER TO oc_admin;

--
-- Name: oc_activity_mq_mail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_activity_mq_mail_id_seq OWNED BY public.oc_activity_mq.mail_id;


--
-- Name: oc_addressbookchanges; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_addressbookchanges (
    id bigint NOT NULL,
    uri character varying(255) DEFAULT NULL::character varying,
    synctoken integer DEFAULT 1 NOT NULL,
    addressbookid bigint NOT NULL,
    operation smallint NOT NULL,
    created_at integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_addressbookchanges OWNER TO oc_admin;

--
-- Name: oc_addressbookchanges_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_addressbookchanges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_addressbookchanges_id_seq OWNER TO oc_admin;

--
-- Name: oc_addressbookchanges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_addressbookchanges_id_seq OWNED BY public.oc_addressbookchanges.id;


--
-- Name: oc_addressbooks; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_addressbooks (
    id bigint NOT NULL,
    principaluri character varying(255) DEFAULT NULL::character varying,
    displayname character varying(255) DEFAULT NULL::character varying,
    uri character varying(255) DEFAULT NULL::character varying,
    description character varying(255) DEFAULT NULL::character varying,
    synctoken integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.oc_addressbooks OWNER TO oc_admin;

--
-- Name: oc_addressbooks_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_addressbooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_addressbooks_id_seq OWNER TO oc_admin;

--
-- Name: oc_addressbooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_addressbooks_id_seq OWNED BY public.oc_addressbooks.id;


--
-- Name: oc_appconfig; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_appconfig (
    appid character varying(32) DEFAULT ''::character varying NOT NULL,
    configkey character varying(64) DEFAULT ''::character varying NOT NULL,
    configvalue text,
    type integer DEFAULT 2 NOT NULL,
    lazy smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_appconfig OWNER TO oc_admin;

--
-- Name: oc_authorized_groups; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_authorized_groups (
    id integer NOT NULL,
    group_id character varying(200) NOT NULL,
    class character varying(200) NOT NULL
);


ALTER TABLE public.oc_authorized_groups OWNER TO oc_admin;

--
-- Name: oc_authorized_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_authorized_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_authorized_groups_id_seq OWNER TO oc_admin;

--
-- Name: oc_authorized_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_authorized_groups_id_seq OWNED BY public.oc_authorized_groups.id;


--
-- Name: oc_authtoken; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_authtoken (
    id bigint NOT NULL,
    uid character varying(64) DEFAULT ''::character varying NOT NULL,
    login_name character varying(255) DEFAULT ''::character varying NOT NULL,
    password text,
    name text DEFAULT ''::text NOT NULL,
    token character varying(200) DEFAULT ''::character varying NOT NULL,
    type smallint DEFAULT 0,
    remember smallint DEFAULT 0,
    last_activity integer DEFAULT 0,
    last_check integer DEFAULT 0,
    scope text,
    expires integer,
    private_key text,
    public_key text,
    version smallint DEFAULT 1 NOT NULL,
    password_invalid boolean DEFAULT false,
    password_hash character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_authtoken OWNER TO oc_admin;

--
-- Name: oc_authtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_authtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_authtoken_id_seq OWNER TO oc_admin;

--
-- Name: oc_authtoken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_authtoken_id_seq OWNED BY public.oc_authtoken.id;


--
-- Name: oc_bruteforce_attempts; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_bruteforce_attempts (
    id bigint NOT NULL,
    action character varying(64) DEFAULT ''::character varying NOT NULL,
    occurred integer DEFAULT 0 NOT NULL,
    ip character varying(255) DEFAULT ''::character varying NOT NULL,
    subnet character varying(255) DEFAULT ''::character varying NOT NULL,
    metadata character varying(255) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_bruteforce_attempts OWNER TO oc_admin;

--
-- Name: oc_bruteforce_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_bruteforce_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_bruteforce_attempts_id_seq OWNER TO oc_admin;

--
-- Name: oc_bruteforce_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_bruteforce_attempts_id_seq OWNED BY public.oc_bruteforce_attempts.id;


--
-- Name: oc_calendar_invitations; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_invitations (
    id bigint NOT NULL,
    uid character varying(255) NOT NULL,
    recurrenceid character varying(255) DEFAULT NULL::character varying,
    attendee character varying(255) NOT NULL,
    organizer character varying(255) NOT NULL,
    sequence bigint,
    token character varying(60) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.oc_calendar_invitations OWNER TO oc_admin;

--
-- Name: oc_calendar_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_invitations_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_invitations_id_seq OWNED BY public.oc_calendar_invitations.id;


--
-- Name: oc_calendar_reminders; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_reminders (
    id bigint NOT NULL,
    calendar_id bigint NOT NULL,
    object_id bigint NOT NULL,
    is_recurring smallint,
    uid character varying(255) NOT NULL,
    recurrence_id bigint,
    is_recurrence_exception smallint NOT NULL,
    event_hash character varying(255) NOT NULL,
    alarm_hash character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    is_relative smallint NOT NULL,
    notification_date bigint NOT NULL,
    is_repeat_based smallint NOT NULL
);


ALTER TABLE public.oc_calendar_reminders OWNER TO oc_admin;

--
-- Name: oc_calendar_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_reminders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_reminders_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_reminders_id_seq OWNED BY public.oc_calendar_reminders.id;


--
-- Name: oc_calendar_resources; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_resources (
    id bigint NOT NULL,
    backend_id character varying(64) DEFAULT NULL::character varying,
    resource_id character varying(64) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    displayname character varying(255) DEFAULT NULL::character varying,
    group_restrictions character varying(4000) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_calendar_resources OWNER TO oc_admin;

--
-- Name: oc_calendar_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_resources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_resources_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_resources_id_seq OWNED BY public.oc_calendar_resources.id;


--
-- Name: oc_calendar_resources_md; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_resources_md (
    id bigint NOT NULL,
    resource_id bigint NOT NULL,
    key character varying(255) NOT NULL,
    value character varying(4000) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_calendar_resources_md OWNER TO oc_admin;

--
-- Name: oc_calendar_resources_md_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_resources_md_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_resources_md_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_resources_md_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_resources_md_id_seq OWNED BY public.oc_calendar_resources_md.id;


--
-- Name: oc_calendar_rooms; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_rooms (
    id bigint NOT NULL,
    backend_id character varying(64) DEFAULT NULL::character varying,
    resource_id character varying(64) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    displayname character varying(255) DEFAULT NULL::character varying,
    group_restrictions character varying(4000) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_calendar_rooms OWNER TO oc_admin;

--
-- Name: oc_calendar_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_rooms_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_rooms_id_seq OWNED BY public.oc_calendar_rooms.id;


--
-- Name: oc_calendar_rooms_md; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendar_rooms_md (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    key character varying(255) NOT NULL,
    value character varying(4000) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_calendar_rooms_md OWNER TO oc_admin;

--
-- Name: oc_calendar_rooms_md_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendar_rooms_md_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendar_rooms_md_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendar_rooms_md_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendar_rooms_md_id_seq OWNED BY public.oc_calendar_rooms_md.id;


--
-- Name: oc_calendarchanges; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendarchanges (
    id bigint NOT NULL,
    uri character varying(255) DEFAULT NULL::character varying,
    synctoken integer DEFAULT 1 NOT NULL,
    calendarid bigint NOT NULL,
    operation smallint NOT NULL,
    calendartype integer DEFAULT 0 NOT NULL,
    created_at integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_calendarchanges OWNER TO oc_admin;

--
-- Name: oc_calendarchanges_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendarchanges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendarchanges_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendarchanges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendarchanges_id_seq OWNED BY public.oc_calendarchanges.id;


--
-- Name: oc_calendarobjects; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendarobjects (
    id bigint NOT NULL,
    calendardata bytea,
    uri character varying(255) DEFAULT NULL::character varying,
    calendarid bigint NOT NULL,
    lastmodified integer,
    etag character varying(32) DEFAULT NULL::character varying,
    size bigint NOT NULL,
    componenttype character varying(8) DEFAULT NULL::character varying,
    firstoccurence bigint,
    lastoccurence bigint,
    uid character varying(255) DEFAULT NULL::character varying,
    classification integer DEFAULT 0,
    calendartype integer DEFAULT 0 NOT NULL,
    deleted_at integer
);


ALTER TABLE public.oc_calendarobjects OWNER TO oc_admin;

--
-- Name: oc_calendarobjects_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendarobjects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendarobjects_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendarobjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendarobjects_id_seq OWNED BY public.oc_calendarobjects.id;


--
-- Name: oc_calendarobjects_props; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendarobjects_props (
    id bigint NOT NULL,
    calendarid bigint DEFAULT 0 NOT NULL,
    objectid bigint DEFAULT 0 NOT NULL,
    name character varying(64) DEFAULT NULL::character varying,
    parameter character varying(64) DEFAULT NULL::character varying,
    value character varying(255) DEFAULT NULL::character varying,
    calendartype integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_calendarobjects_props OWNER TO oc_admin;

--
-- Name: oc_calendarobjects_props_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendarobjects_props_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendarobjects_props_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendarobjects_props_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendarobjects_props_id_seq OWNED BY public.oc_calendarobjects_props.id;


--
-- Name: oc_calendars; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendars (
    id bigint NOT NULL,
    principaluri character varying(255) DEFAULT NULL::character varying,
    displayname character varying(255) DEFAULT NULL::character varying,
    uri character varying(255) DEFAULT NULL::character varying,
    synctoken integer DEFAULT 1 NOT NULL,
    description character varying(255) DEFAULT NULL::character varying,
    calendarorder integer DEFAULT 0 NOT NULL,
    calendarcolor character varying(255) DEFAULT NULL::character varying,
    timezone text,
    components character varying(64) DEFAULT NULL::character varying,
    transparent smallint DEFAULT 0 NOT NULL,
    deleted_at integer
);


ALTER TABLE public.oc_calendars OWNER TO oc_admin;

--
-- Name: oc_calendars_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendars_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendars_id_seq OWNED BY public.oc_calendars.id;


--
-- Name: oc_calendarsubscriptions; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_calendarsubscriptions (
    id bigint NOT NULL,
    uri character varying(255) DEFAULT NULL::character varying,
    principaluri character varying(255) DEFAULT NULL::character varying,
    displayname character varying(100) DEFAULT NULL::character varying,
    refreshrate character varying(10) DEFAULT NULL::character varying,
    calendarorder integer DEFAULT 0 NOT NULL,
    calendarcolor character varying(255) DEFAULT NULL::character varying,
    striptodos smallint,
    stripalarms smallint,
    stripattachments smallint,
    lastmodified integer,
    synctoken integer DEFAULT 1 NOT NULL,
    source text
);


ALTER TABLE public.oc_calendarsubscriptions OWNER TO oc_admin;

--
-- Name: oc_calendarsubscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_calendarsubscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_calendarsubscriptions_id_seq OWNER TO oc_admin;

--
-- Name: oc_calendarsubscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_calendarsubscriptions_id_seq OWNED BY public.oc_calendarsubscriptions.id;


--
-- Name: oc_cards; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_cards (
    id bigint NOT NULL,
    addressbookid bigint DEFAULT 0 NOT NULL,
    carddata bytea,
    uri character varying(255) DEFAULT NULL::character varying,
    lastmodified bigint,
    etag character varying(32) DEFAULT NULL::character varying,
    size bigint NOT NULL,
    uid character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_cards OWNER TO oc_admin;

--
-- Name: oc_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_cards_id_seq OWNER TO oc_admin;

--
-- Name: oc_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_cards_id_seq OWNED BY public.oc_cards.id;


--
-- Name: oc_cards_properties; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_cards_properties (
    id bigint NOT NULL,
    addressbookid bigint DEFAULT 0 NOT NULL,
    cardid bigint DEFAULT 0 NOT NULL,
    name character varying(64) DEFAULT NULL::character varying,
    value character varying(255) DEFAULT NULL::character varying,
    preferred integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.oc_cards_properties OWNER TO oc_admin;

--
-- Name: oc_cards_properties_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_cards_properties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_cards_properties_id_seq OWNER TO oc_admin;

--
-- Name: oc_cards_properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_cards_properties_id_seq OWNED BY public.oc_cards_properties.id;


--
-- Name: oc_circles_circle; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_circle (
    id integer NOT NULL,
    unique_id character varying(31) NOT NULL,
    name character varying(127) NOT NULL,
    display_name character varying(255) DEFAULT ''::character varying,
    sanitized_name character varying(127) DEFAULT ''::character varying,
    instance character varying(255) DEFAULT ''::character varying,
    config integer,
    source integer,
    settings text,
    description text,
    creation timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    contact_addressbook integer,
    contact_groupname character varying(127) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_circles_circle OWNER TO oc_admin;

--
-- Name: oc_circles_circle_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_circle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_circle_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_circle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_circle_id_seq OWNED BY public.oc_circles_circle.id;


--
-- Name: oc_circles_event; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_event (
    token character varying(63) NOT NULL,
    instance character varying(255) NOT NULL,
    event text,
    result text,
    interface integer DEFAULT 0 NOT NULL,
    severity integer,
    retry integer,
    status integer,
    updated timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    creation bigint
);


ALTER TABLE public.oc_circles_event OWNER TO oc_admin;

--
-- Name: oc_circles_member; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_member (
    id integer NOT NULL,
    single_id character varying(31) DEFAULT NULL::character varying,
    circle_id character varying(31) NOT NULL,
    member_id character varying(31) DEFAULT NULL::character varying,
    user_id character varying(127) NOT NULL,
    user_type smallint DEFAULT 1 NOT NULL,
    instance character varying(255) DEFAULT ''::character varying,
    invited_by character varying(31) DEFAULT NULL::character varying,
    level smallint NOT NULL,
    status character varying(15) DEFAULT NULL::character varying,
    note text,
    cached_name character varying(255) DEFAULT ''::character varying,
    cached_update timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    contact_id character varying(127) DEFAULT NULL::character varying,
    contact_meta text,
    joined timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_circles_member OWNER TO oc_admin;

--
-- Name: oc_circles_member_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_member_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_member_id_seq OWNED BY public.oc_circles_member.id;


--
-- Name: oc_circles_membership; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_membership (
    circle_id character varying(31) NOT NULL,
    single_id character varying(31) NOT NULL,
    level integer NOT NULL,
    inheritance_first character varying(31) NOT NULL,
    inheritance_last character varying(31) NOT NULL,
    inheritance_depth integer NOT NULL,
    inheritance_path text NOT NULL
);


ALTER TABLE public.oc_circles_membership OWNER TO oc_admin;

--
-- Name: oc_circles_mount; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_mount (
    id integer NOT NULL,
    mount_id character varying(31) NOT NULL,
    circle_id character varying(31) NOT NULL,
    single_id character varying(31) NOT NULL,
    token character varying(63) DEFAULT NULL::character varying,
    parent integer,
    mountpoint text,
    mountpoint_hash character varying(64) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_circles_mount OWNER TO oc_admin;

--
-- Name: oc_circles_mount_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_mount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_mount_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_mount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_mount_id_seq OWNED BY public.oc_circles_mount.id;


--
-- Name: oc_circles_mountpoint; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_mountpoint (
    id integer NOT NULL,
    mount_id character varying(31) NOT NULL,
    single_id character varying(31) NOT NULL,
    mountpoint text,
    mountpoint_hash character varying(64) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_circles_mountpoint OWNER TO oc_admin;

--
-- Name: oc_circles_mountpoint_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_mountpoint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_mountpoint_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_mountpoint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_mountpoint_id_seq OWNED BY public.oc_circles_mountpoint.id;


--
-- Name: oc_circles_remote; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_remote (
    id integer NOT NULL,
    type character varying(15) DEFAULT 'Unknown'::character varying NOT NULL,
    interface integer DEFAULT 0 NOT NULL,
    uid character varying(20) DEFAULT NULL::character varying,
    instance character varying(127) DEFAULT NULL::character varying,
    href character varying(254) DEFAULT NULL::character varying,
    item text,
    creation timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_circles_remote OWNER TO oc_admin;

--
-- Name: oc_circles_remote_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_remote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_remote_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_remote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_remote_id_seq OWNED BY public.oc_circles_remote.id;


--
-- Name: oc_circles_share_lock; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_share_lock (
    id integer NOT NULL,
    item_id character varying(31) NOT NULL,
    circle_id character varying(31) NOT NULL,
    instance character varying(127) NOT NULL
);


ALTER TABLE public.oc_circles_share_lock OWNER TO oc_admin;

--
-- Name: oc_circles_share_lock_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_share_lock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_share_lock_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_share_lock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_share_lock_id_seq OWNED BY public.oc_circles_share_lock.id;


--
-- Name: oc_circles_token; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_circles_token (
    id integer NOT NULL,
    share_id integer,
    circle_id character varying(31) DEFAULT NULL::character varying,
    single_id character varying(31) DEFAULT NULL::character varying,
    member_id character varying(31) DEFAULT NULL::character varying,
    token character varying(31) DEFAULT NULL::character varying,
    password character varying(127) DEFAULT NULL::character varying,
    accepted integer
);


ALTER TABLE public.oc_circles_token OWNER TO oc_admin;

--
-- Name: oc_circles_token_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_circles_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_circles_token_id_seq OWNER TO oc_admin;

--
-- Name: oc_circles_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_circles_token_id_seq OWNED BY public.oc_circles_token.id;


--
-- Name: oc_collres_accesscache; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_collres_accesscache (
    user_id character varying(64) NOT NULL,
    collection_id bigint DEFAULT 0 NOT NULL,
    resource_type character varying(64) DEFAULT ''::character varying NOT NULL,
    resource_id character varying(64) DEFAULT ''::character varying NOT NULL,
    access boolean DEFAULT false
);


ALTER TABLE public.oc_collres_accesscache OWNER TO oc_admin;

--
-- Name: oc_collres_collections; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_collres_collections (
    id bigint NOT NULL,
    name character varying(64) NOT NULL
);


ALTER TABLE public.oc_collres_collections OWNER TO oc_admin;

--
-- Name: oc_collres_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_collres_collections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_collres_collections_id_seq OWNER TO oc_admin;

--
-- Name: oc_collres_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_collres_collections_id_seq OWNED BY public.oc_collres_collections.id;


--
-- Name: oc_collres_resources; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_collres_resources (
    collection_id bigint NOT NULL,
    resource_type character varying(64) NOT NULL,
    resource_id character varying(64) NOT NULL
);


ALTER TABLE public.oc_collres_resources OWNER TO oc_admin;

--
-- Name: oc_comments; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_comments (
    id bigint NOT NULL,
    parent_id bigint DEFAULT 0 NOT NULL,
    topmost_parent_id bigint DEFAULT 0 NOT NULL,
    children_count integer DEFAULT 0 NOT NULL,
    actor_type character varying(64) DEFAULT ''::character varying NOT NULL,
    actor_id character varying(64) DEFAULT ''::character varying NOT NULL,
    message text,
    verb character varying(64) DEFAULT NULL::character varying,
    creation_timestamp timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    latest_child_timestamp timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    object_type character varying(64) DEFAULT ''::character varying NOT NULL,
    object_id character varying(64) DEFAULT ''::character varying NOT NULL,
    reference_id character varying(64) DEFAULT NULL::character varying,
    reactions character varying(4000) DEFAULT NULL::character varying,
    expire_date timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    meta_data text DEFAULT ''::text
);


ALTER TABLE public.oc_comments OWNER TO oc_admin;

--
-- Name: oc_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_comments_id_seq OWNER TO oc_admin;

--
-- Name: oc_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_comments_id_seq OWNED BY public.oc_comments.id;


--
-- Name: oc_comments_read_markers; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_comments_read_markers (
    user_id character varying(64) DEFAULT ''::character varying NOT NULL,
    object_type character varying(64) DEFAULT ''::character varying NOT NULL,
    object_id character varying(64) DEFAULT ''::character varying NOT NULL,
    marker_datetime timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_comments_read_markers OWNER TO oc_admin;

--
-- Name: oc_dav_absence; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_dav_absence (
    id integer NOT NULL,
    user_id character varying(64) NOT NULL,
    first_day character varying(10) NOT NULL,
    last_day character varying(10) NOT NULL,
    status character varying(100) NOT NULL,
    message text NOT NULL
);


ALTER TABLE public.oc_dav_absence OWNER TO oc_admin;

--
-- Name: oc_dav_absence_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_dav_absence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_dav_absence_id_seq OWNER TO oc_admin;

--
-- Name: oc_dav_absence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_dav_absence_id_seq OWNED BY public.oc_dav_absence.id;


--
-- Name: oc_dav_cal_proxy; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_dav_cal_proxy (
    id bigint NOT NULL,
    owner_id character varying(64) NOT NULL,
    proxy_id character varying(64) NOT NULL,
    permissions integer
);


ALTER TABLE public.oc_dav_cal_proxy OWNER TO oc_admin;

--
-- Name: oc_dav_cal_proxy_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_dav_cal_proxy_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_dav_cal_proxy_id_seq OWNER TO oc_admin;

--
-- Name: oc_dav_cal_proxy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_dav_cal_proxy_id_seq OWNED BY public.oc_dav_cal_proxy.id;


--
-- Name: oc_dav_shares; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_dav_shares (
    id bigint NOT NULL,
    principaluri character varying(255) DEFAULT NULL::character varying,
    type character varying(255) DEFAULT NULL::character varying,
    access smallint,
    resourceid bigint NOT NULL,
    publicuri character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_dav_shares OWNER TO oc_admin;

--
-- Name: oc_dav_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_dav_shares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_dav_shares_id_seq OWNER TO oc_admin;

--
-- Name: oc_dav_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_dav_shares_id_seq OWNED BY public.oc_dav_shares.id;


--
-- Name: oc_direct_edit; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_direct_edit (
    id bigint NOT NULL,
    editor_id character varying(64) NOT NULL,
    token character varying(64) NOT NULL,
    file_id bigint NOT NULL,
    user_id character varying(64) DEFAULT NULL::character varying,
    share_id bigint,
    "timestamp" bigint NOT NULL,
    accessed boolean DEFAULT false,
    file_path character varying(4000) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_direct_edit OWNER TO oc_admin;

--
-- Name: oc_direct_edit_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_direct_edit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_direct_edit_id_seq OWNER TO oc_admin;

--
-- Name: oc_direct_edit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_direct_edit_id_seq OWNED BY public.oc_direct_edit.id;


--
-- Name: oc_directlink; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_directlink (
    id bigint NOT NULL,
    user_id character varying(64) DEFAULT NULL::character varying,
    file_id bigint NOT NULL,
    token character varying(60) DEFAULT NULL::character varying,
    expiration bigint NOT NULL
);


ALTER TABLE public.oc_directlink OWNER TO oc_admin;

--
-- Name: oc_directlink_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_directlink_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_directlink_id_seq OWNER TO oc_admin;

--
-- Name: oc_directlink_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_directlink_id_seq OWNED BY public.oc_directlink.id;


--
-- Name: oc_federated_reshares; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_federated_reshares (
    share_id bigint NOT NULL,
    remote_id character varying(255) DEFAULT ''::character varying
);


ALTER TABLE public.oc_federated_reshares OWNER TO oc_admin;

--
-- Name: oc_file_locks; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_file_locks (
    id bigint NOT NULL,
    lock integer DEFAULT 0 NOT NULL,
    key character varying(64) NOT NULL,
    ttl integer DEFAULT '-1'::integer NOT NULL
);


ALTER TABLE public.oc_file_locks OWNER TO oc_admin;

--
-- Name: oc_file_locks_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_file_locks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_file_locks_id_seq OWNER TO oc_admin;

--
-- Name: oc_file_locks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_file_locks_id_seq OWNED BY public.oc_file_locks.id;


--
-- Name: oc_filecache; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_filecache (
    fileid bigint NOT NULL,
    storage bigint DEFAULT 0 NOT NULL,
    path character varying(4000) DEFAULT NULL::character varying,
    path_hash character varying(32) DEFAULT ''::character varying NOT NULL,
    parent bigint DEFAULT 0 NOT NULL,
    name character varying(250) DEFAULT NULL::character varying,
    mimetype bigint DEFAULT 0 NOT NULL,
    mimepart bigint DEFAULT 0 NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    mtime bigint DEFAULT 0 NOT NULL,
    storage_mtime bigint DEFAULT 0 NOT NULL,
    encrypted integer DEFAULT 0 NOT NULL,
    unencrypted_size bigint DEFAULT 0 NOT NULL,
    etag character varying(40) DEFAULT NULL::character varying,
    permissions integer DEFAULT 0,
    checksum character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_filecache OWNER TO oc_admin;

--
-- Name: oc_filecache_extended; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_filecache_extended (
    fileid bigint NOT NULL,
    metadata_etag character varying(40) DEFAULT NULL::character varying,
    creation_time bigint DEFAULT 0 NOT NULL,
    upload_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_filecache_extended OWNER TO oc_admin;

--
-- Name: oc_filecache_fileid_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_filecache_fileid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_filecache_fileid_seq OWNER TO oc_admin;

--
-- Name: oc_filecache_fileid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_filecache_fileid_seq OWNED BY public.oc_filecache.fileid;


--
-- Name: oc_files_metadata; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_files_metadata (
    id bigint NOT NULL,
    file_id bigint NOT NULL,
    json text NOT NULL,
    sync_token character varying(15) NOT NULL,
    last_update timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.oc_files_metadata OWNER TO oc_admin;

--
-- Name: oc_files_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_files_metadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_files_metadata_id_seq OWNER TO oc_admin;

--
-- Name: oc_files_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_files_metadata_id_seq OWNED BY public.oc_files_metadata.id;


--
-- Name: oc_files_metadata_index; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_files_metadata_index (
    id bigint NOT NULL,
    file_id bigint NOT NULL,
    meta_key character varying(31) DEFAULT NULL::character varying,
    meta_value_string character varying(63) DEFAULT NULL::character varying,
    meta_value_int bigint
);


ALTER TABLE public.oc_files_metadata_index OWNER TO oc_admin;

--
-- Name: oc_files_metadata_index_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_files_metadata_index_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_files_metadata_index_id_seq OWNER TO oc_admin;

--
-- Name: oc_files_metadata_index_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_files_metadata_index_id_seq OWNED BY public.oc_files_metadata_index.id;


--
-- Name: oc_files_reminders; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_files_reminders (
    id bigint NOT NULL,
    user_id character varying(64) NOT NULL,
    file_id bigint NOT NULL,
    due_date timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    notified boolean DEFAULT false
);


ALTER TABLE public.oc_files_reminders OWNER TO oc_admin;

--
-- Name: oc_files_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_files_reminders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_files_reminders_id_seq OWNER TO oc_admin;

--
-- Name: oc_files_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_files_reminders_id_seq OWNED BY public.oc_files_reminders.id;


--
-- Name: oc_files_trash; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_files_trash (
    auto_id bigint NOT NULL,
    id character varying(250) DEFAULT ''::character varying NOT NULL,
    "user" character varying(64) DEFAULT ''::character varying NOT NULL,
    "timestamp" character varying(12) DEFAULT ''::character varying NOT NULL,
    location character varying(512) DEFAULT ''::character varying NOT NULL,
    type character varying(4) DEFAULT NULL::character varying,
    mime character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_files_trash OWNER TO oc_admin;

--
-- Name: oc_files_trash_auto_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_files_trash_auto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_files_trash_auto_id_seq OWNER TO oc_admin;

--
-- Name: oc_files_trash_auto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_files_trash_auto_id_seq OWNED BY public.oc_files_trash.auto_id;


--
-- Name: oc_files_versions; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_files_versions (
    id bigint NOT NULL,
    file_id bigint NOT NULL,
    "timestamp" bigint NOT NULL,
    size bigint NOT NULL,
    mimetype bigint NOT NULL,
    metadata json NOT NULL
);


ALTER TABLE public.oc_files_versions OWNER TO oc_admin;

--
-- Name: oc_files_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_files_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_files_versions_id_seq OWNER TO oc_admin;

--
-- Name: oc_files_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_files_versions_id_seq OWNED BY public.oc_files_versions.id;


--
-- Name: oc_flow_checks; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_flow_checks (
    id integer NOT NULL,
    class character varying(256) DEFAULT ''::character varying NOT NULL,
    operator character varying(16) DEFAULT ''::character varying NOT NULL,
    value text,
    hash character varying(32) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_flow_checks OWNER TO oc_admin;

--
-- Name: oc_flow_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_flow_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_flow_checks_id_seq OWNER TO oc_admin;

--
-- Name: oc_flow_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_flow_checks_id_seq OWNED BY public.oc_flow_checks.id;


--
-- Name: oc_flow_operations; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_flow_operations (
    id integer NOT NULL,
    class character varying(256) DEFAULT ''::character varying NOT NULL,
    name character varying(256) DEFAULT ''::character varying,
    checks text,
    operation text,
    entity character varying(256) DEFAULT 'OCA\WorkflowEngine\Entity\File'::character varying NOT NULL,
    events text DEFAULT '[]'::text NOT NULL
);


ALTER TABLE public.oc_flow_operations OWNER TO oc_admin;

--
-- Name: oc_flow_operations_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_flow_operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_flow_operations_id_seq OWNER TO oc_admin;

--
-- Name: oc_flow_operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_flow_operations_id_seq OWNED BY public.oc_flow_operations.id;


--
-- Name: oc_flow_operations_scope; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_flow_operations_scope (
    id bigint NOT NULL,
    operation_id integer DEFAULT 0 NOT NULL,
    type integer DEFAULT 0 NOT NULL,
    value character varying(64) DEFAULT ''::character varying
);


ALTER TABLE public.oc_flow_operations_scope OWNER TO oc_admin;

--
-- Name: oc_flow_operations_scope_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_flow_operations_scope_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_flow_operations_scope_id_seq OWNER TO oc_admin;

--
-- Name: oc_flow_operations_scope_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_flow_operations_scope_id_seq OWNED BY public.oc_flow_operations_scope.id;


--
-- Name: oc_group_admin; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_group_admin (
    gid character varying(64) DEFAULT ''::character varying NOT NULL,
    uid character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_group_admin OWNER TO oc_admin;

--
-- Name: oc_group_user; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_group_user (
    gid character varying(64) DEFAULT ''::character varying NOT NULL,
    uid character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_group_user OWNER TO oc_admin;

--
-- Name: oc_groups; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_groups (
    gid character varying(64) DEFAULT ''::character varying NOT NULL,
    displayname character varying(255) DEFAULT 'name'::character varying NOT NULL
);


ALTER TABLE public.oc_groups OWNER TO oc_admin;

--
-- Name: oc_jobs; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_jobs (
    id bigint NOT NULL,
    class character varying(255) DEFAULT ''::character varying NOT NULL,
    argument character varying(4000) DEFAULT ''::character varying NOT NULL,
    last_run integer DEFAULT 0,
    last_checked integer DEFAULT 0,
    reserved_at integer DEFAULT 0,
    execution_duration integer DEFAULT 0,
    argument_hash character varying(64) DEFAULT NULL::character varying,
    time_sensitive smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.oc_jobs OWNER TO oc_admin;

--
-- Name: oc_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_jobs_id_seq OWNER TO oc_admin;

--
-- Name: oc_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_jobs_id_seq OWNED BY public.oc_jobs.id;


--
-- Name: oc_known_users; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_known_users (
    id bigint NOT NULL,
    known_to character varying(255) NOT NULL,
    known_user character varying(255) NOT NULL
);


ALTER TABLE public.oc_known_users OWNER TO oc_admin;

--
-- Name: oc_known_users_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_known_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_known_users_id_seq OWNER TO oc_admin;

--
-- Name: oc_known_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_known_users_id_seq OWNED BY public.oc_known_users.id;


--
-- Name: oc_login_flow_v2; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_login_flow_v2 (
    id bigint NOT NULL,
    "timestamp" bigint NOT NULL,
    started smallint DEFAULT 0 NOT NULL,
    poll_token character varying(255) NOT NULL,
    login_token character varying(255) NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    client_name character varying(255) NOT NULL,
    login_name character varying(255) DEFAULT NULL::character varying,
    server character varying(255) DEFAULT NULL::character varying,
    app_password character varying(1024) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_login_flow_v2 OWNER TO oc_admin;

--
-- Name: oc_login_flow_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_login_flow_v2_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_login_flow_v2_id_seq OWNER TO oc_admin;

--
-- Name: oc_login_flow_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_login_flow_v2_id_seq OWNED BY public.oc_login_flow_v2.id;


--
-- Name: oc_migrations; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_migrations (
    app character varying(255) NOT NULL,
    version character varying(255) NOT NULL
);


ALTER TABLE public.oc_migrations OWNER TO oc_admin;

--
-- Name: oc_mimetypes; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_mimetypes (
    id bigint NOT NULL,
    mimetype character varying(255) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_mimetypes OWNER TO oc_admin;

--
-- Name: oc_mimetypes_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_mimetypes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_mimetypes_id_seq OWNER TO oc_admin;

--
-- Name: oc_mimetypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_mimetypes_id_seq OWNED BY public.oc_mimetypes.id;


--
-- Name: oc_mounts; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_mounts (
    id bigint NOT NULL,
    storage_id bigint NOT NULL,
    root_id bigint NOT NULL,
    user_id character varying(64) NOT NULL,
    mount_point character varying(4000) NOT NULL,
    mount_id bigint,
    mount_provider_class character varying(128) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_mounts OWNER TO oc_admin;

--
-- Name: oc_mounts_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_mounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_mounts_id_seq OWNER TO oc_admin;

--
-- Name: oc_mounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_mounts_id_seq OWNED BY public.oc_mounts.id;


--
-- Name: oc_notifications; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_notifications (
    notification_id integer NOT NULL,
    app character varying(32) NOT NULL,
    "user" character varying(64) NOT NULL,
    "timestamp" integer DEFAULT 0 NOT NULL,
    object_type character varying(64) NOT NULL,
    object_id character varying(64) NOT NULL,
    subject character varying(64) NOT NULL,
    subject_parameters text,
    message character varying(64) DEFAULT NULL::character varying,
    message_parameters text,
    link character varying(4000) DEFAULT NULL::character varying,
    icon character varying(4000) DEFAULT NULL::character varying,
    actions text
);


ALTER TABLE public.oc_notifications OWNER TO oc_admin;

--
-- Name: oc_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_notifications_notification_id_seq OWNER TO oc_admin;

--
-- Name: oc_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_notifications_notification_id_seq OWNED BY public.oc_notifications.notification_id;


--
-- Name: oc_notifications_pushhash; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_notifications_pushhash (
    id integer NOT NULL,
    uid character varying(64) NOT NULL,
    token integer DEFAULT 0 NOT NULL,
    deviceidentifier character varying(128) NOT NULL,
    devicepublickey character varying(512) NOT NULL,
    devicepublickeyhash character varying(128) NOT NULL,
    pushtokenhash character varying(128) NOT NULL,
    proxyserver character varying(256) NOT NULL,
    apptype character varying(32) DEFAULT 'unknown'::character varying NOT NULL
);


ALTER TABLE public.oc_notifications_pushhash OWNER TO oc_admin;

--
-- Name: oc_notifications_pushhash_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_notifications_pushhash_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_notifications_pushhash_id_seq OWNER TO oc_admin;

--
-- Name: oc_notifications_pushhash_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_notifications_pushhash_id_seq OWNED BY public.oc_notifications_pushhash.id;


--
-- Name: oc_notifications_settings; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_notifications_settings (
    id bigint NOT NULL,
    user_id character varying(64) NOT NULL,
    batch_time integer DEFAULT 0 NOT NULL,
    last_send_id bigint DEFAULT 0 NOT NULL,
    next_send_time integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_notifications_settings OWNER TO oc_admin;

--
-- Name: oc_notifications_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_notifications_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_notifications_settings_id_seq OWNER TO oc_admin;

--
-- Name: oc_notifications_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_notifications_settings_id_seq OWNED BY public.oc_notifications_settings.id;


--
-- Name: oc_oauth2_access_tokens; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_oauth2_access_tokens (
    id integer NOT NULL,
    token_id integer NOT NULL,
    client_id integer NOT NULL,
    hashed_code character varying(128) NOT NULL,
    encrypted_token character varying(786) NOT NULL,
    code_created_at bigint DEFAULT 0 NOT NULL,
    token_count bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_oauth2_access_tokens OWNER TO oc_admin;

--
-- Name: oc_oauth2_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_oauth2_access_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_oauth2_access_tokens_id_seq OWNER TO oc_admin;

--
-- Name: oc_oauth2_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_oauth2_access_tokens_id_seq OWNED BY public.oc_oauth2_access_tokens.id;


--
-- Name: oc_oauth2_clients; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_oauth2_clients (
    id integer NOT NULL,
    name character varying(64) NOT NULL,
    redirect_uri character varying(2000) NOT NULL,
    client_identifier character varying(64) NOT NULL,
    secret character varying(512) NOT NULL
);


ALTER TABLE public.oc_oauth2_clients OWNER TO oc_admin;

--
-- Name: oc_oauth2_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_oauth2_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_oauth2_clients_id_seq OWNER TO oc_admin;

--
-- Name: oc_oauth2_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_oauth2_clients_id_seq OWNED BY public.oc_oauth2_clients.id;


--
-- Name: oc_open_local_editor; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_open_local_editor (
    id bigint NOT NULL,
    user_id character varying(64) NOT NULL,
    path_hash character varying(64) NOT NULL,
    expiration_time bigint NOT NULL,
    token character varying(128) NOT NULL
);


ALTER TABLE public.oc_open_local_editor OWNER TO oc_admin;

--
-- Name: oc_open_local_editor_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_open_local_editor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_open_local_editor_id_seq OWNER TO oc_admin;

--
-- Name: oc_open_local_editor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_open_local_editor_id_seq OWNED BY public.oc_open_local_editor.id;


--
-- Name: oc_photos_albums; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_photos_albums (
    album_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    "user" character varying(255) NOT NULL,
    created bigint NOT NULL,
    location character varying(255) NOT NULL,
    last_added_photo bigint NOT NULL
);


ALTER TABLE public.oc_photos_albums OWNER TO oc_admin;

--
-- Name: oc_photos_albums_album_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_photos_albums_album_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_photos_albums_album_id_seq OWNER TO oc_admin;

--
-- Name: oc_photos_albums_album_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_photos_albums_album_id_seq OWNED BY public.oc_photos_albums.album_id;


--
-- Name: oc_photos_albums_collabs; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_photos_albums_collabs (
    id bigint NOT NULL,
    album_id bigint NOT NULL,
    collaborator_id character varying(64) NOT NULL,
    collaborator_type integer NOT NULL
);


ALTER TABLE public.oc_photos_albums_collabs OWNER TO oc_admin;

--
-- Name: oc_photos_albums_collabs_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_photos_albums_collabs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_photos_albums_collabs_id_seq OWNER TO oc_admin;

--
-- Name: oc_photos_albums_collabs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_photos_albums_collabs_id_seq OWNED BY public.oc_photos_albums_collabs.id;


--
-- Name: oc_photos_albums_files; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_photos_albums_files (
    album_file_id bigint NOT NULL,
    album_id bigint NOT NULL,
    file_id bigint NOT NULL,
    added bigint NOT NULL,
    owner character varying(64) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_photos_albums_files OWNER TO oc_admin;

--
-- Name: oc_photos_albums_files_album_file_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_photos_albums_files_album_file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_photos_albums_files_album_file_id_seq OWNER TO oc_admin;

--
-- Name: oc_photos_albums_files_album_file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_photos_albums_files_album_file_id_seq OWNED BY public.oc_photos_albums_files.album_file_id;


--
-- Name: oc_preferences; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_preferences (
    userid character varying(64) DEFAULT ''::character varying NOT NULL,
    appid character varying(32) DEFAULT ''::character varying NOT NULL,
    configkey character varying(64) DEFAULT ''::character varying NOT NULL,
    configvalue text
);


ALTER TABLE public.oc_preferences OWNER TO oc_admin;

--
-- Name: oc_privacy_admins; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_privacy_admins (
    id integer NOT NULL,
    displayname character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_privacy_admins OWNER TO oc_admin;

--
-- Name: oc_privacy_admins_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_privacy_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_privacy_admins_id_seq OWNER TO oc_admin;

--
-- Name: oc_privacy_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_privacy_admins_id_seq OWNED BY public.oc_privacy_admins.id;


--
-- Name: oc_profile_config; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_profile_config (
    id bigint NOT NULL,
    user_id character varying(64) NOT NULL,
    config text NOT NULL
);


ALTER TABLE public.oc_profile_config OWNER TO oc_admin;

--
-- Name: oc_profile_config_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_profile_config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_profile_config_id_seq OWNER TO oc_admin;

--
-- Name: oc_profile_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_profile_config_id_seq OWNED BY public.oc_profile_config.id;


--
-- Name: oc_properties; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_properties (
    id bigint NOT NULL,
    userid character varying(64) DEFAULT ''::character varying NOT NULL,
    propertypath character varying(255) DEFAULT ''::character varying NOT NULL,
    propertyname character varying(255) DEFAULT ''::character varying NOT NULL,
    propertyvalue text NOT NULL,
    valuetype smallint DEFAULT 1
);


ALTER TABLE public.oc_properties OWNER TO oc_admin;

--
-- Name: oc_properties_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_properties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_properties_id_seq OWNER TO oc_admin;

--
-- Name: oc_properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_properties_id_seq OWNED BY public.oc_properties.id;


--
-- Name: oc_ratelimit_entries; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_ratelimit_entries (
    id bigint NOT NULL,
    hash character varying(128) NOT NULL,
    delete_after timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.oc_ratelimit_entries OWNER TO oc_admin;

--
-- Name: oc_ratelimit_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_ratelimit_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_ratelimit_entries_id_seq OWNER TO oc_admin;

--
-- Name: oc_ratelimit_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_ratelimit_entries_id_seq OWNED BY public.oc_ratelimit_entries.id;


--
-- Name: oc_reactions; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_reactions (
    id bigint NOT NULL,
    parent_id bigint NOT NULL,
    message_id bigint NOT NULL,
    actor_type character varying(64) DEFAULT ''::character varying NOT NULL,
    actor_id character varying(64) DEFAULT ''::character varying NOT NULL,
    reaction character varying(32) NOT NULL
);


ALTER TABLE public.oc_reactions OWNER TO oc_admin;

--
-- Name: oc_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_reactions_id_seq OWNER TO oc_admin;

--
-- Name: oc_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_reactions_id_seq OWNED BY public.oc_reactions.id;


--
-- Name: oc_recent_contact; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_recent_contact (
    id integer NOT NULL,
    actor_uid character varying(64) NOT NULL,
    uid character varying(64) DEFAULT NULL::character varying,
    email character varying(255) DEFAULT NULL::character varying,
    federated_cloud_id character varying(255) DEFAULT NULL::character varying,
    card bytea NOT NULL,
    last_contact integer NOT NULL
);


ALTER TABLE public.oc_recent_contact OWNER TO oc_admin;

--
-- Name: oc_recent_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_recent_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_recent_contact_id_seq OWNER TO oc_admin;

--
-- Name: oc_recent_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_recent_contact_id_seq OWNED BY public.oc_recent_contact.id;


--
-- Name: oc_schedulingobjects; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_schedulingobjects (
    id bigint NOT NULL,
    principaluri character varying(255) DEFAULT NULL::character varying,
    calendardata bytea,
    uri character varying(255) DEFAULT NULL::character varying,
    lastmodified integer,
    etag character varying(32) DEFAULT NULL::character varying,
    size bigint NOT NULL
);


ALTER TABLE public.oc_schedulingobjects OWNER TO oc_admin;

--
-- Name: oc_schedulingobjects_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_schedulingobjects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_schedulingobjects_id_seq OWNER TO oc_admin;

--
-- Name: oc_schedulingobjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_schedulingobjects_id_seq OWNED BY public.oc_schedulingobjects.id;


--
-- Name: oc_share; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_share (
    id bigint NOT NULL,
    share_type smallint DEFAULT 0 NOT NULL,
    share_with character varying(255) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT NULL::character varying,
    uid_owner character varying(64) DEFAULT ''::character varying NOT NULL,
    uid_initiator character varying(64) DEFAULT NULL::character varying,
    parent bigint,
    item_type character varying(64) DEFAULT ''::character varying NOT NULL,
    item_source character varying(255) DEFAULT NULL::character varying,
    item_target character varying(255) DEFAULT NULL::character varying,
    file_source bigint,
    file_target character varying(512) DEFAULT NULL::character varying,
    permissions smallint DEFAULT 0 NOT NULL,
    stime bigint DEFAULT 0 NOT NULL,
    accepted smallint DEFAULT 0 NOT NULL,
    expiration timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    token character varying(32) DEFAULT NULL::character varying,
    mail_send smallint DEFAULT 0 NOT NULL,
    share_name character varying(64) DEFAULT NULL::character varying,
    password_by_talk boolean DEFAULT false,
    note text,
    hide_download smallint DEFAULT 0,
    label character varying(255) DEFAULT NULL::character varying,
    attributes json,
    password_expiration_time timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_share OWNER TO oc_admin;

--
-- Name: oc_share_external; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_share_external (
    id bigint NOT NULL,
    parent bigint DEFAULT '-1'::integer,
    share_type integer,
    remote character varying(512) NOT NULL,
    remote_id character varying(255) DEFAULT ''::character varying,
    share_token character varying(64) NOT NULL,
    password character varying(64) DEFAULT NULL::character varying,
    name character varying(4000) NOT NULL,
    owner character varying(64) NOT NULL,
    "user" character varying(64) NOT NULL,
    mountpoint character varying(4000) NOT NULL,
    mountpoint_hash character varying(32) NOT NULL,
    accepted integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_share_external OWNER TO oc_admin;

--
-- Name: oc_share_external_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_share_external_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_share_external_id_seq OWNER TO oc_admin;

--
-- Name: oc_share_external_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_share_external_id_seq OWNED BY public.oc_share_external.id;


--
-- Name: oc_share_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_share_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_share_id_seq OWNER TO oc_admin;

--
-- Name: oc_share_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_share_id_seq OWNED BY public.oc_share.id;


--
-- Name: oc_shares_limits; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_shares_limits (
    id character varying(32) NOT NULL,
    "limit" bigint NOT NULL,
    downloads bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_shares_limits OWNER TO oc_admin;

--
-- Name: oc_storages; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_storages (
    numeric_id bigint NOT NULL,
    id character varying(64) DEFAULT NULL::character varying,
    available integer DEFAULT 1 NOT NULL,
    last_checked integer
);


ALTER TABLE public.oc_storages OWNER TO oc_admin;

--
-- Name: oc_storages_credentials; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_storages_credentials (
    id bigint NOT NULL,
    "user" character varying(64) DEFAULT NULL::character varying,
    identifier character varying(64) NOT NULL,
    credentials text
);


ALTER TABLE public.oc_storages_credentials OWNER TO oc_admin;

--
-- Name: oc_storages_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_storages_credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_storages_credentials_id_seq OWNER TO oc_admin;

--
-- Name: oc_storages_credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_storages_credentials_id_seq OWNED BY public.oc_storages_credentials.id;


--
-- Name: oc_storages_numeric_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_storages_numeric_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_storages_numeric_id_seq OWNER TO oc_admin;

--
-- Name: oc_storages_numeric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_storages_numeric_id_seq OWNED BY public.oc_storages.numeric_id;


--
-- Name: oc_systemtag; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_systemtag (
    id bigint NOT NULL,
    name character varying(64) DEFAULT ''::character varying NOT NULL,
    visibility smallint DEFAULT 1 NOT NULL,
    editable smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.oc_systemtag OWNER TO oc_admin;

--
-- Name: oc_systemtag_group; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_systemtag_group (
    systemtagid bigint DEFAULT 0 NOT NULL,
    gid character varying(255) NOT NULL
);


ALTER TABLE public.oc_systemtag_group OWNER TO oc_admin;

--
-- Name: oc_systemtag_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_systemtag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_systemtag_id_seq OWNER TO oc_admin;

--
-- Name: oc_systemtag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_systemtag_id_seq OWNED BY public.oc_systemtag.id;


--
-- Name: oc_systemtag_object_mapping; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_systemtag_object_mapping (
    objectid character varying(64) DEFAULT ''::character varying NOT NULL,
    objecttype character varying(64) DEFAULT ''::character varying NOT NULL,
    systemtagid bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_systemtag_object_mapping OWNER TO oc_admin;

--
-- Name: oc_text2image_tasks; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_text2image_tasks (
    id bigint NOT NULL,
    input text NOT NULL,
    status integer DEFAULT 0,
    number_of_images integer DEFAULT 1 NOT NULL,
    user_id character varying(64) DEFAULT NULL::character varying,
    app_id character varying(32) DEFAULT ''::character varying NOT NULL,
    identifier character varying(255) DEFAULT ''::character varying,
    last_updated timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    completion_expected_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_text2image_tasks OWNER TO oc_admin;

--
-- Name: oc_text2image_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_text2image_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_text2image_tasks_id_seq OWNER TO oc_admin;

--
-- Name: oc_text2image_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_text2image_tasks_id_seq OWNED BY public.oc_text2image_tasks.id;


--
-- Name: oc_text_documents; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_text_documents (
    id bigint NOT NULL,
    current_version bigint DEFAULT 0,
    last_saved_version bigint DEFAULT 0,
    last_saved_version_time bigint NOT NULL,
    last_saved_version_etag character varying(64) DEFAULT ''::character varying,
    base_version_etag character varying(64) DEFAULT ''::character varying
);


ALTER TABLE public.oc_text_documents OWNER TO oc_admin;

--
-- Name: oc_text_sessions; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_text_sessions (
    id bigint NOT NULL,
    user_id character varying(64) DEFAULT NULL::character varying,
    guest_name character varying(64) DEFAULT NULL::character varying,
    color character varying(7) DEFAULT NULL::character varying,
    token character varying(64) NOT NULL,
    document_id bigint NOT NULL,
    last_contact bigint NOT NULL,
    last_awareness_message text DEFAULT ''::text
);


ALTER TABLE public.oc_text_sessions OWNER TO oc_admin;

--
-- Name: oc_text_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_text_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_text_sessions_id_seq OWNER TO oc_admin;

--
-- Name: oc_text_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_text_sessions_id_seq OWNED BY public.oc_text_sessions.id;


--
-- Name: oc_text_steps; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_text_steps (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    session_id bigint NOT NULL,
    data text NOT NULL,
    version bigint DEFAULT 0
);


ALTER TABLE public.oc_text_steps OWNER TO oc_admin;

--
-- Name: oc_text_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_text_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_text_steps_id_seq OWNER TO oc_admin;

--
-- Name: oc_text_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_text_steps_id_seq OWNED BY public.oc_text_steps.id;


--
-- Name: oc_textprocessing_tasks; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_textprocessing_tasks (
    id bigint NOT NULL,
    type character varying(255) NOT NULL,
    input text NOT NULL,
    output text,
    status integer DEFAULT 0,
    user_id character varying(64) DEFAULT NULL::character varying,
    app_id character varying(32) DEFAULT ''::character varying NOT NULL,
    identifier character varying(255) DEFAULT ''::character varying NOT NULL,
    last_updated integer DEFAULT 0,
    completion_expected_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.oc_textprocessing_tasks OWNER TO oc_admin;

--
-- Name: oc_textprocessing_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_textprocessing_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_textprocessing_tasks_id_seq OWNER TO oc_admin;

--
-- Name: oc_textprocessing_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_textprocessing_tasks_id_seq OWNED BY public.oc_textprocessing_tasks.id;


--
-- Name: oc_trusted_servers; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_trusted_servers (
    id integer NOT NULL,
    url character varying(512) NOT NULL,
    url_hash character varying(255) DEFAULT ''::character varying NOT NULL,
    token character varying(128) DEFAULT NULL::character varying,
    shared_secret character varying(256) DEFAULT NULL::character varying,
    status integer DEFAULT 2 NOT NULL,
    sync_token character varying(512) DEFAULT NULL::character varying
);


ALTER TABLE public.oc_trusted_servers OWNER TO oc_admin;

--
-- Name: oc_trusted_servers_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_trusted_servers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_trusted_servers_id_seq OWNER TO oc_admin;

--
-- Name: oc_trusted_servers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_trusted_servers_id_seq OWNED BY public.oc_trusted_servers.id;


--
-- Name: oc_twofactor_backupcodes; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_twofactor_backupcodes (
    id bigint NOT NULL,
    user_id character varying(64) DEFAULT ''::character varying NOT NULL,
    code character varying(128) NOT NULL,
    used smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_twofactor_backupcodes OWNER TO oc_admin;

--
-- Name: oc_twofactor_backupcodes_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_twofactor_backupcodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_twofactor_backupcodes_id_seq OWNER TO oc_admin;

--
-- Name: oc_twofactor_backupcodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_twofactor_backupcodes_id_seq OWNED BY public.oc_twofactor_backupcodes.id;


--
-- Name: oc_twofactor_providers; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_twofactor_providers (
    provider_id character varying(32) NOT NULL,
    uid character varying(64) NOT NULL,
    enabled smallint NOT NULL
);


ALTER TABLE public.oc_twofactor_providers OWNER TO oc_admin;

--
-- Name: oc_user_status; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_user_status (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    status_timestamp integer NOT NULL,
    is_user_defined boolean,
    message_id character varying(255) DEFAULT NULL::character varying,
    custom_icon character varying(255) DEFAULT NULL::character varying,
    custom_message text,
    clear_at integer,
    is_backup boolean DEFAULT false,
    status_message_timestamp integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.oc_user_status OWNER TO oc_admin;

--
-- Name: oc_user_status_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_user_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_user_status_id_seq OWNER TO oc_admin;

--
-- Name: oc_user_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_user_status_id_seq OWNED BY public.oc_user_status.id;


--
-- Name: oc_user_transfer_owner; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_user_transfer_owner (
    id bigint NOT NULL,
    source_user character varying(64) NOT NULL,
    target_user character varying(64) NOT NULL,
    file_id bigint NOT NULL,
    node_name character varying(255) NOT NULL
);


ALTER TABLE public.oc_user_transfer_owner OWNER TO oc_admin;

--
-- Name: oc_user_transfer_owner_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_user_transfer_owner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_user_transfer_owner_id_seq OWNER TO oc_admin;

--
-- Name: oc_user_transfer_owner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_user_transfer_owner_id_seq OWNED BY public.oc_user_transfer_owner.id;


--
-- Name: oc_users; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_users (
    uid character varying(64) DEFAULT ''::character varying NOT NULL,
    displayname character varying(64) DEFAULT NULL::character varying,
    password character varying(255) DEFAULT ''::character varying NOT NULL,
    uid_lower character varying(64) DEFAULT ''::character varying
);


ALTER TABLE public.oc_users OWNER TO oc_admin;

--
-- Name: oc_vcategory; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_vcategory (
    id bigint NOT NULL,
    uid character varying(64) DEFAULT ''::character varying NOT NULL,
    type character varying(64) DEFAULT ''::character varying NOT NULL,
    category character varying(255) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_vcategory OWNER TO oc_admin;

--
-- Name: oc_vcategory_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_vcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_vcategory_id_seq OWNER TO oc_admin;

--
-- Name: oc_vcategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_vcategory_id_seq OWNED BY public.oc_vcategory.id;


--
-- Name: oc_vcategory_to_object; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_vcategory_to_object (
    objid bigint DEFAULT 0 NOT NULL,
    categoryid bigint DEFAULT 0 NOT NULL,
    type character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.oc_vcategory_to_object OWNER TO oc_admin;

--
-- Name: oc_webauthn; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_webauthn (
    id integer NOT NULL,
    uid character varying(64) NOT NULL,
    name character varying(64) NOT NULL,
    public_key_credential_id character varying(512) NOT NULL,
    data text NOT NULL
);


ALTER TABLE public.oc_webauthn OWNER TO oc_admin;

--
-- Name: oc_webauthn_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_webauthn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_webauthn_id_seq OWNER TO oc_admin;

--
-- Name: oc_webauthn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_webauthn_id_seq OWNED BY public.oc_webauthn.id;


--
-- Name: oc_whats_new; Type: TABLE; Schema: public; Owner: oc_admin
--

CREATE TABLE public.oc_whats_new (
    id integer NOT NULL,
    version character varying(64) DEFAULT '11'::character varying NOT NULL,
    etag character varying(64) DEFAULT ''::character varying NOT NULL,
    last_check integer DEFAULT 0 NOT NULL,
    data text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.oc_whats_new OWNER TO oc_admin;

--
-- Name: oc_whats_new_id_seq; Type: SEQUENCE; Schema: public; Owner: oc_admin
--

CREATE SEQUENCE public.oc_whats_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oc_whats_new_id_seq OWNER TO oc_admin;

--
-- Name: oc_whats_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oc_admin
--

ALTER SEQUENCE public.oc_whats_new_id_seq OWNED BY public.oc_whats_new.id;


--
-- Name: oc_accounts_data id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_accounts_data ALTER COLUMN id SET DEFAULT nextval('public.oc_accounts_data_id_seq'::regclass);


--
-- Name: oc_activity activity_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_activity ALTER COLUMN activity_id SET DEFAULT nextval('public.oc_activity_activity_id_seq'::regclass);


--
-- Name: oc_activity_mq mail_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_activity_mq ALTER COLUMN mail_id SET DEFAULT nextval('public.oc_activity_mq_mail_id_seq'::regclass);


--
-- Name: oc_addressbookchanges id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_addressbookchanges ALTER COLUMN id SET DEFAULT nextval('public.oc_addressbookchanges_id_seq'::regclass);


--
-- Name: oc_addressbooks id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_addressbooks ALTER COLUMN id SET DEFAULT nextval('public.oc_addressbooks_id_seq'::regclass);


--
-- Name: oc_authorized_groups id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_authorized_groups ALTER COLUMN id SET DEFAULT nextval('public.oc_authorized_groups_id_seq'::regclass);


--
-- Name: oc_authtoken id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_authtoken ALTER COLUMN id SET DEFAULT nextval('public.oc_authtoken_id_seq'::regclass);


--
-- Name: oc_bruteforce_attempts id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_bruteforce_attempts ALTER COLUMN id SET DEFAULT nextval('public.oc_bruteforce_attempts_id_seq'::regclass);


--
-- Name: oc_calendar_invitations id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_invitations ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_invitations_id_seq'::regclass);


--
-- Name: oc_calendar_reminders id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_reminders ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_reminders_id_seq'::regclass);


--
-- Name: oc_calendar_resources id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_resources ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_resources_id_seq'::regclass);


--
-- Name: oc_calendar_resources_md id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_resources_md ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_resources_md_id_seq'::regclass);


--
-- Name: oc_calendar_rooms id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_rooms ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_rooms_id_seq'::regclass);


--
-- Name: oc_calendar_rooms_md id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_rooms_md ALTER COLUMN id SET DEFAULT nextval('public.oc_calendar_rooms_md_id_seq'::regclass);


--
-- Name: oc_calendarchanges id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarchanges ALTER COLUMN id SET DEFAULT nextval('public.oc_calendarchanges_id_seq'::regclass);


--
-- Name: oc_calendarobjects id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarobjects ALTER COLUMN id SET DEFAULT nextval('public.oc_calendarobjects_id_seq'::regclass);


--
-- Name: oc_calendarobjects_props id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarobjects_props ALTER COLUMN id SET DEFAULT nextval('public.oc_calendarobjects_props_id_seq'::regclass);


--
-- Name: oc_calendars id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendars ALTER COLUMN id SET DEFAULT nextval('public.oc_calendars_id_seq'::regclass);


--
-- Name: oc_calendarsubscriptions id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarsubscriptions ALTER COLUMN id SET DEFAULT nextval('public.oc_calendarsubscriptions_id_seq'::regclass);


--
-- Name: oc_cards id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_cards ALTER COLUMN id SET DEFAULT nextval('public.oc_cards_id_seq'::regclass);


--
-- Name: oc_cards_properties id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_cards_properties ALTER COLUMN id SET DEFAULT nextval('public.oc_cards_properties_id_seq'::regclass);


--
-- Name: oc_circles_circle id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_circle ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_circle_id_seq'::regclass);


--
-- Name: oc_circles_member id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_member ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_member_id_seq'::regclass);


--
-- Name: oc_circles_mount id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_mount ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_mount_id_seq'::regclass);


--
-- Name: oc_circles_mountpoint id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_mountpoint ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_mountpoint_id_seq'::regclass);


--
-- Name: oc_circles_remote id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_remote ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_remote_id_seq'::regclass);


--
-- Name: oc_circles_share_lock id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_share_lock ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_share_lock_id_seq'::regclass);


--
-- Name: oc_circles_token id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_token ALTER COLUMN id SET DEFAULT nextval('public.oc_circles_token_id_seq'::regclass);


--
-- Name: oc_collres_collections id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_collres_collections ALTER COLUMN id SET DEFAULT nextval('public.oc_collres_collections_id_seq'::regclass);


--
-- Name: oc_comments id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_comments ALTER COLUMN id SET DEFAULT nextval('public.oc_comments_id_seq'::regclass);


--
-- Name: oc_dav_absence id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_absence ALTER COLUMN id SET DEFAULT nextval('public.oc_dav_absence_id_seq'::regclass);


--
-- Name: oc_dav_cal_proxy id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_cal_proxy ALTER COLUMN id SET DEFAULT nextval('public.oc_dav_cal_proxy_id_seq'::regclass);


--
-- Name: oc_dav_shares id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_shares ALTER COLUMN id SET DEFAULT nextval('public.oc_dav_shares_id_seq'::regclass);


--
-- Name: oc_direct_edit id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_direct_edit ALTER COLUMN id SET DEFAULT nextval('public.oc_direct_edit_id_seq'::regclass);


--
-- Name: oc_directlink id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_directlink ALTER COLUMN id SET DEFAULT nextval('public.oc_directlink_id_seq'::regclass);


--
-- Name: oc_file_locks id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_file_locks ALTER COLUMN id SET DEFAULT nextval('public.oc_file_locks_id_seq'::regclass);


--
-- Name: oc_filecache fileid; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_filecache ALTER COLUMN fileid SET DEFAULT nextval('public.oc_filecache_fileid_seq'::regclass);


--
-- Name: oc_files_metadata id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_metadata ALTER COLUMN id SET DEFAULT nextval('public.oc_files_metadata_id_seq'::regclass);


--
-- Name: oc_files_metadata_index id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_metadata_index ALTER COLUMN id SET DEFAULT nextval('public.oc_files_metadata_index_id_seq'::regclass);


--
-- Name: oc_files_reminders id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_reminders ALTER COLUMN id SET DEFAULT nextval('public.oc_files_reminders_id_seq'::regclass);


--
-- Name: oc_files_trash auto_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_trash ALTER COLUMN auto_id SET DEFAULT nextval('public.oc_files_trash_auto_id_seq'::regclass);


--
-- Name: oc_files_versions id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_versions ALTER COLUMN id SET DEFAULT nextval('public.oc_files_versions_id_seq'::regclass);


--
-- Name: oc_flow_checks id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_checks ALTER COLUMN id SET DEFAULT nextval('public.oc_flow_checks_id_seq'::regclass);


--
-- Name: oc_flow_operations id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_operations ALTER COLUMN id SET DEFAULT nextval('public.oc_flow_operations_id_seq'::regclass);


--
-- Name: oc_flow_operations_scope id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_operations_scope ALTER COLUMN id SET DEFAULT nextval('public.oc_flow_operations_scope_id_seq'::regclass);


--
-- Name: oc_jobs id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_jobs ALTER COLUMN id SET DEFAULT nextval('public.oc_jobs_id_seq'::regclass);


--
-- Name: oc_known_users id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_known_users ALTER COLUMN id SET DEFAULT nextval('public.oc_known_users_id_seq'::regclass);


--
-- Name: oc_login_flow_v2 id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_login_flow_v2 ALTER COLUMN id SET DEFAULT nextval('public.oc_login_flow_v2_id_seq'::regclass);


--
-- Name: oc_mimetypes id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_mimetypes ALTER COLUMN id SET DEFAULT nextval('public.oc_mimetypes_id_seq'::regclass);


--
-- Name: oc_mounts id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_mounts ALTER COLUMN id SET DEFAULT nextval('public.oc_mounts_id_seq'::regclass);


--
-- Name: oc_notifications notification_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.oc_notifications_notification_id_seq'::regclass);


--
-- Name: oc_notifications_pushhash id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications_pushhash ALTER COLUMN id SET DEFAULT nextval('public.oc_notifications_pushhash_id_seq'::regclass);


--
-- Name: oc_notifications_settings id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications_settings ALTER COLUMN id SET DEFAULT nextval('public.oc_notifications_settings_id_seq'::regclass);


--
-- Name: oc_oauth2_access_tokens id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_oauth2_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.oc_oauth2_access_tokens_id_seq'::regclass);


--
-- Name: oc_oauth2_clients id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_oauth2_clients ALTER COLUMN id SET DEFAULT nextval('public.oc_oauth2_clients_id_seq'::regclass);


--
-- Name: oc_open_local_editor id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_open_local_editor ALTER COLUMN id SET DEFAULT nextval('public.oc_open_local_editor_id_seq'::regclass);


--
-- Name: oc_photos_albums album_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums ALTER COLUMN album_id SET DEFAULT nextval('public.oc_photos_albums_album_id_seq'::regclass);


--
-- Name: oc_photos_albums_collabs id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums_collabs ALTER COLUMN id SET DEFAULT nextval('public.oc_photos_albums_collabs_id_seq'::regclass);


--
-- Name: oc_photos_albums_files album_file_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums_files ALTER COLUMN album_file_id SET DEFAULT nextval('public.oc_photos_albums_files_album_file_id_seq'::regclass);


--
-- Name: oc_privacy_admins id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_privacy_admins ALTER COLUMN id SET DEFAULT nextval('public.oc_privacy_admins_id_seq'::regclass);


--
-- Name: oc_profile_config id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_profile_config ALTER COLUMN id SET DEFAULT nextval('public.oc_profile_config_id_seq'::regclass);


--
-- Name: oc_properties id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_properties ALTER COLUMN id SET DEFAULT nextval('public.oc_properties_id_seq'::regclass);


--
-- Name: oc_ratelimit_entries id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_ratelimit_entries ALTER COLUMN id SET DEFAULT nextval('public.oc_ratelimit_entries_id_seq'::regclass);


--
-- Name: oc_reactions id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_reactions ALTER COLUMN id SET DEFAULT nextval('public.oc_reactions_id_seq'::regclass);


--
-- Name: oc_recent_contact id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_recent_contact ALTER COLUMN id SET DEFAULT nextval('public.oc_recent_contact_id_seq'::regclass);


--
-- Name: oc_schedulingobjects id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_schedulingobjects ALTER COLUMN id SET DEFAULT nextval('public.oc_schedulingobjects_id_seq'::regclass);


--
-- Name: oc_share id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_share ALTER COLUMN id SET DEFAULT nextval('public.oc_share_id_seq'::regclass);


--
-- Name: oc_share_external id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_share_external ALTER COLUMN id SET DEFAULT nextval('public.oc_share_external_id_seq'::regclass);


--
-- Name: oc_storages numeric_id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_storages ALTER COLUMN numeric_id SET DEFAULT nextval('public.oc_storages_numeric_id_seq'::regclass);


--
-- Name: oc_storages_credentials id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_storages_credentials ALTER COLUMN id SET DEFAULT nextval('public.oc_storages_credentials_id_seq'::regclass);


--
-- Name: oc_systemtag id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_systemtag ALTER COLUMN id SET DEFAULT nextval('public.oc_systemtag_id_seq'::regclass);


--
-- Name: oc_text2image_tasks id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text2image_tasks ALTER COLUMN id SET DEFAULT nextval('public.oc_text2image_tasks_id_seq'::regclass);


--
-- Name: oc_text_sessions id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text_sessions ALTER COLUMN id SET DEFAULT nextval('public.oc_text_sessions_id_seq'::regclass);


--
-- Name: oc_text_steps id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text_steps ALTER COLUMN id SET DEFAULT nextval('public.oc_text_steps_id_seq'::regclass);


--
-- Name: oc_textprocessing_tasks id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_textprocessing_tasks ALTER COLUMN id SET DEFAULT nextval('public.oc_textprocessing_tasks_id_seq'::regclass);


--
-- Name: oc_trusted_servers id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_trusted_servers ALTER COLUMN id SET DEFAULT nextval('public.oc_trusted_servers_id_seq'::regclass);


--
-- Name: oc_twofactor_backupcodes id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_twofactor_backupcodes ALTER COLUMN id SET DEFAULT nextval('public.oc_twofactor_backupcodes_id_seq'::regclass);


--
-- Name: oc_user_status id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_user_status ALTER COLUMN id SET DEFAULT nextval('public.oc_user_status_id_seq'::regclass);


--
-- Name: oc_user_transfer_owner id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_user_transfer_owner ALTER COLUMN id SET DEFAULT nextval('public.oc_user_transfer_owner_id_seq'::regclass);


--
-- Name: oc_vcategory id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_vcategory ALTER COLUMN id SET DEFAULT nextval('public.oc_vcategory_id_seq'::regclass);


--
-- Name: oc_webauthn id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_webauthn ALTER COLUMN id SET DEFAULT nextval('public.oc_webauthn_id_seq'::regclass);


--
-- Name: oc_whats_new id; Type: DEFAULT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_whats_new ALTER COLUMN id SET DEFAULT nextval('public.oc_whats_new_id_seq'::regclass);


--
-- Data for Name: oc_accounts; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_accounts (uid, data) FROM stdin;
admin	{"displayname":{"value":"admin","scope":"v2-federated","verified":"0"},"address":{"value":"","scope":"v2-local","verified":"0"},"website":{"value":"","scope":"v2-local","verified":"0"},"email":{"value":null,"scope":"v2-federated","verified":"0"},"avatar":{"scope":"v2-federated"},"phone":{"value":"","scope":"v2-local","verified":"0"},"twitter":{"value":"","scope":"v2-local","verified":"0"},"fediverse":{"value":"","scope":"v2-local","verified":"0"},"organisation":{"value":"","scope":"v2-local"},"role":{"value":"","scope":"v2-local"},"headline":{"value":"","scope":"v2-local"},"biography":{"value":"","scope":"v2-local"},"profile_enabled":{"value":"1"}}
\.


--
-- Data for Name: oc_accounts_data; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_accounts_data (id, uid, name, value) FROM stdin;
1	admin	displayname	admin
2	admin	address	
3	admin	website	
4	admin	email	
5	admin	phone	
6	admin	twitter	
7	admin	fediverse	
8	admin	organisation	
9	admin	role	
10	admin	headline	
11	admin	biography	
12	admin	profile_enabled	1
\.


--
-- Data for Name: oc_activity; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_activity (activity_id, "timestamp", priority, type, "user", affecteduser, app, subject, subjectparams, message, messageparams, file, link, object_type, object_id) FROM stdin;
1	1774806755	30	file_created	admin	admin	files	created_self	[{"3":"\\/Templates"}]		[]	/Templates	http://localhost/index.php/apps/files/?dir=/	files	3
2	1774806755	30	file_created	admin	admin	files	created_self	[{"4":"\\/Templates\\/Photo book.odt"}]		[]	/Templates/Photo book.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	4
3	1774806755	30	file_changed	admin	admin	files	changed_self	[{"4":"\\/Templates\\/Photo book.odt"}]		[]	/Templates/Photo book.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	4
4	1774806755	30	file_created	admin	admin	files	created_self	[{"5":"\\/Templates\\/Party invitation.odt"}]		[]	/Templates/Party invitation.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	5
5	1774806756	30	file_changed	admin	admin	files	changed_self	[{"5":"\\/Templates\\/Party invitation.odt"}]		[]	/Templates/Party invitation.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	5
6	1774806756	30	file_created	admin	admin	files	created_self	[{"6":"\\/Templates\\/Business model canvas.odg"}]		[]	/Templates/Business model canvas.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	6
7	1774806756	30	file_changed	admin	admin	files	changed_self	[{"6":"\\/Templates\\/Business model canvas.odg"}]		[]	/Templates/Business model canvas.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	6
8	1774806756	30	file_created	admin	admin	files	created_self	[{"7":"\\/Templates\\/Modern company.odp"}]		[]	/Templates/Modern company.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	7
9	1774806756	30	file_changed	admin	admin	files	changed_self	[{"7":"\\/Templates\\/Modern company.odp"}]		[]	/Templates/Modern company.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	7
10	1774806756	30	file_created	admin	admin	files	created_self	[{"8":"\\/Templates\\/Resume.odt"}]		[]	/Templates/Resume.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	8
11	1774806756	30	file_changed	admin	admin	files	changed_self	[{"8":"\\/Templates\\/Resume.odt"}]		[]	/Templates/Resume.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	8
12	1774806757	30	file_created	admin	admin	files	created_self	[{"9":"\\/Templates\\/Letter.odt"}]		[]	/Templates/Letter.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	9
13	1774806757	30	file_changed	admin	admin	files	changed_self	[{"9":"\\/Templates\\/Letter.odt"}]		[]	/Templates/Letter.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	9
14	1774806757	30	file_created	admin	admin	files	created_self	[{"10":"\\/Templates\\/Business model canvas.ods"}]		[]	/Templates/Business model canvas.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	10
15	1774806757	30	file_changed	admin	admin	files	changed_self	[{"10":"\\/Templates\\/Business model canvas.ods"}]		[]	/Templates/Business model canvas.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	10
16	1774806757	30	file_created	admin	admin	files	created_self	[{"11":"\\/Templates\\/Yellow idea.odp"}]		[]	/Templates/Yellow idea.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	11
17	1774806757	30	file_changed	admin	admin	files	changed_self	[{"11":"\\/Templates\\/Yellow idea.odp"}]		[]	/Templates/Yellow idea.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	11
18	1774806757	30	file_created	admin	admin	files	created_self	[{"12":"\\/Templates\\/Meeting notes.md"}]		[]	/Templates/Meeting notes.md	http://localhost/index.php/apps/files/?dir=/Templates	files	12
19	1774806757	30	file_changed	admin	admin	files	changed_self	[{"12":"\\/Templates\\/Meeting notes.md"}]		[]	/Templates/Meeting notes.md	http://localhost/index.php/apps/files/?dir=/Templates	files	12
20	1774806758	30	file_created	admin	admin	files	created_self	[{"13":"\\/Templates\\/Syllabus.odt"}]		[]	/Templates/Syllabus.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	13
21	1774806758	30	file_changed	admin	admin	files	changed_self	[{"13":"\\/Templates\\/Syllabus.odt"}]		[]	/Templates/Syllabus.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	13
22	1774806758	30	file_created	admin	admin	files	created_self	[{"14":"\\/Templates\\/Flowchart.odg"}]		[]	/Templates/Flowchart.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	14
23	1774806758	30	file_changed	admin	admin	files	changed_self	[{"14":"\\/Templates\\/Flowchart.odg"}]		[]	/Templates/Flowchart.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	14
24	1774806758	30	file_created	admin	admin	files	created_self	[{"15":"\\/Templates\\/SWOT analysis.whiteboard"}]		[]	/Templates/SWOT analysis.whiteboard	http://localhost/index.php/apps/files/?dir=/Templates	files	15
25	1774806758	30	file_changed	admin	admin	files	changed_self	[{"15":"\\/Templates\\/SWOT analysis.whiteboard"}]		[]	/Templates/SWOT analysis.whiteboard	http://localhost/index.php/apps/files/?dir=/Templates	files	15
26	1774806758	30	file_created	admin	admin	files	created_self	[{"16":"\\/Templates\\/Mindmap.odg"}]		[]	/Templates/Mindmap.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	16
27	1774806758	30	file_changed	admin	admin	files	changed_self	[{"16":"\\/Templates\\/Mindmap.odg"}]		[]	/Templates/Mindmap.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	16
28	1774806758	30	file_created	admin	admin	files	created_self	[{"17":"\\/Templates\\/Mother's day.odt"}]		[]	/Templates/Mother's day.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	17
29	1774806758	30	file_changed	admin	admin	files	changed_self	[{"17":"\\/Templates\\/Mother's day.odt"}]		[]	/Templates/Mother's day.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	17
30	1774806759	30	file_created	admin	admin	files	created_self	[{"18":"\\/Templates\\/Elegant.odp"}]		[]	/Templates/Elegant.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	18
31	1774806759	30	file_changed	admin	admin	files	changed_self	[{"18":"\\/Templates\\/Elegant.odp"}]		[]	/Templates/Elegant.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	18
32	1774806759	30	file_created	admin	admin	files	created_self	[{"19":"\\/Templates\\/Invoice.odt"}]		[]	/Templates/Invoice.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	19
33	1774806759	30	file_changed	admin	admin	files	changed_self	[{"19":"\\/Templates\\/Invoice.odt"}]		[]	/Templates/Invoice.odt	http://localhost/index.php/apps/files/?dir=/Templates	files	19
34	1774806759	30	file_created	admin	admin	files	created_self	[{"20":"\\/Templates\\/Timesheet.ods"}]		[]	/Templates/Timesheet.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	20
35	1774806759	30	file_changed	admin	admin	files	changed_self	[{"20":"\\/Templates\\/Timesheet.ods"}]		[]	/Templates/Timesheet.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	20
36	1774806759	30	file_created	admin	admin	files	created_self	[{"21":"\\/Templates\\/Impact effort matrix.whiteboard"}]		[]	/Templates/Impact effort matrix.whiteboard	http://localhost/index.php/apps/files/?dir=/Templates	files	21
37	1774806760	30	file_changed	admin	admin	files	changed_self	[{"21":"\\/Templates\\/Impact effort matrix.whiteboard"}]		[]	/Templates/Impact effort matrix.whiteboard	http://localhost/index.php/apps/files/?dir=/Templates	files	21
38	1774806760	30	file_created	admin	admin	files	created_self	[{"22":"\\/Templates\\/Readme.md"}]		[]	/Templates/Readme.md	http://localhost/index.php/apps/files/?dir=/Templates	files	22
39	1774806760	30	file_changed	admin	admin	files	changed_self	[{"22":"\\/Templates\\/Readme.md"}]		[]	/Templates/Readme.md	http://localhost/index.php/apps/files/?dir=/Templates	files	22
40	1774806760	30	file_created	admin	admin	files	created_self	[{"23":"\\/Templates\\/Product plan.md"}]		[]	/Templates/Product plan.md	http://localhost/index.php/apps/files/?dir=/Templates	files	23
41	1774806760	30	file_changed	admin	admin	files	changed_self	[{"23":"\\/Templates\\/Product plan.md"}]		[]	/Templates/Product plan.md	http://localhost/index.php/apps/files/?dir=/Templates	files	23
42	1774806760	30	file_created	admin	admin	files	created_self	[{"24":"\\/Templates\\/Diagram & table.ods"}]		[]	/Templates/Diagram & table.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	24
43	1774806761	30	file_changed	admin	admin	files	changed_self	[{"24":"\\/Templates\\/Diagram & table.ods"}]		[]	/Templates/Diagram & table.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	24
44	1774806761	30	file_created	admin	admin	files	created_self	[{"25":"\\/Templates\\/Gotong royong.odp"}]		[]	/Templates/Gotong royong.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	25
45	1774806761	30	file_changed	admin	admin	files	changed_self	[{"25":"\\/Templates\\/Gotong royong.odp"}]		[]	/Templates/Gotong royong.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	25
46	1774806761	30	file_created	admin	admin	files	created_self	[{"26":"\\/Templates\\/Org chart.odg"}]		[]	/Templates/Org chart.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	26
47	1774806761	30	file_changed	admin	admin	files	changed_self	[{"26":"\\/Templates\\/Org chart.odg"}]		[]	/Templates/Org chart.odg	http://localhost/index.php/apps/files/?dir=/Templates	files	26
48	1774806761	30	file_created	admin	admin	files	created_self	[{"27":"\\/Templates\\/Expense report.ods"}]		[]	/Templates/Expense report.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	27
49	1774806761	30	file_changed	admin	admin	files	changed_self	[{"27":"\\/Templates\\/Expense report.ods"}]		[]	/Templates/Expense report.ods	http://localhost/index.php/apps/files/?dir=/Templates	files	27
50	1774806761	30	file_created	admin	admin	files	created_self	[{"28":"\\/Templates\\/Simple.odp"}]		[]	/Templates/Simple.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	28
51	1774806761	30	file_changed	admin	admin	files	changed_self	[{"28":"\\/Templates\\/Simple.odp"}]		[]	/Templates/Simple.odp	http://localhost/index.php/apps/files/?dir=/Templates	files	28
52	1774806761	30	file_created	admin	admin	files	created_self	[{"29":"\\/Photos"}]		[]	/Photos	http://localhost/index.php/apps/files/?dir=/	files	29
53	1774806762	30	file_created	admin	admin	files	created_self	[{"30":"\\/Photos\\/Vineyard.jpg"}]		[]	/Photos/Vineyard.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	30
54	1774806762	30	file_changed	admin	admin	files	changed_self	[{"30":"\\/Photos\\/Vineyard.jpg"}]		[]	/Photos/Vineyard.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	30
55	1774806762	30	file_created	admin	admin	files	created_self	[{"31":"\\/Photos\\/Birdie.jpg"}]		[]	/Photos/Birdie.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	31
56	1774806762	30	file_changed	admin	admin	files	changed_self	[{"31":"\\/Photos\\/Birdie.jpg"}]		[]	/Photos/Birdie.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	31
57	1774806762	30	file_created	admin	admin	files	created_self	[{"32":"\\/Photos\\/Library.jpg"}]		[]	/Photos/Library.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	32
58	1774806762	30	file_changed	admin	admin	files	changed_self	[{"32":"\\/Photos\\/Library.jpg"}]		[]	/Photos/Library.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	32
59	1774806762	30	file_created	admin	admin	files	created_self	[{"33":"\\/Photos\\/Nextcloud community.jpg"}]		[]	/Photos/Nextcloud community.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	33
60	1774806762	30	file_changed	admin	admin	files	changed_self	[{"33":"\\/Photos\\/Nextcloud community.jpg"}]		[]	/Photos/Nextcloud community.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	33
61	1774806762	30	file_created	admin	admin	files	created_self	[{"34":"\\/Photos\\/Toucan.jpg"}]		[]	/Photos/Toucan.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	34
62	1774806763	30	file_changed	admin	admin	files	changed_self	[{"34":"\\/Photos\\/Toucan.jpg"}]		[]	/Photos/Toucan.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	34
63	1774806763	30	file_created	admin	admin	files	created_self	[{"35":"\\/Photos\\/Frog.jpg"}]		[]	/Photos/Frog.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	35
64	1774806763	30	file_changed	admin	admin	files	changed_self	[{"35":"\\/Photos\\/Frog.jpg"}]		[]	/Photos/Frog.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	35
65	1774806763	30	file_created	admin	admin	files	created_self	[{"36":"\\/Photos\\/Steps.jpg"}]		[]	/Photos/Steps.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	36
66	1774806763	30	file_changed	admin	admin	files	changed_self	[{"36":"\\/Photos\\/Steps.jpg"}]		[]	/Photos/Steps.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	36
67	1774806763	30	file_created	admin	admin	files	created_self	[{"37":"\\/Photos\\/Readme.md"}]		[]	/Photos/Readme.md	http://localhost/index.php/apps/files/?dir=/Photos	files	37
68	1774806763	30	file_changed	admin	admin	files	changed_self	[{"37":"\\/Photos\\/Readme.md"}]		[]	/Photos/Readme.md	http://localhost/index.php/apps/files/?dir=/Photos	files	37
69	1774806763	30	file_created	admin	admin	files	created_self	[{"38":"\\/Photos\\/Gorilla.jpg"}]		[]	/Photos/Gorilla.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	38
70	1774806764	30	file_changed	admin	admin	files	changed_self	[{"38":"\\/Photos\\/Gorilla.jpg"}]		[]	/Photos/Gorilla.jpg	http://localhost/index.php/apps/files/?dir=/Photos	files	38
71	1774806764	30	file_created	admin	admin	files	created_self	[{"39":"\\/Documents"}]		[]	/Documents	http://localhost/index.php/apps/files/?dir=/	files	39
72	1774806764	30	file_created	admin	admin	files	created_self	[{"40":"\\/Documents\\/Welcome to Nextcloud Hub.docx"}]		[]	/Documents/Welcome to Nextcloud Hub.docx	http://localhost/index.php/apps/files/?dir=/Documents	files	40
73	1774806764	30	file_changed	admin	admin	files	changed_self	[{"40":"\\/Documents\\/Welcome to Nextcloud Hub.docx"}]		[]	/Documents/Welcome to Nextcloud Hub.docx	http://localhost/index.php/apps/files/?dir=/Documents	files	40
74	1774806764	30	file_created	admin	admin	files	created_self	[{"41":"\\/Documents\\/Example.md"}]		[]	/Documents/Example.md	http://localhost/index.php/apps/files/?dir=/Documents	files	41
75	1774806764	30	file_changed	admin	admin	files	changed_self	[{"41":"\\/Documents\\/Example.md"}]		[]	/Documents/Example.md	http://localhost/index.php/apps/files/?dir=/Documents	files	41
76	1774806764	30	file_created	admin	admin	files	created_self	[{"42":"\\/Documents\\/Nextcloud flyer.pdf"}]		[]	/Documents/Nextcloud flyer.pdf	http://localhost/index.php/apps/files/?dir=/Documents	files	42
77	1774806764	30	file_changed	admin	admin	files	changed_self	[{"42":"\\/Documents\\/Nextcloud flyer.pdf"}]		[]	/Documents/Nextcloud flyer.pdf	http://localhost/index.php/apps/files/?dir=/Documents	files	42
78	1774806765	30	file_created	admin	admin	files	created_self	[{"43":"\\/Documents\\/Readme.md"}]		[]	/Documents/Readme.md	http://localhost/index.php/apps/files/?dir=/Documents	files	43
79	1774806765	30	file_changed	admin	admin	files	changed_self	[{"43":"\\/Documents\\/Readme.md"}]		[]	/Documents/Readme.md	http://localhost/index.php/apps/files/?dir=/Documents	files	43
80	1774806765	30	file_created	admin	admin	files	created_self	[{"44":"\\/Nextcloud Manual.pdf"}]		[]	/Nextcloud Manual.pdf	http://localhost/index.php/apps/files/?dir=/	files	44
81	1774806765	30	file_changed	admin	admin	files	changed_self	[{"44":"\\/Nextcloud Manual.pdf"}]		[]	/Nextcloud Manual.pdf	http://localhost/index.php/apps/files/?dir=/	files	44
82	1774806765	30	file_created	admin	admin	files	created_self	[{"45":"\\/Nextcloud.png"}]		[]	/Nextcloud.png	http://localhost/index.php/apps/files/?dir=/	files	45
83	1774806766	30	file_changed	admin	admin	files	changed_self	[{"45":"\\/Nextcloud.png"}]		[]	/Nextcloud.png	http://localhost/index.php/apps/files/?dir=/	files	45
84	1774806766	30	file_created	admin	admin	files	created_self	[{"46":"\\/Nextcloud intro.mp4"}]		[]	/Nextcloud intro.mp4	http://localhost/index.php/apps/files/?dir=/	files	46
85	1774806766	30	file_changed	admin	admin	files	changed_self	[{"46":"\\/Nextcloud intro.mp4"}]		[]	/Nextcloud intro.mp4	http://localhost/index.php/apps/files/?dir=/	files	46
86	1774806766	30	file_created	admin	admin	files	created_self	[{"47":"\\/Templates credits.md"}]		[]	/Templates credits.md	http://localhost/index.php/apps/files/?dir=/	files	47
87	1774806766	30	file_changed	admin	admin	files	changed_self	[{"47":"\\/Templates credits.md"}]		[]	/Templates credits.md	http://localhost/index.php/apps/files/?dir=/	files	47
88	1774806766	30	file_created	admin	admin	files	created_self	[{"48":"\\/Reasons to use Nextcloud.pdf"}]		[]	/Reasons to use Nextcloud.pdf	http://localhost/index.php/apps/files/?dir=/	files	48
89	1774806766	30	file_changed	admin	admin	files	changed_self	[{"48":"\\/Reasons to use Nextcloud.pdf"}]		[]	/Reasons to use Nextcloud.pdf	http://localhost/index.php/apps/files/?dir=/	files	48
90	1774806767	30	file_created	admin	admin	files	created_self	[{"49":"\\/Readme.md"}]		[]	/Readme.md	http://localhost/index.php/apps/files/?dir=/	files	49
91	1774806767	30	file_changed	admin	admin	files	changed_self	[{"49":"\\/Readme.md"}]		[]	/Readme.md	http://localhost/index.php/apps/files/?dir=/	files	49
92	1774806767	30	calendar	admin	admin	dav	calendar_add_self	{"actor":"admin","calendar":{"id":1,"uri":"personal","name":"Personal"}}		[]			calendar	1
93	1774806767	30	contacts	admin	admin	dav	addressbook_add_self	{"actor":"admin","addressbook":{"id":2,"uri":"contacts","name":"Contacts"}}		[]			addressbook	2
\.


--
-- Data for Name: oc_activity_mq; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_activity_mq (mail_id, amq_timestamp, amq_latest_send, amq_type, amq_affecteduser, amq_appid, amq_subject, amq_subjectparams, object_type, object_id) FROM stdin;
\.


--
-- Data for Name: oc_addressbookchanges; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_addressbookchanges (id, uri, synctoken, addressbookid, operation, created_at) FROM stdin;
\.


--
-- Data for Name: oc_addressbooks; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_addressbooks (id, principaluri, displayname, uri, description, synctoken) FROM stdin;
1	principals/system/system	system	system	System addressbook which holds all users of this instance	1
2	principals/users/admin	Contacts	contacts	\N	1
\.


--
-- Data for Name: oc_appconfig; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_appconfig (appid, configkey, configvalue, type, lazy) FROM stdin;
core	installedat	1774806725.4038	2	0
core	lastupdatedat	1774806725	8	0
core	vendor	nextcloud	2	0
files_trashbin	installed_version	1.19.0	2	0
files_trashbin	types	filesystem,dav	2	0
files_trashbin	enabled	yes	2	0
serverinfo	installed_version	1.19.0	2	0
serverinfo	types		2	0
serverinfo	enabled	yes	2	0
related_resources	installed_version	1.4.0	2	0
related_resources	types		2	0
related_resources	enabled	yes	2	0
viewer	installed_version	2.3.0	2	0
viewer	types		2	0
viewer	enabled	yes	2	0
text	installed_version	3.10.1	2	0
text	types	dav	2	0
text	enabled	yes	2	0
user_status	installed_version	1.9.0	2	0
user_status	types		2	0
user_status	enabled	yes	2	0
theming	installed_version	2.4.0	2	0
theming	types	logging	2	0
theming	enabled	yes	2	0
settings	installed_version	1.12.0	2	0
settings	types		2	0
settings	enabled	yes	2	0
twofactor_backupcodes	installed_version	1.18.0	2	0
twofactor_backupcodes	types		2	0
twofactor_backupcodes	enabled	yes	2	0
updatenotification	installed_version	1.19.1	2	0
updatenotification	types		2	0
updatenotification	enabled	yes	2	0
systemtags	installed_version	1.19.0	2	0
systemtags	types	logging	2	0
systemtags	enabled	yes	2	0
oauth2	installed_version	1.17.1	2	0
oauth2	types	authentication	2	0
oauth2	enabled	yes	2	0
lookup_server_connector	installed_version	1.17.0	2	0
lookup_server_connector	types	authentication	2	0
lookup_server_connector	enabled	yes	2	0
comments	installed_version	1.19.0	2	0
comments	types	logging	2	0
comments	enabled	yes	2	0
recommendations	installed_version	2.1.0	2	0
recommendations	types		2	0
recommendations	enabled	yes	2	0
files_pdfviewer	installed_version	2.10.0	2	0
files_pdfviewer	types		2	0
files_pdfviewer	enabled	yes	2	0
provisioning_api	installed_version	1.19.0	2	0
provisioning_api	types	prevent_group_restriction	2	0
provisioning_api	enabled	yes	2	0
photos	installed_version	2.5.0	2	0
photos	types	dav,authentication	2	0
photos	enabled	yes	2	0
contactsinteraction	installed_version	1.10.0	2	0
contactsinteraction	types	dav	2	0
contactsinteraction	enabled	yes	2	0
federatedfilesharing	installed_version	1.19.0	2	0
federatedfilesharing	types		2	0
federatedfilesharing	enabled	yes	2	0
workflowengine	installed_version	2.11.0	2	0
workflowengine	types	filesystem	2	0
workflowengine	enabled	yes	2	0
notifications	installed_version	2.17.0	2	0
notifications	types	logging	2	0
notifications	enabled	yes	2	0
firstrunwizard	installed_version	2.18.0	2	0
firstrunwizard	types	logging	2	0
firstrunwizard	enabled	yes	2	0
dav	installed_version	1.30.1	2	0
dav	types	filesystem	2	0
dav	enabled	yes	2	0
files_sharing	installed_version	1.21.0	2	0
core	public_files	files_sharing/public.php	2	0
files_sharing	types	filesystem	2	0
files_sharing	enabled	yes	2	0
privacy	installed_version	1.13.0	2	0
privacy	types		2	0
privacy	enabled	yes	2	0
activity	installed_version	2.21.1	2	0
activity	types	filesystem	2	0
activity	enabled	yes	2	0
files_reminders	installed_version	1.2.0	2	0
files_reminders	types		2	0
files_reminders	enabled	yes	2	0
password_policy	installed_version	1.19.0	2	0
password_policy	types	authentication	2	0
password_policy	enabled	yes	2	0
federation	installed_version	1.19.0	2	0
federation	types	authentication	2	0
federation	enabled	yes	2	0
logreader	installed_version	2.14.0	2	0
logreader	types	logging	2	0
logreader	enabled	yes	2	0
circles	installed_version	29.0.0-dev	2	0
circles	types	filesystem,dav	2	0
circles	enabled	yes	2	0
files	installed_version	2.1.1	2	0
files	types	filesystem	2	0
files	enabled	yes	2	0
survey_client	installed_version	1.17.0	2	0
survey_client	types		2	0
survey_client	enabled	yes	2	0
cloud_federation_api	installed_version	1.12.0	2	0
cloud_federation_api	types	filesystem	2	0
cloud_federation_api	enabled	yes	2	0
nextcloud_announcements	installed_version	1.18.0	2	0
nextcloud_announcements	types	logging	2	0
nextcloud_announcements	enabled	yes	2	0
sharebymail	installed_version	1.19.0	2	0
sharebymail	types	filesystem	2	0
sharebymail	enabled	yes	2	0
files_versions	installed_version	1.22.0	2	0
files_versions	types	filesystem,dav	2	0
files_versions	enabled	yes	2	0
files_downloadlimit	installed_version	2.0.0	2	0
files_downloadlimit	types		2	0
files_downloadlimit	enabled	yes	2	0
weather_status	installed_version	1.9.0	2	0
weather_status	types		2	0
weather_status	enabled	yes	2	0
support	installed_version	1.12.0	2	0
support	types	session	2	0
support	enabled	yes	2	0
dashboard	installed_version	7.9.0	2	0
dashboard	types		2	0
dashboard	enabled	yes	2	0
circles	loopback_tmp_scheme	http	2	0
core	files_metadata	{"photos-original_date_time":{"value":null,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":null,"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":null,"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":null,"type":"array","etag":"","indexed":false,"editPermission":0}}	64	1
\.


--
-- Data for Name: oc_authorized_groups; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_authorized_groups (id, group_id, class) FROM stdin;
\.


--
-- Data for Name: oc_authtoken; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_authtoken (id, uid, login_name, password, name, token, type, remember, last_activity, last_check, scope, expires, private_key, public_key, version, password_invalid, password_hash) FROM stdin;
\.


--
-- Data for Name: oc_bruteforce_attempts; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_bruteforce_attempts (id, action, occurred, ip, subnet, metadata) FROM stdin;
\.


--
-- Data for Name: oc_calendar_invitations; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_invitations (id, uid, recurrenceid, attendee, organizer, sequence, token, expiration) FROM stdin;
\.


--
-- Data for Name: oc_calendar_reminders; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_reminders (id, calendar_id, object_id, is_recurring, uid, recurrence_id, is_recurrence_exception, event_hash, alarm_hash, type, is_relative, notification_date, is_repeat_based) FROM stdin;
\.


--
-- Data for Name: oc_calendar_resources; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_resources (id, backend_id, resource_id, email, displayname, group_restrictions) FROM stdin;
\.


--
-- Data for Name: oc_calendar_resources_md; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_resources_md (id, resource_id, key, value) FROM stdin;
\.


--
-- Data for Name: oc_calendar_rooms; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_rooms (id, backend_id, resource_id, email, displayname, group_restrictions) FROM stdin;
\.


--
-- Data for Name: oc_calendar_rooms_md; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendar_rooms_md (id, room_id, key, value) FROM stdin;
\.


--
-- Data for Name: oc_calendarchanges; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendarchanges (id, uri, synctoken, calendarid, operation, calendartype, created_at) FROM stdin;
\.


--
-- Data for Name: oc_calendarobjects; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendarobjects (id, calendardata, uri, calendarid, lastmodified, etag, size, componenttype, firstoccurence, lastoccurence, uid, classification, calendartype, deleted_at) FROM stdin;
\.


--
-- Data for Name: oc_calendarobjects_props; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendarobjects_props (id, calendarid, objectid, name, parameter, value, calendartype) FROM stdin;
\.


--
-- Data for Name: oc_calendars; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendars (id, principaluri, displayname, uri, synctoken, description, calendarorder, calendarcolor, timezone, components, transparent, deleted_at) FROM stdin;
1	principals/users/admin	Personal	personal	1	\N	0	#0082c9	\N	VEVENT	0	\N
\.


--
-- Data for Name: oc_calendarsubscriptions; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_calendarsubscriptions (id, uri, principaluri, displayname, refreshrate, calendarorder, calendarcolor, striptodos, stripalarms, stripattachments, lastmodified, synctoken, source) FROM stdin;
\.


--
-- Data for Name: oc_cards; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_cards (id, addressbookid, carddata, uri, lastmodified, etag, size, uid) FROM stdin;
\.


--
-- Data for Name: oc_cards_properties; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_cards_properties (id, addressbookid, cardid, name, value, preferred) FROM stdin;
\.


--
-- Data for Name: oc_circles_circle; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_circle (id, unique_id, name, display_name, sanitized_name, instance, config, source, settings, description, creation, contact_addressbook, contact_groupname) FROM stdin;
1	i14hClYrmNFqN4hHBq45gwRmua8aENC	user:admin:i14hClYrmNFqN4hHBq45gwRmua8aENC	admin			1	1	[]		2026-03-29 17:52:35	0	
2	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	app:circles:z4BRissgmFTGXuN3GNppqEsFwBCQlCB	Circles			8193	10001	[]		2026-03-29 17:52:35	0	
\.


--
-- Data for Name: oc_circles_event; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_event (token, instance, event, result, interface, severity, retry, status, updated, creation) FROM stdin;
\.


--
-- Data for Name: oc_circles_member; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_member (id, single_id, circle_id, member_id, user_id, user_type, instance, invited_by, level, status, note, cached_name, cached_update, contact_id, contact_meta, joined) FROM stdin;
1	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	circles	10000		\N	9	Member	[]	Circles	2026-03-29 17:52:35		\N	2026-03-29 17:52:35
2	i14hClYrmNFqN4hHBq45gwRmua8aENC	i14hClYrmNFqN4hHBq45gwRmua8aENC	i14hClYrmNFqN4hHBq45gwRmua8aENC	admin	1		z4BRissgmFTGXuN3GNppqEsFwBCQlCB	9	Member	[]	admin	2026-03-29 17:52:35		\N	2026-03-29 17:52:35
\.


--
-- Data for Name: oc_circles_membership; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_membership (circle_id, single_id, level, inheritance_first, inheritance_last, inheritance_depth, inheritance_path) FROM stdin;
z4BRissgmFTGXuN3GNppqEsFwBCQlCB	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	9	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	z4BRissgmFTGXuN3GNppqEsFwBCQlCB	1	["z4BRissgmFTGXuN3GNppqEsFwBCQlCB"]
i14hClYrmNFqN4hHBq45gwRmua8aENC	i14hClYrmNFqN4hHBq45gwRmua8aENC	9	i14hClYrmNFqN4hHBq45gwRmua8aENC	i14hClYrmNFqN4hHBq45gwRmua8aENC	1	["i14hClYrmNFqN4hHBq45gwRmua8aENC"]
\.


--
-- Data for Name: oc_circles_mount; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_mount (id, mount_id, circle_id, single_id, token, parent, mountpoint, mountpoint_hash) FROM stdin;
\.


--
-- Data for Name: oc_circles_mountpoint; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_mountpoint (id, mount_id, single_id, mountpoint, mountpoint_hash) FROM stdin;
\.


--
-- Data for Name: oc_circles_remote; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_remote (id, type, interface, uid, instance, href, item, creation) FROM stdin;
\.


--
-- Data for Name: oc_circles_share_lock; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_share_lock (id, item_id, circle_id, instance) FROM stdin;
\.


--
-- Data for Name: oc_circles_token; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_circles_token (id, share_id, circle_id, single_id, member_id, token, password, accepted) FROM stdin;
\.


--
-- Data for Name: oc_collres_accesscache; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_collres_accesscache (user_id, collection_id, resource_type, resource_id, access) FROM stdin;
\.


--
-- Data for Name: oc_collres_collections; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_collres_collections (id, name) FROM stdin;
\.


--
-- Data for Name: oc_collres_resources; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_collres_resources (collection_id, resource_type, resource_id) FROM stdin;
\.


--
-- Data for Name: oc_comments; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_comments (id, parent_id, topmost_parent_id, children_count, actor_type, actor_id, message, verb, creation_timestamp, latest_child_timestamp, object_type, object_id, reference_id, reactions, expire_date, meta_data) FROM stdin;
\.


--
-- Data for Name: oc_comments_read_markers; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_comments_read_markers (user_id, object_type, object_id, marker_datetime) FROM stdin;
\.


--
-- Data for Name: oc_dav_absence; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_dav_absence (id, user_id, first_day, last_day, status, message) FROM stdin;
\.


--
-- Data for Name: oc_dav_cal_proxy; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_dav_cal_proxy (id, owner_id, proxy_id, permissions) FROM stdin;
\.


--
-- Data for Name: oc_dav_shares; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_dav_shares (id, principaluri, type, access, resourceid, publicuri) FROM stdin;
\.


--
-- Data for Name: oc_direct_edit; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_direct_edit (id, editor_id, token, file_id, user_id, share_id, "timestamp", accessed, file_path) FROM stdin;
\.


--
-- Data for Name: oc_directlink; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_directlink (id, user_id, file_id, token, expiration) FROM stdin;
\.


--
-- Data for Name: oc_federated_reshares; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_federated_reshares (share_id, remote_id) FROM stdin;
\.


--
-- Data for Name: oc_file_locks; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_file_locks (id, lock, key, ttl) FROM stdin;
\.


--
-- Data for Name: oc_filecache; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_filecache (fileid, storage, path, path_hash, parent, name, mimetype, mimepart, size, mtime, storage_mtime, encrypted, unencrypted_size, etag, permissions, checksum) FROM stdin;
7	1	files/Templates/Modern company.odp	96ad2c06ebb6a79bcdf2f4030421dee3	3	Modern company.odp	6	3	317015	1774806756	1774806756	0	0	d4886912d9b2e8d1b587378afd266ca1	27	
4	1	files/Templates/Photo book.odt	ea35993988e2799424fef3ff4f420c24	3	Photo book.odt	4	3	5155877	1774806755	1774806755	0	0	216e922532524626ab383d11a299f1cd	27	
16	1	files/Templates/Mindmap.odg	74cff798fc1b9634ee45380599b2a6da	3	Mindmap.odg	5	3	13653	1774806758	1774806758	0	0	b95ca48ec1cb943565ceb792f3cd2fe0	27	
8	1	files/Templates/Resume.odt	ace8f81202eadb2f0c15ba6ecc2539f5	3	Resume.odt	4	3	39404	1774806756	1774806756	0	0	93249b67a9012906c1dff03222c54ad4	27	
5	1	files/Templates/Party invitation.odt	439f95f734be87868374b1a5a312c550	3	Party invitation.odt	4	3	868111	1774806755	1774806755	0	0	ea6408259cc749914fbfaf1706fc7a73	27	
6	1	files/Templates/Business model canvas.odg	6a8f3e02bdf45c8b0671967969393bcb	3	Business model canvas.odg	5	3	16988	1774806756	1774806756	0	0	6b4f0e0d56e01de76476b927c9d9b7e0	27	
11	1	files/Templates/Yellow idea.odp	3a57051288d7b81bef3196a2123f4af5	3	Yellow idea.odp	6	3	81196	1774806757	1774806757	0	0	4aa765d9e378f00b750e485d7d75f683	27	
9	1	files/Templates/Letter.odt	15545ade0e9863c98f3a5cc0fbf2836a	3	Letter.odt	4	3	15961	1774806757	1774806757	0	0	5bbaef444065e670944799e9791a7e65	27	
14	1	files/Templates/Flowchart.odg	832942849155883ceddc6f3cede21867	3	Flowchart.odg	5	3	11836	1774806758	1774806758	0	0	024bf70e4695fd5d00a5427c63a92a83	27	
12	1	files/Templates/Meeting notes.md	c0279758bb570afdcdbc2471b2f16285	3	Meeting notes.md	9	8	326	1774806757	1774806757	0	0	01aba5609b312029e03c842c41b12fae	27	
10	1	files/Templates/Business model canvas.ods	86c10a47dedf156bf4431cb75e0f76ec	3	Business model canvas.ods	7	3	52843	1774806757	1774806757	0	0	692fd5adae0dabb00ddf2276c60f2aed	27	
13	1	files/Templates/Syllabus.odt	03b3147e6dae00674c1d50fe22bb8496	3	Syllabus.odt	4	3	30354	1774806758	1774806758	0	0	a8fae303c3b4e473e4531fbb339904ea	27	
15	1	files/Templates/SWOT analysis.whiteboard	3fd0e44b3e6f0e7144442ef6fc71a663	3	SWOT analysis.whiteboard	10	3	38605	1774806758	1774806758	0	0	dc99e0f57c4207b2d74e10434b636134	27	
20	1	files/Templates/Timesheet.ods	cb79c81e41d3c3c77cd31576dc7f1a3a	3	Timesheet.ods	7	3	88394	1774806759	1774806759	0	0	21428ac2a80e51491dd4fe90f9154ed4	27	
17	1	files/Templates/Mother's day.odt	cb66c617dbb4acc9b534ec095c400b53	3	Mother's day.odt	4	3	340061	1774806758	1774806758	0	0	a675434a32d1e0acd1fe7957f229c0f4	27	
18	1	files/Templates/Elegant.odp	f3ec70ed694c0ca215f094b98eb046a7	3	Elegant.odp	6	3	14316	1774806759	1774806759	0	0	0c6e23403670874983b0b779fd126e14	27	
19	1	files/Templates/Invoice.odt	40fdccb51b6c3e3cf20532e06ed5016e	3	Invoice.odt	4	3	17276	1774806759	1774806759	0	0	1ee8f3ab95be4340b0c26738bc184555	27	
22	1	files/Templates/Readme.md	71fa2e74ab30f39eed525572ccc3bbec	3	Readme.md	9	8	554	1774806760	1774806760	0	0	4ee9fb7f783ed7beed28792c4e3e0487	27	
21	1	files/Templates/Impact effort matrix.whiteboard	c5e3b589ec8f9dd6afdebe0ac6feeac8	3	Impact effort matrix.whiteboard	10	3	52674	1774806759	1774806759	0	0	14f9415ee094e1799b3eb0565a47e976	27	
26	1	files/Templates/Org chart.odg	fd846bc062b158abb99a75a5b33b53e7	3	Org chart.odg	5	3	13878	1774806761	1774806761	0	0	16c6d8854a5949b6a42218178587a8ef	27	
23	1	files/Templates/Product plan.md	a9fbf58bf31cebb8143f7ad3a5205633	3	Product plan.md	9	8	573	1774806760	1774806760	0	0	d3ae58a240b659fc4f927d4a070856f7	27	
24	1	files/Templates/Diagram & table.ods	0a89f154655f6d4a0098bc4e6ca87367	3	Diagram & table.ods	7	3	13378	1774806761	1774806761	0	0	d73e184ae85c66be6ecf7c53efddc7e8	27	
25	1	files/Templates/Gotong royong.odp	14b958f5aafb7cfd703090226f3cbd1b	3	Gotong royong.odp	6	3	3509628	1774806761	1774806761	0	0	df585ce480d51a6ac10094e790310e50	27	
27	1	files/Templates/Expense report.ods	d0a4025621279b95d2f94ff4ec09eab3	3	Expense report.ods	7	3	13441	1774806761	1774806761	0	0	c80ee52dc14f7995a5dbbf45c95a08d5	27	
28	1	files/Templates/Simple.odp	a2c90ff606d31419d699b0b437969c61	3	Simple.odp	6	3	14810	1774806761	1774806761	0	0	d46da3ecba56ba663b225f276c0768a2	27	
30	1	files/Photos/Vineyard.jpg	14e5f2670b0817614acd52269d971db8	29	Vineyard.jpg	12	11	427030	1774806762	1774806762	0	0	67831d20efce6edbde1d97ec78d86797	27	
3	1	files/Templates	530b342d0b8164ff3b4754c2273a453e	2	Templates	2	1	10721152	1774806761	1774806761	0	0	69c966e9cd096	31	
29	1	files/Photos	d01bb67e7b71dd49fd06bad922f521c9	2	Photos	2	1	5656463	1774806764	1774806763	0	0	69c966ec116f7	31	
1	1		d41d8cd98f00b204e9800998ecf8427e	-1		2	1	39044249	1774806767	1774806755	0	0	69c966ef51173	23	
31	1	files/Photos/Birdie.jpg	cd31c7af3a0ec6e15782b5edd2774549	29	Birdie.jpg	12	11	593508	1774806762	1774806762	0	0	f7854adfb999b30227140d3cca238a19	27	
32	1	files/Photos/Library.jpg	0b785d02a19fc00979f82f6b54a05805	29	Library.jpg	12	11	2170375	1774806762	1774806762	0	0	a917379471df6ea826eb45ac4c9a5c21	27	
33	1	files/Photos/Nextcloud community.jpg	b9b3caef83a2a1c20354b98df6bcd9d0	29	Nextcloud community.jpg	12	11	797325	1774806762	1774806762	0	0	b3d494ce32d63ab8c5e5b31cfb3fe82e	27	
34	1	files/Photos/Toucan.jpg	681d1e78f46a233e12ecfa722cbc2aef	29	Toucan.jpg	12	11	167989	1774806762	1774806762	0	0	d5193b047c70acaf662719e368dabff2	27	
35	1	files/Photos/Frog.jpg	d6219add1a9129ed0c1513af985e2081	29	Frog.jpg	12	11	457744	1774806763	1774806763	0	0	b2ab63f900fabde4efe2e3de97417c47	27	
40	1	files/Documents/Welcome to Nextcloud Hub.docx	b44cb84f22ceddc4ca2826e026038091	39	Welcome to Nextcloud Hub.docx	13	3	24295	1774806764	1774806764	0	0	f5f1f3656c8a8b879d7cef6e6a820078	27	
36	1	files/Photos/Steps.jpg	7b2ca8d05bbad97e00cbf5833d43e912	29	Steps.jpg	12	11	567689	1774806763	1774806763	0	0	63d9aae2b686c925f1f8284c755df1c6	27	
37	1	files/Photos/Readme.md	2a4ac36bb841d25d06d164f291ee97db	29	Readme.md	9	8	150	1774806763	1774806763	0	0	6f390fbb37fb63a0a8a24d8f154e6e2f	27	
38	1	files/Photos/Gorilla.jpg	6d5f5956d8ff76a5f290cebb56402789	29	Gorilla.jpg	12	11	474653	1774806764	1774806764	0	0	4983eeae58282d81acffc98a256751a7	27	
44	1	files/Nextcloud Manual.pdf	2bc58a43566a8edde804a4a97a9c7469	2	Nextcloud Manual.pdf	14	3	16564901	1774806765	1774806765	0	0	275f3b3b829aa12379d67e1ee541183d	27	
41	1	files/Documents/Example.md	efe0853470dd0663db34818b444328dd	39	Example.md	9	8	1095	1774806764	1774806764	0	0	f5f4e14bcc96694d7c3efd092e9068e8	27	
42	1	files/Documents/Nextcloud flyer.pdf	9c5b4dc7182a7435767708ac3e8d126c	39	Nextcloud flyer.pdf	14	3	1083339	1774806764	1774806764	0	0	9c5656bc36c84602c02fa8e25a8583e5	27	
48	1	files/Reasons to use Nextcloud.pdf	418b19142a61c5bef296ea56ee144ca3	2	Reasons to use Nextcloud.pdf	14	3	976625	1774806766	1774806766	0	0	09784d551f9fbf91d54294b00fd4c475	27	
43	1	files/Documents/Readme.md	51ec9e44357d147dd5c212b850f6910f	39	Readme.md	9	8	136	1774806765	1774806765	0	0	83e473cde2a7037de3cad51afa3481ec	27	
45	1	files/Nextcloud.png	2bcc0ff06465ef1bfc4a868efde1e485	2	Nextcloud.png	15	11	50598	1774806765	1774806765	0	0	c60879ebf2cf69abadbe6a500f10ef47	27	
46	1	files/Nextcloud intro.mp4	e4919345bcc87d4585a5525daaad99c0	2	Nextcloud intro.mp4	17	16	3963036	1774806766	1774806766	0	0	b0ee606f2946ddcdfccb9a882ce5b297	27	
47	1	files/Templates credits.md	f7c01e3e0b55bb895e09dc08d19375b3	2	Templates credits.md	9	8	2403	1774806766	1774806766	0	0	a9943c1353af35e6ab13c35d7762022f	27	
49	1	files/Readme.md	49af83716f8dcbfa89aaf835241c0b9f	2	Readme.md	9	8	206	1774806767	1774806767	0	0	15c85ae069d5597c7afafedbe80eb682	27	
39	1	files/Documents	0ad78ba05b6961d92f7970b2b3922eca	2	Documents	2	1	1108865	1774806765	1774806765	0	0	69c966ed48bc5	31	
2	1	files	45b963397aa40d4a0063e0d85e4fe7a1	1	files	2	1	39044249	1774806767	1774806767	0	0	69c966ef51173	31	
\.


--
-- Data for Name: oc_filecache_extended; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_filecache_extended (fileid, metadata_etag, creation_time, upload_time) FROM stdin;
\.


--
-- Data for Name: oc_files_metadata; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_files_metadata (id, file_id, json, sync_token, last_update) FROM stdin;
1	30	{"photos-original_date_time":{"value":1526500980,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"10\\/12500","FNumber":"35\\/10","ExposureProgram":3,"ISOSpeedRatings":100,"DateTimeOriginal":"2018:05:16 20:03:00","DateTimeDigitized":"2018:05:16 20:03:00","ExposureBiasValue":"0\\/6","MaxApertureValue":"30\\/10","MeteringMode":5,"LightSource":0,"Flash":16,"FocalLength":"700\\/10","MakerNote":"Nikon","UserComment":"Christoph WurstCC-SA 4.0","SubSecTime":"30","SubSecTimeOriginal":"30","SubSecTimeDigitized":"30","ColorSpace":1,"SensingMethod":2,"FileSource":"","SceneType":"","CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"DigitalZoomRatio":"1\\/1","FocalLengthIn__mmFilm":70,"SceneCaptureType":0,"GainControl":0,"Contrast":1,"Saturation":0,"Sharpness":1,"SubjectDistanceRange":0},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"ImageDescription":"Christoph WurstCC-SA 4.0","Make":"NIKON CORPORATION","Model":"NIKON D610","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"Software":"GIMP 2.10.14","DateTime":"2019:12:10 08:51:16","Artist":"Christoph Wurst                     ","Copyright":"Christoph Wurst                                       ","Exif_IFD_Pointer":402,"GPS_IFD_Pointer":13738,"DateTimeOriginal":"2018:05:16 20:03:00"},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1920,"height":1281},"type":"array","etag":"","indexed":false,"editPermission":0}}	kJeUDac	2026-03-29 17:52:42
2	31	{"photos-original_date_time":{"value":1341059531,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/125","FNumber":"28\\/5","ExposureProgram":3,"ISOSpeedRatings":320,"UndefinedTag__x____":320,"ExifVersion":"0230","DateTimeOriginal":"2012:06:30 12:32:11","DateTimeDigitized":"2012:06:30 12:32:11","ComponentsConfiguration":"","ShutterSpeedValue":"7\\/1","ApertureValue":"5\\/1","ExposureBiasValue":"0\\/1","MaxApertureValue":"189284\\/33461","MeteringMode":5,"Flash":16,"FocalLength":"280\\/1","SubSecTime":"83","SubSecTimeOriginal":"83","SubSecTimeDigitized":"83","FlashPixVersion":"0100","ColorSpace":1,"ExifImageWidth":1600,"ExifImageLength":1067,"FocalPlaneXResolution":"1920000\\/487","FocalPlaneYResolution":"320000\\/81","FocalPlaneResolutionUnit":2,"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"SceneCaptureType":0,"UndefinedTag__xA___":"0000000000"},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"DateTime":"2012:06:30 12:32:11","Exif_IFD_Pointer":174},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1600,"height":1067},"type":"array","etag":"","indexed":false,"editPermission":0}}	PZFVS7J	2026-03-29 17:52:42
3	32	{"photos-original_date_time":{"value":1341258636,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/80","FNumber":"4\\/1","ExposureProgram":3,"ISOSpeedRatings":400,"ExifVersion":"0230","DateTimeOriginal":"2012:07:02 19:50:36","DateTimeDigitized":"2012:07:02 19:50:36","ComponentsConfiguration":"","ShutterSpeedValue":"51\\/8","ApertureValue":"4\\/1","ExposureBiasValue":"0\\/1","MaxApertureValue":"4\\/1","MeteringMode":5,"Flash":16,"FocalLength":"32\\/1","SubSecTime":"00","SubSecTimeOriginal":"00","SubSecTimeDigitized":"00","FlashPixVersion":"0100","ColorSpace":1,"ExifImageWidth":1600,"ExifImageLength":1066,"FocalPlaneXResolution":"382423\\/97","FocalPlaneYResolution":"185679\\/47","FocalPlaneResolutionUnit":2,"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"SceneCaptureType":0},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"Software":"GIMP 2.8.0","DateTime":"2012:07:02 22:06:14","Exif_IFD_Pointer":198},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1600,"height":1066},"type":"array","etag":"","indexed":false,"editPermission":0}}	5Mmg8rz	2026-03-29 17:52:43
4	33	{"photos-original_date_time":{"value":1774806762,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-size":{"value":{"width":3000,"height":2000},"type":"array","etag":"","indexed":false,"editPermission":0}}	hb7Bzji	2026-03-29 17:52:43
5	34	{"photos-original_date_time":{"value":1444907264,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/320","FNumber":"4\\/1","ExposureProgram":3,"ISOSpeedRatings":640,"UndefinedTag__x____":640,"ExifVersion":"0230","DateTimeOriginal":"2015:10:15 11:07:44","DateTimeDigitized":"2015:10:15 11:07:44","ShutterSpeedValue":"27970\\/3361","ApertureValue":"4\\/1","ExposureBiasValue":"1\\/3","MaxApertureValue":"4\\/1","MeteringMode":5,"Flash":16,"FocalLength":"200\\/1","SubSecTimeOriginal":"63","SubSecTimeDigitized":"63","ColorSpace":1,"ExifImageWidth":1600,"ExifImageLength":1067,"FocalPlaneXResolution":"1600\\/1","FocalPlaneYResolution":"1600\\/1","FocalPlaneResolutionUnit":3,"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"SceneCaptureType":0,"UndefinedTag__xA___":"000084121f"},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"240\\/1","YResolution":"240\\/1","ResolutionUnit":2,"Software":"Adobe Photoshop Lightroom 6.2.1 (Macintosh)","DateTime":"2015:10:16 14:40:21","Exif_IFD_Pointer":230},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1600,"height":1067},"type":"array","etag":"","indexed":false,"editPermission":0}}	C9kvvkw	2026-03-29 17:52:43
6	35	{"photos-original_date_time":{"value":1341072915,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/500","FNumber":"28\\/5","ExposureProgram":1,"ISOSpeedRatings":8000,"ExifVersion":"0230","DateTimeOriginal":"2012:06:30 16:15:15","DateTimeDigitized":"2012:06:30 16:15:15","ComponentsConfiguration":"","ShutterSpeedValue":"9\\/1","ApertureValue":"5\\/1","ExposureBiasValue":"0\\/1","MaxApertureValue":"6149\\/1087","MeteringMode":5,"Flash":16,"FocalLength":"280\\/1","SubSecTime":"00","SubSecTimeOriginal":"00","SubSecTimeDigitized":"00","FlashPixVersion":"0100","ColorSpace":1,"ExifImageWidth":1600,"ExifImageLength":1067,"FocalPlaneXResolution":"382423\\/97","FocalPlaneYResolution":"134321\\/34","FocalPlaneResolutionUnit":2,"CustomRendered":0,"ExposureMode":1,"WhiteBalance":0,"SceneCaptureType":0},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"Software":"Aperture 3.3.1","DateTime":"2012:06:30 16:15:15","Exif_IFD_Pointer":202},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1600,"height":1067},"type":"array","etag":"","indexed":false,"editPermission":0}}	tsns8se	2026-03-29 17:52:43
7	36	{"photos-original_date_time":{"value":1372319469,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/160","FNumber":"4\\/1","ExposureProgram":3,"ISOSpeedRatings":100,"ExifVersion":"0230","DateTimeOriginal":"2013:06:27 07:51:09","DateTimeDigitized":"2013:06:27 07:51:09","ComponentsConfiguration":"","ShutterSpeedValue":"59\\/8","ApertureValue":"4\\/1","ExposureBiasValue":"2\\/3","MaxApertureValue":"4\\/1","MeteringMode":5,"Flash":16,"FocalLength":"45\\/1","SubSecTime":"00","SubSecTimeOriginal":"00","SubSecTimeDigitized":"00","FlashPixVersion":"0100","ColorSpace":1,"ExifImageWidth":1200,"ExifImageLength":1800,"FocalPlaneXResolution":"382423\\/97","FocalPlaneYResolution":"185679\\/47","FocalPlaneResolutionUnit":2,"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"SceneCaptureType":0,"UndefinedTag__xA___":"000052602c"},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"Software":"Aperture 3.4.5","DateTime":"2013:06:27 07:51:09","Exif_IFD_Pointer":202},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1200,"height":1800},"type":"array","etag":"","indexed":false,"editPermission":0}}	chq8dzZ	2026-03-29 17:52:43
8	38	{"photos-original_date_time":{"value":1341064060,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-exif":{"value":{"ExposureTime":"1\\/640","FNumber":"28\\/5","ExposureProgram":1,"ISOSpeedRatings":12800,"ExifVersion":"0230","DateTimeOriginal":"2012:06:30 13:47:40","DateTimeDigitized":"2012:06:30 13:47:40","ComponentsConfiguration":"","ShutterSpeedValue":"75\\/8","ApertureValue":"5\\/1","ExposureBiasValue":"0\\/1","MaxApertureValue":"6149\\/1087","MeteringMode":5,"Flash":16,"FocalLength":"235\\/1","SubSecTime":"00","SubSecTimeOriginal":"00","SubSecTimeDigitized":"00","FlashPixVersion":"0100","ExifImageWidth":1600,"ExifImageLength":1067,"FocalPlaneXResolution":"382423\\/97","FocalPlaneYResolution":"134321\\/34","FocalPlaneResolutionUnit":2,"CustomRendered":0,"ExposureMode":1,"WhiteBalance":0,"SceneCaptureType":0},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-ifd0":{"value":{"Make":"Canon","Model":"Canon EOS 5D Mark III","Orientation":1,"XResolution":"72\\/1","YResolution":"72\\/1","ResolutionUnit":2,"Software":"Aperture 3.3.1","DateTime":"2012:06:30 13:47:40","Exif_IFD_Pointer":202},"type":"array","etag":"","indexed":false,"editPermission":0},"photos-size":{"value":{"width":1600,"height":1067},"type":"array","etag":"","indexed":false,"editPermission":0}}	IgNDxNQ	2026-03-29 17:52:44
9	45	{"photos-original_date_time":{"value":1774806765,"type":"int","etag":"","indexed":true,"editPermission":0},"photos-size":{"value":{"width":500,"height":500},"type":"array","etag":"","indexed":false,"editPermission":0}}	EiaeeBK	2026-03-29 17:52:46
10	46	{"photos-original_date_time":{"value":1774806766,"type":"int","etag":"","indexed":true,"editPermission":0}}	ChkAiy2	2026-03-29 17:52:46
\.


--
-- Data for Name: oc_files_metadata_index; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_files_metadata_index (id, file_id, meta_key, meta_value_string, meta_value_int) FROM stdin;
2	30	photos-original_date_time	\N	1526500980
4	31	photos-original_date_time	\N	1341059531
6	32	photos-original_date_time	\N	1341258636
8	33	photos-original_date_time	\N	1774806762
10	34	photos-original_date_time	\N	1444907264
12	35	photos-original_date_time	\N	1341072915
14	36	photos-original_date_time	\N	1372319469
16	38	photos-original_date_time	\N	1341064060
18	45	photos-original_date_time	\N	1774806765
19	46	photos-original_date_time	\N	1774806766
\.


--
-- Data for Name: oc_files_reminders; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_files_reminders (id, user_id, file_id, due_date, updated_at, created_at, notified) FROM stdin;
\.


--
-- Data for Name: oc_files_trash; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_files_trash (auto_id, id, "user", "timestamp", location, type, mime) FROM stdin;
\.


--
-- Data for Name: oc_files_versions; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_files_versions (id, file_id, "timestamp", size, mimetype, metadata) FROM stdin;
1	4	1774806755	5155877	4	{"author":"admin"}
22	25	1774806761	3509628	6	{"author":"admin"}
2	5	1774806755	868111	4	{"author":"admin"}
37	42	1774806764	1083339	14	{"author":"admin"}
3	6	1774806756	16988	5	{"author":"admin"}
23	26	1774806761	13878	5	{"author":"admin"}
4	7	1774806756	317015	6	{"author":"admin"}
5	8	1774806756	39404	4	{"author":"admin"}
24	27	1774806761	13441	7	{"author":"admin"}
6	9	1774806757	15961	4	{"author":"admin"}
38	43	1774806765	136	9	{"author":"admin"}
7	10	1774806757	52843	7	{"author":"admin"}
25	28	1774806761	14810	6	{"author":"admin"}
8	11	1774806757	81196	6	{"author":"admin"}
9	12	1774806757	326	9	{"author":"admin"}
10	13	1774806758	30354	4	{"author":"admin"}
26	30	1774806762	427030	12	{"author":"admin"}
11	14	1774806758	11836	5	{"author":"admin"}
39	44	1774806765	16564901	14	{"author":"admin"}
12	15	1774806758	38605	10	{"author":"admin"}
27	31	1774806762	593508	12	{"author":"admin"}
13	16	1774806758	13653	5	{"author":"admin"}
14	17	1774806758	340061	4	{"author":"admin"}
28	32	1774806762	2170375	12	{"author":"admin"}
15	18	1774806759	14316	6	{"author":"admin"}
16	19	1774806759	17276	4	{"author":"admin"}
40	45	1774806765	50598	15	{"author":"admin"}
29	33	1774806762	797325	12	{"author":"admin"}
17	20	1774806759	88394	7	{"author":"admin"}
18	21	1774806759	52674	10	{"author":"admin"}
30	34	1774806762	167989	12	{"author":"admin"}
19	22	1774806760	554	9	{"author":"admin"}
20	23	1774806760	573	9	{"author":"admin"}
41	46	1774806766	3963036	17	{"author":"admin"}
21	24	1774806761	13378	7	{"author":"admin"}
31	35	1774806763	457744	12	{"author":"admin"}
32	36	1774806763	567689	12	{"author":"admin"}
42	47	1774806766	2403	9	{"author":"admin"}
33	37	1774806763	150	9	{"author":"admin"}
34	38	1774806764	474653	12	{"author":"admin"}
35	40	1774806764	24295	13	{"author":"admin"}
43	48	1774806766	976625	14	{"author":"admin"}
36	41	1774806764	1095	9	{"author":"admin"}
44	49	1774806767	206	9	{"author":"admin"}
\.


--
-- Data for Name: oc_flow_checks; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_flow_checks (id, class, operator, value, hash) FROM stdin;
\.


--
-- Data for Name: oc_flow_operations; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_flow_operations (id, class, name, checks, operation, entity, events) FROM stdin;
\.


--
-- Data for Name: oc_flow_operations_scope; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_flow_operations_scope (id, operation_id, type, value) FROM stdin;
\.


--
-- Data for Name: oc_group_admin; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_group_admin (gid, uid) FROM stdin;
\.


--
-- Data for Name: oc_group_user; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_group_user (gid, uid) FROM stdin;
admin	admin
\.


--
-- Data for Name: oc_groups; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_groups (gid, displayname) FROM stdin;
admin	admin
\.


--
-- Data for Name: oc_jobs; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_jobs (id, class, argument, last_run, last_checked, reserved_at, execution_duration, argument_hash, time_sensitive) FROM stdin;
1	OCA\\Files_Trashbin\\BackgroundJob\\ExpireTrash	null	0	1774806726	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
2	OCA\\ServerInfo\\Jobs\\UpdateStorageStats	null	0	1774806726	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
3	OCA\\Text\\Cron\\Cleanup	null	0	1774806732	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
4	OCA\\UserStatus\\BackgroundJob\\ClearOldStatusesBackgroundJob	null	0	1774806733	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
5	OCA\\UpdateNotification\\BackgroundJob\\UpdateAvailableNotifications	null	0	1774806733	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
6	OCA\\OAuth2\\BackgroundJob\\CleanupExpiredAuthorizationCode	null	0	1774806734	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
7	OCA\\Photos\\Jobs\\AutomaticPlaceMapperJob	null	0	1774806734	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
8	OCA\\ContactsInteraction\\BackgroundJob\\CleanupJob	null	0	1774806735	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
9	OCA\\WorkflowEngine\\BackgroundJobs\\Rotate	null	0	1774806736	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
10	OCA\\Notifications\\BackgroundJob\\GenerateUserSettings	null	0	1774806737	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
11	OCA\\Notifications\\BackgroundJob\\SendNotificationMails	null	0	1774806737	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
12	OCA\\DAV\\BackgroundJob\\CleanupDirectLinksJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
13	OCA\\DAV\\BackgroundJob\\UpdateCalendarResourcesRoomsBackgroundJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
14	OCA\\DAV\\BackgroundJob\\CleanupInvitationTokenJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
15	OCA\\DAV\\BackgroundJob\\EventReminderJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
16	OCA\\DAV\\BackgroundJob\\CalendarRetentionJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
17	OCA\\DAV\\BackgroundJob\\PruneOutdatedSyncTokensJob	null	0	1774806739	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
18	OCA\\Files_Sharing\\DeleteOrphanedSharesJob	null	0	1774806740	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
19	OCA\\Files_Sharing\\ExpireSharesJob	null	0	1774806740	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
20	OCA\\Files_Sharing\\BackgroundJob\\FederatedSharesDiscoverJob	null	0	1774806740	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
21	OCA\\Activity\\BackgroundJob\\EmailNotification	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
22	OCA\\Activity\\BackgroundJob\\ExpireActivities	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
23	OCA\\Activity\\BackgroundJob\\DigestMail	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
24	OCA\\Activity\\BackgroundJob\\RemoveFormerActivitySettings	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
25	OCA\\FilesReminders\\BackgroundJob\\CleanUpReminders	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
26	OCA\\FilesReminders\\BackgroundJob\\ScheduledNotifications	null	0	1774806742	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
27	OCA\\Federation\\SyncJob	null	0	1774806749	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
28	OCA\\Circles\\Cron\\Maintenance	null	0	1774806751	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
29	OCA\\Files\\BackgroundJob\\ScanFiles	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
30	OCA\\Files\\BackgroundJob\\DeleteOrphanedItems	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
31	OCA\\Files\\BackgroundJob\\CleanupFileLocks	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
32	OCA\\Files\\BackgroundJob\\CleanupDirectEditingTokens	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
33	OCA\\Files\\BackgroundJob\\DeleteExpiredOpenLocalEditor	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
34	OCA\\NextcloudAnnouncements\\Cron\\Crawler	null	0	1774806752	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
35	OCA\\Files_Versions\\BackgroundJob\\ExpireVersions	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
36	OCA\\Support\\BackgroundJobs\\CheckSubscription	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
37	OC\\Authentication\\Token\\TokenCleanupJob	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
38	OC\\Log\\Rotate	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
39	OC\\Preview\\BackgroundCleanupJob	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
40	OC\\TextProcessing\\RemoveOldTasksBackgroundJob	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
41	OC\\User\\BackgroundJobs\\CleanupDeletedUsers	null	0	1774806753	0	0	74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b	1
42	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",4]	0	1774806755	0	0	4956793059d80398b3d78ea2215ebb860a2e0c724aefa0ce04b1a8bbb5a70f46	1
43	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",5]	0	1774806756	0	0	bab5ba2238ecad63141db6c5f1608efc3b0efecc909f4f8d8e111e0d5c23edad	1
44	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",6]	0	1774806756	0	0	0d840fcf4d96c36eb80b922e14ca2b7aa5acaba8f61b45e2d8bd832199fe8c9d	1
45	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",7]	0	1774806756	0	0	5889fec72259069bfcddd1167dbbf1c854234eb06614dd8fd894eff7956192a7	1
46	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",8]	0	1774806756	0	0	075228ca5e1ab3f24fd39c1402e41a206a4afd78fc71b52f0021faaa6121c260	1
47	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",9]	0	1774806757	0	0	6aeb888c4dfdca1c745d4f2367a7386cf490285b3d961db0382c594a54c400a0	1
48	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",10]	0	1774806757	0	0	9e79a1d0a821264f3aa6269c1d3dba0f52274f57ff2819cc5c70f60300c2ec6c	1
49	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",11]	0	1774806757	0	0	32ea4cc1f86ec7aba234f815b18136b6eab27615e67f71a4f752e863214b3b22	1
50	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",12]	0	1774806757	0	0	2f60738088dd89b5b25465a7c6c482de073a21ffe62c3b8a3ec59ad5a1f4c15f	1
51	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",13]	0	1774806758	0	0	05b302cbd33b86157c9981f8eb4ab72466e203421a1a8d2b9d504b7ec7e17ea7	1
52	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",14]	0	1774806758	0	0	70e10015f10fbd6d13870e3908314ad4de673976fc3075d2eda0d7d4b2681dc6	1
53	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",15]	0	1774806758	0	0	22aa486f345e5794cae46ce5def4dd3810bcc6c191e1190594fcdcbfaf05c65f	1
54	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",16]	0	1774806758	0	0	cdf77c66ee9dc02019f56d1e8999668d813066995c75ab4c48ce506c209fe0f6	1
55	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",17]	0	1774806758	0	0	50c3dc17edc7103fd33d90ad8c17fabaa4ab920310c26f5a1209a75cf06ff91c	1
56	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",18]	0	1774806759	0	0	d6f63b0735f2a90b0ce0af8891b0398880b7399b786f84b0818adeeba359f1bb	1
57	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",19]	0	1774806759	0	0	27a2cbe5b547b14f49ab72b681e53a8a1e74f549192ae8898bb4c2f4f88555fd	1
58	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",20]	0	1774806759	0	0	876775feb13959831d8c7753e2a4abd552e03b394d84939656bb5dce9ce4f8f6	1
59	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",21]	0	1774806760	0	0	79363e541ba12589811d7a0d3403d97d4d60a73c91e92db043322e5ca990c8fb	1
60	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",22]	0	1774806760	0	0	830acf7a8ef52afbe08fc2713df540bc14c79f1a0f95c854da5e26b0386477f7	1
61	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",23]	0	1774806760	0	0	9cea6ce18595672d882c9d89a3acfbcf7958a0839bc4a5abaa9ef02d88aebaf1	1
62	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",24]	0	1774806761	0	0	727ef905962bfe27b36d943813e028d0e3664c929d5a714f0d7ac0d000ffa5fd	1
63	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",25]	0	1774806761	0	0	529311c9ad07ba8de6b18178dbcf95b582b72597ade6c56cf1d41d7c6d7397c9	1
64	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",26]	0	1774806761	0	0	003cfb4d3aba0fde31ba26c3b3a820a3d150ea868d5ee2c37c1a33771ef8e8b8	1
65	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",27]	0	1774806761	0	0	b0cc502625f847e1481b6d24d1eb94752736146434df36043a153c9b1ee284c5	1
66	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",28]	0	1774806761	0	0	2e1a9923add930564317a65c0bfc12ca3daa3e2530c1accdaf2277732f6ad934	1
67	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",30]	0	1774806762	0	0	e782f2107c9202401ac95b15d443e8da595c6bd92e26e8c5a086a268967794c9	1
68	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",31]	0	1774806762	0	0	86924dbd7b48f415fbf674a2669f36ccb651e936cda773d270e5342bc467d53b	1
69	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",32]	0	1774806762	0	0	ee02ec2ee4e390442f92c13e988ac867bb67074f52aecb22a05bdeee504d6e5f	1
70	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",33]	0	1774806762	0	0	d2fc6457a2d723b580d9219ce144539740f68beea42d1a1379b60ea972699109	1
71	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",34]	0	1774806763	0	0	154b723aa40ccca0c4ef5a72218d14f10a6618261e58095632eca79ecef12329	1
72	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",35]	0	1774806763	0	0	a0ef7cdcb39b887087357a25bd2c1da932604ad5db4388671a25dd4a8bd0317a	1
73	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",36]	0	1774806763	0	0	16df61184ae9e35c363a154732c7351c493d2a3ac34cdf8697fdfbc2da04f191	1
74	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",37]	0	1774806763	0	0	b1e224ce7c7b3a952f648379b84369decad2d9b9ff4206324f216da3fad24c68	1
75	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",38]	0	1774806764	0	0	57471075f497d1a8eadd28685fbd9bbf6da61a6c9440d215d823c6ffbd54d4e7	1
76	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",40]	0	1774806764	0	0	07ba9c6a76e9b0c3a72981be352527e6b36975e7b0976a4fcb3bbc0559d2b542	1
77	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",41]	0	1774806764	0	0	4c14497df884240ef37196f1f3e78f9ecb5715d4e5e8155f4c866e4d45d1a9b2	1
78	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",42]	0	1774806764	0	0	d5a6a27596364bdb824290d1d838e04ef81f732a54d4af8b01a3ff7e4765c99c	1
79	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",43]	0	1774806765	0	0	b7e10b61bf98d5f2376b308c483713cefc1dde08cc62fa9525d280283ac00634	1
80	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",44]	0	1774806765	0	0	7f449813b099905192fcaeb5607970d09c4d8d0998bd58dd3621979f8cd11cb0	1
81	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",45]	0	1774806766	0	0	ba2ef4e3cfbade663cfae1431113a10c4d523728ac0ad237af333b584375ddb4	1
82	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",46]	0	1774806766	0	0	80ff70d0c920a046219b03ff7d3ad47cb1bf4a6208c3200dacf769b3fa6c748c	1
83	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",47]	0	1774806766	0	0	a3890d747cc802dba6a5bf5ea3bc64fa76642bfe22a036742524262b78e1fa00	1
84	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",48]	0	1774806766	0	0	37b98ebdecc5f0658741278c00b9b39e585ef51a5528ec2849a1f22fc65e6a68	1
85	OC\\FilesMetadata\\Job\\UpdateSingleMetadata	["admin",49]	0	1774806767	0	0	e1d9319ef784d6e2697941e9c9b806eff09802f8c8b88681164e1fad8a195a2c	1
\.


--
-- Data for Name: oc_known_users; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_known_users (id, known_to, known_user) FROM stdin;
\.


--
-- Data for Name: oc_login_flow_v2; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_login_flow_v2 (id, "timestamp", started, poll_token, login_token, public_key, private_key, client_name, login_name, server, app_password) FROM stdin;
\.


--
-- Data for Name: oc_migrations; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_migrations (app, version) FROM stdin;
core	13000Date20170705121758
core	13000Date20170718121200
core	13000Date20170814074715
core	13000Date20170919121250
core	13000Date20170926101637
core	14000Date20180129121024
core	14000Date20180404140050
core	14000Date20180516101403
core	14000Date20180518120534
core	14000Date20180522074438
core	14000Date20180626223656
core	14000Date20180710092004
core	14000Date20180712153140
core	15000Date20180926101451
core	15000Date20181015062942
core	15000Date20181029084625
core	16000Date20190207141427
core	16000Date20190212081545
core	16000Date20190427105638
core	16000Date20190428150708
core	17000Date20190514105811
core	18000Date20190920085628
core	18000Date20191014105105
core	18000Date20191204114856
core	19000Date20200211083441
core	20000Date20201109081915
core	20000Date20201109081918
core	20000Date20201109081919
core	20000Date20201111081915
core	21000Date20201120141228
core	21000Date20201202095923
core	21000Date20210119195004
core	21000Date20210309185126
core	21000Date20210309185127
core	22000Date20210216080825
core	23000Date20210721100600
core	23000Date20210906132259
core	23000Date20210930122352
core	23000Date20211203110726
core	23000Date20211213203940
core	24000Date20211210141942
core	24000Date20211213081506
core	24000Date20211213081604
core	24000Date20211222112246
core	24000Date20211230140012
core	24000Date20220131153041
core	24000Date20220202150027
core	24000Date20220404230027
core	24000Date20220425072957
core	25000Date20220515204012
core	25000Date20220602190540
core	25000Date20220905140840
core	25000Date20221007010957
core	27000Date20220613163520
core	27000Date20230309104325
core	27000Date20230309104802
core	28000Date20230616104802
core	28000Date20230728104802
core	28000Date20230803221055
core	28000Date20230906104802
core	28000Date20231004103301
core	28000Date20231103104802
core	28000Date20231126110901
core	28000Date20240828142927
core	29000Date20231126110901
core	29000Date20231213104850
core	29000Date20240124132201
core	29000Date20240124132202
core	29000Date20240131122720
core	30000Date20240814180800
files_trashbin	1010Date20200630192639
text	010000Date20190617184535
text	030001Date20200402075029
text	030201Date20201116110353
text	030201Date20201116123153
text	030501Date20220202101853
text	030701Date20230207131313
text	030901Date20231114150437
user_status	0001Date20200602134824
user_status	0002Date20200902144824
user_status	1000Date20201111130204
user_status	1003Date20210809144824
user_status	1008Date20230921144701
twofactor_backupcodes	1002Date20170607104347
twofactor_backupcodes	1002Date20170607113030
twofactor_backupcodes	1002Date20170919123342
twofactor_backupcodes	1002Date20170926101419
twofactor_backupcodes	1002Date20180821043638
updatenotification	011901Date20240305120000
oauth2	010401Date20181207190718
oauth2	010402Date20190107124745
oauth2	011601Date20230522143227
oauth2	011602Date20230613160650
oauth2	011603Date20230620111039
oauth2	011901Date20240829164356
photos	3000Date20240417075404
photos	20000Date20220727125801
photos	20001Date20220830131446
photos	20003Date20221102170153
photos	20003Date20221103094628
contactsinteraction	010000Date20200304152605
federatedfilesharing	1010Date20200630191755
federatedfilesharing	1011Date20201120125158
workflowengine	2000Date20190808074233
workflowengine	2200Date20210805101925
notifications	2004Date20190107135757
notifications	2010Date20210218082811
notifications	2010Date20210218082855
notifications	2011Date20210930134607
notifications	2011Date20220826074907
dav	1004Date20170825134824
dav	1004Date20170919104507
dav	1004Date20170924124212
dav	1004Date20170926103422
dav	1005Date20180413093149
dav	1005Date20180530124431
dav	1006Date20180619154313
dav	1006Date20180628111625
dav	1008Date20181030113700
dav	1008Date20181105104826
dav	1008Date20181105104833
dav	1008Date20181105110300
dav	1008Date20181105112049
dav	1008Date20181114084440
dav	1011Date20190725113607
dav	1011Date20190806104428
dav	1012Date20190808122342
dav	1016Date20201109085907
dav	1017Date20210216083742
dav	1018Date20210312100735
dav	1024Date20211221144219
dav	1025Date20240308063933
dav	1027Date20230504122946
dav	1029Date20221114151721
dav	1029Date20231004091403
dav	1030Date20240205103243
files_sharing	11300Date20201120141438
files_sharing	21000Date20201223143245
files_sharing	22000Date20210216084241
files_sharing	24000Date20220208195521
files_sharing	24000Date20220404142216
privacy	100Date20190217131943
activity	2006Date20170808154933
activity	2006Date20170808155040
activity	2006Date20170919095939
activity	2007Date20181107114613
activity	2008Date20181011095117
activity	2010Date20190416112817
activity	2011Date20201006132544
activity	2011Date20201006132545
activity	2011Date20201006132546
activity	2011Date20201006132547
activity	2011Date20201207091915
files_reminders	10000Date20230725162149
federation	1010Date20200630191302
circles	0022Date20220526111723
circles	0022Date20220526113601
circles	0022Date20220703115023
circles	0023Date20211216113101
circles	0024Date20220203123901
circles	0024Date20220203123902
circles	0024Date20220317190331
circles	0028Date20230705222601
circles	0031Date20241105133904
files	11301Date20191205150729
files	12101Date20221011153334
files_versions	1020Date20221114144058
files_downloadlimit	000000Date20210910094923
\.


--
-- Data for Name: oc_mimetypes; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_mimetypes (id, mimetype) FROM stdin;
1	httpd
2	httpd/unix-directory
3	application
4	application/vnd.oasis.opendocument.text
5	application/vnd.oasis.opendocument.graphics
6	application/vnd.oasis.opendocument.presentation
7	application/vnd.oasis.opendocument.spreadsheet
8	text
9	text/markdown
10	application/vnd.excalidraw+json
11	image
12	image/jpeg
13	application/vnd.openxmlformats-officedocument.wordprocessingml.document
14	application/pdf
15	image/png
16	video
17	video/mp4
\.


--
-- Data for Name: oc_mounts; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_mounts (id, storage_id, root_id, user_id, mount_point, mount_id, mount_provider_class) FROM stdin;
1	1	1	admin	/admin/	\N	OC\\Files\\Mount\\LocalHomeMountProvider
\.


--
-- Data for Name: oc_notifications; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_notifications (notification_id, app, "user", "timestamp", object_type, object_id, subject, subject_parameters, message, message_parameters, link, icon, actions) FROM stdin;
\.


--
-- Data for Name: oc_notifications_pushhash; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_notifications_pushhash (id, uid, token, deviceidentifier, devicepublickey, devicepublickeyhash, pushtokenhash, proxyserver, apptype) FROM stdin;
\.


--
-- Data for Name: oc_notifications_settings; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_notifications_settings (id, user_id, batch_time, last_send_id, next_send_time) FROM stdin;
1	admin	0	0	0
\.


--
-- Data for Name: oc_oauth2_access_tokens; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_oauth2_access_tokens (id, token_id, client_id, hashed_code, encrypted_token, code_created_at, token_count) FROM stdin;
\.


--
-- Data for Name: oc_oauth2_clients; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_oauth2_clients (id, name, redirect_uri, client_identifier, secret) FROM stdin;
\.


--
-- Data for Name: oc_open_local_editor; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_open_local_editor (id, user_id, path_hash, expiration_time, token) FROM stdin;
\.


--
-- Data for Name: oc_photos_albums; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_photos_albums (album_id, name, "user", created, location, last_added_photo) FROM stdin;
\.


--
-- Data for Name: oc_photos_albums_collabs; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_photos_albums_collabs (id, album_id, collaborator_id, collaborator_type) FROM stdin;
\.


--
-- Data for Name: oc_photos_albums_files; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_photos_albums_files (album_file_id, album_id, file_id, added, owner) FROM stdin;
\.


--
-- Data for Name: oc_preferences; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_preferences (userid, appid, configkey, configvalue) FROM stdin;
admin	login	lastLogin	1774806754
admin	activity	configured	yes
admin	notifications	sound_notification	no
admin	notifications	sound_talk	no
admin	password_policy	failedLoginAttempts	0
admin	core	templateDirectory	Templates/
\.


--
-- Data for Name: oc_privacy_admins; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_privacy_admins (id, displayname) FROM stdin;
\.


--
-- Data for Name: oc_profile_config; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_profile_config (id, user_id, config) FROM stdin;
\.


--
-- Data for Name: oc_properties; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_properties (id, userid, propertypath, propertyname, propertyvalue, valuetype) FROM stdin;
\.


--
-- Data for Name: oc_ratelimit_entries; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_ratelimit_entries (id, hash, delete_after) FROM stdin;
\.


--
-- Data for Name: oc_reactions; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_reactions (id, parent_id, message_id, actor_type, actor_id, reaction) FROM stdin;
\.


--
-- Data for Name: oc_recent_contact; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_recent_contact (id, actor_uid, uid, email, federated_cloud_id, card, last_contact) FROM stdin;
\.


--
-- Data for Name: oc_schedulingobjects; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_schedulingobjects (id, principaluri, calendardata, uri, lastmodified, etag, size) FROM stdin;
\.


--
-- Data for Name: oc_share; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_share (id, share_type, share_with, password, uid_owner, uid_initiator, parent, item_type, item_source, item_target, file_source, file_target, permissions, stime, accepted, expiration, token, mail_send, share_name, password_by_talk, note, hide_download, label, attributes, password_expiration_time) FROM stdin;
\.


--
-- Data for Name: oc_share_external; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_share_external (id, parent, share_type, remote, remote_id, share_token, password, name, owner, "user", mountpoint, mountpoint_hash, accepted) FROM stdin;
\.


--
-- Data for Name: oc_shares_limits; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_shares_limits (id, "limit", downloads) FROM stdin;
\.


--
-- Data for Name: oc_storages; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_storages (numeric_id, id, available, last_checked) FROM stdin;
1	home::admin	1	\N
\.


--
-- Data for Name: oc_storages_credentials; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_storages_credentials (id, "user", identifier, credentials) FROM stdin;
\.


--
-- Data for Name: oc_systemtag; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_systemtag (id, name, visibility, editable) FROM stdin;
\.


--
-- Data for Name: oc_systemtag_group; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_systemtag_group (systemtagid, gid) FROM stdin;
\.


--
-- Data for Name: oc_systemtag_object_mapping; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_systemtag_object_mapping (objectid, objecttype, systemtagid) FROM stdin;
\.


--
-- Data for Name: oc_text2image_tasks; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_text2image_tasks (id, input, status, number_of_images, user_id, app_id, identifier, last_updated, completion_expected_at) FROM stdin;
\.


--
-- Data for Name: oc_text_documents; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_text_documents (id, current_version, last_saved_version, last_saved_version_time, last_saved_version_etag, base_version_etag) FROM stdin;
\.


--
-- Data for Name: oc_text_sessions; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_text_sessions (id, user_id, guest_name, color, token, document_id, last_contact, last_awareness_message) FROM stdin;
\.


--
-- Data for Name: oc_text_steps; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_text_steps (id, document_id, session_id, data, version) FROM stdin;
\.


--
-- Data for Name: oc_textprocessing_tasks; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_textprocessing_tasks (id, type, input, output, status, user_id, app_id, identifier, last_updated, completion_expected_at) FROM stdin;
\.


--
-- Data for Name: oc_trusted_servers; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_trusted_servers (id, url, url_hash, token, shared_secret, status, sync_token) FROM stdin;
\.


--
-- Data for Name: oc_twofactor_backupcodes; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_twofactor_backupcodes (id, user_id, code, used) FROM stdin;
\.


--
-- Data for Name: oc_twofactor_providers; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_twofactor_providers (provider_id, uid, enabled) FROM stdin;
\.


--
-- Data for Name: oc_user_status; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_user_status (id, user_id, status, status_timestamp, is_user_defined, message_id, custom_icon, custom_message, clear_at, is_backup, status_message_timestamp) FROM stdin;
\.


--
-- Data for Name: oc_user_transfer_owner; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_user_transfer_owner (id, source_user, target_user, file_id, node_name) FROM stdin;
\.


--
-- Data for Name: oc_users; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_users (uid, displayname, password, uid_lower) FROM stdin;
admin	\N	3|$argon2id$v=19$m=65536,t=4,p=1$MS50OVQzbU1mL1k5cTBRNQ$OKKW6Q0jMNoLyCyjCGUUcKwlSYVryxh0qxHad8LIJoQ	admin
\.


--
-- Data for Name: oc_vcategory; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_vcategory (id, uid, type, category) FROM stdin;
\.


--
-- Data for Name: oc_vcategory_to_object; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_vcategory_to_object (objid, categoryid, type) FROM stdin;
\.


--
-- Data for Name: oc_webauthn; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_webauthn (id, uid, name, public_key_credential_id, data) FROM stdin;
\.


--
-- Data for Name: oc_whats_new; Type: TABLE DATA; Schema: public; Owner: oc_admin
--

COPY public.oc_whats_new (id, version, etag, last_check, data) FROM stdin;
\.


--
-- Name: oc_accounts_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_accounts_data_id_seq', 12, true);


--
-- Name: oc_activity_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_activity_activity_id_seq', 93, true);


--
-- Name: oc_activity_mq_mail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_activity_mq_mail_id_seq', 1, false);


--
-- Name: oc_addressbookchanges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_addressbookchanges_id_seq', 1, false);


--
-- Name: oc_addressbooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_addressbooks_id_seq', 2, true);


--
-- Name: oc_authorized_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_authorized_groups_id_seq', 1, false);


--
-- Name: oc_authtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_authtoken_id_seq', 1, false);


--
-- Name: oc_bruteforce_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_bruteforce_attempts_id_seq', 1, false);


--
-- Name: oc_calendar_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_invitations_id_seq', 1, false);


--
-- Name: oc_calendar_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_reminders_id_seq', 1, false);


--
-- Name: oc_calendar_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_resources_id_seq', 1, false);


--
-- Name: oc_calendar_resources_md_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_resources_md_id_seq', 1, false);


--
-- Name: oc_calendar_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_rooms_id_seq', 1, false);


--
-- Name: oc_calendar_rooms_md_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendar_rooms_md_id_seq', 1, false);


--
-- Name: oc_calendarchanges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendarchanges_id_seq', 1, false);


--
-- Name: oc_calendarobjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendarobjects_id_seq', 1, false);


--
-- Name: oc_calendarobjects_props_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendarobjects_props_id_seq', 1, false);


--
-- Name: oc_calendars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendars_id_seq', 1, true);


--
-- Name: oc_calendarsubscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_calendarsubscriptions_id_seq', 1, false);


--
-- Name: oc_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_cards_id_seq', 1, false);


--
-- Name: oc_cards_properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_cards_properties_id_seq', 1, false);


--
-- Name: oc_circles_circle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_circle_id_seq', 2, true);


--
-- Name: oc_circles_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_member_id_seq', 2, true);


--
-- Name: oc_circles_mount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_mount_id_seq', 1, false);


--
-- Name: oc_circles_mountpoint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_mountpoint_id_seq', 1, false);


--
-- Name: oc_circles_remote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_remote_id_seq', 1, false);


--
-- Name: oc_circles_share_lock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_share_lock_id_seq', 1, false);


--
-- Name: oc_circles_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_circles_token_id_seq', 1, false);


--
-- Name: oc_collres_collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_collres_collections_id_seq', 1, false);


--
-- Name: oc_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_comments_id_seq', 1, false);


--
-- Name: oc_dav_absence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_dav_absence_id_seq', 1, false);


--
-- Name: oc_dav_cal_proxy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_dav_cal_proxy_id_seq', 1, false);


--
-- Name: oc_dav_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_dav_shares_id_seq', 1, false);


--
-- Name: oc_direct_edit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_direct_edit_id_seq', 1, false);


--
-- Name: oc_directlink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_directlink_id_seq', 1, false);


--
-- Name: oc_file_locks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_file_locks_id_seq', 1, false);


--
-- Name: oc_filecache_fileid_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_filecache_fileid_seq', 49, true);


--
-- Name: oc_files_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_files_metadata_id_seq', 10, true);


--
-- Name: oc_files_metadata_index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_files_metadata_index_id_seq', 19, true);


--
-- Name: oc_files_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_files_reminders_id_seq', 1, false);


--
-- Name: oc_files_trash_auto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_files_trash_auto_id_seq', 1, false);


--
-- Name: oc_files_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_files_versions_id_seq', 44, true);


--
-- Name: oc_flow_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_flow_checks_id_seq', 1, false);


--
-- Name: oc_flow_operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_flow_operations_id_seq', 1, false);


--
-- Name: oc_flow_operations_scope_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_flow_operations_scope_id_seq', 1, false);


--
-- Name: oc_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_jobs_id_seq', 85, true);


--
-- Name: oc_known_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_known_users_id_seq', 1, false);


--
-- Name: oc_login_flow_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_login_flow_v2_id_seq', 1, false);


--
-- Name: oc_mimetypes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_mimetypes_id_seq', 17, true);


--
-- Name: oc_mounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_mounts_id_seq', 1, true);


--
-- Name: oc_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_notifications_notification_id_seq', 1, false);


--
-- Name: oc_notifications_pushhash_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_notifications_pushhash_id_seq', 1, false);


--
-- Name: oc_notifications_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_notifications_settings_id_seq', 1, true);


--
-- Name: oc_oauth2_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_oauth2_access_tokens_id_seq', 1, false);


--
-- Name: oc_oauth2_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_oauth2_clients_id_seq', 1, false);


--
-- Name: oc_open_local_editor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_open_local_editor_id_seq', 1, false);


--
-- Name: oc_photos_albums_album_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_photos_albums_album_id_seq', 1, false);


--
-- Name: oc_photos_albums_collabs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_photos_albums_collabs_id_seq', 1, false);


--
-- Name: oc_photos_albums_files_album_file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_photos_albums_files_album_file_id_seq', 1, false);


--
-- Name: oc_privacy_admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_privacy_admins_id_seq', 1, false);


--
-- Name: oc_profile_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_profile_config_id_seq', 1, false);


--
-- Name: oc_properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_properties_id_seq', 1, false);


--
-- Name: oc_ratelimit_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_ratelimit_entries_id_seq', 1, false);


--
-- Name: oc_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_reactions_id_seq', 1, false);


--
-- Name: oc_recent_contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_recent_contact_id_seq', 1, false);


--
-- Name: oc_schedulingobjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_schedulingobjects_id_seq', 1, false);


--
-- Name: oc_share_external_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_share_external_id_seq', 1, false);


--
-- Name: oc_share_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_share_id_seq', 1, false);


--
-- Name: oc_storages_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_storages_credentials_id_seq', 1, false);


--
-- Name: oc_storages_numeric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_storages_numeric_id_seq', 1, true);


--
-- Name: oc_systemtag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_systemtag_id_seq', 1, false);


--
-- Name: oc_text2image_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_text2image_tasks_id_seq', 1, false);


--
-- Name: oc_text_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_text_sessions_id_seq', 1, false);


--
-- Name: oc_text_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_text_steps_id_seq', 1, false);


--
-- Name: oc_textprocessing_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_textprocessing_tasks_id_seq', 1, false);


--
-- Name: oc_trusted_servers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_trusted_servers_id_seq', 1, false);


--
-- Name: oc_twofactor_backupcodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_twofactor_backupcodes_id_seq', 1, false);


--
-- Name: oc_user_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_user_status_id_seq', 1, false);


--
-- Name: oc_user_transfer_owner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_user_transfer_owner_id_seq', 1, false);


--
-- Name: oc_vcategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_vcategory_id_seq', 1, false);


--
-- Name: oc_webauthn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_webauthn_id_seq', 1, false);


--
-- Name: oc_whats_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: oc_admin
--

SELECT pg_catalog.setval('public.oc_whats_new_id_seq', 1, false);


--
-- Name: oc_accounts_data oc_accounts_data_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_accounts_data
    ADD CONSTRAINT oc_accounts_data_pkey PRIMARY KEY (id);


--
-- Name: oc_accounts oc_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_accounts
    ADD CONSTRAINT oc_accounts_pkey PRIMARY KEY (uid);


--
-- Name: oc_activity_mq oc_activity_mq_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_activity_mq
    ADD CONSTRAINT oc_activity_mq_pkey PRIMARY KEY (mail_id);


--
-- Name: oc_activity oc_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_activity
    ADD CONSTRAINT oc_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: oc_addressbookchanges oc_addressbookchanges_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_addressbookchanges
    ADD CONSTRAINT oc_addressbookchanges_pkey PRIMARY KEY (id);


--
-- Name: oc_addressbooks oc_addressbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_addressbooks
    ADD CONSTRAINT oc_addressbooks_pkey PRIMARY KEY (id);


--
-- Name: oc_appconfig oc_appconfig_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_appconfig
    ADD CONSTRAINT oc_appconfig_pkey PRIMARY KEY (appid, configkey);


--
-- Name: oc_authorized_groups oc_authorized_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_authorized_groups
    ADD CONSTRAINT oc_authorized_groups_pkey PRIMARY KEY (id);


--
-- Name: oc_authtoken oc_authtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_authtoken
    ADD CONSTRAINT oc_authtoken_pkey PRIMARY KEY (id);


--
-- Name: oc_bruteforce_attempts oc_bruteforce_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_bruteforce_attempts
    ADD CONSTRAINT oc_bruteforce_attempts_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_invitations oc_calendar_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_invitations
    ADD CONSTRAINT oc_calendar_invitations_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_reminders oc_calendar_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_reminders
    ADD CONSTRAINT oc_calendar_reminders_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_resources_md oc_calendar_resources_md_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_resources_md
    ADD CONSTRAINT oc_calendar_resources_md_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_resources oc_calendar_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_resources
    ADD CONSTRAINT oc_calendar_resources_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_rooms_md oc_calendar_rooms_md_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_rooms_md
    ADD CONSTRAINT oc_calendar_rooms_md_pkey PRIMARY KEY (id);


--
-- Name: oc_calendar_rooms oc_calendar_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendar_rooms
    ADD CONSTRAINT oc_calendar_rooms_pkey PRIMARY KEY (id);


--
-- Name: oc_calendarchanges oc_calendarchanges_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarchanges
    ADD CONSTRAINT oc_calendarchanges_pkey PRIMARY KEY (id);


--
-- Name: oc_calendarobjects oc_calendarobjects_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarobjects
    ADD CONSTRAINT oc_calendarobjects_pkey PRIMARY KEY (id);


--
-- Name: oc_calendarobjects_props oc_calendarobjects_props_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarobjects_props
    ADD CONSTRAINT oc_calendarobjects_props_pkey PRIMARY KEY (id);


--
-- Name: oc_calendars oc_calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendars
    ADD CONSTRAINT oc_calendars_pkey PRIMARY KEY (id);


--
-- Name: oc_calendarsubscriptions oc_calendarsubscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_calendarsubscriptions
    ADD CONSTRAINT oc_calendarsubscriptions_pkey PRIMARY KEY (id);


--
-- Name: oc_cards oc_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_cards
    ADD CONSTRAINT oc_cards_pkey PRIMARY KEY (id);


--
-- Name: oc_cards_properties oc_cards_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_cards_properties
    ADD CONSTRAINT oc_cards_properties_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_circle oc_circles_circle_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_circle
    ADD CONSTRAINT oc_circles_circle_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_event oc_circles_event_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_event
    ADD CONSTRAINT oc_circles_event_pkey PRIMARY KEY (token, instance);


--
-- Name: oc_circles_member oc_circles_member_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_member
    ADD CONSTRAINT oc_circles_member_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_membership oc_circles_membership_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_membership
    ADD CONSTRAINT oc_circles_membership_pkey PRIMARY KEY (single_id, circle_id);


--
-- Name: oc_circles_mount oc_circles_mount_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_mount
    ADD CONSTRAINT oc_circles_mount_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_mountpoint oc_circles_mountpoint_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_mountpoint
    ADD CONSTRAINT oc_circles_mountpoint_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_remote oc_circles_remote_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_remote
    ADD CONSTRAINT oc_circles_remote_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_share_lock oc_circles_share_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_share_lock
    ADD CONSTRAINT oc_circles_share_lock_pkey PRIMARY KEY (id);


--
-- Name: oc_circles_token oc_circles_token_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_circles_token
    ADD CONSTRAINT oc_circles_token_pkey PRIMARY KEY (id);


--
-- Name: oc_collres_accesscache oc_collres_accesscache_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_collres_accesscache
    ADD CONSTRAINT oc_collres_accesscache_pkey PRIMARY KEY (user_id, collection_id, resource_type, resource_id);


--
-- Name: oc_collres_collections oc_collres_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_collres_collections
    ADD CONSTRAINT oc_collres_collections_pkey PRIMARY KEY (id);


--
-- Name: oc_collres_resources oc_collres_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_collres_resources
    ADD CONSTRAINT oc_collres_resources_pkey PRIMARY KEY (collection_id, resource_type, resource_id);


--
-- Name: oc_comments oc_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_comments
    ADD CONSTRAINT oc_comments_pkey PRIMARY KEY (id);


--
-- Name: oc_comments_read_markers oc_comments_read_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_comments_read_markers
    ADD CONSTRAINT oc_comments_read_markers_pkey PRIMARY KEY (user_id, object_type, object_id);


--
-- Name: oc_dav_absence oc_dav_absence_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_absence
    ADD CONSTRAINT oc_dav_absence_pkey PRIMARY KEY (id);


--
-- Name: oc_dav_cal_proxy oc_dav_cal_proxy_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_cal_proxy
    ADD CONSTRAINT oc_dav_cal_proxy_pkey PRIMARY KEY (id);


--
-- Name: oc_dav_shares oc_dav_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_dav_shares
    ADD CONSTRAINT oc_dav_shares_pkey PRIMARY KEY (id);


--
-- Name: oc_direct_edit oc_direct_edit_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_direct_edit
    ADD CONSTRAINT oc_direct_edit_pkey PRIMARY KEY (id);


--
-- Name: oc_directlink oc_directlink_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_directlink
    ADD CONSTRAINT oc_directlink_pkey PRIMARY KEY (id);


--
-- Name: oc_federated_reshares oc_federated_reshares_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_federated_reshares
    ADD CONSTRAINT oc_federated_reshares_pkey PRIMARY KEY (share_id);


--
-- Name: oc_file_locks oc_file_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_file_locks
    ADD CONSTRAINT oc_file_locks_pkey PRIMARY KEY (id);


--
-- Name: oc_filecache_extended oc_filecache_extended_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_filecache_extended
    ADD CONSTRAINT oc_filecache_extended_pkey PRIMARY KEY (fileid);


--
-- Name: oc_filecache oc_filecache_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_filecache
    ADD CONSTRAINT oc_filecache_pkey PRIMARY KEY (fileid);


--
-- Name: oc_files_metadata_index oc_files_metadata_index_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_metadata_index
    ADD CONSTRAINT oc_files_metadata_index_pkey PRIMARY KEY (id);


--
-- Name: oc_files_metadata oc_files_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_metadata
    ADD CONSTRAINT oc_files_metadata_pkey PRIMARY KEY (id);


--
-- Name: oc_files_reminders oc_files_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_reminders
    ADD CONSTRAINT oc_files_reminders_pkey PRIMARY KEY (id);


--
-- Name: oc_files_trash oc_files_trash_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_trash
    ADD CONSTRAINT oc_files_trash_pkey PRIMARY KEY (auto_id);


--
-- Name: oc_files_versions oc_files_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_files_versions
    ADD CONSTRAINT oc_files_versions_pkey PRIMARY KEY (id);


--
-- Name: oc_flow_checks oc_flow_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_checks
    ADD CONSTRAINT oc_flow_checks_pkey PRIMARY KEY (id);


--
-- Name: oc_flow_operations oc_flow_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_operations
    ADD CONSTRAINT oc_flow_operations_pkey PRIMARY KEY (id);


--
-- Name: oc_flow_operations_scope oc_flow_operations_scope_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_flow_operations_scope
    ADD CONSTRAINT oc_flow_operations_scope_pkey PRIMARY KEY (id);


--
-- Name: oc_group_admin oc_group_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_group_admin
    ADD CONSTRAINT oc_group_admin_pkey PRIMARY KEY (gid, uid);


--
-- Name: oc_group_user oc_group_user_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_group_user
    ADD CONSTRAINT oc_group_user_pkey PRIMARY KEY (gid, uid);


--
-- Name: oc_groups oc_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_groups
    ADD CONSTRAINT oc_groups_pkey PRIMARY KEY (gid);


--
-- Name: oc_jobs oc_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_jobs
    ADD CONSTRAINT oc_jobs_pkey PRIMARY KEY (id);


--
-- Name: oc_known_users oc_known_users_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_known_users
    ADD CONSTRAINT oc_known_users_pkey PRIMARY KEY (id);


--
-- Name: oc_login_flow_v2 oc_login_flow_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_login_flow_v2
    ADD CONSTRAINT oc_login_flow_v2_pkey PRIMARY KEY (id);


--
-- Name: oc_migrations oc_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_migrations
    ADD CONSTRAINT oc_migrations_pkey PRIMARY KEY (app, version);


--
-- Name: oc_mimetypes oc_mimetypes_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_mimetypes
    ADD CONSTRAINT oc_mimetypes_pkey PRIMARY KEY (id);


--
-- Name: oc_mounts oc_mounts_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_mounts
    ADD CONSTRAINT oc_mounts_pkey PRIMARY KEY (id);


--
-- Name: oc_notifications oc_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications
    ADD CONSTRAINT oc_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: oc_notifications_pushhash oc_notifications_pushhash_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications_pushhash
    ADD CONSTRAINT oc_notifications_pushhash_pkey PRIMARY KEY (id);


--
-- Name: oc_notifications_settings oc_notifications_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_notifications_settings
    ADD CONSTRAINT oc_notifications_settings_pkey PRIMARY KEY (id);


--
-- Name: oc_oauth2_access_tokens oc_oauth2_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_oauth2_access_tokens
    ADD CONSTRAINT oc_oauth2_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: oc_oauth2_clients oc_oauth2_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_oauth2_clients
    ADD CONSTRAINT oc_oauth2_clients_pkey PRIMARY KEY (id);


--
-- Name: oc_open_local_editor oc_open_local_editor_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_open_local_editor
    ADD CONSTRAINT oc_open_local_editor_pkey PRIMARY KEY (id);


--
-- Name: oc_photos_albums_collabs oc_photos_albums_collabs_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums_collabs
    ADD CONSTRAINT oc_photos_albums_collabs_pkey PRIMARY KEY (id);


--
-- Name: oc_photos_albums_files oc_photos_albums_files_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums_files
    ADD CONSTRAINT oc_photos_albums_files_pkey PRIMARY KEY (album_file_id);


--
-- Name: oc_photos_albums oc_photos_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_photos_albums
    ADD CONSTRAINT oc_photos_albums_pkey PRIMARY KEY (album_id);


--
-- Name: oc_preferences oc_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_preferences
    ADD CONSTRAINT oc_preferences_pkey PRIMARY KEY (userid, appid, configkey);


--
-- Name: oc_privacy_admins oc_privacy_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_privacy_admins
    ADD CONSTRAINT oc_privacy_admins_pkey PRIMARY KEY (id);


--
-- Name: oc_profile_config oc_profile_config_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_profile_config
    ADD CONSTRAINT oc_profile_config_pkey PRIMARY KEY (id);


--
-- Name: oc_properties oc_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_properties
    ADD CONSTRAINT oc_properties_pkey PRIMARY KEY (id);


--
-- Name: oc_ratelimit_entries oc_ratelimit_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_ratelimit_entries
    ADD CONSTRAINT oc_ratelimit_entries_pkey PRIMARY KEY (id);


--
-- Name: oc_reactions oc_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_reactions
    ADD CONSTRAINT oc_reactions_pkey PRIMARY KEY (id);


--
-- Name: oc_recent_contact oc_recent_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_recent_contact
    ADD CONSTRAINT oc_recent_contact_pkey PRIMARY KEY (id);


--
-- Name: oc_schedulingobjects oc_schedulingobjects_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_schedulingobjects
    ADD CONSTRAINT oc_schedulingobjects_pkey PRIMARY KEY (id);


--
-- Name: oc_share_external oc_share_external_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_share_external
    ADD CONSTRAINT oc_share_external_pkey PRIMARY KEY (id);


--
-- Name: oc_share oc_share_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_share
    ADD CONSTRAINT oc_share_pkey PRIMARY KEY (id);


--
-- Name: oc_shares_limits oc_shares_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_shares_limits
    ADD CONSTRAINT oc_shares_limits_pkey PRIMARY KEY (id);


--
-- Name: oc_storages_credentials oc_storages_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_storages_credentials
    ADD CONSTRAINT oc_storages_credentials_pkey PRIMARY KEY (id);


--
-- Name: oc_storages oc_storages_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_storages
    ADD CONSTRAINT oc_storages_pkey PRIMARY KEY (numeric_id);


--
-- Name: oc_systemtag_group oc_systemtag_group_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_systemtag_group
    ADD CONSTRAINT oc_systemtag_group_pkey PRIMARY KEY (gid, systemtagid);


--
-- Name: oc_systemtag_object_mapping oc_systemtag_object_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_systemtag_object_mapping
    ADD CONSTRAINT oc_systemtag_object_mapping_pkey PRIMARY KEY (objecttype, objectid, systemtagid);


--
-- Name: oc_systemtag oc_systemtag_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_systemtag
    ADD CONSTRAINT oc_systemtag_pkey PRIMARY KEY (id);


--
-- Name: oc_text2image_tasks oc_text2image_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text2image_tasks
    ADD CONSTRAINT oc_text2image_tasks_pkey PRIMARY KEY (id);


--
-- Name: oc_text_documents oc_text_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text_documents
    ADD CONSTRAINT oc_text_documents_pkey PRIMARY KEY (id);


--
-- Name: oc_text_sessions oc_text_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text_sessions
    ADD CONSTRAINT oc_text_sessions_pkey PRIMARY KEY (id);


--
-- Name: oc_text_steps oc_text_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_text_steps
    ADD CONSTRAINT oc_text_steps_pkey PRIMARY KEY (id);


--
-- Name: oc_textprocessing_tasks oc_textprocessing_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_textprocessing_tasks
    ADD CONSTRAINT oc_textprocessing_tasks_pkey PRIMARY KEY (id);


--
-- Name: oc_trusted_servers oc_trusted_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_trusted_servers
    ADD CONSTRAINT oc_trusted_servers_pkey PRIMARY KEY (id);


--
-- Name: oc_twofactor_backupcodes oc_twofactor_backupcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_twofactor_backupcodes
    ADD CONSTRAINT oc_twofactor_backupcodes_pkey PRIMARY KEY (id);


--
-- Name: oc_twofactor_providers oc_twofactor_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_twofactor_providers
    ADD CONSTRAINT oc_twofactor_providers_pkey PRIMARY KEY (provider_id, uid);


--
-- Name: oc_user_status oc_user_status_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_user_status
    ADD CONSTRAINT oc_user_status_pkey PRIMARY KEY (id);


--
-- Name: oc_user_transfer_owner oc_user_transfer_owner_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_user_transfer_owner
    ADD CONSTRAINT oc_user_transfer_owner_pkey PRIMARY KEY (id);


--
-- Name: oc_users oc_users_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_users
    ADD CONSTRAINT oc_users_pkey PRIMARY KEY (uid);


--
-- Name: oc_vcategory oc_vcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_vcategory
    ADD CONSTRAINT oc_vcategory_pkey PRIMARY KEY (id);


--
-- Name: oc_vcategory_to_object oc_vcategory_to_object_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_vcategory_to_object
    ADD CONSTRAINT oc_vcategory_to_object_pkey PRIMARY KEY (categoryid, objid, type);


--
-- Name: oc_webauthn oc_webauthn_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_webauthn
    ADD CONSTRAINT oc_webauthn_pkey PRIMARY KEY (id);


--
-- Name: oc_whats_new oc_whats_new_pkey; Type: CONSTRAINT; Schema: public; Owner: oc_admin
--

ALTER TABLE ONLY public.oc_whats_new
    ADD CONSTRAINT oc_whats_new_pkey PRIMARY KEY (id);


--
-- Name: ac_lazy_i; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ac_lazy_i ON public.oc_appconfig USING btree (lazy);


--
-- Name: accounts_data_name; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX accounts_data_name ON public.oc_accounts_data USING btree (name);


--
-- Name: accounts_data_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX accounts_data_uid ON public.oc_accounts_data USING btree (uid);


--
-- Name: accounts_data_value; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX accounts_data_value ON public.oc_accounts_data USING btree (value);


--
-- Name: activity_filter; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX activity_filter ON public.oc_activity USING btree (affecteduser, type, app, "timestamp");


--
-- Name: activity_filter_by; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX activity_filter_by ON public.oc_activity USING btree (affecteduser, "user", "timestamp");


--
-- Name: activity_object; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX activity_object ON public.oc_activity USING btree (object_type, object_id);


--
-- Name: activity_user_time; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX activity_user_time ON public.oc_activity USING btree (affecteduser, "timestamp");


--
-- Name: addressbook_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX addressbook_index ON public.oc_addressbooks USING btree (principaluri, uri);


--
-- Name: addressbookid_synctoken; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX addressbookid_synctoken ON public.oc_addressbookchanges USING btree (addressbookid, synctoken);


--
-- Name: admindel_groupid_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX admindel_groupid_idx ON public.oc_authorized_groups USING btree (group_id);


--
-- Name: album_collabs_uniq_collab; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX album_collabs_uniq_collab ON public.oc_photos_albums_collabs USING btree (album_id, collaborator_id, collaborator_type);


--
-- Name: amp_latest_send_time; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX amp_latest_send_time ON public.oc_activity_mq USING btree (amq_latest_send);


--
-- Name: amp_timestamp_time; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX amp_timestamp_time ON public.oc_activity_mq USING btree (amq_timestamp);


--
-- Name: amp_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX amp_user ON public.oc_activity_mq USING btree (amq_affecteduser);


--
-- Name: authtoken_last_activity_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX authtoken_last_activity_idx ON public.oc_authtoken USING btree (last_activity);


--
-- Name: authtoken_token_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX authtoken_token_index ON public.oc_authtoken USING btree (token);


--
-- Name: authtoken_uid_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX authtoken_uid_index ON public.oc_authtoken USING btree (uid);


--
-- Name: bruteforce_attempts_ip; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX bruteforce_attempts_ip ON public.oc_bruteforce_attempts USING btree (ip);


--
-- Name: bruteforce_attempts_subnet; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX bruteforce_attempts_subnet ON public.oc_bruteforce_attempts USING btree (subnet);


--
-- Name: calendar_invitation_tokens; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_invitation_tokens ON public.oc_calendar_invitations USING btree (token);


--
-- Name: calendar_reminder_objid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_reminder_objid ON public.oc_calendar_reminders USING btree (object_id);


--
-- Name: calendar_reminder_uidrec; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_reminder_uidrec ON public.oc_calendar_reminders USING btree (uid, recurrence_id);


--
-- Name: calendar_resources_bkdrsc; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_resources_bkdrsc ON public.oc_calendar_resources USING btree (backend_id, resource_id);


--
-- Name: calendar_resources_email; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_resources_email ON public.oc_calendar_resources USING btree (email);


--
-- Name: calendar_resources_md_idk; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_resources_md_idk ON public.oc_calendar_resources_md USING btree (resource_id, key);


--
-- Name: calendar_resources_name; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_resources_name ON public.oc_calendar_resources USING btree (displayname);


--
-- Name: calendar_rooms_bkdrsc; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_rooms_bkdrsc ON public.oc_calendar_rooms USING btree (backend_id, resource_id);


--
-- Name: calendar_rooms_email; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_rooms_email ON public.oc_calendar_rooms USING btree (email);


--
-- Name: calendar_rooms_md_idk; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_rooms_md_idk ON public.oc_calendar_rooms_md USING btree (room_id, key);


--
-- Name: calendar_rooms_name; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendar_rooms_name ON public.oc_calendar_rooms USING btree (displayname);


--
-- Name: calendarobject_calid_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendarobject_calid_index ON public.oc_calendarobjects_props USING btree (calendarid, calendartype);


--
-- Name: calendarobject_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendarobject_index ON public.oc_calendarobjects_props USING btree (objectid, calendartype);


--
-- Name: calendarobject_name_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendarobject_name_index ON public.oc_calendarobjects_props USING btree (name, calendartype);


--
-- Name: calendarobject_value_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calendarobject_value_index ON public.oc_calendarobjects_props USING btree (value, calendartype);


--
-- Name: calendars_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX calendars_index ON public.oc_calendars USING btree (principaluri, uri);


--
-- Name: calid_type_synctoken; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calid_type_synctoken ON public.oc_calendarchanges USING btree (calendarid, calendartype, synctoken);


--
-- Name: calobj_clssfction_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX calobj_clssfction_index ON public.oc_calendarobjects USING btree (classification);


--
-- Name: calobjects_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX calobjects_index ON public.oc_calendarobjects USING btree (calendarid, calendartype, uri);


--
-- Name: cals_princ_del_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX cals_princ_del_idx ON public.oc_calendars USING btree (principaluri, deleted_at);


--
-- Name: calsub_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX calsub_index ON public.oc_calendarsubscriptions USING btree (principaluri, uri);


--
-- Name: card_contactid_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX card_contactid_index ON public.oc_cards_properties USING btree (cardid);


--
-- Name: card_name_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX card_name_index ON public.oc_cards_properties USING btree (name);


--
-- Name: card_value_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX card_value_index ON public.oc_cards_properties USING btree (value);


--
-- Name: cards_abiduri; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX cards_abiduri ON public.oc_cards USING btree (addressbookid, uri);


--
-- Name: cards_prop_abid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX cards_prop_abid ON public.oc_cards_properties USING btree (addressbookid);


--
-- Name: category_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX category_index ON public.oc_vcategory USING btree (category);


--
-- Name: circles_member_cisi; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX circles_member_cisi ON public.oc_circles_member USING btree (circle_id, single_id);


--
-- Name: circles_member_cisiuiutil; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX circles_member_cisiuiutil ON public.oc_circles_member USING btree (circle_id, single_id, user_id, user_type, instance, level);


--
-- Name: circles_membership_ifilci; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX circles_membership_ifilci ON public.oc_circles_membership USING btree (inheritance_first, inheritance_last, circle_id);


--
-- Name: circles_mount_cimipt; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX circles_mount_cimipt ON public.oc_circles_mount USING btree (circle_id, mount_id, parent, token);


--
-- Name: circles_mountpoint_ms; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX circles_mountpoint_ms ON public.oc_circles_mountpoint USING btree (mount_id, single_id);


--
-- Name: collres_user_res; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX collres_user_res ON public.oc_collres_accesscache USING btree (user_id, resource_type, resource_id);


--
-- Name: comment_reaction; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comment_reaction ON public.oc_reactions USING btree (reaction);


--
-- Name: comment_reaction_parent_id; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comment_reaction_parent_id ON public.oc_reactions USING btree (parent_id);


--
-- Name: comment_reaction_unique; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX comment_reaction_unique ON public.oc_reactions USING btree (parent_id, actor_type, actor_id, reaction);


--
-- Name: comments_actor_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comments_actor_index ON public.oc_comments USING btree (actor_type, actor_id);


--
-- Name: comments_marker_object_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comments_marker_object_index ON public.oc_comments_read_markers USING btree (object_type, object_id);


--
-- Name: comments_object_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comments_object_index ON public.oc_comments USING btree (object_type, object_id, creation_timestamp);


--
-- Name: comments_parent_id_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comments_parent_id_index ON public.oc_comments USING btree (parent_id);


--
-- Name: comments_topmost_parent_id_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX comments_topmost_parent_id_idx ON public.oc_comments USING btree (topmost_parent_id);


--
-- Name: dav_absence_uid_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX dav_absence_uid_idx ON public.oc_dav_absence USING btree (user_id);


--
-- Name: dav_cal_proxy_ipid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX dav_cal_proxy_ipid ON public.oc_dav_cal_proxy USING btree (proxy_id);


--
-- Name: dav_cal_proxy_uidx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX dav_cal_proxy_uidx ON public.oc_dav_cal_proxy USING btree (owner_id, proxy_id, permissions);


--
-- Name: dav_shares_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX dav_shares_index ON public.oc_dav_shares USING btree (principaluri, resourceid, type, publicuri);


--
-- Name: dav_shares_resourceid_access; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX dav_shares_resourceid_access ON public.oc_dav_shares USING btree (resourceid, access);


--
-- Name: dav_shares_resourceid_type; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX dav_shares_resourceid_type ON public.oc_dav_shares USING btree (resourceid, type);


--
-- Name: direct_edit_timestamp; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX direct_edit_timestamp ON public.oc_direct_edit USING btree ("timestamp");


--
-- Name: directlink_expiration_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX directlink_expiration_idx ON public.oc_directlink USING btree (expiration);


--
-- Name: directlink_token_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX directlink_token_idx ON public.oc_directlink USING btree (token);


--
-- Name: dname; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX dname ON public.oc_circles_circle USING btree (display_name);


--
-- Name: expire_date; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX expire_date ON public.oc_comments USING btree (expire_date);


--
-- Name: f_meta_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX f_meta_index ON public.oc_files_metadata_index USING btree (file_id, meta_key, meta_value_string);


--
-- Name: f_meta_index_i; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX f_meta_index_i ON public.oc_files_metadata_index USING btree (file_id, meta_key, meta_value_int);


--
-- Name: fce_ctime_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fce_ctime_idx ON public.oc_filecache_extended USING btree (creation_time);


--
-- Name: fce_utime_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fce_utime_idx ON public.oc_filecache_extended USING btree (upload_time);


--
-- Name: file_source_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX file_source_index ON public.oc_share USING btree (file_source);


--
-- Name: files_meta_fileid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX files_meta_fileid ON public.oc_files_metadata USING btree (file_id);


--
-- Name: files_versions_uniq_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX files_versions_uniq_index ON public.oc_files_versions USING btree (file_id, "timestamp");


--
-- Name: flow_unique_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX flow_unique_hash ON public.oc_flow_checks USING btree (hash);


--
-- Name: flow_unique_scope; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX flow_unique_scope ON public.oc_flow_operations_scope USING btree (operation_id, type, value);


--
-- Name: fs_id_storage_size; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_id_storage_size ON public.oc_filecache USING btree (fileid, storage, size);


--
-- Name: fs_mtime; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_mtime ON public.oc_filecache USING btree (mtime);


--
-- Name: fs_parent; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_parent ON public.oc_filecache USING btree (parent);


--
-- Name: fs_parent_name_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_parent_name_hash ON public.oc_filecache USING btree (parent, name);


--
-- Name: fs_size; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_size ON public.oc_filecache USING btree (size);


--
-- Name: fs_storage_mimepart; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_storage_mimepart ON public.oc_filecache USING btree (storage, mimepart);


--
-- Name: fs_storage_mimetype; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_storage_mimetype ON public.oc_filecache USING btree (storage, mimetype);


--
-- Name: fs_storage_path_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX fs_storage_path_hash ON public.oc_filecache USING btree (storage, path_hash);


--
-- Name: fs_storage_size; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX fs_storage_size ON public.oc_filecache USING btree (storage, size, fileid);


--
-- Name: group_admin_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX group_admin_uid ON public.oc_group_admin USING btree (uid);


--
-- Name: gu_uid_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX gu_uid_index ON public.oc_group_user USING btree (uid);


--
-- Name: id_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX id_index ON public.oc_files_trash USING btree (id);


--
-- Name: idx_25c66a49e7a1254a; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_25c66a49e7a1254a ON public.oc_circles_member USING btree (contact_id);


--
-- Name: idx_4d5afeca5f37a13b; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_4d5afeca5f37a13b ON public.oc_direct_edit USING btree (token);


--
-- Name: idx_8195f5484230b1de; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_8195f5484230b1de ON public.oc_circles_circle USING btree (instance);


--
-- Name: idx_8195f5485f8a7f73; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_8195f5485f8a7f73 ON public.oc_circles_circle USING btree (source);


--
-- Name: idx_8195f548c317b362; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_8195f548c317b362 ON public.oc_circles_circle USING btree (sanitized_name);


--
-- Name: idx_8195f548d48a2f7c; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_8195f548d48a2f7c ON public.oc_circles_circle USING btree (config);


--
-- Name: idx_8fc816eae7c1d92b; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_8fc816eae7c1d92b ON public.oc_circles_membership USING btree (single_id);


--
-- Name: idx_f94ef8334f8e741; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_f94ef8334f8e741 ON public.oc_circles_remote USING btree (href);


--
-- Name: idx_f94ef83539b0606; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX idx_f94ef83539b0606 ON public.oc_circles_remote USING btree (uid);


--
-- Name: initiator_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX initiator_index ON public.oc_share USING btree (uid_initiator);


--
-- Name: item_share_type_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX item_share_type_index ON public.oc_share USING btree (item_type, share_type);


--
-- Name: job_argument_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX job_argument_hash ON public.oc_jobs USING btree (class, argument_hash);


--
-- Name: job_class_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX job_class_index ON public.oc_jobs USING btree (class);


--
-- Name: job_lastcheck_reserved; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX job_lastcheck_reserved ON public.oc_jobs USING btree (last_checked, reserved_at);


--
-- Name: jobs_time_sensitive; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX jobs_time_sensitive ON public.oc_jobs USING btree (time_sensitive);


--
-- Name: ku_known_to; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ku_known_to ON public.oc_known_users USING btree (known_to);


--
-- Name: ku_known_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ku_known_user ON public.oc_known_users USING btree (known_user);


--
-- Name: lock_key_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX lock_key_index ON public.oc_file_locks USING btree (key);


--
-- Name: lock_ttl_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX lock_ttl_index ON public.oc_file_locks USING btree (ttl);


--
-- Name: login_token; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX login_token ON public.oc_login_flow_v2 USING btree (login_token);


--
-- Name: mimetype_id_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX mimetype_id_index ON public.oc_mimetypes USING btree (mimetype);


--
-- Name: mount_user_storage; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mount_user_storage ON public.oc_mounts USING btree (storage_id, user_id);


--
-- Name: mounts_class_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mounts_class_index ON public.oc_mounts USING btree (mount_provider_class);


--
-- Name: mounts_mount_id_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mounts_mount_id_index ON public.oc_mounts USING btree (mount_id);


--
-- Name: mounts_root_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mounts_root_index ON public.oc_mounts USING btree (root_id);


--
-- Name: mounts_storage_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mounts_storage_index ON public.oc_mounts USING btree (storage_id);


--
-- Name: mounts_user_root_path_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX mounts_user_root_path_index ON public.oc_mounts USING btree (user_id, root_id, mount_point);


--
-- Name: mp_sid_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX mp_sid_hash ON public.oc_circles_mountpoint USING btree (single_id, mountpoint_hash);


--
-- Name: notset_nextsend; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX notset_nextsend ON public.oc_notifications_settings USING btree (next_send_time);


--
-- Name: notset_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX notset_user ON public.oc_notifications_settings USING btree (user_id);


--
-- Name: oauth2_access_client_id_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oauth2_access_client_id_idx ON public.oc_oauth2_access_tokens USING btree (client_id);


--
-- Name: oauth2_access_hash_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX oauth2_access_hash_idx ON public.oc_oauth2_access_tokens USING btree (hashed_code);


--
-- Name: oauth2_client_id_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX oauth2_client_id_idx ON public.oc_oauth2_clients USING btree (client_identifier);


--
-- Name: oauth2_tk_c_created_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oauth2_tk_c_created_idx ON public.oc_oauth2_access_tokens USING btree (token_count, code_created_at);


--
-- Name: oc_notifications_app; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oc_notifications_app ON public.oc_notifications USING btree (app);


--
-- Name: oc_notifications_object; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oc_notifications_object ON public.oc_notifications USING btree (object_type, object_id);


--
-- Name: oc_notifications_timestamp; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oc_notifications_timestamp ON public.oc_notifications USING btree ("timestamp");


--
-- Name: oc_notifications_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oc_notifications_user ON public.oc_notifications USING btree ("user");


--
-- Name: oc_npushhash_di; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX oc_npushhash_di ON public.oc_notifications_pushhash USING btree (deviceidentifier);


--
-- Name: oc_npushhash_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX oc_npushhash_uid ON public.oc_notifications_pushhash USING btree (uid, token);


--
-- Name: openlocal_user_path_token; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX openlocal_user_path_token ON public.oc_open_local_editor USING btree (user_id, path_hash, token);


--
-- Name: owner_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX owner_index ON public.oc_share USING btree (uid_owner);


--
-- Name: pa_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX pa_user ON public.oc_photos_albums USING btree ("user");


--
-- Name: paf_album_file; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX paf_album_file ON public.oc_photos_albums_files USING btree (album_id, file_id);


--
-- Name: paf_folder; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX paf_folder ON public.oc_photos_albums_files USING btree (album_id);


--
-- Name: parent_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX parent_index ON public.oc_share USING btree (parent);


--
-- Name: poll_token; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX poll_token ON public.oc_login_flow_v2 USING btree (poll_token);


--
-- Name: preferences_app_key; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX preferences_app_key ON public.oc_preferences USING btree (appid, configkey);


--
-- Name: profile_config_user_id_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX profile_config_user_id_idx ON public.oc_profile_config USING btree (user_id);


--
-- Name: properties_path_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX properties_path_index ON public.oc_properties USING btree (userid, propertypath);


--
-- Name: properties_pathonly_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX properties_pathonly_index ON public.oc_properties USING btree (propertypath);


--
-- Name: ratelimit_delete_after; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ratelimit_delete_after ON public.oc_ratelimit_entries USING btree (delete_after);


--
-- Name: ratelimit_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ratelimit_hash ON public.oc_ratelimit_entries USING btree (hash);


--
-- Name: rd_session_token_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX rd_session_token_idx ON public.oc_text_sessions USING btree (token);


--
-- Name: rd_steps_did_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX rd_steps_did_idx ON public.oc_text_steps USING btree (document_id);


--
-- Name: rd_steps_version_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX rd_steps_version_idx ON public.oc_text_steps USING btree (version);


--
-- Name: recent_contact_actor_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_actor_uid ON public.oc_recent_contact USING btree (actor_uid);


--
-- Name: recent_contact_email; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_email ON public.oc_recent_contact USING btree (email);


--
-- Name: recent_contact_fed_id; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_fed_id ON public.oc_recent_contact USING btree (federated_cloud_id);


--
-- Name: recent_contact_id_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_id_uid ON public.oc_recent_contact USING btree (id, actor_uid);


--
-- Name: recent_contact_last_contact; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_last_contact ON public.oc_recent_contact USING btree (last_contact);


--
-- Name: recent_contact_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX recent_contact_uid ON public.oc_recent_contact USING btree (uid);


--
-- Name: reminders_uniq_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX reminders_uniq_idx ON public.oc_files_reminders USING btree (user_id, file_id, due_date);


--
-- Name: schedulobj_lastmodified_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX schedulobj_lastmodified_idx ON public.oc_schedulingobjects USING btree (lastmodified);


--
-- Name: schedulobj_principuri_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX schedulobj_principuri_index ON public.oc_schedulingobjects USING btree (principaluri);


--
-- Name: sh_external_mp; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX sh_external_mp ON public.oc_share_external USING btree ("user", mountpoint_hash);


--
-- Name: share_with_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX share_with_index ON public.oc_share USING btree (share_with);


--
-- Name: sicisimit; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX sicisimit ON public.oc_circles_token USING btree (share_id, circle_id, single_id, member_id, token);


--
-- Name: stocred_ui; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX stocred_ui ON public.oc_storages_credentials USING btree ("user", identifier);


--
-- Name: stocred_user; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX stocred_user ON public.oc_storages_credentials USING btree ("user");


--
-- Name: storages_id_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX storages_id_index ON public.oc_storages USING btree (id);


--
-- Name: systag_by_objectid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX systag_by_objectid ON public.oc_systemtag_object_mapping USING btree (objectid);


--
-- Name: systag_by_tagid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX systag_by_tagid ON public.oc_systemtag_object_mapping USING btree (systemtagid, objecttype);


--
-- Name: t2i_tasks_status; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX t2i_tasks_status ON public.oc_text2image_tasks USING btree (status);


--
-- Name: t2i_tasks_uid_appid_ident; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX t2i_tasks_uid_appid_ident ON public.oc_text2image_tasks USING btree (user_id, app_id, identifier);


--
-- Name: t2i_tasks_updated; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX t2i_tasks_updated ON public.oc_text2image_tasks USING btree (last_updated);


--
-- Name: tag_ident; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX tag_ident ON public.oc_systemtag USING btree (name, visibility, editable);


--
-- Name: textstep_session; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX textstep_session ON public.oc_text_steps USING btree (session_id);


--
-- Name: timestamp; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX "timestamp" ON public.oc_login_flow_v2 USING btree ("timestamp");


--
-- Name: timestamp_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX timestamp_index ON public.oc_files_trash USING btree ("timestamp");


--
-- Name: token_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX token_index ON public.oc_share USING btree (token);


--
-- Name: tp_tasks_status_type_nonunique; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX tp_tasks_status_type_nonunique ON public.oc_textprocessing_tasks USING btree (status, type);


--
-- Name: tp_tasks_uid_appid_ident; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX tp_tasks_uid_appid_ident ON public.oc_textprocessing_tasks USING btree (user_id, app_id, identifier);


--
-- Name: tp_tasks_updated; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX tp_tasks_updated ON public.oc_textprocessing_tasks USING btree (last_updated);


--
-- Name: ts_docid_lastcontact; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ts_docid_lastcontact ON public.oc_text_sessions USING btree (document_id, last_contact);


--
-- Name: ts_lastcontact; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX ts_lastcontact ON public.oc_text_sessions USING btree (last_contact);


--
-- Name: twofactor_backupcodes_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX twofactor_backupcodes_uid ON public.oc_twofactor_backupcodes USING btree (user_id);


--
-- Name: twofactor_providers_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX twofactor_providers_uid ON public.oc_twofactor_providers USING btree (uid);


--
-- Name: type_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX type_index ON public.oc_vcategory USING btree (type);


--
-- Name: uid_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX uid_index ON public.oc_vcategory USING btree (uid);


--
-- Name: uniq_337f52f8126f525e70ee2ff6; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX uniq_337f52f8126f525e70ee2ff6 ON public.oc_circles_share_lock USING btree (item_id, circle_id);


--
-- Name: uniq_8195f548e3c68343; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX uniq_8195f548e3c68343 ON public.oc_circles_circle USING btree (unique_id);


--
-- Name: uniq_f94ef834230b1de; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX uniq_f94ef834230b1de ON public.oc_circles_remote USING btree (instance);


--
-- Name: url_hash; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX url_hash ON public.oc_trusted_servers USING btree (url_hash);


--
-- Name: user_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_index ON public.oc_files_trash USING btree ("user");


--
-- Name: user_status_clr_ix; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_status_clr_ix ON public.oc_user_status USING btree (clear_at);


--
-- Name: user_status_iud_ix; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_status_iud_ix ON public.oc_user_status USING btree (is_user_defined, status);


--
-- Name: user_status_mtstmp_ix; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_status_mtstmp_ix ON public.oc_user_status USING btree (status_message_timestamp);


--
-- Name: user_status_tstmp_ix; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_status_tstmp_ix ON public.oc_user_status USING btree (status_timestamp);


--
-- Name: user_status_uid_ix; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX user_status_uid_ix ON public.oc_user_status USING btree (user_id);


--
-- Name: user_uid_lower; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX user_uid_lower ON public.oc_users USING btree (uid_lower);


--
-- Name: vcategory_objectd_index; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX vcategory_objectd_index ON public.oc_vcategory_to_object USING btree (objid, type);


--
-- Name: version; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE UNIQUE INDEX version ON public.oc_whats_new USING btree (version);


--
-- Name: version_etag_idx; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX version_etag_idx ON public.oc_whats_new USING btree (version, etag);


--
-- Name: webauthn_publickeycredentialid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX webauthn_publickeycredentialid ON public.oc_webauthn USING btree (public_key_credential_id);


--
-- Name: webauthn_uid; Type: INDEX; Schema: public; Owner: oc_admin
--

CREATE INDEX webauthn_uid ON public.oc_webauthn USING btree (uid);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT CREATE ON SCHEMA public TO oc_admin;


--
-- PostgreSQL database dump complete
--

\unrestrict HPQzsTr7BbpN0WlaClKn16iPAk9FOrgcoKK4g0T6dHwfdu5K7K61KyHBMfIbvYm

