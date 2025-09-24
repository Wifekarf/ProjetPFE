<?php

namespace App\Entity;

use App\Repository\MixedTestRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

/**
 * MixedTest Entity
 * 
 * Represents a mixed test that contains both quiz questions and programming tasks.
 * This combines the functionality of Quiz and ProgProblem entities.
 */
#[ORM\Entity(repositoryClass: MixedTestRepository::class)]
class MixedTest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column(type: 'text')]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    private ?string $difficulty = null; // ['easy', 'medium', 'hard']

    #[ORM\Column(nullable: true)]
    private ?int $points_total = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date_creation = null;

    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'mixed'])]
    private string $testType = 'mixed'; // ['mixed', 'quiz', 'programming']

    #[ORM\Column(nullable: true)]
    private ?int $nb_questions = null;

    #[ORM\Column(nullable: true)]
    private ?int $nb_tasks = null;

    #[ORM\ManyToOne(targetEntity: Langages::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Langages $primaryLanguage = null;

    // Relationships
    #[ORM\OneToMany(targetEntity: MixedTestQuestion::class, mappedBy: 'mixedTest', cascade: ['persist', 'remove'])]
    private Collection $questions;

    #[ORM\OneToMany(targetEntity: MixedTestTask::class, mappedBy: 'mixedTest', cascade: ['persist', 'remove'])]
    private Collection $tasks;

    #[ORM\OneToMany(targetEntity: AffectUserMixedTest::class, mappedBy: 'mixedTest', cascade: ['persist', 'remove'])]
    private Collection $userAssignments;

    public function __construct()
    {
        $this->date_creation = new \DateTime();
        $this->questions = new ArrayCollection();
        $this->tasks = new ArrayCollection();
        $this->userAssignments = new ArrayCollection();
    }

    // Getters and Setters
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

    public function getDifficulty(): ?string
    {
        return $this->difficulty;
    }

    public function setDifficulty(string $difficulty): static
    {
        $this->difficulty = $difficulty;
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

    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(\DateTimeInterface $date_creation): static
    {
        $this->date_creation = $date_creation;
        return $this;
    }

    public function getTestType(): string
    {
        return $this->testType;
    }

    public function setTestType(string $testType): static
    {
        $this->testType = $testType;
        return $this;
    }

    public function getNbQuestions(): ?int
    {
        return $this->nb_questions;
    }

    public function setNbQuestions(?int $nb_questions): static
    {
        $this->nb_questions = $nb_questions;
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

    public function getPrimaryLanguage(): ?Langages
    {
        return $this->primaryLanguage;
    }

    public function setPrimaryLanguage(?Langages $primaryLanguage): static
    {
        $this->primaryLanguage = $primaryLanguage;
        return $this;
    }

    /**
     * @return Collection<int, MixedTestQuestion>
     */
    public function getQuestions(): Collection
    {
        return $this->questions;
    }

    public function addQuestion(MixedTestQuestion $question): static
    {
        if (!$this->questions->contains($question)) {
            $this->questions->add($question);
            $question->setMixedTest($this);
        }

        return $this;
    }

    public function removeQuestion(MixedTestQuestion $question): static
    {
        if ($this->questions->removeElement($question)) {
            if ($question->getMixedTest() === $this) {
                $question->setMixedTest(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, MixedTestTask>
     */
    public function getTasks(): Collection
    {
        return $this->tasks;
    }

    public function addTask(MixedTestTask $task): static
    {
        if (!$this->tasks->contains($task)) {
            $this->tasks->add($task);
            $task->setMixedTest($this);
        }

        return $this;
    }

    public function removeTask(MixedTestTask $task): static
    {
        if ($this->tasks->removeElement($task)) {
            if ($task->getMixedTest() === $this) {
                $task->setMixedTest(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, AffectUserMixedTest>
     */
    public function getUserAssignments(): Collection
    {
        return $this->userAssignments;
    }

    public function addUserAssignment(AffectUserMixedTest $userAssignment): static
    {
        if (!$this->userAssignments->contains($userAssignment)) {
            $this->userAssignments->add($userAssignment);
            $userAssignment->setMixedTest($this);
        }

        return $this;
    }

    public function removeUserAssignment(AffectUserMixedTest $userAssignment): static
    {
        if ($this->userAssignments->removeElement($userAssignment)) {
            if ($userAssignment->getMixedTest() === $this) {
                $userAssignment->setMixedTest(null);
            }
        }

        return $this;
    }
} 