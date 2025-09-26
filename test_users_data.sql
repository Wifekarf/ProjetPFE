-- Test Users Data for Symfony Quiz Application
-- Run this SQL script in your database to insert test users
-- This will help you test the registration functionality

-- First, let's ensure the user table has all required columns
-- (Run this only if you haven't run the migration scripts yet)

-- Add missing columns to User table (only if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user' 
     AND COLUMN_NAME = 'cv') = 0,
    'ALTER TABLE user ADD COLUMN cv VARCHAR(255) DEFAULT NULL',
    'SELECT "cv column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user' 
     AND COLUMN_NAME = 'profile_attributes') = 0,
    'ALTER TABLE user ADD COLUMN profile_attributes JSON DEFAULT NULL',
    'SELECT "profile_attributes column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user' 
     AND COLUMN_NAME = 'rank') = 0,
    'ALTER TABLE user ADD COLUMN rank VARCHAR(20) DEFAULT "JUNIOR"',
    'SELECT "rank column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'user' 
     AND COLUMN_NAME = 'status') = 0,
    'ALTER TABLE user ADD COLUMN status VARCHAR(20) DEFAULT "active"',
    'SELECT "status column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clear existing test users (optional - remove this if you want to keep existing data)
DELETE FROM user WHERE email LIKE '%@test.com' OR username LIKE 'test%';

-- Insert test users with hashed passwords
-- Password for all test users is: "password123"
-- These are bcrypt hashed passwords

INSERT INTO user (
    username, 
    email, 
    password, 
    role, 
    rank, 
    points_total_all, 
    date_creation, 
    status, 
    image, 
    cv, 
    profile_attributes
) VALUES 
-- Test User 1 - Regular User
(
    'testuser1',
    'testuser1@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'JUNIOR',
    0,
    NOW(),
    'active',
    NULL,
    NULL,
    '{"bio": "Test user for development", "skills": ["PHP", "Symfony", "JavaScript"]}'
),

-- Test User 2 - Admin User
(
    'admin',
    'admin@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_ADMIN',
    'SENIOR',
    1000,
    NOW(),
    'active',
    'admin-avatar.png',
    'admin-cv.pdf',
    '{"bio": "System administrator", "skills": ["PHP", "Symfony", "Docker", "Jenkins", "SonarQube"]}'
),

-- Test User 3 - Team Manager
(
    'teammanager',
    'manager@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_TEAM_MANAGER',
    'SENIOR',
    750,
    NOW(),
    'active',
    'manager-avatar.png',
    'manager-cv.pdf',
    '{"bio": "Team manager for quiz platform", "skills": ["PHP", "Symfony", "Team Management", "Project Management"]}'
),

-- Test User 4 - Junior Developer
(
    'juniordev',
    'junior@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'JUNIOR',
    250,
    NOW(),
    'active',
    NULL,
    NULL,
    '{"bio": "Junior developer learning", "skills": ["PHP", "JavaScript", "HTML", "CSS"]}'
),

-- Test User 5 - Senior Developer
(
    'seniordev',
    'senior@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'SENIOR',
    1200,
    NOW(),
    'active',
    'senior-avatar.png',
    'senior-cv.pdf',
    '{"bio": "Senior developer with experience", "skills": ["PHP", "Symfony", "React", "Docker", "AWS", "Microservices"]}'
),

-- Test User 6 - Alternate User
(
    'alternateuser',
    'alternate@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'ALTERNATE',
    500,
    NOW(),
    'active',
    NULL,
    NULL,
    '{"bio": "Alternate user for testing", "skills": ["PHP", "Symfony", "Testing"]}'
),

-- Test User 7 - Inactive User
(
    'inactiveuser',
    'inactive@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'JUNIOR',
    100,
    NOW(),
    'inactive',
    NULL,
    NULL,
    '{"bio": "Inactive test user", "skills": ["PHP"]}'
),

-- Test User 8 - High Points User
(
    'champion',
    'champion@test.com',
    '$2y$13$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    'ROLE_USER',
    'SENIOR',
    5000,
    NOW(),
    'active',
    'champion-avatar.png',
    'champion-cv.pdf',
    '{"bio": "Quiz champion with high scores", "skills": ["PHP", "Symfony", "React", "Node.js", "Python", "Machine Learning"]}'
);

-- Verify the inserted users
SELECT 
    id,
    username,
    email,
    role,
    rank,
    points_total_all,
    status,
    date_creation
FROM user 
WHERE email LIKE '%@test.com' 
ORDER BY id;

-- Display login credentials for testing
SELECT 
    'Test Users Created Successfully!' as message,
    'Use these credentials to test login:' as instruction,
    'Username: testuser1, Email: testuser1@test.com, Password: password123' as user1,
    'Username: admin, Email: admin@test.com, Password: password123' as admin,
    'Username: teammanager, Email: manager@test.com, Password: password123' as manager,
    'Username: juniordev, Email: junior@test.com, Password: password123' as junior,
    'Username: seniordev, Email: senior@test.com, Password: password123' as senior,
    'Username: alternateuser, Email: alternate@test.com, Password: password123' as alternate,
    'Username: champion, Email: champion@test.com, Password: password123' as champion;
