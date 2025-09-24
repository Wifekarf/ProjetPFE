<?php

namespace App\Entity;

use App\Repository\AffectUserQuizRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AffectUserQuizRepository::class)]

class AffectUserQuiz
{
    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $answeredCount = 0;

    public function getAnsweredCount(): int
    {
        return $this->answeredCount;
    }

    public function setAnsweredCount(int $count): self
    {
        $this->answeredCount = $count;
        return $this;
    }

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Quiz::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Quiz $quiz = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateAffectation;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $nombrePassed = 0;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => 'pending'])]
    private string $status = 'pending'; 

    #[ORM\ManyToOne(targetEntity: TeamSession::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?TeamSession $teamSession = null;

    public function __construct()
    {
        $this->dateAffectation = new \DateTime();
    }

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

    public function getQuiz(): ?Quiz
    {
        return $this->quiz;
    }

    public function setQuiz(?Quiz $quiz): static
    {
        $this->quiz = $quiz;
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

    public function getTeamSession(): ?TeamSession
    {
        return $this->teamSession;
    }

    public function setTeamSession(?TeamSession $teamSession): static
    {
        $this->teamSession = $teamSession;
        return $this;
    }

}
