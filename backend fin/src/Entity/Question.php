<?php

namespace App\Entity;

use App\Repository\QuestionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: QuestionRepository::class)]
class Question
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(name: "question_desc", type: 'string', length: 255)]
    private ?string $question = null;

    #[ORM\Column(type: 'json')]
    private array $options = [];

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $correctAnswer = null;

    #[ORM\Column(type: 'string', length: 10)]
    private ?string $difficulty = null; // ['easy', 'medium', 'hard']

    #[ORM\Column(type: 'integer')]
    private ?int $points = 0;

    #[ORM\ManyToOne(targetEntity: Langages::class)]
    #[ORM\JoinColumn(name: "language_id", referencedColumnName: "id", nullable: false)]
    private ?Langages $language = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $time = null; // aucune valeur par défaut

   #[ORM\Column(type:"string", length:255, nullable:true)]
    private ?string $image = null;
    // Getters & Setters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getQuestion(): ?string
    {
        return $this->question;
    }

    public function setQuestion(string $question): self
    {
        $this->question = $question;
        return $this;
    }

    public function getOptions(): array
    {
        return $this->options;
    }

    public function setOptions(array $options): self
    {
        $this->options = $options;
        return $this;
    }

    public function getCorrectAnswer(): ?string
    {
        return $this->correctAnswer;
    }

    public function setCorrectAnswer(string $correctAnswer): self
    {
        $this->correctAnswer = $correctAnswer;
        return $this;
    }

    public function getDifficulty(): ?string
    {
        return $this->difficulty;
    }

    public function setDifficulty(string $difficulty): self
    {
        $this->difficulty = $difficulty;
        return $this;
    }

    public function getPoints(): ?int
    {
        return $this->points;
    }

    public function setPoints(int $points): self
    {
        $this->points = $points;
        return $this;
    }

    public function getLanguage(): ?Langages
    {
        return $this->language;
    }

    public function setLanguage(Langages $language): self
    {
        $this->language = $language;
        return $this;
    }
    public function getTime(): ?int
    {
        return $this->time;
    }
    
    public function setTime(int $time): self
    {
        $this->time = $time;
        return $this;
    }
  
    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): self
    {
        $this->image = $image;
        return $this;
    }
}
