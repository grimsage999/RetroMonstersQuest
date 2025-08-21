import React, { useEffect, useState, useRef } from 'react';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  drawCalls: number;
  entityCount: number;
}

export const PerformanceMonitor: React.FC<{ gameEngine: any }> = ({ gameEngine }) => {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    drawCalls: 0,
    entityCount: 0
  });
  
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  
  useEffect(() => {
    const updateStats = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      // Calculate FPS
      frameTimesRef.current.push(deltaTime);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }
      
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = 1000 / avgFrameTime;
      
      // Get memory usage if available
      let memoryUsed = 0;
      if ('memory' in performance) {
        memoryUsed = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
      }
      
      // Get entity counts from game engine
      const entityCount = gameEngine ? gameEngine.getEntityCount() : 0;
      const drawCalls = gameEngine ? gameEngine.getDrawCallCount() : 0;
      
      setStats({
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        memoryUsed: Math.round(memoryUsed * 100) / 100,
        drawCalls,
        entityCount
      });
      
      requestAnimationFrame(updateStats);
    };
    
    const animationId = requestAnimationFrame(updateStats);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameEngine]);
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px',
      borderRadius: '5px',
      minWidth: '200px',
      zIndex: 1000
    }}>
      <div>FPS: {stats.fps}</div>
      <div>Frame Time: {stats.frameTime}ms</div>
      {stats.memoryUsed > 0 && <div>Memory: {stats.memoryUsed}MB</div>}
      <div>Entities: {stats.entityCount}</div>
      <div>Draw Calls: {stats.drawCalls}</div>
    </div>
  );
};

export default PerformanceMonitor;