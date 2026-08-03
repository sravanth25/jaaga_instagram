import React, { useState, useEffect } from 'react';
import {
  ScreenType,
  Automation,
  Conversation,
  Message,
  LeadContact,
  Broadcast,
  AiSettings,
  AppSettings,
} from './types';
import {
  INITIAL_AUTOMATIONS,
  INITIAL_CONVERSATIONS,
  INITIAL_CONTACTS,
  INITIAL_BROADCASTS,
  INITIAL_AI_SETTINGS,
  INITIAL_APP_SETTINGS,
} from './data/mockData';
import {
  fetchLiveAutomations,
  saveLiveAutomationToSupabase,
  fetchLiveLeads,
  saveLiveLeadToSupabase,
} from './lib/supabase';
import { sendDirectMessage } from './services/instagram';

// Shared Layout Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ComplianceBanner } from './components/ComplianceBanner';
import { ComplianceModal } from './components/ComplianceModal';
import { ConfirmationModal } from './components/ConfirmationModal';

// Screens
import { DashboardScreen } from './components/screens/DashboardScreen';
import { AutomationsListScreen } from './components/screens/AutomationsListScreen';
import { AutomationBuilderScreen } from './components/screens/AutomationBuilderScreen';
import { InboxScreen } from './components/screens/InboxScreen';
import { AiAssistantScreen } from './components/screens/AiAssistantScreen';
import { ContactsScreen } from './components/screens/ContactsScreen';
import { BroadcastsScreen } from './components/screens/BroadcastsScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Data State - strictly starting with live data (no mock objects)
  const [automations, setAutomations] = useState<Automation[]>(() => {
    try {
      const saved = localStorage.getItem('dmflow_automations');
      return saved ? JSON.parse(saved) : INITIAL_AUTOMATIONS;
    } catch {
      return INITIAL_AUTOMATIONS;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('dmflow_conversations');
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [leads, setLeads] = useState<LeadContact[]>(() => {
    try {
      const saved = localStorage.getItem('dmflow_leads');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    try {
      const saved = localStorage.getItem('dmflow_broadcasts');
      return saved ? JSON.parse(saved) : INITIAL_BROADCASTS;
    } catch {
      return INITIAL_BROADCASTS;
    }
  });

  const [aiSettings, setAiSettings] = useState<AiSettings>(INITIAL_AI_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('dmflow_app_settings');
      return saved ? JSON.parse(saved) : INITIAL_APP_SETTINGS;
    } catch {
      return INITIAL_APP_SETTINGS;
    }
  });

  // Sync appSettings to local persistence
  useEffect(() => {
    localStorage.setItem('dmflow_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Sync to local persistence & backend memory on change
  useEffect(() => {
    localStorage.setItem('dmflow_automations', JSON.stringify(automations));
    // Sync to backend rule engine
    fetch('/api/ig/sync-automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automations }),
    }).catch(() => {});
  }, [automations]);

  useEffect(() => {
    localStorage.setItem('dmflow_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('dmflow_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('dmflow_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // Fetch from Supabase if connected
  useEffect(() => {
    async function loadSupabaseLive() {
      const liveAutos = await fetchLiveAutomations();
      if (liveAutos.length > 0) {
        setAutomations(liveAutos);
      }
      const liveLeads = await fetchLiveLeads();
      if (liveLeads.length > 0) {
        setLeads(liveLeads);
      }
    }
    loadSupabaseLive();
  }, []);

  // Poll backend webhook events every 3 seconds to keep Inbox conversations in real-time sync
  useEffect(() => {
    function getHash(str: string) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    }

    const pollWebhookEvents = async () => {
      try {
        const res = await fetch('/api/ig/webhook-events');
        const data = await res.json();
        if (data?.success && Array.isArray(data.events) && data.events.length > 0) {
          const events = data.events;

          setConversations((prevConvs) => {
            let updated = [...prevConvs];
            let changed = false;

            for (const evt of events) {
              if (!evt.senderId || !evt.messageText) continue;
              const rawHandle = String(evt.senderId).replace(/^@/, '').trim();
              if (!rawHandle) continue;
              
              let displayHandle = rawHandle;
              if (/^\d+$/.test(displayHandle)) {
                displayHandle = `ig_user_${displayHandle.slice(-4)}`;
              } else if (displayHandle.startsWith('user_')) {
                displayHandle = `ig_user_${displayHandle.replace('user_', '')}`;
              }
              const cleanHandle = `@${displayHandle.replace(/^@/, '')}`;

              // Find if conversation exists
              const existingIndex = updated.findIndex((c) => {
                const cHandle = c.userHandle.replace(/^@/, '').toLowerCase();
                return (
                  c.id === evt.senderId ||
                  c.id === `conv_${rawHandle}` ||
                  cHandle === rawHandle.toLowerCase() ||
                  cHandle === displayHandle.toLowerCase()
                );
              });

              if (existingIndex >= 0) {
                const existingConv = updated[existingIndex];
                const hasUserMsg = existingConv.messages.some(
                  (m) => m.text === evt.messageText
                );

                if (!hasUserMsg) {
                  changed = true;
                  const newMsgs = [...existingConv.messages];
                  newMsgs.push({
                    id: `m_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    sender: 'user',
                    text: evt.messageText,
                    timestamp: 'Just now',
                  });

                  if (evt.replyText) {
                    newMsgs.push({
                      id: `m_bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      sender: 'bot',
                      text: evt.replyText,
                      timestamp: 'Just now',
                    });
                  }

                  updated[existingIndex] = {
                    ...existingConv,
                    lastMessage: evt.replyText || evt.messageText,
                    timestamp: 'Just now',
                    unread: true,
                    messages: newMsgs,
                    tags: Array.from(
                      new Set([
                        ...(existingConv.tags || []),
                        evt.matchedAutomation || 'Instagram DM',
                      ])
                    ),
                  };
                }
              } else {
                // Create a brand new conversation
                changed = true;
                const newConvId = `conv_${rawHandle}`;
                const initialMsgs: Message[] = [
                  {
                    id: `m_user_${Date.now()}_1`,
                    sender: 'user',
                    text: evt.messageText,
                    timestamp: 'Just now',
                  },
                ];

                if (evt.replyText) {
                  initialMsgs.push({
                    id: `m_bot_${Date.now()}_2`,
                    sender: 'bot',
                    text: evt.replyText,
                    timestamp: 'Just now',
                  });
                }

                const newConv: Conversation = {
                  id: newConvId,
                  userHandle: rawHandle,
                  userName: cleanHandle,
                  avatar: `https://images.unsplash.com/photo-${1534528741775 + (getHash(rawHandle) % 500)}?auto=format&fit=crop&w=150&q=80`,
                  followerCount: '1.2k',
                  lastMessage: evt.replyText || evt.messageText,
                  timestamp: 'Just now',
                  unread: true,
                  mode: 'automated',
                  tags: [evt.matchedAutomation || 'Instagram DM', 'Live Lead'],
                  leadInfo: {
                    email: '',
                    phone: '',
                    status: 'new',
                    capturedAt: new Date().toISOString().split('T')[0],
                  },
                  triggerHistory: [],
                  messages: initialMsgs,
                };

                updated = [newConv, ...updated];
              }
            }

            return changed ? updated : prevConvs;
          });
        }
      } catch (err) {
        // quiet catch
      }
    };

    pollWebhookEvents();
    const interval = setInterval(pollWebhookEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  // Active Selections
  const [automationToEdit, setAutomationToEdit] = useState<Automation | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversations[0]?.id || null
  );

  // Modals state
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Helper to open confirmation modal
  const handleOpenConfirmation = (onConfirm: () => void, title: string, message: string) => {
    setConfirmationState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Automations CRUD handlers
  const handleToggleAutomationStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id
          ? { ...auto, status: auto.status === 'live' ? 'paused' : 'live' }
          : auto
      )
    );
  };

  const handleSaveAutomation = (updated: Automation) => {
    setAutomations((prev) => {
      const exists = prev.some((a) => a.id === updated.id);
      if (exists) {
        return prev.map((a) => (a.id === updated.id ? updated : a));
      }
      return [updated, ...prev];
    });
    saveLiveAutomationToSupabase(updated);
    setAutomationToEdit(null);
  };

  const handleDuplicateAutomation = (automation: Automation) => {
    const duplicated: Automation = {
      ...automation,
      id: `auto_${Date.now()}`,
      title: `${automation.title} (Copy)`,
      status: 'paused',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAutomations((prev) => [duplicated, ...prev]);
  };

  const handleDeleteAutomation = (automation: Automation) => {
    handleOpenConfirmation(
      () => {
        setAutomations((prev) => prev.filter((a) => a.id !== automation.id));
      },
      'Delete Automation Flow',
      `Are you sure you want to permanently delete "${automation.title}"?`
    );
  };

  // Inbox Handlers
  const handleToggleMode = (id: string, mode: 'automated' | 'manual') => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mode } : c))
    );
  };

  const handleSendMessage = (id: string, text: string, sender: 'bot' | 'human') => {
    const newMsg = {
      id: `m_${Date.now()}`,
      sender,
      text,
      timestamp: 'Just now',
    };

    const targetConv = conversations.find((c) => c.id === id);
    if (targetConv) {
      // Dispatch live DM via Instagram Graph API
      sendDirectMessage({
        recipientId: targetConv.userHandle.replace(/^@/, '') || '17841462404931884',
        message: text,
      }).catch((err) => {
        console.warn('Graph API sendDirectMessage background result:', err);
      });

      // If in automated mode and human sent message, trigger automated response simulation
      if (targetConv.mode === 'automated' && sender === 'human') {
        fetch('/api/ig/simulate-incoming-dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: targetConv.userHandle,
            messageText: text,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.replyText) {
              const botMsg = {
                id: `m_bot_${Date.now()}`,
                sender: 'bot' as const,
                text: data.replyText,
                timestamp: 'Just now',
              };
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === id) {
                    return {
                      ...c,
                      lastMessage: data.replyText,
                      timestamp: 'Just now',
                      messages: [...c.messages, newMsg, botMsg],
                    };
                  }
                  return c;
                })
              );
            }
          })
          .catch(() => {});
      }
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            lastMessage: text,
            timestamp: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  const handleUpdateLeadInfo = (id: string, email: string, phone: string, tags: string[]) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            tags,
            leadInfo: {
              ...c.leadInfo,
              email: email || c.leadInfo?.email,
              phone: phone || c.leadInfo?.phone,
              capturedAt: c.leadInfo?.capturedAt || new Date().toISOString().split('T')[0],
            },
          };
        }
        return c;
      })
    );

    // Also update leads CRM list
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setLeads((prev) => {
        const existing = prev.find((l) => l.handle === conv.userHandle);
        if (existing) {
          return prev.map((l) =>
            l.handle === conv.userHandle
              ? { ...l, email, phone, tags }
              : l
          );
        } else {
          return [
            {
              id: `lead_${Date.now()}`,
              handle: conv.userHandle,
              name: conv.userName,
              avatar: conv.avatar,
              email,
              phone,
              sourceAutomation: 'Direct DM',
              status: 'New',
              tags,
              capturedAt: new Date().toISOString().split('T')[0],
              lastActive: new Date().toISOString().split('T')[0],
            },
            ...prev,
          ];
        }
      });
    }
  };

  const handleSelectConversationByHandle = (handle: string) => {
    const found = conversations.find((c) => c.userHandle.toLowerCase() === handle.toLowerCase());
    if (found) {
      setSelectedConversationId(found.id);
    }
  };

  const handleStartLiveTestChat = (userHandle?: string, initialText?: string) => {
    const handle = userHandle || `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const text = initialText || 'hi';
    const newConvId = `conv_${Date.now()}`;

    // Call simulate-incoming-dm on server
    fetch('/api/ig/simulate-incoming-dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: handle, messageText: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        const replyText = data?.replyText || 'Hello, welcome to JaaGa!';
        const newConv: Conversation = {
          id: newConvId,
          userHandle: handle,
          userName: `@${handle}`,
          avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?auto=format&fit=crop&w=150&q=80`,
          followerCount: '1.2k',
          lastMessage: replyText,
          timestamp: 'Just now',
          unread: true,
          mode: 'automated',
          tags: ['Live DM', data?.matchedAutomation || 'Instagram DM'],
          leadInfo: {
            email: '',
            phone: '',
            status: 'new',
            capturedAt: new Date().toISOString(),
          },
          triggerHistory: [],
          messages: [
            {
              id: `m_${Date.now()}_1`,
              sender: 'user',
              text,
              timestamp: 'Just now',
            },
            {
              id: `m_${Date.now()}_2`,
              sender: 'bot',
              text: replyText,
              timestamp: 'Just now',
            },
          ],
        };

        setConversations((prev) => [newConv, ...prev]);
        setSelectedConversationId(newConvId);
        setCurrentScreen('inbox');
      })
      .catch(() => {
        const newConv: Conversation = {
          id: newConvId,
          userHandle: handle,
          userName: `@${handle}`,
          avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?auto=format&fit=crop&w=150&q=80`,
          followerCount: '1.2k',
          lastMessage: text,
          timestamp: 'Just now',
          unread: true,
          mode: 'automated',
          tags: ['Live Lead'],
          leadInfo: {
            email: '',
            phone: '',
            status: 'new',
            capturedAt: new Date().toISOString(),
          },
          triggerHistory: [],
          messages: [
            {
              id: `m_${Date.now()}`,
              sender: 'user',
              text,
              timestamp: 'Just now',
            },
          ],
        };

        setConversations((prev) => [newConv, ...prev]);
        setSelectedConversationId(newConvId);
        setCurrentScreen('inbox');
      });
  };

  // Broadcast Handler
  const handleSaveBroadcast = (broadcast: Broadcast) => {
    setBroadcasts((prev) => [broadcast, ...prev]);
  };

  const unreadMessagesCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Meta Policy Banner */}
      <ComplianceBanner onOpenPolicyModal={() => setShowComplianceModal(true)} />

      {/* Main Header Nav */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          if (screen === 'builder' && currentScreen !== 'builder') {
            setAutomationToEdit(null);
          }
          setCurrentScreen(screen);
        }}
        appSettings={appSettings}
        onOpenComplianceModal={() => setShowComplianceModal(true)}
        onNewAutomation={() => {
          setAutomationToEdit(null);
          setCurrentScreen('builder');
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            if (screen === 'builder' && currentScreen !== 'builder') {
              setAutomationToEdit(null);
            }
            setCurrentScreen(screen);
            setMobileMenuOpen(false);
          }}
          automationsCount={automations.length}
          leadsCount={leads.length}
          unreadMessagesCount={unreadMessagesCount}
          connectedHandle={appSettings.connectedHandle}
          handleAvatar={appSettings.handleAvatar}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {currentScreen === 'dashboard' && (
            <DashboardScreen
              automations={automations}
              conversations={conversations}
              leads={leads}
              onNavigate={setCurrentScreen}
              onToggleAutomationStatus={handleToggleAutomationStatus}
              onStartLiveChat={handleStartLiveTestChat}
              connectedHandle={appSettings.connectedHandle}
            />
          )}

          {currentScreen === 'automations' && (
            <AutomationsListScreen
              automations={automations}
              onNavigate={setCurrentScreen}
              onToggleStatus={handleToggleAutomationStatus}
              onSelectAutomation={(auto) => {
                setAutomationToEdit(auto);
                setCurrentScreen('builder');
              }}
              onDuplicateAutomation={handleDuplicateAutomation}
              onDeleteAutomation={handleDeleteAutomation}
            />
          )}

          {currentScreen === 'builder' && (
            <AutomationBuilderScreen
              automationToEdit={automationToEdit}
              onSaveAutomation={handleSaveAutomation}
              onNavigate={setCurrentScreen}
              onOpenConfirmation={handleOpenConfirmation}
              connectedHandle={appSettings.connectedHandle}
            />
          )}

          {currentScreen === 'inbox' && (
            <InboxScreen
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onToggleMode={handleToggleMode}
              onSendMessage={handleSendMessage}
              onUpdateLeadInfo={handleUpdateLeadInfo}
              onNavigate={setCurrentScreen}
              onStartLiveChat={handleStartLiveTestChat}
              onClearDemoData={() => {
                setConversations([]);
                setSelectedConversationId(null);
                try {
                  localStorage.removeItem('dmflow_conversations');
                } catch {}
              }}
            />
          )}

          {currentScreen === 'ai-assistant' && (
            <AiAssistantScreen
              aiSettings={aiSettings}
              onUpdateAiSettings={setAiSettings}
            />
          )}

          {currentScreen === 'contacts' && (
            <ContactsScreen
              contacts={leads}
              onNavigate={setCurrentScreen}
              onSelectConversation={handleSelectConversationByHandle}
            />
          )}

          {currentScreen === 'broadcasts' && (
            <BroadcastsScreen
              broadcasts={broadcasts}
              onSaveBroadcast={handleSaveBroadcast}
              onNavigate={setCurrentScreen}
              onOpenConfirmation={handleOpenConfirmation}
            />
          )}

          {currentScreen === 'analytics' && (
            <AnalyticsScreen automations={automations} />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              appSettings={appSettings}
              onUpdateSettings={setAppSettings}
              onNavigate={setCurrentScreen}
              onOpenConfirmation={handleOpenConfirmation}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ComplianceModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
      />

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={() => {
          confirmationState.onConfirm();
          setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
