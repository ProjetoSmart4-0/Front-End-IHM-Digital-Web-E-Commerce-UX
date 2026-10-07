import React, { useState, useEffect, useRef } from 'react';
import { Activity, Power, AlertOctagon } from 'lucide-react'; 

export default function HmiPanel() {
  const [machineState, setMachineState] = useState('PARADA');
  const [isConnected, setIsConnected] = useState(false);
  
  
  const wsRef = useRef(null);

  useEffect(() => {
   
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    
    console.log(`Tentando conectar ao WebSocket em: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Conectado com sucesso!');
      setIsConnected(true);
    };

    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.machine_state) {
          setMachineState(data.machine_state);
        }
      } catch (error) {
        console.error('Erro ao ler dados da máquina:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Desconectado.');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
      setIsConnected(false);
    };

    
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  
  const sendCommand = (commandAction, stateLabel) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: commandAction }));
    } else {
      console.warn('Backend indisponível. Simulando comando localmente para validação da interface.');
    }
    
    setMachineState(stateLabel);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto mt-10 relative overflow-hidden">
      {/* Luz de Status de Conexão no Canto Superior */}
      <div className="absolute top-4 right-6 flex items-center gap-2 text-xs font-semibold">
        <span className="text-slate-400">Servidor MES:</span>
        {isConnected ? (
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE</span>
        ) : (
          <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> OFFLINE</span>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
        <Activity className="w-6 h-6 text-indigo-400" /> 
        IHM Siemens - Botoeira Virtual
      </h2>
      
      {/* Visor de Status da Máquina */}
      <div className="flex items-center justify-between bg-slate-950 p-6 rounded-xl border border-slate-800 mb-10 shadow-inner">
        <span className="text-lg text-slate-400 font-medium">Estado do CLP:</span>
        <span className={`text-2xl font-extrabold px-6 py-2 rounded-lg border tracking-wider transition-colors ${
          machineState === 'RODANDO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
          machineState === 'EMERGENCIA' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 
          'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {machineState}
        </span>
      </div>

      {/* Botões de Controle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button 
          onClick={() => sendCommand('cmd_start', 'RODANDO')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2">
          <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Power className="w-8 h-8 text-emerald-500" />
          <span className="text-emerald-500 tracking-widest uppercase text-sm">Start</span>
        </button>
        
        <button 
          onClick={() => sendCommand('cmd_stop', 'PARADA')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2">
          <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-6 h-6 bg-amber-500 rounded-sm"></div>
          <span className="text-amber-500 tracking-widest uppercase text-sm">Stop</span>
        </button>

        <button 
          onClick={() => sendCommand('cmd_emergency', 'EMERGENCIA')}
          className="group relative bg-slate-800 hover:bg-slate-700 text-white font-bold py-10 rounded-2xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden flex flex-col items-center justify-center gap-2">
          <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <AlertOctagon className="w-8 h-8 text-rose-500" />
          <span className="text-rose-500 tracking-widest uppercase text-sm">Emergência</span>
        </button>
      </div>
    </div>
  );
}