<?php

namespace App\Entity;

use App\Repository\UserQuizRepository;  // Import the correct repository
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserQuizRepository::class)]  // Specify the repository class
#[ORM\Table(name: 'user_quiz')]
class UserQuiz
{
    #[ORM\ManyToOne(targetEntity: TeamSession::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?TeamSession $teamSession = null;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Quiz::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Quiz $quiz = null;

    #[ORM\Column(type: 'integer')]
    private int $scorePoints;

    #[ORM\Column(type: 'integer')]
    private int $correctAnswers;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $dateCreation;

    #[ORM\Column(type: 'json', nullable: true)]
    private array $userAnswer = [];

    public function __construct()
    {
        $this->dateCreation = new \DateTime();
    }

    // Getters and setters for all properties
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

    public function getUserAnswer(): array
    {
        return $this->userAnswer;
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
    
    public function setUserAnswer(array $userAnswer): static
    {
        $this->userAnswer = $userAnswer;
        return $this;
    }


    public function getQuiz(): ?Quiz
    {
        return $this->quiz;
    }

    public function setQuiz(Quiz $quiz): static
    {
        $this->quiz = $quiz;
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

    public function getCorrectAnswers(): int
    {
        return $this->correctAnswers;
    }

    public function setCorrectAnswers(int $correctAnswers): static
    {
        $this->correctAnswers = $correctAnswers;
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


}
