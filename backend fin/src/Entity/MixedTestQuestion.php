<?php

namespace App\Entity;

use App\Repository\MixedTestQuestionRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * MixedTestQuestion Entity
 * 
 * Junction entity that connects mixed tests with questions.
 * Represents the assignment of questions to mixed tests.
 * This follows the same pattern as QuizQuestion entity.
 */
#[ORM\Entity(repositoryClass: MixedTestQuestionRepository::class)]
#[ORM\Table(name: 'mixed_test_question')]
class MixedTestQuestion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: MixedTest::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?MixedTest $mixedTest = null;

    #[ORM\ManyToOne(targetEntity: Question::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Question $question = null;

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

    public function getQuestion(): ?Question
    {
        return $this->question;
    }

    public function setQuestion(Question $question): static
    {
        $this->question = $question;
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