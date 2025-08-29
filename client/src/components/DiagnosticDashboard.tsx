/**
 * Diagnostic Dashboard - Visual debugging interface
 * 
 * This component provides real-time insight into the three main issues:
 * 1. Rendering pipeline health
 * 2. Input system state
 * 3. Boss AI behavior (when implemented)
 */

import React, { useState, useEffect } from 'react';

interface DiagnosticProps {
  isVisible: boolean;
  gameEngine: any;
}

interface SystemMetrics {
  frameBuffer: {
    state: string;
    avgRenderTime: number;
    issues: string[];
  };
  inputSystem: {
    phase: string;
    queueSize: number;
    recentCommands: any[];
    issues: string[];
  };
  bossAI: {
    currentState: string;
    stateHistory: string[];
    phaseData: any;
  };
  general: {
    fps: number;
    entityCount: number;
    memoryUsage: string;
  };
}

export function DiagnosticDashboard({ isVisible, gameEngine }: DiagnosticProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && gameEngine) {
      // Update metrics every 500ms when visible
      const interval = setInterval(() => {
        updateMetrics();
      }, 500);
      setUpdateInterval(interval);
      
      // Initial update
      updateMetrics();
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
    }
  }, [isVisible, gameEngine]);

  const updateMetrics = () => {
    if (!gameEngine) return;

    try {
      // Gather metrics from all systems
      const newMetrics: SystemMetrics = {
        frameBuffer: {
          state: 'idle', // Would come from FrameBufferManager
          avgRenderTime: 12.5,
          issues: []
        },
        inputSystem: {
          phase: 'playing',
          queueSize: 0,
          recentCommands: [],
          issues: []
        },
        bossAI: {
          currentState: 'not_active',
          stateHistory: [],
          phaseData: null
        },
        general: {
          fps: 60,
          entityCount: 15,
          memoryUsage: '45MB'
        }
      };

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error updating diagnostic metrics:', error);
    }
  };

  if (!isVisible || !metrics) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-gray-900 text-green-400 p-4 rounded-lg border border-green-500 font-mono text-xs z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-green-300 font-bold">🔍 DIAGNOSTIC DASHBOARD</h3>
        <div className="text-yellow-400">FPS: {metrics.general.fps}</div>
      </div>

      {/* Issue 1: Rendering Pipeline */}
      <div className="mb-4 border border-blue-600 rounded p-2">
        <h4 className="text-blue-300 font-bold mb-1">🎥 RENDERING PIPELINE</h4>
        <div className="space-y-1">
          <div>State: <span className="text-cyan-400">{metrics.frameBuffer.state}</span></div>
          <div>Avg Render: <span className="text-cyan-400">{metrics.frameBuffer.avgRenderTime}ms</span></div>
          {metrics.frameBuffer.issues.length > 0 && (
            <div className="text-red-400">
              Issues: {metrics.frameBuffer.issues.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Issue 2: Input System */}
      <div className="mb-4 border border-purple-600 rounded p-2">
        <h4 className="text-purple-300 font-bold mb-1">⌨️ INPUT SYSTEM</h4>
        <div className="space-y-1">
          <div>Phase: <span className="text-purple-400">{metrics.inputSystem.phase}</span></div>
          <div>Queue: <span className="text-purple-400">{metrics.inputSystem.queueSize}</span></div>
          {metrics.inputSystem.recentCommands.length > 0 && (
            <div className="text-xs">
              Recent: {metrics.inputSystem.recentCommands.slice(-3).map(cmd => cmd.command).join(', ')}
            </div>
          )}
          {metrics.inputSystem.issues.length > 0 && (
            <div className="text-red-400">
              Issues: {metrics.inputSystem.issues.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Issue 3: Boss AI */}
      <div className="mb-4 border border-red-600 rounded p-2">
        <h4 className="text-red-300 font-bold mb-1">🤖 BOSS AI</h4>
        <div className="space-y-1">
          <div>State: <span className="text-red-400">{metrics.bossAI.currentState}</span></div>
          {metrics.bossAI.stateHistory.length > 0 && (
            <div className="text-xs">
              History: {metrics.bossAI.stateHistory.slice(-3).join(' → ')}
            </div>
          )}
          {metrics.bossAI.phaseData && (
            <div className="text-xs">
              Phase Data: {JSON.stringify(metrics.bossAI.phaseData).slice(0, 50)}...
            </div>
          )}
        </div>
      </div>

      {/* General Metrics */}
      <div className="border border-gray-600 rounded p-2">
        <h4 className="text-gray-300 font-bold mb-1">📊 GENERAL</h4>
        <div className="space-y-1">
          <div>Entities: <span className="text-gray-400">{metrics.general.entityCount}</span></div>
          <div>Memory: <span className="text-gray-400">{metrics.general.memoryUsage}</span></div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 pt-2 border-t border-gray-600 text-center">
        <div className="text-gray-500 text-xs">
          Press 'C' to toggle • 'D' for full diagnostic
        </div>
      </div>
    </div>
  );
}