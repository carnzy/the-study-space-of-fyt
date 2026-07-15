import type { Post } from '../lib/types';

export default function PostCard({ post }: { post: Post }) {
  return (
    <a href={`/posts/detail?id=${post.id}`} className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
      <h3 className="font-semibold text-slate-800 mb-2">{post.title}</h3>
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span>📅 {post.post_date}</span>
        <div className="flex gap-1.5 flex-wrap">
          {(post.subjects || []).map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${s.color}22`, color: s.color }}>
              {s.icon} {s.name}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
