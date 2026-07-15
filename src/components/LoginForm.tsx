import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setError('✅ 注册成功！请登录');
        setIsRegister(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 md:p-10 w-full max-w-sm shadow-2xl text-center">
      <div className="text-5xl mb-3">📚</div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">冯羽彤的学习基地</h1>
      <p className="text-sm text-slate-500 mb-6">{isRegister ? '创建账号' : '登录以继续'}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-left">
          <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="至少6位" required minLength={6}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        {error && <p className={`text-sm ${error.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
        </button>
      </form>

      <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
        className="mt-4 text-sm text-indigo-500 hover:underline"
      >
        {isRegister ? '已有账号？去登录' : '没有账号？注册一个'}
      </button>

      <p className="mt-6 text-xs text-slate-400">📖 记录每一次进步</p>
    </div>
  );
}
