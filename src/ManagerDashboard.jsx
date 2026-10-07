import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  Layers, 
  Plus, 
  FileText,
  ShieldCheck,
  Zap
} from 'lucide-react';

/**
 * Componente: ManagerDashboard (Dashboard do Gestor - MES & OEE)
 * Projeto Integrador: Aplicação Web - Humanity at the Interface of Industry 4.0
 * Grupo Responsável: Grupo 3 (MES & OEE) em parceria com Grupo 4 (Front-End)
 */
export default function ManagerDashboard({ token, apiBaseUrl = 'http://localhost:8000' }) {
  // Estados para métricas de OEE e telemetria
  const [oeeData, setOeeData] = useState({
    oee_percent: 85.5,
    availability_percent: 92.4,
    performance_percent: 94.1,
    quality_percent: 98.4,
    produced_units: 480,
    rejected_units: 8,
    operating_time_minutes: 277,
    planned_time_minutes: 300,
    last_update: '2026-09-24 14:00:00'
  });

  // Estado para Ordens de Produção (OPs)
  const [orders, setOrders] = useState([
    { id: 1, order_code: 'OP-2026-001', product_name: 'Bloco de Alumínio Usinado A1', target_qty: 500, produced_qty: 380, rejected_qty: 5, status: 'IN_PROGRESS', start_time: '08:00', est_completion: '16:30' },
    { id: 2, order_code: 'OP-2026-002', product_name: 'Eixo de Aço Polido E2', target_qty: 250, produced_qty: 0, rejected_qty: 0, status: 'PENDING', start_time: '17:00', est_completion: '21:00' },
    { id: 3, order_code: 'OP-2026-000', product_name: 'Suporte Plástico P4', target_qty: 1000, produced_qty: 1000, rejected_qty: 12, status: 'COMPLETED', start_time: 'Ontem', est_completion: 'Concluído' },
  ]);

  // Estado para Níveis de Estoque
  const [inventory, setInventory] = useState([
    { id: 1, item_name: 'Matéria-Prima: Bloco Bruto A1', qty: 150, min_threshold: 50, unit: 'unid', status: 'OK' },
    { id: 2, item_name: 'Matéria-Prima: Eixo Bruto E2', qty: 30, min_threshold: 40, unit: 'unid', status: 'LOW' },
    { id: 3, item_name: 'Expedição: Bloco Usinado OK', qty: 375, min_threshold: 0, unit: 'unid', status: 'OK' },
    { id: 4, item_name: 'Expedição: Peças Refugadas NOK', qty: 17, min_threshold: 0, unit: 'unid', status: 'WARN' },
  ]);

  // Histórico de OEE por hora (Simulação para Gráfico Visual)
  const hourlyOeeHistory = [
    { hour: '08:00', oee: 78.2, avail: 85, perf: 90, qual: 98 },
    { hour: '09:00', oee: 82.5, avail: 88, perf: 92, qual: 99 },
    { hour: '10:00', oee: 89.1, avail: 95, perf: 94, qual: 98 },
    { hour: '11:00', oee: 87.4, avail: 92, perf: 93, qual: 99 },
    { hour: '12:00', oee: 65.0, avail: 70, perf: 90, qual: 97 }, // Almoço / Troca de turno
    { hour: '13:00', oee: 88.0, avail: 94, perf: 95, qual: 98 },
    { hour: '14:00', oee: 85.5, avail: 92, perf: 94, qual: 98 },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('HOJE');

  // Função para buscar dados reais do Back-End
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Busca Métricas de OEE
      const resOee = await fetch(`${apiBaseUrl}/api/v1/mes/oee/dashboard`, { headers: authHeader });
      if (resOee.ok) {
        const data = await resOee.json();
        if (data.oee_percent) setOeeData(data);
      }

      // 2. Busca Ordens de Produção
      const resOrders = await fetch(`${apiBaseUrl}/api/v1/mes/orders`, { headers: authHeader });
      if (resOrders.ok) {
        const data = await resOrders.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (error) {
      console.warn('Usando dados simulados do Dashboard (API local offline ou inacessível):', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // Atualiza a cada 15 segundos
    return () => clearInterval(interval);
  }, [token]);

  // Função auxiliar para definir cor de status da OP
  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">EM EXECUÇÃO</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDENTE</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">CONCLUÍDA</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-400">CANCELADA</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Dashboard do Gestor MES & OEE</h1>
              <p className="text-sm text-slate-400">Monitoramento de Eficiência, Ordens de Produção e Estoque — Planta N2</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Período */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex gap-1">
            {['HOJE', 'TURNO A', 'SEMANA'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedTimeframe === tf 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cartões Principais do OEE (4 KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI 1: OEE Geral */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-indigo-950/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">OEE Global</span>
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Zap className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{oeeData.oee_percent}%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +2.1%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Meta Classe Mundial: &ge; 85.0%</p>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(oeeData.oee_percent, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Disponibilidade */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibilidade</span>
            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{oeeData.availability_percent}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tempo Operacional: <strong className="text-slate-200">{oeeData.operating_time_minutes} min</strong> / {oeeData.planned_time_minutes} min
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(oeeData.availability_percent, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Desempenho */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desempenho</span>
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{oeeData.performance_percent}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Velocidade Real vs Nominal do Robô UR
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(oeeData.performance_percent, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Qualidade */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qualidade</span>
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{oeeData.quality_percent}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Aprovadas: <strong className="text-emerald-400">{oeeData.produced_units}</strong> | Refugos: <strong className="text-rose-400">{oeeData.rejected_units}</strong>
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.min(oeeData.quality_percent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Painel Central: Gráfico de Tendência OEE + Tabela de Ordens de Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Coluna 1 e 2: Gráfico Visual do OEE por Hora */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> Histórico Horário de OEE
              </h2>
              <p className="text-xs text-slate-400">Evolução do rendimento percentual ao longo do turno</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> OEE
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Disp.
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Qual.
              </span>
            </div>
          </div>

          {/* Barras Personalizadas do Gráfico */}
          <div className="h-64 flex items-end justify-between gap-3 pt-8 px-2 border-b border-slate-800">
            {hourlyOeeHistory.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Barra OEE */}
                  <div 
                    className="w-full max-w-[18px] bg-indigo-500 hover:bg-indigo-400 rounded-t-sm transition-all duration-500 relative"
                    style={{ height: `${item.oee}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none z-10">
                      {item.oee}%
                    </div>
                  </div>
                  {/* Barra Disponibilidade */}
                  <div 
                    className="w-full max-w-[12px] bg-blue-500/60 rounded-t-sm transition-all duration-500 hidden sm:block"
                    style={{ height: `${item.avail}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
                  {item.hour}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-2">
            <span>Média do Turno: <strong className="text-white">83.4%</strong></span>
            <span>Meta de Produção: <strong className="text-emerald-400">100 pcs/h</strong></span>
          </div>
        </div>

        {/* Coluna 3: Níveis de Estoque & Refugos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" /> Gestor de Estoque
            </h2>
            <span className="text-xs text-slate-400">Alimentação / Expedição</span>
          </div>

          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{item.item_name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.status === 'LOW' 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : item.status === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.qty} {item.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      item.status === 'LOW' ? 'bg-rose-500' : item.status === 'WARN' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min((item.qty / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Relatório Completo de Insumos
          </button>
        </div>
      </div>

      {/* Tabela de Ordens de Produção (MES) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Gestão de Ordens de Produção (MES)
            </h2>
            <p className="text-xs text-slate-400">Acompanhamento do status e meta de fabricação das peças</p>
          </div>

          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30">
            <Plus className="w-4 h-4" /> Nova Ordem de Produção
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Código OP</th>
                <th className="py-3.5 px-4 font-semibold">Produto / Descrição</th>
                <th className="py-3.5 px-4 font-semibold">Progresso</th>
                <th className="py-3.5 px-4 font-semibold">Meta (OK / Nok)</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((op) => {
                const progressPct = Math.round((op.produced_qty / op.target_qty) * 100);
                return (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white font-mono">{op.order_code}</td>
                    <td className="py-4 px-4 font-medium text-slate-200">{op.product_name}</td>
                    <td className="py-4 px-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 min-w-[35px]">{progressPct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-white">{op.produced_qty}</span> / {op.target_qty}
                      <span className="text-xs text-rose-400 ml-2 font-medium">({op.rejected_qty} nok)</span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(op.status)}</td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {op.start_time} - {op.est_completion}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
