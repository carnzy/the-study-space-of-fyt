import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Subject } from '../lib/types';
import MDEditor from '@uiw/react-md-editor';

const SUBJECTS: Subject[] = [
  { id: 1, name: '语文', color: '#e74c3c', icon: '📖', sort_order: 1 },
  { id: 2, name: '数学', color: '#3498db', icon: '📐', sort_order: 2 },
  { id: 3, name: '英语', color: '#2ecc71', icon: '🌍', sort_order: 3 },
  { id: 4, name: '物理', color: '#f39c12', icon: '⚡', sort_order: 4 },
  { id: 5, name: '化学', color: '#9b59b6', icon: '🧪', sort_order: 5 },
  { id: 6, name: '生物', color: '#1abc9c', icon: '🧬', sort_order: 6 },
];

export default function PostEditor({ editPostId }: { editPostId?: number }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 编辑模式：加载已有帖子
  useEffect(() => {
    if (!editPostId) return;
    (async () => {
      const { data: post } = await supabase.from('posts').select('*').eq('id', editPostId).single();
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setPostDate(post.post_date);
        const { data: ps } = await supabase.from('post_subjects').select('subject_id').eq('post_id', editPostId);
        setSelectedSubjects(ps?.map((p: any) => p.subject_id) || []);
      }
    })();
  }, [editPostId]);

  const toggleSubject = (id: number) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // 压缩图片
    const compressed = await compressImage(file);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage.from('images').upload(path, compressed);
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) { setMessage('请输入标题'); return; }
    setSaving(true);
    setMessage('');

    const payload = { title: title.trim(), content, post_date: postDate };

    try {
      if (editPostId) {
        await supabase.from('posts').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editPostId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('posts').insert({ ...payload, user_id: user!.id });
      }

      // 更新科目标签
      const postId = editPostId || (await supabase.from('posts').select('id').order('created_at', { ascending: false }).limit(1).single()).data?.id;
      if (postId) {
        await supabase.from('post_subjects').delete().eq('post_id', postId);
        if (selectedSubjects.length > 0) {
          await supabase.from('post_subjects').insert(
            selectedSubjects.map(sid => ({ post_id: postId, subject_id: sid }))
          );
        }
      }

      window.location.href = '/';
    } catch (err: any) {
      setMessage(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> 取消
        </a>
        <h2 className="text-lg font-bold">{editPostId ? '编辑错题' : '新增错题'}</h2>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {message && <p className={`text-sm mb-3 ${message.includes('失败') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="错题标题..." maxLength={200}
          className="w-full text-lg font-semibold border-0 border-b-2 border-slate-200 pb-2 outline-none focus:border-indigo-400 transition-colors" />

        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="text-slate-500">日期：</span>
          <input type="date" value={postDate} onChange={e => setPostDate(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-indigo-400" />
          <span className="text-slate-500 ml-2">科目：</span>
          <div className="flex gap-1.5 flex-wrap">
            {SUBJECTS.map(s => {
              const sel = selectedSubjects.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleSubject(s.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-colors"
                  style={{
                    borderColor: s.color,
                    color: sel ? '#fff' : s.color,
                    background: sel ? s.color : 'transparent',
                  }}>
                  {s.icon} {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div data-color-mode="light">
          <MDEditor value={content} onChange={v => setContent(v || '')} height={350}
            preview="edit"
            textareaProps={{ placeholder: '记录错题内容...支持 Markdown 格式' }}
          />
        </div>

        {/* 图片上传提示 */}
        <p className="text-xs text-slate-400">
          💡 拖拽图片到编辑器即可上传（会自动压缩）
        </p>
      </div>
    </div>
  );
}

/** Canvas 压缩图片 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const maxW = 800;
        if (width > maxW) { height = Math.round(height * (maxW / width)); width = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('压缩失败')), 'image/jpeg', 0.6);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
