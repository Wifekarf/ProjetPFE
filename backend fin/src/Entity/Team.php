<?php

namespace App\Entity;
use App\Repository\TeamRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: TeamRepository::class)]
class Team
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $name = null;

    #[ORM\ManyToOne(targetEntity: User::class , inversedBy: 'managedTeams')]
    #[ORM\JoinColumn(nullable: true)] 
    private ?User $teamManager = null;

    #[ORM\ManyToMany(targetEntity: User::class , inversedBy: 'teams')]
    private Collection $members;

    public function __construct()
    {
        $this->members = new ArrayCollection();
    }
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getTeamManager(): ?User
    {
        return $this->teamManager;
    }

    public function setTeamManager(?User $teamManager): self
    {
        $this->teamManager = $teamManager;
        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(User $member): self
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
        }
        return $this;
    }

    public function removeMember(User $member): self
    {
        $this->members->removeElement($member);
        return $this;
    }

    public function hasMember(User $user): bool
    {
        return $this->members->contains($user);
    }
}