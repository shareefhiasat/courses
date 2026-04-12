--
-- PostgreSQL database dump
--

\restrict 2BZBJeEKrY5tbYeHDnpe81bLXYiMdWZpfNctvJyItceeFdDW3xwbEwsBfVsJEtG

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64),
    details_json text
);


ALTER TABLE public.admin_event_entity OWNER TO keycloak;

--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE public.associated_policy OWNER TO keycloak;

--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE public.authentication_execution OWNER TO keycloak;

--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE public.authentication_flow OWNER TO keycloak;

--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.authenticator_config OWNER TO keycloak;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.authenticator_config_entry OWNER TO keycloak;

--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE public.broker_link OWNER TO keycloak;

--
-- Name: client; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client OWNER TO keycloak;

--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.client_attributes OWNER TO keycloak;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE public.client_auth_flow_bindings OWNER TO keycloak;

--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE public.client_initial_access OWNER TO keycloak;

--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_node_registrations OWNER TO keycloak;

--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE public.client_scope OWNER TO keycloak;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_scope_attributes OWNER TO keycloak;

--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client_scope_client OWNER TO keycloak;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.client_scope_role_mapping OWNER TO keycloak;

--
-- Name: component; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE public.component OWNER TO keycloak;

--
-- Name: component_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.component_config OWNER TO keycloak;

--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE public.composite_role OWNER TO keycloak;

--
-- Name: credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.credential OWNER TO keycloak;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO keycloak;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO keycloak;

--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.default_client_scope OWNER TO keycloak;

--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE public.event_entity OWNER TO keycloak;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.fed_user_attribute OWNER TO keycloak;

--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.fed_user_consent OWNER TO keycloak;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.fed_user_consent_cl_scope OWNER TO keycloak;

--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.fed_user_credential OWNER TO keycloak;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_group_membership OWNER TO keycloak;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_required_action OWNER TO keycloak;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_role_mapping OWNER TO keycloak;

--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_identity OWNER TO keycloak;

--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_user OWNER TO keycloak;

--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_attribute OWNER TO keycloak;

--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_role_mapping OWNER TO keycloak;

--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL,
    organization_id character varying(255),
    hide_on_login boolean DEFAULT false
);


ALTER TABLE public.identity_provider OWNER TO keycloak;

--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.identity_provider_config OWNER TO keycloak;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.identity_provider_mapper OWNER TO keycloak;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.idp_mapper_config OWNER TO keycloak;

--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36),
    type integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.keycloak_group OWNER TO keycloak;

--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE public.keycloak_role OWNER TO keycloak;

--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.migration_model OWNER TO keycloak;

--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL,
    version integer DEFAULT 0
);


ALTER TABLE public.offline_client_session OWNER TO keycloak;

--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL,
    broker_session_id character varying(1024),
    version integer DEFAULT 0
);


ALTER TABLE public.offline_user_session OWNER TO keycloak;

--
-- Name: org; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.org (
    id character varying(255) NOT NULL,
    enabled boolean NOT NULL,
    realm_id character varying(255) NOT NULL,
    group_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(4000),
    alias character varying(255) NOT NULL,
    redirect_url character varying(2048)
);


ALTER TABLE public.org OWNER TO keycloak;

--
-- Name: org_domain; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.org_domain (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    verified boolean NOT NULL,
    org_id character varying(255) NOT NULL
);


ALTER TABLE public.org_domain OWNER TO keycloak;

--
-- Name: policy_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.policy_config OWNER TO keycloak;

--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE public.protocol_mapper OWNER TO keycloak;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.protocol_mapper_config OWNER TO keycloak;

--
-- Name: realm; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE public.realm OWNER TO keycloak;

--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE public.realm_attribute OWNER TO keycloak;

--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_default_groups OWNER TO keycloak;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_enabled_event_types OWNER TO keycloak;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_events_listeners OWNER TO keycloak;

--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE public.realm_localizations OWNER TO keycloak;

--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_required_credential OWNER TO keycloak;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.realm_smtp_config OWNER TO keycloak;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_supported_locales OWNER TO keycloak;

--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.redirect_uris OWNER TO keycloak;

--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.required_action_config OWNER TO keycloak;

--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE public.required_action_provider OWNER TO keycloak;

--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_attribute OWNER TO keycloak;

--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_policy OWNER TO keycloak;

--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_scope OWNER TO keycloak;

--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.resource_server OWNER TO keycloak;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE public.resource_server_perm_ticket OWNER TO keycloak;

--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE public.resource_server_policy OWNER TO keycloak;

--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_resource OWNER TO keycloak;

--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_scope OWNER TO keycloak;

--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.resource_uris OWNER TO keycloak;

--
-- Name: revoked_token; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.revoked_token (
    id character varying(255) NOT NULL,
    expire bigint NOT NULL
);


ALTER TABLE public.revoked_token OWNER TO keycloak;

--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.role_attribute OWNER TO keycloak;

--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_mapping OWNER TO keycloak;

--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_policy OWNER TO keycloak;

--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.user_attribute OWNER TO keycloak;

--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.user_consent OWNER TO keycloak;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.user_consent_client_scope OWNER TO keycloak;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_entity OWNER TO keycloak;

--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_config OWNER TO keycloak;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.user_federation_mapper OWNER TO keycloak;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_mapper_config OWNER TO keycloak;

--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.user_federation_provider OWNER TO keycloak;

--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    membership_type character varying(255) NOT NULL
);


ALTER TABLE public.user_group_membership OWNER TO keycloak;

--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE public.user_required_action OWNER TO keycloak;

--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_role_mapping OWNER TO keycloak;

--
-- Name: username_login_failure; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


ALTER TABLE public.username_login_failure OWNER TO keycloak;

--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: keycloak
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.web_origins OWNER TO keycloak;

--
-- Data for Name: admin_event_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.admin_event_entity (id, admin_event_time, realm_id, operation_type, auth_realm_id, auth_client_id, auth_user_id, ip_address, resource_path, representation, error, resource_type, details_json) FROM stdin;
\.


--
-- Data for Name: associated_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.associated_policy (policy_id, associated_policy_id) FROM stdin;
\.


--
-- Data for Name: authentication_execution; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authentication_execution (id, alias, authenticator, realm_id, flow_id, requirement, priority, authenticator_flow, auth_flow_id, auth_config) FROM stdin;
ff5cce48-08b9-41d7-9441-c632f5c4cf61	\N	auth-cookie	c7e460e9-8d41-4072-a515-5a9959b79e9d	82ae4278-dd37-4e7a-a607-1752cca5b581	2	10	f	\N	\N
5137ff50-f87a-4503-b91d-39a6613a7bdd	\N	auth-spnego	c7e460e9-8d41-4072-a515-5a9959b79e9d	82ae4278-dd37-4e7a-a607-1752cca5b581	3	20	f	\N	\N
eed51db9-6deb-4668-9d59-2ff7a3e12e51	\N	identity-provider-redirector	c7e460e9-8d41-4072-a515-5a9959b79e9d	82ae4278-dd37-4e7a-a607-1752cca5b581	2	25	f	\N	\N
2dc611f3-95a4-4141-8281-15aa1c93b8dd	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	82ae4278-dd37-4e7a-a607-1752cca5b581	2	30	t	8c51f171-12de-4bbf-95e8-7f5e9f5457d0	\N
2a2fd583-27b3-49dd-b134-dcca118e3bd5	\N	auth-username-password-form	c7e460e9-8d41-4072-a515-5a9959b79e9d	8c51f171-12de-4bbf-95e8-7f5e9f5457d0	0	10	f	\N	\N
6998c22c-8bf1-4d37-9f07-d0180d41f2bd	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	8c51f171-12de-4bbf-95e8-7f5e9f5457d0	1	20	t	8c69c196-efa7-47cc-a94a-43cccb56ed5a	\N
1f4da28b-7a89-4439-82d3-a2822dd86ead	\N	conditional-user-configured	c7e460e9-8d41-4072-a515-5a9959b79e9d	8c69c196-efa7-47cc-a94a-43cccb56ed5a	0	10	f	\N	\N
bf346389-4195-49ce-9f06-384af2e5413c	\N	auth-otp-form	c7e460e9-8d41-4072-a515-5a9959b79e9d	8c69c196-efa7-47cc-a94a-43cccb56ed5a	0	20	f	\N	\N
53e1f6dd-980f-4f63-8918-66abaf50af9e	\N	direct-grant-validate-username	c7e460e9-8d41-4072-a515-5a9959b79e9d	2209007f-443d-411a-b8ae-2573433be8c0	0	10	f	\N	\N
a271a53e-2798-4d84-b367-8f50f25e6ab4	\N	direct-grant-validate-password	c7e460e9-8d41-4072-a515-5a9959b79e9d	2209007f-443d-411a-b8ae-2573433be8c0	0	20	f	\N	\N
1f1075a8-e7eb-4bf1-b96f-40f4792a9b68	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	2209007f-443d-411a-b8ae-2573433be8c0	1	30	t	88c5c927-6789-496e-93e0-f92c9045eb20	\N
7ba2ea9f-99ba-453e-aad3-6b65dbdc0ef6	\N	conditional-user-configured	c7e460e9-8d41-4072-a515-5a9959b79e9d	88c5c927-6789-496e-93e0-f92c9045eb20	0	10	f	\N	\N
1a6027fb-534b-43d5-95b9-2dcda025e6f2	\N	direct-grant-validate-otp	c7e460e9-8d41-4072-a515-5a9959b79e9d	88c5c927-6789-496e-93e0-f92c9045eb20	0	20	f	\N	\N
927a3351-a4e3-4995-8552-dd38f4e3583f	\N	registration-page-form	c7e460e9-8d41-4072-a515-5a9959b79e9d	2b17ee75-35ee-4790-a05b-3202c07fe89e	0	10	t	ca406abb-d62c-42a7-bc08-d74c3136aeac	\N
51f41470-8d3e-4f0d-9eb0-fc2beaa8fc33	\N	registration-user-creation	c7e460e9-8d41-4072-a515-5a9959b79e9d	ca406abb-d62c-42a7-bc08-d74c3136aeac	0	20	f	\N	\N
abdb2191-e87c-42f0-bc25-71576b57451f	\N	registration-password-action	c7e460e9-8d41-4072-a515-5a9959b79e9d	ca406abb-d62c-42a7-bc08-d74c3136aeac	0	50	f	\N	\N
a15334f4-7983-4cec-9d20-6f590b3e71c9	\N	registration-recaptcha-action	c7e460e9-8d41-4072-a515-5a9959b79e9d	ca406abb-d62c-42a7-bc08-d74c3136aeac	3	60	f	\N	\N
1755aac4-40f7-4afd-9b2e-08280bb594bb	\N	registration-terms-and-conditions	c7e460e9-8d41-4072-a515-5a9959b79e9d	ca406abb-d62c-42a7-bc08-d74c3136aeac	3	70	f	\N	\N
d72459aa-8ff7-4c60-b88d-2f6fa5b85302	\N	reset-credentials-choose-user	c7e460e9-8d41-4072-a515-5a9959b79e9d	de9457b0-d231-4a82-8b2b-6249802b0dc2	0	10	f	\N	\N
b779c4d8-eff5-43dc-b561-1d0535b2ed77	\N	reset-credential-email	c7e460e9-8d41-4072-a515-5a9959b79e9d	de9457b0-d231-4a82-8b2b-6249802b0dc2	0	20	f	\N	\N
cdac4a84-21cf-4da1-957c-164c25e8c5cf	\N	reset-password	c7e460e9-8d41-4072-a515-5a9959b79e9d	de9457b0-d231-4a82-8b2b-6249802b0dc2	0	30	f	\N	\N
2b45765a-56d8-4473-97a5-1b455cfffe68	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	de9457b0-d231-4a82-8b2b-6249802b0dc2	1	40	t	5bcad6d3-33ae-4846-976f-6f84457656e4	\N
a53d46e9-51e6-4971-9806-d7b9bb4837cc	\N	conditional-user-configured	c7e460e9-8d41-4072-a515-5a9959b79e9d	5bcad6d3-33ae-4846-976f-6f84457656e4	0	10	f	\N	\N
94fcfe16-9af8-40f9-a045-0fa7f0473458	\N	reset-otp	c7e460e9-8d41-4072-a515-5a9959b79e9d	5bcad6d3-33ae-4846-976f-6f84457656e4	0	20	f	\N	\N
fb4fcb7e-2f5b-4dcb-8a67-53692431f677	\N	client-secret	c7e460e9-8d41-4072-a515-5a9959b79e9d	6c973a87-345b-408f-84fa-fe93e97304a2	2	10	f	\N	\N
4a698526-9e60-4ccf-a40c-65c14b8633c0	\N	client-jwt	c7e460e9-8d41-4072-a515-5a9959b79e9d	6c973a87-345b-408f-84fa-fe93e97304a2	2	20	f	\N	\N
3e4d62e0-d8e7-4ec0-b424-5b01165deeab	\N	client-secret-jwt	c7e460e9-8d41-4072-a515-5a9959b79e9d	6c973a87-345b-408f-84fa-fe93e97304a2	2	30	f	\N	\N
54e42b8e-fc2f-4b6b-99ce-6df031b66a8d	\N	client-x509	c7e460e9-8d41-4072-a515-5a9959b79e9d	6c973a87-345b-408f-84fa-fe93e97304a2	2	40	f	\N	\N
84ca6d7f-d96e-485e-86a9-4da564065820	\N	idp-review-profile	c7e460e9-8d41-4072-a515-5a9959b79e9d	5bd8f430-81b5-4c51-9d6b-887da8406457	0	10	f	\N	59a504e7-63cf-45cf-ba54-75776c18aede
e289ec6f-f1e7-4a30-b2c2-d8836053899e	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	5bd8f430-81b5-4c51-9d6b-887da8406457	0	20	t	83cdfa83-f8e6-4da1-959e-f4e2051e961e	\N
cbfa1b0b-9b71-4194-a34c-ef1e5d6a6f48	\N	idp-create-user-if-unique	c7e460e9-8d41-4072-a515-5a9959b79e9d	83cdfa83-f8e6-4da1-959e-f4e2051e961e	2	10	f	\N	6abcef92-1312-4273-9467-3b67be88bca1
e68ed0a5-024b-436a-b408-b6a689ee1267	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	83cdfa83-f8e6-4da1-959e-f4e2051e961e	2	20	t	07b5b126-eb68-454d-a86f-1fd127ffa208	\N
f7855af2-b7b4-482e-8cad-1f19fcb4734e	\N	idp-confirm-link	c7e460e9-8d41-4072-a515-5a9959b79e9d	07b5b126-eb68-454d-a86f-1fd127ffa208	0	10	f	\N	\N
131843ed-9dda-44d6-8a23-be81ef557001	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	07b5b126-eb68-454d-a86f-1fd127ffa208	0	20	t	e24560c9-d398-4ed0-808e-1ff014a7d4cc	\N
716faf85-3720-4b90-b629-0d7c1e46235f	\N	idp-email-verification	c7e460e9-8d41-4072-a515-5a9959b79e9d	e24560c9-d398-4ed0-808e-1ff014a7d4cc	2	10	f	\N	\N
1a3bf4dc-abab-4107-95f6-2df0b6b932e7	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	e24560c9-d398-4ed0-808e-1ff014a7d4cc	2	20	t	e563c3ce-dcab-4d39-b4ad-c8cc586e00da	\N
ae12626e-30db-464b-8180-9ac1f3c0c371	\N	idp-username-password-form	c7e460e9-8d41-4072-a515-5a9959b79e9d	e563c3ce-dcab-4d39-b4ad-c8cc586e00da	0	10	f	\N	\N
ef6b0794-0cd4-466a-b328-eb1f1299ad18	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	e563c3ce-dcab-4d39-b4ad-c8cc586e00da	1	20	t	a09d8a9e-d8b9-43a7-9d71-924948dc266e	\N
1328d85e-ad92-4703-85b4-f0213542c510	\N	conditional-user-configured	c7e460e9-8d41-4072-a515-5a9959b79e9d	a09d8a9e-d8b9-43a7-9d71-924948dc266e	0	10	f	\N	\N
623646e0-7160-48e7-a28e-d6ad117ddb34	\N	auth-otp-form	c7e460e9-8d41-4072-a515-5a9959b79e9d	a09d8a9e-d8b9-43a7-9d71-924948dc266e	0	20	f	\N	\N
c7a649d1-9a38-4b62-b18e-d5c17a35bda4	\N	http-basic-authenticator	c7e460e9-8d41-4072-a515-5a9959b79e9d	cb42018c-cc7b-491b-af5a-a67883847ad1	0	10	f	\N	\N
05cc9bc9-6faa-43f5-8295-3ec8ce33d386	\N	docker-http-basic-authenticator	c7e460e9-8d41-4072-a515-5a9959b79e9d	0ae23b73-4b55-4719-ab38-b3450905527e	0	10	f	\N	\N
\.


--
-- Data for Name: authentication_flow; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authentication_flow (id, alias, description, realm_id, provider_id, top_level, built_in) FROM stdin;
82ae4278-dd37-4e7a-a607-1752cca5b581	browser	Browser based authentication	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
8c51f171-12de-4bbf-95e8-7f5e9f5457d0	forms	Username, password, otp and other auth forms.	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
8c69c196-efa7-47cc-a94a-43cccb56ed5a	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
2209007f-443d-411a-b8ae-2573433be8c0	direct grant	OpenID Connect Resource Owner Grant	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
88c5c927-6789-496e-93e0-f92c9045eb20	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
2b17ee75-35ee-4790-a05b-3202c07fe89e	registration	Registration flow	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
ca406abb-d62c-42a7-bc08-d74c3136aeac	registration form	Registration form	c7e460e9-8d41-4072-a515-5a9959b79e9d	form-flow	f	t
de9457b0-d231-4a82-8b2b-6249802b0dc2	reset credentials	Reset credentials for a user if they forgot their password or something	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
5bcad6d3-33ae-4846-976f-6f84457656e4	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
6c973a87-345b-408f-84fa-fe93e97304a2	clients	Base authentication for clients	c7e460e9-8d41-4072-a515-5a9959b79e9d	client-flow	t	t
5bd8f430-81b5-4c51-9d6b-887da8406457	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
83cdfa83-f8e6-4da1-959e-f4e2051e961e	User creation or linking	Flow for the existing/non-existing user alternatives	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
07b5b126-eb68-454d-a86f-1fd127ffa208	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
e24560c9-d398-4ed0-808e-1ff014a7d4cc	Account verification options	Method with which to verity the existing account	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
e563c3ce-dcab-4d39-b4ad-c8cc586e00da	Verify Existing Account by Re-authentication	Reauthentication of existing account	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
a09d8a9e-d8b9-43a7-9d71-924948dc266e	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	f	t
cb42018c-cc7b-491b-af5a-a67883847ad1	saml ecp	SAML ECP Profile Authentication Flow	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
0ae23b73-4b55-4719-ab38-b3450905527e	docker auth	Used by Docker clients to authenticate against the IDP	c7e460e9-8d41-4072-a515-5a9959b79e9d	basic-flow	t	t
\.


--
-- Data for Name: authenticator_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authenticator_config (id, alias, realm_id) FROM stdin;
59a504e7-63cf-45cf-ba54-75776c18aede	review profile config	c7e460e9-8d41-4072-a515-5a9959b79e9d
6abcef92-1312-4273-9467-3b67be88bca1	create unique user config	c7e460e9-8d41-4072-a515-5a9959b79e9d
\.


--
-- Data for Name: authenticator_config_entry; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.authenticator_config_entry (authenticator_id, value, name) FROM stdin;
59a504e7-63cf-45cf-ba54-75776c18aede	missing	update.profile.on.first.login
6abcef92-1312-4273-9467-3b67be88bca1	false	require.password.update.after.registration
\.


--
-- Data for Name: broker_link; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.broker_link (identity_provider, storage_provider_id, realm_id, broker_user_id, broker_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client (id, enabled, full_scope_allowed, client_id, not_before, public_client, secret, base_url, bearer_only, management_url, surrogate_auth_required, realm_id, protocol, node_rereg_timeout, frontchannel_logout, consent_required, name, service_accounts_enabled, client_authenticator_type, root_url, description, registration_token, standard_flow_enabled, implicit_flow_enabled, direct_access_grants_enabled, always_display_in_console) FROM stdin;
f9f99755-4d34-413d-821f-4bfa12568790	t	f	master-realm	0	f	\N	\N	t	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	0	f	f	master Realm	f	client-secret	\N	\N	\N	t	f	f	f
386311a8-d22a-4642-9e53-58134b2473d7	t	f	account	0	t	\N	/realms/master/account/	f	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
0582098f-d963-43ee-822c-4a3f51609dd7	t	f	account-console	0	t	\N	/realms/master/account/	f	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
563a14f1-2f0c-4005-932e-53e274bc3503	t	f	broker	0	f	\N	\N	t	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
df49b488-e907-456b-b1af-87e59164d12d	t	t	security-admin-console	0	t	\N	/admin/master/console/	f	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	t	t	admin-cli	0	t	\N	\N	f	\N	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	t	t	admin-console-test	0	t	\N	/admin	f	http://localhost:8080	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	-1	f	f	Admin Console Test	f	public-client	http://localhost:8080	Test client for admin console access	\N	t	f	t	f
d92dbca4-d86d-41fb-a310-06ae34027247	t	t	military-lms-app	0	t	\N	/	f	http://localhost:8080	f	c7e460e9-8d41-4072-a515-5a9959b79e9d	openid-connect	-1	t	f	Military LMS Frontend	f	public-client	https://localhost:5174	Frontend application for Military LMS	\N	t	f	t	f
\.


--
-- Data for Name: client_attributes; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_attributes (client_id, name, value) FROM stdin;
386311a8-d22a-4642-9e53-58134b2473d7	post.logout.redirect.uris	+
0582098f-d963-43ee-822c-4a3f51609dd7	post.logout.redirect.uris	+
0582098f-d963-43ee-822c-4a3f51609dd7	pkce.code.challenge.method	S256
df49b488-e907-456b-b1af-87e59164d12d	post.logout.redirect.uris	+
df49b488-e907-456b-b1af-87e59164d12d	pkce.code.challenge.method	S256
df49b488-e907-456b-b1af-87e59164d12d	client.use.lightweight.access.token.enabled	true
e05b784f-1da4-44c1-9bec-6332e1b93a65	client.use.lightweight.access.token.enabled	true
d92dbca4-d86d-41fb-a310-06ae34027247	realm_client	false
d92dbca4-d86d-41fb-a310-06ae34027247	backchannel.logout.session.required	false
d92dbca4-d86d-41fb-a310-06ae34027247	display.on.consent.screen	false
d92dbca4-d86d-41fb-a310-06ae34027247	pkce.code.challenge.method	S256
d92dbca4-d86d-41fb-a310-06ae34027247	sso.session.max.age	36000
d92dbca4-d86d-41fb-a310-06ae34027247	logout.redirect.uri	http://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	frontchannel.logout.url	http://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	post.logout.redirect.uris	http://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	oauth2.device.authorization.grant.enabled	false
d92dbca4-d86d-41fb-a310-06ae34027247	oidc.ciba.grant.enabled	false
d92dbca4-d86d-41fb-a310-06ae34027247	backchannel.logout.revoke.offline.tokens	false
\.


--
-- Data for Name: client_auth_flow_bindings; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_auth_flow_bindings (client_id, flow_id, binding_name) FROM stdin;
\.


--
-- Data for Name: client_initial_access; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_initial_access (id, realm_id, "timestamp", expiration, count, remaining_count) FROM stdin;
\.


--
-- Data for Name: client_node_registrations; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_node_registrations (client_id, value, name) FROM stdin;
\.


--
-- Data for Name: client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope (id, name, realm_id, description, protocol) FROM stdin;
0b38d136-7bfb-484d-870d-d5f023e0cf7b	offline_access	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect built-in scope: offline_access	openid-connect
00890085-7350-4dc6-bcf0-433efc769a25	role_list	c7e460e9-8d41-4072-a515-5a9959b79e9d	SAML role list	saml
9890572f-369c-485d-8d4c-606c5782f234	saml_organization	c7e460e9-8d41-4072-a515-5a9959b79e9d	Organization Membership	saml
63523679-db26-4743-b414-f98380c38967	profile	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect built-in scope: profile	openid-connect
800b325c-f928-4884-9640-fdfc094226fc	email	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect built-in scope: email	openid-connect
b3e47d9b-d93f-4bff-b498-73c38c5a9dee	address	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect built-in scope: address	openid-connect
fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	phone	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect built-in scope: phone	openid-connect
4a706042-94dd-4cae-85d6-0c128b5c3263	roles	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect scope for add user roles to the access token	openid-connect
fa1ac8de-3333-408a-add1-bb2aca265495	web-origins	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect scope for add allowed web origins to the access token	openid-connect
e0a238c1-cabc-4790-92c3-037c578f9631	microprofile-jwt	c7e460e9-8d41-4072-a515-5a9959b79e9d	Microprofile - JWT built-in scope	openid-connect
0f127a4e-78a5-4272-a44a-2c822385277d	acr	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
c8a3d54e-3416-47ea-a5ee-64863acb4cb7	basic	c7e460e9-8d41-4072-a515-5a9959b79e9d	OpenID Connect scope for add all basic claims to the token	openid-connect
0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	organization	c7e460e9-8d41-4072-a515-5a9959b79e9d	Additional claims about the organization a subject belongs to	openid-connect
\.


--
-- Data for Name: client_scope_attributes; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_attributes (scope_id, value, name) FROM stdin;
0b38d136-7bfb-484d-870d-d5f023e0cf7b	true	display.on.consent.screen
0b38d136-7bfb-484d-870d-d5f023e0cf7b	${offlineAccessScopeConsentText}	consent.screen.text
00890085-7350-4dc6-bcf0-433efc769a25	true	display.on.consent.screen
00890085-7350-4dc6-bcf0-433efc769a25	${samlRoleListScopeConsentText}	consent.screen.text
9890572f-369c-485d-8d4c-606c5782f234	false	display.on.consent.screen
63523679-db26-4743-b414-f98380c38967	true	display.on.consent.screen
63523679-db26-4743-b414-f98380c38967	${profileScopeConsentText}	consent.screen.text
63523679-db26-4743-b414-f98380c38967	true	include.in.token.scope
800b325c-f928-4884-9640-fdfc094226fc	true	display.on.consent.screen
800b325c-f928-4884-9640-fdfc094226fc	${emailScopeConsentText}	consent.screen.text
800b325c-f928-4884-9640-fdfc094226fc	true	include.in.token.scope
b3e47d9b-d93f-4bff-b498-73c38c5a9dee	true	display.on.consent.screen
b3e47d9b-d93f-4bff-b498-73c38c5a9dee	${addressScopeConsentText}	consent.screen.text
b3e47d9b-d93f-4bff-b498-73c38c5a9dee	true	include.in.token.scope
fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	true	display.on.consent.screen
fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	${phoneScopeConsentText}	consent.screen.text
fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	true	include.in.token.scope
4a706042-94dd-4cae-85d6-0c128b5c3263	true	display.on.consent.screen
4a706042-94dd-4cae-85d6-0c128b5c3263	${rolesScopeConsentText}	consent.screen.text
4a706042-94dd-4cae-85d6-0c128b5c3263	false	include.in.token.scope
fa1ac8de-3333-408a-add1-bb2aca265495	false	display.on.consent.screen
fa1ac8de-3333-408a-add1-bb2aca265495		consent.screen.text
fa1ac8de-3333-408a-add1-bb2aca265495	false	include.in.token.scope
e0a238c1-cabc-4790-92c3-037c578f9631	false	display.on.consent.screen
e0a238c1-cabc-4790-92c3-037c578f9631	true	include.in.token.scope
0f127a4e-78a5-4272-a44a-2c822385277d	false	display.on.consent.screen
0f127a4e-78a5-4272-a44a-2c822385277d	false	include.in.token.scope
c8a3d54e-3416-47ea-a5ee-64863acb4cb7	false	display.on.consent.screen
c8a3d54e-3416-47ea-a5ee-64863acb4cb7	false	include.in.token.scope
0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	true	display.on.consent.screen
0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	${organizationScopeConsentText}	consent.screen.text
0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	true	include.in.token.scope
\.


--
-- Data for Name: client_scope_client; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_client (client_id, scope_id, default_scope) FROM stdin;
386311a8-d22a-4642-9e53-58134b2473d7	4a706042-94dd-4cae-85d6-0c128b5c3263	t
386311a8-d22a-4642-9e53-58134b2473d7	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
386311a8-d22a-4642-9e53-58134b2473d7	800b325c-f928-4884-9640-fdfc094226fc	t
386311a8-d22a-4642-9e53-58134b2473d7	0f127a4e-78a5-4272-a44a-2c822385277d	t
386311a8-d22a-4642-9e53-58134b2473d7	63523679-db26-4743-b414-f98380c38967	t
386311a8-d22a-4642-9e53-58134b2473d7	fa1ac8de-3333-408a-add1-bb2aca265495	t
386311a8-d22a-4642-9e53-58134b2473d7	e0a238c1-cabc-4790-92c3-037c578f9631	f
386311a8-d22a-4642-9e53-58134b2473d7	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
386311a8-d22a-4642-9e53-58134b2473d7	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
386311a8-d22a-4642-9e53-58134b2473d7	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
386311a8-d22a-4642-9e53-58134b2473d7	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
0582098f-d963-43ee-822c-4a3f51609dd7	4a706042-94dd-4cae-85d6-0c128b5c3263	t
0582098f-d963-43ee-822c-4a3f51609dd7	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
0582098f-d963-43ee-822c-4a3f51609dd7	800b325c-f928-4884-9640-fdfc094226fc	t
0582098f-d963-43ee-822c-4a3f51609dd7	0f127a4e-78a5-4272-a44a-2c822385277d	t
0582098f-d963-43ee-822c-4a3f51609dd7	63523679-db26-4743-b414-f98380c38967	t
0582098f-d963-43ee-822c-4a3f51609dd7	fa1ac8de-3333-408a-add1-bb2aca265495	t
0582098f-d963-43ee-822c-4a3f51609dd7	e0a238c1-cabc-4790-92c3-037c578f9631	f
0582098f-d963-43ee-822c-4a3f51609dd7	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
0582098f-d963-43ee-822c-4a3f51609dd7	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
0582098f-d963-43ee-822c-4a3f51609dd7	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
0582098f-d963-43ee-822c-4a3f51609dd7	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	4a706042-94dd-4cae-85d6-0c128b5c3263	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	800b325c-f928-4884-9640-fdfc094226fc	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	0f127a4e-78a5-4272-a44a-2c822385277d	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	63523679-db26-4743-b414-f98380c38967	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	fa1ac8de-3333-408a-add1-bb2aca265495	t
e05b784f-1da4-44c1-9bec-6332e1b93a65	e0a238c1-cabc-4790-92c3-037c578f9631	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
e05b784f-1da4-44c1-9bec-6332e1b93a65	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
563a14f1-2f0c-4005-932e-53e274bc3503	4a706042-94dd-4cae-85d6-0c128b5c3263	t
563a14f1-2f0c-4005-932e-53e274bc3503	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
563a14f1-2f0c-4005-932e-53e274bc3503	800b325c-f928-4884-9640-fdfc094226fc	t
563a14f1-2f0c-4005-932e-53e274bc3503	0f127a4e-78a5-4272-a44a-2c822385277d	t
563a14f1-2f0c-4005-932e-53e274bc3503	63523679-db26-4743-b414-f98380c38967	t
563a14f1-2f0c-4005-932e-53e274bc3503	fa1ac8de-3333-408a-add1-bb2aca265495	t
563a14f1-2f0c-4005-932e-53e274bc3503	e0a238c1-cabc-4790-92c3-037c578f9631	f
563a14f1-2f0c-4005-932e-53e274bc3503	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
563a14f1-2f0c-4005-932e-53e274bc3503	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
563a14f1-2f0c-4005-932e-53e274bc3503	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
563a14f1-2f0c-4005-932e-53e274bc3503	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
f9f99755-4d34-413d-821f-4bfa12568790	4a706042-94dd-4cae-85d6-0c128b5c3263	t
f9f99755-4d34-413d-821f-4bfa12568790	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
f9f99755-4d34-413d-821f-4bfa12568790	800b325c-f928-4884-9640-fdfc094226fc	t
f9f99755-4d34-413d-821f-4bfa12568790	0f127a4e-78a5-4272-a44a-2c822385277d	t
f9f99755-4d34-413d-821f-4bfa12568790	63523679-db26-4743-b414-f98380c38967	t
f9f99755-4d34-413d-821f-4bfa12568790	fa1ac8de-3333-408a-add1-bb2aca265495	t
f9f99755-4d34-413d-821f-4bfa12568790	e0a238c1-cabc-4790-92c3-037c578f9631	f
f9f99755-4d34-413d-821f-4bfa12568790	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
f9f99755-4d34-413d-821f-4bfa12568790	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
f9f99755-4d34-413d-821f-4bfa12568790	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
f9f99755-4d34-413d-821f-4bfa12568790	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
df49b488-e907-456b-b1af-87e59164d12d	4a706042-94dd-4cae-85d6-0c128b5c3263	t
df49b488-e907-456b-b1af-87e59164d12d	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
df49b488-e907-456b-b1af-87e59164d12d	800b325c-f928-4884-9640-fdfc094226fc	t
df49b488-e907-456b-b1af-87e59164d12d	0f127a4e-78a5-4272-a44a-2c822385277d	t
df49b488-e907-456b-b1af-87e59164d12d	63523679-db26-4743-b414-f98380c38967	t
df49b488-e907-456b-b1af-87e59164d12d	fa1ac8de-3333-408a-add1-bb2aca265495	t
df49b488-e907-456b-b1af-87e59164d12d	e0a238c1-cabc-4790-92c3-037c578f9631	f
df49b488-e907-456b-b1af-87e59164d12d	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
df49b488-e907-456b-b1af-87e59164d12d	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
df49b488-e907-456b-b1af-87e59164d12d	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
df49b488-e907-456b-b1af-87e59164d12d	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
d92dbca4-d86d-41fb-a310-06ae34027247	4a706042-94dd-4cae-85d6-0c128b5c3263	t
d92dbca4-d86d-41fb-a310-06ae34027247	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
d92dbca4-d86d-41fb-a310-06ae34027247	800b325c-f928-4884-9640-fdfc094226fc	t
d92dbca4-d86d-41fb-a310-06ae34027247	0f127a4e-78a5-4272-a44a-2c822385277d	t
d92dbca4-d86d-41fb-a310-06ae34027247	63523679-db26-4743-b414-f98380c38967	t
d92dbca4-d86d-41fb-a310-06ae34027247	fa1ac8de-3333-408a-add1-bb2aca265495	t
d92dbca4-d86d-41fb-a310-06ae34027247	e0a238c1-cabc-4790-92c3-037c578f9631	f
d92dbca4-d86d-41fb-a310-06ae34027247	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
d92dbca4-d86d-41fb-a310-06ae34027247	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
d92dbca4-d86d-41fb-a310-06ae34027247	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
d92dbca4-d86d-41fb-a310-06ae34027247	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	4a706042-94dd-4cae-85d6-0c128b5c3263	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	800b325c-f928-4884-9640-fdfc094226fc	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	0f127a4e-78a5-4272-a44a-2c822385277d	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	63523679-db26-4743-b414-f98380c38967	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	fa1ac8de-3333-408a-add1-bb2aca265495	t
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	e0a238c1-cabc-4790-92c3-037c578f9631	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
\.


--
-- Data for Name: client_scope_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.client_scope_role_mapping (scope_id, role_id) FROM stdin;
0b38d136-7bfb-484d-870d-d5f023e0cf7b	98ec35c8-5c18-4698-8786-3a85f525520e
\.


--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.component (id, name, parent_id, provider_id, provider_type, realm_id, sub_type) FROM stdin;
6837d615-21c3-4835-b66c-584ad60d5ecc	Trusted Hosts	c7e460e9-8d41-4072-a515-5a9959b79e9d	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
7ebca3db-79b8-45ac-9189-7ce166b7ee0c	Consent Required	c7e460e9-8d41-4072-a515-5a9959b79e9d	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
e9b07ab3-c76d-4b9f-94ee-82cb7b136786	Full Scope Disabled	c7e460e9-8d41-4072-a515-5a9959b79e9d	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
20d6558a-781e-4aeb-ac35-830c52accb11	Max Clients Limit	c7e460e9-8d41-4072-a515-5a9959b79e9d	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
09ca6a7d-d9a3-4aad-8b56-a2341240fa00	Allowed Protocol Mapper Types	c7e460e9-8d41-4072-a515-5a9959b79e9d	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
cb6bebaa-755f-45df-8e8d-f80c2ae13544	Allowed Client Scopes	c7e460e9-8d41-4072-a515-5a9959b79e9d	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	anonymous
f27d41e9-d495-4d21-b794-b2417490fdb9	Allowed Protocol Mapper Types	c7e460e9-8d41-4072-a515-5a9959b79e9d	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	authenticated
2190c826-b2ac-4456-8095-3c87282694a5	Allowed Client Scopes	c7e460e9-8d41-4072-a515-5a9959b79e9d	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	authenticated
64c9a6cd-255a-4e0a-9902-67cd3fa76799	rsa-generated	c7e460e9-8d41-4072-a515-5a9959b79e9d	rsa-generated	org.keycloak.keys.KeyProvider	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N
3eba4e1c-3eb0-4966-b545-daba2bf4b91d	rsa-enc-generated	c7e460e9-8d41-4072-a515-5a9959b79e9d	rsa-enc-generated	org.keycloak.keys.KeyProvider	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N
74192d6b-0393-4416-9b8c-d42f820d4c89	hmac-generated-hs512	c7e460e9-8d41-4072-a515-5a9959b79e9d	hmac-generated	org.keycloak.keys.KeyProvider	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N
10103c3b-edd9-4699-b905-2f7aa1789464	aes-generated	c7e460e9-8d41-4072-a515-5a9959b79e9d	aes-generated	org.keycloak.keys.KeyProvider	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N
b6d11a73-0ff2-4d5c-88c0-cda69ebcd139	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	declarative-user-profile	org.keycloak.userprofile.UserProfileProvider	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N
\.


--
-- Data for Name: component_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.component_config (id, component_id, name, value) FROM stdin;
f84fbb03-ee14-4783-bcb5-67b1ec125221	cb6bebaa-755f-45df-8e8d-f80c2ae13544	allow-default-scopes	true
dd774692-6356-4e0f-ae3f-24e68a759ba7	20d6558a-781e-4aeb-ac35-830c52accb11	max-clients	200
fc0e3e1c-93eb-4476-afda-96f65fa302fb	2190c826-b2ac-4456-8095-3c87282694a5	allow-default-scopes	true
cde6b575-99d2-46cc-a72f-809200554a15	6837d615-21c3-4835-b66c-584ad60d5ecc	host-sending-registration-request-must-match	true
3248f032-a71e-41b9-baf7-ff8fe7e51746	6837d615-21c3-4835-b66c-584ad60d5ecc	client-uris-must-match	true
0783e16f-968f-4250-84bd-ddddfa444c36	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
8509f575-b3ea-4cbb-bc33-e6b73b71bf3d	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	saml-role-list-mapper
23024490-cebe-4d0f-bd70-37c3fd35710f	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	saml-user-property-mapper
5eeac717-f9eb-468c-923a-b486ddb56988	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	saml-user-attribute-mapper
0e02f660-0910-4371-8510-61a3b710d772	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
ffce89e8-d272-4465-9bac-456634067025	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	oidc-full-name-mapper
29e2da64-34ec-4d58-b755-20cff0c11a38	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	oidc-address-mapper
5cc5e504-a2be-4d2e-9af3-5f53dc5d4e69	09ca6a7d-d9a3-4aad-8b56-a2341240fa00	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
212e4b30-cc66-4572-8440-31e08f96c14b	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	saml-role-list-mapper
5f084dad-034e-498e-bbee-639f0a863f18	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
300b274f-fb74-4ef9-919e-13634c7ee9d8	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	saml-user-property-mapper
17dc3f02-2666-4dca-a829-73303e5dc0d0	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	oidc-full-name-mapper
22fe7105-382f-4fe4-9dcc-f66ddc29ccd1	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	oidc-address-mapper
6db545c8-21dd-4bfd-a550-e419f66c66b4	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	saml-user-attribute-mapper
3ef2b497-240b-4c85-849f-3702a3a9475d	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
8580c0d8-fd08-46c4-bb1c-bebed658439c	f27d41e9-d495-4d21-b794-b2417490fdb9	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
e4c85c1a-7b67-4b44-b8c2-45e60992eb1b	64c9a6cd-255a-4e0a-9902-67cd3fa76799	privateKey	MIIEogIBAAKCAQEAtuVZ+h1dtVB5ypQjJuHuMhv6uJDpql4WOAag3K21FZeLI3sbqA9+Aj8e64+elqsbhR85Fjt1H7Bglvx1RrXFCmeSpnw8u3WAnYycbTl07efBqRH1fawzy3v3lax7/hey4Bs7fb7tT102ORI0eLNdZzssn5WLyIz6wUWHVIniOVN0EPl4ookfdwSktVlsMhpwe0dBRH1b1TjSzkPsfiL5i1QiwVrNAUXWWDuWo+hkq/1Im4i9icDz/EKWpZ9zmp+KBEKSF4lFOeCd7n0FBNJKtDnBT7XD3VzL7EKhvZUTzglAS4rI0gTjFnLXoDAoZzlCSkrwpWdrsn15tLEs1F5PJwIDAQABAoIBAFPBXB8J66vomp2GkUJxHF+eKIb09cyrIYmun2PvuImWyIULD3M7BP2KYmKFdp6Q5R1lWwMvX0ePwevi2OH0w7MsEyBirH08JhYAGnJ6aW25QBpouv8+KMn6jzrfrjiCKcwvLGM9V/eMPBSOnbDYkuF/W8QI++ZviTWQ3ZR9QDf3lWtNXCOXFDBdLw0B1RwFJpyzPZ1NM18vY8jG2s8EqJK7Ogcf5Dfx0R7s0Xd64U/sG82UHGydQEa8MYKQq8YjhN0Hnt6ynLZ58aqN/spvUWN968sN2FBTA7T29EMc6w5KuwnJYiBubRVu6UBS0eOegm0XwCD/6/2Rj4ede6UqioECgYEA3IiLtorOTcSPvQii3U7k5kud8CCnvuuuameYpaLhuxrixOc2qZGdbxKAQehT4DmsSSOs7+UurMBFNPhQufGUAPuw4VTeEcangWs8nUGwwxmbChd5Yvwpy/IkpjP8HL4IjUo3VRSrZiGVm/gpQ37pWOjd4Srr/vmZ2sMlPrDrOBECgYEA1E9BKyOcLnkocqAdjCRkgAlueZEyuEXhC+aynbWOoX5vAYESicvvKJaUMT7nYyfsYZ27cNTEqlolxvRtr5rs8D2nu458s2x6lfl6q5ansJeFXvGYGPiTseCSqVNWT5Nh5Ralrmj3hH+G0a/ocMcCCHeNFqMeRP6DogEYtuBIi7cCgYARP8TdxEGap5Muj+xdLvyMXsG9tHAqaLi9rdisq+7H+bRe/k6yOKd9to69mPRmh1xIZDf0k5JxBKDlIb7+rDyNTyJonYC5Fzam0sJs8mRm/iu4QFnIOjzyrL/dGBfSD7MPigyF5RX66QmQp3piwxxxTdV89SR8Tv2PtM/G9YOQYQKBgFK8C9ZGyz8lAckhckJBkFSA2GdRWOWMfbWIkkR5EvsF7TY12UaPjURQ4bELJVpznV8w+3FtyLHl7WDJsdDD29+G901Uqm21MVQuY0porDJZ6aRlG3Nnsw6XSC/qBPF/qp9+otQDnakplR0zoq4IL1ejVvziVhJm6F8CdGIXps2jAoGAStUZnkttiBKUn/SSrqE5laEf8xPyIwuqK3xgY9mMZgxT+BEgiFOK+ld5l3qXKZ165F8XgNGa+LL9VAwU1yXFkwDeNr4FtQKkK8ptttIfYN7j/v2bateZvlEVyUZRsGqTzvfJhNXGIGkzRqMOGV/95A+zAL3aasV2+jT2RIAX890=
6f8aca9c-0399-4677-a66b-9feed7202242	64c9a6cd-255a-4e0a-9902-67cd3fa76799	priority	100
275a9e5c-efc0-4d2e-bf7a-3bd47bbcea6a	64c9a6cd-255a-4e0a-9902-67cd3fa76799	certificate	MIICmzCCAYMCBgGdND5C/TANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwMzI4MTEzODA4WhcNMzYwMzI4MTEzOTQ4WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC25Vn6HV21UHnKlCMm4e4yG/q4kOmqXhY4BqDcrbUVl4sjexuoD34CPx7rj56WqxuFHzkWO3UfsGCW/HVGtcUKZ5KmfDy7dYCdjJxtOXTt58GpEfV9rDPLe/eVrHv+F7LgGzt9vu1PXTY5EjR4s11nOyyflYvIjPrBRYdUieI5U3QQ+XiiiR93BKS1WWwyGnB7R0FEfVvVONLOQ+x+IvmLVCLBWs0BRdZYO5aj6GSr/UibiL2JwPP8Qpaln3Oan4oEQpIXiUU54J3ufQUE0kq0OcFPtcPdXMvsQqG9lRPOCUBLisjSBOMWctegMChnOUJKSvClZ2uyfXm0sSzUXk8nAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAKtPtrMYHpSk2aF78jJW7pknS0v2ANid6/dSck3yuxbj/CpAk2W6fKYqiQiepmzFZC9AqJpf0HNsEuvJmMasnf/gaPIMJxLcMRyXbHNpKDeDOhr1fteiXk2EdL2S6BAIN52njXWn0HCpa/U2xoArRwRFhpKZ1nA8ZgfcpG9mxVfT9XjVpnx4erZzogMTSCJDEJbtJ2ONiZ7Af1QqF6zxLOZIjROJ/qy/+hJhFaf8yY+ODnw0himAxbmH704tRchodxiyK8Uk26uZodJbB1IGn7kW8L2jw0W5Yjm4Rw6GHhHNvbfZ2FUJQDMtthB6cg5tF2G7ag1Vr3c1sD2I8L23LHI=
b5a08d00-34b3-4abd-a350-0f21d0e22e5d	64c9a6cd-255a-4e0a-9902-67cd3fa76799	keyUse	SIG
e587ce71-8d7f-45af-829a-320532f3172b	b6d11a73-0ff2-4d5c-88c0-cda69ebcd139	kc.user.profile.config	{"attributes":[{"name":"username","displayName":"${username}","validations":{"length":{"min":3,"max":255},"username-prohibited-characters":{},"up-username-not-idn-homograph":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"email","displayName":"${email}","validations":{"email":{},"length":{"max":255}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"firstName","displayName":"${firstName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"lastName","displayName":"${lastName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false}],"groups":[{"name":"user-metadata","displayHeader":"User metadata","displayDescription":"Attributes, which refer to user metadata"}]}
a1d58599-6665-422b-ab30-dcdeca5cb762	3eba4e1c-3eb0-4966-b545-daba2bf4b91d	keyUse	ENC
71cbad82-fcba-4922-818c-7f724636610a	3eba4e1c-3eb0-4966-b545-daba2bf4b91d	priority	100
d1b0caa7-4b31-49b6-8e27-cb3363740262	3eba4e1c-3eb0-4966-b545-daba2bf4b91d	privateKey	MIIEogIBAAKCAQEAjCpmKcJPJtvuJc2QdxE8bs3XmQJNLsOjIJWKb7kusyOpxMlgnrhE6nR9Dmsu251RxRCtH2vAP5zZrsQXtS1I3SC1qFkaeBBoVfP/b+xjUyGU9q/DfubAm0XDaUBXi9MQ7Iy8fuP5miHA394gOZGHTGvltZoMWHcyFfUtEposdWMNJlztaw1DGOjqWUDcc8X72l3rDNdQYDkuQa05zT/7QDa5v/UDtNBqMgDtVXGGfzR0g0U8AOST2/XV24iQ7jQwS7dKDEdL1V3tELaIcbg3U3ub8qMkMUviUDZPngS3ihYeNCXk0ttz2CQ2Oi3cB2Dwiok6Pqhbar/QcAxJkhchsQIDAQABAoIBAA9ljOljZcxv9j4C0a6ynv/Q7rDpFs9fQCkRJC7XmbCl5z0tncZxmWhjuWT/ExuesV/DUDEWZfzW3vaapbwKKGnZ8Pp4JzcvHjbq4ZFK1zJHixR6BDCJanjj9e422icK3V4Oq5oIst9ie8xbmxCX0tPrOkVzkY2aMk9FKllTxDR0rlmzCG33GJICS5/NvnPJCyxjHQYk1eP74Rk9TgtH3/D5/fMsNtDQyrVPGsx2velpEXuffHbDMsstnp3Zi5ik+iecEbBEAiezjUzNn/KdDXph7QYqKCkvjZB4T2eAUmFfVeIDshaEkQda8v7WVqRX0ZzhFK8orAC6+uN/uomjSw0CgYEAwbJSVsj0GD7xrdM+wXblcVx+wSrMPZOxE7LsRpYfws9NI/vZ4v/SHc/PRxSsVD96UPQLS+sqg+6bsqxO/wckR6MID6AcANuVv1wyi6ixjywCsJK20J+rFd7LHL8F2F9QSZDxEmRFN4oG/5OCnJUfvNpDCUYr3uIPLAydbGg0SaMCgYEAuUAlHKkn+iE72Hz/kk9cHXvDcoYf1uvneVuRXCtJf5E9QvCWGKtVuRaicYg6SJxvHCyC8MBt3zIlnzPpwZ42v36bxBnSYG3ThbRpXIqL0+DMnUfXnmA+qRhYG3GDut7lk7ooaGIL2anBGW2MAjjzSlnxtw+NaFI/XCXkNlYYBJsCgYAQJKKEJR9i3ewahp6WVShuOD1AMCbxgtuhPqo+f8iJ3ekZ9KWGK7gBUA6AaBKsutWg5ZYDb8gNUtebHo0+6AN4DPhhBQEQeTyTxEVaKmcR/aMDwFaIMKZ7niPjc3AzRk5Us0XEOKMkK9bFei/KiQsqHC62GSkS3FhTXYHJRS4GbQKBgGFwCtUraBqZdmflP2wOj+32FhRb1c1u4Z6kei2Xmx4dH7Lg5qHtJLao4CKFO9rLZWnVQ74sCN53+u/lF1O+yx8oEfgweMY9nh9aiHyjZu639AfaLOBh0TOR2W395ALbkLeGGBDnWUJQln+wbg8RM25tJsVZydAQSsFGMOYfnJx3AoGAWjslmcByDK98AbD5144+Y+jmphNOEmh1gDfB2uiNErquw/WZdQAQK7xCuUf2wXgL+UiaifpWdNcEllHANPHzotplu3TzMAe+5/L0Fm85g+1JYSb1S3kV8QBS2YkyuHddBizf7UE3wuOZu+Oi6naiUk6u9BRWps6hogW45unNi1U=
e3eaf2b1-d6e7-4640-b8c4-c520f117be82	3eba4e1c-3eb0-4966-b545-daba2bf4b91d	algorithm	RSA-OAEP
2dce9733-a252-4144-a0a2-52e9c467ddef	3eba4e1c-3eb0-4966-b545-daba2bf4b91d	certificate	MIICmzCCAYMCBgGdND5F+jANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwMzI4MTEzODA5WhcNMzYwMzI4MTEzOTQ5WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCMKmYpwk8m2+4lzZB3ETxuzdeZAk0uw6MglYpvuS6zI6nEyWCeuETqdH0Oay7bnVHFEK0fa8A/nNmuxBe1LUjdILWoWRp4EGhV8/9v7GNTIZT2r8N+5sCbRcNpQFeL0xDsjLx+4/maIcDf3iA5kYdMa+W1mgxYdzIV9S0Smix1Yw0mXO1rDUMY6OpZQNxzxfvaXesM11BgOS5BrTnNP/tANrm/9QO00GoyAO1VcYZ/NHSDRTwA5JPb9dXbiJDuNDBLt0oMR0vVXe0QtohxuDdTe5vyoyQxS+JQNk+eBLeKFh40JeTS23PYJDY6LdwHYPCKiTo+qFtqv9BwDEmSFyGxAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAAIcJijEaogLpM3Hz7s4OHE2kwDzIXUwlDyFfG9/6wReuAHTBrvaKI7YJFOZPQpknU/vszb0C5VJl6gkmhlyPffDF/qiqPuMA8L/gxhRqWK4YB0utrB9lGOxlr/EaluMg2+Tn8YG92LZFWLvAqwhxJ53pm65kBpreEIgtDRZDo9tq4i7AnjxF1t2RePI6ji6T435fQRHdNuOAbpUHsdPc8PajAux4gmdIJQgiU9jzXe+gdcLR/s85qF+xC+zlurRldqh3Nn3pkcv82bSOxxR7zeTaxj/KvhFdfYVFliN8hNzO5c+a461MOw9o3/DJhz+2Qe7XFqRe4bzZpB16LyWXhU=
622877d3-42c1-426f-9299-39624bd19908	74192d6b-0393-4416-9b8c-d42f820d4c89	algorithm	HS512
70e048a0-b327-443d-9f41-16fd2e523d9c	74192d6b-0393-4416-9b8c-d42f820d4c89	priority	100
217105ba-c629-45f5-8293-fcbc2c87b66a	74192d6b-0393-4416-9b8c-d42f820d4c89	secret	rQZVtc6TOVy5sCUOGjS_1g_zbwZ_PPDxLzQBrSwMNf9xzqW33dhy9htuZYH1FYagimV4EXOVGyB1lABh9R8UrSayfq6-BmLFvZwCXmhpHAJa4vvRM-taQGToQ51_ZcsZ9JmVKuFyj6JTV7V9HbbSiMNUYof9XAd45OPJHPl9ij0
930c06c9-968e-446d-97b6-d886e912b894	74192d6b-0393-4416-9b8c-d42f820d4c89	kid	77e62b14-9f29-44c6-aed8-45010fbf3585
abc5e4a4-3cb8-4b4e-aadd-7279bc414c13	10103c3b-edd9-4699-b905-2f7aa1789464	secret	XPtDu7ZlBBOFQF7UC2EYVA
66a44f29-3d87-4c00-aa7a-fd1a8c8c98b7	10103c3b-edd9-4699-b905-2f7aa1789464	kid	060c08aa-81bb-4ac3-8e23-5399909fb19c
98f2cbd6-dcd3-4fc8-bf0b-4bf93350bf47	10103c3b-edd9-4699-b905-2f7aa1789464	priority	100
\.


--
-- Data for Name: composite_role; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.composite_role (composite, child_role) FROM stdin;
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	861c68ca-700d-4445-b2e8-3c9e8fd76627
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	6cad5796-6f98-41c6-8c98-2d8bece4cbc8
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	a7d1c647-d7fe-4ba3-970d-1e6ced10f4fa
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	2f6bd83f-f32a-40f5-b02f-d8b7226b874d
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	00073dca-0d01-492d-858f-d1ef2153ce20
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	4a7bb0ed-221f-4d4b-870e-ee4c95a30aad
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	46d1f4d2-1e01-47c2-a33a-0102714c7ac5
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	cc4a6e5b-01f5-4c79-810a-324c609660f4
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	0265577b-c396-4176-a6c4-986d1b84eaef
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	9b2bfce7-27d1-43ba-9040-38a81cfbe1b3
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	82114250-771f-42c5-bdbf-0c6883fff6e7
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	84c661af-5549-4191-8bb2-cfec04d83915
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	994173e5-13a8-48c8-8fcc-c75a3ed15132
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	239b2e8e-366f-4978-b42f-f9ed41400b78
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	261390f0-132b-4d58-ac8d-457683f3387e
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	2872d6f8-6c5f-43e4-b514-5bc446c25e35
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	d7059efc-7eba-4e75-b4af-8fde57076b22
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	ace0175f-60cd-433b-9ec5-79c077baa803
00073dca-0d01-492d-858f-d1ef2153ce20	2872d6f8-6c5f-43e4-b514-5bc446c25e35
2f6bd83f-f32a-40f5-b02f-d8b7226b874d	ace0175f-60cd-433b-9ec5-79c077baa803
2f6bd83f-f32a-40f5-b02f-d8b7226b874d	261390f0-132b-4d58-ac8d-457683f3387e
7e91728b-b670-49f9-b0b5-6ab3f77565af	5420c3ae-3a07-49c4-a199-3d94e72a671b
7e91728b-b670-49f9-b0b5-6ab3f77565af	7c3fd51d-cfa1-4f4a-8f89-706ea2cf0730
7c3fd51d-cfa1-4f4a-8f89-706ea2cf0730	06f65eba-8423-4f3e-8d74-474859ca7112
ff0edf60-4c8d-4c35-b06a-f1489c333ee9	9ef80858-c856-4458-bab9-49f77773d3b9
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	4479614b-fc41-45a8-a9a2-cae0be2ccde6
7e91728b-b670-49f9-b0b5-6ab3f77565af	98ec35c8-5c18-4698-8786-3a85f525520e
7e91728b-b670-49f9-b0b5-6ab3f77565af	c84a407a-5a1d-4445-a861-8bb4c7537990
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority) FROM stdin;
aaa69e24-4a29-4d82-90a6-186159031d26	\N	password	47bce160-7c70-4bea-a7fc-dd5af40a12ea	1774697990143	\N	{"value":"74pMxAJO/8q1FnfuEcjuZFvrVd5zWM3r8XB+vSMZeYk=","salt":"vJ05NWtcTuSWDvxJXmm5jw==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
15dca3ea-2d9b-4ae5-8905-5c141aa71334	\N	password	5b4cef9d-9c27-497e-981c-0791505cd7aa	1774698097941	\N	{"value":"Ub93ZUs71HZOOOT8TaWKSaFon2u2cRtYZGjtZ2B9ZO8=","salt":"EApbjPpGYAYO2UtW3aaPzQ==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
4a5b1467-63d2-49e3-accc-d7f913aeeb83	\N	password	79d3cc1c-1257-4b94-8b39-10ee509cfb9e	1774699673989	\N	{"value":"EtlYJUbAFelRRRRh+QX3bSKq0eqQrpTo5UFNA1ADOtg=","salt":"bmvQ2n0NZiuHIogqIAM7Ng==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
4739754a-3711-444a-bbf5-3448e6ecb02e	\N	password	2c148802-ea59-4034-9b44-a6b8c1dbaefb	1774769683893	\N	{"value":"nbD1tYtl6r+n/4m9BicG7qgRQ411h2VpMvm6yrKVSPI=","salt":"n0Y2A04Cq4BRz/7kwTK/0Q==","additionalParameters":{}}	{"hashIterations":5,"algorithm":"argon2","additionalParameters":{"hashLength":["32"],"memory":["7168"],"type":["id"],"version":["1.3"],"parallelism":["1"]}}	10
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2026-03-28 11:39:31.758267	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.29.1	\N	\N	4697970585
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2026-03-28 11:39:31.788604	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.29.1	\N	\N	4697970585
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2026-03-28 11:39:31.901778	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.29.1	\N	\N	4697970585
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2026-03-28 11:39:31.912648	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	4697970585
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2026-03-28 11:39:32.150142	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.29.1	\N	\N	4697970585
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2026-03-28 11:39:32.162769	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.29.1	\N	\N	4697970585
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2026-03-28 11:39:32.416904	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.29.1	\N	\N	4697970585
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2026-03-28 11:39:32.428573	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.29.1	\N	\N	4697970585
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2026-03-28 11:39:32.441889	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.29.1	\N	\N	4697970585
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2026-03-28 11:39:32.661849	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.29.1	\N	\N	4697970585
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2026-03-28 11:39:32.774005	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	4697970585
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2026-03-28 11:39:32.786834	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	4697970585
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2026-03-28 11:39:32.838311	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.29.1	\N	\N	4697970585
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-28 11:39:32.889075	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.29.1	\N	\N	4697970585
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-28 11:39:32.892832	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-28 11:39:32.898444	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.29.1	\N	\N	4697970585
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-03-28 11:39:32.904324	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.29.1	\N	\N	4697970585
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2026-03-28 11:39:33.018951	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.29.1	\N	\N	4697970585
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2026-03-28 11:39:33.14091	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.29.1	\N	\N	4697970585
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2026-03-28 11:39:33.153165	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.29.1	\N	\N	4697970585
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2026-03-28 11:39:33.163662	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.29.1	\N	\N	4697970585
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2026-03-28 11:39:33.194058	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.29.1	\N	\N	4697970585
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2026-03-28 11:39:33.455534	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.29.1	\N	\N	4697970585
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2026-03-28 11:39:33.468811	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.29.1	\N	\N	4697970585
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2026-03-28 11:39:33.472361	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.29.1	\N	\N	4697970585
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2026-03-28 11:39:34.272438	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.29.1	\N	\N	4697970585
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2026-03-28 11:39:34.42883	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.29.1	\N	\N	4697970585
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2026-03-28 11:39:34.439508	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.29.1	\N	\N	4697970585
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2026-03-28 11:39:34.585742	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.29.1	\N	\N	4697970585
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2026-03-28 11:39:34.613749	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.29.1	\N	\N	4697970585
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2026-03-28 11:39:34.65137	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.29.1	\N	\N	4697970585
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2026-03-28 11:39:34.661078	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.29.1	\N	\N	4697970585
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-28 11:39:34.673966	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-28 11:39:34.678926	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.29.1	\N	\N	4697970585
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-28 11:39:34.740899	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.29.1	\N	\N	4697970585
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2026-03-28 11:39:34.750949	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.29.1	\N	\N	4697970585
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-03-28 11:39:34.764055	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	4697970585
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2026-03-28 11:39:34.772261	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.29.1	\N	\N	4697970585
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2026-03-28 11:39:34.780137	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.29.1	\N	\N	4697970585
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-28 11:39:34.783217	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.29.1	\N	\N	4697970585
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-28 11:39:34.787732	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.29.1	\N	\N	4697970585
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2026-03-28 11:39:34.796596	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.29.1	\N	\N	4697970585
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-03-28 11:39:37.654867	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.29.1	\N	\N	4697970585
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2026-03-28 11:39:37.664881	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.29.1	\N	\N	4697970585
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-28 11:39:37.675679	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.29.1	\N	\N	4697970585
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-28 11:39:37.684804	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.29.1	\N	\N	4697970585
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-28 11:39:37.688372	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.29.1	\N	\N	4697970585
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-28 11:39:37.923036	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.29.1	\N	\N	4697970585
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-03-28 11:39:37.931314	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.29.1	\N	\N	4697970585
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2026-03-28 11:39:38.039271	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.29.1	\N	\N	4697970585
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2026-03-28 11:39:38.734691	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.29.1	\N	\N	4697970585
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2026-03-28 11:39:38.742023	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2026-03-28 11:39:38.748182	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.29.1	\N	\N	4697970585
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2026-03-28 11:39:38.754161	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.29.1	\N	\N	4697970585
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-28 11:39:38.76871	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.29.1	\N	\N	4697970585
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-28 11:39:38.786695	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.29.1	\N	\N	4697970585
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-28 11:39:38.879543	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.29.1	\N	\N	4697970585
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-03-28 11:39:39.886599	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.29.1	\N	\N	4697970585
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2026-03-28 11:39:39.953767	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.29.1	\N	\N	4697970585
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2026-03-28 11:39:39.965389	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.29.1	\N	\N	4697970585
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-03-28 11:39:39.981779	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.29.1	\N	\N	4697970585
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-03-28 11:39:39.995476	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.29.1	\N	\N	4697970585
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2026-03-28 11:39:40.003623	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.29.1	\N	\N	4697970585
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2026-03-28 11:39:40.009757	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.29.1	\N	\N	4697970585
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2026-03-28 11:39:40.015673	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.29.1	\N	\N	4697970585
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2026-03-28 11:39:40.113024	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.29.1	\N	\N	4697970585
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2026-03-28 11:39:40.191872	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.29.1	\N	\N	4697970585
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2026-03-28 11:39:40.202456	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.29.1	\N	\N	4697970585
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2026-03-28 11:39:40.289625	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.29.1	\N	\N	4697970585
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2026-03-28 11:39:40.302778	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.29.1	\N	\N	4697970585
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2026-03-28 11:39:40.312556	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.29.1	\N	\N	4697970585
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-28 11:39:40.329474	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	4697970585
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-28 11:39:40.344254	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	4697970585
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-28 11:39:40.349534	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.29.1	\N	\N	4697970585
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-28 11:39:40.410072	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.29.1	\N	\N	4697970585
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-03-28 11:39:40.494342	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.29.1	\N	\N	4697970585
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-28 11:39:40.504609	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.29.1	\N	\N	4697970585
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-28 11:39:40.50814	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.29.1	\N	\N	4697970585
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-28 11:39:40.579679	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.29.1	\N	\N	4697970585
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-03-28 11:39:40.585689	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.29.1	\N	\N	4697970585
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-28 11:39:40.682767	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.29.1	\N	\N	4697970585
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-28 11:39:40.686289	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	4697970585
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-28 11:39:40.695391	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	4697970585
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-28 11:39:40.698783	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.29.1	\N	\N	4697970585
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-03-28 11:39:40.757146	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	4697970585
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2026-03-28 11:39:40.769908	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.29.1	\N	\N	4697970585
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-03-28 11:39:40.788855	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.29.1	\N	\N	4697970585
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-03-28 11:39:40.814584	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.29.1	\N	\N	4697970585
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:40.826852	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.29.1	\N	\N	4697970585
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:40.851582	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.29.1	\N	\N	4697970585
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.191352	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.218807	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.29.1	\N	\N	4697970585
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.222023	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.29.1	\N	\N	4697970585
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.243562	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.29.1	\N	\N	4697970585
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.247392	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.29.1	\N	\N	4697970585
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-03-28 11:39:41.258618	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.29.1	\N	\N	4697970585
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:41.438734	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:41.442375	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:41.461526	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:41.71697	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:41.777993	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:42.092612	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.29.1	\N	\N	4697970585
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-03-28 11:39:42.113406	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.29.1	\N	\N	4697970585
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2026-03-28 11:39:42.126406	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.29.1	\N	\N	4697970585
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2026-03-28 11:39:42.191742	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.29.1	\N	\N	4697970585
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2026-03-28 11:39:42.25536	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.29.1	\N	\N	4697970585
18.0.15-30992-index-consent	keycloak	META-INF/jpa-changelog-18.0.15.xml	2026-03-28 11:39:42.540293	107	EXECUTED	9:80071ede7a05604b1f4906f3bf3b00f0	createIndex indexName=IDX_USCONSENT_SCOPE_ID, tableName=USER_CONSENT_CLIENT_SCOPE		\N	4.29.1	\N	\N	4697970585
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2026-03-28 11:39:42.57706	108	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.29.1	\N	\N	4697970585
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-28 11:39:42.680084	109	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.29.1	\N	\N	4697970585
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-28 11:39:42.683987	110	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.29.1	\N	\N	4697970585
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-03-28 11:39:42.696514	111	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2026-03-28 11:39:42.703924	112	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.29.1	\N	\N	4697970585
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-03-28 11:39:42.762661	113	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.29.1	\N	\N	4697970585
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-03-28 11:39:42.76793	114	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.29.1	\N	\N	4697970585
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-03-28 11:39:42.777133	115	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.29.1	\N	\N	4697970585
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-03-28 11:39:42.78044	116	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.29.1	\N	\N	4697970585
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-03-28 11:39:42.791746	117	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.29.1	\N	\N	4697970585
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-03-28 11:39:42.799609	118	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.29.1	\N	\N	4697970585
24.0.0-9758	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-28 11:39:43.031514	119	EXECUTED	9:502c557a5189f600f0f445a9b49ebbce	addColumn tableName=USER_ATTRIBUTE; addColumn tableName=FED_USER_ATTRIBUTE; createIndex indexName=USER_ATTR_LONG_VALUES, tableName=USER_ATTRIBUTE; createIndex indexName=FED_USER_ATTR_LONG_VALUES, tableName=FED_USER_ATTRIBUTE; createIndex indexName...		\N	4.29.1	\N	\N	4697970585
24.0.0-9758-2	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-28 11:39:43.03963	120	EXECUTED	9:bf0fdee10afdf597a987adbf291db7b2	customChange		\N	4.29.1	\N	\N	4697970585
24.0.0-26618-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-28 11:39:43.049204	121	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
24.0.0-26618-reindex	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-03-28 11:39:43.119927	122	EXECUTED	9:08707c0f0db1cef6b352db03a60edc7f	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
24.0.2-27228	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-28 11:39:43.127537	123	EXECUTED	9:eaee11f6b8aa25d2cc6a84fb86fc6238	customChange		\N	4.29.1	\N	\N	4697970585
24.0.2-27967-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-28 11:39:43.13031	124	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
24.0.2-27967-reindex	keycloak	META-INF/jpa-changelog-24.0.2.xml	2026-03-28 11:39:43.134436	125	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-tables	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.145249	126	EXECUTED	9:deda2df035df23388af95bbd36c17cef	addColumn tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.208526	127	EXECUTED	9:3e96709818458ae49f3c679ae58d263a	createIndex indexName=IDX_OFFLINE_USS_BY_LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-cleanup-uss-createdon	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.38542	128	EXECUTED	9:78ab4fc129ed5e8265dbcc3485fba92f	dropIndex indexName=IDX_OFFLINE_USS_CREATEDON, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-cleanup-uss-preload	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.679527	129	EXECUTED	9:de5f7c1f7e10994ed8b62e621d20eaab	dropIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-cleanup-uss-by-usersess	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.798712	130	EXECUTED	9:6eee220d024e38e89c799417ec33667f	dropIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-cleanup-css-preload	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:43.926639	131	EXECUTED	9:5411d2fb2891d3e8d63ddb55dfa3c0c9	dropIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-2-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.068902	132	MARK_RAN	9:b7ef76036d3126bb83c2423bf4d449d6	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-28265-index-2-not-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.324762	133	EXECUTED	9:23396cf51ab8bc1ae6f0cac7f9f6fcf7	createIndex indexName=IDX_OFFLINE_USS_BY_BROKER_SESSION_ID, tableName=OFFLINE_USER_SESSION		\N	4.29.1	\N	\N	4697970585
25.0.0-org	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.380051	134	EXECUTED	9:5c859965c2c9b9c72136c360649af157	createTable tableName=ORG; addUniqueConstraint constraintName=UK_ORG_NAME, tableName=ORG; addUniqueConstraint constraintName=UK_ORG_GROUP, tableName=ORG; createTable tableName=ORG_DOMAIN		\N	4.29.1	\N	\N	4697970585
unique-consentuser	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.406642	135	EXECUTED	9:5857626a2ea8767e9a6c66bf3a2cb32f	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.29.1	\N	\N	4697970585
unique-consentuser-mysql	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.410606	136	MARK_RAN	9:b79478aad5adaa1bc428e31563f55e8e	customChange; dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_LOCAL_CONSENT, tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_EXTERNAL_CONSENT, tableName=...		\N	4.29.1	\N	\N	4697970585
25.0.0-28861-index-creation	keycloak	META-INF/jpa-changelog-25.0.0.xml	2026-03-28 11:39:44.536467	137	EXECUTED	9:b9acb58ac958d9ada0fe12a5d4794ab1	createIndex indexName=IDX_PERM_TICKET_REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; createIndex indexName=IDX_PERM_TICKET_OWNER, tableName=RESOURCE_SERVER_PERM_TICKET		\N	4.29.1	\N	\N	4697970585
26.0.0-org-alias	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.553463	138	EXECUTED	9:6ef7d63e4412b3c2d66ed179159886a4	addColumn tableName=ORG; update tableName=ORG; addNotNullConstraint columnName=ALIAS, tableName=ORG; addUniqueConstraint constraintName=UK_ORG_ALIAS, tableName=ORG		\N	4.29.1	\N	\N	4697970585
26.0.0-org-group	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.566402	139	EXECUTED	9:da8e8087d80ef2ace4f89d8c5b9ca223	addColumn tableName=KEYCLOAK_GROUP; update tableName=KEYCLOAK_GROUP; addNotNullConstraint columnName=TYPE, tableName=KEYCLOAK_GROUP; customChange		\N	4.29.1	\N	\N	4697970585
26.0.0-org-indexes	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.62724	140	EXECUTED	9:79b05dcd610a8c7f25ec05135eec0857	createIndex indexName=IDX_ORG_DOMAIN_ORG_ID, tableName=ORG_DOMAIN		\N	4.29.1	\N	\N	4697970585
26.0.0-org-group-membership	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.637874	141	EXECUTED	9:a6ace2ce583a421d89b01ba2a28dc2d4	addColumn tableName=USER_GROUP_MEMBERSHIP; update tableName=USER_GROUP_MEMBERSHIP; addNotNullConstraint columnName=MEMBERSHIP_TYPE, tableName=USER_GROUP_MEMBERSHIP		\N	4.29.1	\N	\N	4697970585
31296-persist-revoked-access-tokens	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.6529	142	EXECUTED	9:64ef94489d42a358e8304b0e245f0ed4	createTable tableName=REVOKED_TOKEN; addPrimaryKey constraintName=CONSTRAINT_RT, tableName=REVOKED_TOKEN		\N	4.29.1	\N	\N	4697970585
31725-index-persist-revoked-access-tokens	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.717475	143	EXECUTED	9:b994246ec2bf7c94da881e1d28782c7b	createIndex indexName=IDX_REV_TOKEN_ON_EXPIRE, tableName=REVOKED_TOKEN		\N	4.29.1	\N	\N	4697970585
26.0.0-idps-for-login	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:44.96375	144	EXECUTED	9:51f5fffadf986983d4bd59582c6c1604	addColumn tableName=IDENTITY_PROVIDER; createIndex indexName=IDX_IDP_REALM_ORG, tableName=IDENTITY_PROVIDER; createIndex indexName=IDX_IDP_FOR_LOGIN, tableName=IDENTITY_PROVIDER; customChange		\N	4.29.1	\N	\N	4697970585
26.0.0-32583-drop-redundant-index-on-client-session	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:45.048681	145	EXECUTED	9:24972d83bf27317a055d234187bb4af9	dropIndex indexName=IDX_US_SESS_ID_ON_CL_SESS, tableName=OFFLINE_CLIENT_SESSION		\N	4.29.1	\N	\N	4697970585
26.0.0.32582-remove-tables-user-session-user-session-note-and-client-session	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:45.086262	146	EXECUTED	9:febdc0f47f2ed241c59e60f58c3ceea5	dropTable tableName=CLIENT_SESSION_ROLE; dropTable tableName=CLIENT_SESSION_NOTE; dropTable tableName=CLIENT_SESSION_PROT_MAPPER; dropTable tableName=CLIENT_SESSION_AUTH_STATUS; dropTable tableName=CLIENT_USER_SESSION_NOTE; dropTable tableName=CLI...		\N	4.29.1	\N	\N	4697970585
26.0.0-33201-org-redirect-url	keycloak	META-INF/jpa-changelog-26.0.0.xml	2026-03-28 11:39:45.092292	147	EXECUTED	9:4d0e22b0ac68ebe9794fa9cb752ea660	addColumn tableName=ORG		\N	4.29.1	\N	\N	4697970585
26.0.6-34013	keycloak	META-INF/jpa-changelog-26.0.6.xml	2026-03-28 11:39:45.103835	148	EXECUTED	9:e6b686a15759aef99a6d758a5c4c6a26	addColumn tableName=ADMIN_EVENT_ENTITY		\N	4.29.1	\N	\N	4697970585
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
1000	f	\N	\N
\.


--
-- Data for Name: default_client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.default_client_scope (realm_id, scope_id, default_scope) FROM stdin;
c7e460e9-8d41-4072-a515-5a9959b79e9d	0b38d136-7bfb-484d-870d-d5f023e0cf7b	f
c7e460e9-8d41-4072-a515-5a9959b79e9d	00890085-7350-4dc6-bcf0-433efc769a25	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	9890572f-369c-485d-8d4c-606c5782f234	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	63523679-db26-4743-b414-f98380c38967	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	800b325c-f928-4884-9640-fdfc094226fc	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	b3e47d9b-d93f-4bff-b498-73c38c5a9dee	f
c7e460e9-8d41-4072-a515-5a9959b79e9d	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d	f
c7e460e9-8d41-4072-a515-5a9959b79e9d	4a706042-94dd-4cae-85d6-0c128b5c3263	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	fa1ac8de-3333-408a-add1-bb2aca265495	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	e0a238c1-cabc-4790-92c3-037c578f9631	f
c7e460e9-8d41-4072-a515-5a9959b79e9d	0f127a4e-78a5-4272-a44a-2c822385277d	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	c8a3d54e-3416-47ea-a5ee-64863acb4cb7	t
c7e460e9-8d41-4072-a515-5a9959b79e9d	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73	f
\.


--
-- Data for Name: event_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.event_entity (id, client_id, details_json, error, ip_address, realm_id, session_id, event_time, type, user_id, details_json_long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_attribute (id, name, user_id, realm_id, storage_provider_id, value, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_consent; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_consent (id, client_id, user_id, realm_id, storage_provider_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: fed_user_consent_cl_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_consent_cl_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: fed_user_credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_credential (id, salt, type, created_date, user_id, realm_id, storage_provider_id, user_label, secret_data, credential_data, priority) FROM stdin;
\.


--
-- Data for Name: fed_user_group_membership; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_group_membership (group_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_required_action; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_required_action (required_action, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.fed_user_role_mapping (role_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: federated_identity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.federated_identity (identity_provider, realm_id, federated_user_id, federated_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: federated_user; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.federated_user (id, storage_provider_id, realm_id) FROM stdin;
\.


--
-- Data for Name: group_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.group_attribute (id, name, value, group_id) FROM stdin;
\.


--
-- Data for Name: group_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.group_role_mapping (role_id, group_id) FROM stdin;
\.


--
-- Data for Name: identity_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider (internal_id, enabled, provider_alias, provider_id, store_token, authenticate_by_default, realm_id, add_token_role, trust_email, first_broker_login_flow_id, post_broker_login_flow_id, provider_display_name, link_only, organization_id, hide_on_login) FROM stdin;
\.


--
-- Data for Name: identity_provider_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider_config (identity_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: identity_provider_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.identity_provider_mapper (id, name, idp_alias, idp_mapper_name, realm_id) FROM stdin;
\.


--
-- Data for Name: idp_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.idp_mapper_config (idp_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: keycloak_group; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.keycloak_group (id, name, parent_group, realm_id, type) FROM stdin;
\.


--
-- Data for Name: keycloak_role; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.keycloak_role (id, client_realm_constraint, client_role, description, name, realm_id, client, realm) FROM stdin;
7e91728b-b670-49f9-b0b5-6ab3f77565af	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	${role_default-roles}	default-roles-master	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
861c68ca-700d-4445-b2e8-3c9e8fd76627	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	${role_create-realm}	create-realm	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	${role_admin}	admin	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
6cad5796-6f98-41c6-8c98-2d8bece4cbc8	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_create-client}	create-client	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
a7d1c647-d7fe-4ba3-970d-1e6ced10f4fa	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-realm}	view-realm	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
2f6bd83f-f32a-40f5-b02f-d8b7226b874d	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-users}	view-users	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
00073dca-0d01-492d-858f-d1ef2153ce20	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-clients}	view-clients	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
4a7bb0ed-221f-4d4b-870e-ee4c95a30aad	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-events}	view-events	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
46d1f4d2-1e01-47c2-a33a-0102714c7ac5	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-identity-providers}	view-identity-providers	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
cc4a6e5b-01f5-4c79-810a-324c609660f4	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_view-authorization}	view-authorization	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
0265577b-c396-4176-a6c4-986d1b84eaef	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-realm}	manage-realm	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
9b2bfce7-27d1-43ba-9040-38a81cfbe1b3	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-users}	manage-users	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
82114250-771f-42c5-bdbf-0c6883fff6e7	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-clients}	manage-clients	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
84c661af-5549-4191-8bb2-cfec04d83915	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-events}	manage-events	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
994173e5-13a8-48c8-8fcc-c75a3ed15132	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-identity-providers}	manage-identity-providers	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
239b2e8e-366f-4978-b42f-f9ed41400b78	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_manage-authorization}	manage-authorization	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
261390f0-132b-4d58-ac8d-457683f3387e	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_query-users}	query-users	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
2872d6f8-6c5f-43e4-b514-5bc446c25e35	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_query-clients}	query-clients	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
d7059efc-7eba-4e75-b4af-8fde57076b22	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_query-realms}	query-realms	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
ace0175f-60cd-433b-9ec5-79c077baa803	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_query-groups}	query-groups	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
5420c3ae-3a07-49c4-a199-3d94e72a671b	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_view-profile}	view-profile	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
7c3fd51d-cfa1-4f4a-8f89-706ea2cf0730	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_manage-account}	manage-account	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
06f65eba-8423-4f3e-8d74-474859ca7112	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_manage-account-links}	manage-account-links	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
e533efa4-383c-40d1-a7cf-7d8c4c70f654	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_view-applications}	view-applications	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
9ef80858-c856-4458-bab9-49f77773d3b9	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_view-consent}	view-consent	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
ff0edf60-4c8d-4c35-b06a-f1489c333ee9	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_manage-consent}	manage-consent	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
644e80c6-0c63-4ff4-9810-9c46d14119dc	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_view-groups}	view-groups	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
4a90cdad-5180-452d-acae-399893252f37	386311a8-d22a-4642-9e53-58134b2473d7	t	${role_delete-account}	delete-account	c7e460e9-8d41-4072-a515-5a9959b79e9d	386311a8-d22a-4642-9e53-58134b2473d7	\N
3c3dc305-59fc-49c1-962d-70394dea5fca	563a14f1-2f0c-4005-932e-53e274bc3503	t	${role_read-token}	read-token	c7e460e9-8d41-4072-a515-5a9959b79e9d	563a14f1-2f0c-4005-932e-53e274bc3503	\N
4479614b-fc41-45a8-a9a2-cae0be2ccde6	f9f99755-4d34-413d-821f-4bfa12568790	t	${role_impersonation}	impersonation	c7e460e9-8d41-4072-a515-5a9959b79e9d	f9f99755-4d34-413d-821f-4bfa12568790	\N
98ec35c8-5c18-4698-8786-3a85f525520e	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	${role_offline-access}	offline_access	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
c84a407a-5a1d-4445-a861-8bb4c7537990	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	${role_uma_authorization}	uma_authorization	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
55135976-afeb-4d24-9f40-de4594559cfb	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	SUPER ADMIN role for LMS	super_admin	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
7a5ce4b8-da69-4d8e-9c50-db7f91a156d5	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	HR role for LMS	hr	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
12e00df6-af3b-4f95-8c08-0fad176e9100	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	INSTRUCTOR role for LMS	instructor	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
6d3c2495-873a-4e2e-af59-22c17fbf43b5	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	STUDENT role for LMS	student	c7e460e9-8d41-4072-a515-5a9959b79e9d	\N	\N
\.


--
-- Data for Name: migration_model; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.migration_model (id, version, update_time) FROM stdin;
m2dmf	26.0.8	1774697986
\.


--
-- Data for Name: offline_client_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.offline_client_session (user_session_id, client_id, offline_flag, "timestamp", data, client_storage_provider, external_client_id, version) FROM stdin;
56e8e153-7478-4260-89b5-4d6376eeea42	d92dbca4-d86d-41fb-a310-06ae34027247	0	1774802568	{"authMethod":"openid-connect","redirectUri":"https://localhost:5174/dashboard?tab=enrollments","notes":{"clientId":"d92dbca4-d86d-41fb-a310-06ae34027247","iss":"http://localhost:8080/realms/master","startedAt":"1774791775","response_type":"code","level-of-authentication":"-1","code_challenge_method":"S256","nonce":"d25f8f56-1214-46d7-8b22-ce9cdb5a977c","response_mode":"fragment","scope":"openid","userSessionStartedAt":"1774791775","redirect_uri":"https://localhost:5174/dashboard?tab=enrollments","state":"faca0743-0933-4f50-a36c-1973a789eac3","code_challenge":"yERNV4L7yYpkM8_idsXKPkJrkI5DEbfARimTyo6UGiw","SSO_AUTH":"true"}}	local	local	190
56e8e153-7478-4260-89b5-4d6376eeea42	df49b488-e907-456b-b1af-87e59164d12d	0	1774791777	{"authMethod":"openid-connect","redirectUri":"http://localhost:8080/admin/master/console/#/master/users/5b4cef9d-9c27-497e-981c-0791505cd7aa/role-mapping","notes":{"clientId":"df49b488-e907-456b-b1af-87e59164d12d","iss":"http://localhost:8080/realms/master","startedAt":"1774791777","response_type":"code","level-of-authentication":"-1","code_challenge_method":"S256","nonce":"381584b2-5631-4964-becb-40baf2bdfe40","response_mode":"query","scope":"openid","SSO_AUTH":"true","userSessionStartedAt":"1774791775","redirect_uri":"http://localhost:8080/admin/master/console/#/master/users/5b4cef9d-9c27-497e-981c-0791505cd7aa/role-mapping","state":"8fdc078d-1b2d-452c-b6aa-e6dd6556988a","code_challenge":"_8u4JuJcJcfCOwe15xHhbNBZwWc_H8HkJ3BtFwIOsNs"}}	local	local	0
5d0b3907-380b-4a78-a443-267ecb5adac7	df49b488-e907-456b-b1af-87e59164d12d	0	1774802882	{"authMethod":"openid-connect","redirectUri":"http://localhost:8080/admin/master/console/#/master/users/5b4cef9d-9c27-497e-981c-0791505cd7aa/role-mapping","notes":{"clientId":"df49b488-e907-456b-b1af-87e59164d12d","iss":"http://localhost:8080/realms/master","startedAt":"1774802881","response_type":"code","level-of-authentication":"-1","code_challenge_method":"S256","nonce":"ee04e871-2911-4ca0-a39b-8788e52558f2","response_mode":"query","scope":"openid","SSO_AUTH":"true","userSessionStartedAt":"1774802837","redirect_uri":"http://localhost:8080/admin/master/console/#/master/users/5b4cef9d-9c27-497e-981c-0791505cd7aa/role-mapping","state":"e02caa21-47e0-4628-b070-8dd05b462f8c","code_challenge":"zo1P7p51yBJwpZ7EMXDLlq-3fpFVXlmvd33EZeblrDw"}}	local	local	1
5d0b3907-380b-4a78-a443-267ecb5adac7	d92dbca4-d86d-41fb-a310-06ae34027247	0	1774806498	{"authMethod":"openid-connect","redirectUri":"https://localhost:5174/dashboard?tab=penalty","notes":{"clientId":"d92dbca4-d86d-41fb-a310-06ae34027247","iss":"http://localhost:8080/realms/master","startedAt":"1774802838","response_type":"code","level-of-authentication":"-1","code_challenge_method":"S256","nonce":"822b9195-2ee9-43a5-b1e6-bc7b9bf49264","response_mode":"fragment","scope":"openid","userSessionStartedAt":"1774802837","redirect_uri":"https://localhost:5174/dashboard?tab=penalty","state":"add0fedb-423e-4bab-bd9f-538916eb2df7","code_challenge":"eh3goEB6huaO8X-RUvwUUJ5y56DtGIwZehgekaU1qbY","SSO_AUTH":"true"}}	local	local	67
\.


--
-- Data for Name: offline_user_session; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.offline_user_session (user_session_id, user_id, realm_id, created_on, offline_flag, data, last_session_refresh, broker_session_id, version) FROM stdin;
5d0b3907-380b-4a78-a443-267ecb5adac7	79d3cc1c-1257-4b94-8b39-10ee509cfb9e	c7e460e9-8d41-4072-a515-5a9959b79e9d	1774802837	0	{"ipAddress":"172.17.0.1","authMethod":"openid-connect","rememberMe":false,"started":0,"notes":{"KC_DEVICE_NOTE":"eyJpcEFkZHJlc3MiOiIxNzIuMTcuMC4xIiwib3MiOiJXaW5kb3dzIiwib3NWZXJzaW9uIjoiMTAiLCJicm93c2VyIjoiQ2hyb21lLzE0Ni4wLjAiLCJkZXZpY2UiOiJPdGhlciIsImxhc3RBY2Nlc3MiOjAsIm1vYmlsZSI6ZmFsc2V9","AUTH_TIME":"1774802838","authenticators-completed":"{\\"2a2fd583-27b3-49dd-b134-dcca118e3bd5\\":1774802837,\\"ff5cce48-08b9-41d7-9441-c632f5c4cf61\\":1774806373}"},"state":"LOGGED_IN"}	1774806498	\N	67
56e8e153-7478-4260-89b5-4d6376eeea42	79d3cc1c-1257-4b94-8b39-10ee509cfb9e	c7e460e9-8d41-4072-a515-5a9959b79e9d	1774791775	0	{"ipAddress":"172.17.0.1","authMethod":"openid-connect","rememberMe":false,"started":0,"notes":{"KC_DEVICE_NOTE":"eyJpcEFkZHJlc3MiOiIxNzIuMTcuMC4xIiwib3MiOiJXaW5kb3dzIiwib3NWZXJzaW9uIjoiMTAiLCJicm93c2VyIjoiQ2hyb21lLzE0Ni4wLjAiLCJkZXZpY2UiOiJPdGhlciIsImxhc3RBY2Nlc3MiOjAsIm1vYmlsZSI6ZmFsc2V9","AUTH_TIME":"1774791775","authenticators-completed":"{\\"2a2fd583-27b3-49dd-b134-dcca118e3bd5\\":1774791775,\\"ff5cce48-08b9-41d7-9441-c632f5c4cf61\\":1774797284}"},"state":"LOGGED_IN"}	1774802568	\N	191
\.


--
-- Data for Name: org; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.org (id, enabled, realm_id, group_id, name, description, alias, redirect_url) FROM stdin;
\.


--
-- Data for Name: org_domain; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.org_domain (id, name, verified, org_id) FROM stdin;
\.


--
-- Data for Name: policy_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.policy_config (policy_id, name, value) FROM stdin;
\.


--
-- Data for Name: protocol_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.protocol_mapper (id, name, protocol, protocol_mapper_name, client_id, client_scope_id) FROM stdin;
1207ec25-0757-4389-a31f-25823935ed09	audience resolve	openid-connect	oidc-audience-resolve-mapper	0582098f-d963-43ee-822c-4a3f51609dd7	\N
4b82e824-5917-4914-91fa-c4ac984f190c	locale	openid-connect	oidc-usermodel-attribute-mapper	df49b488-e907-456b-b1af-87e59164d12d	\N
c39f7554-66d6-443d-aabc-f9366554c400	role list	saml	saml-role-list-mapper	\N	00890085-7350-4dc6-bcf0-433efc769a25
7a5842d4-d44e-4330-a6c4-54b7b035ad10	organization	saml	saml-organization-membership-mapper	\N	9890572f-369c-485d-8d4c-606c5782f234
40507790-e9cf-4b0c-97d4-0c2e984e7169	full name	openid-connect	oidc-full-name-mapper	\N	63523679-db26-4743-b414-f98380c38967
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
a781fb93-184a-4271-90de-12a71e4d2f07	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
85e706ec-3744-4f7d-ba54-6c564acf049c	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
15f26efd-036b-40d6-aa43-33492a0d900c	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	username	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
474f817f-75a2-41c2-a094-df02923f45fa	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
38f02b61-11e3-4bd8-9194-8287e6fbaab1	website	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
688c9006-04a4-4004-9e09-a12d455dc751	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
6cc3b156-104d-408c-9a52-5dd428f92a6d	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	63523679-db26-4743-b414-f98380c38967
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	email	openid-connect	oidc-usermodel-attribute-mapper	\N	800b325c-f928-4884-9640-fdfc094226fc
d298fdec-356a-47b7-8c92-41cbfdad2695	email verified	openid-connect	oidc-usermodel-property-mapper	\N	800b325c-f928-4884-9640-fdfc094226fc
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	address	openid-connect	oidc-address-mapper	\N	b3e47d9b-d93f-4bff-b498-73c38c5a9dee
5028bf22-2994-4dde-b533-cd862d1a32bd	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d
e1f86832-17f9-41d6-a286-7bd567e9e9c2	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	fdc0a31c-cbbe-4933-ba54-551e1e3ee00d
8e34ed90-7b1e-4308-ba92-3c3dafd65942	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	4a706042-94dd-4cae-85d6-0c128b5c3263
de21c96f-87ec-4209-9c75-3dd121ca2321	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	4a706042-94dd-4cae-85d6-0c128b5c3263
b9e58d07-04d7-40db-a5f9-05a4019e927c	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	4a706042-94dd-4cae-85d6-0c128b5c3263
ab943199-f7a3-45be-9fbc-5c42235ceec2	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	fa1ac8de-3333-408a-add1-bb2aca265495
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	e0a238c1-cabc-4790-92c3-037c578f9631
25a02989-413f-488b-9bd6-dcb7f4fa37a0	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	e0a238c1-cabc-4790-92c3-037c578f9631
ff343f11-aed1-4541-b63a-6ff83c76eef3	acr loa level	openid-connect	oidc-acr-mapper	\N	0f127a4e-78a5-4272-a44a-2c822385277d
8d27e6fe-ab82-499c-9950-8968c58acff5	auth_time	openid-connect	oidc-usersessionmodel-note-mapper	\N	c8a3d54e-3416-47ea-a5ee-64863acb4cb7
975c7e26-8dfa-41a8-a0e4-eb27919fb9ff	sub	openid-connect	oidc-sub-mapper	\N	c8a3d54e-3416-47ea-a5ee-64863acb4cb7
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	organization	openid-connect	oidc-organization-membership-mapper	\N	0f4b1f0e-84ba-418a-b68e-5ddd51fc1f73
\.


--
-- Data for Name: protocol_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.protocol_mapper_config (protocol_mapper_id, value, name) FROM stdin;
4b82e824-5917-4914-91fa-c4ac984f190c	true	introspection.token.claim
4b82e824-5917-4914-91fa-c4ac984f190c	true	userinfo.token.claim
4b82e824-5917-4914-91fa-c4ac984f190c	locale	user.attribute
4b82e824-5917-4914-91fa-c4ac984f190c	true	id.token.claim
4b82e824-5917-4914-91fa-c4ac984f190c	true	access.token.claim
4b82e824-5917-4914-91fa-c4ac984f190c	locale	claim.name
4b82e824-5917-4914-91fa-c4ac984f190c	String	jsonType.label
c39f7554-66d6-443d-aabc-f9366554c400	false	single
c39f7554-66d6-443d-aabc-f9366554c400	Basic	attribute.nameformat
c39f7554-66d6-443d-aabc-f9366554c400	Role	attribute.name
15f26efd-036b-40d6-aa43-33492a0d900c	true	introspection.token.claim
15f26efd-036b-40d6-aa43-33492a0d900c	true	userinfo.token.claim
15f26efd-036b-40d6-aa43-33492a0d900c	nickname	user.attribute
15f26efd-036b-40d6-aa43-33492a0d900c	true	id.token.claim
15f26efd-036b-40d6-aa43-33492a0d900c	true	access.token.claim
15f26efd-036b-40d6-aa43-33492a0d900c	nickname	claim.name
15f26efd-036b-40d6-aa43-33492a0d900c	String	jsonType.label
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	true	introspection.token.claim
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	true	userinfo.token.claim
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	picture	user.attribute
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	true	id.token.claim
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	true	access.token.claim
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	picture	claim.name
2d8a1e27-61ce-4099-b6c8-6580d419d7ff	String	jsonType.label
38f02b61-11e3-4bd8-9194-8287e6fbaab1	true	introspection.token.claim
38f02b61-11e3-4bd8-9194-8287e6fbaab1	true	userinfo.token.claim
38f02b61-11e3-4bd8-9194-8287e6fbaab1	website	user.attribute
38f02b61-11e3-4bd8-9194-8287e6fbaab1	true	id.token.claim
38f02b61-11e3-4bd8-9194-8287e6fbaab1	true	access.token.claim
38f02b61-11e3-4bd8-9194-8287e6fbaab1	website	claim.name
38f02b61-11e3-4bd8-9194-8287e6fbaab1	String	jsonType.label
40507790-e9cf-4b0c-97d4-0c2e984e7169	true	introspection.token.claim
40507790-e9cf-4b0c-97d4-0c2e984e7169	true	userinfo.token.claim
40507790-e9cf-4b0c-97d4-0c2e984e7169	true	id.token.claim
40507790-e9cf-4b0c-97d4-0c2e984e7169	true	access.token.claim
474f817f-75a2-41c2-a094-df02923f45fa	true	introspection.token.claim
474f817f-75a2-41c2-a094-df02923f45fa	true	userinfo.token.claim
474f817f-75a2-41c2-a094-df02923f45fa	profile	user.attribute
474f817f-75a2-41c2-a094-df02923f45fa	true	id.token.claim
474f817f-75a2-41c2-a094-df02923f45fa	true	access.token.claim
474f817f-75a2-41c2-a094-df02923f45fa	profile	claim.name
474f817f-75a2-41c2-a094-df02923f45fa	String	jsonType.label
688c9006-04a4-4004-9e09-a12d455dc751	true	introspection.token.claim
688c9006-04a4-4004-9e09-a12d455dc751	true	userinfo.token.claim
688c9006-04a4-4004-9e09-a12d455dc751	gender	user.attribute
688c9006-04a4-4004-9e09-a12d455dc751	true	id.token.claim
688c9006-04a4-4004-9e09-a12d455dc751	true	access.token.claim
688c9006-04a4-4004-9e09-a12d455dc751	gender	claim.name
688c9006-04a4-4004-9e09-a12d455dc751	String	jsonType.label
6cc3b156-104d-408c-9a52-5dd428f92a6d	true	introspection.token.claim
6cc3b156-104d-408c-9a52-5dd428f92a6d	true	userinfo.token.claim
6cc3b156-104d-408c-9a52-5dd428f92a6d	zoneinfo	user.attribute
6cc3b156-104d-408c-9a52-5dd428f92a6d	true	id.token.claim
6cc3b156-104d-408c-9a52-5dd428f92a6d	true	access.token.claim
6cc3b156-104d-408c-9a52-5dd428f92a6d	zoneinfo	claim.name
6cc3b156-104d-408c-9a52-5dd428f92a6d	String	jsonType.label
85e706ec-3744-4f7d-ba54-6c564acf049c	true	introspection.token.claim
85e706ec-3744-4f7d-ba54-6c564acf049c	true	userinfo.token.claim
85e706ec-3744-4f7d-ba54-6c564acf049c	middleName	user.attribute
85e706ec-3744-4f7d-ba54-6c564acf049c	true	id.token.claim
85e706ec-3744-4f7d-ba54-6c564acf049c	true	access.token.claim
85e706ec-3744-4f7d-ba54-6c564acf049c	middle_name	claim.name
85e706ec-3744-4f7d-ba54-6c564acf049c	String	jsonType.label
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	true	introspection.token.claim
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	true	userinfo.token.claim
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	locale	user.attribute
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	true	id.token.claim
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	true	access.token.claim
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	locale	claim.name
8e91e2c2-ea41-4cf1-9e4f-c8631a13b547	String	jsonType.label
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	true	introspection.token.claim
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	true	userinfo.token.claim
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	username	user.attribute
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	true	id.token.claim
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	true	access.token.claim
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	preferred_username	claim.name
8ec0c3fa-3d2a-4186-ab9a-6df368e212e0	String	jsonType.label
a781fb93-184a-4271-90de-12a71e4d2f07	true	introspection.token.claim
a781fb93-184a-4271-90de-12a71e4d2f07	true	userinfo.token.claim
a781fb93-184a-4271-90de-12a71e4d2f07	firstName	user.attribute
a781fb93-184a-4271-90de-12a71e4d2f07	true	id.token.claim
a781fb93-184a-4271-90de-12a71e4d2f07	true	access.token.claim
a781fb93-184a-4271-90de-12a71e4d2f07	given_name	claim.name
a781fb93-184a-4271-90de-12a71e4d2f07	String	jsonType.label
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	true	introspection.token.claim
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	true	userinfo.token.claim
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	birthdate	user.attribute
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	true	id.token.claim
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	true	access.token.claim
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	birthdate	claim.name
ea7b59e9-1c65-4f98-9242-21f4d17b5c86	String	jsonType.label
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	true	introspection.token.claim
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	true	userinfo.token.claim
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	updatedAt	user.attribute
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	true	id.token.claim
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	true	access.token.claim
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	updated_at	claim.name
f13e0abc-643a-4ef1-a42a-9e21c0d50f73	long	jsonType.label
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	true	introspection.token.claim
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	true	userinfo.token.claim
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	lastName	user.attribute
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	true	id.token.claim
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	true	access.token.claim
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	family_name	claim.name
f8dd13b8-4d4c-41c5-a6d1-cb7db324ad27	String	jsonType.label
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	true	introspection.token.claim
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	true	userinfo.token.claim
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	email	user.attribute
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	true	id.token.claim
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	true	access.token.claim
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	email	claim.name
1bcc3659-e1f3-4368-88d8-faa9b1c796ae	String	jsonType.label
d298fdec-356a-47b7-8c92-41cbfdad2695	true	introspection.token.claim
d298fdec-356a-47b7-8c92-41cbfdad2695	true	userinfo.token.claim
d298fdec-356a-47b7-8c92-41cbfdad2695	emailVerified	user.attribute
d298fdec-356a-47b7-8c92-41cbfdad2695	true	id.token.claim
d298fdec-356a-47b7-8c92-41cbfdad2695	true	access.token.claim
d298fdec-356a-47b7-8c92-41cbfdad2695	email_verified	claim.name
d298fdec-356a-47b7-8c92-41cbfdad2695	boolean	jsonType.label
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	formatted	user.attribute.formatted
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	country	user.attribute.country
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	true	introspection.token.claim
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	postal_code	user.attribute.postal_code
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	true	userinfo.token.claim
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	street	user.attribute.street
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	true	id.token.claim
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	region	user.attribute.region
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	true	access.token.claim
ee16d734-bcc6-4d0b-a9ca-f4b6ca8443b5	locality	user.attribute.locality
5028bf22-2994-4dde-b533-cd862d1a32bd	true	introspection.token.claim
5028bf22-2994-4dde-b533-cd862d1a32bd	true	userinfo.token.claim
5028bf22-2994-4dde-b533-cd862d1a32bd	phoneNumber	user.attribute
5028bf22-2994-4dde-b533-cd862d1a32bd	true	id.token.claim
5028bf22-2994-4dde-b533-cd862d1a32bd	true	access.token.claim
5028bf22-2994-4dde-b533-cd862d1a32bd	phone_number	claim.name
5028bf22-2994-4dde-b533-cd862d1a32bd	String	jsonType.label
e1f86832-17f9-41d6-a286-7bd567e9e9c2	true	introspection.token.claim
e1f86832-17f9-41d6-a286-7bd567e9e9c2	true	userinfo.token.claim
e1f86832-17f9-41d6-a286-7bd567e9e9c2	phoneNumberVerified	user.attribute
e1f86832-17f9-41d6-a286-7bd567e9e9c2	true	id.token.claim
e1f86832-17f9-41d6-a286-7bd567e9e9c2	true	access.token.claim
e1f86832-17f9-41d6-a286-7bd567e9e9c2	phone_number_verified	claim.name
e1f86832-17f9-41d6-a286-7bd567e9e9c2	boolean	jsonType.label
8e34ed90-7b1e-4308-ba92-3c3dafd65942	true	introspection.token.claim
8e34ed90-7b1e-4308-ba92-3c3dafd65942	true	multivalued
8e34ed90-7b1e-4308-ba92-3c3dafd65942	foo	user.attribute
8e34ed90-7b1e-4308-ba92-3c3dafd65942	true	access.token.claim
8e34ed90-7b1e-4308-ba92-3c3dafd65942	realm_access.roles	claim.name
8e34ed90-7b1e-4308-ba92-3c3dafd65942	String	jsonType.label
b9e58d07-04d7-40db-a5f9-05a4019e927c	true	introspection.token.claim
b9e58d07-04d7-40db-a5f9-05a4019e927c	true	access.token.claim
de21c96f-87ec-4209-9c75-3dd121ca2321	true	introspection.token.claim
de21c96f-87ec-4209-9c75-3dd121ca2321	true	multivalued
de21c96f-87ec-4209-9c75-3dd121ca2321	foo	user.attribute
de21c96f-87ec-4209-9c75-3dd121ca2321	true	access.token.claim
de21c96f-87ec-4209-9c75-3dd121ca2321	resource_access.${client_id}.roles	claim.name
de21c96f-87ec-4209-9c75-3dd121ca2321	String	jsonType.label
ab943199-f7a3-45be-9fbc-5c42235ceec2	true	introspection.token.claim
ab943199-f7a3-45be-9fbc-5c42235ceec2	true	access.token.claim
25a02989-413f-488b-9bd6-dcb7f4fa37a0	true	introspection.token.claim
25a02989-413f-488b-9bd6-dcb7f4fa37a0	true	multivalued
25a02989-413f-488b-9bd6-dcb7f4fa37a0	foo	user.attribute
25a02989-413f-488b-9bd6-dcb7f4fa37a0	true	id.token.claim
25a02989-413f-488b-9bd6-dcb7f4fa37a0	true	access.token.claim
25a02989-413f-488b-9bd6-dcb7f4fa37a0	groups	claim.name
25a02989-413f-488b-9bd6-dcb7f4fa37a0	String	jsonType.label
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	true	introspection.token.claim
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	true	userinfo.token.claim
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	username	user.attribute
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	true	id.token.claim
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	true	access.token.claim
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	upn	claim.name
2b6e9ad0-f2a5-486d-8dbc-191a7639027a	String	jsonType.label
ff343f11-aed1-4541-b63a-6ff83c76eef3	true	introspection.token.claim
ff343f11-aed1-4541-b63a-6ff83c76eef3	true	id.token.claim
ff343f11-aed1-4541-b63a-6ff83c76eef3	true	access.token.claim
8d27e6fe-ab82-499c-9950-8968c58acff5	AUTH_TIME	user.session.note
8d27e6fe-ab82-499c-9950-8968c58acff5	true	introspection.token.claim
8d27e6fe-ab82-499c-9950-8968c58acff5	true	id.token.claim
8d27e6fe-ab82-499c-9950-8968c58acff5	true	access.token.claim
8d27e6fe-ab82-499c-9950-8968c58acff5	auth_time	claim.name
8d27e6fe-ab82-499c-9950-8968c58acff5	long	jsonType.label
975c7e26-8dfa-41a8-a0e4-eb27919fb9ff	true	introspection.token.claim
975c7e26-8dfa-41a8-a0e4-eb27919fb9ff	true	access.token.claim
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	true	introspection.token.claim
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	true	multivalued
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	true	id.token.claim
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	true	access.token.claim
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	organization	claim.name
561e6c01-6b6b-4a3e-9710-bc0e8082ed65	String	jsonType.label
\.


--
-- Data for Name: realm; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm (id, access_code_lifespan, user_action_lifespan, access_token_lifespan, account_theme, admin_theme, email_theme, enabled, events_enabled, events_expiration, login_theme, name, not_before, password_policy, registration_allowed, remember_me, reset_password_allowed, social, ssl_required, sso_idle_timeout, sso_max_lifespan, update_profile_on_soc_login, verify_email, master_admin_client, login_lifespan, internationalization_enabled, default_locale, reg_email_as_username, admin_events_enabled, admin_events_details_enabled, edit_username_allowed, otp_policy_counter, otp_policy_window, otp_policy_period, otp_policy_digits, otp_policy_alg, otp_policy_type, browser_flow, registration_flow, direct_grant_flow, reset_credentials_flow, client_auth_flow, offline_session_idle_timeout, revoke_refresh_token, access_token_life_implicit, login_with_email_allowed, duplicate_emails_allowed, docker_auth_flow, refresh_token_max_reuse, allow_user_managed_access, sso_max_lifespan_remember_me, sso_idle_timeout_remember_me, default_role) FROM stdin;
c7e460e9-8d41-4072-a515-5a9959b79e9d	60	300	60	\N	\N	\N	t	f	0	\N	master	0	\N	f	f	f	f	EXTERNAL	10800	10800	f	f	f9f99755-4d34-413d-821f-4bfa12568790	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	82ae4278-dd37-4e7a-a607-1752cca5b581	2b17ee75-35ee-4790-a05b-3202c07fe89e	2209007f-443d-411a-b8ae-2573433be8c0	de9457b0-d231-4a82-8b2b-6249802b0dc2	6c973a87-345b-408f-84fa-fe93e97304a2	2592000	f	900	t	f	0ae23b73-4b55-4719-ab38-b3450905527e	0	f	0	0	7e91728b-b670-49f9-b0b5-6ab3f77565af
\.


--
-- Data for Name: realm_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_attribute (name, realm_id, value) FROM stdin;
bruteForceProtected	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
permanentLockout	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
maxTemporaryLockouts	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
bruteForceStrategy	c7e460e9-8d41-4072-a515-5a9959b79e9d	MULTIPLE
maxFailureWaitSeconds	c7e460e9-8d41-4072-a515-5a9959b79e9d	900
minimumQuickLoginWaitSeconds	c7e460e9-8d41-4072-a515-5a9959b79e9d	60
waitIncrementSeconds	c7e460e9-8d41-4072-a515-5a9959b79e9d	60
quickLoginCheckMilliSeconds	c7e460e9-8d41-4072-a515-5a9959b79e9d	1000
maxDeltaTimeSeconds	c7e460e9-8d41-4072-a515-5a9959b79e9d	43200
failureFactor	c7e460e9-8d41-4072-a515-5a9959b79e9d	30
realmReusableOtpCode	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
firstBrokerLoginFlowId	c7e460e9-8d41-4072-a515-5a9959b79e9d	5bd8f430-81b5-4c51-9d6b-887da8406457
displayName	c7e460e9-8d41-4072-a515-5a9959b79e9d	Keycloak
displayNameHtml	c7e460e9-8d41-4072-a515-5a9959b79e9d	<div class="kc-logo-text"><span>Keycloak</span></div>
defaultSignatureAlgorithm	c7e460e9-8d41-4072-a515-5a9959b79e9d	RS256
offlineSessionMaxLifespanEnabled	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
offlineSessionMaxLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	5184000
cibaBackchannelTokenDeliveryMode	c7e460e9-8d41-4072-a515-5a9959b79e9d	poll
cibaExpiresIn	c7e460e9-8d41-4072-a515-5a9959b79e9d	120
cibaAuthRequestedUserHint	c7e460e9-8d41-4072-a515-5a9959b79e9d	login_hint
parRequestUriLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	60
cibaInterval	c7e460e9-8d41-4072-a515-5a9959b79e9d	5
postBindingLogoutForSamlFlow	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
oauth2DeviceAuthorizationGrantEnabled	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
oauth2DeviceCodeLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	600
oauth2DevicePollingInterval	c7e460e9-8d41-4072-a515-5a9959b79e9d	5
organizationsEnabled	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
actionTokenGeneratedByAdminLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	43200
actionTokenGeneratedByUserLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	300
clientSessionIdleTimeout	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
clientOfflineSessionIdleTimeout	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
clientOfflineSessionMaxLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
webAuthnPolicyRpEntityName	c7e460e9-8d41-4072-a515-5a9959b79e9d	keycloak
webAuthnPolicySignatureAlgorithms	c7e460e9-8d41-4072-a515-5a9959b79e9d	ES256,RS256
webAuthnPolicyRpId	c7e460e9-8d41-4072-a515-5a9959b79e9d	
webAuthnPolicyAttestationConveyancePreference	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyAuthenticatorAttachment	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyRequireResidentKey	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyUserVerificationRequirement	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyCreateTimeout	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
webAuthnPolicyAvoidSameAuthenticatorRegister	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
webAuthnPolicyRpEntityNamePasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	keycloak
webAuthnPolicySignatureAlgorithmsPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	ES256,RS256
webAuthnPolicyRpIdPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	
webAuthnPolicyAttestationConveyancePreferencePasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyAuthenticatorAttachmentPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyRequireResidentKeyPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyUserVerificationRequirementPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	not specified
webAuthnPolicyCreateTimeoutPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	0
webAuthnPolicyAvoidSameAuthenticatorRegisterPasswordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	false
client-policies.profiles	c7e460e9-8d41-4072-a515-5a9959b79e9d	{"profiles":[]}
client-policies.policies	c7e460e9-8d41-4072-a515-5a9959b79e9d	{"policies":[]}
adminUrl	c7e460e9-8d41-4072-a515-5a9959b79e9d	http://localhost:8080
login_theme	c7e460e9-8d41-4072-a515-5a9959b79e9d	keycloak
accountTheme	c7e460e9-8d41-4072-a515-5a9959b79e9d	keycloak
adminTheme	c7e460e9-8d41-4072-a515-5a9959b79e9d	keycloak
frontendUrl	c7e460e9-8d41-4072-a515-5a9959b79e9d	http://localhost:8080
clientSessionMaxLifespan	c7e460e9-8d41-4072-a515-5a9959b79e9d	10800
_browser_header.contentSecurityPolicyReportOnly	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.xContentTypeOptions	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.referrerPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.xRobotsTag	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.xFrameOptions	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.contentSecurityPolicy	c7e460e9-8d41-4072-a515-5a9959b79e9d	
_browser_header.xXSSProtection	c7e460e9-8d41-4072-a515-5a9959b79e9d	
\.


--
-- Data for Name: realm_default_groups; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_default_groups (realm_id, group_id) FROM stdin;
\.


--
-- Data for Name: realm_enabled_event_types; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_enabled_event_types (realm_id, value) FROM stdin;
\.


--
-- Data for Name: realm_events_listeners; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_events_listeners (realm_id, value) FROM stdin;
c7e460e9-8d41-4072-a515-5a9959b79e9d	jboss-logging
\.


--
-- Data for Name: realm_localizations; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_localizations (realm_id, locale, texts) FROM stdin;
\.


--
-- Data for Name: realm_required_credential; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_required_credential (type, form_label, input, secret, realm_id) FROM stdin;
password	password	t	t	c7e460e9-8d41-4072-a515-5a9959b79e9d
\.


--
-- Data for Name: realm_smtp_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_smtp_config (realm_id, value, name) FROM stdin;
\.


--
-- Data for Name: realm_supported_locales; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.realm_supported_locales (realm_id, value) FROM stdin;
\.


--
-- Data for Name: redirect_uris; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.redirect_uris (client_id, value) FROM stdin;
386311a8-d22a-4642-9e53-58134b2473d7	/realms/master/account/*
0582098f-d963-43ee-822c-4a3f51609dd7	/realms/master/account/*
df49b488-e907-456b-b1af-87e59164d12d	/admin/master/console/*
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	http://localhost:8080/*
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	http://localhost:8080/admin/*
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:8080/*
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:5174/*
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:3000
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:3000/*
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:5174/*
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:3000
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:3000/*
\.


--
-- Data for Name: required_action_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.required_action_config (required_action_id, value, name) FROM stdin;
\.


--
-- Data for Name: required_action_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.required_action_provider (id, alias, name, realm_id, enabled, default_action, provider_id, priority) FROM stdin;
8eefa1cb-b171-40a9-a0be-a6391ac477d5	VERIFY_EMAIL	Verify Email	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	VERIFY_EMAIL	50
0a85384c-f905-4e30-a2cd-c46f211e9948	UPDATE_PROFILE	Update Profile	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	UPDATE_PROFILE	40
84109695-6b70-4a80-b76c-3ba1babc2f25	CONFIGURE_TOTP	Configure OTP	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	CONFIGURE_TOTP	10
54d7c44a-db94-4693-9039-0b9f7152744f	UPDATE_PASSWORD	Update Password	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	UPDATE_PASSWORD	30
5fbc7ed4-a96a-4f68-9e34-dddf0928c799	TERMS_AND_CONDITIONS	Terms and Conditions	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	f	TERMS_AND_CONDITIONS	20
27f7283d-1848-42bd-9516-f978d7b36f54	delete_account	Delete Account	c7e460e9-8d41-4072-a515-5a9959b79e9d	f	f	delete_account	60
1d006abd-b522-4642-b66b-acb0b05933f6	delete_credential	Delete Credential	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	delete_credential	100
0c4b3373-b37a-4a01-8f3b-99ca35417012	update_user_locale	Update User Locale	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	update_user_locale	1000
3b5eabeb-5547-4d31-b560-2636bd1afde0	UPDATE_EMAIL	Update Email	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	UPDATE_EMAIL	70
466904eb-9d6a-4a9f-8981-af0ccd8fb4a9	CONFIGURE_RECOVERY_AUTHN_CODES	Recovery Authentication Codes	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	CONFIGURE_RECOVERY_AUTHN_CODES	70
549e9589-305c-4174-882c-c3cd69b15d43	webauthn-register	Webauthn Register	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	webauthn-register	70
3b10c873-dbab-4ea9-89f3-ea6219e3917c	webauthn-register-passwordless	Webauthn Register Passwordless	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	webauthn-register-passwordless	80
28a64382-dce8-4609-ac5d-ffbe98dc6dff	VERIFY_PROFILE	Verify Profile	c7e460e9-8d41-4072-a515-5a9959b79e9d	t	f	VERIFY_PROFILE	90
\.


--
-- Data for Name: resource_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_attribute (id, name, value, resource_id) FROM stdin;
\.


--
-- Data for Name: resource_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_policy (resource_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_scope (resource_id, scope_id) FROM stdin;
\.


--
-- Data for Name: resource_server; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server (id, allow_rs_remote_mgmt, policy_enforce_mode, decision_strategy) FROM stdin;
\.


--
-- Data for Name: resource_server_perm_ticket; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_perm_ticket (id, owner, requester, created_timestamp, granted_timestamp, resource_id, scope_id, resource_server_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_server_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_policy (id, name, description, type, decision_strategy, logic, resource_server_id, owner) FROM stdin;
\.


--
-- Data for Name: resource_server_resource; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_resource (id, name, type, icon_uri, owner, resource_server_id, owner_managed_access, display_name) FROM stdin;
\.


--
-- Data for Name: resource_server_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_server_scope (id, name, icon_uri, resource_server_id, display_name) FROM stdin;
\.


--
-- Data for Name: resource_uris; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.resource_uris (resource_id, value) FROM stdin;
\.


--
-- Data for Name: revoked_token; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.revoked_token (id, expire) FROM stdin;
\.


--
-- Data for Name: role_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.role_attribute (id, role_id, name, value) FROM stdin;
\.


--
-- Data for Name: scope_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.scope_mapping (client_id, role_id) FROM stdin;
0582098f-d963-43ee-822c-4a3f51609dd7	7c3fd51d-cfa1-4f4a-8f89-706ea2cf0730
0582098f-d963-43ee-822c-4a3f51609dd7	644e80c6-0c63-4ff4-9810-9c46d14119dc
\.


--
-- Data for Name: scope_policy; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.scope_policy (scope_id, policy_id) FROM stdin;
\.


--
-- Data for Name: user_attribute; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_attribute (name, value, user_id, id, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
is_temporary_admin	true	47bce160-7c70-4bea-a7fc-dd5af40a12ea	0ec5136f-63bb-4780-a04c-fa957e4f2ccc	\N	\N	\N
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_consent (id, client_id, user_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: user_consent_client_scope; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_consent_client_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_entity (id, email, email_constraint, email_verified, enabled, federation_link, first_name, last_name, realm_id, username, created_timestamp, service_account_client_link, not_before) FROM stdin;
47bce160-7c70-4bea-a7fc-dd5af40a12ea	\N	c56e1e35-2b90-470d-9d10-93d136909dd8	f	t	\N	\N	\N	c7e460e9-8d41-4072-a515-5a9959b79e9d	admin	1774697989838	\N	0
79d3cc1c-1257-4b94-8b39-10ee509cfb9e	shareef.hiasat@gmail.com	shareef.hiasat@gmail.com	t	t	\N	Shareef	Hiasat	c7e460e9-8d41-4072-a515-5a9959b79e9d	shareef.hiasat@gmail.com	1774698017028	\N	0
5b4cef9d-9c27-497e-981c-0791505cd7aa	testuser@example.com	testuser@example.com	f	t	\N	Test	User	c7e460e9-8d41-4072-a515-5a9959b79e9d	testuser@example.com	1774698097869	\N	0
2c148802-ea59-4034-9b44-a6b8c1dbaefb	instructor@instructor.com	instructor@instructor.com	f	t	\N	instructor	X	c7e460e9-8d41-4072-a515-5a9959b79e9d	instructor@instructor.com	1774769683807	\N	0
\.


--
-- Data for Name: user_federation_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_config (user_federation_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_mapper (id, name, federation_provider_id, federation_mapper_type, realm_id) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper_config; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_mapper_config (user_federation_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_provider; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_federation_provider (id, changed_sync_period, display_name, full_sync_period, last_sync, priority, provider_name, realm_id) FROM stdin;
\.


--
-- Data for Name: user_group_membership; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_group_membership (group_id, user_id, membership_type) FROM stdin;
\.


--
-- Data for Name: user_required_action; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_required_action (user_id, required_action) FROM stdin;
5b4cef9d-9c27-497e-981c-0791505cd7aa	UPDATE_PASSWORD
2c148802-ea59-4034-9b44-a6b8c1dbaefb	UPDATE_PASSWORD
\.


--
-- Data for Name: user_role_mapping; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.user_role_mapping (role_id, user_id) FROM stdin;
7e91728b-b670-49f9-b0b5-6ab3f77565af	47bce160-7c70-4bea-a7fc-dd5af40a12ea
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	47bce160-7c70-4bea-a7fc-dd5af40a12ea
7e91728b-b670-49f9-b0b5-6ab3f77565af	79d3cc1c-1257-4b94-8b39-10ee509cfb9e
7e91728b-b670-49f9-b0b5-6ab3f77565af	5b4cef9d-9c27-497e-981c-0791505cd7aa
55135976-afeb-4d24-9f40-de4594559cfb	79d3cc1c-1257-4b94-8b39-10ee509cfb9e
12e00df6-af3b-4f95-8c08-0fad176e9100	79d3cc1c-1257-4b94-8b39-10ee509cfb9e
e1e679f1-500a-4fc6-9a8f-e11a80c790f3	79d3cc1c-1257-4b94-8b39-10ee509cfb9e
6d3c2495-873a-4e2e-af59-22c17fbf43b5	5b4cef9d-9c27-497e-981c-0791505cd7aa
7e91728b-b670-49f9-b0b5-6ab3f77565af	2c148802-ea59-4034-9b44-a6b8c1dbaefb
\.


--
-- Data for Name: username_login_failure; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.username_login_failure (realm_id, username, failed_login_not_before, last_failure, last_ip_failure, num_failures) FROM stdin;
\.


--
-- Data for Name: web_origins; Type: TABLE DATA; Schema: public; Owner: keycloak
--

COPY public.web_origins (client_id, value) FROM stdin;
df49b488-e907-456b-b1af-87e59164d12d	+
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	http://localhost:8080
96105cb8-a41d-40ef-bfcd-c3a2b8f521ad	+
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:8080
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:3000
d92dbca4-d86d-41fb-a310-06ae34027247	https://localhost:5174
d92dbca4-d86d-41fb-a310-06ae34027247	*
d92dbca4-d86d-41fb-a310-06ae34027247	+
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:3000
d92dbca4-d86d-41fb-a310-06ae34027247	http://localhost:5174
\.


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: org_domain ORG_DOMAIN_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.org_domain
    ADD CONSTRAINT "ORG_DOMAIN_pkey" PRIMARY KEY (id, name);


--
-- Name: org ORG_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT "ORG_pkey" PRIMARY KEY (id);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: revoked_token constraint_rt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.revoked_token
    ADD CONSTRAINT constraint_rt PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: user_consent uk_external_consent; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_external_consent UNIQUE (client_storage_provider, external_client_id, user_id);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_local_consent; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_local_consent UNIQUE (client_id, user_id);


--
-- Name: org uk_org_alias; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_alias UNIQUE (realm_id, alias);


--
-- Name: org uk_org_group; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_group UNIQUE (group_id);


--
-- Name: org uk_org_name; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.org
    ADD CONSTRAINT uk_org_name UNIQUE (realm_id, name);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX fed_user_attr_long_values ON public.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX fed_user_attr_long_values_lower_case ON public.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_att_by_name_value ON public.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_idp_for_login; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_idp_for_login ON public.identity_provider USING btree (realm_id, enabled, link_only, hide_on_login, organization_id);


--
-- Name: idx_idp_realm_org; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_idp_realm_org ON public.identity_provider USING btree (realm_id, organization_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_offline_uss_by_broker_session_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_by_broker_session_id ON public.offline_user_session USING btree (broker_session_id, realm_id);


--
-- Name: idx_offline_uss_by_last_session_refresh; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_by_last_session_refresh ON public.offline_user_session USING btree (realm_id, offline_flag, last_session_refresh);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_org_domain_org_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_org_domain_org_id ON public.org_domain USING btree (org_id);


--
-- Name: idx_perm_ticket_owner; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_perm_ticket_owner ON public.resource_server_perm_ticket USING btree (owner);


--
-- Name: idx_perm_ticket_requester; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_perm_ticket_requester ON public.resource_server_perm_ticket USING btree (requester);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_rev_token_on_expire; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_rev_token_on_expire ON public.revoked_token USING btree (expire);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_usconsent_scope_id; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usconsent_scope_id ON public.user_consent_client_scope USING btree (scope_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX user_attr_long_values ON public.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: keycloak
--

CREATE INDEX user_attr_long_values_lower_case ON public.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: keycloak
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2BZBJeEKrY5tbYeHDnpe81bLXYiMdWZpfNctvJyItceeFdDW3xwbEwsBfVsJEtG

