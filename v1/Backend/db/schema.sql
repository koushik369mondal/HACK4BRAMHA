-- NaiyakSetu Database Schema for Supabase
-- This script creates all necessary tables for the complaint management system
-- Consolidated schema file - contains all database setup in one place

-- ============================================================================
-- 1. EXTENSIONS AND BASIC SETUP
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. USER PROFILES TABLE (Updated Structure)
-- ============================================================================

-- Drop existing user_profiles table if it exists to ensure clean structure
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with correct structure that works with Supabase Auth
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Add RLS (Row Level Security) policies for Supabase
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Allow users to read their own profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own profiles
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. MAIN COMPLAINT SYSTEM TABLES
-- ============================================================================

-- Complaints table (main table first)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'submitted',
    reporter_type VARCHAR(20) DEFAULT 'anonymous',
    contact_method VARCHAR(20) DEFAULT 'email',
    phone VARCHAR(20),
    location_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_formatted TEXT,
    user_id UUID REFERENCES user_profiles(user_id),
    assigned_to UUID REFERENCES user_profiles(user_id),
    department VARCHAR(100),
    estimated_resolution_date DATE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Aadhaar data (for verified complaints)
CREATE TABLE IF NOT EXISTS complaint_aadhaar_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    aadhaar_number VARCHAR(12) NOT NULL,
    name VARCHAR(255),
    gender VARCHAR(10),
    state VARCHAR(100),
    district VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint attachments
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_path TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint status history
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES user_profiles(user_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments/Updates table
CREATE TABLE IF NOT EXISTS complaint_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. SUPPORTING TABLES
-- ============================================================================

-- OTP codes table (for verification)
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'verification',
    otp_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    head_id UUID REFERENCES user_profiles(user_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Complaints indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(location_latitude, location_longitude);
CREATE INDEX IF NOT EXISTS idx_complaint_id ON complaints(complaint_id);

-- Supporting table indexes
CREATE INDEX IF NOT EXISTS idx_attachments_complaint_id ON complaint_attachments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint_id ON complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON otp_codes(otp_expiry);

-- ============================================================================
-- 6. DEFAULT DATA INSERTION
-- ============================================================================

-- ============================================================================
-- 6. DEFAULT DATA INSERTION
-- ============================================================================

-- Insert default departments (ignore if they already exist)
INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Roads & Infrastructure', 'Handles road maintenance, potholes, and infrastructure issues', 'roads@NaiyakSetu.gov', '+91-1234567801'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Roads & Infrastructure');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Water Supply', 'Manages water supply, quality, and distribution issues', 'water@NaiyakSetu.gov', '+91-1234567802'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Water Supply');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Electricity', 'Handles power outages, electrical faults, and billing issues', 'electricity@NaiyakSetu.gov', '+91-1234567803'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Electricity');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Sanitation & Waste', 'Manages garbage collection, waste disposal, and cleanliness', 'sanitation@NaiyakSetu.gov', '+91-1234567804'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sanitation & Waste');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Public Safety', 'Handles safety concerns, security, and emergency services', 'safety@NaiyakSetu.gov', '+91-1234567805'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Public Safety');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Traffic & Transportation', 'Manages traffic issues, public transport, and parking', 'traffic@NaiyakSetu.gov', '+91-1234567806'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Traffic & Transportation');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Environment', 'Handles pollution, environmental concerns, and green initiatives', 'environment@NaiyakSetu.gov', '+91-1234567807'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Environment');

INSERT INTO departments (name, description, contact_email, contact_phone) 
SELECT 'Health Services', 'Manages public health facilities and medical services', 'health@NaiyakSetu.gov', '+91-1234567808'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Health Services');

-- ============================================================================
-- 7. DEVELOPMENT HELPERS (Remove in production)
-- ============================================================================

-- For development: Confirm all emails (remove this in production)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        UPDATE auth.users 
        SET email_confirmed_at = CURRENT_TIMESTAMP 
        WHERE email_confirmed_at IS NULL;
        
        RAISE NOTICE 'Development: All emails confirmed automatically';
    END IF;
END $$;

-- ============================================================================
-- 8. TABLE COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'User profiles linked to Supabase auth.users - stores app-specific user data';
COMMENT ON TABLE complaints IS 'Main complaints table storing citizen grievances';
COMMENT ON TABLE complaint_aadhaar_data IS 'Stores Aadhaar verification data for verified complaints';
COMMENT ON TABLE complaint_attachments IS 'Stores file attachments for complaints';
COMMENT ON TABLE complaint_status_history IS 'Tracks status changes and updates for complaints';
COMMENT ON TABLE departments IS 'Government departments handling different complaint categories';
COMMENT ON TABLE otp_codes IS 'Stores OTP codes for phone verification';
COMMENT ON TABLE complaint_comments IS 'Stores comments and updates on complaints';

-- ============================================================================
-- 9. COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ NaiyakSetu Database Schema Setup Complete!';
    RAISE NOTICE '📊 Created: user_profiles, complaints, departments, and 5 supporting tables';
    RAISE NOTICE '🔧 Added: Indexes, RLS policies, and default departments';
    RAISE NOTICE '🚀 Ready for: User registration, complaint submission, and admin management';
END $$;