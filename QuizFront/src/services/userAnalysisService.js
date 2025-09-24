import api from './api';

export const userAnalysisService = {
  /**
   * Generate comprehensive user analysis report
   * @param {number} userId - User ID to analyze
   * @returns {Promise} API response with analysis report
   */
  async generateAnalysisReport(userId) {
    try {
      const response = await api.get(`/api/admin/user-analysis/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating analysis report:', error);
      throw error;
    }
  },

  /**
   * Get raw user analysis data (for charts and visualization)
   * @param {number} userId - User ID to analyze
   * @returns {Promise} API response with raw data
   */
  async getRawAnalysisData(userId) {
    try {
      const response = await api.get(`/api/admin/user-analysis/${userId}/data`);
      return response.data;
    } catch (error) {
      console.error('Error getting raw analysis data:', error);
      throw error;
    }
  },

  /**
   * Download PDF report for user analysis
   * @param {number} userId - User ID to analyze
   * @param {string} username - Username for filename
   * @returns {Promise} Blob response for PDF download
   */
  async downloadPDFReport(userId, username) {
    try {
      const response = await api.get(`/api/admin/user-analysis/${userId}/pdf`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `user_analysis_${username}_${date}.pdf`);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      throw error;
    }
  },

  /**
   * Batch analysis for multiple users
   * @param {Array} userIds - Array of user IDs to analyze
   * @returns {Promise} API response with batch analysis results
   */
  async batchAnalysis(userIds) {
    try {
      const response = await api.post('/api/admin/user-analysis/batch', {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  },

  /**
   * Check if user analysis is available (user has sufficient data)
   * @param {Object} userData - User data object
   * @returns {boolean} Whether analysis can be performed
   */
  canAnalyzeUser(userData) {
    // Check if user has some activity data
    const hasQuizData = userData.quiz_attempts > 0;
    const hasProgrammingData = userData.programming_attempts > 0;
    const hasProfile = userData.profile_attributes && userData.profile_attributes.length > 0;

    // User needs at least some activity or profile data for meaningful analysis
    return hasQuizData || hasProgrammingData || hasProfile;
  },

  /**
   * Format analysis report for display
   * @param {Object} analysisReport - Raw analysis report from API
   * @returns {Object} Formatted report for UI display
   */
  formatAnalysisReport(analysisReport) {
    return {
      ...analysisReport,
      // Add formatted display helpers
      strengthsCount: analysisReport.key_strengths?.length || 0,
      improvementAreasCount: analysisReport.areas_for_improvement?.length || 0,
      
      // Extract key metrics for dashboard display
      overallRating: this.calculateOverallRating(analysisReport),
      learningVelocity: analysisReport.learning_analysis?.learning_velocity || 'Unknown',
      consistency: analysisReport.learning_analysis?.consistency || 'Unknown',
      
      // Format career recommendations for display
      topSuitableRoles: analysisReport.career_recommendations?.suitable_roles?.slice(0, 3) || [],
      priorityTraining: analysisReport.career_recommendations?.training_priorities?.slice(0, 3) || []
    };
  },

  /**
   * Calculate overall rating from technical assessments
   * @param {Object} analysisReport - Analysis report
   * @returns {string} Overall rating
   */
  calculateOverallRating(analysisReport) {
    const technical = analysisReport.technical_assessment;
    if (!technical) return 'Unknown';

    const quizRating = technical.quiz_performance?.overall_rating || 'Average';
    const progRating = technical.programming_performance?.overall_rating || 'Average';

    // Simple rating calculation
    const ratings = { 'Excellent': 4, 'Good': 3, 'Average': 2, 'Below Average': 1 };
    const quizScore = ratings[quizRating] || 2;
    const progScore = ratings[progRating] || 2;
    const avgScore = (quizScore + progScore) / 2;

    if (avgScore >= 3.5) return 'Excellent';
    if (avgScore >= 2.5) return 'Good';
    if (avgScore >= 1.5) return 'Average';
    return 'Below Average';
  },

  /**
   * Get performance trend indicators
   * @param {Object} rawData - Raw analysis data
   * @returns {Object} Trend indicators
   */
  getPerformanceTrends(rawData) {
    const learningProgression = rawData.learning_progression;
    if (!learningProgression) return {};

    return {
      quizTrend: learningProgression.quiz_progression?.trend || 'stable',
      programmingTrend: learningProgression.programming_progression?.trend || 'stable',
      overallImprovement: learningProgression.improvement_rate?.overall_learning_velocity || 0,
      activityConsistency: learningProgression.activity_frequency?.activity_consistency || 'unknown'
    };
  },

  /**
   * Extract chart data for visualizations
   * @param {Object} rawData - Raw analysis data
   * @returns {Object} Chart-ready data
   */
  extractChartData(rawData) {
    const quizAnalysis = rawData.quiz_analysis;
    const programmingAnalysis = rawData.programming_analysis;

    return {
      // Quiz performance over time
      quizTrends: quizAnalysis?.performance_trends?.map(trend => ({
        date: trend.date,
        averageScore: parseFloat(trend.avg_score) || 0,
        attempts: parseInt(trend.attempts) || 0
      })) || [],

      // Programming performance over time  
      programmingTrends: programmingAnalysis?.performance_trends?.map(trend => ({
        date: trend.date,
        averageScore: parseFloat(trend.avg_score) || 0,
        attempts: parseInt(trend.attempts) || 0
      })) || [],

      // Quiz type performance
      quizTypePerformance: quizAnalysis?.type_performance?.map(type => ({
        type: type.quiz_type,
        averageScore: parseFloat(type.avg_score) || 0,
        attempts: parseInt(type.total_attempts) || 0
      })) || [],

      // Programming language performance
      languagePerformance: programmingAnalysis?.language_performance?.map(lang => ({
        language: lang.language_name,
        averageScore: parseFloat(lang.avg_score) || 0,
        attempts: parseInt(lang.total_attempts) || 0
      })) || [],

      // Difficulty performance
      difficultyPerformance: programmingAnalysis?.difficulty_performance?.map(diff => ({
        difficulty: diff.difficulty_level,
        averageScore: parseFloat(diff.avg_score) || 0,
        attempts: parseInt(diff.total_attempts) || 0
      })) || []
    };
  }
}; 