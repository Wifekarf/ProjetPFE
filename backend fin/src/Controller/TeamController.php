<?php

namespace App\Controller;

use App\Entity\Team;
use App\Entity\User;
use App\Repository\TeamRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use App\Enum\UserRole;
use App\Repository\UserQuizRepository;
use App\Repository\UserProgProblemRepository;
use App\Repository\LangagesRepository;
use App\Repository\QuizQuestionRepository;

#[Route('/api/rhm/teams', name: 'api_teams_')]
class TeamController extends AbstractController
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
    #[Route('/fetch', name: 'list_teams', methods: ['GET'])]
    public function listTeams(): JsonResponse
    {
        try {
            $teams = $this->em->getRepository(Team::class)
                ->createQueryBuilder('t')
                ->leftJoin('t.teamManager', 'tm')
                ->leftJoin('t.members', 'm')
                ->addSelect('tm', 'm')
                ->getQuery()
                ->getResult();

            if (empty($teams)) {
                return $this->json([
                    'teams' => [],
                    'total' => 0,
                    'message' => 'No teams found'
                ]);
            }

            $data = array_map(function($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'manager' => $team->getTeamManager() ? [
                        'id' => $team->getTeamManager()->getId(),
                        'username' => $team->getTeamManager()->getUsername(),
                        'email' => $team->getTeamManager()->getEmail(),
                        'roles' => $team->getTeamManager()->getRoles()
                    ] : null,
                    'members' => array_map(function($member) {
                        return [
                            'id' => $member->getId(),
                            'username' => $member->getUsername(),
                            'email' => $member->getEmail(),
                            'roles' => $member->getRoles()
                        ];
                    }, $team->getMembers()->toArray()),
                    'totalMembers' => $team->getMembers()->count()
                ];
            }, $teams);

            return $this->json([
                'teams' => $data,
                'total' => count($data),
                'message' => 'Teams retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Failed to fetch teams',
                'message' => $e->getMessage()
            ], 500);
        }
    }    
    #[Route('/create', name: 'create_team', methods: ['POST'])]
    public function createTeam(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $team = new Team();
        $team->setName($data['name']);
        
        // Set team manager
        $manager = $this->userRepository->find($data['managerId']);
        $manager->setRole(UserRole::ROLE_TEAM_MANAGER);
        $team->setTeamManager($manager);
        
        // Add members
        foreach ($data['memberIds'] as $memberId) {
            $member = $this->userRepository->find($memberId);
            if ($member) {
                $team->addMember($member);
            }
        }
        
        $this->em->persist($team);
        $this->em->flush();
        
        return $this->json(['message' => 'Team created successfully']);
    }

    #[Route('/{id}/members', name: 'add_members', methods: ['PUT'])]
    public function addMembers(Team $team, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        foreach ($data['memberIds'] as $memberId) {
            $member = $this->userRepository->find($memberId);
            if ($member) {
                $team->addMember($member);
            }
        }
        
        $this->em->flush();
        return $this->json(['message' => 'Members added successfully']);
    }

    #[Route('/{teamId}/manager/{userId}', name: 'change_manager', methods: ['PUT'])]
    public function changeManager(int $teamId, int $userId): JsonResponse
    {
        try {
            $this->em->beginTransaction();

            try {
                $team = $this->teamRepository->find($teamId);
                $user = $this->userRepository->find($userId);
                
                if (!$team) {
                    $this->em->rollback();
                    return $this->json([
                        'error' => 'Team not found',
                        'details' => 'No team exists with ID: ' . $teamId
                    ], 404);
                }

                if (!$user) {
                    $this->em->rollback();
                    return $this->json([
                        'error' => 'User not found',
                        'details' => 'No user exists with ID: ' . $userId
                    ], 404);
                }

                // If there's a current manager, set their role back to USER
                if ($team->getTeamManager()) {
                    $currentManager = $team->getTeamManager();
                    $currentManager->setRole(UserRole::ROLE_USER);
                }

                // Set new user as team manager
                if ($user->getRole() !== UserRole::ROLE_TEAM_MANAGER) {
                    $user->setRole(UserRole::ROLE_TEAM_MANAGER);
                }
                $team->setTeamManager($user);
                
                $this->em->flush();
                $this->em->commit();

                return $this->json([
                    'message' => 'Team manager updated successfully',
                    'team' => [
                        'id' => $team->getId(),
                        'name' => $team->getName(),
                        'manager' => [
                            'id' => $user->getId(),
                            'username' => $user->getUsername(),
                            'email' => $user->getEmail(),
                            'roles' => $user->getRoles()
                        ]
                    ]
                ]);

            } catch (\Exception $e) {
                $this->em->rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Failed to update team manager',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    #[Route('/{teamId}/revoke-manager/{userId}', name: 'revoke_manager_role', methods: ['PUT'])]
    public function revokeManagerRole(int $teamId, int $userId): JsonResponse
    {
        try {
            // Start transaction
            $this->em->beginTransaction();

            try {
                $team = $this->teamRepository->find($teamId);
                $user = $this->userRepository->find($userId);
                
                if (!$team) {
                    $this->em->rollback();
                    return $this->json([
                        'error' => 'Team not found',
                        'details' => 'No team exists with ID: ' . $teamId
                    ], 404);
                }

                if (!$user) {
                    $this->em->rollback();
                    return $this->json([
                        'error' => 'User not found',
                        'details' => 'No user exists with ID: ' . $userId
                    ], 404);
                }

                // Check if team has a manager and if it's the specified user
                $currentManager = $team->getTeamManager();
                if (!$currentManager || $currentManager->getId() !== $user->getId()) {
                    $this->em->rollback();
                    return $this->json([
                        'error' => 'Invalid request',
                        'details' => 'User is not the manager of this team'
                    ], 400);
                }

                // Update team first
                $team->setTeamManager(null);

                // Update user role
                $user->setRole(UserRole::ROLE_USER);
                
                // Flush and commit changes
                $this->em->flush();
                $this->em->commit();

                return $this->json([
                    'message' => 'Team manager role revoked successfully',
                    'user' => [
                        'id' => $user->getId(),
                        'username' => $user->getUsername(),
                        'email' => $user->getEmail(),
                        'roles' => $user->getRoles()
                    ],
                    'team' => [
                        'id' => $team->getId(),
                        'name' => $team->getName()
                    ]
                ]);

            } catch (\Exception $e) {
                $this->em->rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Failed to revoke team manager role',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    #[Route('/{teamId}/remove-member/{userId}', name: 'remove_member', methods: ['DELETE'])]
    public function removeMember(int $teamId, int $userId): JsonResponse
    {
        try {
            $team = $this->teamRepository->find($teamId);
            $user = $this->userRepository->find($userId);

            if (!$team || !$user) {
                return $this->json(['error' => 'Team or user not found'], 404);
            }

            // Check if user is team manager
            if ($team->getTeamManager() && $team->getTeamManager()->getId() === $user->getId()) {
                // Remove as manager and set role to USER
                $team->setTeamManager(null);
                $user->setRole(UserRole::ROLE_USER);
            }

            // Remove from team members
            if ($team->hasMember($user)) {
                $team->removeMember($user);
            }

            $this->em->flush();

            return $this->json([
                'message' => 'User removed from team successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/scores', name: 'team_scores', methods: ['GET'])]
    public function getTeamScores(
        UserQuizRepository $userQuizRepo,
        UserProgProblemRepository $userProgRepo,
        LangagesRepository $langagesRepo,
        QuizQuestionRepository $quizQuestionRepo
    ): JsonResponse {
        $currentUser = $this->getUser();
        if (!$currentUser || !in_array('ROLE_TEAM_MANAGER', $currentUser->getRoles(), true)) {
            return $this->json(['error' => 'Access denied'], 403);
        }
        // Find the team managed by this user
        $team = $this->teamRepository->findOneBy(['teamManager' => $currentUser]);
        if (!$team) {
            return $this->json(['error' => 'No team found for this manager'], 404);
        }
        $languages = $langagesRepo->findAll();
        $members = $team->getMembers();
        $result = [];
        foreach ($members as $member) {
            // Quiz scores
            $userQuizzes = $userQuizRepo->findByUser($member);
            $quizScoresByLang = [];
            $lastQuizActivity = null;
            $totalQuizScore = 0;
            $quizScoreCount = 0;
            foreach ($userQuizzes as $uq) {
                // Find all questions for this quiz
                $quizQuestions = $quizQuestionRepo->findByQuizId($uq->getQuiz()->getId());
                $langs = [];
                foreach ($quizQuestions as $qq) {
                    $lang = $qq->getQuestion()->getLanguage();
                    if ($lang) {
                        $langs[$lang->getId()] = $lang;
                    }
                }
                foreach ($langs as $langId => $lang) {
                    if (!isset($quizScoresByLang[$langId])) {
                        $quizScoresByLang[$langId] = 0;
                    }
                    $quizScoresByLang[$langId] += $uq->getScorePoints();
                }
                $totalQuizScore += $uq->getScorePoints();
                $quizScoreCount++;
                if (!$lastQuizActivity || $uq->getDateCreation() > $lastQuizActivity) {
                    $lastQuizActivity = $uq->getDateCreation();
                }
            }
            // Programming problem scores
            $userProgProblems = $userProgRepo->findBy(['user' => $member]);
            $progScoresByLang = [];
            $lastProgActivity = null;
            $totalProgScore = 0;
            $progScoreCount = 0;
            foreach ($userProgProblems as $upp) {
                $progProblem = $upp->getProgProblem();
                $lang = $progProblem->getLanguage();
                if ($lang) {
                    $langId = $lang->getId();
                    if (!isset($progScoresByLang[$langId])) {
                        $progScoresByLang[$langId] = 0;
                    }
                    $progScoresByLang[$langId] += $upp->getScorePoints();
                }
                $totalProgScore += $upp->getScorePoints();
                $progScoreCount++;
                if (!$lastProgActivity || $upp->getDateCreation() > $lastProgActivity) {
                    $lastProgActivity = $upp->getDateCreation();
                }
            }
            // Build result row
            $row = [
                'id' => $member->getId(),
                'username' => $member->getUsername(),
                'email' => $member->getEmail(),
                'image' => $member->getImage(),
                'lastQuizActivity' => $lastQuizActivity ? $lastQuizActivity->format('Y-m-d H:i:s') : null,
                'lastProgActivity' => $lastProgActivity ? $lastProgActivity->format('Y-m-d H:i:s') : null,
                'overallQuizScore' => $quizScoreCount ? round($totalQuizScore / $quizScoreCount) : 0,
                'overallProgScore' => $progScoreCount ? round($totalProgScore / $progScoreCount) : 0,
                'quizScoresByLang' => [],
                'progScoresByLang' => [],
            ];
            foreach ($languages as $lang) {
                $langId = $lang->getId();
                $row['quizScoresByLang'][$lang->getNom()] = $quizScoresByLang[$langId] ?? 0;
                $row['progScoresByLang'][$lang->getNom()] = $progScoresByLang[$langId] ?? 0;
            }
            $result[] = $row;
        }
        // Also return the list of languages for dynamic columns
        $langsArr = array_map(fn($l) => ['id' => $l->getId(), 'name' => $l->getNom()], $languages);
        return $this->json([
            'members' => $result,
            'languages' => $langsArr
        ]);
    }
}