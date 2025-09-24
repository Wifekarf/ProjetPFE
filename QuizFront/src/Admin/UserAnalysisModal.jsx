import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaTimes, 
  FaDownload, 
  FaSpinner, 
  FaChartLine, 
  FaLightbulb, 
  FaExclamationTriangle,
  FaRocket,
  FaBullseye,
  FaBrain,
  FaTrophy,
  FaUserGraduate,
  FaCode,
  FaQuestionCircle
} from 'react-icons/fa';
import { userAnalysisService } from '../services/userAnalysisService';

const UserAnalysisModal = ({ user, isOpen, onClose }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      generateAnalysis();
    }
  }, [isOpen, user]);

  const generateAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Debug: Check if we have authentication data
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error('No user data found in localStorage. Please log in again.');
      }

      const userData = JSON.parse(storedUser);
      if (!userData.token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (userData.role !== 'ROLE_ADMIN') {
        throw new Error('Admin access required. Your role: ' + userData.role);
      }

      console.log('Generating analysis for user ID:', user.id);

      const response = await userAnalysisService.generateAnalysisReport(user.id);
      const formattedReport = userAnalysisService.formatAnalysisReport(response.analysis_report);
      
      setAnalysisData({
        ...response,
        formatted_report: formattedReport,
        chart_data: userAnalysisService.extractChartData(response.raw_data),
        trends: userAnalysisService.getPerformanceTrends(response.raw_data)
      });
    } catch (err) {
      console.error('Error generating analysis:', err);
      
      // Extract detailed error information
      let errorMessage = 'Failed to generate analysis report';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // Add step information if available
        if (err.response.data.step) {
          errorMessage += ` (Step: ${err.response.data.step})`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!user || !analysisData) return;

    setDownloadingPDF(true);
    try {
      await userAnalysisService.downloadPDFReport(user.id, user.username);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF report');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'strengths', label: 'Strengths', icon: FaTrophy },
          { id: 'improvements', label: 'Improvements', icon: FaBullseye },
    { id: 'technical', label: 'Technical', icon: FaCode },
    { id: 'career', label: 'Career', icon: FaUserGraduate }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FaSpinner className="animate-spin text-6xl text-blue-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Generating AI analysis...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <button
              onClick={generateAnalysis}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (!analysisData) return null;

    const report = analysisData.formatted_report;

    switch (activeTab) {
      case 'overview':
        return <OverviewTab report={report} user={user} trends={analysisData.trends} />;
      case 'strengths':
        return <StrengthsTab report={report} />;
      case 'improvements':
        return <ImprovementsTab report={report} />;
      case 'technical':
        return <TechnicalTab report={report} chartData={analysisData.chart_data} />;
      case 'career':
        return <CareerTab report={report} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <FaBrain className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI User Analysis</h2>
                  <p className="text-blue-100">
                    {user?.username} • Generated by Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF || !analysisData}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {downloadingPDF ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaDownload />
                  )}
                  <span>PDF Report</span>
                </button>
                <button
                  onClick={onClose}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors p-2 rounded-lg"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {renderTabContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Overview Tab Component
const OverviewTab = ({ report, user, trends }) => (
  <div className="space-y-6">
    {/* Executive Summary */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100"
    >
      <div className="flex items-center space-x-3 mb-4">
        <FaLightbulb className="text-2xl text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Executive Summary</h3>
      </div>
      <p className="text-gray-700 leading-relaxed text-lg">
        {report.executive_summary}
      </p>
    </motion.div>

    {/* Key Metrics Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-lg border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <FaTrophy className="text-2xl text-green-600" />
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            report.overallRating === 'Excellent' ? 'bg-green-100 text-green-800' :
            report.overallRating === 'Good' ? 'bg-blue-100 text-blue-800' :
            report.overallRating === 'Average' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {report.overallRating}
          </span>
        </div>
        <h4 className="font-semibold text-gray-800 mb-2">Overall Rating</h4>
        <p className="text-sm text-gray-600">
          Based on technical assessments
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-lg border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <FaRocket className="text-2xl text-purple-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {report.learningVelocity}
          </span>
        </div>
        <h4 className="font-semibold text-gray-800 mb-2">Learning Velocity</h4>
        <p className="text-sm text-gray-600">
          Rate of skill improvement
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-xl shadow-lg border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <FaChartLine className="text-2xl text-orange-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            {report.consistency}
          </span>
        </div>
        <h4 className="font-semibold text-gray-800 mb-2">Consistency</h4>
        <p className="text-sm text-gray-600">
          Activity and performance consistency
        </p>
      </motion.div>
    </div>

    {/* Quick Stats */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white p-6 rounded-xl shadow-lg border"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{report.strengthsCount}</div>
          <div className="text-sm text-gray-600">Key Strengths</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{report.improvementAreasCount}</div>
          <div className="text-sm text-gray-600">Improvement Areas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{report.topSuitableRoles.length}</div>
          <div className="text-sm text-gray-600">Suitable Roles</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{report.priorityTraining.length}</div>
          <div className="text-sm text-gray-600">Training Priorities</div>
        </div>
      </div>
    </motion.div>
  </div>
);

// Strengths Tab Component
const StrengthsTab = ({ report }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      <FaTrophy className="text-yellow-500 mr-3" />
      Key Strengths
    </h3>
    {report.key_strengths?.map((strength, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-green-50 border border-green-200 p-6 rounded-xl"
      >
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-lg font-semibold text-green-800">{strength.title}</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            strength.impact === 'High' ? 'bg-red-100 text-red-800' :
            strength.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {strength.impact} Impact
          </span>
        </div>
        <p className="text-gray-700 mb-3">{strength.description}</p>
        <div className="bg-green-100 p-3 rounded-lg">
          <strong className="text-green-800">Evidence:</strong>
          <span className="text-green-700 ml-2">{strength.evidence}</span>
        </div>
      </motion.div>
    )) || <p className="text-gray-500">No strengths identified yet.</p>}
  </div>
);

// Improvements Tab Component
const ImprovementsTab = ({ report }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      <FaBullseye className="text-orange-500 mr-3" />
      Areas for Improvement
    </h3>
    {report.areas_for_improvement?.map((improvement, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-orange-50 border border-orange-200 p-6 rounded-xl"
      >
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-lg font-semibold text-orange-800">{improvement.title}</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            improvement.priority === 'High' ? 'bg-red-100 text-red-800' :
            improvement.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {improvement.priority} Priority
          </span>
        </div>
        <p className="text-gray-700 mb-3">{improvement.description}</p>
        <div className="bg-orange-100 p-3 rounded-lg">
          <strong className="text-orange-800">Recommendations:</strong>
          <span className="text-orange-700 ml-2">{improvement.recommendations}</span>
        </div>
      </motion.div>
    )) || <p className="text-gray-500">No improvement areas identified yet.</p>}
  </div>
);

// Technical Tab Component
const TechnicalTab = ({ report }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      <FaCode className="text-blue-500 mr-3" />
      Technical Assessment
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quiz Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-blue-800">Quiz Performance</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            report.technical_assessment?.quiz_performance?.overall_rating === 'Excellent' ? 'bg-green-100 text-green-800' :
            report.technical_assessment?.quiz_performance?.overall_rating === 'Good' ? 'bg-blue-100 text-blue-800' :
            report.technical_assessment?.quiz_performance?.overall_rating === 'Average' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {report.technical_assessment?.quiz_performance?.overall_rating || 'Unknown'}
          </span>
        </div>
        <p className="text-gray-700 mb-4">
          {report.technical_assessment?.quiz_performance?.key_insights || 'No insights available'}
        </p>
        <div className="space-y-2">
          <div>
            <strong className="text-blue-800">Strongest Areas:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.technical_assessment?.quiz_performance?.strongest_areas?.map((area, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {area}
                </span>
              )) || <span className="text-gray-500">None identified</span>}
            </div>
          </div>
          <div>
            <strong className="text-blue-800">Improvement Areas:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.technical_assessment?.quiz_performance?.improvement_areas?.map((area, index) => (
                <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                  {area}
                </span>
              )) || <span className="text-gray-500">None identified</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Programming Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-purple-50 border border-purple-200 p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-purple-800">Programming Performance</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            report.technical_assessment?.programming_performance?.overall_rating === 'Excellent' ? 'bg-green-100 text-green-800' :
            report.technical_assessment?.programming_performance?.overall_rating === 'Good' ? 'bg-blue-100 text-blue-800' :
            report.technical_assessment?.programming_performance?.overall_rating === 'Average' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {report.technical_assessment?.programming_performance?.overall_rating || 'Unknown'}
          </span>
        </div>
        <p className="text-gray-700 mb-4">
          {report.technical_assessment?.programming_performance?.key_insights || 'No insights available'}
        </p>
        <div className="space-y-2">
          <div>
            <strong className="text-purple-800">Preferred Languages:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {report.technical_assessment?.programming_performance?.preferred_languages?.map((lang, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {lang}
                </span>
              )) || <span className="text-gray-500">None identified</span>}
            </div>
          </div>
          <div>
            <strong className="text-purple-800">Comfort Level:</strong>
            <span className="ml-2 text-purple-700">
              {report.technical_assessment?.programming_performance?.comfort_level || 'Unknown'}
            </span>
          </div>
          <div>
            <strong className="text-purple-800">Code Quality Trend:</strong>
            <span className="ml-2 text-purple-700">
              {report.technical_assessment?.programming_performance?.code_quality_trends || 'Unknown'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

// Career Tab Component
const CareerTab = ({ report }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
      <FaUserGraduate className="text-indigo-500 mr-3" />
      Career Recommendations
    </h3>

    {/* Suitable Roles */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl"
    >
      <h4 className="text-lg font-semibold text-indigo-800 mb-4">Suitable Roles</h4>
      <div className="flex flex-wrap gap-3">
        {report.career_recommendations?.suitable_roles?.map((role, index) => (
          <span
            key={index}
            className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium"
          >
            {role}
          </span>
        )) || <span className="text-gray-500">No roles identified</span>}
      </div>
    </motion.div>

    {/* Development Path */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-green-50 border border-green-200 p-6 rounded-xl"
    >
      <h4 className="text-lg font-semibold text-green-800 mb-4">Development Path</h4>
      <p className="text-gray-700">
        {report.career_recommendations?.development_path || 'No development path provided'}
      </p>
    </motion.div>

    {/* Skill Gaps & Training */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-red-50 border border-red-200 p-6 rounded-xl"
      >
        <h4 className="text-lg font-semibold text-red-800 mb-4">Skill Gaps</h4>
        <div className="space-y-2">
          {report.career_recommendations?.skill_gaps?.map((gap, index) => (
            <div key={index} className="flex items-center space-x-2">
              <FaQuestionCircle className="text-red-600" />
              <span className="text-gray-700">{gap}</span>
            </div>
          )) || <span className="text-gray-500">No skill gaps identified</span>}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 p-6 rounded-xl"
      >
        <h4 className="text-lg font-semibold text-blue-800 mb-4">Training Priorities</h4>
        <div className="space-y-2">
          {report.career_recommendations?.training_priorities?.map((priority, index) => (
            <div key={index} className="flex items-center space-x-2">
                              <FaBullseye className="text-blue-600" />
              <span className="text-gray-700">{priority}</span>
            </div>
          )) || <span className="text-gray-500">No training priorities identified</span>}
        </div>
      </motion.div>
    </div>

    {/* Future Predictions */}
    {report.performance_predictions && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 border border-gray-200 p-6 rounded-xl"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Performance Predictions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Next 3 Months</h5>
            <p className="text-sm text-gray-600">
              {report.performance_predictions.next_3_months}
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Potential Challenges</h5>
            <p className="text-sm text-gray-600">
              {report.performance_predictions.potential_challenges}
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Growth Opportunities</h5>
            <p className="text-sm text-gray-600">
              {report.performance_predictions.growth_opportunities}
            </p>
          </div>
        </div>
      </motion.div>
    )}
  </div>
);

export default UserAnalysisModal; 