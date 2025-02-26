--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: dob_domain; Type: DOMAIN; Schema: public; Owner: cravyn_dummy_owner
--

CREATE DOMAIN public.dob_domain AS date
	CONSTRAINT dob_domain_check CHECK (((VALUE IS NOT NULL) AND (to_char((VALUE)::timestamp with time zone, 'DD/MM/YYYY'::text) ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/(19|20)\d{2}$'::text)));


ALTER DOMAIN public.dob_domain OWNER TO cravyn_dummy_owner;

--
-- Name: email; Type: DOMAIN; Schema: public; Owner: cravyn_dummy_owner
--

CREATE DOMAIN public.email AS character varying(100)
	CONSTRAINT email_check CHECK (((VALUE)::text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text));


ALTER DOMAIN public.email OWNER TO cravyn_dummy_owner;

--
-- Name: otp; Type: DOMAIN; Schema: public; Owner: cravyn_dummy_owner
--

CREATE DOMAIN public.otp AS character varying(6)
	CONSTRAINT otp_check CHECK (((length((VALUE)::text) = 6) AND ((VALUE)::text ~ '^[0-9]+$'::text)));


ALTER DOMAIN public.otp OWNER TO cravyn_dummy_owner;

--
-- Name: pan_number; Type: DOMAIN; Schema: public; Owner: cravyn_dummy_owner
--

CREATE DOMAIN public.pan_number AS character varying(10)
	CONSTRAINT pan_number_check CHECK (((VALUE)::text ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'::text));


ALTER DOMAIN public.pan_number OWNER TO cravyn_dummy_owner;

--
-- Name: assign_random_delivery_partner(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.assign_random_delivery_partner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.partner_id = (
        SELECT id 
        FROM delivery_partner 
        ORDER BY RANDOM() 
        LIMIT 1
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.assign_random_delivery_partner() OWNER TO cravyn_dummy_owner;

--
-- Name: calculate_customers(text); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.calculate_customers(target_year_month text) RETURNS TABLE(before_month_customers uuid[], in_month_customers uuid[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := TO_DATE(target_year_month || '-01', 'YYYY-MM-DD');
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';

    RETURN QUERY
    SELECT 
        ARRAY(
            SELECT DISTINCT customer_id 
            FROM orders 
            WHERE DATE(order_timestamp) < start_date
        ) AS before_month_customers,
        ARRAY(
            SELECT DISTINCT customer_id 
            FROM orders 
            WHERE DATE(order_timestamp) BETWEEN start_date AND end_date
        ) AS in_month_customers;
END;
$$;


ALTER FUNCTION public.calculate_customers(target_year_month text) OWNER TO cravyn_dummy_owner;

--
-- Name: calculate_metrics(text); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.calculate_metrics(target_year_month text) RETURNS TABLE(customer_acquisition_rate numeric, customer_retention_rate numeric, churn_rate numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    before_month_customers UUID[];
    in_month_customers UUID[];
    retained_customers UUID[];
    lost_customers UUID[];
    total_customers_before_month INT;
    new_customers INT;
    total_retained_customers INT;
BEGIN
  
    start_date := TO_DATE(target_year_month || '-01', 'YYYY-MM-DD');
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';

    SELECT * INTO before_month_customers, in_month_customers 
    FROM calculate_customers(target_year_month);

    retained_customers := ARRAY(
        SELECT unnest(before_month_customers) 
        INTERSECT 
        SELECT unnest(in_month_customers)
    );

    lost_customers := ARRAY(
        SELECT unnest(before_month_customers) 
        EXCEPT 
        SELECT unnest(in_month_customers)
    );

    total_customers_before_month := array_length(before_month_customers, 1);
    
    new_customers := array_length(
        ARRAY(
            SELECT unnest(in_month_customers)
            EXCEPT
            SELECT unnest(before_month_customers)
        ), 1
    );

    total_retained_customers := array_length(retained_customers, 1);

    IF total_customers_before_month > 0 THEN
        customer_acquisition_rate := ROUND((new_customers::DECIMAL / total_customers_before_month) * 100, 2);
    ELSE
        customer_acquisition_rate := NULL; 
    END IF;

    IF total_customers_before_month > 0 THEN
        customer_retention_rate := ROUND((total_retained_customers::DECIMAL / total_customers_before_month) * 100, 2);
    ELSE
        customer_retention_rate := NULL; 
    END IF;

    IF customer_retention_rate IS NOT NULL THEN
        churn_rate := 100 - customer_retention_rate;
    ELSE
        churn_rate := NULL;
    END IF;

    RETURN NEXT;
END;
$$;


ALTER FUNCTION public.calculate_metrics(target_year_month text) OWNER TO cravyn_dummy_owner;

--
-- Name: capitalize_food_name(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.capitalize_food_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.name := INITCAP(NEW.name);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.capitalize_food_name() OWNER TO cravyn_dummy_owner;

--
-- Name: check_partner_for_delivered(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.check_partner_for_delivered() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure partner_id is not null if the order_status is set to 'Delivered'
    IF NEW.order_status = 'Delivered' AND NEW.partner_id IS NULL THEN
        RAISE EXCEPTION 'Cannot set order_status to Delivered when partner_id is NULL';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_partner_for_delivered() OWNER TO cravyn_dummy_owner;

--
-- Name: convert_dob(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.convert_dob() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.date_of_birth := TO_DATE(NEW.date_of_birth, 'DD/MM/YYYY');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.convert_dob() OWNER TO cravyn_dummy_owner;

--
-- Name: enforce_single_restaurant_per_customer(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.enforce_single_restaurant_per_customer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM cart
        WHERE customer_id = NEW.customer_id
          AND restaurant_id <> NEW.restaurant_id
    ) THEN
        DELETE FROM cart
        WHERE customer_id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.enforce_single_restaurant_per_customer() OWNER TO cravyn_dummy_owner;

--
-- Name: ensure_single_default_address(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.ensure_single_default_address() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Set all other addresses for the same customer to false
    UPDATE customer_address
    SET is_default = FALSE
    WHERE customer_id = NEW.customer_id
      AND address_id <> NEW.address_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.ensure_single_default_address() OWNER TO cravyn_dummy_owner;

--
-- Name: generate_unique_list_id(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.generate_unique_list_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_list_id VARCHAR(6);
    is_unique BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-digit number
        new_list_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if it's unique
        SELECT NOT EXISTS(SELECT 1 FROM orders WHERE list_id = new_list_id) INTO is_unique;
        
        EXIT WHEN is_unique;
    END LOOP;
    
    NEW.list_id := new_list_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_unique_list_id() OWNER TO cravyn_dummy_owner;

--
-- Name: update_restaurant_query_timestamp(); Type: FUNCTION; Schema: public; Owner: cravyn_dummy_owner
--

CREATE FUNCTION public.update_restaurant_query_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.timestamp = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_restaurant_query_timestamp() OWNER TO cravyn_dummy_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: business_team; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.business_team (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    phone_number bigint NOT NULL,
    email_address public.email NOT NULL,
    password character varying(100) NOT NULL,
    refresh_token character varying(500),
    CONSTRAINT business_team_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint)))
);


ALTER TABLE public.business_team OWNER TO cravyn_dummy_owner;

--
-- Name: cart; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.cart (
    customer_id uuid NOT NULL,
    item_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    quantity integer,
    CONSTRAINT cart_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart OWNER TO cravyn_dummy_owner;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.customer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email_address public.email NOT NULL,
    refresh_token character varying(500),
    profile_image_url character varying(255),
    password character varying(100) NOT NULL,
    phone_number bigint,
    date_of_birth text NOT NULL,
    otp character varying(255),
    CONSTRAINT customer_date_of_birth_check CHECK ((EXTRACT(year FROM age((to_date(date_of_birth, 'YYYY-MM-DD'::text))::timestamp with time zone)) >= '15'::numeric)),
    CONSTRAINT customer_date_of_birth_check1 CHECK ((EXTRACT(year FROM age((to_date(date_of_birth, 'YYYY-MM-DD'::text))::timestamp with time zone)) >= '15'::numeric)),
    CONSTRAINT customer_date_of_birth_check2 CHECK (((EXTRACT(year FROM age((to_date(date_of_birth, 'YYYY-MM-DD'::text))::timestamp with time zone)) >= '15'::numeric) AND (EXTRACT(year FROM to_date(date_of_birth, 'YYYY-MM-DD'::text)) >= (1900)::numeric) AND (to_date(date_of_birth, 'YYYY-MM-DD'::text) < now()))),
    CONSTRAINT customer_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint)))
);


ALTER TABLE public.customer OWNER TO cravyn_dummy_owner;

--
-- Name: customer_address; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.customer_address (
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    display_address text NOT NULL,
    is_default boolean DEFAULT false,
    customer_id uuid NOT NULL,
    address_id uuid DEFAULT public.uuid_generate_v4() NOT NULL
);


ALTER TABLE public.customer_address OWNER TO cravyn_dummy_owner;

--
-- Name: customer_query; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.customer_query (
    query_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    question text NOT NULL,
    answer text,
    manager_id uuid
);


ALTER TABLE public.customer_query OWNER TO cravyn_dummy_owner;

--
-- Name: delivery_partner; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.delivery_partner (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone_number bigint NOT NULL,
    availability boolean DEFAULT true,
    refresh_token character varying(500),
    vehicle_type character varying(10) NOT NULL,
    password character varying(100) NOT NULL,
    profile_image_url character varying(255),
    email_address public.email NOT NULL,
    name character varying(255) NOT NULL,
    otp character varying(255),
    CONSTRAINT delivery_partner_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint))),
    CONSTRAINT delivery_partner_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['Cycle'::character varying, 'Bike'::character varying])::text[])))
);


ALTER TABLE public.delivery_partner OWNER TO cravyn_dummy_owner;

--
-- Name: food_item; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.food_item (
    item_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    food_name character varying(100) NOT NULL,
    type character varying(20),
    restaurant_id uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    discount_cap numeric(10,2) DEFAULT 0,
    food_image_url character varying(255),
    description character varying(250) NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    CONSTRAINT food_item_type_check CHECK (((type)::text = ANY ((ARRAY['Vegetarian'::character varying, 'Non-Vegetarian'::character varying, 'Beverages'::character varying])::text[])))
);


ALTER TABLE public.food_item OWNER TO cravyn_dummy_owner;

--
-- Name: management_team; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.management_team (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    phone_number bigint NOT NULL,
    email_address character varying(255) NOT NULL,
    password character varying(100) NOT NULL,
    refresh_token character varying(500),
    CONSTRAINT management_team_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint)))
);


ALTER TABLE public.management_team OWNER TO cravyn_dummy_owner;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.orders (
    order_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    partner_id uuid,
    ratings numeric(2,1),
    reviews text,
    specifications text,
    order_status character varying(10) NOT NULL,
    product_image_url character varying(255),
    checkout_price numeric(10,2) NOT NULL,
    list_id character varying(6),
    order_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    address_id uuid NOT NULL,
    CONSTRAINT check_order_status CHECK (((order_status)::text = ANY ((ARRAY['Preparing'::character varying, 'Packed'::character varying, 'Delivered'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT orders_ratings_check CHECK (((ratings >= (0)::numeric) AND (ratings <= (5)::numeric)))
);


ALTER TABLE public.orders OWNER TO cravyn_dummy_owner;

--
-- Name: orders_list; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.orders_list (
    list_id character varying(6) NOT NULL,
    item_id uuid NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    CONSTRAINT orders_list_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.orders_list OWNER TO cravyn_dummy_owner;

--
-- Name: restaurant; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.restaurant (
    restaurant_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    registration_no character varying(50) NOT NULL,
    owner_id uuid NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    city character varying(100) NOT NULL,
    street character varying(255),
    landmark character varying(255),
    pin_code character varying(6),
    availability_status boolean DEFAULT true,
    license_url character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    gstin_no character varying(15),
    account_number character varying(20),
    ifsc_code character varying(11),
    bank_name character varying(255),
    branch_city character varying(100),
    password character varying(100) NOT NULL,
    refresh_token character varying(500),
    restaurant_image_url character varying(255),
    verify_status character varying(10) DEFAULT 'pending'::character varying,
    email character varying(255) DEFAULT 'email@email.com'::character varying NOT NULL,
    phone_number bigint DEFAULT '7896541258'::bigint NOT NULL,
    gstin_url character varying(255),
    CONSTRAINT check_verify_status CHECK (((verify_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT restaurant_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint)))
);


ALTER TABLE public.restaurant OWNER TO cravyn_dummy_owner;

--
-- Name: restaurant_owner; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.restaurant_owner (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone_number bigint NOT NULL,
    pan_number public.pan_number NOT NULL,
    refresh_token character varying(500),
    password character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    email_address public.email NOT NULL,
    otp character varying(255),
    CONSTRAINT restaurant_owner_phone_number_check CHECK (((phone_number >= 1000000000) AND (phone_number <= '9999999999'::bigint)))
);


ALTER TABLE public.restaurant_owner OWNER TO cravyn_dummy_owner;

--
-- Name: restaurant_query; Type: TABLE; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TABLE public.restaurant_query (
    query_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    restaurant_id uuid NOT NULL,
    question text NOT NULL,
    answer text,
    manager_id uuid,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.restaurant_query OWNER TO cravyn_dummy_owner;

--
-- Name: business_team business_team_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.business_team
    ADD CONSTRAINT business_team_pkey PRIMARY KEY (id);


--
-- Name: business_team business_team_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.business_team
    ADD CONSTRAINT business_team_refresh_token_key UNIQUE (refresh_token);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (customer_id, item_id, restaurant_id);


--
-- Name: customer_address customer_address_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT customer_address_pkey PRIMARY KEY (address_id);


--
-- Name: customer customer_email_address_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_email_address_key UNIQUE (email_address);


--
-- Name: customer customer_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_phone_number_key UNIQUE (phone_number);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: customer_query customer_query_customer_id_question_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_query
    ADD CONSTRAINT customer_query_customer_id_question_key UNIQUE (customer_id, question);


--
-- Name: customer_query customer_query_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_query
    ADD CONSTRAINT customer_query_pkey PRIMARY KEY (query_id);


--
-- Name: delivery_partner delivery_partner_email_address_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.delivery_partner
    ADD CONSTRAINT delivery_partner_email_address_key UNIQUE (email_address);


--
-- Name: delivery_partner delivery_partner_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.delivery_partner
    ADD CONSTRAINT delivery_partner_pkey PRIMARY KEY (id);


--
-- Name: delivery_partner delivery_partner_profile_image_url_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.delivery_partner
    ADD CONSTRAINT delivery_partner_profile_image_url_key UNIQUE (profile_image_url);


--
-- Name: delivery_partner delivery_partner_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.delivery_partner
    ADD CONSTRAINT delivery_partner_refresh_token_key UNIQUE (refresh_token);


--
-- Name: food_item food_item_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.food_item
    ADD CONSTRAINT food_item_pkey PRIMARY KEY (item_id);


--
-- Name: management_team management_team_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.management_team
    ADD CONSTRAINT management_team_pkey PRIMARY KEY (id);


--
-- Name: management_team management_team_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.management_team
    ADD CONSTRAINT management_team_refresh_token_key UNIQUE (refresh_token);


--
-- Name: orders orders_list_id_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_list_id_key UNIQUE (list_id);


--
-- Name: orders_list orders_list_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders_list
    ADD CONSTRAINT orders_list_pkey PRIMARY KEY (list_id, item_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: restaurant_owner restaurant_owner_email_address_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_owner
    ADD CONSTRAINT restaurant_owner_email_address_key UNIQUE (email_address);


--
-- Name: restaurant_owner restaurant_owner_pan_number_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_owner
    ADD CONSTRAINT restaurant_owner_pan_number_key UNIQUE (pan_number);


--
-- Name: restaurant_owner restaurant_owner_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_owner
    ADD CONSTRAINT restaurant_owner_pkey PRIMARY KEY (id);


--
-- Name: restaurant_owner restaurant_owner_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_owner
    ADD CONSTRAINT restaurant_owner_refresh_token_key UNIQUE (refresh_token);


--
-- Name: restaurant restaurant_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant
    ADD CONSTRAINT restaurant_pkey PRIMARY KEY (restaurant_id);


--
-- Name: restaurant_query restaurant_query_pkey; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_query
    ADD CONSTRAINT restaurant_query_pkey PRIMARY KEY (query_id);


--
-- Name: restaurant_query restaurant_query_restaurant_id_question_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_query
    ADD CONSTRAINT restaurant_query_restaurant_id_question_key UNIQUE (restaurant_id, question);


--
-- Name: restaurant restaurant_registration_no_key; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant
    ADD CONSTRAINT restaurant_registration_no_key UNIQUE (registration_no);


--
-- Name: customer_address unique_address; Type: CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT unique_address UNIQUE (latitude, longitude, display_address);


--
-- Name: food_name_trgm_idx; Type: INDEX; Schema: public; Owner: cravyn_dummy_owner
--

CREATE INDEX food_name_trgm_idx ON public.food_item USING gin (food_name public.gin_trgm_ops);


--
-- Name: restaurant_name_trgm_idx; Type: INDEX; Schema: public; Owner: cravyn_dummy_owner
--

CREATE INDEX restaurant_name_trgm_idx ON public.restaurant USING gin (name public.gin_trgm_ops);


--
-- Name: unique_default_address_per_customer; Type: INDEX; Schema: public; Owner: cravyn_dummy_owner
--

CREATE UNIQUE INDEX unique_default_address_per_customer ON public.customer_address USING btree (customer_id) WHERE (is_default = true);


--
-- Name: orders assign_delivery_partner_trigger; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER assign_delivery_partner_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.assign_random_delivery_partner();


--
-- Name: cart enforce_single_restaurant_trigger; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER enforce_single_restaurant_trigger BEFORE INSERT OR UPDATE ON public.cart FOR EACH ROW EXECUTE FUNCTION public.enforce_single_restaurant_per_customer();


--
-- Name: orders set_list_id; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER set_list_id BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_unique_list_id();


--
-- Name: customer_address set_single_default_address; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER set_single_default_address BEFORE INSERT OR UPDATE OF is_default ON public.customer_address FOR EACH ROW WHEN ((new.is_default = true)) EXECUTE FUNCTION public.ensure_single_default_address();


--
-- Name: customer trg_convert_dob; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER trg_convert_dob BEFORE INSERT ON public.customer FOR EACH ROW EXECUTE FUNCTION public.convert_dob();


--
-- Name: restaurant_query update_restaurant_query_timestamp; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER update_restaurant_query_timestamp BEFORE UPDATE ON public.restaurant_query FOR EACH ROW EXECUTE FUNCTION public.update_restaurant_query_timestamp();


--
-- Name: orders validate_order_status; Type: TRIGGER; Schema: public; Owner: cravyn_dummy_owner
--

CREATE TRIGGER validate_order_status BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.check_partner_for_delivered();


--
-- Name: cart cart_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- Name: cart cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.food_item(item_id);


--
-- Name: cart cart_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(restaurant_id);


--
-- Name: customer_query customer_query_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_query
    ADD CONSTRAINT customer_query_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- Name: customer_query customer_query_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_query
    ADD CONSTRAINT customer_query_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.management_team(id);


--
-- Name: customer_address fk_customer; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.customer_address
    ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;


--
-- Name: orders fk_orders_address; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES public.customer_address(address_id) ON DELETE RESTRICT;


--
-- Name: food_item food_item_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.food_item
    ADD CONSTRAINT food_item_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(restaurant_id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- Name: orders_list orders_list_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders_list
    ADD CONSTRAINT orders_list_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.food_item(item_id);


--
-- Name: orders_list orders_list_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders_list
    ADD CONSTRAINT orders_list_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.orders(list_id);


--
-- Name: orders orders_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partner(id);


--
-- Name: orders orders_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(restaurant_id);


--
-- Name: restaurant restaurant_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant
    ADD CONSTRAINT restaurant_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.restaurant_owner(id);


--
-- Name: restaurant_query restaurant_query_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_query
    ADD CONSTRAINT restaurant_query_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.management_team(id);


--
-- Name: restaurant_query restaurant_query_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cravyn_dummy_owner
--

ALTER TABLE ONLY public.restaurant_query
    ADD CONSTRAINT restaurant_query_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(restaurant_id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

