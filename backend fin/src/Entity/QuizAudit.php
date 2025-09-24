<?php
// src/Entity/QuizAudit.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * One row per audit event (visibility loss, answer select, etc.).
 */
#[ORM\Entity]
class QuizAudit
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column(type:"integer")]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity:QuizSession::class)]
    #[ORM\JoinColumn(nullable:false)]
    private QuizSession $session;

    #[ORM\Column(type:"string")]
    private string $type;

    #[ORM\Column(type:"json")]
    private array $payload = [];

    #[ORM\Column(type:"datetime")]
    private \DateTimeInterface $occurredAt;

    public function __construct(QuizSession $session, string $type, array $payload)
    {
        $this->session    = $session;
        $this->type       = $type;
        $this->payload    = $payload;
        $this->occurredAt = new \DateTime();
    }
}
