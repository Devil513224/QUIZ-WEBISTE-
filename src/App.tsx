import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExamsPage } from './pages/ExamsPage';
import { TestsPage } from './pages/TestsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { CoursesPage } from './pages/CoursesPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { TypingPage } from './pages/TypingPage';
import {
  AboutPage,
  CurrentAffairsPage,
  JobsPage,
  LeaderboardPage,
  PlannerPage,
} from './pages/UpdatesPages';
import { NotificationsPage } from './pages/NotificationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/exams/:id" element={<ExamsPage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/mock-tests" element={<TestsPage />} />
              <Route path="/quizzes" element={<TestsPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CoursesPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/typing" element={<TypingPage />} />
              <Route path="/affairs" element={<CurrentAffairsPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/login" element={<AccountPage />} />
              <Route path="/register" element={<AccountPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/dashboard" element={<Navigate to="/admin?section=dash" replace />} />
              <Route path="/admin/dash" element={<Navigate to="/admin?section=dash" replace />} />
              <Route path="/admin/qb" element={<Navigate to="/admin?section=qb" replace />} />
              <Route path="/admin/questions" element={<Navigate to="/admin?section=qb" replace />} />
              <Route path="/admin/tests" element={<Navigate to="/admin?section=tests" replace />} />
              <Route path="/admin/quizzes" element={<Navigate to="/admin?section=tests&type=Daily%20Quiz" replace />} />
              <Route path="/admin/mocks" element={<Navigate to="/admin?section=tests&type=Mock%20Test" replace />} />
              <Route path="/admin/mock-tests" element={<Navigate to="/admin?section=tests&type=Mock%20Test" replace />} />
              <Route path="/admin/materials" element={<Navigate to="/admin?section=materials" replace />} />
              <Route path="/admin/courses" element={<Navigate to="/admin?section=courses" replace />} />
              <Route path="/admin/flashcards" element={<Navigate to="/admin?section=flashcards" replace />} />
              <Route path="/admin/typing" element={<Navigate to="/admin?section=typing" replace />} />
              <Route path="/admin/affairs" element={<Navigate to="/admin?section=affairs" replace />} />
              <Route path="/admin/jobs" element={<Navigate to="/admin?section=jobs" replace />} />
              <Route path="/admin/banners" element={<Navigate to="/admin?section=banners" replace />} />
              <Route path="/admin/hb" element={<Navigate to="/admin?section=hb" replace />} />
              <Route path="/admin/homepage" element={<Navigate to="/admin?section=hb" replace />} />
              <Route path="/admin/notify" element={<Navigate to="/admin?section=notify" replace />} />
              <Route path="/admin/notifications" element={<Navigate to="/admin?section=notify" replace />} />
              <Route path="/admin/settings" element={<Navigate to="/admin?section=sitesettings" replace />} />
              <Route path="/admin/sitesettings" element={<Navigate to="/admin?section=sitesettings" replace />} />
              <Route path="/admin/setup" element={<Navigate to="/admin?section=setup" replace />} />
              <Route path="/admin/exams" element={<Navigate to="/admin?section=setup&tab=exams" replace />} />
              <Route path="/admin/subjects" element={<Navigate to="/admin?section=setup&tab=subjects" replace />} />
              <Route path="/admin/categories" element={<Navigate to="/admin?section=setup&tab=categories" replace />} />
              <Route path="/admin/students" element={<Navigate to="/admin?section=students" replace />} />
              <Route path="/admin/reports" element={<Navigate to="/admin?section=reports" replace />} />
              <Route path="/admin/logs" element={<Navigate to="/admin?section=logs" replace />} />
              <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
