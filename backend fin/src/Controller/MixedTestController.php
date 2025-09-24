<?php

namespace App\Controller;

use App\Entity\MixedTest;
use App\Entity\MixedTestQuestion;
use App\Entity\MixedTestTask;
use App\Entity\AffectUserMixedTest;
use App\Repository\MixedTestRepository;
use App\Repository\QuestionRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Repository\LangagesRepository;
use App\Service\GeminiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/mixed-tests', name: 'api_mixed_test_')]
class MixedTestController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MixedTestRepository $mixedTestRepository,
        private QuestionRepository $questionRepository,
        private TaskRepository $taskRepository,
        private UserRepository $userRepository,
        private LangagesRepository $langagesRepository,
        private GeminiService $geminiService
    ) {}

    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        try {
            $mixedTests = $this->mixedTestRepository->findAll();
            
            $data = [];
            foreach ($mixedTests as $mixedTest) {
                $data[] = [
                    'id' => $mixedTest->getId(),
                    'title' => $mixedTest->getTitle(),
                    'description' => $mixedTest->getDescription(),
                    'difficulty' => $mixedTest->getDifficulty(),
                    'points_total' => $mixedTest->getPointsTotal(),
                    'test_type' => $mixedTest->getTestType(),
                    'nb_questions' => $mixedTest->getNbQuestions(),
                    'nb_tasks' => $mixedTest->getNbTasks(),
                    'primary_language' => $mixedTest->getPrimaryLanguage() ? [
                        'id' => $mixedTest->getPrimaryLanguage()->getId(),
                        'name' => $mixedTest->getPrimaryLanguage()->getNom()
                    ] : null,
                    'date_creation' => $mixedTest->getDateCreation()->format('Y-m-d H:i:s'),
                    'question_count' => $mixedTest->getQuestions()->count(),
                    'task_count' => $mixedTest->getTasks()->count(),
                    'user_assignment_count' => $mixedTest->getUserAssignments()->count()
                ];
            }

            return $this->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/create', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            $mixedTest = new MixedTest();
            $mixedTest->setTitle($data['title'] ?? '');
            $mixedTest->setDescription($data['description'] ?? '');
            $mixedTest->setDifficulty($data['difficulty'] ?? 'medium');
            $mixedTest->setPointsTotal($data['points_total'] ?? 0);
            $mixedTest->setTestType($data['test_type'] ?? 'mixed');
            $mixedTest->setNbQuestions($data['nb_questions'] ?? 0);
            $mixedTest->setNbTasks($data['nb_tasks'] ?? 0);

            if (isset($data['primary_language_id'])) {
                $language = $this->langagesRepository->find($data['primary_language_id']);
                if ($language) {
                    $mixedTest->setPrimaryLanguage($language);
                }
            }

            $this->entityManager->persist($mixedTest);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Mixed test created successfully',
                'data' => [
                    'id' => $mixedTest->getId(),
                    'title' => $mixedTest->getTitle()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $questions = [];
            foreach ($mixedTest->getQuestions() as $mixedTestQuestion) {
                $question = $mixedTestQuestion->getQuestion();
                $questions[] = [
                    'id' => $question->getId(),
                    'question' => $question->getQuestion(),
                    'options' => $question->getOptions(),
                    'correct_answer' => $question->getCorrectAnswer(),
                    'difficulty' => $question->getDifficulty(),
                    'points' => $question->getPoints(),
                    'time' => $question->getTime(),
                    'language' => $question->getLanguage() ? [
                        'id' => $question->getLanguage()->getId(),
                        'name' => $question->getLanguage()->getNom()
                    ] : null
                ];
            }

            $tasks = [];
            foreach ($mixedTest->getTasks() as $mixedTestTask) {
                $task = $mixedTestTask->getTask();
                $tasks[] = [
                    'id' => $task->getId(),
                    'title' => $task->getTitle(),
                    'description' => $task->getDescription(),
                    'sample_test_cases' => $task->getSampleTestCases(),
                    'model_solution' => $task->getModelSolution(),
                    'difficulty' => $task->getDifficulty(),
                    'points' => $task->getPoints(),
                    'time' => $task->getTime(),
                    'evaluation_criteria' => $task->getEvaluationCriteria(),
                    'language' => $task->getLanguage() ? [
                        'id' => $task->getLanguage()->getId(),
                        'name' => $task->getLanguage()->getNom()
                    ] : null
                ];
            }

            $userAssignments = [];
            foreach ($mixedTest->getUserAssignments() as $assignment) {
                $userAssignments[] = [
                    'id' => $assignment->getId(),
                    'user' => [
                        'id' => $assignment->getUser()->getId(),
                        'username' => $assignment->getUser()->getUsername(),
                        'email' => $assignment->getUser()->getEmail()
                    ],
                    'date_affectation' => $assignment->getDateAffectation()->format('Y-m-d H:i:s'),
                    'nombre_passed' => $assignment->getNombrePassed(),
                    'status' => $assignment->getStatus()
                ];
            }

            $data = [
                'id' => $mixedTest->getId(),
                'title' => $mixedTest->getTitle(),
                'description' => $mixedTest->getDescription(),
                'difficulty' => $mixedTest->getDifficulty(),
                'points_total' => $mixedTest->getPointsTotal(),
                'test_type' => $mixedTest->getTestType(),
                'nb_questions' => $mixedTest->getNbQuestions(),
                'nb_tasks' => $mixedTest->getNbTasks(),
                'primary_language' => $mixedTest->getPrimaryLanguage() ? [
                    'id' => $mixedTest->getPrimaryLanguage()->getId(),
                    'name' => $mixedTest->getPrimaryLanguage()->getNom()
                ] : null,
                'date_creation' => $mixedTest->getDateCreation()->format('Y-m-d H:i:s'),
                'questions' => $questions,
                'tasks' => $tasks,
                'user_assignments' => $userAssignments
            ];

            return $this->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (isset($data['title'])) {
                $mixedTest->setTitle($data['title']);
            }
            if (isset($data['description'])) {
                $mixedTest->setDescription($data['description']);
            }
            if (isset($data['difficulty'])) {
                $mixedTest->setDifficulty($data['difficulty']);
            }
            if (isset($data['points_total'])) {
                $mixedTest->setPointsTotal($data['points_total']);
            }
            if (isset($data['test_type'])) {
                $mixedTest->setTestType($data['test_type']);
            }
            if (isset($data['nb_questions'])) {
                $mixedTest->setNbQuestions($data['nb_questions']);
            }
            if (isset($data['nb_tasks'])) {
                $mixedTest->setNbTasks($data['nb_tasks']);
            }
            if (isset($data['primary_language_id'])) {
                $language = $this->langagesRepository->find($data['primary_language_id']);
                if ($language) {
                    $mixedTest->setPrimaryLanguage($language);
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Mixed test updated successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $this->entityManager->remove($mixedTest);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Mixed test deleted successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/assign-questions', name: 'assign_questions', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function assignQuestions(Request $request, int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $questionIds = $data['question_ids'] ?? [];

            foreach ($questionIds as $questionId) {
                $question = $this->questionRepository->find($questionId);
                if ($question) {
                    $mixedTestQuestion = new MixedTestQuestion();
                    $mixedTestQuestion->setMixedTest($mixedTest);
                    $mixedTestQuestion->setQuestion($question);
                    $this->entityManager->persist($mixedTestQuestion);
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Questions assigned successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/assign-tasks', name: 'assign_tasks', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function assignTasks(Request $request, int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $taskIds = $data['task_ids'] ?? [];

            foreach ($taskIds as $taskId) {
                $task = $this->taskRepository->find($taskId);
                if ($task) {
                    $mixedTestTask = new MixedTestTask();
                    $mixedTestTask->setMixedTest($mixedTest);
                    $mixedTestTask->setTask($task);
                    $this->entityManager->persist($mixedTestTask);
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Tasks assigned successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/assign-users', name: 'assign_users', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function assignUsers(Request $request, int $id): JsonResponse
    {
        try {
            $mixedTest = $this->mixedTestRepository->find($id);
            
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $userIds = $data['user_ids'] ?? [];

            foreach ($userIds as $userId) {
                $user = $this->userRepository->find($userId);
                if ($user) {
                    $userAssignment = new AffectUserMixedTest();
                    $userAssignment->setMixedTest($mixedTest);
                    $userAssignment->setUser($user);
                    $this->entityManager->persist($userAssignment);
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Users assigned successfully'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 