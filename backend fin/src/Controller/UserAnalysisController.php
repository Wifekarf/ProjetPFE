<?php

namespace App\Controller;

use App\Service\UserAnalysisService;
use App\Service\GeminiService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Dompdf\Dompdf;
use Dompdf\Options;

#[Route('/api/admin/user-analysis', name: 'api_admin_user_analysis_')]
class UserAnalysisController extends AbstractController
{
    private UserAnalysisService $userAnalysisService;
    private GeminiService $geminiService;

    public function __construct(
        UserAnalysisService $userAnalysisService,
        GeminiService $geminiService
    ) {
        $this->userAnalysisService = $userAnalysisService;
        $this->geminiService = $geminiService;
    }

    /**
     * Generate comprehensive user analysis report
     */
    #[Route('/{userId}', name: 'generate_report', methods: ['GET'])]
    public function generateAnalysisReport(int $userId): JsonResponse
    {
        try {
            // Check if user has admin role
            $this->checkAdminAccess();

            error_log("=== Starting user analysis for user ID: $userId ===");
            
            // Get comprehensive user data
            try {
                error_log("Step 1: Getting user data for user $userId");
                $userData = $this->userAnalysisService->getComprehensiveUserAnalysisData($userId);
                error_log("Step 1 completed: User data retrieved successfully");
            } catch (\Exception $e) {
                error_log("ERROR in Step 1 (user data retrieval): " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
                return $this->json([
                    'success' => false,
                    'error' => 'Failed to get user data: ' . $e->getMessage(),
                    'user_id' => $userId,
                    'step' => 'user_data_retrieval'
                ], 500);
            }

            // Generate AI analysis report
            try {
                error_log("Step 2: Generating AI analysis report");
                $analysisReport = $this->geminiService->generateUserAnalysisReport($userData);
                error_log("Step 2 completed: AI analysis report generated successfully");
            } catch (\Exception $e) {
                error_log("ERROR in Step 2 (gemini analysis): " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
                return $this->json([
                    'success' => false,
                    'error' => 'Failed to generate analysis report: ' . $e->getMessage(),
                    'user_id' => $userId,
                    'step' => 'gemini_analysis'
                ], 500);
            }

            // Add metadata
            $response = [
                'success' => true,
                'user_id' => $userId,
                'analysis_report' => $analysisReport,
                'raw_data' => $userData,
                'generated_at' => (new \DateTime())->format('Y-m-d H:i:s'),
                'api_version' => '1.0'
            ];

            error_log("=== User analysis completed successfully for user ID: $userId ===");
            return $this->json($response);

        } catch (\Exception $e) {
            error_log("ERROR in general processing: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->json([
                'success' => false,
                'error' => 'General error: ' . $e->getMessage(),
                'user_id' => $userId,
                'step' => 'general_error'
            ], 500);
        }
    }

    /**
     * Generate PDF report for user analysis
     */
    #[Route('/{userId}/pdf', name: 'generate_pdf', methods: ['GET'])]
    public function generatePDFReport(int $userId): Response
    {
        try {
            // Check if user has admin role
            $this->checkAdminAccess();

            // Get comprehensive user data
            $userData = $this->userAnalysisService->getComprehensiveUserAnalysisData($userId);

            // Generate AI analysis report
            $analysisReport = $this->geminiService->generateUserAnalysisReport($userData);

            // Generate PDF
            $pdfContent = $this->generatePDFContent($userData, $analysisReport);

            // Configure PDF options
            $options = new Options();
            $options->set('defaultFont', 'DejaVu Sans');
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isPhpEnabled', true);
            $options->set('isRemoteEnabled', true);

            // Create PDF
            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($pdfContent);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Generate filename
            $username = $userData['user_profile']['username'];
            $date = date('Y-m-d');
            $filename = "user_analysis_{$username}_{$date}.pdf";

            // Return PDF response
            return new Response(
                $dompdf->output(),
                200,
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0'
                ]
            );

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage(),
                'user_id' => $userId
            ], 500);
        }
    }

    /**
     * Get user analysis data without AI processing (for charts/visualization)
     */
    #[Route('/{userId}/data', name: 'get_raw_data', methods: ['GET'])]
    public function getRawAnalysisData(int $userId): JsonResponse
    {
        try {
            // Check if user has admin role
            $this->checkAdminAccess();

            // Get comprehensive user data
            $userData = $this->userAnalysisService->getComprehensiveUserAnalysisData($userId);

            return $this->json([
                'success' => true,
                'user_id' => $userId,
                'data' => $userData,
                'generated_at' => (new \DateTime())->format('Y-m-d H:i:s')
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage(),
                'user_id' => $userId
            ], 500);
        }
    }

    /**
     * Batch analysis for multiple users
     */
    #[Route('/batch', name: 'batch_analysis', methods: ['POST'])]
    public function batchAnalysis(Request $request): JsonResponse
    {
        try {
            // Check if user has admin role
            $this->checkAdminAccess();

            $data = json_decode($request->getContent(), true);
            $userIds = $data['user_ids'] ?? [];

            if (empty($userIds) || !is_array($userIds)) {
                return $this->json([
                    'success' => false,
                    'error' => 'Invalid user_ids provided'
                ], 400);
            }

            // Limit batch size to prevent timeout
            if (count($userIds) > 10) {
                return $this->json([
                    'success' => false,
                    'error' => 'Batch size limited to 10 users'
                ], 400);
            }

            $results = [];
            foreach ($userIds as $userId) {
                try {
                    $userData = $this->userAnalysisService->getComprehensiveUserAnalysisData($userId);
                    $analysisReport = $this->geminiService->generateUserAnalysisReport($userData);
                    
                    $results[] = [
                        'user_id' => $userId,
                        'success' => true,
                        'analysis_report' => $analysisReport,
                        'user_profile' => $userData['user_profile']
                    ];
                } catch (\Exception $e) {
                    $results[] = [
                        'user_id' => $userId,
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return $this->json([
                'success' => true,
                'results' => $results,
                'total_processed' => count($userIds),
                'generated_at' => (new \DateTime())->format('Y-m-d H:i:s')
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if current user has admin access
     */
    private function checkAdminAccess(): void
    {
        $user = $this->getUser();
        
        if (!$user) {
            throw new AccessDeniedException('Authentication required');
        }

        // Check if user has admin role
        if (!in_array('ROLE_ADMIN', $user->getRoles())) {
            throw new AccessDeniedException('Admin access required');
        }
    }

    /**
     * Generate PDF content from analysis data
     */
    private function generatePDFContent(array $userData, array $analysisReport): string
    {
        $userProfile = $userData['user_profile'];
        $performanceStats = $userData['performance_stats'];

        // Generate styled HTML content for PDF
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: DejaVu Sans, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #333;
            margin: 20px;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #4a90e2; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { 
            color: #4a90e2; 
            margin: 0; 
            font-size: 24px;
        }
        .header .subtitle { 
            color: #666; 
            font-size: 14px; 
            margin-top: 5px;
        }
        .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
        }
        .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #4a90e2; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
            margin-bottom: 15px;
        }
        .user-info { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
        }
        .user-info table { 
            width: 100%; 
            border-collapse: collapse;
        }
        .user-info td { 
            padding: 5px 10px; 
            border-bottom: 1px solid #eee;
        }
        .user-info td:first-child { 
            font-weight: bold; 
            color: #555; 
            width: 30%;
        }
        .executive-summary { 
            background: #e8f4f8; 
            padding: 15px; 
            border-left: 4px solid #4a90e2; 
            font-style: italic; 
            margin-bottom: 20px;
        }
        .strength-item, .improvement-item { 
            background: #f8f9fa; 
            padding: 10px; 
            margin-bottom: 10px; 
            border-radius: 3px;
        }
        .strength-item { 
            border-left: 4px solid #28a745;
        }
        .improvement-item { 
            border-left: 4px solid #ffc107;
        }
        .item-title { 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 5px;
        }
        .item-description { 
            color: #666; 
            font-size: 11px;
        }
        .performance-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .performance-card { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            border: 1px solid #ddd;
        }
        .performance-card h4 { 
            margin: 0 0 10px 0; 
            color: #4a90e2;
        }
        .stat-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px;
        }
        .stat-label { 
            color: #666;
        }
        .stat-value { 
            font-weight: bold;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            color: #666; 
            font-size: 10px;
        }
        .page-break { 
            page-break-before: always;
        }
        .recommendations { 
            background: #fff3cd; 
            padding: 15px; 
            border-radius: 5px; 
            border: 1px solid #ffeaa7;
        }
        .recommendations ul { 
            margin: 10px 0; 
            padding-left: 20px;
        }
        .recommendations li { 
            margin-bottom: 5px;
        }
    </style>
</head>
<body>';

        // Header
        $html .= '<div class="header">
            <h1>User Performance Analysis Report</h1>
            <div class="subtitle">Generated on ' . date('F j, Y \a\t g:i A') . '</div>
        </div>';

        // User Information
        $html .= '<div class="section">
            <div class="section-title">User Information</div>
            <div class="user-info">
                <table>
                    <tr>
                        <td>Name:</td>
                        <td>' . htmlspecialchars($userProfile['username']) . '</td>
                    </tr>
                    <tr>
                        <td>Email:</td>
                        <td>' . htmlspecialchars($userProfile['email']) . '</td>
                    </tr>
                    <tr>
                        <td>Role:</td>
                        <td>' . htmlspecialchars($userProfile['role']) . '</td>
                    </tr>
                    <tr>
                        <td>Rank:</td>
                        <td>' . htmlspecialchars($userProfile['rank']) . '</td>
                    </tr>
                    <tr>
                        <td>Total Points:</td>
                        <td>' . number_format($userProfile['points_total_all']) . '</td>
                    </tr>
                    <tr>
                        <td>Account Age:</td>
                        <td>' . $performanceStats['account_age_days'] . ' days</td>
                    </tr>
                    <tr>
                        <td>Status:</td>
                        <td>' . htmlspecialchars($userProfile['status']) . '</td>
                    </tr>
                </table>
            </div>
        </div>';

        // Executive Summary
        $html .= '<div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="executive-summary">
                ' . htmlspecialchars($analysisReport['executive_summary']) . '
            </div>
        </div>';

        // Performance Overview
        $html .= '<div class="section">
            <div class="section-title">Performance Overview</div>
            <div class="performance-grid">
                <div class="performance-card">
                    <h4>Quiz Performance</h4>
                    <div class="stat-row">
                        <span class="stat-label">Total Attempts:</span>
                        <span class="stat-value">' . $performanceStats['quiz_stats']['total_attempts'] . '</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Average Score:</span>
                        <span class="stat-value">' . number_format($performanceStats['quiz_stats']['average_score'], 1) . '</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Total Points:</span>
                        <span class="stat-value">' . number_format($performanceStats['quiz_stats']['total_points']) . '</span>
                    </div>
                </div>
                <div class="performance-card">
                    <h4>Programming Performance</h4>
                    <div class="stat-row">
                        <span class="stat-label">Total Attempts:</span>
                        <span class="stat-value">' . $performanceStats['programming_stats']['total_attempts'] . '</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Average Score:</span>
                        <span class="stat-value">' . number_format($performanceStats['programming_stats']['average_score'], 1) . '</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Total Points:</span>
                        <span class="stat-value">' . number_format($performanceStats['programming_stats']['total_points']) . '</span>
                    </div>
                </div>
            </div>
        </div>';

        // Key Strengths
        $html .= '<div class="section">
            <div class="section-title">Key Strengths</div>';
        
        foreach ($analysisReport['key_strengths'] as $strength) {
            $html .= '<div class="strength-item">
                <div class="item-title">' . htmlspecialchars($strength['title']) . ' (' . htmlspecialchars($strength['impact']) . ' Impact)</div>
                <div class="item-description">' . htmlspecialchars($strength['description']) . '</div>
                <div class="item-description"><strong>Evidence:</strong> ' . htmlspecialchars($strength['evidence']) . '</div>
            </div>';
        }
        
        $html .= '</div>';

        // Areas for Improvement
        $html .= '<div class="section page-break">
            <div class="section-title">Areas for Improvement</div>';
        
        foreach ($analysisReport['areas_for_improvement'] as $improvement) {
            $html .= '<div class="improvement-item">
                <div class="item-title">' . htmlspecialchars($improvement['title']) . ' (' . htmlspecialchars($improvement['priority']) . ' Priority)</div>
                <div class="item-description">' . htmlspecialchars($improvement['description']) . '</div>
                <div class="item-description"><strong>Recommendations:</strong> ' . htmlspecialchars($improvement['recommendations']) . '</div>
            </div>';
        }
        
        $html .= '</div>';

        // Technical Assessment
        $html .= '<div class="section">
            <div class="section-title">Technical Assessment</div>
            <div class="performance-grid">
                <div class="performance-card">
                    <h4>Quiz Performance - ' . htmlspecialchars($analysisReport['technical_assessment']['quiz_performance']['overall_rating']) . '</h4>
                    <p>' . htmlspecialchars($analysisReport['technical_assessment']['quiz_performance']['key_insights']) . '</p>
                    <div><strong>Strongest Areas:</strong> ' . implode(', ', $analysisReport['technical_assessment']['quiz_performance']['strongest_areas']) . '</div>
                    <div><strong>Improvement Areas:</strong> ' . implode(', ', $analysisReport['technical_assessment']['quiz_performance']['improvement_areas']) . '</div>
                </div>
                <div class="performance-card">
                    <h4>Programming Performance - ' . htmlspecialchars($analysisReport['technical_assessment']['programming_performance']['overall_rating']) . '</h4>
                    <p>' . htmlspecialchars($analysisReport['technical_assessment']['programming_performance']['key_insights']) . '</p>
                    <div><strong>Preferred Languages:</strong> ' . implode(', ', $analysisReport['technical_assessment']['programming_performance']['preferred_languages']) . '</div>
                    <div><strong>Comfort Level:</strong> ' . htmlspecialchars($analysisReport['technical_assessment']['programming_performance']['comfort_level']) . '</div>
                </div>
            </div>
        </div>';

        // Career Recommendations
        $html .= '<div class="section">
            <div class="section-title">Career Recommendations</div>
            <div class="recommendations">
                <div><strong>Suitable Roles:</strong> ' . implode(', ', $analysisReport['career_recommendations']['suitable_roles']) . '</div>
                <div><strong>Development Path:</strong> ' . htmlspecialchars($analysisReport['career_recommendations']['development_path']) . '</div>
                <div><strong>Skill Gaps:</strong> ' . implode(', ', $analysisReport['career_recommendations']['skill_gaps']) . '</div>
                <div><strong>Training Priorities:</strong> ' . implode(', ', $analysisReport['career_recommendations']['training_priorities']) . '</div>
            </div>
        </div>';

        // Footer
        $html .= '<div class="footer">
            This report was generated automatically by the User Analysis System on ' . date('Y-m-d H:i:s') . '
        </div>';

        $html .= '</body></html>';

        return $html;
    }
} 