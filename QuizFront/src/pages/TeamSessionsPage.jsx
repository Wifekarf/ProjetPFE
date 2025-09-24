import React from 'react';
import AuthLayout from '../Layout/AuthLayout';
import TeamSessionsManager from '../TeamSession/TeamSessionsManager';

export default function TeamSessionsPage() {
  return (
    <AuthLayout>
      <TeamSessionsManager />
    </AuthLayout>
  );
}
