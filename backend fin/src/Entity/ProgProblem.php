<?php

namespace App\Entity;

use App\Repository\ProgProblemRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * ProgProblem Entity
 * 
 * Represents a programming problem/assignment that contains multiple tasks.
 * This is equivalent to the Quiz entity in the Quiz system.
 */
#[ORM\Entity(repositoryClass: ProgProblemRepository::class)]
class ProgProblem
{
    /**
     * Primary key identifier
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * The title of the programming problem
     */
    #[ORM\Column(length: 255)]
    private ?string $title = null;

    /**
     * Detailed description of the programming problem
     */
    #[ORM\Column(type: 'text')]
    private ?string $description = null;

    /**
     * Total number of tasks assigned to this programming problem
     * Updated automatically when tasks are assigned/unassigned
     */
    #[ORM\Column(nullable: true)]
    private ?int $nb_tasks = null;

    /**
     * Total points value of this programming problem
     * Sum of all assigned tasks' points
     */
    #[ORM\Column(nullable: true)]
    private ?int $points_total = null;

    /**
     * Start date when this programming problem becomes available
     */
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $date_debut = null;

    /**
     * End date after which this programming problem is no longer available
     */
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $date_fin = null;

    /**
     * The difficulty level of the programming problem: 'easy', 'medium', or 'hard'
     */
    #[ORM\Column(length: 255)]
    private ?string $difficulty = null; // ['easy', 'medium', 'hard']

    /**
     * The programming language for this problem
     */
    #[ORM\ManyToOne(targetEntity: Langages::class)]
    #[ORM\JoinColumn(name: "language_id", referencedColumnName: "id", nullable: true)]
    private ?Langages $language = null;
    
    /**
     * Time limit in minutes for completing the entire problem
     */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $time_limit = null;

    /**
     * Timestamp when this programming problem was created
     */
    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date_creation = null;

    /**
     * Unique code for sharing this programming problem
     * Similar to quiz sharing functionality
     */
    #[ORM\Column(type: 'string', length: 8, nullable: true)]
    private ?string $code = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getNbTasks(): ?int
    {
        return $this->nb_tasks;
    }

    public function setNbTasks(?int $nb_tasks): static
    {
        $this->nb_tasks = $nb_tasks;
        return $this;
    }

    public function getPointsTotal(): ?int
    {
        return $this->points_total;
    }

    public function setPointsTotal(?int $points_total): static
    {
        $this->points_total = $points_total;
        return $this;
    }

    public function getDifficulty(): ?string
    {
        return $this->difficulty;
    }

    public function setDifficulty(string $difficulty): static
    {
        $this->difficulty = $difficulty;
        return $this;
    }
    
    public function getLanguage(): ?Langages
    {
        return $this->language;
    }

    public function setLanguage(?Langages $language): static
    {
        $this->language = $language;
        return $this;
    }
    
    public function getTimeLimit(): ?int
    {
        return $this->time_limit;
    }

    public function setTimeLimit(?int $time_limit): static
    {
        $this->time_limit = $time_limit;
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

    public function getDateDebut(): ?\DateTimeInterface
    {
        return $this->date_debut;
    }
    
    public function setDateDebut(?\DateTimeInterface $date_debut): static
    {
        $this->date_debut = $date_debut;
        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->date_fin;
    }

    public function setDateFin(?\DateTimeInterface $date_fin): static
    {
        $this->date_fin = $date_fin;
        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(?string $code): self
    {
        $this->code = $code;
        return $this;
    }
} 