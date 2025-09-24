<?php

namespace App\Entity;

use App\Repository\TeamSessionRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: TeamSessionRepository::class)]
class TeamSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Team::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Team $team = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column(type: 'string', length: 32)]
    private string $type; // 'quiz' or 'programming'

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $startDateTime;

    #[ORM\Column(type: 'integer')]
    private int $durationMinutes;

    #[ORM\ManyToMany(targetEntity: Quiz::class)]
    private Collection $quizzes;

    #[ORM\ManyToMany(targetEntity: ProgProblem::class)]
    private Collection $progProblems;

    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_INPROGRESS = 'inprogress';
    public const STATUS_FINISHED = 'finished';
    public const STATUS_CANCELED = 'canceled';
    public const ALLOWED_STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_INPROGRESS,
        self::STATUS_FINISHED,
        self::STATUS_CANCELED,
    ];

    #[ORM\Column(type: 'string', length: 32)]
    private string $status = self::STATUS_SCHEDULED; // scheduled, inprogress, finished, canceled

    public function __construct()
    {
        $this->quizzes = new ArrayCollection();
        $this->progProblems = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTeam(): ?Team { return $this->team; }
    public function setTeam(?Team $team): self { $this->team = $team; return $this; }
    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $user): self { $this->createdBy = $user; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $desc): self { $this->description = $desc; return $this; }
    public function getStartDateTime(): \DateTimeInterface { return $this->startDateTime; }
    public function setStartDateTime(\DateTimeInterface $dt): self { $this->startDateTime = $dt; return $this; }
    public function getDurationMinutes(): int { return $this->durationMinutes; }
    public function setDurationMinutes(int $min): self { $this->durationMinutes = $min; return $this; }
    public function getQuizzes(): Collection { return $this->quizzes; }
    public function addQuiz(Quiz $quiz): self { if (!$this->quizzes->contains($quiz)) $this->quizzes[] = $quiz; return $this; }
    public function removeQuiz(Quiz $quiz): self { $this->quizzes->removeElement($quiz); return $this; }
    public function getProgProblems(): Collection { return $this->progProblems; }
    public function addProgProblem(ProgProblem $prob): self { if (!$this->progProblems->contains($prob)) $this->progProblems[] = $prob; return $this; }
    public function removeProgProblem(ProgProblem $prob): self { $this->progProblems->removeElement($prob); return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): self {
        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            throw new \InvalidArgumentException('Invalid status for TeamSession: ' . $status);
        }
        $this->status = $status;
        return $this;
    }
    public static function getAllowedStatuses(): array {
        return self::ALLOWED_STATUSES;
    }
}
