<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250807124256 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem CHANGE user_id user_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem ADD CONSTRAINT FK_D3EA31DB5FE69E1A FOREIGN KEY (team_session_id) REFERENCES team_session (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_D3EA31DB5FE69E1A ON affect_user_prog_problem (team_session_id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem ADD CONSTRAINT FK_27B2EDE582F1BAF4 FOREIGN KEY (language_id) REFERENCES langages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task ADD CONSTRAINT FK_D765E26F7D7885D FOREIGN KEY (prog_problem_id) REFERENCES prog_problem (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task ADD CONSTRAINT FK_D765E26F8DB60186 FOREIGN KEY (task_id) REFERENCES task (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit CHANGE type type VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit ADD CONSTRAINT FK_6E6B86F9613FECDF FOREIGN KEY (session_id) REFERENCES quiz_session (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit RENAME INDEX session_id TO IDX_6E6B86F9613FECDF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session DROP email, CHANGE locked locked TINYINT(1) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session ADD CONSTRAINT FK_C21E7874853CD175 FOREIGN KEY (quiz_id) REFERENCES quiz (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session RENAME INDEX quiz_id TO IDX_C21E7874853CD175
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_RESET_PASSWORD_REQUEST_SELECTOR ON reset_password_request
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request CHANGE selector selector VARCHAR(20) NOT NULL, CHANGE hashed_token hashed_token VARCHAR(100) NOT NULL, CHANGE requested_at requested_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', CHANGE expires_at expires_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)'
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request ADD CONSTRAINT FK_7CE748AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request RENAME INDEX idx_reset_password_request_user TO IDX_7CE748AA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem ADD team_session_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem ADD CONSTRAINT FK_A77E91E75FE69E1A FOREIGN KEY (team_session_id) REFERENCES team_session (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_A77E91E75FE69E1A ON user_prog_problem (team_session_id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD team_session_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD CONSTRAINT FK_DE93B65B5FE69E1A FOREIGN KEY (team_session_id) REFERENCES team_session (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD CONSTRAINT FK_DE93B65BA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz ADD CONSTRAINT FK_DE93B65B853CD175 FOREIGN KEY (quiz_id) REFERENCES quiz (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_DE93B65B5FE69E1A ON user_quiz (team_session_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem DROP FOREIGN KEY FK_A77E91E75FE69E1A
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_A77E91E75FE69E1A ON user_prog_problem
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_prog_problem DROP team_session_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session DROP FOREIGN KEY FK_C21E7874853CD175
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session ADD email VARCHAR(255) DEFAULT NULL, CHANGE locked locked TINYINT(1) DEFAULT 0 NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_session RENAME INDEX idx_c21e7874853cd175 TO quiz_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task DROP FOREIGN KEY FK_D765E26F7D7885D
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem_task DROP FOREIGN KEY FK_D765E26F8DB60186
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP FOREIGN KEY FK_DE93B65B5FE69E1A
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP FOREIGN KEY FK_DE93B65BA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP FOREIGN KEY FK_DE93B65B853CD175
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_DE93B65B5FE69E1A ON user_quiz
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_quiz DROP team_session_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE prog_problem DROP FOREIGN KEY FK_27B2EDE582F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit DROP FOREIGN KEY FK_6E6B86F9613FECDF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit CHANGE type type VARCHAR(100) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE quiz_audit RENAME INDEX idx_6e6b86f9613fecdf TO session_id
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request DROP FOREIGN KEY FK_7CE748AA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request CHANGE selector selector VARCHAR(255) NOT NULL, CHANGE hashed_token hashed_token VARCHAR(255) NOT NULL, CHANGE requested_at requested_at DATETIME NOT NULL, CHANGE expires_at expires_at DATETIME NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_RESET_PASSWORD_REQUEST_SELECTOR ON reset_password_request (selector)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reset_password_request RENAME INDEX idx_7ce748aa76ed395 TO IDX_RESET_PASSWORD_REQUEST_USER
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem DROP FOREIGN KEY FK_D3EA31DB5FE69E1A
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_D3EA31DB5FE69E1A ON affect_user_prog_problem
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE affect_user_prog_problem CHANGE user_id user_id INT DEFAULT NULL
        SQL);
    }
}
