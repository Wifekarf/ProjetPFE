<?php

namespace App\Entity;

use App\Repository\UserMixedTestRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * UserMixedTest Entity
 * 
 * Represents a user's submission for a mixed test (questions + programming tasks).
 * Stores the answers, task solutions, scores, and evaluation results.
 * This is equivalent to the UserQuiz entity in the Quiz system but for mixed tests.
 */
#[ORM\Entity(repositoryClass: UserMixedTestRepository::class)]
#[ORM\Table(name: 'user_mixed_test')]
class UserMixedTest
{
    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    /**
     * The user who submitted this test
     * Many submissions can belong to one user
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * The mixed test this submission is for
     * Many submissions can be for one mixed test
     */
    #[ORM\ManyToOne(targetEntity: MixedTest::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?MixedTest $mixedTest = null;

    /**
     * Total points scored for this submission
     */
    #[ORM\Column(type: 'integer')]
    private int $scorePoints;

    /**
     * Maximum possible points for this test
     */
    #[ORM\Column(type: 'integer')]
    private int $maxScore;

    /**
     * Number of correct answers in the quiz section
     */
    #[ORM\Column(type: 'integer')]
    private int $correctAnswers;

    /**
     * Total number of questions in the quiz section
     */
    #[ORM\Column(type: 'integer')]
    private int $totalQuestions;

    /**
     * Number of tasks attempted in the programming section
     */
    #[ORM\Column(type: 'integer')]
    private int $tasksAttempted;

    /**
     * Number of tasks completed successfully
     */
    #[ORM\Column(type: 'integer')]
    private int $tasksCompleted;

    /**
     * Time taken to complete the test in seconds
     */
    #[ORM\Column(type: 'integer')]
    private int $timeTaken;

    /**
     * Whether the user passed the test (60% threshold)
     */
    #[ORM\Column(type: 'boolean')]
    private bool $passed;

    /**
     * JSON array containing user's answers to quiz questions
     */
    #[ORM\Column(type: 'json')]
    private array $answers = [];

    /**
     * JSON array containing user's task solutions
     */
    #[ORM\Column(type: 'json')]
    private array $taskSolutions = [];

    /**
     * JSON array containing LLM evaluations for task solutions
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private array $taskEvaluations = [];

    /**
     * Timestamp when this submission was created
     */
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateCreation;

    public function __construct()
    {
        $this->dateCreation = new \DateTime();
        $this->scorePoints = 0;
        $this->maxScore = 0;
        $this->correctAnswers = 0;
        $this->totalQuestions = 0;
        $this->tasksAttempted = 0;
        $this->tasksCompleted = 0;
        $this->timeTaken = 0;
        $this->passed = false;
        $this->answers = [];
        $this->taskSolutions = [];
        $this->taskEvaluations = [];
    }

    // Getters and Setters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getMixedTest(): ?MixedTest
    {
        return $this->mixedTest;
    }

    public function setMixedTest(MixedTest $mixedTest): static
    {
        $this->mixedTest = $mixedTest;
        return $this;
    }

    public function getScorePoints(): int
    {
        return $this->scorePoints;
    }

    public function setScorePoints(int $scorePoints): static
    {
        $this->scorePoints = $scorePoints;
        return $this;
    }

    public function getMaxScore(): int
    {
        return $this->maxScore;
    }

    public function setMaxScore(int $maxScore): static
    {
        $this->maxScore = $maxScore;
        return $this;
    }

    public function getCorrectAnswers(): int
    {
        return $this->correctAnswers;
    }

    public function setCorrectAnswers(int $correctAnswers): static
    {
        $this->correctAnswers = $correctAnswers;
        return $this;
    }

    public function getTotalQuestions(): int
    {
        return $this->totalQuestions;
    }

    public function setTotalQuestions(int $totalQuestions): static
    {
        $this->totalQuestions = $totalQuestions;
        return $this;
    }

    public function getTasksAttempted(): int
    {
        return $this->tasksAttempted;
    }

    public function setTasksAttempted(int $tasksAttempted): static
    {
        $this->tasksAttempted = $tasksAttempted;
        return $this;
    }

    public function getTasksCompleted(): int
    {
        return $this->tasksCompleted;
    }

    public function setTasksCompleted(int $tasksCompleted): static
    {
        $this->tasksCompleted = $tasksCompleted;
        return $this;
    }

    public function getTimeTaken(): int
    {
        return $this->timeTaken;
    }

    public function setTimeTaken(int $timeTaken): static
    {
        $this->timeTaken = $timeTaken;
        return $this;
    }

    public function isPassed(): bool
    {
        return $this->passed;
    }

    public function setPassed(bool $passed): static
    {
        $this->passed = $passed;
        return $this;
    }

    public function getAnswers(): array
    {
        return $this->answers;
    }

    public function setAnswers(array $answers): static
    {
        $this->answers = $answers;
        return $this;
    }

    public function getTaskSolutions(): array
    {
        return $this->taskSolutions;
    }

    public function setTaskSolutions(array $taskSolutions): static
    {
        $this->taskSolutions = $taskSolutions;
        return $this;
    }

    public function getTaskEvaluations(): array
    {
        return $this->taskEvaluations;
    }

    public function setTaskEvaluations(array $taskEvaluations): static
    {
        $this->taskEvaluations = $taskEvaluations;
        return $this;
    }

    public function getDateCreation(): \DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    /**
     * Calculate the percentage score
     */
    public function getScorePercentage(): float
    {
        if ($this->maxScore === 0) {
            return 0.0;
        }
        return round(($this->scorePoints / $this->maxScore) * 100, 2);
    }

    /**
     * Check if the user passed the test (60% threshold)
     */
    public function hasPassedTest(int $passingScore = 60): bool
    {
        return $this->getScorePercentage() >= $passingScore;
    }

    /**
     * Get the percentage of correct answers in the quiz section
     */
    public function getQuizAccuracy(): float
    {
        if ($this->totalQuestions === 0) {
            return 0.0;
        }
        return round(($this->correctAnswers / $this->totalQuestions) * 100, 2);
    }

    /**
     * Get the percentage of completed tasks
     */
    public function getTaskCompletionRate(): float
    {
        if ($this->tasksAttempted === 0) {
            return 0.0;
        }
        return round(($this->tasksCompleted / $this->tasksAttempted) * 100, 2);
    }

    public function __toString(): string
    {
        return sprintf(
            'Mixed test submission by %s on %s (Score: %d/%d, %s)',
            $this->user ? $this->user->getUsername() : 'Unknown',
            $this->dateCreation->format('Y-m-d H:i:s'),
            $this->scorePoints,
            $this->maxScore,
            $this->passed ? 'PASSED' : 'FAILED'
        );
    }
} 