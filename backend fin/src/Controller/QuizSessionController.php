<?php
// src/Controller/QuizSessionController.php
namespace App\Controller;

use App\Entity\QuizSession;
use App\Entity\QuizAudit;
use App\Repository\QuizSessionRepository;
use App\Repository\QuizRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/quiz/session', name:'api_quiz_session_')]
class QuizSessionController extends AbstractController
{
    #[Route('/progress/quiz/{quizId}/{userId}/{sessionId}', name: 'api_progress_quiz', methods: ['POST'])]
    public function updateQuizProgress(
        int $quizId,
        int $userId,
        ?int $sessionId,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$sessionId) {
            // Session id manquant, on annule silencieusement
            return $this->json(['success' => false]);
        }
        $data = json_decode($request->getContent(), true);
        $answeredCount = $data['answeredCount'] ?? null;
        $affect = $em->getRepository(\App\Entity\AffectUserQuiz::class)
            ->findOneBy([
                'quiz' => $quizId,
                'user' => $userId,
                'teamSession' => $sessionId
            ]);
        if (!$affect) {
            return $this->json(['success' => false]);
        }
        if ($answeredCount !== null) {
            $affect->setAnsweredCount((int)$answeredCount);
            $em->flush();
        }
        return $this->json(['success' => true, 'answeredCount' => $affect->getAnsweredCount()]);
    }

    #[Route('/progress/prog/{progId}/{userId}/{sessionId}', name: 'api_progress_prog', methods: ['POST'])]
    public function updateProgProgress(
        int $progId,
        int $userId,
        ?int $sessionId,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$sessionId) {
            // Session id manquant, on annule silencieusement
            return $this->json(['success' => false]);
        }
        $data = json_decode($request->getContent(), true);
        $answeredCount = $data['answeredCount'] ?? null;
        $affect = $em->getRepository(\App\Entity\AffectUserProgProblem::class)
            ->findOneBy([
                'progProblem' => $progId,
                'user' => $userId,
                'teamSession' => $sessionId
            ]);
        if (!$affect) {
            return $this->json(['success' => false]);
        }
        if ($answeredCount !== null) {
            $affect->setAnsweredCount((int)$answeredCount);
            $em->flush();
        }
        return $this->json(['success' => true, 'answeredCount' => $affect->getAnsweredCount()]);
    }

    public function __construct(
        private EntityManagerInterface $em,
        private QuizRepository $quizRepo,
        private QuizSessionRepository $sessionRepo
    ){}

    // ➡️ Create a new session when quiz starts
    #[Route('/start', name:'start', methods:['POST'])]
    public function start(Request $req): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $quiz = $this->quizRepo->find($data['quizId'] ?? 0);
        if (!$quiz) return $this->json(['error'=>'Quiz not found'],404);

        // note: you might check that user is allowed etc.
        $session = new QuizSession($quiz, (int)$data['userId']);
        $this->em->persist($session);
        $this->em->flush();

        return $this->json([
          'sessionId' => $session->getId()
        ], 201);
    }

    // ➡️ Audit endpoint
    #[Route('/{id}/audit', name:'audit', methods:['POST'])]
    public function audit(int $id, Request $req): JsonResponse
    {
        $session = $this->sessionRepo->find($id);
        if (!$session) return $this->json(['error'=>'Session not found'],404);

        $data = json_decode($req->getContent(), true);
        $audit = new QuizAudit($session, $data['type'] ?? '[unknown]', $data['payload'] ?? []);
        $this->em->persist($audit);
        $this->em->flush();

        return $this->json(['ok'=>true]);
    }

    // ➡️ Lock endpoint
    #[Route('/{id}/lock', name:'lock', methods:['POST'])]
    public function lock(int $id): JsonResponse
    {
        $session = $this->sessionRepo->find($id);
        if (!$session) return $this->json(['error'=>'Session not found'],404);

        $session->setLocked(true);
        $this->em->flush();
        return $this->json(['locked'=>true]);
    }


    #[Route('/{id}/submit', name: 'submit', methods: ['POST'])]
  public function submit(int $id, Request $req): JsonResponse
  {
      $session = $this->sessionRepo->find($id);
      if (!$session) {
          return $this->json(['error'=>'Session not found'], 404);
      }
      if ($session->isLocked()) {
          return $this->json(['error'=>'Session locked'], 423);
      }

      $data = json_decode($req->getContent(), true);
      // TODO: merge these answers into your UserQuiz (you can call your existing
      // create-history endpoint or inline the logic here)

      return $this->json(['ok'=>true]);
  }

}
