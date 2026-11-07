// HomeSpace Real Backend API Client
import { Capacitor } from '@capacitor/core';

// Production Online Vercel Backend URL (Accessible 24/7 anywhere on 4G/5G/Wi-Fi)
export const DEFAULT_ONLINE_API_URL = 'https://homespace-rose.vercel.app/api';
export const DEFAULT_LAN_API_URL = 'http://192.168.1.42:3001/api';

export function getApiBaseUrl() {
  // 1. In-app custom server configuration (set via QuickHouseMenu Settings)
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('homespace_custom_api_url');
    if (custom && custom.trim()) {
      // In Native Android APK, localhost/127.0.0.1/10.0.2.2 is unreachable on real devices; auto-reset to cloud Vercel
      if (Capacitor.isNativePlatform()) {
        const lower = custom.toLowerCase();
        if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('10.0.2.2')) {
          localStorage.removeItem('homespace_custom_api_url');
          return DEFAULT_ONLINE_API_URL;
        }
      }
      return custom.trim().replace(/\/+$/, '');
    }
  }

  // 2. Vite environment variable (if explicitly provided)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 3. If running inside Native Android APK via Capacitor -> Connect directly to Online Web App!
  if (Capacitor.isNativePlatform()) {
    return DEFAULT_ONLINE_API_URL;
  }

  // 4. Standard Web Browser / PWA: relative /api path (proxied by Vite or Vercel serverless)
  return '/api';
}

export function setCustomApiUrl(url) {
  if (typeof localStorage !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('homespace_custom_api_url');
    } else {
      localStorage.setItem('homespace_custom_api_url', url.trim());
    }
  }
}

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `API Error ${res.status}`;
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
        if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      const err = new Error(errorMessage);
      err.status = res.status;
      err.data = errorData;
      throw err;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API Network/Server Warning] ${endpoint} (${url}):`, err.message);
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

export async function verifyChoreWithAi(payload) {
  return request('/ai/verify-chore', {
    method: 'POST',
    body: JSON.stringify(payload),
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

export async function markNotificationsAsRead(recipientId, notificationId) {
  return request('/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ recipientId, notificationId }),
  });
}

export async function clearNotifications(recipientId) {
  return request('/notifications/clear', {
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

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/upload`, {
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

// 8. Digital Fridge Sticky Notes (กระดานตู้เย็นของบ้าน)
export async function fetchNotes() {
  return request('/notes');
}

export async function createNote(noteData) {
  return request('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export async function toggleNoteAck(noteId, memberId) {
  return request(`/notes/${noteId}/ack`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

export async function deleteNote(noteId) {
  return request(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

// 9. Family Milestones & Countdown (ปฏิทินวันสำคัญ & นับถอยหลัง)
export async function fetchMilestones() {
  return request('/milestones');
}

export async function createMilestone(milestoneData) {
  return request('/milestones', {
    method: 'POST',
    body: JSON.stringify(milestoneData),
  });
}

export async function deleteMilestone(milestoneId) {
  return request(`/milestones/${milestoneId}`, {
    method: 'DELETE',
  });
}

// 10. Home Handbook & Maintenance (สมุดคู่มือบ้าน & เบอร์ช่างฉุกเฉิน)
export async function fetchHomeContacts() {
  return request('/handbook/contacts');
}

export async function createHomeContact(contactData) {
  return request('/handbook/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData),
  });
}

export async function deleteHomeContact(contactId) {
  return request(`/handbook/contacts/${contactId}`, {
    method: 'DELETE',
  });
}

export async function fetchHomeMaintenance() {
  return request('/handbook/maintenance');
}

export async function createHomeMaintenance(maintData) {
  return request('/handbook/maintenance', {
    method: 'POST',
    body: JSON.stringify(maintData),
  });
}

export async function completeHomeMaintenance(maintId, memberId) {
  return request(`/handbook/maintenance/${maintId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  });
}

export async function deleteHomeMaintenance(maintId) {
  return request(`/handbook/maintenance/${maintId}`, {
    method: 'DELETE',
  });
}

// 11. Family Happiness Garden (ต้นไม้ความสุขของบ้าน)
export async function fetchFamilyTree() {
  return request('/tree');
}

export async function waterFamilyTree(memberId, drops = 1) {
  return request('/tree/water', {
    method: 'POST',
    body: JSON.stringify({ memberId, drops }),
  });
}

export async function addWaterDrops(amount = 1) {
  return request('/tree/add-drops', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

// 12. One-Tap Family SOS (ปุ่มขอความช่วยเหลือด่วนประจำบ้าน)
export async function triggerSos(sosData) {
  return request('/sos/trigger', {
    method: 'POST',
    body: JSON.stringify(sosData),
  });
}

export async function fetchActiveSos() {
  return request('/sos/active');
}

export async function resolveSos(alertId, resolvedBy, note) {
  return request(`/sos/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolvedBy, note }),
  });
}
