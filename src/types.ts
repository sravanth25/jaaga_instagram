export type ScreenType =
  | 'dashboard'
  | 'my-content'
  | 'automations'
  | 'builder'
  | 'inbox'
  | 'ai-assistant'
  | 'contacts'
  | 'broadcasts'
  | 'analytics'
  | 'settings';

export type TriggerType = 'comment_dm' | 'dm_keyword' | 'story_reply' | 'broadcast';
export type MatchRule = 'exact' | 'contains' | 'any';
export type AutomationStatus = 'live' | 'paused' | 'draft';

export interface IGPost {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  timestamp: string;
  commentsCount: number;
  likesCount: number;
}

export interface DMButton {
  id: string;
  type: 'link' | 'quick_reply';
  label: string;
  url?: string;
}

export interface Automation {
  id: string;
  title: string;
  description: string;
  triggerType: TriggerType;
  status: AutomationStatus;
  selectedPostIds: string[]; // empty array = 'any post'
  keywords: string[];
  matchRule: MatchRule;
  publicCommentReplies: string[];
  dmMessageText: string;
  dmButtons: DMButton[];
  enableFollowUp: boolean;
  followUpText?: string;
  followUpDelayHours?: number;
  conditions: {
    replyOncePerUser: boolean;
    requireFollowing: boolean;
    captureLead: boolean;
  };
  stats: {
    triggersCount: number;
    dmsSent: number;
    leadsCaptured: number;
    ctrPercent: number;
    opened?: number;
    clicked?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'human';
  text: string;
  timestamp: string;
  buttons?: DMButton[];
  isCommentReply?: boolean;
}

export interface Conversation {
  id: string;
  userHandle: string;
  userName: string;
  avatar: string;
  followerCount?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  mode: 'automated' | 'manual';
  tags: string[];
  leadInfo?: {
    email?: string;
    phone?: string;
    status: 'new' | 'qualified' | 'converted' | 'contacted';
    capturedAt?: string;
  };
  notes?: string;
  triggerHistory: Array<{
    automationName: string;
    timestamp: string;
    keywordMatched: string;
  }>;
  messages: Message[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface AiSettings {
  enabled: boolean;
  persona: 'Friendly & Professional' | 'Casual & Helpful' | 'High-Energy Sales' | 'Creator Fan-Focused';
  systemPrompt: string;
  fallbackConfidenceThreshold: number; // e.g. 70%
  fallbackToHumanOnKeywords: string[];
  faqs: FaqItem[];
}

export interface LeadContact {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  sourceAutomation: string;
  status: 'New' | 'Qualified' | 'Converted' | 'Contacted';
  tags: string[];
  capturedAt: string;
  lastActive: string;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  buttons: DMButton[];
  audienceSegment: string;
  scheduleType: 'now' | 'scheduled';
  scheduledFor?: string;
  status: 'sent' | 'scheduled' | 'draft' | 'failed';
  stats: {
    targetUsers: number;
    sent: number;
    failed?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
  };
  errorMessage?: string;
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  appID: string;
  accountID: string;
  accessTokenMasked: string;
  connectedHandle: string;
  handleAvatar: string;
  tokenStatus: string;
  tokenExpiryDays: number;
  rateLimitPerHour: number;
  enforce24hWindow: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Support Agent';
    avatar: string;
  }>;
  plan: {
    name: string;
    usedDMs: number;
    limitDMs: number;
  };
}
