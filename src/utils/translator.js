// Fast, Robust Translation Helper with Multi-level Cache
// Seamless auto-detection between Thai and English (and other languages)

const memoryCache = new Map();

export function hasThaiCharacters(text) {
  if (!text) return false;
  return /[\u0E00-\u0E7F]/.test(text);
}

export function getTargetLanguage(text) {
  return hasThaiCharacters(text) ? 'en' : 'th';
}

export async function translateText(text, targetLang = null) {
  if (!text || !text.trim()) return '';

  const clean = text.trim();
  const resolvedTarget = targetLang || getTargetLanguage(clean);
  const cacheKey = `${clean}_${resolvedTarget}`;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(`hs_trans_${cacheKey.slice(0, 80)}`);
    if (cached) {
      memoryCache.set(cacheKey, cached);
      return cached;
    }
  } catch {}

  // 3. Try Backend /api/translate
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, targetLang: resolvedTarget }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.translated) {
        memoryCache.set(cacheKey, data.translated);
        try {
          localStorage.setItem(`hs_trans_${cacheKey.slice(0, 80)}`, data.translated);
        } catch {}
        return data.translated;
      }
    }
  } catch (err) {
    // Backend momentarily unreachable; fallback to direct client endpoint
  }

  // 4. Client Direct Fallback
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      resolvedTarget
    )}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = Array.isArray(data[0])
        ? data[0].map((s) => s[0]).join('')
        : clean;
      memoryCache.set(cacheKey, translated);
      try {
        localStorage.setItem(`hs_trans_${cacheKey.slice(0, 80)}`, translated);
      } catch {}
      return translated;
    }
  } catch (err) {
    console.warn('Translation fallback warning:', err);
  }

  return clean;
}
