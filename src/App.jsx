import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HmiPanel from './HmiPanel';
import ManagerDashboard from './ManagerDashboard';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-slate-900 text-white font-sans">
    <nav className="bg-slate-800 p-4 shadow-md flex gap-4 border-b border-blue-500 items-center">
      <h1 className="text-2xl font-bold text-blue-400 mr-8">Planta N2 - SMART 4.0</h1>
      <Link to="/" className="hover:text-blue-300 px-3 py-1 rounded transition-colors font-medium">IHM Operador</Link>
      <Link to="/dashboard" className="hover:text-blue-300 px-3 py-1 rounded transition-colors font-medium">Dashboard Gestor</Link>
    </nav>
    <main className="p-6">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HmiPanel />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;