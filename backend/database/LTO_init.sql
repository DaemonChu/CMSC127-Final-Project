CREATE OR REPLACE USER 'lto_officer'@'localhost'
IDENTIFIED BY 'lto123';

-- =========================
-- CREATE DATABASE
-- =========================

DROP DATABASE IF EXISTS `LTO_IMS_DB`;

CREATE DATABASE IF NOT EXISTS `LTO_IMS_DB`;

GRANT ALL ON LTO_IMS_DB.*
TO 'lto_officer'@'localhost';

USE `LTO_IMS_DB`;

-- =========================
-- CREATE TABLES
-- =========================

-- DRIVER
CREATE TABLE IF NOT EXISTS driver (
    is_archived BOOLEAN DEFAULT FALSE,

    license_number VARCHAR(13) PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    sex ENUM('F', 'M'),

    date_of_birth DATE,

    barangay VARCHAR(50),
    city VARCHAR(50),
    province VARCHAR(50),
    region VARCHAR(50),

    license_type ENUM(
        'student permit',
        'non-professional',
        'professional'
    ) NOT NULL,

    license_status ENUM(
        'valid',
        'expired',
        'suspended',
        'revoked'
    ) NOT NULL,

    license_issuance_date DATE NOT NULL,

    license_expiration_date DATE NOT NULL
);

-- VEHICLE
CREATE TABLE IF NOT EXISTS vehicle (
    is_archived BOOLEAN DEFAULT FALSE,

    MV_number VARCHAR(17) PRIMARY KEY,

    plate_number VARCHAR(12) UNIQUE,

    vehicle_type VARCHAR(50) NOT NULL,

    engine_number VARCHAR(17) UNIQUE,

    chassis_number VARCHAR(17) UNIQUE,

    year INT,

    make VARCHAR(50),

    model VARCHAR(50),

    color VARCHAR(50),

    license_number VARCHAR(13) NOT NULL,

    FOREIGN KEY (license_number)
        REFERENCES driver(license_number)
);

-- VEHICLE REGISTRATION
CREATE TABLE IF NOT EXISTS vehicleRegistration (
    registration_number VARCHAR(9) PRIMARY KEY,

    registration_status ENUM(
        'active',
        'expired',
        'suspended',
        'revoked'
    ) NOT NULL,

    registration_date DATE NOT NULL,

    expiration_date DATE NOT NULL,

    MV_number VARCHAR(17) NOT NULL,

    FOREIGN KEY (MV_number)
        REFERENCES vehicle(MV_number)
);

-- TRAFFIC VIOLATION
CREATE TABLE IF NOT EXISTS trafficViolation (
    is_archived BOOLEAN DEFAULT FALSE,
    violation_ticket_id VARCHAR(15) PRIMARY KEY,

    violation_type VARCHAR(50) NOT NULL,

    violation_status ENUM(
        'unpaid',
        'paid',
        'contested'
    ) NOT NULL,

    barangay VARCHAR(50),

    city VARCHAR(50),

    province VARCHAR(50),

    region VARCHAR(50),

    date DATE NOT NULL,

    fine_amount DECIMAL(10,2) NOT NULL,

    apprehending_officer VARCHAR(100),

    license_number VARCHAR(13),

    MV_number VARCHAR(17),

    FOREIGN KEY (license_number)
        REFERENCES driver(license_number),

    FOREIGN KEY (MV_number)
        REFERENCES vehicle(MV_number)
);