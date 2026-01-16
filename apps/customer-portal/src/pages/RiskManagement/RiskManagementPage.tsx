import React from 'react';
import { ComingSoonPage } from '../ComingSoon/ComingSoonPage';
import { MdWarning } from 'react-icons/md';

export function RiskManagementPage() {
  return (
    <ComingSoonPage
      title="Risk & Incident Management"
      description="Identify, assess, and manage risks while tracking incidents to ensure safe and compliant operations."
      icon={MdWarning}
    />
  );
}

