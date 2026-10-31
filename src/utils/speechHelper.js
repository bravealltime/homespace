// Native Browser Text-to-Speech & Speech Recognition Helper for Thai Language
// 100% Free, Zero AI API, Runs natively on iOS Safari, Android Chrome, and Desktop

let currentUtterance = null;

export function speakThai(text, onStart, onEnd) {
  if (!('speechSynthesis' in window)) {
    alert('อุปกรณ์ของคุณไม่รองรับการอ่านออกเสียง');
    return false;
  }

  // If already speaking, cancel first
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) return false;

  try {
    const clean = text.trim();
    const hasThai = /[\u0E00-\u0E7F]/.test(clean);
    const targetLang = hasThai ? 'th-TH' : 'en-US';

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = targetLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) =>
      hasThai ? (v.lang === 'th-TH' || v.lang.startsWith('th')) : (v.lang === 'en-US' || v.lang.startsWith('en'))
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Voice-to-Text Recognition (SpeechRecognition)
export function createThaiSpeechRecognition({ onResult, onError, onEnd }) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult(finalTranscript || interimTranscript, Boolean(finalTranscript));
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      if (onError) onError(e.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  } catch (err) {
    console.warn('Init speech recognition failed:', err);
    return null;
  }
}

// Preset Quick Blessings / Praise for Seniors & Family
export const SENIOR_QUICK_BLESSINGS = [
  { text: 'เก่งมากเลยลูก ❤️', emoji: '❤️' },
  { text: 'น่ารักจังเลย 🥰', emoji: '🥰' },
  { text: 'กินข้าวด้วยนะจ๊ะ 🍲', emoji: '🍲' },
  { text: 'สะอาดเรียบร้อยดีมาก 👏', emoji: '👏' },
  { text: 'พักผ่อนเยอะๆ นะ 🌿', emoji: '🌿' },
  { text: 'สู้ๆ นะคนเก่ง 💪', emoji: '💪' },
  { text: 'ภูมิใจในตัวลูกนะ ✨', emoji: '✨' },
  { text: 'คิดถึงนะจ๊ะ 💖', emoji: '💖' },
];
