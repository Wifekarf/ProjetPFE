<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Team;
use App\Entity\Messanger;
use App\Repository\UserRepository;
use App\Repository\TeamRepository;
use App\Repository\MessangerRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_')]
class MessangerController extends AbstractController
{
    private UserRepository $userRepository;
    private TeamRepository $teamRepository;
    private MessangerRepository $messangerRepository;
    private EntityManagerInterface $em;

    public function __construct(
        UserRepository $userRepository,
        TeamRepository $teamRepository,
        MessangerRepository $messangerRepository,
        EntityManagerInterface $em
    ) {
        $this->userRepository = $userRepository;
        $this->teamRepository = $teamRepository;
        $this->messangerRepository = $messangerRepository;
        $this->em = $em;
    }

    // 1. List teams where user is a member
    #[Route('/user/{userId}/teams', name: 'user_teams', methods: ['GET'])]
    public function getUserTeams($userId): JsonResponse
    {
        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }
        $teams = $this->teamRepository->createQueryBuilder('t')
            ->join('t.members', 'm')
            ->where('m.id = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()->getResult();
        $teamData = array_map(fn($team) => [
            'id' => $team->getId(),
            'name' => $team->getName(),
        ], $teams);
        return $this->json($teamData);
    }

    // 2. Get messages by team ID
    #[Route('/team/{teamId}/messages', name: 'team_messages', methods: ['GET'])]
    public function getTeamMessages($teamId): JsonResponse
    {
        $team = $this->teamRepository->find($teamId);
        if (!$team) {
            return $this->json(['error' => 'Team not found'], 404);
        }
        $messages = $this->messangerRepository->findBy(['team' => $team], ['createdAt' => 'ASC']);
        $msgData = array_map(fn($msg) => [
            'id' => $msg->getId(),
            'user' => $msg->getUser() ? $msg->getUser()->getId() : null,
            'username' => $msg->getUser() ? $msg->getUser()->getUsername() : null,
            'content' => $msg->getContent(),
            'createdAt' => $msg->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $messages);
        return $this->json($msgData);
    }

    // 3. Add a message
    #[Route('/message', name: 'add_message', methods: ['POST'])]
    public function addMessage(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $userId = $data['userId'] ?? null;
        $teamId = $data['teamId'] ?? null;
        $content = $data['content'] ?? null;
        if (!$userId || !$teamId || !$content) {
            return $this->json(['error' => 'Missing required fields'], 400);
        }
        $user = $this->userRepository->find($userId);
        $team = $this->teamRepository->find($teamId);
        if (!$user || !$team) {
            return $this->json(['error' => 'User or Team not found'], 404);
        }
        $msg = new Messanger();
        $msg->setUser($user);
        $msg->setTeam($team);
        $msg->setContent($content);
        $msg->setCreatedAt(new \DateTime());
        $this->em->persist($msg);
        $this->em->flush();
        return $this->json([
            'id' => $msg->getId(),
            'user' => $user->getId(),
            'team' => $team->getId(),
            'content' => $msg->getContent(),
            'createdAt' => $msg->getCreatedAt()->format('Y-m-d H:i:s'),
        ], 201);
    }

    #[Route('/messanger', name: 'app_messanger')]
    public function index(): Response
    {
        return $this->render('messanger/index.html.twig', [
            'controller_name' => 'MessangerController',
        ]);
    }
}
