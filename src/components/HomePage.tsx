import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Post, Subject, PostListResponse } from '../lib/types';
import PostCard from './PostCard';
import Calendar from './Calendar';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 读取 URL 参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('subject');
    if (s) setFilterSubject(parseInt(s));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('posts').select('*', { count: 'exact' });

    if (filterSubject) {
      query = query.filter('id', 'in',
        `(select post_id from post_subjects where subject_id=${filterSubject})`
      );
    }
    if (filterDate) {
      query = query.eq('post_date', filterDate);
    }

    const from = (page - 1) * 20;
    const to = from + 19;
    const { data, count, error } = await query
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      // 获取每篇帖子的科目
      const postIds = data.map(p => p.id);
      const { data: psData } = await supabase
        .from('post_subjects')
        .select('post_id, subject_id, subjects!inner(id, name, color, icon)')
        .in('post_id', postIds);

      const subjectMap: Record<number, Subject[]> = {};
      psData?.forEach((ps: any) => {
        if (!subjectMap[ps.post_id]) subjectMap[ps.post_id] = [];
        subjectMap[ps.post_id].push(ps.subjects);
      });

      setPosts(data.map(p => ({ ...p, subjects: subjectMap[p.id] || [] })));
      setTotalPages(Math.max(1, Math.ceil((count || 0) / 20)));
    }
    setLoading(false);
  }, [filterSubject, filterDate, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase.from('posts').select('*')
      .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .order('post_date', { ascending: false }).limit(30);
    if (data) setPosts(data.map(p => ({ ...p, subjects: [] })));
  };

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {filterSubject ? subjects.find(s => s.id === filterSubject)?.icon + ' ' + subjects.find(s => s.id === filterSubject)?.name :
           filterDate ? `📅 ${filterDate} 的错题` :
           '📝 全部错题'}
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 outline-none w-32 md:w-48"
            />
            <svg className="absolute left-2 top-2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 帖子列表 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin w-8 h-8 border-3 border-slate-200 border-t-indigo-500 rounded-full mx-auto mb-3"></div>
          加载中...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-sm">还没有错题记录</p>
          <a href="/posts/new" className="inline-block mt-4 px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">
            记录第一道错题
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-slate-50">上一页</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-slate-50">下一页</button>
        </div>
      )}
    </div>
  );
}
