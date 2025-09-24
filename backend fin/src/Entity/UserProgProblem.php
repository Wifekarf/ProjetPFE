<?php

namespace App\Entity;

use App\Repository\UserProgProblemRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * UserProgProblem Entity
 * 
 * Represents a user's submission for a programming problem.
 * Stores the code submitted, scores, and evaluation results.
 * This is equivalent to the UserQuiz entity in the Quiz system but with programming-specific fields.
 */
#[ORM\Entity(repositoryClass: UserProgProblemRepository::class)]
#[ORM\Table(name: 'user_prog_problem')]
class UserProgProblem
{
    #[ORM\ManyToOne(targetEntity: TeamSession::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?TeamSession $teamSession = null;

    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    /**
     * The user who submitted this solution
     * Many submissions can belong to one user
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $email = null;
    /**
     * The programming problem this submission is for
     * Many submissions can be for one programming problem
     */
    #[ORM\ManyToOne(targetEntity: ProgProblem::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?ProgProblem $progProblem = null;

    /**
     * Total points scored for this submission
     */
    #[ORM\Column(type: 'integer')]
    private int $scorePoints;

    /**
     * Number of tasks completed successfully in this submission
     */
    #[ORM\Column(type: 'integer')]
    private int $completedTasks;

    /**
     * Timestamp when this submission was created
     */
    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateCreation;

    /**
     * JSON array containing the code submitted for each task
     * Format: { taskId: { code: "...", language: "..." } }
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private array $codeSubmissions = [];
    
    /**
     * JSON array containing the LLM evaluations for each task
     * Format: { taskId: { score: N, feedback: "...", strengths: [...], weaknesses: [...] } }
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private array $llmEvaluations = [];

    /**
     * Constructor - initializes creation date to current timestamp
     */
    public function __construct()
    {
        $this->dateCreation = new \DateTime();
    }

    // Getters and setters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getProgProblem(): ?ProgProblem
    {
        return $this->progProblem;
    }

    public function setProgProblem(ProgProblem $progProblem): static
    {
        $this->progProblem = $progProblem;
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

    public function getCompletedTasks(): int
    {
        return $this->completedTasks;
    }

    public function setCompletedTasks(int $completedTasks): static
    {
        $this->completedTasks = $completedTasks;
        return $this;
    }

    public function getDateCreation(): \DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function getTeamSession(): ?TeamSession
    {
        return $this->teamSession;
    }

    public function setTeamSession(?TeamSession $teamSession): static
    {
        $this->teamSession = $teamSession;
        return $this;
    }

    public function setDateCreation(\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    public function getCodeSubmissions(): array
    {
        return $this->codeSubmissions;
    }
    
    public function setCodeSubmissions(array $codeSubmissions): static
    {
        $this->codeSubmissions = $codeSubmissions;
        return $this;
    }
    
    public function getLlmEvaluations(): array
    {
        return $this->llmEvaluations;
    }
    
    public function setLlmEvaluations(array $llmEvaluations): static
    {
        $this->llmEvaluations = $llmEvaluations;
        return $this;
    }

        public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;
        return $this;
    }
} 