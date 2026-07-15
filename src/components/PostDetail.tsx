import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Post, Subject } from '../lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MDEditor from '@uiw/react-md-editor';

const SUBJECTS: Subject[] = [
  { id: 1, name: '语文', color: '#e74c3c', icon: '📖', sort_order: 1 },
  { id: 2, name: '数学', color: '#3498db', icon: '📐', sort_order: 2 },
  { id: 3, name: '英语', color: '#2ecc71', icon: '🌍', sort_order: 3 },
  { id: 4, name: '物理', color: '#f39c12', icon: '⚡', sort_order: 4 },
  { id: 5, name: '化学', color: '#9b59b6', icon: '🧪', sort_order: 5 },
  { id: 6, name: '生物', color: '#1abc9c', icon: '🧬', sort_order: 6 },
];

export default function PostDetail({ postId }: { postId: number }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSubjects, setEditSubjects] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (data) {
        const { data: ps } = await supabase.from('post_subjects')
          .select('subject_id, subjects!inner(id, name, color, icon)').eq('post_id', postId);
        const postData = { ...data, subjects: ps?.map((p: any) => p.subjects) || [] };
        setPost(postData);
        setEditTitle(data.title);
        setEditContent(data.content);
        setEditDate(data.post_date);
        setEditSubjects(ps?.map((p: any) => p.subject_id) || []);
      }
      setLoading(false);
    })();
  }, [postId]);

  const handleDelete = async () => {
    if (!confirm('确定删除这篇错题吗？')) return;
    await supabase.from('posts').delete().eq('id', postId);
    window.location.href = '/';
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    await supabase.from('posts').update({
      title: editTitle.trim(), content: editContent, post_date: editDate,
      updated_at: new Date().toISOString(),
    }).eq('id', postId);
    await supabase.from('post_subjects').delete().eq('post_id', postId);
    if (editSubjects.length > 0) {
      await supabase.from('post_subjects').insert(
        editSubjects.map(sid => ({ post_id: postId, subject_id: sid }))
      );
    }
    setEditing(false);
    setSaving(false);
    window.location.reload();
  };

  const toggleSubject = (id: number) => {
    setEditSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  if (loading) return <div className="text-center py-12 text-slate-400">加载中...</div>;
  if (!post) return <div className="text-center py-12 text-slate-400">帖子不存在</div>;

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> 取消
          </button>
          <h2 className="text-lg font-bold">编辑错题</h2>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4">
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="w-full text-lg font-semibold border-0 border-b-2 border-slate-200 pb-2 outline-none focus:border-indigo-400" />
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-slate-500">日期：</span>
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-indigo-400" />
            <span className="text-slate-500 ml-2">科目：</span>
            <div className="flex gap-1.5 flex-wrap">
              {SUBJECTS.map(s => {
                const sel = editSubjects.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleSubject(s.id)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-colors"
                    style={{ borderColor: s.color, color: sel ? '#fff' : s.color, background: sel ? s.color : 'transparent' }}>
                    {s.icon} {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div data-color-mode="light">
            <MDEditor value={editContent} onChange={v => setEditContent(v || '')} height={350} preview="edit" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> 返回
        </a>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50">编辑</button>
          <button onClick={handleDelete}
            className="px-3 py-1.5 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50">删除</button>
        </div>
      </div>

      <article className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-100">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-5 pb-4 border-b border-slate-100 flex-wrap">
          <span>📅 {post.post_date}</span>
          <span>🕐 {new Date(post.updated_at).toLocaleString('zh-CN')}</span>
          <div className="flex gap-1.5">
            {(post.subjects || []).map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${s.color}22`, color: s.color }}>{s.icon} {s.name}</span>
            ))}
          </div>
        </div>
        <div className="post-content prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
