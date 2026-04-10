const fetch = require('node-fetch');

/**
 * TTS Controller
 * Primary: Play.ht API (free tier: 12,500 chars/month)
 * Fallback: browser TTS signal
 *
 * Play.ht voices: https://play.ht/studio/
 * Good voices: s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json
 */

const PLAYHT_VOICE = 'en-US-JennyNeural'; // Clear, professional, natural
const PLAYHT_URL = 'https://api.play.ht/api/v2/tts/stream';

// POST /api/ai/tts
exports.textToSpeech = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required' });

    const apiKey = process.env.PLAYHT_API_KEY;
    const userId = process.env.PLAYHT_USER_ID;

    // Fallback to browser TTS if keys not set
    if (!apiKey || apiKey === 'your_playht_api_key_here' || !userId || userId === 'your_playht_user_id_here') {
      return res.json({ useBrowserTTS: true, text });
    }

    const response = await fetch(PLAYHT_URL, {
      method: 'POST',
      headers: {
        'AUTHORIZATION': apiKey,
        'X-USER-ID': userId,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        voice: PLAYHT_VOICE,
        output_format: 'mp3',
        speed: 1,
        quality: 'premium',
        voice_engine: 'PlayHT2.0-turbo',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[PlayHT] Error:', response.status, errText.slice(0, 200));
      return res.json({ useBrowserTTS: true, text });
    }

    // Stream audio directly to frontend
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    response.body.pipe(res);

  } catch (err) {
    console.error('[TTS]', err.message);
    // Always fallback gracefully — never crash
    res.json({ useBrowserTTS: true, text: req.body?.text || '' });
  }
};
