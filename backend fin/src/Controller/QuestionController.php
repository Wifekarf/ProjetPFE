<?php

namespace App\Controller;

use App\Entity\Langages;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\QuestionRepository; // Corrected to use QuestionRepository
use App\Entity\Question; // Corrected to use Question Entity
use App\Entity\QuizQuestion;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Service\GeminiService;

#[Route('/api/questions', name: 'api_questions_')]
class QuestionController extends AbstractController
{
    private $em;
    private $questionRepository;
    private $geminiService;

    public function __construct(EntityManagerInterface $em, QuestionRepository $questionRepository, GeminiService $geminiService)
    {
        $this->em = $em;
        $this->questionRepository = $questionRepository;
        $this->geminiService = $geminiService;
    }

    // Lister toutes les questions
    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {

    
        // Assuming 'findByFilters' is implemented in the repository
        $questions = $this->questionRepository->findAll();

        $data = [];
        foreach ($questions as $question) {
            $data[] = [
                'id' => $question->getId(),
                'question' => $question->getQuestion(),
                'options' => $question->getOptions(),
                'correctAnswer' => $question->getCorrectAnswer(),
                'difficulty' => $question->getDifficulty(),
                'language' => $question->getLanguage(), // Assuming a language relation
                'points' => $question->getPoints(),
                'time' => $question->getTime(), // ⏱️ Ajout ici
                'image' => $question->getImage(), 

            ];
        }

        return $this->json($data);
    }

    // Afficher une question par son ID
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $question = $this->questionRepository->find($id);

        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }

        return $this->json([
            'id' => $question->getId(),
            'question' => $question->getQuestion(),
            'options' => $question->getOptions(),
            'correctAnswer' => $question->getCorrectAnswer(),
            'difficulty' => $question->getDifficulty(),
            'language' => $question->getLanguage(), 
            'points' => $question->getPoints(),
            'time' => $question->getTime(), // ⏱️ Ajout ici
            'image'         => $question->getImage()

        ]);
    }

    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
    
        // Vérification des champs obligatoires
        $requiredFields = ['question', 'options', 'correctAnswer', 'difficulty', 'points', 'language_id', 'time'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $this->json(['error' => "Missing required field: $field"], 400);
            }
        }
    
        // Création de la nouvelle question
        $question = new Question();
        $question->setQuestion($data['question']);
        $question->setOptions($data['options']);
        $question->setCorrectAnswer($data['correctAnswer']);
        $question->setDifficulty($data['difficulty']);
        $question->setPoints($data['points']);
        $question->setTime($data['time']); 
    
        // Récupération de la langue
        $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
        if (!$language) {
            return $this->json(['error' => 'Invalid language'], 400);
        }
        $question->setLanguage($language);
    
        // Sauvegarde
        $this->em->persist($question);
        $this->em->flush();
    
        return $this->json([
            'id' => $question->getId(),
            'message' => 'Question created successfully!',
        ], 201);
    }
    
    // Mettre à jour une question existante
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $question = $this->questionRepository->find($id);

        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $question->setQuestion($data['question'] ?? $question->getQuestion());
        $question->setOptions($data['options'] ?? $question->getOptions());
        $question->setCorrectAnswer($data['correctAnswer'] ?? $question->getCorrectAnswer());
        $question->setDifficulty($data['difficulty'] ?? $question->getDifficulty());
        $question->setPoints($data['points'] ?? $question->getPoints());
        $question->setTime($data['time'] ?? $question->getTime());

        // Optionally update the language
        if (isset($data['language_id'])) {
            $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
            if ($language) {
                $question->setLanguage($language);
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $question->getId(),
            'message' => 'Question updated successfully!',
        ]);
    }

    // Supprimer une question
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $question = $this->questionRepository->find($id);
    
        if (!$question) {
            return $this->json(['error' => 'Question not found'], 404);
        }
    
        // Remove all related quiz_question entries before deleting the question
        $quizQuestionRepository = $this->em->getRepository(QuizQuestion::class);
        $linkedQuizQuestions = $quizQuestionRepository->findBy(['question' => $question]);
    
        foreach ($linkedQuizQuestions as $quizQuestion) {
            $this->em->remove($quizQuestion);
        }
    
        $this->em->remove($question); // Remove the question once
        $this->em->flush();           // Flush once after all removes
    
        return $this->json(['message' => 'Question deleted successfully!']);
    }
    
    // Generate questions using AI
    #[Route('/generate', name: 'generate', methods: ['POST'])]
    public function generate(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        // Validate required fields
        if (!isset($data['language_id']) || !isset($data['difficulty'])) {
            return $this->json(['error' => 'Missing required fields: language_id and difficulty'], 400);
        }
        
        $count = $data['count'] ?? 5;
        if ($count < 1 || $count > 10) {
            return $this->json(['error' => 'Count must be between 1 and 10'], 400);
        }
        
        // Get language
        $language = $this->em->getRepository(Langages::class)->find($data['language_id']);
        if (!$language) {
            return $this->json(['error' => 'Invalid language'], 400);
        }
        
        // Validate difficulty
        $validDifficulties = ['facile', 'moyen', 'difficile'];
        if (!in_array($data['difficulty'], $validDifficulties)) {
            return $this->json(['error' => 'Invalid difficulty. Must be one of: facile, moyen, difficile'], 400);
        }
        
        try {
            // Generate questions using Gemini
            $generatedQuestions = $this->geminiService->generateQuestions(
                $language->getNom(),
                $data['difficulty'],
                $count
            );
            
            if (empty($generatedQuestions)) {
                return $this->json(['error' => 'Failed to generate questions. Please try again.'], 500);
            }
            
            // Return generated questions without saving them
            $questionsPreview = [];
            foreach ($generatedQuestions as $questionData) {
                $questionsPreview[] = [
                    'question' => $questionData['question'],
                    'options' => $questionData['options'],
                    'correctAnswer' => $questionData['correctAnswer'],
                    'difficulty' => $data['difficulty'],
                    'points' => $questionData['points'],
                    'time' => $questionData['time'],
                    'language_id' => $language->getId(),
                    'language' => [
                        'id' => $language->getId(),
                        'nom' => $language->getNom(),
                        'icon' => $language->getIcon(),
                        'color' => $language->getColor()
                    ]
                ];
            }
            
            $successMessage = count($questionsPreview) === $count 
                ? 'Questions generated successfully! Please review and confirm.'
                : sprintf('Generated %d out of %d requested questions. Please review and confirm.', count($questionsPreview), $count);
            
            return $this->json([
                'message' => $successMessage,
                'count' => count($questionsPreview),
                'requested' => $count,
                'questions' => $questionsPreview
            ], 200);
            
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to generate questions: ' . $e->getMessage()], 500);
        }
    }

    // Save confirmed generated questions
    #[Route('/save-generated', name: 'save_generated', methods: ['POST'])]
    public function saveGenerated(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['questions']) || !is_array($data['questions'])) {
            return $this->json(['error' => 'Missing questions data'], 400);
        }
        
        $savedQuestions = [];
        
        try {
            foreach ($data['questions'] as $questionData) {
                // Validate required fields
                $requiredFields = ['question', 'options', 'correctAnswer', 'difficulty', 'points', 'time', 'language_id'];
                foreach ($requiredFields as $field) {
                    if (!isset($questionData[$field])) {
                        continue 2; // Skip this question if missing required field
                    }
                }
                
                // Get language
                $language = $this->em->getRepository(Langages::class)->find($questionData['language_id']);
                if (!$language) {
                    continue; // Skip this question if invalid language
                }
                
                // Create and save question
                $question = new Question();
                $question->setQuestion($questionData['question']);
                $question->setOptions($questionData['options']);
                $question->setCorrectAnswer($questionData['correctAnswer']);
                $question->setDifficulty($questionData['difficulty']);
                $question->setPoints($questionData['points']);
                $question->setTime($questionData['time']);
                $question->setLanguage($language);
                
                $this->em->persist($question);
                $this->em->flush();
                
                $savedQuestions[] = [
                    'id' => $question->getId(),
                    'question' => $question->getQuestion(),
                    'options' => $question->getOptions(),
                    'correctAnswer' => $question->getCorrectAnswer(),
                    'difficulty' => $question->getDifficulty(),
                    'points' => $question->getPoints(),
                    'time' => $question->getTime(),
                    'language' => $language,
                    'image' => $question->getImage()
                ];
            }
            
            return $this->json([
                'message' => 'Questions saved successfully!',
                'count' => count($savedQuestions),
                'questions' => $savedQuestions
            ], 201);
            
        } catch (\Exception $e) {
            return $this->json(['error' => 'Failed to save questions: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/{id}/upload-image', name:'question_upload_image', methods:['POST'])]
public function uploadImage(int $id, Request $request): JsonResponse
{
    $question = $this->questionRepository->find($id);
    if (!$question) {
        return $this->json(['error'=>'Not found'], 404);
    }

    /** @var UploadedFile $file */
    $file = $request->files->get('image');
    if (!$file) {
        return $this->json(['error'=>'No file'], 400);
    }

    $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/questions';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $filename = uniqid().'.'.$file->guessExtension();
    try {
        $file->move($uploadDir, $filename);
    } catch (FileException $e) {
        return $this->json(['error'=>'Upload failed'], 500);
    }

    $question->setImage('/uploads/questions/'.$filename);
    $this->em->flush();

    return $this->json(['image'=> $question->getImage()]);
}
}
