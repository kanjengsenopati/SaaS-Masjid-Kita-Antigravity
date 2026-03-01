import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from './features/tenants/TenantContext';
import { AppLayout } from './components/AppLayout';
import { SettingsModule } from './features/settings/SettingsModule';
import { OrganizationModule } from './features/organization/OrganizationModule';
import { MosqueProfile } from './features/public/MosqueProfile';
import { DashboardHome } from './features/dashboard/DashboardHome';
import { CongregationModule } from './features/congregation/CongregationModule';
import { FinanceModule } from './features/finance/FinanceModule';
import { AgendaModule } from './features/agenda/AgendaModule';
import { AsatidzModule } from './features/asatidz/AsatidzModule';
import { AssetModule } from './features/assets/AssetModule';
import { SocialModule } from './features/social/SocialModule';
import { SubscriptionModule } from './features/subscription/SubscriptionModule';

import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterWizard } from './features/auth/RegisterWizard';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LandingPage } from './features/landing/LandingPage';
import { SaaSLandingPage } from './features/landing/SaaSLandingPage';
import { DigitalSignage } from './features/signage/DigitalSignage';
import { AffiliatePartnerPage } from './features/landing/AffiliatePartnerPage';
import { SaaSAdminPanel } from './features/admin/SaaSAdminPanel';
import { SaaSAuthProvider } from './features/admin/SaaSAuthContext';
import { SaaSLayout } from './features/admin/SaaSLayout';
import { SaaSAdminLogin } from './features/admin/SaaSAdminLogin';
import { SaaSStaffManagement } from './features/admin/SaaSStaffManagement';
import { AffiliateDashboard } from './features/admin/AffiliateDashboard';
import { AffiliatePortal } from './features/admin/AffiliatePortal';
import { SaaSAdminDashboard } from './features/admin/SaaSAdminDashboard';
import { SystemSettings } from './features/admin/SystemSettings';
import { PackageManagement } from './features/admin/PackageManagement';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<SaaSLandingPage />} />
            <Route path="/jadi-partner" element={<AffiliatePartnerPage />} />
            <Route path="/website/:slug" element={<LandingPage />} />
            <Route path="/signage" element={<DigitalSignage />} />

            {/* SaaS Administration Routes */}
            <Route path="/saas-login" element={<SaaSAuthProvider><SaaSAdminLogin /></SaaSAuthProvider>} />
            <Route path="/saas-admin" element={
              <SaaSAuthProvider>
                <SaaSLayout />
              </SaaSAuthProvider>
            }>
              <Route index element={<SaaSAdminDashboard />} />
              <Route path="tenants" element={<SaaSAdminPanel />} />
              <Route path="staff" element={<SaaSStaffManagement />} />
              <Route path="revenue" element={<AffiliateDashboard />} />
              <Route path="affiliate-portal" element={<AffiliatePortal />} />
              <Route path="packages" element={<PackageManagement />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/:slug" element={<LoginPage />} />
            <Route path="/register" element={<RegisterWizard />} />
            <Route path="/profile" element={<MosqueProfile />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="congregation" element={<CongregationModule />} />
              <Route path="organization" element={<OrganizationModule />} />
              <Route path="social" element={<SocialModule />} />
              <Route path="finance" element={<FinanceModule />} />
              <Route path="agenda" element={<AgendaModule />} />
              <Route path="asatidz" element={<AsatidzModule />} />
              <Route path="assets" element={<AssetModule />} />
              <Route path="subscription" element={<SubscriptionModule />} />
              <Route path="settings" element={<SettingsModule />} />
            </Route>
          </Routes>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
};

export default App;
