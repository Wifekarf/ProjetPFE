<?php

namespace App\Controller;

use App\Entity\AffectUserQuiz;
use App\Entity\Langages;
use App\Entity\Question;
use App\Entity\Quiz;
use App\Entity\QuizQuestion;
use App\Entity\User;
use App\Entity\UserQuiz;
use App\Enum\UserRole;
use App\Repository\AffectUserQuizRepository;
use App\Repository\QuestionRepository;
use App\Repository\QuizQuestionRepository;
use App\Repository\QuizRepository;
use App\Repository\UserQuizRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\GeminiService;

class ActionsController extends AbstractController
{
    #[Route('/actions', name: 'app_actions')]
    public function index(): Response
    {
        return $this->render('actions/index.html.twig', [
            'controller_name' => 'ActionsController',
        ]);
    }
    #[Route('/actions/stats', name: 'app_actions_stats', methods: ['POST'])]
    public function stats(
        EntityManagerInterface $em,
        Request $request,
        UserRepository $userRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
    
        if (!isset($data['role'], $data['id'])) {
            return $this->json(['error' => 'role et id sont requis'], 400);
        }
    
        $userRole = UserRole::tryFrom($data['role']);
        if (!$userRole) {
            return $this->json(['error' => 'Rôle non valide'], 400);
        }
    
        $userId = $data['id'];
        $user   = $userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }
    
        switch ($userRole) {
            case UserRole::ROLE_ADMIN:
                $stats = [
                    'langages_count'           => $em->getRepository(Langages::class)->count([]),
                    'users_count'              => $em->getRepository(User::class)->count([]),
                    'questions_count'          => $em->getRepository(Question::class)->count([]),
                    'quizzes_count'            => $em->getRepository(Quiz::class)->count([]),
                    'user_quiz_attempts_count' => $em->getRepository(UserQuiz::class)->count([]),
                    'assigned_quizzes_count'   => $em->getRepository(AffectUserQuiz::class)->count([]),
                ];
                break;
    
            case UserRole::ROLE_USER:
            case UserRole::ROLE_TEAM_MANAGER:
                // counts
                $stats = [
                    'langages_count'           => $em->getRepository(Langages::class)->count([]),
                    'assigned_quizzes_count'   => $em->getRepository(AffectUserQuiz::class)->count(['user' => $userId]),
                    'completed_quizzes_count'  => $em->getRepository(AffectUserQuiz::class)->count([
                        'user'   => $userId,
                        'status' => 'completed',
                    ]),
                    'pending_quizzes_count'    => $em->getRepository(AffectUserQuiz::class)->count([
                        'user'   => $userId,
                        'status' => 'pending',
                    ]),
                    'total_quiz_attempts'      => $em->getRepository(UserQuiz::class)->count(['user' => $userId]),
                    'average_score'            => round(
                        $em->getRepository(UserQuiz::class)
                            ->createQueryBuilder('uq')
                            ->select('AVG(uq.scorePoints)')
                            ->where('uq.user = :user')
                            ->setParameter('user', $userId)
                            ->getQuery()
                            ->getSingleScalarResult() ?? 0,
                        2
                    ),
                    'best_score'               => $em->getRepository(UserQuiz::class)
                            ->createQueryBuilder('uq')
                            ->select('MAX(uq.scorePoints)')
                            ->where('uq.user = :user')
                            ->setParameter('user', $userId)
                            ->getQuery()
                            ->getSingleScalarResult() ?? 0,
                ];
    
                // last attempt
                $lastAttempt = $em->getRepository(UserQuiz::class)->findOneBy(
                    ['user' => $userId],
                    ['dateCreation' => 'DESC']
                );
                if ($lastAttempt) {
                    $quiz = $lastAttempt->getQuiz();
    
                    $stats['last_attempt'] = [
                        'id'             => $lastAttempt->getId(),
                        'user'           => [
                            'id'       => $user->getId(),
                            'username' => $user->getUsername(),
                        ],
                        'quiz'           => [
                            'id'           => $quiz->getId(),
                            'nom'          => $quiz->getNom(),
                            'nb_questions' => $quiz->getNbQuestion(),
                            'points_total' => $quiz->getPointsTotal(),
                        ],
                        'scorePoints'    => $lastAttempt->getScorePoints(),
                        'correctAnswers' => $lastAttempt->getCorrectAnswers(),
                        'dateCreation'   => $lastAttempt->getDateCreation()->format('Y-m-d H:i:s'),
                    ];
                }
    
                // quizzes completed this month
                $stats['quizzes_completed_this_month'] = (int) $em->getRepository(AffectUserQuiz::class)
                    ->createQueryBuilder('auq')
                    ->select('COUNT(auq.id)')
                    ->where('auq.user = :user')
                    ->andWhere('auq.status = :status')
                    ->andWhere('auq.dateAffectation BETWEEN :start AND :end')
                    ->setParameter('user', $userId)
                    ->setParameter('status', 'completed')
                    ->setParameter('start', new \DateTime('first day of this month'))
                    ->setParameter('end',   new \DateTime('last day of this month'))
                    ->getQuery()
                    ->getSingleScalarResult();
                break;
    
            default:
                return $this->json(['error' => 'Rôle non géré'], 400);
        }
    
        return $this->json($stats, Response::HTTP_OK);
    }
    
    // #[Route('/actions/stats', name: 'app_actions_stats', methods: ['POST'])]
    // public function stats(
    //     EntityManagerInterface $em,
    //     Request $request,
    //     UserRepository $userRepository
    // ): JsonResponse {
    //     $data = json_decode($request->getContent(), true);

    //     if (!isset($data['role'], $data['id'])) {
    //         return $this->json(['error' => 'role et id sont requis'], 400);
    //     }

    //     $userRole = UserRole::tryFrom($data['role']);
    //     if (!$userRole) {
    //         return $this->json(['error' => 'Rôle non valide'], 400);
    //     }

    //     $userId = $data['id'];
    //     $user   = $userRepository->find($userId);
    //     if (!$user) {
    //         return $this->json(['error' => 'Utilisateur non trouvé'], 404);
    //     }

    //     switch ($userRole) {
    //         case UserRole::ROLE_ADMIN:
    //             $stats = [
    //                 'langages_count'           => $em->getRepository(Langages::class)->count([]),
    //                 'users_count'              => $em->getRepository(User::class)->count([]),
    //                 'questions_count'          => $em->getRepository(Question::class)->count([]),
    //                 'quizzes_count'            => $em->getRepository(Quiz::class)->count([]),
    //                 'user_quiz_attempts_count' => $em->getRepository(UserQuiz::class)->count([]),
    //                 'assigned_quizzes_count'   => $em->getRepository(AffectUserQuiz::class)->count([]),
    //             ];
    //             break;

    //         case UserRole::ROLE_USER:
    //         case UserRole::ROLE_TEAM_MANAGER:
    //             $stats = [
    //                 'langages_count'             => $em->getRepository(Langages::class)->count([]),
    //                 'assigned_quizzes_count'     => $em->getRepository(AffectUserQuiz::class)->count(['user' => $userId]),
    //                 'completed_quizzes_count'    => $em->getRepository(AffectUserQuiz::class)->count([
    //                                                     'user'   => $userId,
    //                                                     'status' => 'completed',
    //                                                 ]),
    //                 'pending_quizzes_count'      => $em->getRepository(AffectUserQuiz::class)->count([
    //                                                     'user'   => $userId,
    //                                                     'status' => 'pending',
    //                                                 ]),
    //                 'total_quiz_attempts'        => $em->getRepository(UserQuiz::class)->count(['user' => $userId]),
    //                 'average_score'              => round($em->getRepository(UserQuiz::class)
    //                                                     ->createQueryBuilder('uq')
    //                                                     ->select('AVG(uq.scorePoints)')
    //                                                     ->where('uq.user = :user')
    //                                                     ->setParameter('user', $userId)
    //                                                     ->getQuery()
    //                                                     ->getSingleScalarResult() ?? 0, 2),
    //                 'best_score'                 => $em->getRepository(UserQuiz::class)
    //                                                     ->createQueryBuilder('uq')
    //                                                     ->select('MAX(uq.scorePoints)')
    //                                                     ->where('uq.user = :user')
    //                                                     ->setParameter('user', $userId)
    //                                                     ->getQuery()
    //                                                     ->getSingleScalarResult(),
    //             ];

    //             // dernière tentative
    //             $lastAttempt = $em->getRepository(UserQuiz::class)->findOneBy(
    //                 ['user' => $userId],
    //                 ['dateCreation' => 'DESC']
    //             );
    //             if ($lastAttempt) {
    //                 $quiz          = $lastAttempt->getQuiz();
    //                 $quizQuestions = $em->getRepository(QuizQuestion::class)->findBy(['quiz' => $quiz]);
    //                 $questions = [];

    //                 foreach ($quizQuestions as $qq) {
    //                     $q    = $qq->getQuestion();
    //                     $lang = $q->getLanguage();
    //                     $questions[] = [
    //                         'id'            => $q->getId(),
    //                         'question'      => $q->getQuestion(),
    //                         'options'       => $q->getOptions(),
    //                         'correctAnswer' => $q->getCorrectAnswer(),
    //                         'difficulty'    => $q->getDifficulty(),
    //                         'points'        => $q->getPoints(),
    //                         'time'          => $q->getTime(),
    //                         'language'      => $lang ? [
    //                             'id'    => $lang->getId(),
    //                             'nom'   => $lang->getNom(),
    //                             'icon'  => $lang->getIcon(),
    //                             'color' => $lang->getColor(),
    //                         ] : null,
    //                     ];
    //                 }

    //                 $stats['last_attempt'] = [
    //                     'id'             => $lastAttempt->getId(),
    //                     'user'           => $lastAttempt->getUser(),
    //                     'userAnswer'     => $lastAttempt->getUserAnswer(),
    //                     'quiz'           => $quiz,
    //                     'questions'      => $questions,
    //                     'scorePoints'    => $lastAttempt->getScorePoints(),
    //                     'correctAnswers' => $lastAttempt->getCorrectAnswers(),
    //                     'dateCreation'   => $lastAttempt->getDateCreation(),
    //                 ];
    //             }

    //             // quizzes complétés ce mois-ci
    //             $stats['quizzes_completed_this_month'] = $em->getRepository(AffectUserQuiz::class)
    //                 ->createQueryBuilder('auq')
    //                 ->select('COUNT(auq.id)')
    //                 ->where('auq.user = :user')
    //                 ->andWhere('auq.status = :status')
    //                 ->andWhere('auq.dateAffectation BETWEEN :start AND :end')
    //                 ->setParameter('user', $userId)
    //                 ->setParameter('status', 'completed')
    //                 ->setParameter('start', new \DateTime('first day of this month'))
    //                 ->setParameter('end',   new \DateTime('last day of this month'))
    //                 ->getQuery()
    //                 ->getSingleScalarResult();
    //             break;

    //         default:
    //             return $this->json(['error' => 'Rôle non géré'], 400);
    //     }

    //     return $this->json($stats);
    // }

    #[Route('/actions/assign-questions-to-quiz', name: 'app_assign_questions_to_quiz', methods: ['POST'])]
    public function assignQuestionsToQuiz(
        Request $request,
        EntityManagerInterface $em,
        QuizRepository $quizRepository,
        QuestionRepository $questionRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['quizId'], $data['questionIds']) || !is_array($data['questionIds'])) {
            return $this->json(['error' => 'quizId ou questionIds manquant(s)'], 400);
        }

        $quiz = $quizRepository->find($data['quizId']);
        if (!$quiz) {
            return $this->json(['error' => 'Quiz non trouvé'], 404);
        }

        $added     = [];
        $existing  = [];
        foreach ($data['questionIds'] as $qid) {
            $q = $questionRepository->find($qid);
            if (!$q) {
                continue;
            }
            $rel = $em->getRepository(QuizQuestion::class)
                      ->findOneBy(['quiz' => $quiz, 'question' => $q]);
            if ($rel) {
                $existing[] = $qid;
            } else {
                $qq = new QuizQuestion();
                $qq->setQuiz($quiz)->setQuestion($q);
                $em->persist($qq);
                $added[] = $qid;
            }
        }

        if (empty($added)) {
            return $this->json([
                'message'                  => 'Aucune nouvelle question ajoutée.',
                'questions_deja_affectees' => $existing,
            ]);
        }

        $em->flush();

        // recalcul points et nb question
        $rels = $em->getRepository(QuizQuestion::class)->findBy(['quiz' => $quiz]);
        $totalPts = array_reduce($rels, fn($sum, $r) => $sum + $r->getQuestion()->getPoints(), 0);
        $quiz->setPointsTotal($totalPts)->setNbQuestion(count($rels));
        $em->flush();

        return $this->json([
            'message'                  => 'Affectation terminée',
            'quiz_id'                  => $quiz->getId(),
            'questions_ajoutees'       => $added,
            'questions_deja_affectees' => $existing,
            'points_total'             => $quiz->getPointsTotal(),
            'nb_question'              => $quiz->getNbQuestion(),
        ]);
    }

    #[Route('/actions/assign-quiz', name: 'app_assign_quiz', methods: ['POST'])]
    public function assignQuiz(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        QuizRepository $quizRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['userId'], $data['quizId'])) {
            return $this->json(['error' => 'userId et quizId sont requis'], 400);
        }

        $user = $userRepo->find($data['userId']);
        $quiz = $quizRepo->find($data['quizId']);
        if (!$user || !$quiz) {
            return $this->json(['error' => 'Utilisateur ou Quiz non trouvé'], 404);
        }

        $exists = $em->getRepository(AffectUserQuiz::class)
                     ->findOneBy(['user' => $user, 'quiz' => $quiz]);
        if ($exists) {
            return $this->json(['error' => 'Quiz déjà affecté'], 400);
        }

        $aff = new AffectUserQuiz();
        $aff->setUser($user)->setQuiz($quiz);
        $em->persist($aff);
        $em->flush();

        return $this->json([
            'message'      => 'Quiz affecté avec succès',
            'assignmentId' => $aff->getId(),
        ], 201);
    }

    #[Route('/actions/unassign-quiz', name: 'app_unassign_quiz', methods: ['POST'])]
    public function unassignQuiz(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        QuizRepository $quizRepo,
        AffectUserQuizRepository $affRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['userId'], $data['quizId'])) {
            return $this->json(['error' => 'userId et quizId sont requis'], 400);
        }

        $user = $userRepo->find($data['userId']);
        $quiz = $quizRepo->find($data['quizId']);
        if (!$user || !$quiz) {
            return $this->json(['error' => 'Utilisateur ou Quiz non trouvé'], 404);
        }

        $aff = $affRepo->findOneBy(['user' => $user, 'quiz' => $quiz]);
        if (!$aff) {
            return $this->json(['error' => 'Aucune affectation trouvée'], 404);
        }

        $em->remove($aff);
        $em->flush();

        return $this->json([
            'message'             => 'Quiz désaffecté',
            'deletedAssignmentId' => $aff->getId(),
            'userId'              => $user->getId(),
            'quizId'              => $quiz->getId(),
        ]);
    }

    #[Route('/actions/quiz-questions/{quizId}', name: 'app_get_questions_by_quiz', methods: ['GET'])]
    public function getQuestionsByQuizId(
        int $quizId,
        EntityManagerInterface $em,
        QuizRepository $quizRepo
    ): JsonResponse {
        $quiz = $quizRepo->find($quizId);
        if (!$quiz) {
            return $this->json(['error' => 'Quiz non trouvé'], 404);
        }

        $rels = $em->getRepository(QuizQuestion::class)->findBy(['quiz' => $quiz]);
        $ids  = array_map(fn(QuizQuestion $qq) => $qq->getQuestion()->getId(), $rels);

        return $this->json([
            'quiz_id'      => $quizId,
            'question_ids' => $ids,
        ]);
    }

    #[Route('/actions/unissign-question-from-quiz/{idquiz}/{idquestion}', name: 'app_delete_question_from_quiz', methods: ['POST'])]
    public function deleteQuestionFromQuiz(
        int $idquiz,
        int $idquestion,
        EntityManagerInterface $em
    ): JsonResponse {
        $qq = $em->getRepository(QuizQuestion::class)
                 ->findOneBy(['quiz' => $idquiz, 'question' => $idquestion]);
        if (!$qq) {
            return $this->json(['error' => 'Relation non trouvée'], 404);
        }

        $quiz = $qq->getQuiz();
        $em->remove($qq);
        $em->flush();

        $rels = $em->getRepository(QuizQuestion::class)->findBy(['quiz' => $quiz]);
        $totalPts = array_reduce($rels, fn($sum, $r) => $sum + $r->getQuestion()->getPoints(), 0);
        $quiz->setPointsTotal($totalPts)->setNbQuestion(count($rels));
        $em->flush();

        return $this->json([
            'message'      => 'Question supprimée',
            'quiz_id'      => $quiz->getId(),
            'points_total' => $quiz->getPointsTotal(),
            'nb_question'  => $quiz->getNbQuestion(),
        ]);
    }
  

    #[Route('/actions/get_all_historique_user', name: 'test_get_all_user_quiz', methods: ['POST'])]
    public function getAllQuizUser(
        Request $request,
        UserQuizRepository $userQuizRepo,
        QuizQuestionRepository $quizQuestionRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?: [];
    
        // 1) Validation du rôle
        if (empty($data['role'])) {
            return $this->json(['error' => 'Le paramètre role est requis'], Response::HTTP_BAD_REQUEST);
        }
        $userRole = UserRole::tryFrom($data['role']);
        if (!$userRole) {
            return $this->json(['error' => 'Rôle non valide'], Response::HTTP_BAD_REQUEST);
        }
    
        // 2) Sélection des enregistrements selon le rôle
        if ($userRole === UserRole::ROLE_ADMIN) {
            // Admin voit tout
            $userQuizzes = $userQuizRepo->findBy([], ['dateCreation' => 'DESC']);
        } else {
            // Les autres ne voient que leur propre historique
            if (empty($data['userId'])) {
                return $this->json(['error' => 'userId est requis pour ce rôle'], Response::HTTP_BAD_REQUEST);
            }
            $userQuizzes = $userQuizRepo->findBy(
                ['user' => $data['userId']],
                ['dateCreation' => 'DESC']
            );
        }
    
        // 3) Formatage JSON-friendly
        $formatted = [];
        foreach ($userQuizzes as $uq) {
            $quiz = $uq->getQuiz();
            // nombre total de questions
            $totalQuestions = count($quizQuestionRepo->findBy(['quiz' => $quiz]));
    
            $formatted[] = [
                'historyId'      => $uq->getId(),
                'user'           => [
                    'id'       => $uq->getUser()->getId(),
                    'username' => $uq->getUser()->getUsername(),
                ],
                'quiz'           => [
                    'id'           => $quiz->getId(),
                    'nom'          => $quiz->getNom(),
                    'nb_questions' => $quiz->getNbQuestion(),
                    'points_total' => $quiz->getPointsTotal(),
                ],
                'scorePoints'    => $uq->getScorePoints(),
                'correctAnswers' => $uq->getCorrectAnswers() . '/' . $totalQuestions,
                'dateCreation'   => $uq->getDateCreation()->format('Y-m-d H:i:s'),
            ];
        }
    
        // 4) On renvoie count + history
        return $this->json([
            'count'   => count($formatted),
            'history' => $formatted,
        ], Response::HTTP_OK);
    }
    
    // #[Route('/actions/get_all_historique_user', name: 'test_get_all_user_quiz', methods: ['POST'])]
    // public function getAllQuizUser(
    //     Request $request,
    //     UserQuizRepository $userQuizRepo,
    //     QuizQuestionRepository $quizQuestionRepo
    // ): JsonResponse {
    //     $data = json_decode($request->getContent(), true);
    //     if (!isset($data['role'])) {
    //         return $this->json(['error' => 'Le paramètre role est requis'], 400);
    //     }

    //     $userRole = UserRole::tryFrom($data['role']);
    //     if (!$userRole) {
    //         return $this->json(['error' => 'Rôle non valide'], 400);
    //     }

    //     switch ($userRole) {
    //         case UserRole::ROLE_ADMIN:
    //             $userQuizzes = $userQuizRepo->findBy([], ['dateCreation' => 'DESC']);
    //             break;

    //         case UserRole::ROLE_USER:
    //         case UserRole::ROLE_TEAM_MANAGER:
    //             if (empty($data['userId'])) {
    //                 return $this->json(['error' => 'userId est requis pour ce rôle'], 400);
    //             }
    //             $userQuizzes = $userQuizRepo->findBy(
    //                 ['user' => $data['userId']],
    //                 ['dateCreation' => 'DESC']
    //             );
    //             break;

    //         default:
    //             return $this->json(['error' => 'Rôle non géré'], 400);
    //     }

    //     $formatted = [];
    //     foreach ($userQuizzes as $uq) {
    //         $quiz          = $uq->getQuiz();
    //         $quizQuestions = $quizQuestionRepo->findBy(['quiz' => $quiz]);
    //         $totalQuestions = count($quizQuestions);

    //         $questionsData = [];
    //         $totalTime     = 0;
    //         $userTotalTime = 0;
    //         $questionsMap  = [];

    //         foreach ($quizQuestions as $qq) {
    //             $q            = $qq->getQuestion();
    //             $lang         = $q->getLanguage();
    //             $questionTime = $q->getTime();
    //             $totalTime   += $questionTime ?? 0;

    //             $normalized = mb_strtolower(trim($q->getQuestion()));
    //             $questionsMap[$normalized] = [
    //                 'id'              => $q->getId(),
    //                 'correctAnswer'   => $q->getCorrectAnswer(),
    //                 'originalQuestion'=> $q->getQuestion(),
    //                 'questionTime'    => $questionTime,
    //             ];

    //             $questionsData[] = [
    //                 'id'            => $q->getId(),
    //                 'question'      => $q->getQuestion(),
    //                 'options'       => $q->getOptions(),
    //                 'correctAnswer' => $q->getCorrectAnswer(),
    //                 'difficulty'    => $q->getDifficulty(),
    //                 'points'        => $q->getPoints(),
    //                 'time'          => $questionTime,
    //                 'language'      => $lang ? [
    //                     'id'          => $lang->getId(),
    //                     'name'        => $lang->getNom(),
    //                     'description' => $lang->getDescription(),
    //                     'icon'        => $lang->getIcon(),
    //                     'color'       => $lang->getColor(),
    //                 ] : null,
    //             ];
    //         }

    //         $userAnswers = $uq->getUserAnswer();
    //         $processed   = [];
    //         if (is_array($userAnswers)) {
    //             foreach ($userAnswers as $ans) {
    //                 if (!isset($ans['time_user_quest'])) {
    //                     continue;
    //                 }
    //                 $userTotalTime += (int)$ans['time_user_quest'];
    //                 $key = mb_strtolower(trim($ans['question'] ?? ''));
    //                 $orig = $ans['question'] ?? '';
    //                 $correct = '';
    //                 $isCorrect = false;

    //                 if (isset($questionsMap[$key])) {
    //                     $correct   = $questionsMap[$key]['correctAnswer'];
    //                     $orig      = $questionsMap[$key]['originalQuestion'];
    //                     $isCorrect = (mb_strtolower(trim($ans['reponse'])) === mb_strtolower(trim($correct)));
    //                 }

    //                 $processed[] = [
    //                     'reponse'         => $ans['reponse'] ?? '',
    //                     'question'        => $orig,
    //                     'time_user_quest' => $ans['time_user_quest'],
    //                     'correct'         => $isCorrect,
    //                     'correctAnswer'   => $correct,
    //                     'questionId'      => $questionsMap[$key]['id'] ?? null,
    //                 ];
    //             }
    //         }

    //         $formatted[] = [
    //             'id'                         => $uq->getId(),
    //             'scorePoints'                => $uq->getScorePoints(),
    //             'correctAnswers'             => $uq->getCorrectAnswers() . '/' . $totalQuestions,
    //             'dateCreation'               => $uq->getDateCreation()->format('Y-m-d H:i:s'),
    //             'user_time_total_selon_time_total' => $userTotalTime . '/' . $totalTime,
    //             'userAnswer'                 => $processed,
    //             'user'                       => [
    //                 'id'       => $uq->getUser()->getId(),
    //                 'username' => $uq->getUser()->getUsername(),
    //                 'email'    => $uq->getUser()->getEmail(),
    //                 'roles'    => $uq->getUser()->getRoles(),
    //             ],
    //             'quiz' => [
    //                 'id'               => $quiz->getId(),
    //                 'nom'              => $quiz->getNom(),
    //                 'nb_question'      => $quiz->getNbQuestion(),
    //                 'points_total'     => $quiz->getPointsTotal(),
    //                 'date_debut'       => $quiz->getDateDebut()?->format('Y-m-d H:i:s'),
    //                 'date_fin'         => $quiz->getDateFin()?->format('Y-m-d H:i:s'),
    //                 'type'             => $quiz->getType(),
    //                 'date_creation_quiz'=> $quiz->getDateCreation()->format('Y-m-d H:i:s'),
    //                 'questions'        => $questionsData,
    //             ],
    //         ];
    //     }

    //     return $this->json($formatted);
    // }



    
    #[Route('/actions/create-history', name: 'app_create_history', methods: ['POST'])]
    public function creationHistorique(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        QuizRepository $quizRepo,
        AffectUserQuizRepository $affRepo,
        \App\Repository\TeamSessionRepository $teamSessionRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $required = ['userId', 'quizId', 'scorePoints', 'correctAnswers', 'userAnswer'];
        foreach ($required as $f) {
            if (!isset($data[$f])) {
                return $this->json(['error' => "Le champ $f est requis"], 400);
            }
        }

        $user = $userRepo->find($data['userId']);
        $quiz = $quizRepo->find($data['quizId']);
        if (!$user || !$quiz) {
            return $this->json(['error' => 'Utilisateur ou Quiz non trouvé'], 404);
        }

        $uq = new UserQuiz();
        $uq->setUser($user)
           ->setQuiz($quiz)
           ->setScorePoints($data['scorePoints'])
           ->setCorrectAnswers($data['correctAnswers'])
           ->setUserAnswer($data['userAnswer']);
        // Ajout de la teamSession si présente
        if (!empty($data['teamSessionId'])) {
            $teamSession = $teamSessionRepo->find($data['teamSessionId']);
            if ($teamSession) {
                $uq->setTeamSession($teamSession);
            }
        }
        $em->persist($uq);

        // Recherche de l'affectation avec ou sans teamSession
        $aff = null;
        if (!empty($data['teamSessionId'])) {
            $teamSession = $em->getRepository(\App\Entity\TeamSession::class)->find($data['teamSessionId']);
            if ($teamSession) {
                $aff = $affRepo->findOneBy([
                    'user' => $user,
                    'quiz' => $quiz,
                    'teamSession' => $teamSession
                ]);
            }
        } else {
            $aff = $affRepo->findOneBy(['user' => $user, 'quiz' => $quiz]);
        }
        if ($aff) {
            $aff->setStatus('completed');
            $em->persist($aff);
        }

        $em->flush();

        return $this->json([
            'message'           => 'Historique enregistré',
            'historyId'         => $uq->getId(),
            'userId'            => $user->getId(),
            'quizId'            => $quiz->getId(),
            'score'             => $uq->getScorePoints(),
            'date'              => $uq->getDateCreation()->format('Y-m-d H:i:s'),
            'affectationUpdated'=> $aff !== null,
        ], 201);
    }




    #[Route('/actions/start-quiz', name: 'app_start_quiz', methods: ['POST'])]
    public function startQuiz(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        QuizRepository $quizRepo,
        AffectUserQuizRepository $affRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!isset($data['userId'], $data['quizId'])) {
            return $this->json(['error' => 'userId et quizId sont requis'], 400);
        }

        $user = $userRepo->find($data['userId']);
        $quiz = $quizRepo->find($data['quizId']);
        if (!$user || !$quiz) {
            return $this->json(['error' => 'Utilisateur ou Quiz non trouvé'], 404);
        }

        $aff = $affRepo->findOneBy(['user' => $user, 'quiz' => $quiz]);
        if (!$aff) {
            return $this->json(['error' => 'Quiz non affecté à cet utilisateur'], 400);
        }

        $aff->setNombrePassed($aff->getNombrePassed() + 1)
            ->setStatus('in progress');
        $em->persist($aff);
        $em->flush();

        return $this->json([
            'message'      => 'Quiz démarré',
            'affectationId'=> $aff->getId(),
            'nombrePassed' => $aff->getNombrePassed(),
            'status'       => $aff->getStatus(),
        ]);
    }

    #[Route('/actions/get-affected-quiz-by-user', name: 'app_get_affected_quiz_by_user', methods: ['POST'])]
    public function getAffectedQuizByUser(
        Request $request,
        AffectUserQuizRepository $affRepo,
        QuizQuestionRepository $qqRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (empty($data['userId'])) {
            return $this->json(['error' => 'userId est requis'], 400);
        }

        // Ajout du filtrage par sessionId si fourni
        $criteria = [
            'user'   => $data['userId'],
            'status' => 'pending',
        ];
        if (!empty($data['sessionId'])) {
            $criteria['teamSession'] = $data['sessionId'];
        }
        $affects = $affRepo->findBy($criteria);

        $formatted = [];
        foreach ($affects as $aff) {
            // If sessionId is provided, only include if teamSession is not null and matches sessionId
            if (!empty($data['sessionId'])) {
                if (!$aff->getTeamSession() || $aff->getTeamSession()->getId() != $data['sessionId']) {
                    continue;
                }
            } else {
                // If no sessionId, only include quizzes not linked to any team session
                if ($aff->getTeamSession()) {
                    continue;
                }
            }
            $quiz          = $aff->getQuiz();
            $quizQuestions = $qqRepo->findBy(['quiz' => $quiz]);
            $questionsData = [];

            foreach ($quizQuestions as $qq) {
                $q    = $qq->getQuestion();
                $lang = $q->getLanguage();
                $questionsData[] = [
                    'id'            => $q->getId(),
                    'question'      => $q->getQuestion(),
                    'options'       => $q->getOptions(),
                    'correctAnswer' => $q->getCorrectAnswer(),
                    'difficulty'    => $q->getDifficulty(),
                    'points'        => $q->getPoints(),
                    'time'          => $q->getTime(),
                   'image'       => $q->getImage(),
                    'language'      => $lang ? [
                        'id'          => $lang->getId(),
                        'name'        => $lang->getNom(),
                        'description' => $lang->getDescription(),
                        'icon'        => $lang->getIcon(),
                        'color'       => $lang->getColor(),
                    ] : null,
                ];
            }

            $formatted[] = [
                'affectationId'    => $aff->getId(),
                'quiz'             => [
                    'id'             => $quiz->getId(),
                    'name'           => $quiz->getNom(),
                    'totalQuestions' => $quiz->getNbQuestion(),
                    'totalPoints'    => $quiz->getPointsTotal(),
                    'startDate'      => $quiz->getDateDebut()?->format('Y-m-d H:i:s'),
                    'endDate'        => $quiz->getDateFin()?->format('Y-m-d H:i:s'),
                    'type'           => $quiz->getType(),
                    'questions'      => $questionsData,
                ],
                'dateAffectation'  => $aff->getDateAffectation()->format('Y-m-d H:i:s'),
                'attempts'         => $aff->getNombrePassed(),
                'status'           => $aff->getStatus(),
            ];
        }

        return $this->json([
            'count'   => count($formatted),
            'quizzes' => $formatted,
        ]);
    }

    #[Route('/actions/get-all-affected-users', name: 'app_get_all_affected_users', methods: ['GET'])]
    public function getAllAffectedUsers(
        AffectUserQuizRepository $affRepo,
        QuizQuestionRepository $qqRepo
    ): JsonResponse {
        // Récupérer toutes les affectations triées par date
        $affects = $affRepo->findBy([], ['dateAffectation' => 'DESC']);

        $formatted = [];

        foreach ($affects as $affectation) {
            $user = $affectation->getUser();
            $quiz = $affectation->getQuiz();

            // Récupérer les questions du quiz (simplifié pour la vue admin)
            $quizQuestions = $qqRepo->findBy(['quiz' => $quiz]);
            $questionsCount = count($quizQuestions);

            $formatted[] = [
                'affectationId' => $affectation->getId(),
                'user' => [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole(),
                    'rank' => $user->getRank(),
                    'pointsTotalAll' => $user->getPointsTotalAll(),
                ],
                'quiz' => [
                    'id' => $quiz->getId(),
                    'name' => $quiz->getNom(),
                    'type' => $quiz->getType(),
                    'pointsTotal' => $quiz->getPointsTotal(),
                    'nbQuestion' => $questionsCount,
                ],
                'dateAffectation' => $affectation->getDateAffectation()->format('Y-m-d H:i:s'),
                'status' => $affectation->getStatus(),
                'nombrePassed' => $affectation->getNombrePassed(),
            ];
        }

        return $this->json(['affectations' => $formatted]);
    }

    #[Route('/actions/ai-assign-quiz/{quizId}', name: 'ai_assign_quiz', methods: ['POST'])]
    public function aiAssignQuiz(
        int $quizId,
        Request $request,
        QuizRepository $quizRepository,
        UserRepository $userRepository,
        AffectUserQuizRepository $affectUserQuizRepository,
        GeminiService $geminiService,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);
            $selectedUsers = $data['selectedUsers'] ?? [];
            
            if (empty($selectedUsers)) {
                return new JsonResponse(['success' => false, 'message' => 'No users selected'], 400);
            }

            $quiz = $quizRepository->find($quizId);
            if (!$quiz) {
                return new JsonResponse(['success' => false, 'message' => 'Quiz not found'], 404);
            }

            $assigned = [];
            $errors = [];

            foreach ($selectedUsers as $userId) {
                $user = $userRepository->find($userId);
                if (!$user) {
                    $errors[] = "User with ID $userId not found";
                    continue;
                }

                // Check if already assigned
                $existingAssignment = $affectUserQuizRepository->findOneBy([
                    'user' => $user,
                    'quiz' => $quiz
                ]);

                if ($existingAssignment) {
                    $errors[] = "User {$user->getUsername()} is already assigned to this quiz";
                    continue;
                }

                // Create new assignment
                $assignment = new AffectUserQuiz();
                $assignment->setUser($user);
                $assignment->setQuiz($quiz);
                $assignment->setDateAffectation(new \DateTime());

                $entityManager->persist($assignment);
                $assigned[] = $user->getUsername();
            }

            $entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'assigned_count' => count($assigned),
                'assigned_users' => $assigned,
                'errors' => $errors,
                'quiz_name' => $quiz->getNom()
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Assignment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/actions/ai-preview-quiz/{quizId}', name: 'ai_preview_quiz', methods: ['GET'])]
    public function aiPreviewQuiz(
        int $quizId,
        QuizRepository $quizRepository,
        UserRepository $userRepository,
        AffectUserQuizRepository $affectUserQuizRepository,
        GeminiService $geminiService
    ): JsonResponse {
        try {
            $quiz = $quizRepository->find($quizId);
            if (!$quiz) {
                return new JsonResponse(['success' => false, 'message' => 'Quiz not found'], 404);
            }

            // Get all users (excluding admins)
            $allUsers = $userRepository->findAll();
            $eligibleUsers = array_filter($allUsers, function($user) {
                return !in_array('ROLE_ADMIN', $user->getRoles());
            });

            // Get already assigned users
            $assignedUsers = $affectUserQuizRepository->findBy(['quiz' => $quiz]);
            $assignedUserIds = array_map(function($assignment) {
                return $assignment->getUser()->getId();
            }, $assignedUsers);

            // Filter out already assigned users
            $unassignedUsers = array_filter($eligibleUsers, function($user) use ($assignedUserIds) {
                return !in_array($user->getId(), $assignedUserIds);
            });

            if (empty($unassignedUsers)) {
                return new JsonResponse([
                    'success' => true,
                    'recommendations' => [],
                    'message' => 'No unassigned users available'
                ]);
            }

            // Get AI recommendations
            $recommendations = $geminiService->generateQuizAssignments($quiz, $unassignedUsers);

            return new JsonResponse([
                'success' => true,
                'recommendations' => $recommendations,
                'quiz_name' => $quiz->getNom()
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Preview failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getUserRole(User $user): string
    {
        switch ($user->getRole()) {
            case UserRole::ROLE_ADMIN:
                return 'admin';
            case UserRole::ROLE_TEAM_MANAGER:
                return 'team_manager';
            default:
                return 'user';
        }
    }

    private function canUserAccessAction(User $user, string $action): bool
    {
        switch ($user->getRole()) {
            case UserRole::ROLE_ADMIN:
                return true;
            case UserRole::ROLE_TEAM_MANAGER:
                return in_array($action, ['view_team', 'manage_team']);
            default:
                return false;
        }
    }
}
