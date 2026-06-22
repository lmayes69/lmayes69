import { AIFragranceData, Concentration, Occasion, Season } from '../types';

// Replace with your Anthropic API key
// Get one at https://console.anthropic.com
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const REVIEW_SOURCES_MAP: Record<string, string> = {
  Fragrantica: 'https://www.fragrantica.com/search/?query=',
  Basenotes: 'https://basenotes.com/search/?q=',
  'Parfumo': 'https://www.parfumo.com/search?query=',
};

export async function analyzeFragrance(name: string, brand?: string): Promise<AIFragranceData | null> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not configured. Using mock data.');
    return getMockFragranceData(name, brand);
  }

  const query = brand ? `${brand} ${name}` : name;

  const prompt = `You are a fragrance expert. Analyze this fragrance and return detailed information as valid JSON only (no markdown, no explanation, just the JSON object).

Fragrance: "${query}"

Return this exact JSON structure:
{
  "name": "fragrance name",
  "brand": "brand name",
  "concentration": "one of: Parfum, EDP, EDT, EDC, Body Spray, Unknown",
  "description": "2-3 sentence evocative description of the fragrance character and feel",
  "notes": {
    "top": ["note1", "note2", "note3"],
    "middle": ["note1", "note2", "note3"],
    "base": ["note1", "note2"]
  },
  "seasons": ["list from: Spring, Summer, Fall, Winter"],
  "occasions": ["list from: Casual, Work, Date Night, Formal, Outdoor, Sport, Evening"],
  "review_sources": [
    {"name": "Fragrantica", "url": "https://www.fragrantica.com/search/?query=ENCODED_NAME", "summary": "Brief note about what community thinks"},
    {"name": "Basenotes", "url": "https://basenotes.com/search/?q=ENCODED_NAME", "summary": "Brief note about reviews"}
  ],
  "is_inspired_by": false,
  "inspired_by_original": null
}

If this appears to be an inspired-by/clone fragrance (e.g. "inspired by Bleu de Chanel", "type of Sauvage", "alternative to"), set is_inspired_by to true and fill inspired_by_original with the original fragrance name.

For the review_sources URLs, replace ENCODED_NAME with the URL-encoded fragrance name.

Return ONLY valid JSON, nothing else.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Empty response');

    const parsed = JSON.parse(text) as AIFragranceData;
    return parsed;
  } catch (err) {
    console.error('Claude AI error:', err);
    return getMockFragranceData(name, brand);
  }
}

export async function getRecommendation(
  fragrances: { id: string; name: string; brand: string; seasons: Season[]; occasions: Occasion[]; notes: { top: string[]; middle: string[]; base: string[] } }[],
  mood: string,
  occasion: Occasion,
  season: Season
): Promise<{ fragrance_id: string; reason: string } | null> {
  if (!ANTHROPIC_API_KEY || fragrances.length === 0) return null;

  const list = fragrances
    .map(f => `ID:${f.id} | ${f.brand} ${f.name} | Seasons:${f.seasons.join(',')} | Occasions:${f.occasions.join(',')} | Base notes:${f.notes.base.join(',')}`)
    .join('\n');

  const prompt = `You are a fragrance consultant. Given this collection, recommend ONE fragrance for the current context.

Collection:
${list}

Context:
- Season: ${season}
- Occasion: ${occasion}
- Mood: ${mood}

Return ONLY valid JSON:
{"fragrance_id": "the exact ID from the list", "reason": "one compelling sentence why this is the perfect choice for right now"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function getMockFragranceData(name: string, brand?: string): AIFragranceData {
  return {
    name,
    brand: brand ?? 'Unknown Brand',
    concentration: 'EDT' as Concentration,
    description: `${name} is a sophisticated fragrance that blends timeless elegance with modern sensibility. This scent opens with fresh, vibrant top notes before revealing a rich, complex heart that settles into a warm, memorable base.`,
    notes: {
      top: ['Bergamot', 'Lemon', 'Pepper'],
      middle: ['Lavender', 'Geranium', 'Jasmine'],
      base: ['Cedarwood', 'Vetiver', 'Musk'],
    },
    seasons: ['Spring', 'Fall'] as Season[],
    occasions: ['Casual', 'Work', 'Date Night'] as Occasion[],
    review_sources: [
      {
        name: 'Fragrantica',
        url: `https://www.fragrantica.com/search/?query=${encodeURIComponent(name)}`,
        summary: 'Search Fragrantica for community reviews and ratings',
      },
      {
        name: 'Basenotes',
        url: `https://basenotes.com/search/?q=${encodeURIComponent(name)}`,
        summary: 'Search Basenotes for expert reviews and discussions',
      },
    ],
    is_inspired_by: false,
  };
}
