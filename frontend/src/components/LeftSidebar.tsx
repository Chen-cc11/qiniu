import React from 'react';

const LeftSidebar: React.FC = () => {
    return (
        <aside className="w-[320px] bg-white p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">模型参数</h2>
            </div>
            
            <div className="flex-grow">
                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg" role="alert">
                    <div className="flex">
                        <div className="py-1">
                             <svg className="fill-current h-6 w-6 text-orange-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
                        </div>
                        <div>
                            <p className="font-bold text-sm">参数设置即将推出</p>
                            <p className="text-xs mt-1">
                                当前所有模型均采用最佳默认参数生成以确保质量。更多自定义选项，敬请期待！
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default LeftSidebar;
