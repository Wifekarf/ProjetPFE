<?php

namespace App\Entity;

use App\Repository\AffectUserMixedTestRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * AffectUserMixedTest Entity
 * 
 * Junction entity that connects users with mixed tests.
 * Represents the assignment of mixed tests to users.
 * This follows the same pattern as AffectUserQuiz and AffectUserProgProblem entities.
 */
#[ORM\Entity(repositoryClass: AffectUserMixedTestRepository::class)]
class AffectUserMixedTest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: MixedTest::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?MixedTest $mixedTest = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateAffectation;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $nombrePassed = 0;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => 'pending'])]
    private string $status = 'pending'; // ['pending', 'in progress', 'completed']

    public function __construct()
    {
        $this->dateAffectation = new \DateTime();
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

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getMixedTest(): ?MixedTest
    {
        return $this->mixedTest;
    }

    public function setMixedTest(?MixedTest $mixedTest): static
    {
        $this->mixedTest = $mixedTest;
        return $this;
    }

    public function getDateAffectation(): \DateTimeInterface
    {
        return $this->dateAffectation;
    }

    public function setDateAffectation(\DateTimeInterface $dateAffectation): static
    {
        $this->dateAffectation = $dateAffectation;
        return $this;
    }

    public function getNombrePassed(): int
    {
        return $this->nombrePassed;
    }

    public function setNombrePassed(int $nombrePassed): static
    {
        $this->nombrePassed = $nombrePassed;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }
} 