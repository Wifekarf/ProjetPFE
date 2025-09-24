<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpClient\HttpClient;

class GeminiClient
{
    private string $apiKey;
    private string $model;
    private HttpClientInterface $http;

    public function __construct(ParameterBagInterface $bag)
    {
        $this->apiKey = (string) $bag->get('gemini_api_key');
        $this->model = 'gemini-1.5-flash';
        $this->http = HttpClient::create();
    }

    public function generate(string $prompt, array $context = []): array
    {
        $url = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
            $this->model,
            $this->apiKey
        );

        try {
            $response = $this->http->request('POST', $url, [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $this->buildPrompt($prompt, $context)]
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

            $data = $response->toArray(false);
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response';

            return [
                'text' => $text,
                'raw' => $data,
                'error' => null
            ];
        } catch (\Throwable $e) {
            return [
                'text' => 'Service unavailable',
                'raw' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Classify text into one of fixed labels with confidence.
     * Returns ['label' => string, 'confidence' => float]
     */
    public function classify(string $text): array
    {
        $labels = ['Authentication','Quiz','Programming','Teams','Mixed Tests','Admin','Other'];
        $url = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
            $this->model,
            $this->apiKey
        );

        $instruction = "Classify the following text into exactly one of these labels: "
            . implode(', ', $labels)
            . ". Respond ONLY in strict JSON: {\"label\":\"<one label>\",\"confidence\":<0..1>}";

        try {
            $response = $this->http->request('POST', $url, [
                'headers' => ['Content-Type' => 'application/json'],
                'json' => [
                    'contents' => [[ 'parts' => [[ 'text' => $instruction . "\n\nText:\n" . $text ]] ]],
                    'generationConfig' => [ 'temperature' => 0.2, 'maxOutputTokens' => 128 ]
                ]
            ]);
            $data = $response->toArray(false);
            $raw = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $raw = trim($raw);
            // Best effort to extract JSON
            $raw = preg_replace('/```json|```/i','',$raw);
            $decoded = json_decode($raw, true);
            $label = $decoded['label'] ?? 'Other';
            $confidence = isset($decoded['confidence']) ? (float)$decoded['confidence'] : 0.0;
            if (!in_array($label, $labels, true)) { $label = 'Other'; }
            if ($confidence < 0 || $confidence > 1) { $confidence = 0.0; }
            return ['label' => $label, 'confidence' => $confidence];
        } catch (\Throwable $e) {
            return ['label' => 'Other', 'confidence' => 0.0];
        }
    }

    private function buildPrompt(string $prompt, array $context): string
    {
        $system = "You are the Wevioo Quiz Assistant, an AI helper for the Wevioo educational platform. 

PLATFORM OVERVIEW:
- Wevioo is a comprehensive quiz and programming assessment platform
- Users can take quizzes, solve programming problems, participate in team sessions, and take mixed tests
- The platform supports both individual learning and collaborative team-based activities
- There are different user roles: students, teachers, and administrators

KEY FEATURES:
- Quiz System: Students can take assignments and quizzes on various topics
- Programming Problems: Code challenges with real-time testing and evaluation
- Team Management: Users can join teams, participate in team chats, and collaborative sessions
- Mixed Tests: Comprehensive assessments combining multiple question types
- Admin Dashboard: Management tools for teachers and administrators
- User Authentication: Secure login system with different access levels

COMMON TASKS:
- Taking quizzes and assignments
- Solving programming challenges
- Joining or managing teams
- Accessing team chat and collaboration features
- Taking mixed tests (combination of different question types)
- Admin functions like creating content, managing users, viewing statistics

Answer concisely and helpfully. Guide users to the right sections of the platform. If you can, map the user's question to a topic: Authentication, Quiz, Programming, Teams, Mixed Tests, Admin, Other.";
        $ctx = empty($context) ? '' : ("\nContext:\n" . json_encode($context));
        return $system . "\n\nUser: " . $prompt . $ctx;
    }
}

