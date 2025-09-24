<?php

namespace App\Controller;

use App\Repository\AffectUserQuizRepository;
use App\Repository\AffectUserProgProblemRepository;
use App\Repository\TeamSessionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\User\UserInterface;

class UserAssignmentsController extends AbstractController
{
    #[Route('/api/user/quiz-assignments', name: 'user_quiz_assignments', methods: ['GET'])]
    public function getQuizAssignments(
        UserInterface $user,
        AffectUserQuizRepository $affectUserQuizRepo
    ): JsonResponse {
        $assignments = $affectUserQuizRepo->findBy(['user' => $user]);
        $result = [];
        foreach ($assignments as $a) {
            /* if (method_exists($a, 'getStatus') && $a->getStatus() === 'completed') {
                continue;
            } */
            $quiz = $a->getQuiz();
            $result[] = [
                'id' => $quiz->getId(),
                'code' => $quiz->getCode(),
                'title' => $quiz->getNom(),
            ];
        }
        return $this->json($result);
    }

    #[Route('/api/user/prog-assignments', name: 'user_prog_assignments', methods: ['GET'])]
    public function getProgAssignments(
        UserInterface $user,
        AffectUserProgProblemRepository $affectUserProgRepo
    ): JsonResponse {
        $assignments = $affectUserProgRepo->findBy(['user' => $user]);
        $result = [];
        foreach ($assignments as $a) {
           /*  if (method_exists($a, 'getStatus') && $a->getStatus() === 'completed') {
                continue;
            } */
            $problem = $a->getProgProblem();
            $result[] = [
                'id' => $problem->getId(),
                'code' => $problem->getCode(),
                'title' => $problem->getTitle(),
            ];
        }
        return $this->json($result);
    }

    #[Route('/api/user/team-session', name: 'user_team_session', methods: ['GET'])]
    public function getTeamSession(
        UserInterface $user,
        AffectUserQuizRepository $affectUserQuizRepo,
        AffectUserProgProblemRepository $affectUserProgRepo
    ): JsonResponse {
        // Récupérer les affectations quiz
        $quizAssignments = $affectUserQuizRepo->createQueryBuilder('a')
            ->where('a.user = :user')
            ->andWhere('a.status != :completed')
            ->andWhere('a.teamSession IS NOT NULL')
            ->setParameter('user', $user)
            ->setParameter('completed', 'completed')
            ->getQuery()->getResult();

        // Récupérer les affectations prog
        $progAssignments = $affectUserProgRepo->createQueryBuilder('a')
            ->where('a.user = :user')
            ->andWhere('a.status != :completed')
            ->andWhere('a.teamSession IS NOT NULL')
            ->setParameter('user', $user)
            ->setParameter('completed', 'completed')
            ->getQuery()->getResult();

        $sessions = [];
        $sessionIds = [];

        // Quiz sessions
        foreach ($quizAssignments as $a) {
            $session = $a->getTeamSession();
            if (
                $session &&
                !in_array($session->getId(), $sessionIds) &&
                !in_array($session->getStatus(), ['finished', 'canceled'])
            ) {
                $quiz = method_exists($a, 'getQuiz') ? $a->getQuiz() : null;
                $sessions[] = [
                    'id' => $session->getId(),
                    'code' => null,
                    'title' => $session->getTitle(),
                    'description' => $session->getDescription(),
                ];
                $sessionIds[] = $session->getId();
            }
        }
        // Prog sessions
        foreach ($progAssignments as $a) {
            $session = $a->getTeamSession();
            if (
                $session &&
                !in_array($session->getId(), $sessionIds) &&
                !in_array($session->getStatus(), ['finished', 'canceled'])
            ) {
                $problem = method_exists($a, 'getProgProblem') ? $a->getProgProblem() : null;
                $sessions[] = [
                    'id' => $session->getId(),
                    'code' => null,
                    'title' => $session->getTitle(),
                    'description' => $session->getDescription(),
                ];
                $sessionIds[] = $session->getId();
            }
        }
        return $this->json($sessions);
    }
}
