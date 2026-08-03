export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token =
    process.env.IG_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
  const accountId =
    process.env.IG_ACCOUNT_ID ||
    process.env.INSTAGRAM_ACCOUNT_ID ||
    '17841462404931884';

  const mockPosts = [
    {
      id: '18023948193049123',
      caption: 'Discover Any Property with AI 🏠 Comment "PROPERTY" to get instant brochures and pricing straight to your DM!',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567890',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 142,
      comments_count: 38,
      insights: { video_views: 0 }
    },
    {
      id: '18023948193049124',
      caption: 'Top 5 Real Estate Automations in 2026 🚀 Drop "INFO" below for our full step-by-step setup guide.',
      media_type: 'VIDEO',
      media_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567891',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 310,
      comments_count: 64,
      insights: { video_views: 1250 }
    },
    {
      id: '18023948193049125',
      caption: 'How to convert 80% of Instagram commenters into leads on autopilot 🔥 Comment "LINK" for free access.',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567892',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 89,
      comments_count: 22,
      insights: { video_views: 0 }
    },
    {
      id: '18023948193049126',
      caption: 'Luxury Villa Virtual Tour 🌴 Comment "PRICING" to receive floor plans and current availability.',
      media_type: 'VIDEO',
      media_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567893',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 520,
      comments_count: 115,
      insights: { video_views: 3840 }
    },
    {
      id: '18023948193049127',
      caption: 'Automate your Instagram Inbox with JaaGa AI! Comment "DEMO" to test the instant DM flow.',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      permalink: 'https://instagram.com/p/C1234567894',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      like_count: 204,
      comments_count: 47,
      insights: { video_views: 0 }
    }
  ];

  if (!token) {
    console.log('[Instagram Posts] No access token provided, serving structured posts.');
    return res.status(200).json({ data: mockPosts });
  }

  try {
    const url = `https://graph.instagram.com/v23.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=${token}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      return res.status(200).json({ data: json.data });
    } else {
      console.warn('[Instagram Posts API] Fallback to mock data due to API response:', json);
      return res.status(200).json({ data: mockPosts });
    }
  } catch (err) {
    console.error('[Instagram Posts API Error]:', err);
    return res.status(200).json({ data: mockPosts });
  }
}
