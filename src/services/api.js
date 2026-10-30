// HomeSpace Real Backend API Client
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[API] ${endpoint} returned ${res.status}:`, errorText);
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Network/Server Warning] ${endpoint}:`, err.message);
    throw err;
  }
}

// 1. Members & Auth

// 1.5 Phone + PIN & Multi-Family Invite System
export async function loginWithPin(phone, pin) {
  return request('/auth/login-pin', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  });
}

export async function sendOtp(phone) {
  return request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone, code) {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function registerWithRequest(data) {
  return request('/auth/register-request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchFamilies() {
  return request('/families');
}

export async function fetchFamilyByCode(code) {
  return request(`/families/by-code/${encodeURIComponent(code)}`);
}

export async function fetchFamilyRequests(familyId) {
  return request(`/families/${encodeURIComponent(familyId)}/requests`);
}

export async function approveMemberRequest(familyId, memberId, adminPhone) {
  return request(`/families/${encodeURIComponent(familyId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ memberId, adminPhone }),
  });
}

export async function rejectMemberRequest(familyId, memberId, adminPhone) {
  return request(`/families/${encodeURIComponent(familyId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ memberId, adminPhone }),
  });
}

export async function fetchMembers() {
  return request('/members');
}

export async function loginWithPhone(phone) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function registerMember(memberData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(memberData),
  });
}


export async function deleteMember(id) {
  return request(`/members/${id}`, {
    method: 'DELETE',
  });
}

export async function updateMember(id, memberData) {
  return request(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memberData),
  });
}

// 2. Posts, Likes & Comments
export async function fetchPosts(currentMemberId) {
  const query = currentMemberId ? `?currentMemberId=${encodeURIComponent(currentMemberId)}` : '';
  return request(`/posts${query}`);
}

export async function createChorePost(choreData) {
  return request('/posts/chore', {
    method: 'POST',
    body: JSON.stringify(choreData),
  });
}

export async function createRoutinePost(routineData) {
  return request('/posts/routine', {
    method: 'POST',
    body: JSON.stringify(routineData),
  });
}

export async function toggleLikePost(postId, memberId) {
  return request(`/posts/${postId}/like`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

export async function addPostComment(postId, memberId, text) {
  return request(`/posts/${postId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ memberId, text }),
  });
}

export async function deletePost(postId) {
  return request(`/posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function deleteComment(postId, commentId) {
  return request(`/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// 3. Rewards & Voting
export async function fetchRewards() {
  return request('/rewards');
}

export async function createReward(rewardData) {
  return request('/rewards', {
    method: 'POST',
    body: JSON.stringify(rewardData),
  });
}

export async function voteForReward(memberId, rewardId) {
  return request('/rewards/vote', {
    method: 'POST',
    body: JSON.stringify({ memberId, rewardId }),
  });
}

// 4. Notifications
export async function fetchNotifications(recipientId) {
  const query = recipientId ? `?recipientId=${encodeURIComponent(recipientId)}` : '';
  return request(`/notifications${query}`);
}

export async function markNotificationsAsRead(recipientId) {
  return request('/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ recipientId }),
  });
}

// 5. Statistics & Summary
export async function fetchStatsSummary() {
  return request('/stats/summary');
}

// 6. Photo File Upload
export async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }
  return await res.json();
}

export async function uploadBase64Image(base64, prefix = 'image') {
  return request('/upload-base64', {
    method: 'POST',
    body: JSON.stringify({ base64, prefix }),
  });
}

// 7. Stories / Highlights (แยกกับโพสต์ฟีด)
export async function fetchStories() {
  return request('/stories');
}

export async function createStory(storyData) {
  return request('/stories', {
    method: 'POST',
    body: JSON.stringify(storyData),
  });
}

export async function deleteStory(storyId) {
  return request(`/stories/${storyId}`, {
    method: 'DELETE',
  });
}

export async function replyStory(storyId, { senderId, text, emoji }) {
  return request(`/stories/${storyId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ senderId, text, emoji }),
  });
}
