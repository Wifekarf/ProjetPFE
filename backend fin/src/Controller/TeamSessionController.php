<?php

namespace App\Controller;

use App\Entity\TeamSession;
use App\Entity\Team;
use App\Entity\Quiz;
use App\Entity\ProgProblem;
use App\Repository\TeamSessionRepository;
use App\Repository\TeamRepository;
use App\Repository\QuizRepository;
use App\Repository\ProgProblemRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

class TeamSessionController extends AbstractController
{
    /**
     * Met à jour automatiquement le status des sessions scheduled dont la date de début est passée.
     */
    #[Route('/api/team-sessions/update-statuses', name: 'update_team_sessions_statuses', methods: ['POST'])]
    public function updateStatuses(
        TeamSessionRepository $sessionRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        $now = new \DateTimeImmutable();
        $sessions = $sessionRepo->findScheduledSessionsToStart($now);
        $updated = 0;
        foreach ($sessions as $session) {
            $session->setStatus(TeamSession::STATUS_INPROGRESS);
            $updated++;
        }
        if ($updated > 0) {
            $em->flush();
        }
        return $this->json([
            'updated_sessions' => $updated,
            'now' => $now->format('c'),
        ]);
    }


    /**
     * Classement (scoreboard) pour une session d'équipe (quiz)
     */
    #[Route('/api/team-session/{id}/scoreboard', name: 'team_session_scoreboard', methods: ['GET'])]
    public function scoreboard(
        int $id,
        EntityManagerInterface $em,
        TeamSessionRepository $sessionRepo
    ): JsonResponse {
        $session = $sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }
        $scores = [];
        $totalItems = 0;
         $itemsCountByQuiz = [];
          $itemsCountByProg = [];


        if ($session->getType() === 'quiz') {
            foreach ($session->getQuizzes() as $quiz) {
                $count = $quiz->getNbQuestion() ?? 0;
                $totalItems += $count;
                $itemsCountByQuiz[] = [
                    'quizId' => $quiz->getId(),
                    'count' => $count
                ];
            }
            // Quiz session: use UserQuiz
            $userQuizList = $em->getRepository(\App\Entity\UserQuiz::class)
                ->findBy(['teamSession' => $session], ['scorePoints' => 'DESC']);
            $scores = array_map(function($uq) use ($em, $session) {
                // Récupérer AffectUserQuiz pour answeredCount
                $affect = $em->getRepository(\App\Entity\AffectUserQuiz::class)->findOneBy([
                    'user' => $uq->getUser(),
                    'teamSession' => $session,
                    'quiz' => $uq->getQuiz(),
                ]);
                $answeredCount = $affect ? $affect->getAnsweredCount() : 0;
                return [
                    'user' => [
                        'id' => $uq->getUser()->getId(),
                        'username' => $uq->getUser()->getUsername(),
                        'fullName' => method_exists($uq->getUser(), 'getFullName') ? $uq->getUser()->getFullName() : null,
                    ],
                    'scorePoints' => $uq->getScorePoints(),
                    'answeredCount' => $answeredCount,
                ];
            }, $userQuizList);
            // Ajout des users présents dans AffectUserQuiz mais absents de UserQuiz
            $existingUserIds = array_column(array_map(fn($s) => $s['user'], $scores), 'id');
            $affectUserQuizRepo = $em->getRepository(\App\Entity\AffectUserQuiz::class);
            $affects = $affectUserQuizRepo->findBy(['teamSession' => $session]);
            foreach ($affects as $affect) {
                $user = $affect->getUser();
                if ($user && !in_array($user->getId(), $existingUserIds)) {
                    $scores[] = [
                        'user' => [
                            'id' => $user->getId(),
                            'username' => $user->getUsername(),
                            'fullName' => method_exists($user, 'getFullName') ? $user->getFullName() : null,
                        ],
                        'scorePoints' => 0,
                        'answeredCount' => $affect->getAnsweredCount(),
                    ];
                }
            }
        } elseif ($session->getType() === 'programming') {
            foreach ($session->getProgProblems() as $problem) {
                $count = $problem->getNbTasks() ?? 0;
                $totalItems += $count;
                $itemsCountByProg[] = [
                    'progProblemId' => $problem->getId(),
                    'count' => $count
                ];
            }
            // Programming session: use UserProgProblem
            $userProgList = $em->getRepository(\App\Entity\UserProgProblem::class)
                ->findBy(['teamSession' => $session], ['scorePoints' => 'DESC']);
            $scores = array_map(function($upp) use ($em, $session) {
                // Récupérer AffectUserProgProblem pour answeredCount
                $affect = $em->getRepository(\App\Entity\AffectUserProgProblem::class)->findOneBy([
                    'user' => $upp->getUser(),
                    'teamSession' => $session,
                    'progProblem' => $upp->getProgProblem(),
                ]);
                $answeredCount = $affect ? $affect->getAnsweredCount() : 0;
                return [
                    'user' => [
                        'id' => $upp->getUser() ? $upp->getUser()->getId() : null,
                        'username' => $upp->getUser() ? $upp->getUser()->getUsername() : ($upp->getEmail() ?? null),
                        'fullName' => ($upp->getUser() && method_exists($upp->getUser(), 'getFullName')) ? $upp->getUser()->getFullName() : null,
                    ],
                    'scorePoints' => $upp->getScorePoints(),
                    'answeredCount' => $answeredCount,
                    
                ];
            }, $userProgList);
            // Ajout des users présents dans AffectUserProgProblem mais absents de UserProgProblem
            $existingUserIds = array_column(array_map(fn($s) => $s['user'], $scores), 'id');
            $affectUserProgRepo = $em->getRepository(\App\Entity\AffectUserProgProblem::class);
            $affects = $affectUserProgRepo->findBy(['teamSession' => $session]);
            foreach ($affects as $affect) {
                $user = $affect->getUser();
                if ($user && !in_array($user->getId(), $existingUserIds)) {
                    $scores[] = [
                        'user' => [
                            'id' => $user->getId(),
                            'username' => $user->getUsername(),
                            'fullName' => method_exists($user, 'getFullName') ? $user->getFullName() : null,
                        ],
                        'scorePoints' => 0,
                        'answeredCount' => $affect->getAnsweredCount(),
                    ];
                }
            }
        }
       
        // Si la session est terminée, inclure tous les membres de l'équipe dans le scoreboard
        if ($session->getStatus() === 'finished') {
            $team = $session->getTeam();
            $teamManager = $team->getTeamManager();
            // Filtrer les membres pour exclure le manager
            $teamMembers = $team->getMembers()->filter(function($member) use ($teamManager) {
                return $teamManager === null || $member->getId() !== $teamManager->getId();
            });
            // Extraire les IDs déjà présents dans le scoreboard
            $userIdInScores = array_column(array_map(fn($s) => $s['user'], $scores), 'id');
            foreach ($teamMembers as $member) {
                if (!in_array($member->getId(), $userIdInScores)) {
                    $scores[] = [
                        'user' => [
                            'id' => $member->getId(),
                            'username' => $member->getUsername(),
                            'fullName' => method_exists($member, 'getFullName') ? $member->getFullName() : null,
                        ],
                        'scorePoints' => 0,
                        
                    ];
                }
            }
        }
        return $this->json([
            'session' => [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'type' => $session->getType(),
            ],
            'scores' => $scores,
            'totalItems'=>$totalItems,
        ]);
    }
    #[Route('/api/team-sessions', name: 'create_team_session', methods: ['POST'])]
    public function create(Request $request,
                          EntityManagerInterface $em,
                          TeamRepository $teamRepo,
                          UserRepository $userRepo,
                          QuizRepository $quizRepo,
                          ProgProblemRepository $progRepo): Response
    {
        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        $team = $teamRepo->find($data['team_id'] ?? null);
        $createdBy = $userRepo->find($data['created_by'] ?? null);
        if (!$team || !$createdBy) {
            return new JsonResponse(['error' => 'Team or creator not found'], 404);
        }
        // Vérification anti-chevauchement de session dans la même équipe (±4h)
        $startDateTime = new \DateTime($data['startDateTime']);
        $existingSessions = $em->getRepository(\App\Entity\TeamSession::class)
            ->findSessionsCloseTo($team, $startDateTime, 4*60);
        if (count($existingSessions) > 0) {
            return new JsonResponse([
                'error' => 'Another session for this team exists within the same time window (±4 hours).'
            ], 400);
        }

        $session = new TeamSession();
        $session->setTeam($team)
                ->setCreatedBy($createdBy)
                ->setType($data['type'] ?? 'quiz')
                ->setTitle($data['title'] ?? '')
                ->setDescription($data['description'] ?? null)
                ->setStartDateTime(new \DateTime($data['startDateTime']))
                ->setDurationMinutes($data['durationMinutes'] ?? 60)
                ->setStatus(\App\Entity\TeamSession::STATUS_SCHEDULED);

        // Attach quizzes or programming problems
        if ($session->getType() === 'quiz' && !empty($data['quiz_ids'])) {
            foreach ($data['quiz_ids'] as $quizId) {
                $quiz = $quizRepo->find($quizId);
                if ($quiz) $session->addQuiz($quiz);
            }
        } elseif ($session->getType() === 'programming' && !empty($data['prog_problem_ids'])) {
            foreach ($data['prog_problem_ids'] as $pid) {
                $prob = $progRepo->find($pid);
                if ($prob) $session->addProgProblem($prob);
            }
        }

        $em->persist($session);
        $em->flush();

        // Affecter tous les membres (hors manager) aux quizzes/prog-problems de la session
        $members = $team->getMembers();
        $manager = $team->getTeamManager();
        if ($session->getType() === 'quiz') {
            foreach ($session->getQuizzes() as $quiz) {
                foreach ($members as $user) {
                    if ($manager && $user->getId() === $manager->getId()) continue;
                    $affect = new \App\Entity\AffectUserQuiz();
                    $affect->setUser($user);
                    $affect->setQuiz($quiz);
                    $affect->setTeamSession($session);
                    $affect->setDateAffectation(new \DateTime());
                    $affect->setNombrePassed(0);
                    $affect->setStatus('pending');
                    $em->persist($affect);
                }
            }
        } elseif ($session->getType() === 'programming') {
            foreach ($session->getProgProblems() as $problem) {
                foreach ($members as $user) {
                    if ($manager && $user->getId() === $manager->getId()) continue;
                    $affect = new \App\Entity\AffectUserProgProblem();
                    $affect->setUser($user);
                    $affect->setProgProblem($problem);
                    $affect->setTeamSession($session);
                    $affect->setDateAffectation(new \DateTime());
                    $affect->setNombrePassed(0);
                    $affect->setStatus('pending');
                    // $affect->setEmail(null); // facultatif si besoin
                    $em->persist($affect);
                }
            }
        }
        $em->flush();

        return new JsonResponse(['id' => $session->getId()], 201);
    }

    #[Route('/api/team-sessions', name: 'list_team_sessions', methods: ['GET'])]
    public function list(TeamSessionRepository $repo, Request $request, 
        \App\Repository\AffectUserQuizRepository $affectUserQuizRepo, 
        \App\Repository\AffectUserProgProblemRepository $affectUserProgRepo,
        EntityManagerInterface $em): Response
    {
        $teamId = $request->query->get('team_id');
        $sessions = $teamId 
            ? $repo->findBy(['team' => $teamId], ['startDateTime' => 'DESC'])
            : $repo->findBy([], ['startDateTime' => 'DESC']);
        $now = new \DateTimeImmutable();
        $hasChanged = false;
        foreach ($sessions as $session) {
            // --- Mise à jour automatique du status ---
            $start = $session->getStartDateTime();
            $end = (clone $start)->modify('+' . $session->getDurationMinutes() . ' minutes');
            $oldStatus = $session->getStatus();
            $newStatus = $oldStatus;
            if ($oldStatus === \App\Entity\TeamSession::STATUS_SCHEDULED && $now >= $start) {
                $session->setStatus(\App\Entity\TeamSession::STATUS_INPROGRESS);
                $newStatus = \App\Entity\TeamSession::STATUS_INPROGRESS;
                $hasChanged = true;
            }
            if ($newStatus === \App\Entity\TeamSession::STATUS_INPROGRESS && $now >= $end) {
                $session->setStatus(\App\Entity\TeamSession::STATUS_FINISHED);
                $hasChanged = true;
            }
            // --- Fin mise à jour automatique ---
        }
        if ($hasChanged) {
            $em->flush();
        }
        $result = [];
        foreach ($sessions as $session) {
            // Quizzes
            $quizzesArr = [];
            foreach ($session->getQuizzes() as $q) {
                $affects = $affectUserQuizRepo->findBySessionQuizAndStatus($session, 'completed');
                $finished_users = array_map(function($affect) {
                    $user = $affect->getUser();
                    return [
                        'id' => $user->getId(),
                        'username' => $user->getUsername(),
                        'email' => $user->getEmail(),
                    ];
                }, $affects);
                $quizzesArr[] = [
                    'id' => $q->getId(),
                    'title' => $q->getNom(),
                    'code' => method_exists($q, 'getCode') ? $q->getCode() : null,
                    'finished_users' => $finished_users
                ];
            }
            // Programming Problems
            $progsArr = [];
            foreach ($session->getProgProblems() as $p) {
                $affects = $affectUserProgRepo->findBySessionProgProblemAndStatus($session, 'completed');
                $finished_users = array_map(function($affect) {
                    $user = $affect->getUser();
                    return [
                        'id' => $user->getId(),
                        'username' => $user->getUsername(),
                        'email' => $user->getEmail(),
                    ];
                }, $affects);
                $progsArr[] = [
                    'id' => $p->getId(),
                    'title' => $p->getTitle(),
                    'code' => method_exists($p, 'getCode') ? $p->getCode() : null,
                    'finished_users' => $finished_users
                ];
            }
            $result[] = [
                'id' => $session->getId(),
                'team_id' => $session->getTeam()->getId(),
                'created_by' => $session->getCreatedBy()->getId(),
                'type' => $session->getType(),
                'title' => $session->getTitle(),
                'description' => $session->getDescription(),
                'startDateTime' => $session->getStartDateTime()->format('c'),
                'durationMinutes' => $session->getDurationMinutes(),
                'status' => $session->getStatus(),
                'quizzes' => $quizzesArr,
                'prog_problems' => $progsArr,
            ];
        }
        return new JsonResponse($result);
    }

    #[Route('/api/team-sessions/{id}', name: 'get_team_session', methods: ['GET'])]
    public function getOne(TeamSessionRepository $repo, int $id, 
        \App\Repository\AffectUserQuizRepository $affectUserQuizRepo, 
        \App\Repository\AffectUserProgProblemRepository $affectUserProgRepo,
        EntityManagerInterface $em): Response
    {
        $session = $repo->find($id);
        if (!$session) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        // --- Mise à jour automatique du status ---
        $now = new \DateTimeImmutable();
        $start = $session->getStartDateTime();
        $end = (clone $start)->modify('+' . $session->getDurationMinutes() . ' minutes');
        $oldStatus = $session->getStatus();
        $newStatus = $oldStatus;
        $hasChanged = false;
        if ($oldStatus === \App\Entity\TeamSession::STATUS_SCHEDULED && $now >= $start) {
            $session->setStatus(\App\Entity\TeamSession::STATUS_INPROGRESS);
            $newStatus = \App\Entity\TeamSession::STATUS_INPROGRESS;
            $hasChanged = true;
        }
        if ($newStatus === \App\Entity\TeamSession::STATUS_INPROGRESS && $now >= $end) {
            $session->setStatus(\App\Entity\TeamSession::STATUS_FINISHED);
            $hasChanged = true;
        }
        if ($hasChanged) {
            $em->flush();
        }
        // --- Fin mise à jour automatique ---
        // Quizzes
        $quizzesArr = [];
        foreach ($session->getQuizzes() as $q) {
            $affects = $affectUserQuizRepo->findBySessionQuizAndStatus($session, 'completed');
            $finished_users = array_map(function($affect) {
                $user = $affect->getUser();
                return [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                ];
            }, $affects);
            $quizzesArr[] = [
                'id' => $q->getId(),
                'title' => $q->getNom(),
                'code' => method_exists($q, 'getCode') ? $q->getCode() : null,
                'finished_users' => $finished_users
            ];
        }
        // Programming Problems
        $progsArr = [];
        foreach ($session->getProgProblems() as $p) {
            $affects = $affectUserProgRepo->findBySessionProgProblemAndStatus($session, 'completed');
            $finished_users = array_map(function($affect) {
                $user = $affect->getUser();
                return [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                ];
            }, $affects);
            $progsArr[] = [
                'id' => $p->getId(),
                'title' => $p->getTitle(),
                'code' => method_exists($p, 'getCode') ? $p->getCode() : null,
                'finished_users' => $finished_users
            ];
        }
        $data = [
            'id' => $session->getId(),
            'team_id' => $session->getTeam()->getId(),
            'created_by' => $session->getCreatedBy()->getId(),
            'type' => $session->getType(),
            'title' => $session->getTitle(),
            'description' => $session->getDescription(),
            'startDateTime' => $session->getStartDateTime()->format('c'),
            'durationMinutes' => $session->getDurationMinutes(),
            'status' => $session->getStatus(),
            'quizzes' => $quizzesArr,
            'prog_problems' => $progsArr,
        ];
        return new JsonResponse($data);
    }

    #[Route('/api/team-sessions/{id}', name: 'update_team_session', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        EntityManagerInterface $em,
        TeamSessionRepository $sessionRepo,
        QuizRepository $quizRepo,
        ProgProblemRepository $progRepo
    ): Response {
        $session = $sessionRepo->find($id);
        if (!$session) {
            return new JsonResponse(['error' => 'Session not found'], 404);
        }
        if ($session->getStatus() !== \App\Entity\TeamSession::STATUS_SCHEDULED) {
            return new JsonResponse(['error' => 'Only scheduled sessions can be edited.'], 400);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        $session->setType($data['type'] ?? $session->getType())
                ->setTitle($data['title'] ?? $session->getTitle())
                ->setDescription($data['description'] ?? $session->getDescription())
                ->setStartDateTime(new \DateTime($data['startDateTime']))
                ->setDurationMinutes($data['durationMinutes'] ?? $session->getDurationMinutes());

        // Update quizzes
        if ($session->getType() === 'quiz') {
            $session->getQuizzes()->clear();
            if (!empty($data['quiz_ids'])) {
                foreach ($data['quiz_ids'] as $quizId) {
                    $quiz = $quizRepo->find($quizId);
                    if ($quiz) $session->addQuiz($quiz);
                }
            }
            $session->getProgProblems()->clear();
        }
        // Update programming problems
        elseif ($session->getType() === 'programming') {
            $session->getProgProblems()->clear();
            if (!empty($data['prog_problem_ids'])) {
                foreach ($data['prog_problem_ids'] as $pid) {
                    $prob = $progRepo->find($pid);
                    if ($prob) $session->addProgProblem($prob);
                }
            }
            $session->getQuizzes()->clear();
        }

        $em->flush();

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/team-sessions/{id}', name: 'cancel_team_session', methods: ['DELETE'])]
    public function cancel(
        int $id,
        EntityManagerInterface $em,
        TeamSessionRepository $sessionRepo
    ): Response {
        $session = $sessionRepo->find($id);
        if (!$session) {
            return new JsonResponse(['error' => 'Session not found'], 404);
        }
        if ($session->getStatus() !== \App\Entity\TeamSession::STATUS_SCHEDULED) {
            return new JsonResponse(['error' => 'Only scheduled sessions can be canceled.'], 400);
        }
        $session->setStatus(\App\Entity\TeamSession::STATUS_CANCELED);

        // Supprimer toutes les affectations liées à cette session
        $affectQuizRepo = $em->getRepository(\App\Entity\AffectUserQuiz::class);
        $affectProgRepo = $em->getRepository(\App\Entity\AffectUserProgProblem::class);
        $affectQuizzes = $affectQuizRepo->findBy(['teamSession' => $session]);
        foreach ($affectQuizzes as $affect) {
            $em->remove($affect);
        }
        $affectProgs = $affectProgRepo->findBy(['teamSession' => $session]);
        foreach ($affectProgs as $affect) {
            $em->remove($affect);
        }
        $em->flush();
        return new JsonResponse(['success' => true]);
    }
}
