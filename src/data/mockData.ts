import {
  Automation,
  Conversation,
  IGPost,
  LeadContact,
  Broadcast,
  AiSettings,
  AppSettings,
} from '../types';

export const MOCK_POSTS: IGPost[] = [
  {
    id: 'post_1',
    caption: '🔥 Free 2026 UI/UX Checklist! Comment "CHECKLIST" below and I\'ll DM you the link instantly! 📥',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    mediaType: 'IMAGE',
    timestamp: '2 hours ago',
    commentsCount: 482,
    likesCount: 3840,
  },
  {
    id: 'post_2',
    caption: '🚀 How we generated $100k with Instagram DMs in 30 days. Comment "PLAYBOOK" for full case study video!',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    mediaType: 'VIDEO',
    timestamp: '1 day ago',
    commentsCount: 891,
    likesCount: 7120,
  },
  {
    id: 'post_3',
    caption: 'New Figma System 3.0 just dropped! Comment "FIGMA" to get the free starter UI kit in your DMs right now!',
    mediaUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    mediaType: 'IMAGE',
    timestamp: '3 days ago',
    commentsCount: 312,
    likesCount: 2950,
  },
  {
    id: 'post_4',
    caption: 'Stop losing leads on Instagram Reels! Comment "AUTOMATE" for our step-by-step setup guide.',
    mediaUrl: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=600&q=80',
    mediaType: 'VIDEO',
    timestamp: '5 days ago',
    commentsCount: 640,
    likesCount: 4890,
  },
];

export const INITIAL_AUTOMATIONS: Automation[] = [
  {
    id: 'auto_1',
    title: '2026 UI/UX Checklist Lead Magnet',
    description: 'Auto-replies to comments with keyword CHECKLIST and sends the 2026 UI/UX Checklist link in DMs.',
    triggerType: 'comment_dm',
    status: 'live',
    selectedPostIds: ['post_1'],
    keywords: ['CHECKLIST', 'UI', 'DESIGN', 'CHECK'],
    matchRule: 'contains',
    publicCommentReplies: [
      'Sent you the checklist in your DMs! 📥✨',
      'Check your DMs! I just dropped the link for you! 🚀',
      'Sent! Enjoy the 2026 UI/UX Checklist 🎨👍',
    ],
    dmMessageText: 'Hey there! 👋 Here is your free 2026 UI/UX Checklist. Tap below to download the PDF guide instantly:',
    dmButtons: [
      { id: 'btn_1', type: 'link', label: '📥 Download UI Checklist', url: 'https://designmaster.co/checklist-2026' },
      { id: 'btn_2', type: 'quick_reply', label: '💡 Watch Video Walkthrough' },
    ],
    enableFollowUp: true,
    followUpText: 'Hey! Did you get a chance to check out the checklist? Reply "YES" if you want me to send the Figma template too!',
    followUpDelayHours: 2,
    conditions: {
      replyOncePerUser: true,
      requireFollowing: true,
      captureLead: true,
    },
    stats: {
      triggersCount: 1420,
      dmsSent: 1380,
      leadsCaptured: 940,
      ctrPercent: 68.1,
    },
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-30T14:20:00Z',
  },
  {
    id: 'auto_2',
    title: 'Figma System 3.0 Free Starter Kit',
    description: 'Delivers the Figma starter kit link when users comment FIGMA on our latest post.',
    triggerType: 'comment_dm',
    status: 'live',
    selectedPostIds: ['post_3'],
    keywords: ['FIGMA', 'KIT', 'SYSTEM'],
    matchRule: 'contains',
    publicCommentReplies: [
      'Just sent the Figma kit to your DMs! 🎨 Check it out!',
      'Check your inbox! The Figma System 3.0 link is ready 🚀',
    ],
    dmMessageText: 'Awesome! Your Figma System 3.0 Starter Kit is ready to duplicate. Click below to open in Figma:',
    dmButtons: [
      { id: 'btn_3', type: 'link', label: '🎨 Duplicate Figma File', url: 'https://figma.com/@designmaster/system3' },
    ],
    enableFollowUp: false,
    conditions: {
      replyOncePerUser: true,
      requireFollowing: false,
      captureLead: true,
    },
    stats: {
      triggersCount: 820,
      dmsSent: 790,
      leadsCaptured: 520,
      ctrPercent: 65.8,
    },
    createdAt: '2026-07-20T12:00:00Z',
    updatedAt: '2026-07-29T18:10:00Z',
  },
  {
    id: 'auto_3',
    title: 'Inbound DM Keyword Pricing Bot',
    description: 'Responds with course & consultation packages whenever followers message PRICE or PRICING.',
    triggerType: 'dm_keyword',
    status: 'live',
    selectedPostIds: [],
    keywords: ['PRICE', 'PRICING', 'COST', 'HOW MUCH', 'PACKAGE'],
    matchRule: 'contains',
    publicCommentReplies: [],
    dmMessageText: 'Thanks for inquiring about Design Master Pro! Here are our available plans and custom consultation options:',
    dmButtons: [
      { id: 'btn_4', type: 'link', label: '💎 View Pricing & Packages', url: 'https://designmaster.co/pricing' },
      { id: 'btn_5', type: 'quick_reply', label: '📞 Book 1-on-1 Call' },
    ],
    enableFollowUp: true,
    followUpText: 'Would you like to speak directly with an advisor on our team today?',
    followUpDelayHours: 1,
    conditions: {
      replyOncePerUser: false,
      requireFollowing: false,
      captureLead: true,
    },
    stats: {
      triggersCount: 450,
      dmsSent: 450,
      leadsCaptured: 180,
      ctrPercent: 40.0,
    },
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-28T11:45:00Z',
  },
  {
    id: 'auto_4',
    title: 'Story Mention Thank You & 15% Off Coupon',
    description: 'Sends automated thank you DM with 15% discount code whenever someone tags us in their Story.',
    triggerType: 'story_reply',
    status: 'live',
    selectedPostIds: [],
    keywords: ['*'],
    matchRule: 'any',
    publicCommentReplies: [],
    dmMessageText: 'Thank you so much for the Story mention! 🌟 Here is an exclusive 15% discount code for our store: STORY15',
    dmButtons: [
      { id: 'btn_6', type: 'link', label: '🛒 Shop Now with 15% Off', url: 'https://designmaster.co/shop?code=STORY15' },
    ],
    enableFollowUp: false,
    conditions: {
      replyOncePerUser: true,
      requireFollowing: false,
      captureLead: false,
    },
    stats: {
      triggersCount: 610,
      dmsSent: 610,
      leadsCaptured: 210,
      ctrPercent: 34.4,
    },
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-07-25T16:30:00Z',
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    userHandle: 'sarah_ux',
    userName: 'Sarah Lin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    followerCount: '24.5k',
    lastMessage: 'Hey! Downloaded the checklist. Do you have a Figma kit for mobile design too?',
    timestamp: '10 mins ago',
    unread: true,
    mode: 'automated',
    tags: ['VIP', 'UI Checklist Lead', 'High Intent'],
    leadInfo: {
      email: 'sarah.lin@stripe.com',
      phone: '+1 (415) 890-1234',
      status: 'qualified',
      capturedAt: '2026-07-31T03:12:00Z',
    },
    notes: 'Lead Product Designer at Stripe. Interested in enterprise Figma components.',
    triggerHistory: [
      { automationName: '2026 UI/UX Checklist Lead Magnet', timestamp: '2 hours ago', keywordMatched: 'CHECKLIST' },
    ],
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'CHECKLIST',
        timestamp: '2 hours ago',
        isCommentReply: true,
      },
      {
        id: 'm2',
        sender: 'bot',
        text: 'Hey Sarah! 👋 Here is your free 2026 UI/UX Checklist. Tap below to download the PDF guide instantly:',
        timestamp: '2 hours ago',
        buttons: [
          { id: 'b1', type: 'link', label: '📥 Download UI Checklist', url: 'https://designmaster.co/checklist-2026' },
        ],
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Hey! Downloaded the checklist. Do you have a Figma kit for mobile design too?',
        timestamp: '10 mins ago',
      },
    ],
  },
  {
    id: 'conv_2',
    userHandle: 'alex_growth',
    userName: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    followerCount: '58.2k',
    lastMessage: 'Can someone on your team jump on a call tomorrow at 2 PM EST?',
    timestamp: '25 mins ago',
    unread: false,
    mode: 'manual',
    tags: ['Founder', 'Pricing Inquiry', 'High Intent'],
    leadInfo: {
      email: 'alex@saasify.io',
      phone: '+1 (555) 234-5678',
      status: 'converted',
      capturedAt: '2026-07-30T16:45:00Z',
    },
    notes: 'Founder @ SaaSify. Looking for team training for 12 engineers.',
    triggerHistory: [
      { automationName: 'Inbound DM Keyword Pricing Bot', timestamp: '1 day ago', keywordMatched: 'PRICING' },
    ],
    messages: [
      {
        id: 'm2_1',
        sender: 'user',
        text: 'PRICING',
        timestamp: '1 day ago',
      },
      {
        id: 'm2_2',
        sender: 'bot',
        text: 'Thanks for inquiring about Design Master Pro! Here are our available plans and custom consultation options:',
        timestamp: '1 day ago',
        buttons: [
          { id: 'b2_1', type: 'link', label: '💎 View Pricing & Packages', url: 'https://designmaster.co/pricing' },
        ],
      },
      {
        id: 'm2_3',
        sender: 'user',
        text: 'We are looking for a team subscription for 12 designers.',
        timestamp: '4 hours ago',
      },
      {
        id: 'm2_4',
        sender: 'human',
        text: 'Hi Alex! I switched our chat to human support. We offer custom team enterprise licenses with dedicated support. Are you free for a 15-min demo call?',
        timestamp: '1 hour ago',
      },
      {
        id: 'm2_5',
        sender: 'user',
        text: 'Can someone on your team jump on a call tomorrow at 2 PM EST?',
        timestamp: '25 mins ago',
      },
    ],
  },
  {
    id: 'conv_3',
    userHandle: 'elena_creator',
    userName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    followerCount: '85.4k',
    lastMessage: 'FIGMA',
    timestamp: '1 hour ago',
    unread: true,
    mode: 'automated',
    tags: ['Creator', 'Figma Kit Lead'],
    leadInfo: {
      email: 'elena@creatorhub.com',
      phone: '',
      status: 'new',
      capturedAt: '2026-07-31T03:30:00Z',
    },
    notes: 'Lifestyle & design creator looking for digital product templates.',
    triggerHistory: [
      { automationName: 'Figma System 3.0 Free Starter Kit', timestamp: '1 hour ago', keywordMatched: 'FIGMA' },
    ],
    messages: [
      {
        id: 'm3_1',
        sender: 'user',
        text: 'FIGMA',
        timestamp: '1 hour ago',
        isCommentReply: true,
      },
      {
        id: 'm3_2',
        sender: 'bot',
        text: 'Awesome! Your Figma System 3.0 Starter Kit is ready to duplicate. Click below to open in Figma:',
        timestamp: '1 hour ago',
        buttons: [
          { id: 'b3_1', type: 'link', label: '🎨 Duplicate Figma File', url: 'https://figma.com/@designmaster/system3' },
        ],
      },
    ],
  },
  {
    id: 'conv_4',
    userHandle: 'david_dev',
    userName: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    followerCount: '4.1k',
    lastMessage: 'AUTOMATE',
    timestamp: '3 hours ago',
    unread: false,
    mode: 'automated',
    tags: ['Developer', 'Reels Lead'],
    leadInfo: {
      email: 'david.c@gmail.com',
      phone: '',
      status: 'contacted',
      capturedAt: '2026-07-31T01:15:00Z',
    },
    triggerHistory: [
      { automationName: 'Reels Automation Playbook', timestamp: '3 hours ago', keywordMatched: 'AUTOMATE' },
    ],
    messages: [
      {
        id: 'm4_1',
        sender: 'user',
        text: 'AUTOMATE',
        timestamp: '3 hours ago',
      },
      {
        id: 'm4_2',
        sender: 'bot',
        text: 'Here is our complete Instagram Reel Automation playbook guide!',
        timestamp: '3 hours ago',
      },
    ],
  },
];

export const INITIAL_CONTACTS: LeadContact[] = [
  {
    id: 'lead_1',
    handle: 'sarah_ux',
    name: 'Sarah Lin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    email: 'sarah.lin@stripe.com',
    phone: '+1 (415) 890-1234',
    sourceAutomation: '2026 UI/UX Checklist Lead Magnet',
    status: 'Qualified',
    tags: ['VIP', 'UI Checklist Lead', 'High Intent'],
    capturedAt: '2026-07-31 03:12',
    lastActive: '10 mins ago',
  },
  {
    id: 'lead_2',
    handle: 'alex_growth',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    email: 'alex@saasify.io',
    phone: '+1 (555) 234-5678',
    sourceAutomation: 'Inbound DM Keyword Pricing Bot',
    status: 'Converted',
    tags: ['Founder', 'Pricing Inquiry', 'Enterprise'],
    capturedAt: '2026-07-30 16:45',
    lastActive: '25 mins ago',
  },
  {
    id: 'lead_3',
    handle: 'elena_creator',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    email: 'elena@creatorhub.com',
    phone: '+1 (555) 345-6789',
    sourceAutomation: 'Figma System 3.0 Free Starter Kit',
    status: 'New',
    tags: ['Creator', 'Figma Kit Lead'],
    capturedAt: '2026-07-31 03:30',
    lastActive: '1 hour ago',
  },
  {
    id: 'lead_4',
    handle: 'david_dev',
    name: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    email: 'david.c@gmail.com',
    phone: '+1 (555) 456-7890',
    sourceAutomation: 'Reels Automation Playbook',
    status: 'Contacted',
    tags: ['Developer', 'Reels Lead'],
    capturedAt: '2026-07-31 01:15',
    lastActive: '3 hours ago',
  },
  {
    id: 'lead_5',
    handle: 'maya_brand',
    name: 'Maya Patel',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    email: 'maya@shopglow.co',
    phone: '+1 (555) 876-5432',
    sourceAutomation: 'Inbound DM Keyword Pricing Bot',
    status: 'Qualified',
    tags: ['Enterprise Lead', 'E-commerce'],
    capturedAt: '2026-07-29 11:20',
    lastActive: 'Yesterday',
  },
  {
    id: 'lead_6',
    handle: 'marcus_design',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    email: 'marcus@vance.design',
    phone: '+1 (555) 678-9012',
    sourceAutomation: '2026 UI/UX Checklist Lead Magnet',
    status: 'New',
    tags: ['UI Checklist Lead'],
    capturedAt: '2026-07-28 09:10',
    lastActive: '2 days ago',
  },
];

export const INITIAL_BROADCASTS: Broadcast[] = [
  {
    id: 'bc_1',
    title: '🚀 Q3 Design Masterclass Early Bird Access',
    body: 'Hey there! We are launching our live Q3 UI/UX Masterclass next week. As a VIP lead, you get 40% off early bird tickets before public release! 🎟️',
    buttons: [
      { id: 'b_bc1', type: 'link', label: '🎟️ Claim Early Bird Ticket (40% Off)', url: 'https://designmaster.co/masterclass-q3' },
    ],
    audienceSegment: 'VIP Leads',
    scheduleType: 'now',
    status: 'sent',
    stats: {
      targetUsers: 2500,
      sent: 2480,
      delivered: 2450,
      opened: 1890,
      clicked: 1240,
    },
    createdAt: '2026-07-28 14:00',
  },
  {
    id: 'bc_2',
    title: '🎨 Free Figma UI Kit Update v3.2 Released',
    body: 'We just updated the Figma System 3.0 kit with 50+ new dark mode components and auto-layout tokens!',
    buttons: [
      { id: 'b_bc2', type: 'link', label: '📥 Get Updated Figma File', url: 'https://figma.com/@designmaster/system3' },
    ],
    audienceSegment: 'Figma Kit Leads',
    scheduleType: 'scheduled',
    scheduledFor: '2026-08-02 10:00 EST',
    status: 'scheduled',
    stats: {
      targetUsers: 1420,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    },
    createdAt: '2026-07-30 09:30',
  },
];

export const INITIAL_AI_SETTINGS: AiSettings = {
  enabled: true,
  persona: 'Friendly & Professional',
  systemPrompt: `You are JaaGa's AI Assistant, a friendly and helpful chatbot for JaaGa. JaaGa specializes in Property Documents and Services across Telangana, India. You answer customer questions on WhatsApp, Instagram DMs, and the JaaGa website.

# YOUR JOB
- Answer any question related to JaaGa's property documents and services clearly and helpfully.
- When someone asks about documents or services, first briefly explain what they are and how JaaGa helps, then guide them to the next step.
- You can also answer general knowledge questions in simple language.
- If a property, document, or service question relates to Telangana or India, always answer using JaaGa's services.
- If asked about another company or website, reply exactly: "We don't have details about that website or their services."
- Never say "I don't know" for a JaaGa question. Always give a clear, useful final answer.

# TONE AND FORMAT (follow strictly)
- Keep replies short, clear, friendly, and conversational. Talk like you would to a normal person.
- Avoid jargon and legal terms. Explain simply.
- Do not overload with details unless the user asks for more.
- IMPORTANT: Write in plain text only. Never use stars, asterisks, bold, italics, bullets with symbols, or any special formatting. No * or ** anywhere.

# GREETING
When a user first says hi, hello, hey, or any greeting (and only then), reply with this welcome message exactly:

Hello, welcome to JaaGa!

We specialize in Property Documents and Services across Telangana.

Here's how we can help you:
- Get certified property documents (Sale Deed, Encumbrance, Occupancy, Mutation, and more)
- Access our Property Audit Report (ownership, disputes, taxes, encumbrances)
- Request Property Services (title verification, monitoring, tax creation, legal opinion, and more)

Please reply with the service you are looking for.

# QUICK LINKS AND CONTACT
- If the user asks for the website or a link, reply with: https://www.jaaga.ai and phone +91 88851 66880
- If the user asks about documents (sale deed, encumbrance, occupancy, mutation), point them to: https://www.jaaga.ai/documents and phone +91 88851 66880
- If the user asks about services (verification, legal, tax, audit, property services), point them to: https://www.jaaga.ai/services and phone +91 88851 66880
- At the end of property-related conversations, share: Visit https://www.jaaga.ai and Download app https://www.jaaga.ai/app and Contact +91 88851 66880

# WHAT JAAGA OFFERS
Property Locker: securely store and manage property documents.
Property Documents: Mutation, PTIN, VLTIN, EC (Encumbrance Certificate), Certified Copies, and more.
Property Services: Title Verification, Court Case Check, Mortgage Report, Property Monitoring and Alerts, Digital Land Survey, Tax Bills, Legal Opinion, Property Valuation, and more.

# PRICING RULES
- Do NOT mention pricing by default.
- Share pricing ONLY when the user specifically asks about price, cost, charges, or fees.
- For services with government fees (Mutation, VLTIN, etc.), explain: Total cost = JaaGa service fee + Government fee.
- If the user gives a property value, calculate the government fee at 0.1 percent of that value.
- After JaaGa applies, the final government fee is confirmed within 1 working day.

## Service fees (JaaGa fee, excluding govt. charges where noted)
Mortgage Report: 99 rupees
Mutation Creation: 1999 rupees + Govt. fee (0.1 percent of property value)
PTIN Creation: 9999 rupees
VLTIN Creation: 1999 rupees + Govt. fee
Property Valuation: 999 rupees
Rectification Deed: 2999 rupees
Find or Locate Property: 4999 rupees
Property Monitoring and Alerts: 2499 rupees
Legal Opinion: 5999 rupees
Digital Land Survey: 9999 rupees
Court Case Check: 2999 rupees

## Certified Encumbrance Certificate (EC)
2023 to 2025: 499 rupees soft copy, 799 rupees courier, 99 credits instant
1983 to 2025: 1499 rupees soft copy, 2499 rupees courier, 99 credits instant
1950 to 1982: 2999 rupees soft copy, 3199 rupees courier, 99 credits instant

## Certified Sale Deed
2014 to 2025: 699 rupees soft copy, 799 rupees courier, 1099 rupees instant
1990 to 2013: 1999 rupees soft copy, 2199 rupees courier
1950 to 1989: 2499 rupees soft copy, 2999 rupees courier

## Other documents
Encumbrance Certificate (soft copy): Free
Property Tax Receipt: Free
Prohibited Land Report: Free
Market Value Certificate: Free
RERA Certificate: Free
Hydra or FTL Map: Free
Bhubharati (EC extract): Free
Pattadhar Passbook (Agri): 99 credits soft copy, 999 rupees regular, 199 rupees instant
Adangal or Pahani or ROR-1B (Agri): 199 credits soft copy
Mutation Certificate (Agri and Non-Agri): 49 credits soft copy, 199 rupees regular, 99 rupees instant
Survey Map (Agri): 99 rupees soft copy
Village Map (Agri): 99 rupees soft copy
Land Details Search (Agri): Free
Registered Documents (Agri): Free

# UTILITY BILL PAYMENTS (Property Tax, Electricity, Water, VLT)
- Ask the customer for the specific detail needed: PTIN, Service Number, CAN Number, etc.
- Bill amounts are set by the government or utility department, not by JaaGa.
- JaaGa fetches the bill details and provides a secure payment link (Cashfree or Razorpay).
- After payment, a confirmation and receipt are shared on WhatsApp.
- If bill details cannot be fetched instantly, confirmation is provided within 1 working day.

# HARD RULES
- Never invent services, prices, or details not listed above. If something is not covered, guide the user to call +91 88851 66880.
- Stay on JaaGa and property topics; keep answers focused and short.
- Always end property conversations with the visit link, app link, and phone number.`,
  fallbackConfidenceThreshold: 70,
  fallbackToHumanOnKeywords: ['human', 'agent', 'speak to founder', 'refund', 'complaint', 'custom enterprise'],
  faqs: [
    {
      id: 'faq_1',
      question: 'What is an Encumbrance Certificate (EC)?',
      answer: 'An EC shows if a property has any registered transactions, mortgages, or legal claims against it over a specific period of time.',
      category: 'Property Documents',
    },
    {
      id: 'faq_2',
      question: 'How do I get my property Mutation Certificate in Telangana?',
      answer: 'JaaGa helps you apply for property mutation with GHMC or your municipal corporation. Total cost is 1999 rupees service fee plus 0.1 percent government fee of property value.',
      category: 'Property Documents',
    },
    {
      id: 'faq_3',
      question: 'What is a Property Audit Report?',
      answer: 'A comprehensive audit covering ownership history, court disputes, unpaid taxes, prohibited land check, and encumbrances.',
      category: 'Property Services',
    },
  ],
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  appID: '2878864779136148',
  accountID: '17841462404931884',
  accessTokenMasked: 'IGAA...kQRwZDZD',
  connectedHandle: 'design.master',
  handleAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  tokenStatus: 'Connected ✓',
  tokenExpiryDays: 59,
  rateLimitPerHour: 60,
  enforce24hWindow: true,
  quietHoursEnabled: true,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  teamMembers: [
    {
      id: 'tm_1',
      name: 'Alex Rivera (You)',
      email: 'alex@designmaster.co',
      role: 'Owner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'tm_2',
      name: 'Jessica Wu',
      email: 'jessica@designmaster.co',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'tm_3',
      name: 'Marcus Vance',
      email: 'marcus@designmaster.co',
      role: 'Support Agent',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  ],
  plan: {
    name: 'Internal Team Workspace',
    usedDMs: 4820,
    limitDMs: 10000,
  },
};
