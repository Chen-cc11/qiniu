import React, { useState, FormEvent } from 'react';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 这是一个预先生成的，不会过期的JWT令牌。
      // Payload: { "userID": "demo-user" }
      // Secret: 'tsk_Y5Qx_Bkv4jrYJ3BcHBIQS7Qo0UPXFf1FhaeWGHtKwEu' (与后端auth.go中的密钥一致)
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJkZW1vLXVzZXIifQ.YAWAbB024CqDRg-m2oJ-k_PEb7z-Ny7xDDt13Jq2x0Q";
      
      // --- 终极诊断日志 (前端) ---
      // 这将在浏览器的控制台中打印出前端实际发送的令牌。
      console.log("[FRONTEND DEBUG] Token being sent:", mockToken);

      await new Promise(resolve => setTimeout(resolve, 500));
      onLoginSuccess(mockToken);

    } catch (err) {
      setError(err instanceof Error ? err.message : '模拟登录时发生未知错误。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4" style={{ background: 'linear-gradient(135deg, #f3f4f8 0%, #e5e7eb 100%)' }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">欢迎来到 ModelForge</h1>
        <p className="text-gray-600 mt-2">通过文本和图片生成令人惊叹的3D模型。</p>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">{isLogin ? '登 录' : '创建账户'}</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入任意邮箱"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入任意密码"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          {isLogin ? "还没有账户？" : '已经有账户了？'}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-medium text-orange-500 hover:text-orange-600 ml-1">
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;