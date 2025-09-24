<?php

namespace App\Service;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Smalot\PdfParser\Parser;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class GeminiService
{
    private HttpClientInterface $client;
    private string $apiKey;

    public function __construct(ParameterBagInterface $parameterBag)
    {
        $this->client = HttpClient::create();
        $this->apiKey = $parameterBag->get('gemini_api_key');
    }

    public function generateProfileFromCV(string $cvPath): array
    {
        try {
            // Read the CV file
            $cvContent = $this->extractTextFromPDF($cvPath);
            
            // Prepare the prompt for Gemini
            $prompt = $this->buildProfileGenerationPrompt($cvContent);
            
            // Call Gemini API
            $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 1024,
                    ]
                ]
            ]);

            $data = $response->toArray();
            
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
                return $this->parseProfileAttributes($generatedText);
            }
            
            throw new \Exception('No valid response from Gemini API');
            
        } catch (\Exception $e) {
            throw new \Exception('Failed to generate profile: ' . $e->getMessage());
        }
    }

    private function extractTextFromPDF(string $cvPath): string
    {
        if (!file_exists($cvPath)) {
            throw new \Exception('CV file not found');
        }

        $fileExtension = strtolower(pathinfo($cvPath, PATHINFO_EXTENSION));
        
        if ($fileExtension === 'pdf') {
            try {
                // Use smalot/pdfparser to extract text from PDF
                $parser = new Parser();
                $pdf = $parser->parseFile($cvPath);
                $text = $pdf->getText();
                
                // Clean up the extracted text
                $text = trim($text);
                
                if (empty($text)) {
                    throw new \Exception('Could not extract text from PDF');
                }
                
                return $text;
                
            } catch (\Exception $e) {
                // If PDF parsing fails, throw an exception with more details
                throw new \Exception('Failed to parse PDF: ' . $e->getMessage());
            }
        } elseif (in_array($fileExtension, ['txt', 'doc', 'docx'])) {
            // For text files, read directly
            if ($fileExtension === 'txt') {
                return file_get_contents($cvPath);
            } else {
                // For DOC/DOCX, you'd need additional libraries
                return "This is a professional CV document containing the candidate's background, skills, and experience.";
            }
        }
        
        // Default fallback for any file type
        return "Professional CV document with candidate's qualifications, experience, and skills.";
    }

    private function buildProfileGenerationPrompt(string $cvContent): string
    {
        return <<<PROMPT
You are an expert at analyzing CVs and extracting key professional attributes.

Given the following CV content, extract exactly 10 specific and relevant professional profile attributes as a JSON array. 
Each attribute must include:
- "label": a concise title (e.g., "Project Management", "5+ Years Experience", "Award Winner")
- "icon": a suitable emoji
- "description": a brief, concrete description (e.g., "Managed multiple software projects from conception to delivery", "Recognized for outstanding achievement in sales", "Developed and launched 3 mobile apps")

Focus on extracting attributes that are specific to the candidate's CV, such as:
- Years of experience or seniority
- Notable projects or products delivered
- Certifications, awards, or recognitions
- Technical or domain specializations
- Leadership or management roles
- Languages spoken
- Key achievements or results
- Tools, technologies, or methodologies mastered
- Education highlights
- Soft skills demonstrated through concrete examples

CV Content:
{$cvContent}

Respond ONLY with a valid JSON array in this format:
[
    {"label": "Attribute Name", "icon": "🎯", "description": "Brief, specific description"},
    {"label": "Another Attribute", "icon": "💼", "description": "Another specific description"}
]

Do not include any text or explanation outside the JSON array. Make sure the attributes are as specific and CV-based as possible.
PROMPT;
    }

    private function parseProfileAttributes(string $generatedText): array
    {
        // Clean the response and extract JSON
        $cleanedText = trim($generatedText);
        
        // Remove any markdown formatting
        $cleanedText = preg_replace('/```json\s*/', '', $cleanedText);
        $cleanedText = preg_replace('/```\s*$/', '', $cleanedText);
        
        // Try to decode JSON
        $attributes = json_decode($cleanedText, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, return default attributes
            return $this->getDefaultAttributes();
        }
        
        // Validate that we have exactly 10 attributes with required fields
        if (!is_array($attributes) || count($attributes) !== 10) {
            return $this->getDefaultAttributes();
        }
        
        foreach ($attributes as $attribute) {
            if (!isset($attribute['label']) || !isset($attribute['icon']) || !isset($attribute['description'])) {
                return $this->getDefaultAttributes();
            }
        }
        
        return $attributes;
    }

    private function getDefaultAttributes(): array
    {
        return [
            ["label" => "Professional", "icon" => "👔", "description" => "Demonstrates professional expertise"],
            ["label" => "Experienced", "icon" => "🎯", "description" => "Has relevant work experience"],
            ["label" => "Skilled", "icon" => "⚡", "description" => "Possesses technical skills"],
            ["label" => "Educated", "icon" => "🎓", "description" => "Has educational background"],
            ["label" => "Motivated", "icon" => "🚀", "description" => "Shows drive and motivation"],
            ["label" => "Team Player", "icon" => "🤝", "description" => "Works well in teams"],
            ["label" => "Problem Solver", "icon" => "🧩", "description" => "Approaches challenges analytically"],
            ["label" => "Communicator", "icon" => "💬", "description" => "Effective communication skills"],
            ["label" => "Leader", "icon" => "👑", "description" => "Shows leadership qualities"],
            ["label" => "Adaptable", "icon" => "🔄", "description" => "Adapts to new situations"]
        ];
    }

    public function generateQuestions(string $languageName, string $difficulty, int $count = 5): array
    {
        $maxRetries = 2;
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                // Prepare the prompt for Gemini
                $prompt = $this->buildQuestionGenerationPrompt($languageName, $difficulty, $count);
                
                // Call Gemini API
                $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt]
                                ]
                            ]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.7, // Reduced temperature for more consistent output
                            'topK' => 40,
                            'topP' => 0.95,
                            'maxOutputTokens' => 2048,
                        ]
                    ]
                ]);

                $data = $response->toArray();
                
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
                    $questions = $this->parseGeneratedQuestions($generatedText);
                    
                    // If we got at least half the requested questions, consider it successful
                    if (count($questions) >= ceil($count / 2)) {
                        return $questions;
                    }
                    
                    // If not enough valid questions and we have retries left, try again
                    if ($attempt < $maxRetries) {
                        continue;
                    }
                    
                    // Return whatever we got on the last attempt
                    return $questions;
                }
                
                throw new \Exception('No valid response from Gemini API');
                
            } catch (\Exception $e) {
                if ($attempt === $maxRetries) {
                    throw new \Exception('Failed to generate questions after ' . $maxRetries . ' attempts: ' . $e->getMessage());
                }
                // If not the last attempt, continue to retry
                continue;
            }
        }
        
        return [];
    }

    private function buildQuestionGenerationPrompt(string $languageName, string $difficulty, int $count): string
    {
        $difficultyMap = [
            'facile' => 'Easy',
            'moyen' => 'Medium', 
            'difficile' => 'Hard'
        ];
        
        $difficultyLevel = $difficultyMap[$difficulty] ?? 'Medium';
        
        return <<<PROMPT
You are an expert quiz creator specializing in programming and technology questions.

Create exactly {$count} multiple choice questions about {$languageName} programming language/technology.

CRITICAL REQUIREMENTS:
- Difficulty level: {$difficultyLevel}
- Each question must have exactly 4 options labeled "A)", "B)", "C)", "D)"
- You MUST identify exactly ONE correct answer for each question
- The "correctAnswer" field must contain the EXACT text of the correct option (including the letter and parentheses)
- Questions should cover different aspects: syntax, concepts, best practices, common errors, etc.
- For Easy: Basic syntax, fundamental concepts
- For Medium: Intermediate concepts, common patterns, debugging  
- For Hard: Advanced concepts, optimization, complex scenarios

ANSWER SELECTION PROCESS:
1. First, create the question and 4 plausible options
2. Then, carefully determine which option is definitively correct
3. Set the "correctAnswer" field to match that option EXACTLY
4. Double-check that the correct answer is unambiguous and accurate

FORMAT REQUIREMENTS:
Respond ONLY with a valid JSON array in this EXACT format:
[
    {
        "question": "What keyword is used to define a constant in {$languageName}?",
        "options": ["A) var", "B) let", "C) final", "D) const"],
        "correctAnswer": "C) final",
        "points": 5,
        "time": 30
    }
]

VALIDATION CHECKLIST:
- Each question has exactly 4 options with labels A), B), C), D)
- The "correctAnswer" field matches one option exactly
- Only one option is correct per question
- All questions are about {$languageName}
- Point values: Easy (3-5), Medium (5-8), Hard (8-12)
- Time limits: Easy (20-30s), Medium (30-45s), Hard (45-60s)

Do not include explanations, comments, or any text outside the JSON array.
Generate {$count} questions with clear, unambiguous correct answers:
PROMPT;
    }

    private function parseGeneratedQuestions(string $generatedText): array
    {
        // Clean the response and extract JSON
        $cleanedText = trim($generatedText);
        
        // Remove any markdown formatting
        $cleanedText = preg_replace('/```json\s*/', '', $cleanedText);
        $cleanedText = preg_replace('/```\s*$/', '', $cleanedText);
        
        // Try to decode JSON
        $questions = json_decode($cleanedText, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, return empty array
            return [];
        }
        
        // Validate that we have an array of questions
        if (!is_array($questions)) {
            return [];
        }
        
        // Validate each question has required fields and fix common issues
        $validQuestions = [];
        $skippedCount = 0;
        
        foreach ($questions as $index => $question) {
            if (isset($question['question']) && 
                isset($question['options']) && 
                isset($question['correctAnswer']) &&
                is_array($question['options']) &&
                count($question['options']) === 4) {
                
                // Validate and fix the correctAnswer
                $fixedQuestion = $this->validateAndFixCorrectAnswer($question);
                
                if ($fixedQuestion !== null) {
                    // Ensure default values for missing fields
                    $fixedQuestion['points'] = $fixedQuestion['points'] ?? 5;
                    $fixedQuestion['time'] = $fixedQuestion['time'] ?? 30;
                    
                    $validQuestions[] = $fixedQuestion;
                } else {
                    $skippedCount++;
                    // Log the problematic question for debugging
                    error_log("Skipped question " . ($index + 1) . " - couldn't match correct answer: " . json_encode($question));
                }
            } else {
                $skippedCount++;
                error_log("Skipped question " . ($index + 1) . " - missing required fields: " . json_encode($question));
            }
        }
        
        if ($skippedCount > 0) {
            error_log("Question generation: Skipped {$skippedCount} invalid questions, kept " . count($validQuestions));
        }
        
        return $validQuestions;
    }
    
    private function validateAndFixCorrectAnswer(array $question): ?array
    {
        $options = $question['options'];
        $correctAnswer = $question['correctAnswer'];
        
        // Check if correctAnswer matches exactly one of the options
        if (in_array($correctAnswer, $options, true)) {
            return $question; // Already valid
        }
        
        // Try to fix common formatting issues
        foreach ($options as $option) {
            // Case 1: correctAnswer is just the letter (e.g., "C" instead of "C) final")
            if (preg_match('/^([A-D])\)\s*(.+)/', $option, $optionMatches) && 
                ($correctAnswer === $optionMatches[1] || $correctAnswer === $optionMatches[1] . ')')) {
                $question['correctAnswer'] = $option;
                return $question;
            }
            
            // Case 2: correctAnswer is the content without the letter (e.g., "final" instead of "C) final")
            if (preg_match('/^[A-D]\)\s*(.+)/', $option, $optionMatches) && 
                trim($correctAnswer) === trim($optionMatches[1])) {
                $question['correctAnswer'] = $option;
                return $question;
            }
            
            // Case 3: Fuzzy match - check if correctAnswer is contained in option or vice versa
            if (stripos($option, trim($correctAnswer)) !== false || 
                stripos(trim($correctAnswer), $option) !== false) {
                $question['correctAnswer'] = $option;
                return $question;
            }
        }
        
        // If no match found, try to intelligently guess based on common patterns
        $bestMatch = $this->findBestMatchOption($options, $correctAnswer);
        if ($bestMatch !== null) {
            $question['correctAnswer'] = $bestMatch;
            return $question;
        }
        
        // If we can't fix it, return null to exclude this question
        return null;
    }
    
    private function findBestMatchOption(array $options, string $correctAnswer): ?string
    {
        $similarities = [];
        
        foreach ($options as $option) {
            // Calculate similarity score
            $similarity = 0;
            
            // Check if correctAnswer contains key words from the option
            $optionWords = preg_split('/\s+/', strtolower(preg_replace('/^[A-D]\)\s*/', '', $option)));
            $answerWords = preg_split('/\s+/', strtolower($correctAnswer));
            
            foreach ($optionWords as $word) {
                if (in_array($word, $answerWords)) {
                    $similarity++;
                }
            }
            
            $similarities[$option] = $similarity;
        }
        
        // Return the option with highest similarity (if > 0)
        $maxSimilarity = max($similarities);
        if ($maxSimilarity > 0) {
            return array_search($maxSimilarity, $similarities);
        }
        
        return null;
    }

    public function generateTasks(string $languageName, string $difficulty, int $count = 3): array
    {
        try {
            // Check if API key is set
            if (empty($this->apiKey)) {
                throw new \Exception('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.');
            }
            
            error_log('Gemini API Key: ' . (empty($this->apiKey) ? 'NOT SET' : 'SET'));
            
            // Prepare the prompt for Gemini
            $prompt = $this->buildTaskGenerationPrompt($languageName, $difficulty, $count);
            
            // Call Gemini API
            $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.8,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 3048,
                    ]
                ]
            ]);

            $data = $response->toArray();
            
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
                return $this->parseGeneratedTasks($generatedText);
            }
            
            throw new \Exception('No valid response from Gemini API');
            
        } catch (\Exception $e) {
            error_log('GeminiService error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            throw new \Exception('Failed to generate tasks: ' . $e->getMessage());
        }
    }

    private function buildTaskGenerationPrompt(string $languageName, string $difficulty, int $count): string
    {
        return <<<PROMPT
You are an expert programming instructor specializing in creating coding challenges and programming tasks.

Create exactly {$count} programming tasks for {$languageName} programming language.

Requirements:
- Difficulty level: {$difficulty}
- Each task should be a practical programming challenge
- Include clear problem description and sample test cases
- For easy: Basic syntax, simple algorithms (loops, conditionals, basic data structures)
- For medium: Intermediate algorithms, data manipulation, object-oriented concepts
- For hard: Advanced algorithms, optimization, complex data structures, design patterns

Respond ONLY with a valid JSON array in this exact format:
[
    {
        "title": "Task Title",
        "description": "Clear description of what needs to be implemented. Include requirements, constraints, and expected behavior.",
        "sampleTestCases": [
            {"input": "example input", "output": "expected output"},
            {"input": "another input", "output": "another output"}
        ],
        "modelSolution": "// Sample solution code that solves the problem",
        "points": 15,
        "time": 30,
        "evaluationCriteria": [
            {"name": "Correctness", "weight": 60},
            {"name": "Efficiency", "weight": 25},
            {"name": "Code Quality", "weight": 15}
        ]
    }
]

Guidelines:
- Use appropriate point values: easy (10-15 points), medium (15-25 points), hard (25-40 points)
- Use appropriate time limits: easy (15-30 minutes), medium (30-45 minutes), hard (45-90 minutes)
- Make tasks realistic and educational
- Include meaningful sample test cases that help understand the problem
- Provide working model solutions
- Ensure evaluation criteria weights sum to 100
- Do not include any text outside the JSON array
- Ensure the JSON is properly formatted and valid

Generate {$count} {$difficulty} programming tasks for {$languageName} now:
PROMPT;
    }

    private function parseGeneratedTasks(string $generatedText): array
    {
        // Clean the response and extract JSON
        $cleanedText = trim($generatedText);
        
        // Remove any markdown formatting
        $cleanedText = preg_replace('/```json\s*/', '', $cleanedText);
        $cleanedText = preg_replace('/```\s*$/', '', $cleanedText);
        
        // Try to decode JSON
        $tasks = json_decode($cleanedText, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, return empty array
            return [];
        }
        
        // Validate that we have an array of tasks
        if (!is_array($tasks)) {
            return [];
        }
        
        // Validate each task has required fields
        $validTasks = [];
        foreach ($tasks as $task) {
            // Check for both camelCase and snake_case field names
            $sampleTestCases = $task['sampleTestCases'] ?? $task['sample_test_cases'] ?? null;
            $modelSolution = $task['modelSolution'] ?? $task['model_solution'] ?? null;
            $evaluationCriteria = $task['evaluationCriteria'] ?? $task['evaluation_criteria'] ?? null;
            
            if (isset($task['title']) && 
                isset($task['description']) && 
                $sampleTestCases &&
                is_array($sampleTestCases)) {
                
                // Normalize field names to camelCase for frontend consistency
                $normalizedTask = [
                    'title' => $task['title'],
                    'description' => $task['description'],
                    'sampleTestCases' => $sampleTestCases,
                    'modelSolution' => $modelSolution ?? '// Solution to be provided',
                    'difficulty' => $task['difficulty'] ?? 'medium',
                    'points' => $task['points'] ?? 20,
                    'time' => $task['time'] ?? 120,
                    'evaluationCriteria' => $evaluationCriteria ?? [
                        ['name' => 'Correctness', 'weight' => 60],
                        ['name' => 'Efficiency', 'weight' => 20],
                        ['name' => 'Code Quality', 'weight' => 20]
                    ],
                    'language_id' => $task['language_id'] ?? 1
                ];
                
                $validTasks[] = $normalizedTask;
            }
        }
        
        return $validTasks;
    }

    /**
     * Generate smart quiz assignments based on user profiles and quiz characteristics
     */
    public function generateQuizAssignments($quiz, array $users): array
    {
        $assignments = [];
        
        foreach ($users as $user) {
            $score = $this->calculateUserQuizMatch($user, $quiz);
            $scorePercent = round($score * 100);
            
            $assignments[] = [
                'userId' => $user->getId(),
                'userName' => $user->getUsername(),
                'userRank' => $user->getRank()?->value ?? 'N/A',
                'userPoints' => $user->getPointsTotalAll() ?? 0,
                'score' => $scorePercent,
                'explanation' => $this->generateQuizAssignmentReasoning($user, $quiz, $score),
                'skills' => $this->extractRelevantSkills($user, $quiz)
            ];
        }
        
        // Sort by score (highest first)
        usort($assignments, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        
        return $assignments;
    }

    /**
     * Generate smart programming problem assignments based on user profiles
     */
    public function generateProgProblemAssignments($problem, array $users): array
    {
        $assignments = [];
        
        foreach ($users as $user) {
            $score = $this->calculateUserProblemMatch($user, $problem);
            $scorePercent = round($score * 100);
            
            $assignments[] = [
                'userId' => $user->getId(),
                'userName' => $user->getUsername(),
                'userRank' => $user->getRank()?->value ?? 'N/A',
                'userPoints' => $user->getPointsTotalAll() ?? 0,
                'score' => $scorePercent,
                'explanation' => $this->generateProblemAssignmentReasoning($user, $problem, $score),
                'skills' => $this->extractRelevantSkills($user, $problem),
                'languages' => $this->extractRelevantLanguages($user, $problem)
            ];
        }
        
        // Sort by score (highest first)
        usort($assignments, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        
        return $assignments;
    }

    private function calculateUserQuizMatch($user, $quiz): float
    {
        $score = 0.0;
        $profileAttributes = $user->getProfileAttributes() ?? [];
        
        // Base score for all users
        $score += 0.2;
        
        // Rank-based matching
        $rank = $user->getRank()->value;
        $quizPoints = $quiz->getPointsTotal();
        
        if ($rank === 'SENIOR' && $quizPoints > 40) {
            $score += 0.3; // Senior users for challenging quizzes
        } elseif ($rank === 'JUNIOR' && $quizPoints <= 40) {
            $score += 0.3; // Junior users for easier quizzes
        } elseif ($rank === 'ALTERNATE') {
            $score += 0.2; // Alternate users get moderate score
        }
        
        // Profile attributes matching
        foreach ($profileAttributes as $attribute) {
            $label = strtolower($attribute['label'] ?? '');
            $description = strtolower($attribute['description'] ?? '');
            
            // Technical skills for technical quizzes
            if ($quiz->getType() === 'technique') {
                if (str_contains($label, 'programming') || 
                    str_contains($label, 'developer') || 
                    str_contains($label, 'technical') ||
                    str_contains($description, 'programming') ||
                    str_contains($description, 'code')) {
                    $score += 0.2;
                }
            }
            
            // Experience matching
            if (str_contains($label, 'experience') || 
                str_contains($label, 'years') ||
                str_contains($description, 'experience')) {
                $score += 0.1;
            }
        }
        
        // Performance-based matching
        $userPoints = $user->getPointsTotalAll();
        if ($userPoints > 100 && $quizPoints > 30) {
            $score += 0.2; // High performers for challenging content
        } elseif ($userPoints <= 50 && $quizPoints <= 30) {
            $score += 0.1; // New users for easier content
        }
        
        return min($score, 1.0);
    }

    private function calculateUserProblemMatch($user, $problem): float
    {
        $score = 0.0;
        $profileAttributes = $user->getProfileAttributes() ?? [];
        
        // Base score for all users
        $score += 0.2;
        
        // Difficulty and rank matching
        $rank = $user->getRank()->value;
        $difficulty = $problem->getDifficulty();
        
        if ($rank === 'SENIOR' && in_array($difficulty, ['hard', 'difficile'])) {
            $score += 0.3;
        } elseif ($rank === 'JUNIOR' && in_array($difficulty, ['easy', 'facile'])) {
            $score += 0.3;
        } elseif ($rank === 'ALTERNATE' && in_array($difficulty, ['medium', 'moyen'])) {
            $score += 0.3;
        }
        
        // Programming skills matching
        foreach ($profileAttributes as $attribute) {
            $label = strtolower($attribute['label'] ?? '');
            $description = strtolower($attribute['description'] ?? '');
            
            if (str_contains($label, 'programming') || 
                str_contains($label, 'developer') || 
                str_contains($label, 'coding') ||
                str_contains($description, 'programming') ||
                str_contains($description, 'software') ||
                str_contains($description, 'code')) {
                $score += 0.3;
                break; // Only add once
            }
        }
        
        // Language matching (if problem has language)
        if ($problem->getLanguage()) {
            $problemLang = strtolower($problem->getLanguage()->getNom());
            foreach ($profileAttributes as $attribute) {
                $label = strtolower($attribute['label'] ?? '');
                $description = strtolower($attribute['description'] ?? '');
                
                if (str_contains($label, $problemLang) || 
                    str_contains($description, $problemLang)) {
                    $score += 0.2;
                    break;
                }
            }
        }
        
        // Performance matching
        $userPoints = $user->getPointsTotalAll();
        if ($userPoints > 150 && in_array($difficulty, ['hard', 'difficile'])) {
            $score += 0.2;
        } elseif ($userPoints <= 50 && in_array($difficulty, ['easy', 'facile'])) {
            $score += 0.1;
        }
        
        return min($score, 1.0);
    }

    private function generateQuizAssignmentReasoning($user, $quiz, $score): string
    {
        $reasons = [];
        $profileAttributes = $user->getProfileAttributes() ?? [];
        
        // Rank-based reasons
        $rank = $user->getRank()->value;
        if ($rank === 'SENIOR') {
            $reasons[] = "Senior level user";
        } elseif ($rank === 'JUNIOR') {
            $reasons[] = "Junior level user";
        }
        
        // Quiz type matching
        if ($quiz->getType() === 'technique') {
            foreach ($profileAttributes as $attribute) {
                $label = strtolower($attribute['label'] ?? '');
                if (str_contains($label, 'programming') || str_contains($label, 'technical')) {
                    $reasons[] = "Has technical skills";
                    break;
                }
            }
        }
        
        // Performance reasons
        if ($user->getPointsTotalAll() > 100) {
            $reasons[] = "High performing user";
        }
        
        // Default reason if no specific matches
        if (empty($reasons)) {
            $reasons[] = "Good general match";
        }
        
        return implode(", ", $reasons);
    }

    private function generateProblemAssignmentReasoning($user, $problem, $score): string
    {
        $profileAttributes = $user->getProfileAttributes();
        $rank = $user->getRank()?->value ?? 'N/A';
        $points = $user->getPointsTotalAll() ?? 0;
        
        $reasoning = "User {$user->getUsername()} (Rank: {$rank}, Points: {$points}) ";
        
        $langName = $problem->getLanguage() ? $problem->getLanguage()->getNom() : 'general';
        
        if ($score >= 0.8) {
            $reasoning .= "is an excellent match for this {$problem->getDifficulty()} {$langName} problem. ";
        } elseif ($score >= 0.6) {
            $reasoning .= "is a good match for this {$problem->getDifficulty()} {$langName} problem. ";
        } elseif ($score >= 0.4) {
            $reasoning .= "is a moderate match for this {$problem->getDifficulty()} {$langName} problem. ";
        } else {
            $reasoning .= "has limited compatibility with this {$problem->getDifficulty()} {$langName} problem. ";
        }
        
        if ($profileAttributes) {
            $skills = [];
            foreach ($profileAttributes as $attr) {
                if (isset($attr['label'])) {
                    $skills[] = $attr['label'];
                }
            }
            if (!empty($skills)) {
                $reasoning .= "Profile shows: " . implode(', ', array_slice($skills, 0, 3));
            }
        }
        
        return $reasoning;
    }

    private function extractRelevantSkills($user, $content): array
    {
        $skills = [];
        $profileAttributes = $user->getProfileAttributes();
        
        if ($profileAttributes) {
            foreach ($profileAttributes as $attr) {
                if (isset($attr['label']) && isset($attr['description'])) {
                    $skills[] = $attr['label'];
                }
            }
        }
        
        return array_slice($skills, 0, 5); // Return top 5 skills
    }

    private function extractRelevantLanguages($user, $problem): array
    {
        $languages = [];
        $profileAttributes = $user->getProfileAttributes();
        
        // Add the problem's language
        if ($problem->getLanguage()) {
            $languages[] = $problem->getLanguage()->getNom();
        }
        
        // Extract programming languages from profile
        if ($profileAttributes) {
            foreach ($profileAttributes as $attr) {
                if (isset($attr['label'])) {
                    $label = strtolower($attr['label']);
                    // Check if the label contains programming language keywords
                    $progLanguages = ['javascript', 'python', 'java', 'php', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin', 'ruby', 'typescript'];
                    foreach ($progLanguages as $lang) {
                        if (strpos($label, $lang) !== false) {
                            $languages[] = ucfirst($lang);
                        }
                    }
                }
            }
        }
        
        return array_unique($languages);
    }

    /**
     * Generate comprehensive user analysis report using AI
     */
    public function generateUserAnalysisReport(array $userData): array
    {
        try {
            // Prepare the comprehensive prompt for user analysis
            $prompt = $this->buildUserAnalysisPrompt($userData);
            
            // Call Gemini API with higher token limit for comprehensive analysis
            $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 4096, // Higher limit for comprehensive analysis
                    ]
                ]
            ]);

            $data = $response->toArray();
            
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
                return $this->parseUserAnalysisReport($generatedText);
            }
            
            throw new \Exception('No valid response from Gemini API');
            
        } catch (\Exception $e) {
            throw new \Exception('Failed to generate user analysis report: ' . $e->getMessage());
        }
    }

    /**
     * Build comprehensive user analysis prompt
     */
    private function buildUserAnalysisPrompt(array $userData): string
    {
        $userProfile = $userData['user_profile'];
        $performanceStats = $userData['performance_stats'] ?? [];
        $quizAnalysis = $userData['quiz_analysis'] ?? [];
        $programmingAnalysis = $userData['programming_analysis'] ?? [];
        $learningProgression = $userData['learning_progression'] ?? [];
        $strengthsWeaknesses = $userData['strengths_weaknesses'] ?? [];

        // Format user profile information
        $profileInfo = "User: {$userProfile['username']} ({$userProfile['email']})\n";
        $profileInfo .= "Role: {$userProfile['role']}, Rank: {$userProfile['rank']}\n";
        $profileInfo .= "Total Points: {$userProfile['points_total_all']}\n";
        $profileInfo .= "Status: {$userProfile['status']}\n";

        // Format profile attributes if available
        $profileAttributes = "";
        if (!empty($userProfile['profile_attributes'])) {
            $profileAttributes = "Profile Attributes (from CV analysis):\n";
            foreach ($userProfile['profile_attributes'] as $attr) {
                $profileAttributes .= "- {$attr['label']}: {$attr['description']}\n";
            }
        }

        // Format quiz performance from simple data
        $quizPerformance = "Quiz Performance:\n";
        if (!empty($quizAnalysis['history'])) {
            $quizPerformance .= "- Total Quiz Attempts: " . count($quizAnalysis['history']) . "\n";
            $totalScore = 0;
            $totalPoints = 0;
            foreach ($quizAnalysis['history'] as $quiz) {
                $totalScore += $quiz['scorePoints'] ?? 0;
                $totalPoints += $quiz['scorePoints'] ?? 0;
            }
            $avgScore = count($quizAnalysis['history']) > 0 ? round($totalScore / count($quizAnalysis['history']), 2) : 0;
            $quizPerformance .= "- Average Score: {$avgScore}\n";
            $quizPerformance .= "- Total Points: {$totalPoints}\n";
        } else {
            $quizPerformance .= "- No quiz attempts recorded\n";
        }
        
        if (!empty($quizAnalysis['type_performance'])) {
            $quizPerformance .= "Quiz Type Performance:\n";
            foreach ($quizAnalysis['type_performance'] as $type) {
                $quizType = $type['quiz_type'] ?? 'Unknown';
                $avgScore = $type['avg_score'] ?? 0;
                $totalAttempts = $type['total_attempts'] ?? 0;
                $quizPerformance .= "- {$quizType}: {$avgScore} avg (from {$totalAttempts} attempts)\n";
            }
        }

        // Format programming performance from simple data
        $programmingPerformance = "Programming Performance:\n";
        if (!empty($programmingAnalysis['history'])) {
            $programmingPerformance .= "- Total Programming Attempts: " . count($programmingAnalysis['history']) . "\n";
            $totalScore = 0;
            $totalPoints = 0;
            foreach ($programmingAnalysis['history'] as $prog) {
                $totalScore += $prog['scorePoints'] ?? 0;
                $totalPoints += $prog['scorePoints'] ?? 0;
            }
            $avgScore = count($programmingAnalysis['history']) > 0 ? round($totalScore / count($programmingAnalysis['history']), 2) : 0;
            $programmingPerformance .= "- Average Score: {$avgScore}\n";
            $programmingPerformance .= "- Total Points: {$totalPoints}\n";
        } else {
            $programmingPerformance .= "- No programming attempts recorded\n";
        }
        
        if (!empty($programmingAnalysis['language_performance'])) {
            $programmingPerformance .= "Language Performance:\n";
            foreach ($programmingAnalysis['language_performance'] as $lang) {
                $languageName = $lang['language_name'] ?? 'Unknown Language';
                $avgScore = $lang['avg_score'] ?? 0;
                $totalAttempts = $lang['total_attempts'] ?? 0;
                $programmingPerformance .= "- {$languageName}: {$avgScore} avg (from {$totalAttempts} attempts)\n";
            }
        }

        if (!empty($programmingAnalysis['difficulty_performance'])) {
            $programmingPerformance .= "Difficulty Performance:\n";
            foreach ($programmingAnalysis['difficulty_performance'] as $diff) {
                $difficultyLevel = $diff['difficulty_level'] ?? 'Unknown';
                $avgScore = $diff['avg_score'] ?? 0;
                $totalAttempts = $diff['total_attempts'] ?? 0;
                $programmingPerformance .= "- {$difficultyLevel}: {$avgScore} avg (from {$totalAttempts} attempts)\n";
            }
        }

        // Format learning progression from simple data
        $learningInfo = "Learning Progression:\n";
        $learningInfo .= "- Quiz Activity: " . ($learningProgression['quiz_count'] ?? 0) . " attempts\n";
        $learningInfo .= "- Programming Activity: " . ($learningProgression['programming_count'] ?? 0) . " attempts\n";
        
        // Add trends if available
        if (!empty($quizAnalysis['trends'])) {
            $learningInfo .= "- Quiz Trends: Available\n";
        }
        if (!empty($programmingAnalysis['trends'])) {
            $learningInfo .= "- Programming Trends: Available\n";
        }

        // Format strengths and weaknesses from simple data
        $strengthsInfo = "Identified Strengths:\n";
        if (!empty($strengthsWeaknesses['quiz_strengths'])) {
            foreach ($strengthsWeaknesses['quiz_strengths'] as $strength) {
                $area = $strength['area'] ?? 'Unknown Area';
                $score = $strength['score'] ?? 0;
                $strengthsInfo .= "- Quiz: {$area} (Score: {$score})\n";
            }
        }
        if (!empty($strengthsWeaknesses['programming_strengths'])) {
            foreach ($strengthsWeaknesses['programming_strengths'] as $strength) {
                $area = $strength['area'] ?? 'Unknown Area';
                $score = $strength['score'] ?? 0;
                $strengthsInfo .= "- Programming: {$area} (Score: {$score})\n";
            }
        }
        if (empty($strengthsWeaknesses['quiz_strengths']) && empty($strengthsWeaknesses['programming_strengths'])) {
            $strengthsInfo .= "- Analysis will be based on available performance data\n";
        }

        $weaknessesInfo = "Areas for Improvement:\n";
        if (!empty($strengthsWeaknesses['quiz_weaknesses'])) {
            foreach ($strengthsWeaknesses['quiz_weaknesses'] as $weakness) {
                $area = $weakness['area'] ?? 'Unknown Area';
                $score = $weakness['score'] ?? 0;
                $weaknessesInfo .= "- Quiz: {$area} (Score: {$score})\n";
            }
        }
        if (!empty($strengthsWeaknesses['programming_weaknesses'])) {
            foreach ($strengthsWeaknesses['programming_weaknesses'] as $weakness) {
                $area = $weakness['area'] ?? 'Unknown Area';
                $score = $weakness['score'] ?? 0;
                $weaknessesInfo .= "- Programming: {$area} (Score: {$score})\n";
            }
        }
        if (empty($strengthsWeaknesses['quiz_weaknesses']) && empty($strengthsWeaknesses['programming_weaknesses'])) {
            $weaknessesInfo .= "- Analysis will be based on available performance data\n";
        }

        // Check if user has any activity data
        $hasQuizData = !empty($quizAnalysis['history']);
        $hasProgData = !empty($programmingAnalysis['history']);
        $hasAnyData = $hasQuizData || $hasProgData;

        // Add special instruction for users with no data
        $noDataInstruction = "";
        if (!$hasAnyData) {
            $noDataInstruction = "\n\nIMPORTANT: This user has no recorded quiz or programming activity. Please provide an analysis that:\n";
            $noDataInstruction .= "1. Acknowledges the lack of performance data\n";
            $noDataInstruction .= "2. Focuses on engagement and onboarding recommendations\n";
            $noDataInstruction .= "3. Provides general career guidance based on their role/rank\n";
            $noDataInstruction .= "4. Suggests initial learning paths to gather performance data\n";
            $noDataInstruction .= "5. Rates all performance areas as 'No Data' appropriately\n";
        }

        return <<<PROMPT
You are an expert HR analyst and technical assessor specializing in comprehensive user performance analysis. 

Analyze the following user's complete profile and performance data to generate a detailed, professional assessment report.

USER PROFILE:
{$profileInfo}

{$profileAttributes}

PERFORMANCE ANALYSIS:
{$quizPerformance}

{$programmingPerformance}

{$learningInfo}

STRENGTHS & WEAKNESSES:
{$strengthsInfo}

{$weaknessesInfo}{$noDataInstruction}

Generate a comprehensive analysis report in the following JSON format:

{
    "executive_summary": "A concise 2-3 sentence overview of the user's overall performance and potential",
    "key_strengths": [
        {
            "title": "Strength Title",
            "description": "Detailed explanation of this strength with evidence",
            "impact": "High/Medium/Low",
            "evidence": "Specific data points supporting this strength"
        }
    ],
    "areas_for_improvement": [
        {
            "title": "Area Title",
            "description": "Detailed explanation of this improvement area",
            "priority": "High/Medium/Low",
            "recommendations": "Specific actionable recommendations"
        }
    ],
    "technical_assessment": {
        "quiz_performance": {
            "overall_rating": "Excellent/Good/Average/Below Average/No Data",
            "key_insights": "Detailed analysis of quiz performance patterns",
            "strongest_areas": ["area1", "area2"],
            "improvement_areas": ["area1", "area2"]
        },
        "programming_performance": {
            "overall_rating": "Excellent/Good/Average/Below Average/No Data",
            "key_insights": "Detailed analysis of programming performance patterns",
            "preferred_languages": ["language1", "language2"],
            "comfort_level": "Advanced/Intermediate/Beginner/No Data",
            "code_quality_trends": "Improving/Stable/Declining/No Data"
        }
    },
    "learning_analysis": {
        "learning_velocity": "Fast/Moderate/Slow/No Data",
        "consistency": "Very Consistent/Consistent/Inconsistent/No Data",
        "adaptability": "High/Medium/Low/No Data",
        "growth_trajectory": "Rapidly Growing/Steady Growth/Plateauing/Declining/No Data"
    },
    "career_recommendations": {
        "suitable_roles": ["role1", "role2", "role3"],
        "development_path": "Recommended career progression path",
        "skill_gaps": ["skill1", "skill2"],
        "training_priorities": ["priority1", "priority2"]
    },
    "performance_predictions": {
        "next_3_months": "Expected performance trend and areas of focus",
        "potential_challenges": "Likely challenges and how to address them",
        "growth_opportunities": "Specific opportunities for advancement"
    },
    "detailed_insights": {
        "motivation_factors": "What appears to drive this user's performance",
        "learning_style": "How this user appears to learn best",
        "work_preferences": "Inferred work style and preferences",
        "collaboration_potential": "Assessment of teamwork and collaboration abilities"
    }
}

Provide a thorough, professional analysis that would be valuable for HR decision-making, performance reviews, and career development planning. Base all insights on the provided data and avoid speculation without evidence.

For users with no activity data, focus on engagement strategies and initial onboarding recommendations.

Respond ONLY with the JSON format above. Do not include any text outside the JSON structure.
PROMPT;
    }

    /**
     * Parse the user analysis report from Gemini response
     */
    private function parseUserAnalysisReport(string $generatedText): array
    {
        // Clean the response and extract JSON
        $cleanedText = trim($generatedText);
        
        // Remove any markdown formatting
        $cleanedText = preg_replace('/```json\s*/', '', $cleanedText);
        $cleanedText = preg_replace('/```\s*$/', '', $cleanedText);
        
        // Try to decode JSON
        $analysisReport = json_decode($cleanedText, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, return a default structure
            return $this->getDefaultAnalysisReport();
        }
        
        // Validate the structure has required fields
        $requiredFields = ['executive_summary', 'key_strengths', 'areas_for_improvement', 'technical_assessment'];
        foreach ($requiredFields as $field) {
            if (!isset($analysisReport[$field])) {
                return $this->getDefaultAnalysisReport();
            }
        }
        
        return $analysisReport;
    }

    /**
     * Get default analysis report structure
     */
    private function getDefaultAnalysisReport(): array
    {
        return [
            'executive_summary' => 'User analysis completed. Performance data has been processed and insights generated.',
            'key_strengths' => [
                [
                    'title' => 'Active Learner',
                    'description' => 'Demonstrates consistent engagement with learning activities',
                    'impact' => 'Medium',
                    'evidence' => 'Regular participation in quizzes and programming exercises'
                ]
            ],
            'areas_for_improvement' => [
                [
                    'title' => 'Skill Development',
                    'description' => 'Opportunities exist for expanding technical skills',
                    'priority' => 'Medium',
                    'recommendations' => 'Focus on consistent practice and challenging assignments'
                ]
            ],
            'technical_assessment' => [
                'quiz_performance' => [
                    'overall_rating' => 'Average',
                    'key_insights' => 'Shows potential for growth with focused effort',
                    'strongest_areas' => ['General Knowledge'],
                    'improvement_areas' => ['Technical Depth']
                ],
                'programming_performance' => [
                    'overall_rating' => 'Average',
                    'key_insights' => 'Demonstrates basic programming competency',
                    'preferred_languages' => ['General'],
                    'comfort_level' => 'Intermediate',
                    'code_quality_trends' => 'Stable'
                ]
            ],
            'learning_analysis' => [
                'learning_velocity' => 'Moderate',
                'consistency' => 'Consistent',
                'adaptability' => 'Medium',
                'growth_trajectory' => 'Steady Growth'
            ],
            'career_recommendations' => [
                'suitable_roles' => ['Junior Developer', 'Technical Support'],
                'development_path' => 'Focus on building technical foundation',
                'skill_gaps' => ['Advanced Programming', 'System Design'],
                'training_priorities' => ['Technical Skills', 'Problem Solving']
            ],
            'performance_predictions' => [
                'next_3_months' => 'Continued steady improvement expected',
                'potential_challenges' => 'May need additional guidance on complex topics',
                'growth_opportunities' => 'Strong potential with proper mentoring'
            ],
            'detailed_insights' => [
                'motivation_factors' => 'Appears motivated by learning and achievement',
                'learning_style' => 'Responds well to structured learning',
                'work_preferences' => 'Likely prefers collaborative environments',
                'collaboration_potential' => 'Good team player potential'
            ]
        ];
    }

    /**
     * Generate a mixed test based on user CV analysis
     * This method analyzes the CV and generates appropriate questions and tasks
     */
    public function generateMixedTestFromCV(string $cvPath, array $userProfile): array
    {
        try {
            // Extract CV content
            $cvContent = $this->extractTextFromPDF($cvPath);
            // Analyze user profile and CV to determine test parameters
            $testParams = $this->analyzeCVForTestParameters($cvContent, $userProfile);
            
            // Generate questions based on CV analysis
            $questions = $this->generateQuestionsFromCV($cvContent, $testParams);
            $questionsSource = count($questions) > 0 ? "AI" : "FALLBACK";
            error_log("Questions: " . count($questions) . " (" . $questionsSource . ")");
            
            // Generate tasks based on CV analysis
            $tasks = $this->generateTasksFromCV($cvContent, $testParams);
            $tasksSource = count($tasks) > 0 ? "AI" : "FALLBACK";
            error_log("Tasks: " . count($tasks) . " (" . $tasksSource . ")");
            
            // Fallback: If no questions or tasks generated, create some basic ones
            if (empty($questions)) {
                $questions = $this->createFallbackQuestions($testParams);
            }
            
            if (empty($tasks)) {
                $tasks = $this->createFallbackTasks($testParams);
            }
            
            // Create mixed test structure
            $mixedTest = [
                'title' => $this->generateTestTitle($userProfile),
                'description' => $this->generateTestDescription($userProfile, $testParams),
                'difficulty' => $testParams['difficulty'],
                'test_type' => 'mixed',
                'nb_questions' => count($questions),
                'nb_tasks' => count($tasks),
                'primary_language' => $testParams['primary_language'],
                'points_total' => $testParams['total_points'],
                'questions' => $questions,
                'tasks' => $tasks
            ];
            
            return $mixedTest;
            
        } catch (\Exception $e) {
            throw new \Exception('Failed to generate mixed test from CV: ' . $e->getMessage());
        }
    }

    /**
     * Analyze CV content and user profile to determine test parameters
     */
    private function analyzeCVForTestParameters(string $cvContent, array $userProfile): array
    {
        $prompt = "Analyze this CV content and user profile to determine appropriate test parameters:\n\n";
        $prompt .= "CV Content:\n" . substr($cvContent, 0, 2000) . "\n\n";
        $prompt .= "User Profile:\n" . json_encode($userProfile, JSON_PRETTY_PRINT) . "\n\n";
        $prompt .= "Based on the CV content and user profile, determine:\n";
        $prompt .= "1. Difficulty level (easy/medium/hard) based on experience level\n";
        $prompt .= "2. Primary programming language to focus on\n";
        $prompt .= "3. Number of questions (3-8) based on seniority\n";
        $prompt .= "4. Number of tasks (2-5) based on seniority\n";
        $prompt .= "5. Total points (50-200) based on difficulty and content\n";
        $prompt .= "6. Skills to focus on based on CV content\n\n";
        $prompt .= "Respond with a JSON object containing: difficulty, primary_language, nb_questions, nb_tasks, total_points, focus_skills";

        $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 512,
                ]
            ]
        ]);

        $data = $response->toArray();
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
            return $this->parseTestParameters($generatedText);
        }
        
        // Default parameters if parsing fails
        return [
            'difficulty' => 'medium',
            'primary_language' => 'JavaScript',
            'nb_questions' => 5,
            'nb_tasks' => 3,
            'total_points' => 100,
            'focus_skills' => ['programming', 'problem-solving']
        ];
    }

    /**
     * Generate questions based on CV content
     */
    private function generateQuestionsFromCV(string $cvContent, array $testParams): array
    {
        $prompt = "Generate " . $testParams['nb_questions'] . " SHORT multiple choice questions. KEEP THEM BRIEF!\n\n";
        $prompt .= "CV Content:\n" . substr($cvContent, 0, 1500) . "\n\n";
        $prompt .= "CRITICAL: Make questions SHORT and DIRECT. NO long explanations!\n";
        $prompt .= "- Difficulty: " . $testParams['difficulty'] . "\n";
        $prompt .= "- Language: " . $testParams['primary_language'] . "\n";
        $prompt .= "- Focus on skills mentioned in CV\n";
        $prompt .= "- Questions should be relevant to the candidate's experience\n";
        $prompt .= "- MAX 30 words per question\n";
        $prompt .= "- Be DIRECT and to the point\n";
        $prompt .= "- NO verbose text or long explanations\n";
        $prompt .= "- Test practical knowledge with SHORT questions\n";
        $prompt .= "- Questions must be MULTIPLE CHOICE with 4 options\n\n";
        $prompt .= "EXAMPLES OF GOOD SHORT QUESTIONS:\n";
        $prompt .= "- \"What library is used for web scraping in Python?\"\n";
        $prompt .= "- \"Which framework is full-featured: Django or Flask?\"\n";
        $prompt .= "- \"What does VLM stand for in AI?\"\n\n";
        $prompt .= "AVOID LONG QUESTIONS LIKE:\n";
        $prompt .= "- \"Explain how you would use Pandas to read a CSV file, clean the data (handling missing values), and perform basic exploratory data analysis. Briefly describe the steps.\"\n\n";
        $prompt .= "Generate questions in this exact JSON format:\n";
        $prompt .= "[\n";
        $prompt .= "  {\n";
        $prompt .= "    \"question\": \"Short question here (max 30 words)\",\n";
        $prompt .= "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n";
        $prompt .= "    \"correctAnswer\": \"Option A\",\n";
        $prompt .= "    \"difficulty\": \"" . $testParams['difficulty'] . "\",\n";
        $prompt .= "    \"points\": 10,\n";
        $prompt .= "    \"time\": 60,\n";
        $prompt .= "    \"language_id\": 1\n";
        $prompt .= "  }\n";
        $prompt .= "]";

        $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                ]
            ]
        ]);

        $data = $response->toArray();
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
            error_log("Generated questions text: " . substr($generatedText, 0, 500) . "...");
            
            $questions = $this->parseGeneratedQuestions($generatedText);
            
            // Add missing required fields to each question
            foreach ($questions as &$question) {
                $question['difficulty'] = $question['difficulty'] ?? $testParams['difficulty'];
                $question['points'] = $question['points'] ?? 10;
                $question['time'] = $question['time'] ?? 60;
                $question['language_id'] = $question['language_id'] ?? 1; // Default to JavaScript
            }
            
            error_log("Generated " . count($questions) . " questions successfully");
            return $questions;
        }
        
        error_log("No valid response from Gemini API for questions generation");
        return [];
    }

    /**
     * Generate tasks based on CV content
     */
    private function generateTasksFromCV(string $cvContent, array $testParams): array
    {
        $prompt = "Generate " . $testParams['nb_tasks'] . " SHORT programming tasks. KEEP THEM BRIEF!\n\n";
        $prompt .= "CV Content:\n" . substr($cvContent, 0, 1500) . "\n\n";
        $prompt .= "IMPORTANT: Make tasks SHORT and DIRECT. NO long explanations!\n";
        $prompt .= "- Difficulty: " . $testParams['difficulty'] . "\n";
        $prompt .= "- Language: " . $testParams['primary_language'] . "\n";
        $prompt .= "- Focus on skills mentioned in CV\n";
        $prompt .= "- Tasks should be relevant to the candidate's experience\n";
        $prompt .= "- MAX 100 words per task description\n";
        $prompt .= "- Be DIRECT and to the point\n";
        $prompt .= "- NO verbose text or long explanations\n";
        $prompt .= "- Test practical coding skills with SHORT tasks\n\n";
        $prompt .= "Generate tasks in this exact JSON format:\n";
        $prompt .= "[\n";
        $prompt .= "  {\n";
        $prompt .= "    \"title\": \"Short task title here\",\n";
        $prompt .= "    \"description\": \"Short task description here (max 100 words)\",\n";
        $prompt .= "    \"sample_test_cases\": {\"input\": \"test input\", \"output\": \"expected output\"},\n";
        $prompt .= "    \"model_solution\": \"Complete solution code here\",\n";
        $prompt .= "    \"difficulty\": \"" . $testParams['difficulty'] . "\",\n";
        $prompt .= "    \"points\": 20,\n";
        $prompt .= "    \"time\": 120,\n";
        $prompt .= "    \"evaluation_criteria\": [{\"name\": \"Correctness\", \"weight\": 60}, {\"name\": \"Efficiency\", \"weight\" => 20}, {\"name\": \"Code Quality\", \"weight\" => 20}],\n";
        $prompt .= "    \"language_id\": 1\n";
        $prompt .= "  }\n";
        $prompt .= "]";

        $response = $this->client->request('POST', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $this->apiKey, [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 8192,
                ]
            ]
        ]);

        $data = $response->toArray();
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            $generatedText = $data['candidates'][0]['content']['parts'][0]['text'];
            error_log("Generated tasks text: " . substr($generatedText, 0, 500) . "...");
            
            $tasks = $this->parseGeneratedTasks($generatedText);
            
            // Add missing required fields to each task
            foreach ($tasks as &$task) {
                $task['difficulty'] = $testParams['difficulty'];
                $task['points'] = $task['points'] ?? 20;
                $task['time'] = $task['time'] ?? 120;
                $task['language_id'] = $task['language_id'] ?? 1; // Default to JavaScript
                $task['evaluation_criteria'] = $task['evaluation_criteria'] ?? [
                    ['name' => 'Correctness', 'weight' => 60],
                    ['name' => 'Efficiency', 'weight' => 20],
                    ['name' => 'Code Quality', 'weight' => 20]
                ];
            }
            
            error_log("Generated " . count($tasks) . " tasks successfully");
            return $tasks;
        }
        
        error_log("No valid response from Gemini API for tasks generation");
        return [];
    }

    /**
     * Generate test title based on user profile
     */
    private function generateTestTitle(array $userProfile): string
    {
        $name = $userProfile['name'] ?? 'Candidate';
        $role = $userProfile['role'] ?? 'Developer';
        return "Personalized Test for {$name} - {$role}";
    }

    /**
     * Generate test description based on user profile and test parameters
     */
    private function generateTestDescription(array $userProfile, array $testParams): string
    {
        $difficulty = ucfirst($testParams['difficulty']);
        $language = $testParams['primary_language'];
        $questions = $testParams['nb_questions'];
        $tasks = $testParams['nb_tasks'];
        
        return "A personalized {$difficulty} level mixed test with {$questions} questions and {$tasks} programming tasks in {$language}. " .
               "This test is tailored based on the candidate's CV and experience level.";
    }

    /**
     * Parse test parameters from AI response
     */
    private function parseTestParameters(string $generatedText): array
    {
        try {
            // Extract JSON from the response
            if (preg_match('/\{.*\}/s', $generatedText, $matches)) {
                $jsonData = json_decode($matches[0], true);
                if ($jsonData) {
                    return [
                        'difficulty' => $jsonData['difficulty'] ?? 'medium',
                        'primary_language' => $jsonData['primary_language'] ?? 'JavaScript',
                        'nb_questions' => $jsonData['nb_questions'] ?? 5,
                        'nb_tasks' => $jsonData['nb_tasks'] ?? 3,
                        'total_points' => $jsonData['total_points'] ?? 100,
                        'focus_skills' => $jsonData['focus_skills'] ?? ['programming']
                    ];
                }
            }
        } catch (\Exception $e) {
            // If parsing fails, return default values
        }
        
        return [
            'difficulty' => 'medium',
            'primary_language' => 'JavaScript',
            'nb_questions' => 5,
            'nb_tasks' => 3,
            'total_points' => 100,
            'focus_skills' => ['programming']
        ];
    }

    /**
     * Create fallback questions when AI generation fails
     */
    private function createFallbackQuestions(array $testParams): array
    {
        $questions = [];
        $language = $testParams['primary_language'] ?? 'JavaScript';
        
        $basicQuestions = [
            [
                'question' => "What is the purpose of version control systems like Git?",
                'options' => [
                    "To track changes in code and collaborate with other developers",
                    "To compile code faster",
                    "To debug code automatically",
                    "To write documentation"
                ],
                'correctAnswer' => "To track changes in code and collaborate with other developers",
                'difficulty' => $testParams['difficulty'],
                'points' => 10,
                'time' => 60,
                'language_id' => 1
            ],
            [
                'question' => "What is the difference between synchronous and asynchronous programming?",
                'options' => [
                    "Synchronous executes code in order, asynchronous can execute out of order",
                    "Synchronous is faster than asynchronous",
                    "Asynchronous is only used for databases",
                    "There is no difference"
                ],
                'correctAnswer' => "Synchronous executes code in order, asynchronous can execute out of order",
                'difficulty' => $testParams['difficulty'],
                'points' => 10,
                'time' => 60,
                'language_id' => 1
            ],
            [
                'question' => "What is the purpose of unit testing?",
                'options' => [
                    "To test individual components of code in isolation",
                    "To test the entire application at once",
                    "To check if the code compiles",
                    "To measure code performance"
                ],
                'correctAnswer' => "To test individual components of code in isolation",
                'difficulty' => $testParams['difficulty'],
                'points' => 10,
                'time' => 60,
                'language_id' => 1
            ],
            [
                'question' => "What is an API?",
                'options' => [
                    "Application Programming Interface - a set of rules for building software",
                    "A programming language",
                    "A database system",
                    "A web browser"
                ],
                'correctAnswer' => "Application Programming Interface - a set of rules for building software",
                'difficulty' => $testParams['difficulty'],
                'points' => 10,
                'time' => 60,
                'language_id' => 1
            ],
            [
                'question' => "What is the purpose of Docker?",
                'options' => [
                    "To containerize applications for consistent deployment",
                    "To write code faster",
                    "To debug applications",
                    "To design user interfaces"
                ],
                'correctAnswer' => "To containerize applications for consistent deployment",
                'difficulty' => $testParams['difficulty'],
                'points' => 10,
                'time' => 60,
                'language_id' => 1
            ]
        ];
        
        // Return the number of questions requested
        return array_slice($basicQuestions, 0, $testParams['nb_questions']);
    }

    /**
     * Create fallback tasks when AI generation fails
     */
    private function createFallbackTasks(array $testParams): array
    {
        $tasks = [];
        $language = $testParams['primary_language'] ?? 'JavaScript';
        
        $basicTasks = [
            [
                'title' => "Array Manipulation",
                'description' => "Write a function that takes an array of numbers and returns a new array with only the even numbers.",
                'sample_test_cases' => [
                    ['input' => '[1, 2, 3, 4, 5, 6]', 'output' => '[2, 4, 6]'],
                    ['input' => '[1, 3, 5]', 'output' => '[]']
                ],
                'model_solution' => "function getEvenNumbers(arr) {\n  return arr.filter(num => num % 2 === 0);\n}",
                'difficulty' => $testParams['difficulty'],
                'points' => 20,
                'time' => 120,
                'evaluation_criteria' => [
                    ['name' => 'Correctness', 'weight' => 60],
                    ['name' => 'Efficiency', 'weight' => 20],
                    ['name' => 'Code Quality', 'weight' => 20]
                ],
                'language_id' => 1
            ],
            [
                'title' => "String Processing",
                'description' => "Write a function that takes a string and returns the number of vowels it contains.",
                'sample_test_cases' => [
                    ['input' => '"hello"', 'output' => '2'],
                    ['input' => '"world"', 'output' => '1']
                ],
                'model_solution' => "function countVowels(str) {\n  const vowels = 'aeiouAEIOU';\n  return str.split('').filter(char => vowels.includes(char)).length;\n}",
                'difficulty' => $testParams['difficulty'],
                'points' => 20,
                'time' => 120,
                'evaluation_criteria' => [
                    ['name' => 'Correctness', 'weight' => 60],
                    ['name' => 'Efficiency', 'weight' => 20],
                    ['name' => 'Code Quality', 'weight' => 20]
                ],
                'language_id' => 1
            ],
            [
                'title' => "Object Manipulation",
                'description' => "Write a function that takes an array of objects and returns the object with the highest 'score' property.",
                'sample_test_cases' => [
                    ['input' => '[{name: "Alice", score: 85}, {name: "Bob", score: 92}, {name: "Charlie", score: 78}]', 'output' => '{name: "Bob", score: 92}']
                ],
                'model_solution' => "function findHighestScore(students) {\n  return students.reduce((highest, current) => \n    current.score > highest.score ? current : highest\n  );\n}",
                'difficulty' => $testParams['difficulty'],
                'points' => 20,
                'time' => 120,
                'evaluation_criteria' => [
                    ['name' => 'Correctness', 'weight' => 60],
                    ['name' => 'Efficiency', 'weight' => 20],
                    ['name' => 'Code Quality', 'weight' => 20]
                ],
                'language_id' => 1
            ]
        ];
        
        // Return the number of tasks requested
        return array_slice($basicTasks, 0, $testParams['nb_tasks']);
    }
} 