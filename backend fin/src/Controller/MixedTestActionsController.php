<?php

namespace App\Controller;

use App\Entity\MixedTest;
use App\Entity\MixedTestQuestion;
use App\Entity\MixedTestTask;
use App\Entity\AffectUserMixedTest;
use App\Entity\Question;
use App\Entity\Task;
use App\Repository\MixedTestRepository;
use App\Repository\QuestionRepository;
use App\Repository\TaskRepository;
use App\Repository\UserRepository;
use App\Repository\LangagesRepository;
use App\Repository\UserMixedTestRepository;
use App\Entity\UserMixedTest;
use App\Service\GeminiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/mixed-test-actions', name: 'api_mixed_test_actions_')]
class MixedTestActionsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MixedTestRepository $mixedTestRepository,
        private QuestionRepository $questionRepository,
        private TaskRepository $taskRepository,
        private UserRepository $userRepository,
        private LangagesRepository $langagesRepository,
        private UserMixedTestRepository $userMixedTestRepository,
        private GeminiService $geminiService
    ) {}

    /**
     * Test endpoint to check if MixedTest tables exist and work
     */
    #[Route('/test-entity', name: 'test_entity', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function testEntity(): JsonResponse
    {
        try {
            // Test if we can create a MixedTest entity
            $mixedTest = new MixedTest();
            $mixedTest->setTitle('Test Mixed Test');
            $mixedTest->setDescription('Test description');
            $mixedTest->setDifficulty('easy');
            $mixedTest->setPointsTotal(50);
            $mixedTest->setTestType('mixed');
            $mixedTest->setNbQuestions(2);
            $mixedTest->setNbTasks(1);
            
            $this->entityManager->persist($mixedTest);
            $this->entityManager->flush();
            
            $testId = $mixedTest->getId();
            
            // Clean up - delete the test entity
            $this->entityManager->remove($mixedTest);
            $this->entityManager->flush();
            
            return $this->json([
                'success' => true,
                'message' => 'MixedTest entity creation test passed',
                'test_id' => $testId
            ]);
            
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Test endpoint to check if MixedTest tables exist
     */
    #[Route('/test-tables', name: 'test_tables', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function testTables(): JsonResponse
    {
        try {
            // Test if we can query the mixed_test table
            $connection = $this->entityManager->getConnection();
            $sql = "SHOW TABLES LIKE 'mixed_test'";
            $result = $connection->executeQuery($sql)->fetchAll();
            
            $tables = [];
            $tables[] = 'mixed_test: ' . (count($result) > 0 ? 'EXISTS' : 'NOT FOUND');
            
            $sql = "SHOW TABLES LIKE 'mixed_test_question'";
            $result = $connection->executeQuery($sql)->fetchAll();
            $tables[] = 'mixed_test_question: ' . (count($result) > 0 ? 'EXISTS' : 'NOT FOUND');
            
            $sql = "SHOW TABLES LIKE 'mixed_test_task'";
            $result = $connection->executeQuery($sql)->fetchAll();
            $tables[] = 'mixed_test_task: ' . (count($result) > 0 ? 'EXISTS' : 'NOT FOUND');
            
            $sql = "SHOW TABLES LIKE 'affect_user_mixed_test'";
            $result = $connection->executeQuery($sql)->fetchAll();
            $tables[] = 'affect_user_mixed_test: ' . (count($result) > 0 ? 'EXISTS' : 'NOT FOUND');
            
            return $this->json([
                'success' => true,
                'tables' => $tables
            ]);
            
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate and assign mixed test from user CV
     * This is the main CV-based generation endpoint
     */
    #[Route('/generate-from-cv', name: 'generate_from_cv', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function generateFromCV(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $userId = $data['user_id'] ?? null;

            if (!$userId) {
                return $this->json([
                    'success' => false,
                    'error' => 'User ID is required'
                ], 400);
            }

            $user = $this->userRepository->find($userId);
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'error' => 'User not found'
                ], 404);
            }

            // Check if user has CV
            if (!$user->getCv()) {
                return $this->json([
                    'success' => false,
                    'error' => 'User does not have a CV uploaded'
                ], 400);
            }

            $cvPath = $this->getParameter('kernel.project_dir') . '/public/' . $user->getCv();
            
            // Check if CV file exists
            if (!file_exists($cvPath)) {
                return $this->json([
                    'success' => false,
                    'error' => 'CV file not found at path: ' . $cvPath
                ], 400);
            }
            
            // Get user profile attributes
            $profileAttributes = $user->getProfileAttributes() ?: [];
            
            // Generate mixed test from CV
            $mixedTestData = $this->geminiService->generateMixedTestFromCV($cvPath, $profileAttributes);
            
            // Debug: Log the generated data
            error_log("Generated mixed test data: " . json_encode($mixedTestData));
            
            // Validate the generated data
            if (!isset($mixedTestData['title']) || !isset($mixedTestData['questions']) || !isset($mixedTestData['tasks'])) {
                return $this->json([
                    'success' => false,
                    'error' => 'Invalid data generated from CV'
                ], 500);
            }
            
            // Create the mixed test entity
            error_log("Creating MixedTest entity...");
            $mixedTest = new MixedTest();
            $mixedTest->setTitle($mixedTestData['title']);
            $mixedTest->setDescription($mixedTestData['description']);
            $mixedTest->setDifficulty($mixedTestData['difficulty']);
            $mixedTest->setPointsTotal($mixedTestData['points_total']);
            $mixedTest->setTestType($mixedTestData['test_type']);
            $mixedTest->setNbQuestions($mixedTestData['nb_questions']);
            $mixedTest->setNbTasks($mixedTestData['nb_tasks']);

            // Set primary language
            $language = $this->langagesRepository->findOneBy(['nom' => $mixedTestData['primary_language']]);
            if ($language) {
                $mixedTest->setPrimaryLanguage($language);
            }

            error_log("Persisting MixedTest entity...");
            $this->entityManager->persist($mixedTest);
            $this->entityManager->flush();
            error_log("MixedTest entity created with ID: " . $mixedTest->getId());

            // Create and save questions
            error_log("Creating questions...");
            foreach ($mixedTestData['questions'] as $questionData) {
                error_log("Creating question: " . json_encode($questionData));
                $question = new Question();
                $question->setQuestion($questionData['question'] ?? 'Question text');
                $question->setOptions($questionData['options'] ?? ['Option A', 'Option B', 'Option C', 'Option D']);
                $question->setCorrectAnswer($questionData['correct_answer'] ?? $questionData['correctAnswer'] ?? 'Option A');
                $question->setDifficulty($questionData['difficulty'] ?? 'medium');
                $question->setPoints($questionData['points'] ?? 10);
                $question->setTime($questionData['time'] ?? 60);
                
                if (isset($questionData['language_id'])) {
                    $questionLanguage = $this->langagesRepository->find($questionData['language_id']);
                    if ($questionLanguage) {
                        $question->setLanguage($questionLanguage);
                    }
                }

                $this->entityManager->persist($question);
                $this->entityManager->flush();
                error_log("Question created with ID: " . $question->getId());

                // Create MixedTestQuestion junction
                $mixedTestQuestion = new MixedTestQuestion();
                $mixedTestQuestion->setMixedTest($mixedTest);
                $mixedTestQuestion->setQuestion($question);
                $this->entityManager->persist($mixedTestQuestion);
            }

            // Create and save tasks
            error_log("Creating tasks...");
            foreach ($mixedTestData['tasks'] as $taskData) {
                error_log("Creating task: " . json_encode($taskData));
                $task = new Task();
                $task->setTitle($taskData['title'] ?? 'Task title');
                $task->setDescription($taskData['description'] ?? 'Task description');
                $task->setSampleTestCases($taskData['sample_test_cases'] ?? ['input' => 'test', 'output' => 'result']);
                $task->setModelSolution($taskData['model_solution'] ?? '// Solution code here');
                $task->setDifficulty($taskData['difficulty'] ?? 'medium');
                $task->setPoints($taskData['points'] ?? 20);
                $task->setTime($taskData['time'] ?? 120);
                $task->setEvaluationCriteria($taskData['evaluation_criteria'] ?? [
                    ['name' => 'Correctness', 'weight' => 60],
                    ['name' => 'Efficiency', 'weight' => 20],
                    ['name' => 'Code Quality', 'weight' => 20]
                ]);
                
                if (isset($taskData['language_id'])) {
                    $taskLanguage = $this->langagesRepository->find($taskData['language_id']);
                    if ($taskLanguage) {
                        $task->setLanguage($taskLanguage);
                    }
                }

                $this->entityManager->persist($task);
                $this->entityManager->flush();
                error_log("Task created with ID: " . $task->getId());

                // Create MixedTestTask junction
                $mixedTestTask = new MixedTestTask();
                $mixedTestTask->setMixedTest($mixedTest);
                $mixedTestTask->setTask($task);
                $this->entityManager->persist($mixedTestTask);
            }

            // Assign the mixed test to the user
            error_log("Creating user assignment...");
            $userAssignment = new AffectUserMixedTest();
            $userAssignment->setMixedTest($mixedTest);
            $userAssignment->setUser($user);
            $this->entityManager->persist($userAssignment);

            $this->entityManager->flush();
            error_log("MixedTest generation completed successfully");

            return $this->json([
                'success' => true,
                'message' => 'Mixed test generated and assigned successfully',
                'data' => [
                    'mixed_test_id' => $mixedTest->getId(),
                    'title' => $mixedTest->getTitle(),
                    'user_id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'questions_count' => count($mixedTestData['questions']),
                    'tasks_count' => count($mixedTestData['tasks']),
                    'difficulty' => $mixedTest->getDifficulty(),
                    'points_total' => $mixedTest->getPointsTotal()
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Failed to generate mixed test: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Get users with uploaded CVs for CV-based generation
     */
    #[Route('/users-with-cv', name: 'users_with_cv', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getUsersWithCV(): JsonResponse
    {
        try {
            $users = $this->userRepository->createQueryBuilder('u')
                ->where('u.cv IS NOT NULL')
                ->andWhere('u.cv != :empty')
                ->setParameter('empty', '')
                ->select('u.id, u.username, u.email, u.cv, u.profile_attributes')
                ->getQuery()
                ->getResult();

            // Debug: Log the number of users found
            $userCount = count($users);
            
            $data = [];
            foreach ($users as $user) {
                $profileAttributes = $user['profile_attributes'] ?: [];
                $data[] = [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'cv' => $user['cv'],
                    'profile_attributes' => $profileAttributes
                ];
            }

            return $this->json([
                'success' => true,
                'data' => $data,
                'debug' => [
                    'total_users_found' => $userCount,
                    'users_with_cv' => count($data)
                ]
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mixed tests assigned to a specific user
     */
    #[Route('/user/{userId}/assigned', name: 'user_assigned', methods: ['GET'])]
    public function getUserAssignedTests(int $userId): JsonResponse
    {
        try {
            $user = $this->userRepository->find($userId);
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'error' => 'User not found'
                ], 404);
            }

            $assignments = $this->mixedTestRepository->findAssignedToUser($userId);
            
            $data = [];
            foreach ($assignments as $assignment) {
                // Get the assignment status for this user and test
                $userAssignment = $this->entityManager->getRepository(AffectUserMixedTest::class)
                    ->findOneBy(['mixedTest' => $assignment, 'user' => $user]);
                
                $status = $userAssignment ? $userAssignment->getStatus() : 'pending';
                error_log("Assignment status for test ID {$assignment->getId()}: {$status}");
                error_log("Processing assignment ID: " . $assignment->getId());
                
                // Get questions for this mixed test
                $questions = [];
                foreach ($assignment->getQuestions() as $mixedTestQuestion) {
                    $question = $mixedTestQuestion->getQuestion();
                    error_log("Processing question ID: " . $question->getId());
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

                // Get tasks for this mixed test
                $tasks = [];
                foreach ($assignment->getTasks() as $mixedTestTask) {
                    $task = $mixedTestTask->getTask();
                    error_log("Processing task ID: " . $task->getId());
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

                error_log("Questions count: " . count($questions) . ", Tasks count: " . count($tasks));

                $data[] = [
                    'id' => $assignment->getId(),
                    'title' => $assignment->getTitle(),
                    'description' => $assignment->getDescription(),
                    'difficulty' => $assignment->getDifficulty(),
                    'points_total' => $assignment->getPointsTotal(),
                    'test_type' => $assignment->getTestType(),
                    'nb_questions' => $assignment->getNbQuestions(),
                    'nb_tasks' => $assignment->getNbTasks(),
                    'primary_language' => $assignment->getPrimaryLanguage() ? [
                        'id' => $assignment->getPrimaryLanguage()->getId(),
                        'name' => $assignment->getPrimaryLanguage()->getNom()
                    ] : null,
                    'date_creation' => $assignment->getDateCreation()->format('Y-m-d H:i:s'),
                    'questions' => $questions,
                    'tasks' => $tasks,
                    'question_count' => count($questions),
                    'task_count' => count($tasks),
                    'status' => $status
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

    /**
     * Update mixed test assignment status
     */
    #[Route('/assignment/{assignmentId}/status', name: 'update_assignment_status', methods: ['PUT'])]
    public function updateAssignmentStatus(Request $request, int $assignmentId): JsonResponse
    {
        try {
            $assignment = $this->entityManager->getRepository(AffectUserMixedTest::class)->find($assignmentId);
            
            if (!$assignment) {
                return $this->json([
                    'success' => false,
                    'error' => 'Assignment not found'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $status = $data['status'] ?? null;
            $nombrePassed = $data['nombre_passed'] ?? null;

            if ($status) {
                $assignment->setStatus($status);
            }
            if ($nombrePassed !== null) {
                $assignment->setNombrePassed($nombrePassed);
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Assignment status updated successfully'
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all mixed tests (for admin management)
     */
    #[Route('/mixed-tests', name: 'get_all_mixed_tests', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getAllMixedTests(): JsonResponse
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
                    'task_count' => $mixedTest->getTasks()->count()
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

    /**
     * Create a new mixed test
     */
    #[Route('/mixed-tests/create', name: 'create_mixed_test', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function createMixedTest(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            $mixedTest = new MixedTest();
            $mixedTest->setTitle($data['title'] ?? 'New Mixed Test');
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

    /**
     * Update a mixed test
     */
    #[Route('/mixed-tests/{id}', name: 'update_mixed_test', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateMixedTest(Request $request, int $id): JsonResponse
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

    /**
     * Delete a mixed test
     */
    #[Route('/mixed-tests/{id}', name: 'delete_mixed_test', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteMixedTest(int $id): JsonResponse
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

    /**
     * Get all mixed test results for admin (BE CAREFUL EVALUATING TASKS)
     */
    #[Route('/results', name: 'get_mixed_test_results', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getMixedTestResults(): JsonResponse
    {
        try {
            // Get all UserMixedTest submissions with detailed information
            $submissions = $this->userMixedTestRepository->createQueryBuilder('umt')
                ->leftJoin('umt.mixedTest', 'mt')
                ->leftJoin('umt.user', 'u')
                ->select('umt', 'mt', 'u')
                ->orderBy('umt.dateCreation', 'DESC')
                ->getQuery()
                ->getResult();

            $results = [];
            foreach ($submissions as $submission) {
                $results[] = [
                    'submission_id' => $submission->getId(),
                    'user' => [
                        'id' => $submission->getUser()->getId(),
                        'username' => $submission->getUser()->getUsername(),
                        'email' => $submission->getUser()->getEmail()
                    ],
                    'test' => [
                        'id' => $submission->getMixedTest()->getId(),
                        'title' => $submission->getMixedTest()->getTitle(),
                        'difficulty' => $submission->getMixedTest()->getDifficulty(),
                        'points_total' => $submission->getMixedTest()->getPointsTotal()
                    ],
                    'score' => [
                        'total_score' => $submission->getScorePoints(),
                        'max_score' => $submission->getMaxScore(),
                        'percentage' => $submission->getScorePercentage(),
                        'passed' => $submission->isPassed()
                    ],
                    'quiz_section' => [
                        'correct_answers' => $submission->getCorrectAnswers(),
                        'total_questions' => $submission->getTotalQuestions(),
                        'accuracy' => $submission->getQuizAccuracy()
                    ],
                    'task_section' => [
                        'tasks_attempted' => $submission->getTasksAttempted(),
                        'tasks_completed' => $submission->getTasksCompleted(),
                        'completion_rate' => $submission->getTaskCompletionRate()
                    ],
                    'time_taken' => $submission->getTimeTaken(),
                    'submission_date' => $submission->getDateCreation()->format('Y-m-d H:i:s'),
                    'task_evaluations' => $submission->getTaskEvaluations()
                ];
            }

            return $this->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            error_log('Error in getMixedTestResults: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit mixed test results
     */
    #[Route('/submit', name: 'submit_mixed_test', methods: ['POST'])]
    public function submitMixedTest(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            $testId = $data['test_id'] ?? null;
            $answers = $data['answers'] ?? [];
            $taskSolutions = $data['task_solutions'] ?? [];
            $timeTaken = $data['time_taken'] ?? 0;
            $userId = $data['user_id'] ?? null;

            if (!$testId) {
                return $this->json([
                    'success' => false,
                    'error' => 'Test ID is required'
                ], 400);
            }

            if (!$userId) {
                return $this->json([
                    'success' => false,
                    'error' => 'User ID is required'
                ], 400);
            }

            $mixedTest = $this->mixedTestRepository->find($testId);
            if (!$mixedTest) {
                return $this->json([
                    'success' => false,
                    'error' => 'Mixed test not found'
                ], 404);
            }

            $user = $this->userRepository->find($userId);
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'error' => 'User not found'
                ], 404);
            }

            // Calculate score based on answers and solutions
            $totalScore = 0;
            $maxScore = $mixedTest->getPointsTotal();
            $correctAnswers = 0;
            $totalQuestions = 0;
            $tasksAttempted = 0;
            $tasksCompleted = 0;
            $taskEvaluations = [];
            
            // Process quiz answers (like traditional quiz scoring)
            foreach ($answers as $questionId => $answer) {
                $question = $this->questionRepository->find($questionId);
                if ($question) {
                    $totalQuestions++;
                    if ($answer === $question->getCorrectAnswer()) {
                        $totalScore += $question->getPoints();
                        $correctAnswers++;
                    }
                }
            }

            // Process task solutions (like traditional programming problem evaluation)
            foreach ($taskSolutions as $taskId => $solution) {
                $task = $this->taskRepository->find($taskId);
                if ($task && !empty($solution)) {
                    $tasksAttempted++;
                    
                    // Check if solution is valid (not placeholder/gibberish)
                    $isValidSolution = $this->isValidCodeSolution($solution);
                    
                    if (!$isValidSolution) {
                        // Give 0 points for invalid/placeholder solutions
                        $taskEvaluations[$taskId] = [
                            'score' => 0,
                            'feedback' => 'Invalid or placeholder solution provided. Please submit actual code.',
                            'strengths' => [],
                            'weaknesses' => ['No valid code solution provided'],
                            'passed' => false
                        ];
                        continue;
                    }
                    
                    try {
                        // Evaluate with LLM (BE CAREFUL EVALUATING TASKS)
                        $evaluation = $this->evaluateTaskWithLLM(
                            $solution,
                            $task->getModelSolution() ?? '',
                            $task->getDescription() ?? '',
                            $task->getEvaluationCriteria() ?? []
                        );
                        
                        $taskPoints = $task->getPoints() ?: 10;
                        $scaledScore = ($evaluation['score'] / 100) * $taskPoints;
                        
                        $taskEvaluations[$taskId] = [
                            'score' => $scaledScore,
                            'feedback' => $evaluation['feedback'],
                            'strengths' => $evaluation['strengths'],
                            'weaknesses' => $evaluation['weaknesses'],
                            'passed' => $evaluation['passed'] ?? ($evaluation['score'] >= 70)
                        ];
                        
                        $totalScore += $scaledScore;
                        
                        // Check if task is considered completed (70% threshold)
                        if ($evaluation['score'] >= 70) {
                            $tasksCompleted++;
                        }
                        
                    } catch (\Exception $e) {
                        // Log the error and continue with default values
                        error_log('Error evaluating task #' . $taskId . ': ' . $e->getMessage());
                        $taskEvaluations[$taskId] = [
                            'score' => 0,
                            'feedback' => 'Error during evaluation: ' . $e->getMessage(),
                            'strengths' => [],
                            'weaknesses' => ['Failed to evaluate due to a technical error'],
                            'passed' => false
                        ];
                    }
                }
            }

            $percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;
            $passed = $percentage >= 60; // 60% threshold
            
            error_log("Test submission summary: Test ID {$testId}, User ID {$userId}");
            error_log("Quiz section: {$correctAnswers}/{$totalQuestions} correct");
            error_log("Task section: {$tasksCompleted}/{$tasksAttempted} completed");
            error_log("Total score: {$totalScore}/{$maxScore} ({$percentage}%)");
            error_log("Passed: " . ($passed ? 'YES' : 'NO'));

            // Create and save UserMixedTest entity
            $userMixedTest = new UserMixedTest();
            $userMixedTest->setUser($user);
            $userMixedTest->setMixedTest($mixedTest);
            $userMixedTest->setScorePoints((int)$totalScore);
            $userMixedTest->setMaxScore($maxScore);
            $userMixedTest->setCorrectAnswers($correctAnswers);
            $userMixedTest->setTotalQuestions($totalQuestions);
            $userMixedTest->setTasksAttempted($tasksAttempted);
            $userMixedTest->setTasksCompleted($tasksCompleted);
            $userMixedTest->setTimeTaken($timeTaken);
            $userMixedTest->setPassed($passed);
            $userMixedTest->setAnswers($answers);
            $userMixedTest->setTaskSolutions($taskSolutions);
            $userMixedTest->setTaskEvaluations($taskEvaluations);

            $this->entityManager->persist($userMixedTest);

            // Update the user assignment status (remove from playable, mark as finished)
            $assignment = $this->entityManager->getRepository(AffectUserMixedTest::class)
                ->findOneBy(['mixedTest' => $mixedTest, 'user' => $user]);
            
            if ($assignment) {
                // Always mark as completed/failed when submitted, regardless of score
                $assignment->setStatus($passed ? 'completed' : 'failed');
                $assignment->setNombrePassed($passed ? 1 : 0);
                $this->entityManager->persist($assignment);
                
                error_log("Updated assignment status: Test ID {$testId}, User ID {$userId}, Status: " . ($passed ? 'completed' : 'failed') . ", Score: {$totalScore}/{$maxScore}");
            } else {
                error_log("Assignment not found for Test ID {$testId}, User ID {$userId}");
            }

            $this->entityManager->flush();

            // Return comprehensive results
            $resultData = [
                'submission_id' => $userMixedTest->getId(),
                'test_id' => $testId,
                'user_id' => $userId,
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'percentage' => round($percentage, 2),
                'passed' => $passed,
                'time_taken' => $timeTaken,
                'correct_answers' => $correctAnswers,
                'total_questions' => $totalQuestions,
                'tasks_attempted' => $tasksAttempted,
                'tasks_completed' => $tasksCompleted,
                'task_evaluations' => $taskEvaluations,
                'submission_date' => $userMixedTest->getDateCreation()->format('Y-m-d H:i:s')
            ];

            return $this->json([
                'success' => true,
                'message' => 'Test submitted and evaluated successfully',
                'data' => $resultData
            ]);

        } catch (\Exception $e) {
            error_log('Error in submitMixedTest: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if a code solution is valid (not placeholder/gibberish)
     * @param string $solution The submitted code solution
     * @return bool True if the solution appears to be valid code
     */
    private function isValidCodeSolution(string $solution): bool
    {
        // Remove whitespace and convert to lowercase for checking
        $cleanSolution = strtolower(trim($solution));
        
        // Check for common placeholder/gibberish patterns
        $invalidPatterns = [
            'feffefefe',
            'feefefef', 
            'fefefe',
            'test',
            'placeholder',
            'todo',
            '// todo',
            '// test',
            '// placeholder',
            'pass',
            'return null',
            'return 0',
            'return ""',
            'return false',
            'return true',
            'print("test")',
            'console.log("test")',
            'echo "test"',
            'printf("test")',
            'cout << "test"',
            'system.out.println("test")'
        ];
        
        foreach ($invalidPatterns as $pattern) {
            if (strpos($cleanSolution, $pattern) !== false) {
                return false;
            }
        }
        
        // Check if solution is too short (likely placeholder)
        if (strlen($cleanSolution) < 10) {
            return false;
        }
        
        // Check if solution contains actual code patterns
        $codePatterns = [
            'def ',
            'function ',
            'class ',
            'if ',
            'for ',
            'while ',
            'return ',
            'print(',
            'console.log(',
            'echo ',
            'printf(',
            'cout ',
            'system.out.println(',
            'public ',
            'private ',
            'protected ',
            'import ',
            'from ',
            'require ',
            'include '
        ];
        
        $hasCodePattern = false;
        foreach ($codePatterns as $pattern) {
            if (strpos($cleanSolution, $pattern) !== false) {
                $hasCodePattern = true;
                break;
            }
        }
        
        return $hasCodePattern;
    }

    /**
     * Evaluate task solution using Gemini (STRICT JSON)
     * @param string $userCode
     * @param string $modelSolution
     * @param string $problem
     * @param array  $criteria
     * @return array{score:int,feedback:string,strengths:array,weaknesses:array,passed:bool}
     */
    private function evaluateTaskWithLLM(string $userCode, string $modelSolution, string $problem, array $criteria = []): array
    {
        try {
            // Prefer env/params over hardcoding
            $apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
            if (!$apiKey) {
                throw new \RuntimeException('Missing GEMINI_API_KEY');
            }

            $criteriaText = '';
            if (!empty($criteria)) {
                $criteriaText = "Evaluation criteria:\n";
                foreach ($criteria as $criterion) {
                    if (is_array($criterion) && isset($criterion['name'], $criterion['description'])) {
                        $criteriaText .= "- {$criterion['name']}: {$criterion['description']}\n";
                    }
                }
            } else {
                $criteriaText = "Evaluate on correctness, efficiency, code quality, and edge case handling.";
            }

            // Prompt asks for STRICT JSON only
            $prompt = "You are a strict programming code evaluator.\n"
                . "Evaluate the user's code solution for the following problem and compare to the model solution.\n\n"
                . "Problem Description:\n{$problem}\n\n"
                . "Model Solution:\n```\n{$modelSolution}\n```\n\n"
                . "User Solution:\n```\n{$userCode}\n```\n\n"
                . "{$criteriaText}\n\n"
                . "Instructions:\n"
                . "- If the user's code does not attempt the problem or is empty/comment-only, score 0 and explain why.\n"
                . "- If the code is syntactically invalid, score 0 and explain syntax errors.\n"
                . "- Penalize heavily if logic does not match the model solution.\n"
                . "- Only give high scores if the code is correct, complete, and efficient.\n"
                . "- Be strict; do not reward placeholder/nonsense code.\n\n"
                . "Return STRICT JSON ONLY with this schema (no prose, no backticks):\n"
                . "{\"score\": <0..100>, \"feedback\": \"...\", \"strengths\": [\"...\"], \"weaknesses\": [\"...\"]}";

            $url = sprintf(
                'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
                'gemini-1.5-flash',
                $apiKey
            );

            $client = \Symfony\Component\HttpClient\HttpClient::create();
            $response = $client->request('POST', $url, [
                'headers' => ['Content-Type' => 'application/json'],
                'json' => [
                    // If you have a system instruction, you can add 'systemInstruction' here.
                    'contents' => [[
                        'parts' => [['text' => $prompt]],
                    ]],
                    'generationConfig' => [
                        'temperature' => 0.1,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 700,
                        // If supported in your runtime, you can uncomment:
                        // 'responseMimeType' => 'application/json',
                    ],
                ],
            ]);

            $data = $response->toArray(false);
            $raw = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Best-effort JSON extraction (strip fences if present)
            $raw = trim(preg_replace('/^```json|```$/mi', '', $raw));
            $evaluation = json_decode($raw, true);

            if (!is_array($evaluation)) {
                throw new \RuntimeException('Non-JSON response from Gemini');
            }

            // Normalize & validate
            $score = (int) max(0, min(100, (int) ($evaluation['score'] ?? 0)));
            $feedback = (string) ($evaluation['feedback'] ?? 'No feedback provided');
            $strengths = isset($evaluation['strengths']) && is_array($evaluation['strengths']) ? $evaluation['strengths'] : [];
            $weaknesses = isset($evaluation['weaknesses']) && is_array($evaluation['weaknesses']) ? $evaluation['weaknesses'] : [];

            return [
                'score' => $score,
                'feedback' => $feedback,
                'strengths' => $strengths,
                'weaknesses' => $weaknesses,
                'passed' => $score >= 70,
            ];
        } catch (\Throwable $e) {
            error_log('Gemini evaluation error: ' . $e->getMessage());
            return [
                'score' => 0,
                'feedback' => 'Could not evaluate code: ' . $e->getMessage(),
                'strengths' => [],
                'weaknesses' => ['Evaluation failed due to a technical error'],
                'passed' => false,
            ];
        }
    }

} 