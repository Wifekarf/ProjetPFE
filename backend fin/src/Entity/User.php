<?php

namespace App\Entity;

use App\Enum\UserRole;
use App\Enum\UserRank;
use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'user')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string')]
    private ?string $password = null;

    #[ORM\Column(type: 'string', length: 255)]
    private ?string $username = null;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private ?string $email = null;
    

    #[ORM\Column(type: 'string', enumType: \App\Enum\UserRole::class, options: ['default' => 'ROLE_USER'])]
    private UserRole $role = UserRole::ROLE_USER;
    
    #[ORM\Column(type: 'string', enumType: \App\Enum\UserRank::class, options: ['default' => 'JUNIOR'])]
    private UserRank $rank = UserRank::JUNIOR;
    
    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $points_total_all = 0;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $date_creation;

    #[ORM\ManyToMany(targetEntity: Team::class, mappedBy: 'members')]
    private Collection $teams;

    #[ORM\OneToMany(targetEntity: Team::class, mappedBy: 'teamManager')]
    private Collection $managedTeams;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $cv = null;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => 'active'])]
    private string $status = 'active';

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $profile_attributes = null;

    public function __construct()
    {
        $this->date_creation = new \DateTime();
        $this->teams = new ArrayCollection();
        $this->managedTeams = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getRole(): UserRole
    {
        return $this->role;
    }
    

    public function setRole(UserRole $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function getRank(): UserRank
    {
        return $this->rank;
    }

    public function setRank(UserRank $rank): static
    {
        $this->rank = $rank;
        return $this;
    }

    public function getPointsTotalAll(): int
    {
        return $this->points_total_all;
    }

    public function setPointsTotalAll(int $points): static
    {
        $this->points_total_all = $points;
        return $this;
    }

    public function getDateCreation(): \DateTimeInterface
    {
        return $this->date_creation;
    }

    public function setDateCreation(\DateTimeInterface $date): static
    {
        $this->date_creation = $date;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return $this->email ?? '';
    }

    public function getRoles(): array
    {
           // On s'assure toujours d'avoir au moins ROLE_USER
    $roles = [$this->role->value];

    if (!in_array('ROLE_USER', $roles, true)) {
        $roles[] = 'ROLE_USER';
    }

    return $roles;
    }

    public function eraseCredentials(): void
    {
        // Pour effacer des infos sensibles temporaires
    }
        /**
     * @return Collection<int, Team>
     */
    public function getTeams(): Collection
    {
        return $this->teams;
    }

    public function addTeam(Team $team): static
    {
        if (!$this->teams->contains($team)) {
            $this->teams->add($team);
            $team->addMember($this);
        }
        return $this;
    }

    public function removeTeam(Team $team): static
    {
        if ($this->teams->removeElement($team)) {
            $team->removeMember($this);
        }
        return $this;
    }

    /**
     * @return Collection<int, Team>
     */
    public function getManagedTeams(): Collection
    {
        return $this->managedTeams;
    }

    public function addManagedTeam(Team $team): static
    {
        if (!$this->managedTeams->contains($team)) {
            $this->managedTeams->add($team);
            $team->setTeamManager($this);
        }
        return $this;
    }

    public function removeManagedTeam(Team $team): static
    {
        if ($this->managedTeams->removeElement($team)) {
            // Set the team's manager to null if it's managed by this user
            if ($team->getTeamManager() === $this) {
                $team->setTeamManager(null);
            }
        }
        return $this;
    }

    public function isTeamManager(): bool
    {
        return $this->role === UserRole::ROLE_TEAM_MANAGER;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;
        return $this;
    }

    public function getCv(): ?string
    {
        return $this->cv;
    }

    public function setCv(?string $cv): static
    {
        $this->cv = $cv;
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

    public function getProfileAttributes(): ?array
    {
        return $this->profile_attributes;
    }

    public function setProfileAttributes(?array $profile_attributes): static
    {
        $this->profile_attributes = $profile_attributes;
        return $this;
    }
}
