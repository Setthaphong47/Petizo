-- init-postgres.sql
-- SQL script for initializing PostgreSQL database on Vercel

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    profile_image VARCHAR(500),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100),
    breed VARCHAR(255),
    gender VARCHAR(10),
    birth_date DATE,
    weight DECIMAL(10,2),
    color VARCHAR(100),
    microchip_id VARCHAR(255),
    medical_notes TEXT,
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id),
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_type VARCHAR(255),
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian VARCHAR(255),
    clinic_name VARCHAR(255),
    batch_number VARCHAR(255),
    notes TEXT,
    schedule_id INTEGER,
    proof_image VARCHAR(500),
    status VARCHAR(50) DEFAULT 'completed',
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vaccine schedules table
CREATE TABLE IF NOT EXISTS vaccine_schedules (
    id SERIAL PRIMARY KEY,
    vaccine_name VARCHAR(255) NOT NULL,
    age_weeks_min INTEGER NOT NULL,
    age_weeks_max INTEGER,
    is_booster INTEGER DEFAULT 0,
    frequency_years INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id INTEGER REFERENCES users(id),
    category VARCHAR(100),
    tags TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Breeds table
CREATE TABLE IF NOT EXISTS breeds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL,
    description TEXT,
    characteristics TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES ('admin', 'admin@petizo.com', '$2b$10$XzK8qN5YxJxH5QY5qR5qL.5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Admin', 'Petizo', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert test user (password: user123)
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES ('testuser', 'user@petizo.com', '$2b$10$XzK8qN5YxJxH5QY5qR5qL.5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Test', 'User', 'user')
ON CONFLICT (username) DO NOTHING;

-- Insert sample vaccine schedules
INSERT INTO vaccine_schedules (vaccine_name, age_weeks_min, age_weeks_max, is_booster, frequency_years, description)
VALUES 
    ('FVRCP (ครั้งที่ 1)', 6, 8, 0, NULL, 'วัคซีนป้องกันโรคไข้หวัด หวัด และไวรัส'),
    ('FVRCP (ครั้งที่ 2)', 10, 12, 0, NULL, 'วัคซีนป้องกันโรคไข้หวัด หวัด และไวรัส (บูสเตอร์)'),
    ('Rabies (พิษสุนัขบ้า)', 12, 16, 0, 1, 'วัคซีนป้องกันโรคพิษสุนัขบ้า')
ON CONFLICT DO NOTHING;
