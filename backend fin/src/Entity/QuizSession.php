<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * A user’s live attempt at a quiz.
 */
#[ORM\Entity(repositoryClass: \App\Repository\QuizSessionRepository::class)]
class QuizSession
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column(type:"integer")]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity:Quiz::class)]
    #[ORM\JoinColumn(nullable:false)]
    private Quiz $quiz;

    #[ORM\Column(type:"integer")]
    private int $userId;

    #[ORM\Column(type:"boolean")]
    private bool $locked = false;

    #[ORM\Column(type:"datetime")]
    private \DateTimeInterface $startedAt;

    public function __construct(Quiz $quiz, int $userId)
    {
        $this->quiz      = $quiz;
        $this->userId    = $userId;
        $this->startedAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getQuiz(): Quiz { return $this->quiz; }
    public function getUserId(): int { return $this->userId; }
    public function isLocked(): bool { return $this->locked; }
    public function setLocked(bool $locked): self { $this->locked = $locked; return $this; }
}
