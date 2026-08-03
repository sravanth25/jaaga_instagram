import React, { useState } from 'react';
import { LeadContact, ScreenType } from '../../types';
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

interface ContactsScreenProps {
  contacts: LeadContact[];
  onNavigate: (screen: ScreenType) => void;
  onSelectConversation: (handle: string) => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  contacts,
  onNavigate,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Gather unique tags
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ['Handle', 'Name', 'Email', 'Phone', 'Source Automation', 'Status', 'Tags', 'Captured At'];
    const rows = filteredContacts.map((c) => [
      `@${c.handle}`,
      `"${c.name}"`,
      c.email || 'N/A',
      c.phone || 'N/A',
      `"${c.sourceAutomation}"`,
      c.status,
      `"${c.tags.join(', ')}"`,
      c.capturedAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DMFlow_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="screen-contacts" className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Captured Lead CRM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold border border-green-200">
              {contacts.length} Leads Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follower emails and phone numbers captured directly inside Instagram DM conversations.
          </p>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, handle, email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                Tag: {tag}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Contacted">Contacted</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Contact Profile</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Source Flow</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tags</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No lead contacts captured yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Incoming Instagram DMs with lead details, emails, and phone numbers will automatically populate here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={contact.avatar}
                        alt={contact.handle}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/20"
                      />
                      <div>
                        <div className="font-bold text-slate-900">
                          {contact.name}
                        </div>
                        <div className="text-[11px] text-slate-400">@{contact.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-700">
                    {contact.email || <span className="text-slate-400 italic">Not provided</span>}
                  </td>
                  <td className="p-4 font-mono text-slate-700">
                    {contact.phone || <span className="text-slate-400 italic">Not provided</span>}
                  </td>
                  <td className="p-4 max-w-[200px] truncate text-slate-600">
                    {contact.sourceAutomation}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        contact.status === 'Converted'
                          ? 'bg-green-100 text-green-800'
                          : contact.status === 'Qualified'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {contact.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        onSelectConversation(contact.handle);
                        onNavigate('inbox');
                      }}
                      className="inline-flex items-center gap-1 text-pink-600 hover:underline font-bold text-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open DM</span>
                    </button>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
