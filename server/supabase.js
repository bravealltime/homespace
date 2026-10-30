import { createClient } from '@supabase/supabase-js';

// Auto-load .env in Node 20+
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env');
  }
} catch {
  // .env may not exist on cloud environments like Vercel where process.env is injected directly
}

// Load Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'homespace';

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log(`[Supabase Storage] Initialized successfully with bucket: "${SUPABASE_BUCKET}"`);
  } catch (err) {
    console.warn('[Supabase Storage] Failed to initialize client:', err.message);
  }
} else {
  console.log('[Supabase Storage] Not configured yet (SUPABASE_URL / SUPABASE_ANON_KEY not set). Using local/base64 fallback.');
}

export function isSupabaseConfigured() {
  return !!supabase;
}

/**
 * Upload a raw Buffer to Supabase Storage
 * @param {Buffer} buffer 
 * @param {string} originalName 
 * @param {string} mimeType 
 * @returns {Promise<{ success: boolean, url: string, path: string } | null>}
 */
export async function uploadBufferToSupabase(buffer, originalName = 'photo.jpg', mimeType = 'image/jpeg') {
  if (!supabase) return null;

  try {
    const ext = originalName.includes('.') ? originalName.split('.').pop() : (mimeType.split('/')[1] || 'jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `uploads/${filename}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('[Supabase Storage] Upload error:', error.message);
      // If bucket doesn't exist, try to inform user
      if (error.message.includes('Bucket not found') || error.message.includes('bucket not found')) {
        console.warn(`[Supabase Storage] Please create a public bucket named "${SUPABASE_BUCKET}" in your Supabase dashboard.`);
      }
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  } catch (err) {
    console.error('[Supabase Storage] Upload exception:', err);
    return null;
  }
}

/**
 * Upload a Base64 data URL to Supabase Storage
 * @param {string} base64DataUrl (e.g. "data:image/jpeg;base64,...")
 * @param {string} prefix (e.g. "avatar", "story", "chore")
 * @returns {Promise<string>} returns public CDN URL if uploaded, or original base64 as fallback
 */
export async function uploadBase64ToSupabase(base64DataUrl, prefix = 'image') {
  if (!supabase || !base64DataUrl || typeof base64DataUrl !== 'string') {
    return base64DataUrl;
  }

  // Check if it's already an http/https URL
  if (base64DataUrl.startsWith('http://') || base64DataUrl.startsWith('https://')) {
    return base64DataUrl;
  }

  // Parse data URL: data:image/png;base64,xxxx
  const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64DataUrl;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  const res = await uploadBufferToSupabase(buffer, filename, mimeType);
  if (res && res.url) {
    console.log(`[Supabase Storage] Uploaded ${prefix} successfully -> ${res.url}`);
    return res.url;
  }

  return base64DataUrl;
}

export default supabase;
