import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './components/dashboard/Dashboard';
import BrandOverview from './components/dashboard/BrandOverview';
import TokenSystem from './components/tokens/TokenSystem';
import AssetGenerator from './components/assets/AssetGenerator';
import ExportCenter from './components/exports/ExportCenter';
import CampaignManager from './components/campaigns/CampaignManager';
import BrandIntelligence from './components/intelligence/BrandIntelligence';
import Settings from './components/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'brand/:brandId',
        children: [
          { index: true, element: <BrandOverview /> },
          { path: 'tokens', element: <TokenSystem /> },
          { path: 'assets', element: <AssetGenerator /> },
          { path: 'assets/:assetType', element: <AssetGenerator /> },
          { path: 'campaigns', element: <CampaignManager /> },
          { path: 'exports', element: <ExportCenter /> },
          { path: 'intelligence', element: <BrandIntelligence /> },
        ]
      },
      { path: 'settings', element: <Settings /> },
    ]
  }
]);
