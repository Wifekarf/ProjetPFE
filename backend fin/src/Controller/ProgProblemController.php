<?php

namespace App\Controller;

use App\Entity\ProgProblem;
use App\Repository\ProgProblemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use App\Controller\TaskController;
use App\Entity\Langages;

#[Route('/api/prog-problems', name: 'api_prog_problems_')]
class ProgProblemController extends AbstractController
{
    private EntityManagerInterface $em;
    private ProgProblemRepository $progProblemRepository;
    private TaskController $taskController;

    public function __construct(
        EntityManagerInterface $em, 
        ProgProblemRepository $progProblemRepository,
        TaskController $taskController
    ) {
        $this->em = $em;
        $this->progProblemRepository = $progProblemRepository;
        $this->taskController = $taskController;
    }

    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $progProblems = $this->progProblemRepository->findAll();

        $data = array_map(function(ProgProblem $progProblem) {
            $language = $progProblem->getLanguage();
            
            return [
                'id' => $progProblem->getId(),
                'title' => $progProblem->getTitle(),
                'description' => $progProblem->getDescription(),
                'nb_tasks' => $progProblem->getNbTasks(),
                'points_total' => $progProblem->getPointsTotal(),
                'difficulty' => $progProblem->getDifficulty(),
                'date_debut' => $progProblem->getDateDebut()?->format('Y-m-d H:i:s'),
                'date_fin' => $progProblem->getDateFin()?->format('Y-m-d H:i:s'),
                'date_creation' => $progProblem->getDateCreation()?->format('Y-m-d H:i:s'),
                'time_limit' => $progProblem->getTimeLimit(),
                'code' => $progProblem->getCode(),
                'language' => $language ? [
                    'id' => $language->getId(),
                    'nom' => $language->getNom(),
                    'description' => $language->getDescription(),
                    'icon' => $language->getIcon(),
                    'color' => $language->getColor()
                ] : null,
            ];
        }, $progProblems);

        return $this->json($data);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '\\d+'])]
    public function getProgProblem(int $id): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $language = $progProblem->getLanguage();
        
        return $this->json([
            'id' => $progProblem->getId(),
            'title' => $progProblem->getTitle(),
            'description' => $progProblem->getDescription(),
            'nb_tasks' => $progProblem->getNbTasks(),
            'points_total' => $progProblem->getPointsTotal(),
            'difficulty' => $progProblem->getDifficulty(),
            'date_debut' => $progProblem->getDateDebut()?->format('Y-m-d H:i:s'),
            'date_fin' => $progProblem->getDateFin()?->format('Y-m-d H:i:s'),
            'date_creation' => $progProblem->getDateCreation()?->format('Y-m-d H:i:s'),
            'time_limit' => $progProblem->getTimeLimit(),
            'code' => $progProblem->getCode(),
            'language' => $language ? [
                'id' => $language->getId(),
                'nom' => $language->getNom(),
                'description' => $language->getDescription(),
                'icon' => $language->getIcon(),
                'color' => $language->getColor()
            ] : null,
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $progProblem = new ProgProblem();
        $progProblem->setTitle($data['title'] ?? null);
        $progProblem->setDescription($data['description'] ?? null);
        $progProblem->setNbTasks(0);
        $progProblem->setPointsTotal(0);
        $progProblem->setDifficulty($data['difficulty'] ?? 'medium');
        $progProblem->setDateCreation(new \DateTime());
        $progProblem->setTimeLimit($data['time_limit'] ?? null);

        if (isset($data['date_debut'])) {
            $progProblem->setDateDebut(new \DateTime($data['date_debut']));
        }
        if (isset($data['date_fin'])) {
            $progProblem->setDateFin(new \DateTime($data['date_fin']));
        }
        
        // Set language if provided
        if (isset($data['language_id'])) {
            $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
            if ($language) {
                $progProblem->setLanguage($language);
            }
        }

        // Generate a random code
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        $progProblem->setCode($code);

        $this->em->persist($progProblem);
        $this->em->flush();

        return $this->json([
            'message' => 'Programming problem created successfully',
            'id' => $progProblem->getId()
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $progProblem->setTitle($data['title'] ?? $progProblem->getTitle());
        $progProblem->setDescription($data['description'] ?? $progProblem->getDescription());
        $progProblem->setNbTasks($data['nb_tasks'] ?? $progProblem->getNbTasks());
        $progProblem->setPointsTotal($data['points_total'] ?? $progProblem->getPointsTotal());
        $progProblem->setDifficulty($data['difficulty'] ?? $progProblem->getDifficulty());
        $progProblem->setTimeLimit($data['time_limit'] ?? $progProblem->getTimeLimit());

        if (isset($data['date_debut'])) {
            $progProblem->setDateDebut(new \DateTime($data['date_debut']));
        }
        if (isset($data['date_fin'])) {
            $progProblem->setDateFin(new \DateTime($data['date_fin']));
        }

        if (array_key_exists('code', $data)) {
            $progProblem->setCode($data['code']);
        }
        
        // Update language if provided
        if (isset($data['language_id'])) {
            $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
            if ($language) {
                $progProblem->setLanguage($language);
            }
        }

        $this->em->flush();

        return $this->json(['message' => 'Programming problem updated successfully']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $this->em->remove($progProblem);
        $this->em->flush();

        return $this->json(['message' => 'Programming problem deleted successfully']);
    }

    #[Route('/share-problem', name: 'share', methods: ['POST'])]
    public function shareProblem(Request $request, MailerInterface $mailer): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $code = $data['code'] ?? null;
        $problemTitle = $data['problemTitle'] ?? null;
        $link = $data['link'] ?? 'http://localhost:5173/join-coding';

        if (!$email || !$code || !$problemTitle) {
            return $this->json(['error' => 'Missing parameters'], 400);
        }

        $message = (new Email())
            ->from('weivooquiz@gmail.com')
            ->to($email)
            ->subject("Invitation to coding problem: $problemTitle")
            ->html("<p>You are invited to solve the coding problem <strong>$problemTitle</strong>.</p><p>Your code: <code>$code</code></p><p><a href='$link'>Join the challenge</a></p>");

        try {
            $mailer->send($message);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error sending email: ' . $e->getMessage()], 500);
        }

        return $this->json(['status' => 'sent'], 200);
    }

    #[Route('/verify-code', name: 'verify_code', methods: ['POST'])]
    public function verifyCode(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? null;

        if (!$code) {
            return $this->json(['error' => 'Missing code'], 400);
        }

        $progProblem = $this->progProblemRepository->findOneBy(['code' => $code]);

        if (!$progProblem) {
            return $this->json(['error' => 'Invalid code'], 404);
        }

        if ($progProblem->getDateFin() < new \DateTime()) {
            return $this->json(['error' => 'The programming problem has expired'], 400);
        }

        return $this->json([
            'id' => $progProblem->getId(),
            'title' => $progProblem->getTitle(),
        ]);
    }

    #[Route('/{id}/tasks', name: 'tasks', methods: ['GET'])]
    public function getTasks(int $id): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $conn = $this->em->getConnection();
        $sql = <<<'SQL'
            SELECT 
                t.id,
                t.task_title AS title,
                t.description,
                t.sample_test_cases AS sampleTestCases,
                t.difficulty,
                t.points,
                t.time,
                t.evaluation_criteria AS evaluationCriteria,
                l.id AS language_id,
                l.nom AS language_name,
                l.icon AS language_icon,
                l.color AS language_color
            FROM task t
            INNER JOIN prog_problem_task ppt ON ppt.task_id = t.id
            LEFT JOIN langages l ON l.id = t.language_id
            WHERE ppt.prog_problem_id = :progProblemId
            ORDER BY ppt.date_creation ASC
        SQL;

        $results = $conn->executeQuery($sql, ['progProblemId' => $id])->fetchAllAssociative();

        $tasks = array_map(fn($t) => [
            'id' => $t['id'],
            'title' => $t['title'],
            'description' => $t['description'],
            'sampleTestCases' => json_decode($t['sampleTestCases'], true) ?? [],
            'difficulty' => $t['difficulty'],
            'points' => $t['points'],
            'time' => $t['time'],
            'evaluationCriteria' => json_decode($t['evaluationCriteria'], true) ?? [],
            'language' => [
                'id' => $t['language_id'],
                'name' => $t['language_name'],
                'icon' => $t['language_icon'],
                'color' => $t['language_color']
            ],
        ], $results);

        return $this->json($tasks);
    }

    #[Route('/{id}/tasks', name: 'create_task', methods: ['POST'])]
    public function createTask(int $id, Request $request): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
    
        // Use the reusable method from TaskController to create a task
        $taskOrError = $this->taskController->createTaskFromData($data);
        
        // If there was an error, return it
        if ($taskOrError instanceof JsonResponse) {
            return $taskOrError;
        }
        
        // Otherwise, $taskOrError is the Task entity
        $task = $taskOrError;
        
        // Save task
        $this->em->persist($task);
        
        // Create association between problem and task
        $progProblemTask = new \App\Entity\ProgProblemTask();
        $progProblemTask->setProgProblem($progProblem);
        $progProblemTask->setTask($task);
        
        // Save association
        $this->em->persist($progProblemTask);
        
        // Update problem's task count and total points
        $progProblem->setNbTasks($progProblem->getNbTasks() + 1);
        $progProblem->setPointsTotal($progProblem->getPointsTotal() + $task->getPoints());
        
        $this->em->flush();
    
        return $this->json([
            'id' => $task->getId(),
            'message' => 'Task created and assigned to problem successfully!',
        ], 201);
    }

    #[Route('/{problemId}/tasks/{taskId}', name: 'update_task', methods: ['PUT'])]
    public function updateTask(int $problemId, int $taskId, Request $request): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($problemId);
        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $task = $this->em->getRepository(\App\Entity\Task::class)->find($taskId);
        if (!$task) {
            return $this->json(['message' => 'Task not found'], 404);
        }

        // Check if task is associated with this problem
        $progProblemTask = $this->em->getRepository(\App\Entity\ProgProblemTask::class)
            ->findOneBy(['progProblem' => $progProblem, 'task' => $task]);
        
        if (!$progProblemTask) {
            return $this->json(['message' => 'Task not associated with this problem'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $oldPoints = $task->getPoints();

        if (isset($data['title'])) $task->setTitle($data['title']);
        if (isset($data['description'])) $task->setDescription($data['description']);
        if (isset($data['sampleTestCases'])) $task->setSampleTestCases($data['sampleTestCases']);
        if (isset($data['modelSolution'])) $task->setModelSolution($data['modelSolution']);
        if (isset($data['difficulty'])) $task->setDifficulty($data['difficulty']);
        if (isset($data['points'])) {
            $task->setPoints($data['points']);
            // Update problem's total points
            $progProblem->setPointsTotal($progProblem->getPointsTotal() - $oldPoints + $data['points']);
        }
        if (isset($data['time'])) $task->setTime($data['time']);
        if (isset($data['evaluationCriteria'])) $task->setEvaluationCriteria($data['evaluationCriteria']);

        // Update language if provided
        if (isset($data['language'])) {
            $language = $this->em->getRepository(\App\Entity\Langages::class)
                ->findOneBy(['nom' => $data['language']['name']]);
            
            if ($language) {
                $task->setLanguage($language);
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $task->getId(),
            'message' => 'Task updated successfully!',
        ]);
    }

    #[Route('/{problemId}/tasks/{taskId}', name: 'delete_task', methods: ['DELETE'])]
    public function deleteTask(int $problemId, int $taskId): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($problemId);
        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $task = $this->em->getRepository(\App\Entity\Task::class)->find($taskId);
        if (!$task) {
            return $this->json(['message' => 'Task not found'], 404);
        }

        // Check if task is associated with this problem
        $progProblemTask = $this->em->getRepository(\App\Entity\ProgProblemTask::class)
            ->findOneBy(['progProblem' => $progProblem, 'task' => $task]);
        
        if (!$progProblemTask) {
            return $this->json(['message' => 'Task not associated with this problem'], 404);
        }

        // Update problem's task count and total points
        $progProblem->setNbTasks($progProblem->getNbTasks() - 1);
        $progProblem->setPointsTotal($progProblem->getPointsTotal() - $task->getPoints());

        // Remove the association
        $this->em->remove($progProblemTask);
        
        // Remove the task itself
        $this->em->remove($task);
        
        $this->em->flush();

        return $this->json(['message' => 'Task deleted successfully!']);
    }

    #[Route('/{id}/assigned-users', name: 'assigned_users', methods: ['GET'])]
    public function getAssignedUsers(int $id): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $conn = $this->em->getConnection();
        $sql = <<<'SQL'
            SELECT 
                u.id,
                u.username,
                u.email,
                u.role,
                aupp.status,
                aupp.date_affectation
            FROM user u
            INNER JOIN affect_user_prog_problem aupp ON aupp.user_id = u.id
            WHERE aupp.prog_problem_id = :progProblemId
            ORDER BY aupp.date_affectation DESC
        SQL;

        $results = $conn->executeQuery($sql, ['progProblemId' => $id])->fetchAllAssociative();

        $users = array_map(function($u) {
            return [
                'id' => $u['id'],
                'username' => $u['username'],
                'email' => $u['email'],
                'role' => $u['role'],
                'status' => $u['status'] ?? 'pending',
                'dateAffectation' => $u['date_affectation']
            ];
        }, $results);

        return $this->json($users);
    }

    #[Route('/{id}/assign-users', name: 'assign_users', methods: ['POST'])]
    public function assignUsers(int $id, Request $request): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($id);

        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['userIds']) || !is_array($data['userIds'])) {
            return $this->json(['error' => 'userIds array is required'], 400);
        }
        
        $assignedCount = 0;
        $alreadyAssignedCount = 0;
        
        foreach ($data['userIds'] as $userId) {
            $user = $this->em->getRepository(\App\Entity\User::class)->find($userId);
            
            if (!$user) {
                continue; // Skip invalid users
            }
            
            // Check if already assigned
            $existing = $this->em->getRepository(\App\Entity\AffectUserProgProblem::class)
                ->findOneBy(['user' => $user, 'progProblem' => $progProblem]);
            
            if ($existing) {
                $alreadyAssignedCount++;
                continue;
            }
            
            // Create assignment
            $affectation = new \App\Entity\AffectUserProgProblem();
            $affectation->setUser($user);
            $affectation->setProgProblem($progProblem);
            
            $this->em->persist($affectation);
            $assignedCount++;
        }
        
        if ($assignedCount > 0) {
            $this->em->flush();
        }
        
        return $this->json([
            'message' => 'Users assignment completed',
            'assigned' => $assignedCount,
            'alreadyAssigned' => $alreadyAssignedCount
        ]);
    }

    #[Route('/{problemId}/users/{userId}', name: 'delete_user_assignment', methods: ['DELETE'])]
    public function deleteUserAssignment(int $problemId, int $userId): JsonResponse
    {
        $progProblem = $this->progProblemRepository->find($problemId);
        if (!$progProblem) {
            return $this->json(['message' => 'Programming problem not found'], 404);
        }

        $user = $this->em->getRepository(\App\Entity\User::class)->find($userId);
        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        // Find the assignment
        $assignment = $this->em->getRepository(\App\Entity\AffectUserProgProblem::class)
            ->findOneBy(['user' => $user, 'progProblem' => $progProblem]);
        
        if (!$assignment) {
            return $this->json(['message' => 'User is not assigned to this problem'], 404);
        }

        // Delete the assignment
        $this->em->remove($assignment);
        $this->em->flush();

        return $this->json(['message' => 'User unassigned from problem successfully']);
    }
} 