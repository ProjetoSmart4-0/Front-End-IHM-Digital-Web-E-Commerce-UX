
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Power,
  AlertOctagon,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
const RECONNECT_INITIAL_DELAY = 1000;
const RECONNECT_MAX_DELAY = 32000;

export default function HmiPanel() {
  const [machineState, setMachineState] = useState('DESCONHECIDO');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(
    'Aguardando comunicação com o servidor MES...'
  );
  const [lastUpdate, setLastUpdate] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(RECONNECT_INITIAL_DELAY);
  const mountedRef = useRef(false);
const getWebSocketUrl = useCallback(() => {
  const configuredUrl =
    import.meta.env.VITE_WS_URL || '/api/iot/ws/telemetry';

  const url = new URL(
    configuredUrl,
    window.location.origin
  );

  if (url.protocol === 'http:') {
    url.protocol = 'ws:';
  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:';
  }

  const token = import.meta.env.VITE_WS_TOKEN;

  if (token) {
    url.searchParams.set('token', token);
  }

  return url.toString();
}, []);

  // Reconexão automática
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || reconnectTimerRef.current) return;

    const delay = reconnectDelayRef.current;

    setConnectionStatus('offline');

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;

      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        RECONNECT_MAX_DELAY
      );

      connectWebSocket();
    }, delay);

  }, []);

  // Conectar ao servidor MES
  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current) return;

    if (
      wsRef.current &&
      (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    setConnectionStatus('connecting');
    setLastMessage('Tentando conectar ao servidor MES...');

    let socket;

    try {
      socket = new WebSocket(getWebSocketUrl());
      wsRef.current = socket;

    } catch (error) {
      console.error('Erro ao criar WebSocket:', error);

      setLastMessage('Não foi possível iniciar a conexão.');

      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      if (!mountedRef.current || wsRef.current !== socket) return;

      console.log('WebSocket conectado.');

      reconnectDelayRef.current = RECONNECT_INITIAL_DELAY;

      setConnectionStatus('online');
      setLastMessage('Comunicação com o servidor estabelecida.');
    };

    // Receber telemetria
    socket.onmessage = (event) => {
      if (!mountedRef.current || wsRef.current !== socket) return;

      try {
        const data = JSON.parse(event.data);

        const receivedState =
          data.machine_state ??
          data.state ??
          data.status;

        if (typeof receivedState === 'string') {
          const normalizedState = receivedState
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();

          const validStates = [
            'RODANDO',
            'PARADA',
            'EMERGENCIA',
            'MANUTENCAO',
            'DESCONHECIDO'
          ];

          if (validStates.includes(normalizedState)) {
            setMachineState(normalizedState);
          }
        }

        setLastUpdate(
          new Date().toLocaleTimeString('pt-BR')
        );

        setLastMessage('Telemetria recebida com sucesso.');

      } catch (error) {
        console.error('Erro ao interpretar mensagem:', error);

        setLastMessage('Mensagem recebida em formato inválido.');
      }
    };

    // Conexão encerrada
    
socket.onclose = (event) => {
  if (!mountedRef.current || wsRef.current !== socket) return;

  wsRef.current = null;

  setConnectionStatus('offline');

  if (event.code === 4001) {
    setLastMessage(
      'Acesso negado: token inválido (4001). Verifique a autenticação.'
    );
    return;
  }

  setLastMessage(
    'Conexão perdida. Tentando reconectar...'
  );

  scheduleReconnect();
};


    // Erro de comunicação
    socket.onerror = (error) => {
      console.error('Erro no WebSocket:', error);

      if (mountedRef.current && wsRef.current === socket) {
        setConnectionStatus('offline');
        setLastMessage('Falha na comunicação com o servidor.');
      }
    };

  }, [getWebSocketUrl, scheduleReconnect]);

  // Inicialização e limpeza
  useEffect(() => {
    mountedRef.current = true;

    connectWebSocket();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        const socket = wsRef.current;

        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }

        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Enviar comandos para o Backend
  const sendCommand = (command) => {
    if (command === 'cmd_emergency') {
  const firstConfirmation = window.confirm(
    'ATENÇÃO: Você está solicitando uma PARADA DE EMERGÊNCIA. Deseja continuar?'
  );

  if (!firstConfirmation) return;

  const secondConfirmation = window.confirm(
    'CONFIRMAÇÃO FINAL: Confirma o envio do comando de emergência? A emergência física sempre prevalece.'
  );

  if (!secondConfirmation) return;
}
    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setLastMessage(
        'Comando não enviado: servidor MES desconectado.'
      );
      return;
    }

    try {
      const payload = {
        action: command,
        timestamp: new Date().toISOString()
      };

      socket.send(JSON.stringify(payload));

      setLastMessage(
        `Comando ${command} enviado. Aguardando confirmação do CLP.`
      );

    } catch (error) {
      console.error('Erro ao enviar comando:', error);

      setLastMessage('Não foi possível enviar o comando.');
    }
  };

  // Indicadores de conexão
  const statusConfig = {
    online: {
      label: 'ONLINE',
      color: 'text-emerald-400',
      dot: 'bg-emerald-500',
      icon: Wifi
    },
    offline: {
      label: 'OFFLINE',
      color: 'text-rose-400',
      dot: 'bg-rose-500',
      icon: WifiOff
    },
    connecting: {
      label: 'CONECTANDO',
      color: 'text-amber-400',
      dot: 'bg-amber-500',
      icon: RefreshCw
    }
  };

  const connection = statusConfig[connectionStatus];
  const ConnectionIcon = connection.icon;

  // Normalizar estado da máquina
  const normalizedMachineState = machineState
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const stateStyle =
    normalizedMachineState === 'RODANDO'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : normalizedMachineState === 'EMERGENCIA'
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
        : normalizedMachineState === 'PARADA'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-slate-500/10 text-slate-300 border-slate-500/30';

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto mt-10 relative overflow-hidden">

      {/* STATUS DO SERVIDOR */}
      <div className="absolute top-4 right-6 flex items-center gap-2 text-xs font-semibold">

        <span className="text-slate-400">
          Servidor MES:
        </span>

        <span className={`flex items-center gap-1 ${connection.color}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${connection.dot} ${
            connectionStatus === 'online' ? 'animate-pulse' : ''
          }`} />

          {connection.label}
        </span>

      </div>

      {/* TÍTULO */}
      <h2 className="text-2xl font-bold mb-8 mt-5 text-white flex items-center gap-3">

        <Activity className="w-6 h-6 text-indigo-400" />

        IHM Siemens - Botoeira Virtual

      </h2>

      {/* ESTADO DA MÁQUINA */}
      <div className="flex items-center justify-between gap-4 bg-slate-950 p-6 rounded-xl border border-slate-800 mb-5 shadow-inner">

        <span className="text-lg text-slate-400 font-medium">
          Estado do CLP:
        </span>

        <span className={`text-xl sm:text-2xl font-extrabold px-6 py-2 rounded-lg border tracking-wider ${stateStyle}`}>
          {machineState}
        </span>

      </div>

      {/* INFORMAÇÕES DA COMUNICAÇÃO */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-8">

        <div className="flex items-start gap-3">

          <ConnectionIcon className={`w-5 h-5 mt-0.5 ${connection.color}`} />

          <div className="flex-1">

            <p className="text-sm text-slate-300">
              {lastMessage}
            </p>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">

              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Última telemetria: {lastUpdate || 'Nenhuma'}
              </span>

              <span>
                Protocolo: WebSocket
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* BOTOEIRA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* START */}
        <button
          type="button"
          onClick={() => sendCommand('cmd_start')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2"
        >

          <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <Power className="w-8 h-8 text-emerald-500 relative" />

          <span className="text-emerald-500 tracking-widest uppercase text-sm relative">
            Start
          </span>

        </button>

        {/* STOP */}
        <button
          type="button"
          onClick={() => sendCommand('cmd_stop')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2"
        >

          <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="w-6 h-6 bg-amber-500 rounded-sm relative" />

          <span className="text-amber-500 tracking-widest uppercase text-sm relative">
            Stop
          </span>

        </button>

        {/* EMERGÊNCIA */}
        <button
          type="button"
          onClick={() => sendCommand('cmd_emergency')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2"
        >

          <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <AlertOctagon className="w-8 h-8 text-rose-500 relative" />

          <span className="text-rose-500 tracking-widest uppercase text-sm relative">
            Emergência
          </span>

        </button>

      </div>

      {/* AVISO DE SEGURANÇA */}
      <p className="text-xs text-slate-500 mt-6 text-center">
        Interface de supervisão e demonstração. Os comandos dependem
        do Backend e da autorização do sistema de controle.
        Não substitui a botoeira física de emergência.
      </p>

    </div>
  );
}
