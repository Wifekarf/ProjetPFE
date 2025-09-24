<?php

namespace App\Service;

use App\Repository\UserRepository;
use App\Repository\UserQuizRepository;
use App\Repository\UserProgProblemRepository;
use Doctrine\ORM\EntityManagerInterface;

class UserAnalysisService
{
    private UserRepository $userRepository;
    private UserQuizRepository $userQuizRepository;
    private UserProgProblemRepository $userProgProblemRepository;
    private EntityManagerInterface $entityManager;

    public function __construct(
        UserRepository $userRepository,
        UserQuizRepository $userQuizRepository,
        UserProgProblemRepository $userProgProblemRepository,
        EntityManagerInterface $entityManager
    ) {
        $this->userRepository = $userRepository;
        $this->userQuizRepository = $userQuizRepository;
        $this->userProgProblemRepository = $userProgProblemRepository;
        $this->entityManager = $entityManager;
    }

    /**
     * Get comprehensive user analysis data for AI processing
     */
    public function getComprehensiveUserAnalysisData(int $userId): array
    {
        // Get basic user data
        $userData = $this->userRepository->getUserAnalysisData($userId);
        
        if (!$userData) {
            throw new \Exception('User not found');
        }

        // Get performance statistics
        $performanceStats = $this->userRepository->getUserPerformanceStats($userId);

        // Get simple quiz data
        $quizData = $this->userQuizRepository->getUserQuizAnalysisData($userId);
        $quizTrends = $this->userQuizRepository->getUserQuizPerformanceTrends($userId);
        $quizTypes = $this->userQuizRepository->getUserQuizTypePerformance($userId);

        // Get simple programming data
        $progData = $this->userProgProblemRepository->getUserProgProblemAnalysisData($userId);
        $progTrends = $this->userProgProblemRepository->getUserProgProblemPerformanceTrends($userId);
        $languagePerf = $this->userProgProblemRepository->getUserLanguagePerformance($userId);
        $difficultyPerf = $this->userProgProblemRepository->getUserDifficultyPerformance($userId);

        // Log the actual data being retrieved for debugging
        error_log("=== User Analysis Data Debug for User $userId ===");
        error_log("User Data: " . json_encode($userData));
        error_log("Performance Stats: " . json_encode($performanceStats));
        error_log("Quiz Data: " . json_encode($quizData));
        error_log("Quiz Trends: " . json_encode($quizTrends));
        error_log("Quiz Types: " . json_encode($quizTypes));
        error_log("Programming Data: " . json_encode($progData));
        error_log("Programming Trends: " . json_encode($progTrends));
        error_log("Language Performance: " . json_encode($languagePerf));
        error_log("Difficulty Performance: " . json_encode($difficultyPerf));

        // Ensure arrays are not null
        $quizData = $quizData ?? [];
        $quizTrends = $quizTrends ?? [];
        $quizTypes = $quizTypes ?? [];
        $progData = $progData ?? [];
        $progTrends = $progTrends ?? [];
        $languagePerf = $languagePerf ?? [];
        $difficultyPerf = $difficultyPerf ?? [];

        return [
            'user_profile' => $userData,
            'performance_stats' => $performanceStats,
            'quiz_analysis' => [
                'history' => $quizData,
                'trends' => $quizTrends,
                'type_performance' => $quizTypes
            ],
            'programming_analysis' => [
                'history' => $progData,
                'trends' => $progTrends,
                'language_performance' => $languagePerf,
                'difficulty_performance' => $difficultyPerf
            ],
            'learning_progression' => [
                'quiz_count' => count($quizData),
                'programming_count' => count($progData)
            ],
            'strengths_weaknesses' => [
                'quiz_strengths' => [],
                'programming_strengths' => [],
                'areas_for_improvement' => []
            ]
        ];
    }

    /**
     * Get detailed quiz analysis data
     */
    private function getQuizAnalysisData(int $userId): array
    {
        $quizHistory = $this->userQuizRepository->getUserQuizAnalysisData($userId);
        $quizTrends = $this->userQuizRepository->getUserQuizPerformanceTrends($userId);
        $quizTypePerformance = $this->userQuizRepository->getUserQuizTypePerformance($userId);
        $recentQuizActivity = $this->userQuizRepository->getUserRecentQuizActivity($userId, 10);

        return [
            'quiz_history' => $quizHistory,
            'performance_trends' => $quizTrends,
            'type_performance' => $quizTypePerformance,
            'recent_activity' => $recentQuizActivity,
            'quiz_insights' => $this->generateQuizInsights($quizHistory, $quizTypePerformance)
        ];
    }

    /**
     * Get detailed programming problem analysis data
     */
    private function getProgrammingAnalysisData(int $userId): array
    {
        $progHistory = $this->userProgProblemRepository->getUserProgProblemAnalysisData($userId);
        $languagePerformance = $this->userProgProblemRepository->getUserLanguagePerformance($userId);
        $difficultyPerformance = $this->userProgProblemRepository->getUserDifficultyPerformance($userId);
        $progTrends = $this->userProgProblemRepository->getUserProgProblemPerformanceTrends($userId);
        $recentProgActivity = $this->userProgProblemRepository->getUserRecentProgProblemActivity($userId, 10);
        $codeQualityAnalysis = $this->userProgProblemRepository->getUserCodeQualityAnalysis($userId);

        return [
            'programming_history' => $progHistory,
            'language_performance' => $languagePerformance,
            'difficulty_performance' => $difficultyPerformance,
            'performance_trends' => $progTrends,
            'recent_activity' => $recentProgActivity,
            'code_quality_analysis' => $codeQualityAnalysis,
            'programming_insights' => $this->generateProgrammingInsights($progHistory, $languagePerformance, $difficultyPerformance)
        ];
    }

    /**
     * Get learning progression data
     */
    private function getLearningProgressionData(int $userId): array
    {
        $quizTrends = $this->userQuizRepository->getUserQuizPerformanceTrends($userId);
        $progTrends = $this->userProgProblemRepository->getUserProgProblemPerformanceTrends($userId);

        return [
            'quiz_progression' => $this->calculateProgressionMetrics($quizTrends, 'avg_score'),
            'programming_progression' => $this->calculateProgressionMetrics($progTrends, 'avg_score'),
            'activity_frequency' => $this->calculateActivityFrequency($quizTrends, $progTrends),
            'improvement_rate' => $this->calculateImprovementRate($quizTrends, $progTrends)
        ];
    }

    /**
     * Analyze strengths and weaknesses
     */
    private function analyzeStrengthsWeaknesses(int $userId): array
    {
        $quizTypePerformance = $this->userQuizRepository->getUserQuizTypePerformance($userId);
        $languagePerformance = $this->userProgProblemRepository->getUserLanguagePerformance($userId);
        $difficultyPerformance = $this->userProgProblemRepository->getUserDifficultyPerformance($userId);

        return [
            'quiz_strengths' => $this->identifyQuizStrengths($quizTypePerformance),
            'quiz_weaknesses' => $this->identifyQuizWeaknesses($quizTypePerformance),
            'programming_strengths' => $this->identifyProgrammingStrengths($languagePerformance, $difficultyPerformance),
            'programming_weaknesses' => $this->identifyProgrammingWeaknesses($languagePerformance, $difficultyPerformance),
            'overall_patterns' => $this->identifyOverallPatterns($userId)
        ];
    }

    /**
     * Generate quiz insights
     */
    private function generateQuizInsights(array $quizHistory, array $quizTypePerformance): array
    {
        $insights = [];

        // Calculate average improvement over time
        if (count($quizHistory) > 1) {
            $recentAvg = array_sum(array_slice(array_column($quizHistory, 'scorePoints'), 0, 5)) / min(5, count($quizHistory));
            $olderAvg = array_sum(array_slice(array_column($quizHistory, 'scorePoints'), -5)) / min(5, count($quizHistory));
            
            $insights['recent_performance_trend'] = $recentAvg > $olderAvg ? 'improving' : 'declining';
            $insights['performance_change'] = round($recentAvg - $olderAvg, 2);
        }

        // Find preferred quiz types
        if (!empty($quizTypePerformance)) {
            $bestType = array_reduce($quizTypePerformance, function($carry, $item) {
                return (!$carry || $item['avg_score'] > $carry['avg_score']) ? $item : $carry;
            });
            $insights['preferred_quiz_type'] = $bestType['quiz_type'] ?? 'unknown';
        }

        return $insights;
    }

    /**
     * Generate programming insights
     */
    private function generateProgrammingInsights(array $progHistory, array $languagePerformance, array $difficultyPerformance): array
    {
        $insights = [];

        // Find preferred programming languages
        if (!empty($languagePerformance)) {
            $bestLanguage = array_reduce($languagePerformance, function($carry, $item) {
                return (!$carry || $item['avg_score'] > $carry['avg_score']) ? $item : $carry;
            });
            $insights['preferred_language'] = $bestLanguage['language_name'] ?? 'unknown';
        }

        // Find comfort difficulty level
        if (!empty($difficultyPerformance)) {
            $bestDifficulty = array_reduce($difficultyPerformance, function($carry, $item) {
                return (!$carry || $item['avg_score'] > $carry['avg_score']) ? $item : $carry;
            });
            $insights['comfort_difficulty'] = $bestDifficulty['difficulty_level'] ?? 'unknown';
        }

        return $insights;
    }

    /**
     * Calculate progression metrics
     */
    private function calculateProgressionMetrics(array $trends, string $metric): array
    {
        if (empty($trends)) {
            return ['trend' => 'no_data', 'slope' => 0, 'correlation' => 0];
        }

        $values = array_column($trends, $metric);
        $count = count($values);
        
        if ($count < 2) {
            return ['trend' => 'insufficient_data', 'slope' => 0, 'correlation' => 0];
        }

        // Calculate simple trend
        $firstHalf = array_slice($values, 0, intval($count/2));
        $secondHalf = array_slice($values, intval($count/2));
        
        $firstAvg = array_sum($firstHalf) / count($firstHalf);
        $secondAvg = array_sum($secondHalf) / count($secondHalf);
        
        $slope = $secondAvg - $firstAvg;
        $trend = $slope > 0 ? 'improving' : ($slope < 0 ? 'declining' : 'stable');

        return [
            'trend' => $trend,
            'slope' => round($slope, 2),
            'improvement_rate' => round(($slope / max($firstAvg, 1)) * 100, 2)
        ];
    }

    /**
     * Calculate activity frequency
     */
    private function calculateActivityFrequency(array $quizTrends, array $progTrends): array
    {
        $quizDays = count($quizTrends);
        $progDays = count($progTrends);
        
        return [
            'quiz_active_days' => $quizDays,
            'programming_active_days' => $progDays,
            'total_active_days' => $quizDays + $progDays,
            'activity_consistency' => $this->calculateActivityConsistency($quizTrends, $progTrends)
        ];
    }

    /**
     * Calculate improvement rate
     */
    private function calculateImprovementRate(array $quizTrends, array $progTrends): array
    {
        $quizImprovement = $this->calculateProgressionMetrics($quizTrends, 'avg_score');
        $progImprovement = $this->calculateProgressionMetrics($progTrends, 'avg_score');

        return [
            'quiz_improvement_rate' => $quizImprovement['improvement_rate'],
            'programming_improvement_rate' => $progImprovement['improvement_rate'],
            'overall_learning_velocity' => ($quizImprovement['improvement_rate'] + $progImprovement['improvement_rate']) / 2
        ];
    }

    /**
     * Calculate activity consistency
     */
    private function calculateActivityConsistency(array $quizTrends, array $progTrends): string
    {
        $totalDays = count($quizTrends) + count($progTrends);
        
        if ($totalDays >= 20) return 'very_consistent';
        if ($totalDays >= 10) return 'consistent';
        if ($totalDays >= 5) return 'moderate';
        return 'inconsistent';
    }

    /**
     * Identify quiz strengths
     */
    private function identifyQuizStrengths(array $quizTypePerformance): array
    {
        $strengths = [];
        
        foreach ($quizTypePerformance as $performance) {
            if ($performance['avg_score'] > 70) { // Assuming 70+ is good performance
                $strengths[] = [
                    'area' => $performance['quiz_type'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Sort by score descending
        usort($strengths, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return $strengths;
    }

    /**
     * Identify quiz weaknesses
     */
    private function identifyQuizWeaknesses(array $quizTypePerformance): array
    {
        $weaknesses = [];
        
        foreach ($quizTypePerformance as $performance) {
            if ($performance['avg_score'] < 50) { // Assuming 50- is poor performance
                $weaknesses[] = [
                    'area' => $performance['quiz_type'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Sort by score ascending
        usort($weaknesses, function($a, $b) {
            return $a['score'] <=> $b['score'];
        });

        return $weaknesses;
    }

    /**
     * Identify programming strengths
     */
    private function identifyProgrammingStrengths(array $languagePerformance, array $difficultyPerformance): array
    {
        $strengths = [];
        
        // Language strengths
        foreach ($languagePerformance as $performance) {
            if ($performance['avg_score'] > 70) {
                $strengths[] = [
                    'type' => 'language',
                    'area' => $performance['language_name'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Difficulty strengths
        foreach ($difficultyPerformance as $performance) {
            if ($performance['avg_score'] > 70) {
                $strengths[] = [
                    'type' => 'difficulty',
                    'area' => $performance['difficulty_level'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Sort by score descending
        usort($strengths, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return $strengths;
    }

    /**
     * Identify programming weaknesses
     */
    private function identifyProgrammingWeaknesses(array $languagePerformance, array $difficultyPerformance): array
    {
        $weaknesses = [];
        
        // Language weaknesses
        foreach ($languagePerformance as $performance) {
            if ($performance['avg_score'] < 50) {
                $weaknesses[] = [
                    'type' => 'language',
                    'area' => $performance['language_name'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Difficulty weaknesses
        foreach ($difficultyPerformance as $performance) {
            if ($performance['avg_score'] < 50) {
                $weaknesses[] = [
                    'type' => 'difficulty',
                    'area' => $performance['difficulty_level'],
                    'score' => round($performance['avg_score'], 2),
                    'attempts' => $performance['total_attempts']
                ];
            }
        }

        // Sort by score ascending
        usort($weaknesses, function($a, $b) {
            return $a['score'] <=> $b['score'];
        });

        return $weaknesses;
    }

    /**
     * Identify overall patterns
     */
    private function identifyOverallPatterns(int $userId): array
    {
        $performanceStats = $this->userRepository->getUserPerformanceStats($userId);
        
        $patterns = [];
        
        // Activity level
        $totalAttempts = $performanceStats['quiz_stats']['total_attempts'] + $performanceStats['programming_stats']['total_attempts'];
        if ($totalAttempts > 20) {
            $patterns[] = 'high_activity';
        } elseif ($totalAttempts > 10) {
            $patterns[] = 'moderate_activity';
        } else {
            $patterns[] = 'low_activity';
        }

        // Performance balance
        $quizAvg = $performanceStats['quiz_stats']['average_score'];
        $progAvg = $performanceStats['programming_stats']['average_score'];
        
        if (abs($quizAvg - $progAvg) < 10) {
            $patterns[] = 'balanced_performance';
        } elseif ($quizAvg > $progAvg) {
            $patterns[] = 'quiz_oriented';
        } else {
            $patterns[] = 'programming_oriented';
        }

        return $patterns;
    }
} 