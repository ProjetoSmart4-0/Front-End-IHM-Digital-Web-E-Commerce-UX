import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
  Layers,
  Plus,
  FileText,
  Zap,
  X,
  Activity,
  AlertTriangle,
  Gauge,
  Factory,
  Wifi,
  WifiOff,
  CalendarDays,
  Boxes,
} from "lucide-react";

// ======================================================
// CONFIGURAÇÃO
// ======================================================

const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA !== "false";

// Caminho do proxy Vercel.
// Deve corresponder às rotas configuradas no vercel.json.
const MES_BASE = "/api/mes/v1/mes";

const INITIAL_OEE = {
  oee_percent: 85.5,
  availability_percent: 92.4,
  performance_percent: 94.1,
  quality_percent: 98.4,
  produced_units: 480,
  rejected_units: 8,
  operating_time_minutes: 277,
  planned_time_minutes: 300,
  ppm: 1250,
  ppm_target: 1000,
  last_update: "Dados demonstrativos",
};

const INITIAL_ORDERS = [
  {
    id: 1,
    order_code: "OP-2026-001",
    product_name: "Bloco de Alumínio Usinado A1",
    target_qty: 500,
    produced_qty: 380,
    rejected_qty: 5,
    status: "IN_PROGRESS",
    start_time: "08:00",
    est_completion: "16:30",
  },
  {
    id: 2,
    order_code: "OP-2026-002",
    product_name: "Eixo de Aço Polido E2",
    target_qty: 250,
    produced_qty: 0,
    rejected_qty: 0,
    status: "PENDING",
    start_time: "17:00",
    est_completion: "21:00",
  },
  {
    id: 3,
    order_code: "OP-2026-000",
    product_name: "Suporte Plástico P4",
    target_qty: 1000,
    produced_qty: 1000,
    rejected_qty: 12,
    status: "COMPLETED",
    start_time: "Ontem",
    est_completion: "Concluído",
  },
];

const INITIAL_INVENTORY = [
  {
    id: 1,
    item_name: "Matéria-Prima: Bloco Bruto A1",
    qty: 150,
    min_threshold: 50,
    unit: "unid",
    status: "OK",
  },
  {
    id: 2,
    item_name: "Matéria-Prima: Eixo Bruto E2",
    qty: 30,
    min_threshold: 40,
    unit: "unid",
    status: "LOW",
  },
  {
    id: 3,
    item_name: "Expedição: Bloco Usinado OK",
    qty: 375,
    min_threshold: 0,
    unit: "unid",
    status: "OK",
  },
  {
    id: 4,
    item_name: "Expedição: Peças Refugadas NOK",
    qty: 17,
    min_threshold: 0,
    unit: "unid",
    status: "WARN",
  },
];

const INITIAL_HISTORY = [
  { hour: "08:00", oee: 78.2, availability: 85 },
  { hour: "09:00", oee: 82.5, availability: 88 },
  { hour: "10:00", oee: 89.1, availability: 95 },
  { hour: "11:00", oee: 87.4, availability: 92 },
  { hour: "12:00", oee: 65.0, availability: 70 },
  { hour: "13:00", oee: 88.0, availability: 94 },
  { hour: "14:00", oee: 85.5, availability: 92 },
];

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(
    Number(value) || 0
  );
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

function calculateOEE(data) {
  const availability =
    Number(data.availability_percent) || 0;

  const performance =
    Number(data.performance_percent) || 0;

  const quality =
    Number(data.quality_percent) || 0;

  return (
    (availability * performance * quality) / 10000
  );
}

function getCurrentHour() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProgress(produced, target) {
  if (!Number(target)) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      (Number(produced) / Number(target)) * 100
    )
  );
}

function getNextOrderCode(orders) {
  const year = new Date().getFullYear();

  const nextNumber =
    orders.reduce((max, order) => {
      const match = String(
        order.order_code || ""
      ).match(/(\d+)$/);

      return match
        ? Math.max(max, Number(match[1]))
        : max;
    }, 0) + 1;

  return `OP-${year}-${String(nextNumber).padStart(3, "0")}`;
}

// ======================================================
// COMPONENTE: CABEÇALHO DE SEÇÃO
// ======================================================

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <Icon className="h-5 w-5 text-blue-600" />
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

// ======================================================
// COMPONENTE: CARD DE INDICADOR
// ======================================================

function MetricCard({
  title,
  value,
  suffix = "%",
  description,
  icon: Icon,
  color = "blue",
}) {
  const colors = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
    },
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div
          className={`rounded-xl p-3 ${colors[color].icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>

        {suffix && (
          <span className="text-sm font-semibold text-slate-500">
            {suffix}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </article>
  );
}

// ======================================================
// COMPONENTE: MEDIDOR PPM
// ======================================================

function PpmGauge({ value, target }) {
  const safeValue = Math.max(
    0,
    Number(value) || 0
  );

  const safeTarget = Math.max(
    1,
    Number(target) || 1
  );

  const max = Math.max(
    safeTarget * 2,
    safeValue,
    1
  );

  const progress = Math.min(
    safeValue / max,
    1
  );

  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference * (1 - progress);

  const withinTarget =
    safeValue <= safeTarget;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg
          viewBox="0 0 120 120"
          className="-rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="11"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={
              withinTarget
                ? "#10b981"
                : "#f59e0b"
            }
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">
            {formatNumber(safeValue)}
          </span>

          <span className="text-xs text-slate-400">
            PPM
          </span>
        </div>
      </div>

      <span
        className={`mt-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
          withinTarget
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {withinTarget
          ? "Dentro da meta"
          : "Acima da meta"}
      </span>

      <p className="mt-2 text-xs text-slate-400">
        Meta: {formatNumber(safeTarget)} PPM
      </p>
    </div>
  );
}

// ======================================================
// COMPONENTE: GRÁFICO DE HISTÓRICO
// ======================================================

function HistoryChart({ history }) {
  if (!history.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhum dado histórico disponível.
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-64 items-end justify-between gap-3 border-b border-slate-200 px-2">
        {history.map((item, index) => (
          <div
            key={`${item.hour}-${index}`}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="relative w-full max-w-8 rounded-t-md bg-blue-600 transition hover:bg-blue-500"
                style={{
                  height: `${Math.max(
                    0,
                    Math.min(100, Number(item.oee) || 0)
                  )}%`,
                }}
                title={`OEE: ${formatPercent(item.oee)}`}
              />

              <div
                className="hidden w-full max-w-5 rounded-t-md bg-sky-300 transition hover:bg-sky-400 sm:block"
                style={{
                  height: `${Math.max(
                    0,
                    Math.min(
                      100,
                      Number(item.availability) || 0
                    )
                  )}%`,
                }}
                title={`Disponibilidade: ${formatPercent(
                  item.availability
                )}`}
              />
            </div>

            <span className="text-[11px] text-slate-500">
              {item.hour}
            </span>

            <span className="text-[10px] font-semibold text-blue-600">
              {formatPercent(item.oee)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
          OEE
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
          Disponibilidade
        </span>
      </div>
    </div>
  );
}

// ======================================================
// COMPONENTE: STATUS DA OP
// ======================================================

function OrderStatus({ status }) {
  const styles = {
    IN_PROGRESS:
      "bg-blue-50 text-blue-700 border-blue-200",

    PENDING:
      "bg-amber-50 text-amber-700 border-amber-200",

    COMPLETED:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    CANCELLED:
      "bg-rose-50 text-rose-700 border-rose-200",
  };

  const labels = {
    IN_PROGRESS: "EM EXECUÇÃO",
    PENDING: "PENDENTE",
    COMPLETED: "CONCLUÍDA",
    CANCELLED: "CANCELADA",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {labels[status] || status || "INDEFINIDO"}
    </span>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function ManagerDashboard({ token }) {
  const [oeeData, setOeeData] = useState(INITIAL_OEE);

  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const [inventory] = useState(INITIAL_INVENTORY);

  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [isLoading, setIsLoading] = useState(false);

  const [apiConnected, setApiConnected] = useState(false);

  const [sseConnected, setSseConnected] = useState(false);

  const [selectedTimeframe, setSelectedTimeframe] =
    useState("HOJE");

  const [lastUpdate, setLastUpdate] =
    useState(new Date());

  const [showOrderForm, setShowOrderForm] =
    useState(false);

  const [formLoading, setFormLoading] =
    useState(false);

  const [message, setMessage] = useState("");

  const [newOrder, setNewOrder] = useState({
    product_name: "",
    target_qty: "",
    start_time: "",
    est_completion: "",
  });

  const [error, setError] = useState("");

  // ----------------------------------------------------
  // CÁLCULO DO OEE
  // ----------------------------------------------------

  const oee = useMemo(
    () => calculateOEE(oeeData),
    [oeeData]
  );

  const refreshMockData = useCallback(() => {
    setOeeData((previous) => {
      const next = {
        ...previous,

        availability_percent: Math.min(
          99,
          Math.max(
            85,
            previous.availability_percent +
              (Math.random() - 0.5) * 1.2
          )
        ),

        performance_percent: Math.min(
          99,
          Math.max(
            80,
            previous.performance_percent +
              (Math.random() - 0.5) * 1.5
          )
        ),

        quality_percent: Math.min(
          100,
          Math.max(
            94,
            previous.quality_percent +
              (Math.random() - 0.5) * 0.4
          )
        ),

        ppm: Math.max(
          500,
          previous.ppm +
            Math.round((Math.random() - 0.5) * 80)
        ),

        produced_units:
          previous.produced_units +
          Math.round(Math.random() * 3),
      };

      next.oee_percent = Number(
        calculateOEE(next).toFixed(1)
      );

      next.last_update = getCurrentHour();

      return next;
    });

    setHistory((previous) => {
      const last = previous[previous.length - 1];

      const nextOee = Math.min(
        100,
        Math.max(
          0,
          (last?.oee ?? 85) +
            (Math.random() - 0.5) * 3
        )
      );

      const nextAvailability = Math.min(
        100,
        Math.max(
          0,
          (last?.availability ?? 92) +
            (Math.random() - 0.5) * 3
        )
      );

      return [
        ...previous.slice(1),
        {
          hour: getCurrentHour(),
          oee: Number(nextOee.toFixed(1)),
          availability: Number(
            nextAvailability.toFixed(1)
          ),
        },
      ];
    });

    setLastUpdate(new Date());
  }, []);

  // ----------------------------------------------------
  // BUSCAR DADOS DO BACKEND
  // ----------------------------------------------------

  const fetchDashboardData = useCallback(async () => {
    if (USE_MOCK_DATA) {
  setApiConnected(false);
  refreshMockData();
  return;
}
    setIsLoading(true);
    setError("");

    const headers = {
      Accept: "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };

    try {
      const [oeeResponse, ordersResponse] =
        await Promise.all([
          fetch(
            `${MES_BASE}/oee/dashboard`,
            { headers }
          ),

          fetch(
            `${MES_BASE}/orders`,
            { headers }
          ),
        ]);

      if (
        !oeeResponse.ok ||
        !ordersResponse.ok
      ) {
        throw new Error(
          "Não foi possível consultar a API MES."
        );
      }

      const oeeResult = await oeeResponse.json();

      const ordersResult =
        await ordersResponse.json();

      setOeeData((previous) => ({
        ...previous,
        ...oeeResult,
      }));

      const receivedOrders =
        Array.isArray(ordersResult)
          ? ordersResult
          : ordersResult.orders;

      if (Array.isArray(receivedOrders)) {
        setOrders(receivedOrders);
      }

      setApiConnected(true);
      setLastUpdate(new Date());
    } catch (err) {
      setApiConnected(false);

      setError(
        err instanceof Error
          ? err.message
          : "Falha ao conectar ao serviço MES."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, refreshMockData]);

  // ----------------------------------------------------
  // ATUALIZAÇÃO AUTOMÁTICA
  // ----------------------------------------------------


  useEffect(() => {
    if (USE_MOCK_DATA) {
      setApiConnected(false);
      setSseConnected(false);

      const timer = setInterval(() => {
        refreshMockData();
      }, 5000);

      return () => clearInterval(timer);
    }

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshMockData]);

  // ----------------------------------------------------
  // RECEBER EVENTOS SSE
  // ----------------------------------------------------

  useEffect(() => {
    if (USE_MOCK_DATA) return;

    const eventUrl = new URL(
      "/api/mes/events",
      window.location.origin
    );

    // EventSource nativo não permite Authorization
    // customizado. O backend deve aceitar token na query.
    if (token) {
      eventUrl.searchParams.set("token", token);
    }

    const source = new EventSource(
      eventUrl.toString()
    );

    source.onopen = () => {
      setSseConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "dashboard_updated" &&
          data.metrics
        ) {
          setOeeData((previous) => ({
            ...previous,
            ...data.metrics,
          }));

          if (Array.isArray(data.history)) {
            setHistory(data.history);
          }

          setLastUpdate(new Date());
        }

        if (
          data.type === "order_updated" &&
          data.order
        ) {
          setOrders((previous) => {
            const exists = previous.some(
              (order) =>
                order.id === data.order.id ||
                order.order_code ===
                  data.order.order_code
            );

            if (!exists) {
              return [...previous, data.order];
            }

            return previous.map((order) =>
              order.id === data.order.id ||
              order.order_code ===
                data.order.order_code
                ? {
                    ...order,
                    ...data.order,
                  }
                : order
            );
          });
        }

        setLastUpdate(new Date());
      } catch {
        setError(
          "Não foi possível interpretar um evento recebido."
        );
      }
    };

    source.onerror = () => {
      setSseConnected(false);
      // EventSource tenta reconectar automaticamente.
    };

    return () => {
      source.close();
      setSseConnected(false);
    };
  }, [token]);

  // ----------------------------------------------------
  // FORMULÁRIO DE ORDEM DE PRODUÇÃO
  // ----------------------------------------------------

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setNewOrder((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();

    const quantity = Number(
      newOrder.target_qty
    );

    if (!newOrder.product_name.trim()) {
      setMessage(
        "Informe o nome do produto."
      );
      return;
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      setMessage(
        "A quantidade deve ser um número inteiro positivo."
      );
      return;
    }

    setFormLoading(true);
    setMessage("");

    const orderPayload = {
      order_code: getNextOrderCode(orders),

      product_name:
        newOrder.product_name.trim(),

      target_qty: quantity,

      produced_qty: 0,

      rejected_qty: 0,

      status: "PENDING",

      start_time:
        newOrder.start_time || "--:--",

      est_completion:
        newOrder.est_completion || "--:--",
    };

    try {
      if (USE_MOCK_DATA) {
        setOrders((previous) => [
          ...previous,

          {
            ...orderPayload,
            id: Date.now(),
          },
        ]);

        setMessage(
          "Ordem adicionada em modo demonstração. Ela existe apenas nesta sessão."
        );
      } else {
        const response = await fetch(
          `${MES_BASE}/orders`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            body: JSON.stringify(orderPayload),
          }
        );

        if (!response.ok) {
          throw new Error(
            "A API não aceitou o cadastro da ordem."
          );
        }

        const result = await response.json();

        const savedOrder = {
          ...orderPayload,
          ...result,
        };

        setOrders((previous) => [
          ...previous,
          savedOrder,
        ]);

        setApiConnected(true);

        setLastUpdate(new Date());

        setMessage(
          "Ordem cadastrada no backend com sucesso!"
        );
      }

      setNewOrder({
        product_name: "",
        target_qty: "",
        start_time: "",
        est_completion: "",
      });
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar a ordem."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ----------------------------------------------------
  // INFORMAÇÕES CALCULADAS
  // ----------------------------------------------------

  const activeOrders = orders.filter(
    (order) =>
      order.status === "IN_PROGRESS"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      order.status === "COMPLETED"
  ).length;

  const lowStockItems = inventory.filter(
    (item) =>
      item.qty < item.min_threshold
  ).length;

  const ppmValue =
    Number(oeeData.ppm) || 0;

  const ppmTarget =
    Number(oeeData.ppm_target) || 1000;

  // Filtro demonstrativo:
  // Turno A mostra os quatro primeiros registros.
  // Hoje e Semana mostram todo o histórico disponível.
  const filteredHistory = useMemo(() => {
    if (selectedTimeframe === "TURNO A") {
      return history.slice(0, 4);
    }

    return history;
  }, [history, selectedTimeframe]);

  // ----------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* CABEÇALHO */}

        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
              <Factory className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Industrial Operations · Grupo 4
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Dashboard Gerencial MES & OEE
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitoramento de eficiência, produção e estoque · Planta N2
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                USE_MOCK_DATA
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : apiConnected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {USE_MOCK_DATA ? (
                <Activity className="h-4 w-4" />
              ) : apiConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}

              {USE_MOCK_DATA
                ? "DADOS SIMULADOS"
                : apiConnected
                  ? "API ONLINE"
                  : "API OFFLINE"}
            </span>

            {!USE_MOCK_DATA && (
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                SSE:{" "}
                {sseConnected
                  ? "Conectado"
                  : "Desconectado"}
              </span>
            )}

            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoading
                    ? "animate-spin"
                    : ""
                }`}
              />

              {isLoading
                ? "Atualizando..."
                : "Atualizar"}
            </button>
          </div>
        </header>

        {/* MENSAGENS DE INTEGRAÇÃO */}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* FILTROS */}

        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            Período de análise
          </div>

          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {[
              "HOJE",
              "TURNO A",
              "SEMANA",
            ].map((timeframe) => (
              <button
                type="button"
                key={timeframe}
                onClick={() =>
                  setSelectedTimeframe(timeframe)
                }
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  selectedTimeframe === timeframe
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </section>

        {/* OEE GLOBAL */}

        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-lg shadow-blue-100 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                <Zap className="h-4 w-4" />
                OVERALL EQUIPMENT EFFECTIVENESS
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                  {formatPercent(oee)}
                </span>
              </div>

              <p className="mt-2 text-sm text-blue-100">
                Eficiência Global do Equipamento
              </p>

              <p className="mt-4 text-xs text-blue-100">
                Referência de demonstração: meta de 85%
              </p>
            </div>

            <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-5 md:max-w-xs">
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">
                  Produção realizada
                </span>

                <span className="font-bold">
                  {formatNumber(
                    oeeData.produced_units
                  )}{" "}
                  un.
                </span>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-blue-100">
                  Produtos refugados
                </span>

                <span className="font-bold">
                  {formatNumber(
                    oeeData.rejected_units
                  )}{" "}
                  un.
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-950/30">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      oeeData.produced_units / 10
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-blue-100">
                Produção acumulada demonstrativa
              </p>
            </div>
          </div>
        </section>

        {/* INDICADORES */}

        <section>
          <SectionTitle
            icon={Gauge}
            title="Indicadores de eficiência"
            subtitle="Composição dos indicadores do OEE"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Disponibilidade"
              value={formatPercent(
                oeeData.availability_percent
              )}
              description="Tempo operacional em relação ao planejado"
              icon={Clock}
              color="blue"
            />

            <MetricCard
              title="Desempenho"
              value={formatPercent(
                oeeData.performance_percent
              )}
              description="Velocidade real versus velocidade nominal"
              icon={TrendingUp}
              color="amber"
            />

            <MetricCard
              title="Qualidade"
              value={formatPercent(
                oeeData.quality_percent
              )}
              description="Proporção de produtos aprovados"
              icon={CheckCircle2}
              color="green"
            />

            <MetricCard
              title="Produção"
              value={formatNumber(
                oeeData.produced_units
              )}
              suffix="un."
              description="Unidades produzidas no período"
              icon={Boxes}
              color="violet"
            />
          </div>
        </section>

        {/* GRÁFICO E PPM */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
            <SectionTitle
              icon={BarChart3}
              title="Histórico horário de OEE"
              subtitle={`Evolução do rendimento · ${selectedTimeframe}`}
            />

            <HistoryChart
              history={filteredHistory}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={Activity}
              title="Monitoramento PPM"
              subtitle="Peças defeituosas por milhão"
            />

            <PpmGauge
              value={ppmValue}
              target={ppmTarget}
            />

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Valor atual
                </span>

                <strong className="text-slate-800">
                  {formatNumber(ppmValue)}
                </strong>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Meta
                </span>

                <strong className="text-slate-800">
                  {formatNumber(ppmTarget)}
                </strong>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">
                Neste indicador, valores menores representam menos defeitos.
                Os valores apresentados são demonstrativos.
              </p>
            </div>
          </div>
        </section>

        {/* RESUMO DE PRODUÇÃO */}

        <section>
          <SectionTitle
            icon={Layers}
            title="Resumo da produção"
            subtitle="Situação atual das ordens de fabricação"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">
                Ordens em execução
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-900">
                {activeOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">
                Ordens concluídas
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {completedOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">
                Alertas de estoque
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-900">
                {lowStockItems}
              </p>
            </div>
          </div>
        </section>

        {/* ESTOQUE */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={Package}
            title="Gestão de estoque"
            subtitle="Acompanhamento de matéria-prima e produtos"
            action={
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {inventory.length} itens
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inventory.map((item) => {
              const isLow =
                item.qty < item.min_threshold;

              const isWarning =
                item.status === "WARN";

              const color = isLow
                ? "bg-rose-500"
                : isWarning
                  ? "bg-amber-500"
                  : "bg-emerald-500";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-slate-500 shadow-sm">
                        <Package className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.item_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Mínimo:{" "}
                          {formatNumber(
                            item.min_threshold
                          )}{" "}
                          {item.unit}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${
                        isLow
                          ? "bg-rose-100 text-rose-700"
                          : isWarning
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isLow
                        ? "ESTOQUE BAIXO"
                        : isWarning
                          ? "ATENÇÃO"
                          : "NORMAL"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Quantidade
                    </span>

                    <strong className="text-slate-800">
                      {formatNumber(item.qty)}{" "}
                      {item.unit}
                    </strong>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{
                        width: `${Math.min(
                          100,
                          (item.qty /
                            Math.max(
                              item.min_threshold * 2,
                              200
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            Imprimir relatório de estoque
          </button>
        </section>

        {/* ORDENS DE PRODUÇÃO */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Layers className="h-5 w-5 text-blue-600" />
                Ordens de produção
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Acompanhamento das metas de fabricação
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setShowOrderForm(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nova ordem de produção
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Código OP
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Produto
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Progresso
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Produção / Meta
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Refugos
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Horário
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const progress = getProgress(
                    order.produced_qty,
                    order.target_qty
                  );

                  return (
                    <tr
                      key={
                        order.id ??
                        order.order_code
                      }
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-700">
                        {order.order_code}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {order.product_name}
                      </td>

                      <td className="min-w-40 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-semibold text-slate-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <strong className="text-slate-800">
                          {formatNumber(
                            order.produced_qty
                          )}
                        </strong>

                        {" / "}

                        {formatNumber(
                          order.target_qty
                        )}
                      </td>

                      <td className="px-5 py-4 font-medium text-rose-600">
                        {formatNumber(
                          order.rejected_qty
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <OrderStatus
                          status={order.status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {order.start_time} –{" "}
                        {order.est_completion}
                      </td>
                    </tr>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Nenhuma ordem de produção cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* RODAPÉ */}

        <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
          <span>
            Grupo 4 · Front-End Web, IHM Digital e UX
          </span>

          <span>
            Última atualização:{" "}
            {lastUpdate.toLocaleTimeString("pt-BR")}
          </span>

          <span>
            {USE_MOCK_DATA
              ? "Ambiente de demonstração"
              : "Integração com MES"}
          </span>
        </footer>
      </div>

      {/* MODAL DE NOVA OP */}

      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nova ordem de produção
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Preencha os dados para cadastrar uma OP.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowOrderForm(false);
                  setMessage("");
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar formulário"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateOrder}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="product_name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nome do produto *
                </label>

                <input
                  id="product_name"
                  type="text"
                  name="product_name"
                  value={newOrder.product_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex.: Bloco de Alumínio A1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="target_qty"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Quantidade desejada *
                </label>

                <input
                  id="target_qty"
                  type="number"
                  name="target_qty"
                  value={newOrder.target_qty}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                  placeholder="Ex.: 500"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="start_time"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Início previsto
                  </label>

                  <input
                    id="start_time"
                    type="time"
                    name="start_time"
                    value={newOrder.start_time}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="est_completion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Término previsto
                  </label>

                  <input
                    id="est_completion"
                    type="time"
                    name="est_completion"
                    value={newOrder.est_completion}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {message && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                  {message}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderForm(false);
                    setMessage("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading
                    ? "Salvando..."
                    : "Cadastrar OP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}