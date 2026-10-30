import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import db, { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ==========================================
// 1. HEALTH & FILE UPLOAD
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HomeSpace Family Backend',
    database: 'SQLite (WAL mode)',
    timestamp: Date.now(),
  });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพที่อัปโหลด' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

// ==========================================
// 2. MEMBERS & AUTH
// ==========================================
app.get('/api/members', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY createdAt ASC').all();
    
    // Compute total score for each member from chore_history & posts
    const scoreMap = {};
    const histScores = db.prepare('SELECT memberId, SUM(points) as total FROM chore_history GROUP BY memberId').all();
    histScores.forEach(r => { scoreMap[r.memberId] = r.total || 0; });

    const enrichedMembers = members.map(m => ({
      ...m,
      score: scoreMap[m.id] || 0,
    }));

    res.json(enrichedMembers);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const member = db.prepare('SELECT * FROM members WHERE phone = ?').get(cleanPhone);

    if (member) {
      res.json({ success: true, member });
    } else {
      res.json({ notFound: true, phone: cleanPhone });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { phone, name, role, avatar, avatarType, avatarImage } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: 'เบอร์โทรศัพท์และชื่อไม่สามารถเว้นว่างได้' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const existing = db.prepare('SELECT * FROM members WHERE phone = ?').get(cleanPhone);

    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE members 
        SET name = ?, role = ?, avatar = ?, avatarType = ?, avatarImage = ?
        WHERE phone = ?
      `).run(
        name.trim(),
        role ? role.trim() : 'สมาชิกในบ้าน',
        avatar || '😊',
        avatarType || 'emoji',
        avatarImage || null,
        cleanPhone
      );
      const updated = db.prepare('SELECT * FROM members WHERE phone = ?').get(cleanPhone);
      return res.json({ success: true, member: updated });
    }

    // Insert new member
    const newId = `member-${Date.now()}`;
    const colors = ['#5F8D75', '#E88D67', '#7BA7C2', '#C49B6F', '#9381FF', '#F15BB5'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    db.prepare(`
      INSERT INTO members (id, phone, name, role, avatar, avatarType, avatarImage, color, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      cleanPhone,
      name.trim(),
      role ? role.trim() : 'สมาชิกในบ้าน',
      avatar || '😊',
      avatarType || 'emoji',
      avatarImage || null,
      color,
      Date.now()
    );

    const created = db.prepare('SELECT * FROM members WHERE id = ?').get(newId);
    res.json({ success: true, member: created });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Register failed' });
  }
});

app.put('/api/members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, avatar, avatarType, avatarImage } = req.body;

    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Member not found' });
    }

    db.prepare(`
      UPDATE members 
      SET name = ?, role = ?, avatar = ?, avatarType = ?, avatarImage = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      role !== undefined ? role.trim() : existing.role,
      avatar !== undefined ? avatar : existing.avatar,
      avatarType !== undefined ? avatarType : existing.avatarType,
      avatarImage !== undefined ? avatarImage : existing.avatarImage,
      id
    );

    const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    res.json({ success: true, member: updated });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Update member failed' });
  }
});

// ==========================================
// 3. POSTS, LIKES & COMMENTS
// ==========================================
app.get('/api/posts', (req, res) => {
  try {
    const { currentMemberId } = req.query;
    const posts = db.prepare('SELECT * FROM posts ORDER BY timestamp DESC').all();
    const comments = db.prepare('SELECT * FROM comments ORDER BY timestamp ASC').all();
    const likes = db.prepare('SELECT * FROM post_likes').all();

    // Group comments by postId
    const commentMap = {};
    for (const c of comments) {
      if (!commentMap[c.postId]) commentMap[c.postId] = [];
      commentMap[c.postId].push(c);
    }

    // Group likes by postId
    const likesMap = {};
    for (const l of likes) {
      if (!likesMap[l.postId]) likesMap[l.postId] = new Set();
      likesMap[l.postId].add(l.memberId);
    }

    const enrichedPosts = posts.map(post => {
      const postComments = commentMap[post.id] || [];
      const likedSet = likesMap[post.id] || new Set();
      return {
        ...post,
        comments: postComments,
        likes: likedSet.size > 0 ? likedSet.size : post.likes,
        isLiked: currentMemberId ? likedSet.has(currentMemberId) : false,
      };
    });

    res.json(enrichedPosts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts/chore', (req, res) => {
  try {
    const {
      memberId,
      choreName,
      choreEmoji,
      points = 25,
      praise = 'สะอาดเรียบร้อยดีมาก! ✨',
      praiseEmoji = '✨',
      beforeImage,
      afterImage,
      imageUrl,
      caption,
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    const postId = `chore-${Date.now()}`;
    const timestamp = Date.now();
    const finalImage = afterImage || imageUrl || null;

    const tx = db.transaction(() => {
      // Insert post
      db.prepare(`
        INSERT INTO posts (id, type, memberId, caption, choreName, choreEmoji, points, praise, praiseEmoji, beforeImage, afterImage, imageUrl, likes, timestamp)
        VALUES (?, 'chore', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        postId,
        memberId,
        caption || null,
        choreName || 'งานบ้าน',
        choreEmoji || '🧹',
        points,
        praise,
        praiseEmoji,
        beforeImage || null,
        afterImage || null,
        finalImage,
        timestamp
      );

      // Insert into chore_history for live scores, charts, and MVP ranking
      const histId = `hist-${timestamp}-${memberId}`;
      const dateStr = new Date(timestamp).toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO chore_history (id, memberId, choreName, choreEmoji, points, praise, praiseEmoji, date, timestamp, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        histId,
        memberId,
        choreName || 'งานบ้าน',
        choreEmoji || '🧹',
        points,
        praise,
        praiseEmoji,
        dateStr,
        timestamp,
        finalImage
      );
    });

    tx();

    const created = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    res.json({
      success: true,
      post: { ...created, comments: [], likes: 0, isLiked: false },
    });
  } catch (err) {
    console.error('Error creating chore post:', err);
    res.status(500).json({ error: 'Failed to create chore post' });
  }
});

app.post('/api/posts/routine', (req, res) => {
  try {
    const {
      memberId,
      caption,
      photo,
      points = 25,
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    const postId = `routine-${Date.now()}`;
    const timestamp = Date.now();

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO posts (id, type, memberId, caption, photo, points, likes, timestamp)
        VALUES (?, 'routine', ?, ?, ?, ?, 0, ?)
      `).run(
        postId,
        memberId,
        caption || 'แชร์เรื่องราวดี ๆ ร่วมกับทุกคนในบ้าน 💖',
        photo || null,
        points,
        timestamp
      );

      // Also record points in chore_history
      const histId = `hist-${timestamp}-${memberId}`;
      const dateStr = new Date(timestamp).toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO chore_history (id, memberId, choreName, choreEmoji, points, praise, praiseEmoji, date, timestamp, imageUrl)
        VALUES (?, ?, 'เรื่องราวประจำวัน', '📸', ?, 'แชร์ความอบอุ่นในบ้าน', '💖', ?, ?, ?)
      `).run(
        histId,
        memberId,
        points,
        dateStr,
        timestamp,
        photo || null
      );
    });

    tx();

    const created = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    res.json({
      success: true,
      post: { ...created, comments: [], likes: 0, isLiked: false },
    });
  } catch (err) {
    console.error('Error creating routine post:', err);
    res.status(500).json({ error: 'Failed to create routine post' });
  }
});

app.post('/api/posts/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = db.prepare('SELECT * FROM post_likes WHERE postId = ? AND memberId = ?').get(id, memberId);
    let isLiked = false;

    const tx = db.transaction(() => {
      if (existingLike) {
        // Unlike
        db.prepare('DELETE FROM post_likes WHERE postId = ? AND memberId = ?').run(id, memberId);
        db.prepare('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(id);
        isLiked = false;
      } else {
        // Like
        db.prepare('INSERT INTO post_likes (postId, memberId, timestamp) VALUES (?, ?, ?)').run(id, memberId, Date.now());
        db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(id);
        isLiked = true;

        // Create notification for post owner (if not liking own post)
        if (post.memberId !== memberId) {
          const sender = db.prepare('SELECT name FROM members WHERE id = ?').get(memberId);
          const notifId = `notif-${Date.now()}`;
          db.prepare(`
            INSERT INTO notifications (id, recipientId, senderId, type, postId, text, isRead, timestamp)
            VALUES (?, ?, ?, 'like', ?, ?, 0, ?)
          `).run(
            notifId,
            post.memberId,
            memberId,
            id,
            `${sender?.name || 'สมาชิก'} ได้กดถูกใจโพสต์ของคุณ`,
            Date.now()
          );
        }
      }
    });

    tx();

    const updatedLikesCount = db.prepare('SELECT COUNT(*) as count FROM post_likes WHERE postId = ?').get(id).count;
    res.json({ success: true, isLiked, likes: updatedLikesCount });
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

app.post('/api/posts/:id/comment', (req, res) => {
  try {
    const { id } = req.params;
    const { memberId, text } = req.body;

    if (!memberId || !text || !text.trim()) {
      return res.status(400).json({ error: 'memberId and text are required' });
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentId = `c-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const timestamp = Date.now();

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO comments (id, postId, memberId, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(commentId, id, memberId, text.trim(), timestamp);

      // Notification to post owner
      if (post.memberId !== memberId) {
        const sender = db.prepare('SELECT name FROM members WHERE id = ?').get(memberId);
        const notifId = `notif-${timestamp}`;
        db.prepare(`
          INSERT INTO notifications (id, recipientId, senderId, type, postId, text, isRead, timestamp)
          VALUES (?, ?, ?, 'comment', ?, ?, 0, ?)
        `).run(
          notifId,
          post.memberId,
          memberId,
          id,
          `${sender?.name || 'สมาชิก'} ได้แสดงความคิดเห็น: "${text.trim().slice(0, 40)}"`,
          timestamp
        );
      }
    });

    tx();

    const createdComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
    res.json({ success: true, comment: createdComment });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==========================================
// 4. REWARDS & VOTING
// ==========================================
app.get('/api/rewards', (req, res) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY target ASC').all();
    const votes = db.prepare('SELECT * FROM reward_votes').all();
    
    // Total score in current month
    const totalScoreRow = db.prepare('SELECT SUM(points) as total FROM chore_history').get();
    const totalScoreMonth = totalScoreRow?.total || 0;

    const goalRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('monthlyGoal');
    const monthlyGoal = goalRow ? parseInt(goalRow.value, 10) : 500;

    const voteCounts = {};
    const memberVoteMap = {};
    for (const v of votes) {
      const numId = parseInt(String(v.rewardId).replace('reward-', ''), 10) || v.rewardId;
      voteCounts[v.rewardId] = (voteCounts[v.rewardId] || 0) + 1;
      voteCounts[numId] = (voteCounts[numId] || 0) + 1;
      memberVoteMap[v.memberId] = numId;
    }

    const enrichedRewards = rewards.map(r => {
      const numId = parseInt(String(r.id).replace('reward-', ''), 10) || r.id;
      return {
        ...r,
        id: numId,
        rawId: r.id,
        unlockAt: r.target,
        votes: voteCounts[r.id] || voteCounts[numId] || 0,
        isUnlocked: totalScoreMonth >= r.target,
      };
    });

    res.json({
      rewards: enrichedRewards,
      memberVotes: memberVoteMap,
      totalScoreMonth,
      monthlyGoal,
    });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

app.post('/api/rewards/vote', (req, res) => {
  try {
    const { memberId, rewardId } = req.body;
    if (!memberId || !rewardId) {
      return res.status(400).json({ error: 'memberId and rewardId are required' });
    }

    const normRewardId = String(rewardId).startsWith('reward-') ? String(rewardId) : `reward-${rewardId}`;

    db.prepare(`
      INSERT INTO reward_votes (memberId, rewardId, timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(memberId) DO UPDATE SET rewardId = excluded.rewardId, timestamp = excluded.timestamp
    `).run(memberId, normRewardId, Date.now());

    res.json({ success: true, memberId, rewardId: normRewardId });
  } catch (err) {
    console.error('Error voting for reward:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// ==========================================
// 5. NOTIFICATIONS
// ==========================================
app.get('/api/notifications', (req, res) => {
  try {
    const { recipientId } = req.query;
    let query = 'SELECT * FROM notifications';
    const params = [];

    if (recipientId) {
      query += ' WHERE recipientId = ?';
      params.push(recipientId);
    }
    query += ' ORDER BY timestamp DESC LIMIT 50';

    const notifs = db.prepare(query).all(...params);
    res.json(notifs.map(n => ({ ...n, isRead: Boolean(n.isRead) })));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/read', (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId) {
      db.prepare('UPDATE notifications SET isRead = 1 WHERE recipientId = ?').run(recipientId);
    } else {
      db.prepare('UPDATE notifications SET isRead = 1').run();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// ==========================================
// 6. STATISTICS & SUMMARY
// ==========================================
app.get('/api/stats/summary', (req, res) => {
  try {
    const members = db.prepare('SELECT id, name, role, color FROM members').all();
    const history = db.prepare('SELECT * FROM chore_history ORDER BY timestamp DESC').all();

    // Member scores in total and this month
    const memberScores = {};
    members.forEach(m => { memberScores[m.id] = 0; });
    history.forEach(h => {
      memberScores[h.memberId] = (memberScores[h.memberId] || 0) + (h.points || 0);
    });

    const totalScoreMonth = Object.values(memberScores).reduce((a, b) => a + b, 0);
    const goalRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('monthlyGoal');
    const monthlyGoal = goalRow ? parseInt(goalRow.value, 10) : 500;

    // 7-day weekly data
    const now = new Date();
    const weeklyData = [];
    const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];

      const dayObj = { label: dayLabel, date: dateStr };
      members.forEach(m => { dayObj[m.id] = 0; });

      history.filter(h => h.date === dateStr).forEach(h => {
        dayObj[h.memberId] = (dayObj[h.memberId] || 0) + (h.points || 0);
      });

      weeklyData.push(dayObj);
    }

    res.json({
      memberScores,
      totalScoreMonth,
      monthlyGoal,
      weeklyData,
      recentEntries: history.slice(0, 10),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start Express Server (only when not in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`[HomeSpace Backend] Server running at http://localhost:${PORT}`);
    console.log(`[HomeSpace Backend] SQLite database: ${path.join(__dirname, 'homespace.db')}`);
  });
}

export default app;
