// FIX: Reordered imports to place the side-effect import of '../types' at the very top.
// This ensures that global JSX type augmentations for custom elements like <model-viewer>
// are loaded before any other module, resolving TypeScript compilation errors.
import '../types';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import type { TaskStatus, ModelViewerElement, Model } from '../types';
import { ResetIcon, ZoomInIcon, ZoomOutIcon, SaveIcon, ExportIcon, FullScreenIcon, ExitFullScreenIcon, PlayIcon, PauseIcon, SpinnerIcon, TrashIcon } from './icons';

interface PreviewPanelProps {
  taskStatus: TaskStatus;
  displayedModel: Model;
  onSaveModel: (model: Model) => void;
  onDeleteModel: (model: Model) => void;
  isSaved: boolean;
}

const IconButton: React.FC<{ icon: React.ReactNode; onClick?: () => void, 'aria-label': string }> = ({ icon, onClick, 'aria-label': ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white hover:text-blue-500 transition-all duration-200 shadow">
        {icon}
    </button>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({ taskStatus, displayedModel, onSaveModel, onDeleteModel, isSaved }) => {
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
    onSaveModel(displayedModel);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = () => {
    onDeleteModel(displayedModel);
  };

  return (
    <div className="bg-white p-2 rounded-xl shadow-sm h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">模型预览</h2>
      <div ref={previewContainerRef} className="relative flex-grow bg-gray-100 rounded-lg overflow-hidden">
        {/* FIX: Using camelCase props for the custom element to align with React conventions. */}
        <model-viewer
          ref={modelViewerRef}
          src={displayedModel.url}
          poster={displayedModel.poster}
          alt="3D模型预览"
          autoRotate={isRotating}
          autoRotateDelay="0"
          cameraControls={true}
          shadowIntensity="0"
          cameraOrbit="0deg 75deg 105%"
          style={{ width: '100%', height: '100%' }}
        ></model-viewer>

        {['processing', 'unzipping'].includes(taskStatus.status) && (
           <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500 bg-gray-100/80 backdrop-blur-sm">
            <div className="text-center">
              <SpinnerIcon className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-2 text-sm font-medium">
                {taskStatus.status === 'unzipping' ? '正在解压模型...' : '模型生成中...'}
              </p>
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
          {isSaved ? (
            <button
                onClick={handleDelete}
                className="preview-button flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center transition-colors text-white bg-red-500 hover:bg-red-600"
            >
                <TrashIcon className="hover-icon h-5"/>
                <span>删除模型</span>
            </button>
          ) : (
            <button 
                onClick={handleSave}
                className={`preview-button flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center transition-colors
                    text-white bg-blue-500 hover:bg-blue-600
                    ${saveSuccess ? '!bg-green-500 !cursor-not-allowed' : ''}
                `}
                disabled={saveSuccess}
            >
                {saveSuccess ? (
                    <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>保存成功!</span>
                    </>
                ) : (
                    <>
                        <SaveIcon className="hover-icon h-5"/>
                        <span>保存模型</span>
                    </>
                )}
            </button>
          )}
          <a
              href={displayedModel.url}
              download="generated_model.glb"
              aria-disabled={false}
              className="preview-button flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center transition-colors text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
              <ExportIcon className="hover-icon h-5"/>
              <span>导出文件</span>
          </a>
      </div>
    </div>
  );
};

export default PreviewPanel;