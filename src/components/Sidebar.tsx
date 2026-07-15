import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Subject } from '../lib/types';

export default function Sidebar() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subjects').select('*').order('sort_order');
      if (data) {
        // 获取每个科目的帖子数
        const withCounts = await Promise.all(data.map(async (s: Subject) => {
          const { count } = await supabase.from('post_subjects')
            .select('*', { count: 'exact', head: true }).eq('subject_id', s.id);
          return { ...s, post_count: count || 0 };
        }));
        setSubjects(withCounts);
      }
      setLoading(false);
    })();
  }, []);

  const allCount = subjects.reduce((sum, s) => sum + (s.post_count || 0), 0);

  if (loading) return <div class="text-sm text-slate-400">加载中...</div>;

  return (
    <nav className="space-y-1">
      <a href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
        <span>📋</span> 全部错题
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allCount}</span>
      </a>
      {subjects.map(s => (
        <a key={s.id} href={`/?subject=${s.id}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }}></span>
          {s.icon} {s.name}
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{s.post_count || 0}</span>
        </a>
      ))}
    </nav>
  );
}
