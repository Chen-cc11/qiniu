import React, { useRef, useCallback, useState, useEffect } from 'react';
// 修复：从集中的类型文件导入ModelViewerElement，而不是在本地定义。
import type { TaskStatus, ModelViewerElement } from '../types';
import { ResetIcon, ZoomInIcon, ZoomOutIcon, SaveIcon, ExportIcon, FullScreenIcon, ExitFullScreenIcon, PlayIcon, PauseIcon } from './icons';

// 修复：移除了<model-viewer>的本地类型定义，因为它们现在已集中在`types.ts`中
// 以确保整个应用的一致性和类型安全。

interface PreviewPanelProps {
  taskStatus: TaskStatus;
}

const IconButton: React.FC<{ icon: React.ReactNode; onClick?: () => void, 'aria-label': string }> = ({ icon, onClick, 'aria-label': ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white hover:text-blue-500 transition-all duration-200 shadow">
        {icon}
    </button>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({ taskStatus }) => {
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(true);


  const handleFullScreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [handleFullScreenChange]);

  const handleToggleFullscreen = useCallback(() => {
    if (!previewContainerRef.current) return;

    if (!isFullscreen) {
      previewContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);
  

  const handleReset = useCallback(() => {
    const mv = modelViewerRef.current;
    if (mv) {
      mv.cameraOrbit = '0deg 75deg 105%';
    }
  }, []);

  const handleZoom = useCallback((factor: number) => {
    const mv = modelViewerRef.current;
    if (mv && mv.cameraOrbit) {
      const [theta, phi, radiusStr] = mv.cameraOrbit.split(' ');
      const radius = parseFloat(radiusStr);
      if (isNaN(radius)) return;
      const unit = radiusStr.replace(/[\d.-]/g, '') || 'm'; // 获取单位（'m', '%' 等）或默认为 'm'
      const newRadius = Math.max(0.1, radius * factor);
      mv.cameraOrbit = `${theta} ${phi} ${newRadius}${unit}`;
    }
  }, []);

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">模型预览</h2>
      <div ref={previewContainerRef} className="relative flex-grow bg-gray-100 rounded-lg overflow-hidden">
        {taskStatus.status === 'completed' ? (
          <model-viewer
            ref={modelViewerRef}
            src={taskStatus.model.url}
            poster={taskStatus.model.poster}
            alt="Generated 3D Model"
            auto-rotate={isRotating}
            auto-rotate-delay="0"
            camera-controls
            shadow-intensity="0"
            camera-orbit="0deg 75deg 105%"
            style={{ width: '100%', height: '100%' }}
          ></model-viewer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25c-5.376 0-9.75 4.374-9.75 9.75s4.374 9.75 9.75 9.75 9.75-4.374 9.75-9.75S17.376 2.25 12 2.25zm0 1.5a8.25 8.25 0 110 16.5 8.25 8.25 0 010-16.5z" opacity=".2"></path><path d="M12 6a1.5 1.5 0 011.5 1.5v3.75a.75.75 0 001.5 0V7.5a3 3 0 00-3-3H7.5a.75.75 0 000 1.5h3.75a.75.75 0 01.75.75z"></path></svg>
              <p className="mt-2 text-sm font-medium">
                {taskStatus.status === 'processing' ? '模型生成中...' : '待生成模型'}
              </p>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <IconButton icon={isFullscreen ? <ExitFullScreenIcon className="w-5 h-5" /> : <FullScreenIcon className="w-5 h-5" />} onClick={handleToggleFullscreen} aria-label={isFullscreen ? '退出全屏' : '进入全屏'}/>
          <IconButton icon={isRotating ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />} onClick={() => setIsRotating(!isRotating)} aria-label={isRotating ? '暂停旋转' : '开始旋转'} />
          <IconButton icon={<ResetIcon className="w-5 h-5" />} onClick={handleReset} aria-label="Reset view"/>
          <IconButton icon={<ZoomInIcon className="w-5 h-5" />} onClick={() => handleZoom(0.9)} aria-label="Zoom in"/>
          <IconButton icon={<ZoomOutIcon className="w-5 h-5" />} onClick={() => handleZoom(1.1)} aria-label="Zoom out"/>
        </div>
      </div>
      <div className="p-4 flex space-x-3">
        <button className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50" disabled={taskStatus.status !== 'completed'}>
            <SaveIcon className="w-5 h-5"/>
            <span>保存模型</span>
        </button>
        <button className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50" disabled={taskStatus.status !== 'completed'}>
            <ExportIcon className="w-5 h-5"/>
            <span>导出文件</span>
        </button>
      </div>
    </div>
  );
};

export default PreviewPanel;