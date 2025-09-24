<?php

namespace App\Controller;

use App\Entity\Quiz;
use App\Repository\QuizRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[Route('/api/quizzes', name: 'api_quizzes_')]
class QuizController extends AbstractController
{
    private EntityManagerInterface $em;
    private QuizRepository $quizRepository;

    public function __construct(EntityManagerInterface $em, QuizRepository $quizRepository)
    {
        $this->em = $em;
        $this->quizRepository = $quizRepository;
    }

    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $quizzes = $this->quizRepository->findAll();

        $data = array_map(fn(Quiz $quiz) => [
            'id' => $quiz->getId(),
            'nom' => $quiz->getNom(),
            'nb_question' => $quiz->getNbQuestion(),
            'points_total' => $quiz->getPointsTotal(),
            'type' => $quiz->getType(),
            'date_debut' => $quiz->getDateDebut()?->format('Y-m-d H:i:s'),
            'date_fin' => $quiz->getDateFin()?->format('Y-m-d H:i:s'),
            'date_creation' => $quiz->getDateCreation()?->format('Y-m-d H:i:s'),
            'code'  => $quiz->getCode(),
            'image' => $quiz->getImage(),

        ], $quizzes);

        return $this->json($data);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '\\d+'])]
    public function getQuiz(int $id): JsonResponse
    {
        $quiz = $this->quizRepository->find($id);

        if (! $quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        return $this->json([
            'id' => $quiz->getId(),
            'nom' => $quiz->getNom(),
            'nb_question' => $quiz->getNbQuestion(),
            'points_total' => $quiz->getPointsTotal(),
            'type' => $quiz->getType(),
            'date_debut' => $quiz->getDateDebut()?->format('Y-m-d H:i:s'),
            'date_fin' => $quiz->getDateFin()?->format('Y-m-d H:i:s'),
            'date_creation' => $quiz->getDateCreation()?->format('Y-m-d H:i:s'),
            'code' => $quiz->getCode(),
            'image'     => $quiz->getImage(),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $quiz = new Quiz();
        $quiz->setNom($data['nom'] ?? null);
        $quiz->setNbQuestion(0);
        $quiz->setPointsTotal(0);
        $quiz->setType($data['type'] ?? null);
        $quiz->setDateCreation(new \DateTime());

        if (isset($data['date_debut'])) {
            $quiz->setDateDebut(new \DateTime($data['date_debut']));
        }
        if (isset($data['date_fin'])) {
            $quiz->setDateFin(new \DateTime($data['date_fin']));
        }

        $this->em->persist($quiz);
        $this->em->flush();

        return $this->json([
            'message' => 'Quiz created successfully',
            'id' => $quiz->getId()
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $quiz = $this->quizRepository->find($id);

        if (! $quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $quiz->setNom($data['nom'] ?? $quiz->getNom());
        $quiz->setNbQuestion($data['nb_question'] ?? $quiz->getNbQuestion());
        $quiz->setPointsTotal($data['points_total'] ?? $quiz->getPointsTotal());
        $quiz->setType($data['type'] ?? $quiz->getType());

        if (isset($data['date_debut'])) {
            $quiz->setDateDebut(new \DateTime($data['date_debut']));
        }
        if (isset($data['date_fin'])) {
            $quiz->setDateFin(new \DateTime($data['date_fin']));
        }
        if (isset($data['date_creation'])) {
            $quiz->setDateCreation(new \DateTime($data['date_creation']));
        }

        if (array_key_exists('code', $data)) {
            $quiz->setCode($data['code']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Quiz updated successfully']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $quiz = $this->quizRepository->find($id);

        if (! $quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        $this->em->remove($quiz);
        $this->em->flush();

        return $this->json(['message' => 'Quiz deleted successfully']);
    }

    #[Route('/share-quiz', name: 'share', methods: ['POST'])]
    public function shareQuiz(Request $request, MailerInterface $mailer): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $code = $data['code'] ?? null;
        $quizName = $data['quizName'] ?? null;
        $link = $data['link'] ?? 'http://localhost:5173/join';

        if (! $email || ! $code || ! $quizName) {
            return $this->json(['error' => 'Missing parameters'], 400);
        }

        $message = (new Email())
            ->from('weivooquiz@gmail.com')
            ->to($email)
            ->subject("Invitation au quiz: $quizName")
            ->html("<p>Vous êtes invité au quiz <strong>$quizName</strong>.</p><p>Votre code: <code>$code</code></p><p><a href='$link'>Rejoindre le quiz</a></p>");

        try {
            $mailer->send($message);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur d\'envoi: ' . $e->getMessage()], 500);
        }

        return $this->json(['status' => 'sent'], 200);
    }

    #[Route('/verify-code', name: 'verify_code', methods: ['POST'])]
    public function verifyCode(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? null;

        if (! $code) {
            return $this->json(['error' => 'Code manquant'], 400);
        }

        $quiz = $this->quizRepository->findOneBy(['code' => $code]);

        if (! $quiz) {
            return $this->json(['error' => 'Code invalide'], 404);
        }

        if ($quiz->getDateFin() < new \DateTime()) {
            return $this->json(['error' => 'Le quiz est expiré'], 400);
        }

        return $this->json([
            'id' => $quiz->getId(),
            'nom' => $quiz->getNom(),
        ]);
    }

    #[Route('/{id}/questions', name: 'questions', methods: ['GET'])]
    public function getQuestions(int $id): JsonResponse
    {
        $quiz = $this->quizRepository->find($id);

        if (! $quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        $conn = $this->em->getConnection();
        $sql = <<<'SQL'
            SELECT 
                q.id,
                q.question_desc AS question,
                q.options,
                q.correct_answer AS correctAnswer,
                q.difficulty,
                q.points,
                q.time,
                q.image           AS image
            FROM question q
            INNER JOIN quiz_question qq ON qq.question_id = q.id
            WHERE qq.quiz_id = :quizId
            ORDER BY qq.date_creation ASC
        SQL;

        $results = $conn->executeQuery($sql, ['quizId' => $id])->fetchAllAssociative();

        $questions = array_map(fn($q) => [
            'id' => $q['id'],
            'question' => $q['question'],
            'options' => json_decode($q['options'], true) ?? [],
            'correctAnswer' => $q['correctAnswer'],
            'difficulty' => $q['difficulty'],
            'points' => $q['points'],
            'time' => $q['time'],
            'image'  => $q['image'],
        ], $results);

        return $this->json($questions);
    }

    #[Route('/{id}/upload', name: 'upload', methods: ['POST'])]
    public function upload(int $id, Request $request): JsonResponse
    {
        $quiz = $this->quizRepository->find($id);

        if (!$quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        $imageFile = $request->files->get('image');

        if ($imageFile) {
            // Create uploads directory if it doesn't exist
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $imageName = uniqid() . '.' . $imageFile->guessExtension();
            $imagePath = $uploadDir . '/' . $imageName;

            // Move the file
            $imageFile->move($uploadDir, $imageName);

            // Update quiz entity
            $quiz->setImage('/uploads/' . $imageName);
            $this->em->flush();

            return $this->json([
                'message' => 'Quiz image uploaded successfully',
                'imagePath' => '/uploads/' . $imageName
            ]);
        }

        return $this->json(['error' => 'No image file provided'], 400);
    }
}
