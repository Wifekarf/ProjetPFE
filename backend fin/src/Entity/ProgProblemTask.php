<?php

namespace App\Entity;

use App\Repository\ProgProblemTaskRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * ProgProblemTask Entity
 * 
 * Junction entity that connects programming problems with tasks.
 * Represents a many-to-many relationship between ProgProblem and Task entities.
 * This is equivalent to the QuizQuestion entity in the Quiz system.
 */
#[ORM\Entity(repositoryClass: ProgProblemTaskRepository::class)]
#[ORM\Table(name: 'prog_problem_task')]
class ProgProblemTask
{
    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    /**
     * The programming problem this task is assigned to
     * Many tasks can be assigned to one programming problem
     */
    #[ORM\ManyToOne(targetEntity: ProgProblem::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?ProgProblem $progProblem = null;

    /**
     * The task assigned to the programming problem
     * One task can be assigned to many programming problems
     */
    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Task $task = null;

    /**
     * Timestamp when this assignment was created
     */
    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date_creation = null;

    /**
     * Constructor - initializes creation date to current timestamp
     */
    public function __construct()
    {
        $this->date_creation = new \DateTime();
    }

    // Getters and setters
    public function getId(): ?int
    {
        return $this->id;
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

    public function getTask(): ?Task
    {
        return $this->task;
    }

    public function setTask(Task $task): static
    {
        $this->task = $task;
        return $this;
    }

    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(\DateTimeInterface $date_creation): static
    {
        $this->date_creation = $date_creation;
        return $this;
    }
} 