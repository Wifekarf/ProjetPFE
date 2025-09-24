-- Simple MixedTest tables creation
-- Run this in phpMyAdmin

-- MixedTest table
CREATE TABLE IF NOT EXISTS mixed_test (
    id INT AUTO_INCREMENT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT DEFAULT NULL,
    difficulty VARCHAR(20) NOT NULL,
    points_total INT NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    nb_questions INT NOT NULL,
    nb_tasks INT NOT NULL,
    primary_language_id INT DEFAULT NULL,
    date_creation DATETIME NOT NULL,
    PRIMARY KEY(id),
    INDEX IDX_MIXED_TEST_LANGUAGE (primary_language_id),
    CONSTRAINT FK_MIXED_TEST_LANGUAGE FOREIGN KEY (primary_language_id) REFERENCES langages (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB;

-- MixedTestQuestion junction table
CREATE TABLE IF NOT EXISTS mixed_test_question (
    id INT AUTO_INCREMENT NOT NULL,
    mixed_test_id INT NOT NULL,
    question_id INT NOT NULL,
    date_creation DATETIME NOT NULL,
    PRIMARY KEY(id),
    INDEX IDX_MIXED_TEST_QUESTION_TEST (mixed_test_id),
    INDEX IDX_MIXED_TEST_QUESTION_QUESTION (question_id),
    CONSTRAINT FK_MIXED_TEST_QUESTION_TEST FOREIGN KEY (mixed_test_id) REFERENCES mixed_test (id),
    CONSTRAINT FK_MIXED_TEST_QUESTION_QUESTION FOREIGN KEY (question_id) REFERENCES question (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB;

-- MixedTestTask junction table
CREATE TABLE IF NOT EXISTS mixed_test_task (
    id INT AUTO_INCREMENT NOT NULL,
    mixed_test_id INT NOT NULL,
    task_id INT NOT NULL,
    date_creation DATETIME NOT NULL,
    PRIMARY KEY(id),
    INDEX IDX_MIXED_TEST_TASK_TEST (mixed_test_id),
    INDEX IDX_MIXED_TEST_TASK_TASK (task_id),
    CONSTRAINT FK_MIXED_TEST_TASK_TEST FOREIGN KEY (mixed_test_id) REFERENCES mixed_test (id),
    CONSTRAINT FK_MIXED_TEST_TASK_TASK FOREIGN KEY (task_id) REFERENCES task (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB;

-- AffectUserMixedTest assignment table
CREATE TABLE IF NOT EXISTS affect_user_mixed_test (
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    mixed_test_id INT NOT NULL,
    date_affectation DATETIME NOT NULL,
    nombre_passed INT DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    PRIMARY KEY(id),
    INDEX IDX_AFFECT_USER_MIXED_TEST_USER (user_id),
    INDEX IDX_AFFECT_USER_MIXED_TEST_TEST (mixed_test_id),
    CONSTRAINT FK_AFFECT_USER_MIXED_TEST_USER FOREIGN KEY (user_id) REFERENCES user (id),
    CONSTRAINT FK_AFFECT_USER_MIXED_TEST_TEST FOREIGN KEY (mixed_test_id) REFERENCES mixed_test (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB; 