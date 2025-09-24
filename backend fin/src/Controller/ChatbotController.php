<?php

namespace App\Controller;

use App\Entity\ChatLog;
use App\Service\GeminiClient;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ChatbotController extends AbstractController
{
    #[Route('/api/chatbot/ask', name: 'chatbot_ask', methods: ['POST'])]
    public function ask(Request $request, GeminiClient $gemini, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $question = trim((string)($data['question'] ?? ''));
        $userId = $data['userId'] ?? null;
        if ($question === '') {
            return $this->json(['error' => 'Missing question'], 400);
        }

        // Try FAQ first (simple contains match)
        $usedSource = 'ai';
        $confidence = 0.0;
        {
            // Classify topic via Gemini
            $cls = $gemini->classify($question);
            $topic = $cls['label'] ?? 'Other';
            $confidence = (float)($cls['confidence'] ?? 0.0);
            if ($confidence < 0.4) {
                $topic = $this->inferTopic($question);
            }
            $ai = $gemini->generate($question);
            $answer = trim((string)$ai['text']);
            // If model returned only a bare topic-like single word, make a tiny guidance sentence
            if (\in_array($answer, ['Authentication','Quiz','Programming','Teams','Mixed Tests','Admin','Other'], true)) {
                $answer = 'Here are the next steps for you:';
            }
            // Append CTA links (HTML)
            $answer = $this->appendCtaHtml($answer, $topic, (string)$this->getParameter('app.frontend_url'));
        }

        $log = (new ChatLog())
            ->setQuestion($question)
            ->setAnswer($answer)
            ->setTopic($topic)
            ->setConfidence($confidence)
            ->setSource($usedSource)
            ->setUserId($userId);
        $em->persist($log);
        $em->flush();

        return $this->json([
            'answer' => $answer,
            'topic' => $topic,
        ]);
    }

    private function appendCtaHtml(string $answer, string $topic, string $frontendBase): string
    {
        $links = [
            'Authentication' => [ ['Login', '/login'] ],
            'Quiz' => [ ['Your assignments', '/assignments-sessions'] ],
            'Programming' => [ ['Programming problems', '/programming-problems'] ],
            'Teams' => [ ['Team chat', '/team-chat'] ],
            'Mixed Tests' => [ ['My Mixed Tests', '/my-mixed-tests'], ['Admin Mixed Tests', '/admin/mixed-tests'] ],
            'Admin' => [ ['Admin Dashboard', '/admin'] ],
        ];
        $items = $links[$topic] ?? [];
        if (empty($items)) { return $answer; }
        $cta = '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e0e0e0">'
             . '<div style="font-weight:600;margin-bottom:8px;color:#333;">Quick links</div><ul style="padding-left:18px;margin:0;list-style:none;">';
        foreach ($items as [$label,$path]) {
            $cta .= sprintf('<li style="margin:4px 0;"><a href="%s" target="_blank" rel="noopener" style="color:#007bff;text-decoration:none;padding:4px 8px;border-radius:4px;background:#f8f9fa;display:inline-block;transition:all 0.2s;" onmouseover="this.style.background=\'#e3f2fd\';this.style.color=\'#0056b3\';" onmouseout="this.style.background=\'#f8f9fa\';this.style.color=\'#007bff\';">%s</a></li>', htmlspecialchars(rtrim($frontendBase,'/').$path, ENT_QUOTES), htmlspecialchars($label, ENT_QUOTES));
        }
        $cta .= '</ul></div>';
        return $answer . $cta;
    }

    // FAQ endpoints removed as requested

    #[Route('/api/admin/chatbot/stats', name: 'chatbot_stats', methods: ['GET'])]
    public function stats(EntityManagerInterface $em): JsonResponse
    {
        $conn = $em->getConnection();
        $byTopic = $conn->fetchAllAssociative('SELECT topic, COUNT(*) as cnt FROM chat_log GROUP BY topic');
        $daily = $conn->fetchAllAssociative('SELECT DATE(created_at) as day, COUNT(*) as cnt FROM chat_log GROUP BY day ORDER BY day DESC LIMIT 30');
        $topQuestions = $conn->fetchAllAssociative('SELECT question, COUNT(*) as cnt FROM chat_log GROUP BY question ORDER BY cnt DESC LIMIT 10');
        return $this->json([
            'byTopic' => $byTopic,
            'daily' => $daily,
            'topQuestions' => $topQuestions
        ]);
    }

    private function inferTopic(string $text): string
    {
        $t = mb_strtolower($text);
        if (str_contains($t, 'login') || str_contains($t, 'password') || str_contains($t, 'auth')) return 'Authentication';
        if (str_contains($t, 'quiz')) return 'Quiz';
        if (str_contains($t, 'program') || str_contains($t, 'code') || str_contains($t, 'task')) return 'Programming';
        if (str_contains($t, 'team')) return 'Teams';
        if (str_contains($t, 'mixed')) return 'Mixed Tests';
        if (str_contains($t, 'admin')) return 'Admin';
        return 'Other';
    }
}


