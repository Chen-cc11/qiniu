// To resolve the 'model-viewer' JSX error, the module containing the global type
// augmentations must be imported for its side effects *before* React is imported.
// FIX: Reordered imports to ensure '../types' is imported before React.
import '../types';
// 修复：从集中的类型文件导入ModelViewerElement，而不是在本地定义。
import type { TaskStatus, ModelViewerElement, Model } from '../types';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ResetIcon, ZoomInIcon, ZoomOutIcon, SaveIcon, ExportIcon, FullScreenIcon, ExitFullScreenIcon, PlayIcon, PauseIcon, SpinnerIcon } from './icons';

// 修复：<model-viewer>自定义元素的类型定义，包括其JSX内置元素声明，
// 已经集中在'types.ts'中。这确保了整个应用的类型安全和一致性。

interface PreviewPanelProps {
  taskStatus: TaskStatus;
  displayedModel: Model;
  onSaveModel: (model: Model) => void;
}

const IconButton: React.FC<{ icon: React.ReactNode; onClick?: () => void, 'aria-label': string }> = ({ icon, onClick, 'aria-label': ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white hover:text-blue-500 transition-all duration-200 shadow">
        {icon}
    </button>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({ taskStatus, displayedModel, onSaveModel }) => {
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 当模型改变时，重置保存成功状态
  useEffect(() => {
    setSaveSuccess(false);
  }, [displayedModel]);

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
        console.error(`尝试进入全屏模式时出错: ${err.message} (${err.name})`);
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

  const handleSave = () => {
    if (!displayedModel.isLocal) {
        onSaveModel(displayedModel);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">模型预览</h2>
      <div ref={previewContainerRef} className="relative flex-grow bg-gray-100 rounded-lg overflow-hidden">
        <model-viewer
          ref={modelViewerRef}
          src={displayedModel.url}
          poster={displayedModel.poster}
          alt="3D模型预览"
          auto-rotate={isRotating}
          auto-rotate-delay="0"
          camera-controls
          shadow-intensity="0"
          camera-orbit="0deg 75deg 105%"
          style={{ width: '100%', height: '100%' }}
        ></model-viewer>

        {taskStatus.status === 'processing' && (
           <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500 bg-gray-100/80 backdrop-blur-sm">
            <div className="text-center">
              <SpinnerIcon className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-2 text-sm font-medium">模型生成中...</p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <IconButton icon={isFullscreen ? <ExitFullScreenIcon className="w-5 h-5" /> : <FullScreenIcon className="w-5 h-5" />} onClick={handleToggleFullscreen} aria-label={isFullscreen ? '退出全屏' : '进入全屏'}/>
          <IconButton icon={isRotating ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />} onClick={() => setIsRotating(!isRotating)} aria-label={isRotating ? '暂停旋转' : '开始旋转'} />
          <IconButton icon={<ResetIcon className="w-5 h-5" />} onClick={handleReset} aria-label="重置视图"/>
          <IconButton icon={<ZoomInIcon className="w-5 h-5" />} onClick={() => handleZoom(0.9)} aria-label="放大"/>
          <IconButton icon={<ZoomOutIcon className="w-5 h-5" />} onClick={() => handleZoom(1.1)} aria-label="缩小"/>
        </div>
      </div>
      <div className="p-4 flex space-x-3">
          {!displayedModel.isLocal && (
              <button 
                  onClick={handleSave}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors
                      text-white bg-blue-500 hover:bg-blue-600
                      ${saveSuccess ? '!bg-green-500 !cursor-not-allowed' : ''}
                  `}
                  disabled={saveSuccess}
              >
                  {saveSuccess ? (
                      <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span>保存成功!</span>
                      </>
                  ) : (
                      <>
                          <SaveIcon className="w-5 h-5"/>
                          <span>保存模型</span>
                      </>
                  )}
              </button>
          )}
          <a
              href={displayedModel.url}
              download="generated_model.glb"
              aria-disabled={false}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors text-gray-700 bg-gray-100 hover:bg-gray-200`}
          >
              <ExportIcon className="w-5 h-5"/>
              <span>导出文件</span>
          </a>
      </div>
    </div>
  );
};

export default PreviewPanel;
