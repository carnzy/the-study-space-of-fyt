# 🚀 冯羽彤的学习基地 — 部署指南 (Astro + Supabase + Cloudflare Pages)

## 技术栈

| 层面 | 选择 |
|------|------|
| 框架 | Astro 7 + React |
| 样式 | Tailwind CSS v4 |
| 数据库/认证/存储 | Supabase（免费） |
| 部署 | Cloudflare Pages（免费） |

---

## 一、创建 Supabase 项目

### 1. 注册并创建项目

1. 打开 https://supabase.com → Sign Up（用 GitHub 登录最方便）
2. 点击 **「New project」**
3. 填写：
   - Name: `study-site`
   - Database Password: 设置一个密码（记下来！）
   - Region: 选 **Northeast Asia (Tokyo)** 或最近的
4. 点击 **「Create project」**，等待约 2 分钟

### 2. 创建数据库表

项目创建好后 → 左侧菜单 **「SQL Editor」** → **「New query」**，粘贴以下 SQL 并执行：

```sql
-- 科目表
CREATE TABLE subjects (
  id SMALLSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO subjects (name, color, icon, sort_order) VALUES
  ('语文', '#e74c3c', '📖', 1),
  ('数学', '#3498db', '📐', 2),
  ('英语', '#2ecc71', '🌍', 3),
  ('物理', '#f39c12', '⚡', 4),
  ('化学', '#9b59b6', '🧪', 5),
  ('生物', '#1abc9c', '🧬', 6);

-- 帖子表
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 帖子-科目关联
CREATE TABLE post_subjects (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  subject_id SMALLINT REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, subject_id)
);

-- 图片表
CREATE TABLE images (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  storage_path TEXT NOT NULL,
  original_name TEXT,
  post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略（用户只能操作自己的数据）
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户操作自己的帖子" ON posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE post_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户操作自己的标签" ON post_subjects FOR ALL
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_subjects.post_id AND posts.user_id = auth.uid()));

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户操作自己的图片" ON images FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- subjects 表所有人可读
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可读科目" ON subjects FOR SELECT USING (true);
```

### 3. 创建存储桶

左侧菜单 → **「Storage」** → **「New bucket」**：
- Name: `images`
- 勾选 **「Public bucket」**
- 点击 **「Create」**

### 4. 获取 API 密钥

左侧菜单 → **「Settings」** → **「API」**：
- 复制 **Project URL**（类似 `https://xxxxx.supabase.co`）
- 复制 **anon public key**（以 `eyJ` 开头的长字符串）

---

## 二、配置环境变量

在项目根目录创建 `.env` 文件：

```env
PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
PUBLIC_SUPABASE_ANON_KEY=你的anon_key
```

---

## 三、部署到 Cloudflare Pages

### 1. 推送代码

```bash
git add .
git commit -m "Astro + Supabase 版本"
git push
```

### 2. Cloudflare Pages 设置

1. Cloudflare Dashboard → Workers & Pages → 选择你的项目
2. **Settings** → **Environment variables**，添加：
   - `PUBLIC_SUPABASE_URL` = 你的 Supabase URL
   - `PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key
3. **Build settings**：
   - Build command: `npm install && npm run build`
   - Build output directory: `dist`
4. 重新部署

### 3. 绑定域名

Pages 项目 → **Custom domains** → 添加你的域名

---

## 四、首次使用

1. 访问网站 → 点击 **「没有账号？注册一个」**
2. 输入邮箱 + 密码（至少6位）→ 注册
3. 自动登录 → 开始记录错题！

之后换设备只需用同一个邮箱+密码登录即可，数据自动同步。

---

## 五、本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:4321

---

> 📖 有任何问题随时找我！
