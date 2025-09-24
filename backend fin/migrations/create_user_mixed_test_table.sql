-- Create user_mixed_test table
CREATE TABLE user_mixed_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mixed_test_id INT NOT NULL,
    score_points INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    tasks_attempted INT NOT NULL DEFAULT 0,
    tasks_completed INT NOT NULL DEFAULT 0,
    time_taken INT NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers JSON NOT NULL,
    task_solutions JSON NOT NULL,
    task_evaluations JSON NULL,
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (mixed_test_id) REFERENCES mixed_test(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_user_mixed_test_user (user_id),
    INDEX idx_user_mixed_test_test (mixed_test_id),
    INDEX idx_user_mixed_test_date (date_creation),
    INDEX idx_user_mixed_test_passed (passed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 