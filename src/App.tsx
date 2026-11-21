import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExamsPage } from './pages/ExamsPage';
import { TestsPage } from './pages/TestsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { CoursesPage } from './pages/CoursesPage';
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
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
