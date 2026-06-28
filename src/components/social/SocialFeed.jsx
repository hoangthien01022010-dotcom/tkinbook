import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function SocialFeed() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me().catch(()=>null);
      const myProfile = (await base44.entities.UserProfile.filter(
        me? { user_id: me.id } : {}
      ))[0] || null;
      setProfile(myProfile);
      loadPosts();
    })();
  }, []);

  const loadPosts = async () => {
    const list = await base44.entities.Post.list('-created_at', 50);
    setPosts(list || []);
  };

  const createPost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await base44.entities.Post.create({
        author_id: profile?.user_id || 'guest',
        author_name: profile?.display_name || 'Khách',
        author_avatar: profile?.avatar_url || '',
        content: content.trim(),
        likes_count: 0,
      });
      setContent('');
      loadPosts();
    } finally { setLoading(false); }
  };

  const likePost = async (p) => {
    await base44.entities.Post.update(p.id, {
      likes_count: (p.likes_count || 0) + 1
    });
    loadPosts();
  };

  return (
    <div style={{maxWidth:600, margin:'0 auto', padding:16}}>
      <h2>Bảng tin</h2>
      <div style={{background:'#fff', padding:12, borderRadius:12, marginBottom:16, border:'1px solid #eee'}}>
        <textarea
          placeholder="Bạn đang nghĩ gì?"
          value={content}
          onChange={e=>setContent(e.target.value)}
          style={{width:'100%', minHeight:80, border:'none', outline:'none', resize:'vertical'}}
        />
        <div style={{textAlign:'right'}}>
          <button onClick={createPost} disabled={loading ||!content.trim()}>
            {loading? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </div>

      {posts.map(p => (
        <div key={p.id} style={{background:'#fff', padding:14, borderRadius:12, marginBottom:12, border:'1px solid #eee'}}>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <img src={p.author_avatar || 'https://i.pravatar.cc/40'}
              style={{width:40, height:40, borderRadius:'50%'}} />
            <div>
              <b>{p.author_name}</b>
              <div style={{fontSize:12, opacity:0.6}}>
                {new Date(p.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
          <p style={{whiteSpace:'pre-wrap'}}>{p.content}</p>
          {p.image_url && <img src={p.image_url} style={{width:'100%', borderRadius:8, marginTop:8}} />}
          <button onClick={()=>likePost(p)} style={{marginTop:8, fontSize:13}}>
            ❤️ {p.likes_count || 0}
          </button>
        </div>
      ))}
      {posts.length === 0 && <p style={{opacity:0.6}}>Chưa có bài nào, đăng bài đầu tiên đi!</p>}
    </div>
