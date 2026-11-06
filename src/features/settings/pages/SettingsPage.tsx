import React, { useState } from 'react';
import { SettingsTabs } from '../components/SettingsTabs';
import type { SettingsTabId } from '../types/settings';

// Import de tes composants
import { UsersTable } from '../components/UsersTab';
import { RolesSidebar } from '../components/RolesTab/RolesSidebar';
import { PermissionsMatrix } from '../components/RolesTab/PermissionsMatrix';
import { CompanyInfoForm } from '../components/CompanyInfoTab';
import { DocumentTypesTab } from '../components/DocumentTypesTab/DocumentTypesTab';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('users');
  const [selectedRole, setSelectedRole] = useState<string>('Juriste');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTable />;

      case 'roles':
        return (
          // Changement ici : flex-col sur mobile, flex-row sur écran large
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-64">
              <RolesSidebar selectedRole={selectedRole} onSelectRole={setSelectedRole} />
            </div>
            <div className="flex-1 w-full">
              <PermissionsMatrix role={selectedRole} />
            </div>
          </div>
        );

      case 'document-types':
        return <DocumentTypesTab />;

      case 'company-info':
        return <CompanyInfoForm />;

      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen px-4 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-bold text-text">Centre d'Administration</h1>
          <p className="text-sm text-text-muted">Voici un aperçu de l'activité de l'étude aujourd'hui.</p>
        </div>

        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4 w-full">{renderTabContent()}</div>
      </div>
    </div>
  );
};
