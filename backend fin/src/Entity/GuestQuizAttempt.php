<?php
// src/Entity/GuestQuizAttempt.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class GuestQuizAttempt
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column(type: "integer")]
    private ?int $id = null;

    #[ORM\Column(type: "string")]
    private string $email;

    #[ORM\ManyToOne(targetEntity: Quiz::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Quiz $quiz;

    #[ORM\Column(type: "integer")]
    private int $scorePoints;

    #[ORM\Column(type: "integer")]
    private int $correctAnswers;

    #[ORM\Column(type: "json")]
    private array $userAnswer = [];

    #[ORM\Column(type: "datetime")]
    private \DateTimeInterface $dateCreation;

    public function __construct(string $email, Quiz $quiz, int $scorePoints, int $correctAnswers, array $userAnswer)
    {
        $this->email = $email;
        $this->quiz = $quiz;
        $this->scorePoints = $scorePoints;
        $this->correctAnswers = $correctAnswers;
        $this->userAnswer = $userAnswer;
        $this->dateCreation = new \DateTime();
    }

    // Getters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getQuiz(): Quiz
    {
        return $this->quiz;
    }

    public function getScorePoints(): int
    {
        return $this->scorePoints;
    }

    public function getCorrectAnswers(): int
    {
        return $this->correctAnswers;
    }

    public function getUserAnswer(): array
    {
        return $this->userAnswer;
    }

    public function getDateCreation(): \DateTimeInterface
    {
        return $this->dateCreation;
    }

    // Setters
    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function setQuiz(Quiz $quiz): self
    {
        $this->quiz = $quiz;
        return $this;
    }

    public function setScorePoints(int $scorePoints): self
    {
        $this->scorePoints = $scorePoints;
        return $this;
    }

    public function setCorrectAnswers(int $correctAnswers): self
    {
        $this->correctAnswers = $correctAnswers;
        return $this;
    }

    public function setUserAnswer(array $userAnswer): self
    {
        $this->userAnswer = $userAnswer;
        return $this;
    }

    public function setDateCreation(\DateTimeInterface $dateCreation): self
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    // Additional utility methods
    public function addUserAnswer(string $questionId, mixed $answer): self
    {
        $this->userAnswer[$questionId] = $answer;
        return $this;
    }

    public function removeUserAnswer(string $questionId): self
    {
        unset($this->userAnswer[$questionId]);
        return $this;
    }

    public function getUserAnswerForQuestion(string $questionId): mixed
    {
        return $this->userAnswer[$questionId] ?? null;
    }

    public function getScorePercentage(): float
    {
        $totalQuestions = count($this->userAnswer);
        if ($totalQuestions === 0) {
            return 0.0;
        }
        return round(($this->correctAnswers / $totalQuestions) * 100, 2);
    }

    public function hasPassedQuiz(int $passingScore = 70): bool
    {
        return $this->getScorePercentage() >= $passingScore;
    }

    public function __toString(): string
    {
        return sprintf(
            'Quiz attempt by %s on %s (Score: %d/%d)',
            $this->email,
            $this->dateCreation->format('Y-m-d H:i:s'),
            $this->correctAnswers,
            count($this->userAnswer)
        );
    }
}