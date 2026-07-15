import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || newPwd.length < 6) {
      setMessage('新密码至少6位'); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) setMessage(error.message);
    else { setMessage('✅ 密码修改成功'); setOldPwd(''); setNewPwd(''); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold mb-5">⚙️ 设置</h2>
      {user && <p className="text-sm text-slate-500 mb-4">当前账号：{user.email}</p>}

      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-slate-700">修改密码</label>
        <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)}
          placeholder="当前密码（首次修改留空）" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400" />
        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
          placeholder="新密码（至少6位）" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400" />
        <button onClick={handleChangePassword}
          className="w-full py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">修改密码</button>
      </div>

      {message && <p className={`text-sm mb-4 ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}

      <hr className="my-4 border-slate-200" />
      <button onClick={handleLogout}
        className="w-full py-2 border border-red-300 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50">退出登录</button>
    </div>
  );
}
