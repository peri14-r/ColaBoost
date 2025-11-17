import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/toaster';

// Marketing Pages
import Index from './pages/Index';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import API from './pages/API';
import Integrations from './pages/Integrations';
import Company from './pages/Company';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Careers from './pages/Careers';
import JobDetail from './pages/JobDetail';
import Contact from './pages/Contact';
import Support from './pages/Support';
import HelpCenter from './pages/HelpCenter';
import HelpArticle from './pages/HelpArticle';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Security from './pages/Security';

// App Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import FindCreators from './pages/FindCreators';
import MyCollabs from './pages/MyCollabs';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

// System Pages
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Marketing Pages */}
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/api" element={<API />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/company" element={<Company />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/careers/:id" element={<JobDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/help/:slug" element={<HelpArticle />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/security" element={<Security />} />

              {/* App Pages */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/find-creators" element={<FindCreators />} />
              <Route path="/my-collabs" element={<MyCollabs />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/u/:handle" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />

              {/* System Pages */}
              <Route path="/500" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
