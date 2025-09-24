<?php

namespace App\Entity;

use App\Repository\MixedTestTaskRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * MixedTestTask Entity
 * 
 * Junction entity that connects mixed tests with tasks.
 * Represents the assignment of tasks to mixed tests.
 * This follows the same pattern as ProgProblemTask entity.
 */
#[ORM\Entity(repositoryClass: MixedTestTaskRepository::class)]
#[ORM\Table(name: 'mixed_test_task')]
class MixedTestTask
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: MixedTest::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?MixedTest $mixedTest = null;

    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Task $task = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date_creation = null;

    public function __construct()
    {
        $this->date_creation = new \DateTime();
    }

    // Getters and Setters
    public function getId(): ?int
    {
        return $this->id;
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