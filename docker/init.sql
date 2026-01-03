-- JK Jewels Database Initialization Script
-- This runs automatically when PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE user_role AS ENUM ('customer', 'admin');

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'JK Jewels database initialized successfully!';
END $$;
