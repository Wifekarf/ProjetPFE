<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'chat_log')]
class ChatLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'text')]
    private string $question;

    #[ORM\Column(type: 'text')]
    private string $answer;

    #[ORM\Column(type: 'string', length: 64)]
    private string $topic;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $userId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'float', options: ['default' => 0])]
    private float $confidence = 0.0;

    #[ORM\Column(type: 'string', length: 16, options: ['default' => 'ai'])]
    private string $source = 'ai'; // 'faq' | 'ai'

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $helpful = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $feedbackNote = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->topic = 'Other';
    }

    public function getId(): ?int { return $this->id; }
    public function getQuestion(): string { return $this->question; }
    public function setQuestion(string $q): self { $this->question = $q; return $this; }
    public function getAnswer(): string { return $this->answer; }
    public function setAnswer(string $a): self { $this->answer = $a; return $this; }
    public function getTopic(): string { return $this->topic; }
    public function setTopic(string $t): self { $this->topic = $t; return $this; }
    public function getUserId(): ?string { return $this->userId; }
    public function setUserId(?string $u): self { $this->userId = $u; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getConfidence(): float { return $this->confidence; }
    public function setConfidence(float $c): self { $this->confidence = $c; return $this; }
    public function getSource(): string { return $this->source; }
    public function setSource(string $s): self { $this->source = $s; return $this; }
    public function isHelpful(): ?bool { return $this->helpful; }
    public function setHelpful(?bool $h): self { $this->helpful = $h; return $this; }
    public function getFeedbackNote(): ?string { return $this->feedbackNote; }
    public function setFeedbackNote(?string $n): self { $this->feedbackNote = $n; return $this; }
}


