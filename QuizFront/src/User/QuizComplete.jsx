// src/pages/QuizComplete.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function QuizComplete() {
  // we’ll pass a little state flag when we navigate here…
  const { state } = useLocation();
  const locked = state?.locked === true;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {locked ? (
        <div className="bg-red-100 border border-red-400 text-red-800 p-6 rounded-lg max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">⚠️ Fraud Detected</h1>
          <p className="mb-4">
            Your quiz session was locked due to suspicious activity.<br/>
            Please contact your RH agent to resolve this.
          </p>
    
        </div>
      ) : (
        <div className="bg-white border border-green-200 rounded-lg shadow p-6 max-w-md text-center">
          <h1 className="text-3xl font-bold mb-2 text-green-600">✅ Quiz Completed!</h1>
          <p className="mb-4">Thank you — your answers have been submitted.</p>
      
        </div>
      )}
    </div>
  );
}
