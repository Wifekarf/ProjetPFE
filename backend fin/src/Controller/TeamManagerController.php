<?php

namespace App\Controller;

use App\Entity\Team;
use App\Repository\TeamRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;

#[Route('/api/team-manager', name: 'api_team_manager_')]
class TeamManagerController extends AbstractController
{
    private EntityManagerInterface $em;
    private UserRepository $userRepository;
    private TeamRepository $teamRepository;
    
    public function __construct(
        EntityManagerInterface $em,
        UserRepository $userRepository,
        TeamRepository $teamRepository
    ) {
        $this->em = $em;
        $this->userRepository = $userRepository;
        $this->teamRepository = $teamRepository;
    }

#[Route('/my-team', name: 'get_team', methods: ['GET'])]
public function getTeamMembers(): JsonResponse
{
    $user = $this->getUser();

    if (!$user) {
        return $this->json(['error' => 'Unauthorized'], 401);
    }

    $team = $this->teamRepository->findTeamByMember($user);

    if (!$team) {
        return $this->json(['error' => 'No team found'], 404);
    }

    return $this->json([
        'team' => [
            'id' => $team->getId(),
            'name' => $team->getName(),
            'team_manager_id' => $team->getTeamManager() ? $team->getTeamManager()->getId() : null,
            'members' => array_map(fn($member) => [
                'id' => $member->getId(),
                'username' => $member->getUsername(),
                'email' => $member->getEmail(),
                'role' => $member->getRole()->value,
            ], $team->getMembers()->toArray())
        ]
    ]);
}

}