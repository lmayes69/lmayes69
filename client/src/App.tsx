import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Chores from './pages/Chores';
import Kids from './pages/Kids';
import Rewards from './pages/Rewards';
import Shopping from './pages/Shopping';
import MealPlanner from './pages/MealPlanner';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="chores" element={<Chores />} />
          <Route path="kids" element={<Kids />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="shopping" element={<Shopping />} />
          <Route path="meals" element={<MealPlanner />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
