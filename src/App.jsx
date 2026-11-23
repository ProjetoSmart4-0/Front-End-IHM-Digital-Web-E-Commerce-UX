import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate
} from 'react-router-dom';

// Telas do Grupo 4
import HmiPanel from './HmiPanel';
import ManagerDashboard from './ManagerDashboard';
import EcommerceStore from './pages/EcommerceStore';

// Tela provisória para os módulos dos outros grupos
import ModulePlaceholder from './pages/ModulePlaceholder';

function Layout({ children }) {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">

      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 shadow-sm">

        <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">

          {/* IDENTIDADE DO SISTEMA */}
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              N2
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Planta N2 - SMART 4.0
              </h1>

              <p className="text-xs text-slate-500">
                Sistema de Monitoramento Industrial
              </p>
            </div>

          </div>

          {/* MENU PRINCIPAL */}
          <div className="flex flex-wrap items-center gap-2">

            <NavLink to="/" end className={linkClass}>
              IHM Operador
            </NavLink>

            <NavLink to="/dashboard" className={linkClass}>
              Dashboard Gestor
            </NavLink>

            <NavLink to="/loja" className={linkClass}>
              E-Commerce
            </NavLink>

            <NavLink to="/telemetria" className={linkClass}>
              Grupo 1 - IoT
            </NavLink>

            <NavLink to="/robo" className={linkClass}>
              Grupo 2 - Robô
            </NavLink>

            <NavLink to="/mes" className={linkClass}>
              Grupo 3 - MES
            </NavLink>

            <NavLink to="/usuarios" className={linkClass}>
              Grupo 5 - Usuários
            </NavLink>

          </div>

        </nav>
      </header>

      {/* CONTEÚDO DAS PÁGINAS */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">

        {children}

      </main>

      {/* RODAPÉ */}
      <footer className="text-center text-xs text-slate-500 py-5">
        Planta N2 • SMART 4.0 • Frontend Web • Grupo 4
      </footer>

    </div>
  );
}

function App() {
  return (
    <Router>

      <Layout>

        <Routes>

          {/* GRUPO 4 - IHM DIGITAL */}
          <Route
            path="/"
            element={<HmiPanel />}
          />

          {/* GRUPO 4 - DASHBOARD DO GESTOR */}
          <Route
            path="/dashboard"
            element={
              <ManagerDashboard
                token={import.meta.env.VITE_API_TOKEN}
              />
            }
          />

          {/* GRUPO 4 - E-COMMERCE */}
          <Route
            path="/loja"
            element={<EcommerceStore />}
          />

          {/* GRUPO 1 - TELEMETRIA E CLP */}
          <Route
            path="/telemetria"
            element={
              <ModulePlaceholder
                title="Telemetria e Monitoramento do CLP"
                group="Grupo 1"
              />
            }
          />

          {/* GRUPO 2 - ROBÔ COLABORATIVO */}
          <Route
            path="/robo"
            element={
              <ModulePlaceholder
                title="Robô Colaborativo"
                group="Grupo 2"
              />
            }
          />

          {/* GRUPO 3 - MES E PRODUÇÃO */}
          <Route
            path="/mes"
            element={
              <ModulePlaceholder
                title="Produção e Rastreabilidade"
                group="Grupo 3"
              />
            }
          />

          {/* GRUPO 5 - USUÁRIOS E SEGURANÇA */}
          <Route
            path="/usuarios"
            element={
              <ModulePlaceholder
                title="Usuários e Permissões"
                group="Grupo 5"
              />
            }
          />

          {/* ROTA NÃO ENCONTRADA */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </Layout>

    </Router>
  );
}

export default App;
