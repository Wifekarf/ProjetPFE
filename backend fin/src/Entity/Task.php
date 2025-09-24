<?php

namespace App\Entity;

use App\Repository\TaskRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Task Entity
 * 
 * Represents a programming task/exercise that can be assigned to programming problems.
 * Each task has a title, description, difficulty level, and other properties.
 * This is equivalent to the Question entity in the Quiz system.
 */
#[ORM\Entity(repositoryClass: TaskRepository::class)]
class Task
{
    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    /**
     * The title of the task
     * Maps to task_title column in database
     */
    #[ORM\Column(name: "task_title", type: 'string', length: 255)]
    private ?string $title = null;

    /**
     * Detailed description of the task, explaining what needs to be done
     */
    #[ORM\Column(type: 'text')]
    private ?string $description = null;

    /**
     * JSON array containing sample test cases for the task
     * Includes input examples and expected outputs
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private array $sampleTestCases = [];

    /**
     * The model solution code for this task
     * Used by the LLM to evaluate student submissions
     */
    #[ORM\Column(type: 'text')]
    private ?string $modelSolution = null;

    /**
     * The difficulty level of the task: 'easy', 'medium', or 'hard'
     */
    #[ORM\Column(type: 'string', length: 20)]
    private ?string $difficulty = null; // ['easy', 'medium', 'hard']

    /**
     * Point value for completing this task
     */
    #[ORM\Column(type: 'integer')]
    private ?int $points = 0;

    /**
     * The programming language associated with this task
     * Foreign key relationship to Langages entity
     */
    #[ORM\ManyToOne(targetEntity: Langages::class)]
    #[ORM\JoinColumn(name: "language_id", referencedColumnName: "id", nullable: false)]
    private ?Langages $language = null;

    /**
     * Time limit in minutes for completing this task
     */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $time = null; // time limit in minutes

    /**
     * JSON array containing evaluation criteria for grading submissions
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private array $evaluationCriteria = [];

    // Getters & Setters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getSampleTestCases(): array
    {
        return $this->sampleTestCases;
    }

    public function setSampleTestCases(array $sampleTestCases): self
    {
        $this->sampleTestCases = $sampleTestCases;
        return $this;
    }

    public function getModelSolution(): ?string
    {
        return $this->modelSolution;
    }

    public function setModelSolution(string $modelSolution): self
    {
        $this->modelSolution = $modelSolution;
        return $this;
    }

    public function getDifficulty(): ?string
    {
        return $this->difficulty;
    }

    public function setDifficulty(string $difficulty): self
    {
        $this->difficulty = $difficulty;
        return $this;
    }

    public function getPoints(): ?int
    {
        return $this->points;
    }

    public function setPoints(int $points): self
    {
        $this->points = $points;
        return $this;
    }

    public function getLanguage(): ?Langages
    {
        return $this->language;
    }

    public function setLanguage(Langages $language): self
    {
        $this->language = $language;
        return $this;
    }
    
    public function getTime(): ?int
    {
        return $this->time;
    }
    
    public function setTime(int $time): self
    {
        $this->time = $time;
        return $this;
    }
    
    public function getEvaluationCriteria(): array
    {
        return $this->evaluationCriteria;
    }
    
    public function setEvaluationCriteria(array $evaluationCriteria): self
    {
        $this->evaluationCriteria = $evaluationCriteria;
        return $this;
    }
} 