import React, { useState, FormEvent } from 'react';
import { SpinnerIcon, UserIcon, LockIcon, LogoIcon } from '../components/icons';

const API_BASE_URL = 'http://localhost:8080';

interface AuthPageProps {
  onLoginSuccess: (token: string) => void;
}


const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
  };

  const validateForm = (): boolean => {
    if (!email.trim() || !password.trim()) {
        setError("邮箱和密码不能为空。");
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setError("请输入有效的邮箱地址。");
        return false;
    }
    if (!isLoginView && password.trim().length < 6) {
        setError("密码不能少于六位。");
        return false;
    }
    return true;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发生未知错误');
      }

      if (isLoginView) {
        onLoginSuccess(data.token);
      } else {
        setSuccessMessage('注册成功！请登录。');
        setIsLoginView(true);
        setPassword('');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '请求失败';
      const lowerCaseError = errorMessage.toLowerCase();
      
      if (lowerCaseError.includes('unique constraint failed')) {
        setError('该邮箱已被注册。');
      } else if (lowerCaseError.includes('invalid credentials')) {
        setError('邮箱或密码错误。');
      } else if (lowerCaseError.includes('user not found') || lowerCaseError.includes('account not found')) {
        setError('该账户不存在，请检查邮箱地址或先注册。');
      } else if (lowerCaseError.includes('password must be at least')) {
        setError('密码不能少于六位。');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-5 gap-8 items-center">
        
        {/* Left Panel: Form */}
        <div className="lg:col-span-2 animate-fade-in">
            <div className="mb-8 flex items-center space-x-3">
                <LogoIcon className="h-10 w-10 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-800">ModelCraft Pro</h1>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {isLoginView ? '欢迎回来' : '创建您的账户'}
            </h2>
            <p className="text-gray-600 mb-8">
                {isLoginView ? '登录以继续您的创世之旅。' : '只需片刻即可开始。'}
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm" role="alert">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
                <UserIcon className="absolute left-3 bottom-3 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <LockIcon className="absolute left-3 bottom-3 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold text-white bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <SpinnerIcon className="w-6 h-6 animate-spin" />
                ) : (
                  isLoginView ? '登录' : '注册'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              {isLoginView ? '还没有账户？' : '已有账户？'}
              <button onClick={handleToggleView} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline ml-1 transition-colors">
                {isLoginView ? '立即注册' : '立即登录'}
              </button>
            </p>
        </div>
        

      </div>
    </div>
  );
};

export default AuthPage;