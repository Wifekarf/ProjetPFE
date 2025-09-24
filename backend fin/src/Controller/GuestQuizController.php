<?php
// src/Controller/GuestQuizController.php
namespace App\Controller;

use App\Entity\GuestQuizAttempt;
use App\Repository\GuestQuizAttemptRepository;
use App\Repository\QuizRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/quiz/guest', name:'api_quiz_guest_')]
class GuestQuizController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private QuizRepository $quizRepo,
        private GuestQuizAttemptRepository $guestRepo
    ){}

    // ➊ Record a new guest attempt
    #[Route('/history', name:'record', methods:['POST'])]
    public function record(Request $req): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        foreach(['email','quizId','scorePoints','correctAnswers','userAnswer'] as $f) {
            if (!isset($data[$f])) {
                return $this->json(['error'=>"$f is required"], 400);
            }
        }
        $quiz = $this->quizRepo->find($data['quizId']);
        if (!$quiz) {
            return $this->json(['error'=>'Quiz not found'], 404);
        }
        $attempt = new GuestQuizAttempt(
            $data['email'],
            $quiz,
            (int)$data['scorePoints'],
            (int)$data['correctAnswers'],
            $data['userAnswer']
        );
        $this->em->persist($attempt);
        $this->em->flush();

        return $this->json(['status'=>'recorded','id'=>$attempt->getId()], 201);
    }

    // ➋ Admin-only: fetch all guest attempts
    #[IsGranted('ROLE_ADMIN')]
    /**
     * Récupère le texte de la question et la bonne réponse pour un quiz et une question donnée.
     * @param Quiz $quiz
     * @param int $questionId
     * @return array|null
     */
    private function getQuestionAndCorrectAnswer($quiz, $questionId): ?array
    {
        $quizQuestion = $this->em->getRepository(\App\Entity\QuizQuestion::class)
            ->findOneBy([
                'quiz' => $quiz, // ENTITÉ !
                'question' => $this->em->getRepository(\App\Entity\Question::class)->find($questionId)
            ]);
        if ($quizQuestion && $quizQuestion->getQuestion()) {
            $question = $quizQuestion->getQuestion();
            return [
                'question' => $question->getQuestion(),
                'correctAnswer' => $question->getCorrectAnswer()
            ];
        }
        return null;
    }

    #[Route('/history', name:'list', methods:['GET'])]
    public function listHistory(): JsonResponse
    {
        $all = $this->guestRepo->findBy([], ['dateCreation'=>'DESC']);
        $out = array_map(function(GuestQuizAttempt $a) {
            $quiz = $a->getQuiz();
            return [
                'id'             => $a->getId(),
                'email'          => $a->getEmail(),
                'quiz'           => [
                    'id'           => $quiz->getId(),
                    'name'         => $quiz->getNom(),
                    'nb_question'  => $quiz->getNbQuestion(),
                    'points_total' => $quiz->getPointsTotal(),
                    'type'         => $quiz->getType(),
                ],
                'scorePoints'    => $a->getScorePoints(),
                'correctAnswers' => $a->getCorrectAnswers(),
                'dateCreation'   => $a->getDateCreation()->format('Y-m-d H:i:s'),
                'userAnswer'     => array_map(function($ans) use ($a, $quiz) {
                    if (isset($ans['questionId'])) {
                        $qc = $this->getQuestionAndCorrectAnswer($quiz, $ans['questionId']);
                        if ($qc) {
                            $ans['question'] = $qc['question'];
                            $ans['correctAnswer'] = $qc['correctAnswer'];
                        }
                    }
                    $ans['question'] = $ans['question'] ?? null;
                    $ans['reponse'] = $ans['reponse'] ?? null;
                    $ans['correct'] = $ans['correctAnswer'] === $ans['reponse'];
                    $ans['correctAnswer'] = $ans['correctAnswer'] ?? null;
                    $ans['time_user_quest'] = $ans['time_user_quest'] ?? null;
                    return $ans;
                }, is_array($a->getUserAnswer()) ? $a->getUserAnswer() : []),
            ];
        }, $all);

        return $this->json(['count'=>count($out), 'history'=>$out], 200);
    }
}
