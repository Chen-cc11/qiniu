import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, useGLTF, Html, useProgress } from '@react-three/drei';

const Model: React.FC<{ url: string }> = ({ url }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

const Loader: React.FC = () => {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="text-white text-center">
                <div className="text-xl font-bold">{progress.toFixed(1)} %</div>
                <div className="text-sm">Loading model...</div>
            </div>
        </Html>
    );
};

const Placeholder: React.FC = () => {
    return (
        <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#333" wireframe />
        </mesh>
    );
};

const ModelViewer: React.FC<{ modelUrl: string | null }> = ({ modelUrl }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullScreen = () => {
        const element = containerRef.current;
        if (!element) return;
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    return (
        <div
            ref={containerRef}
            className="rounded-xl relative bg-gray-900 w-full h-full"
        >
             <Canvas className="w-full h-full" dpr={[1, 2]} camera={{ fov: 45 }}>
                <Suspense fallback={<Loader />}>
                    <Stage environment="city" intensity={0.6}>
                        {modelUrl ? <Model url={modelUrl} /> : <Placeholder />}
                    </Stage>
                </Suspense>
                <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-black/50 p-1.5 rounded-full">
                <button 
                    onClick={toggleFullScreen}
                    className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center hover:bg-gray-200"
                    aria-label="全屏切换"
                    title="全屏切换"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isFullscreen ? "M4 14.08V19a1 1 0 0 0 1 1h4.92M19 1H5a1 1 0 0 0-1 1v4.92m11.08 8.16L19 19m-5-14l5-5" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"} />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ModelViewer;
