/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Check, 
  Users, 
  Bot, 
  Send, 
  Globe, 
  AlertTriangle, 
  RotateCcw, 
  Layers, 
  Sparkles,
  Shield,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole, MASTER_ADMIN_EMAIL } from './types/auth';
import { AuthModal } from './components/AuthModal';
import { TeamManagementModal } from './components/TeamManagementModal';

export interface CarrierApp {
  id: string;
  name: string;
  category: string; // Dynamic tab ID (e.g. 'medicare', 'health', 'life', 'tools', or custom 'tab_...')
  url: string;
  displayUrl: string;
  tagline: string;
  accentColor: string;
  logoLetter: string;
  badge: string;
  logoType: 'crescent' | 'flame' | 'shield' | 'wave' | 'monogram' | 'mountain';
}

export interface HubTab {
  id: string;
  label: string;
  icon?: string;
  isSystem?: boolean;
  description?: string;
}

export interface LeftNavLink {
  id: string;
  label: string;
  icon: string;
  url?: string;
  filterQuery?: string;
  tabCategory?: string;
  isSystem?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  links?: { title: string; url: string }[];
  sources?: { title: string; url: string }[];
}

const DEFAULT_HUB_TABS: HubTab[] = [
  { id: 'all', label: 'All Applications', icon: '📂', isSystem: true },
  { id: 'medicare', label: 'Medicare Hub', icon: '🩺' },
  { id: 'health', label: 'U65 Health Insurance Hub', icon: '🏥' },
  { id: 'life', label: 'Life & Final Expense Hub', icon: '🛡️' },
  { id: 'tools', label: 'Core Agent Tools', icon: '⚙️' }
];

const DEFAULT_NAV_LINKS: LeftNavLink[] = [
  { id: 'home', label: 'Home', icon: '🏠', tabCategory: 'all', isSystem: true },
  { id: 'aep', label: 'AEP MATERIALS 2026', icon: '⚡', tabCategory: 'medicare' },
  { id: 'gtl', label: 'GTL STHHC', icon: '🛡️', filterQuery: 'GTL' },
  { id: 'manhattan', label: 'Manhattan Life HC & ...', icon: '📁', tabCategory: 'life' },
  { id: 'vcc', label: 'VCC Forms', icon: '📋', filterQuery: 'Forms' },
  { id: 'essential', label: 'Essential Links', icon: '✅', tabCategory: 'tools' },
  { id: 'dsnp', label: 'DSNP Check', icon: '💳', filterQuery: 'DSNP' },
  { id: 'aetna', label: 'Aetna', icon: '💜', filterQuery: 'Aetna' },
  { id: 'anthem', label: 'Anthem Family', icon: '🔵', filterQuery: 'Anthem' },
  { id: 'humana', label: 'Humana', icon: '🟢', filterQuery: 'Humana' },
  { id: 'uhc', label: 'UHC', icon: '🔷', filterQuery: 'UnitedHealthcare' },
  { id: 'wellcare', label: 'WellCare', icon: '🌐', filterQuery: 'WellCare' },
  { id: 'zing', label: 'Zing', icon: '🔶', filterQuery: 'Zing' },
  { id: 'hi_res', label: 'HI Resources', icon: '🏠', tabCategory: 'tools' },
  { id: 'sms', label: 'SMS Materials', icon: '🔍', filterQuery: 'SMS' },
  { id: 'exact_care', label: 'Exact Care', icon: '💊', filterQuery: 'Exact' },
  { id: 'signify', label: 'Signify', icon: '🖊️', filterQuery: 'Signify' },
  { id: 'paper_chase', label: 'THE PAPER CHASE CO...', icon: '📜' },
  { id: 'crankwheel', label: 'CRANKWHEEL TRAINI...', icon: '⚙️' },
  { id: 'recycle', label: 'Recycle bin', icon: '🗑️', isSystem: true }
];

const DEFAULT_CARRIERS: CarrierApp[] = [
  {
    id: 'onyx',
    name: 'Onyx CRM',
    category: 'tools',
    url: 'https://app.onyxplatform.com/',
    displayUrl: 'app.onyxplatform.com',
    tagline: 'Producer CRM & Client Record Management',
    accentColor: '#0078d4',
    logoLetter: 'O',
    badge: 'Core Tool',
    logoType: 'crescent'
  },
  {
    id: 'sunfire',
    name: 'Sunfire Matrix',
    category: 'medicare',
    url: 'https://auth.sunfirematrix.com/',
    displayUrl: 'auth.sunfirematrix.com',
    tagline: 'Medicare Quoting & Enrollment Matrix',
    accentColor: '#f76707',
    logoLetter: 'SF',
    badge: 'Enrollment',
    logoType: 'flame'
  },
  {
    id: 'carrier-call-sheets',
    name: '2027 Carrier Call Sheets',
    category: 'tools',
    url: 'https://callsheets.omkarrinsurance.com/',
    displayUrl: 'omkarr-callsheets.internal',
    tagline: 'Broker Support & Expedited Phone Rosters',
    accentColor: '#005a9e',
    logoLetter: 'OIH',
    badge: 'Directory',
    logoType: 'shield'
  },
  {
    id: 'cms',
    name: 'CMS Enterprise Portal',
    category: 'tools',
    url: 'https://portal.cms.gov/',
    displayUrl: 'portal.cms.gov',
    tagline: 'Centers for Medicare & Medicaid Services Portal',
    accentColor: '#004578',
    logoLetter: 'CMS',
    badge: 'Federal Portal',
    logoType: 'wave'
  },
  {
    id: 'athos-ai',
    name: 'Athos AI',
    category: 'tools',
    url: 'https://app.useathos.ai/',
    displayUrl: 'app.useathos.ai',
    tagline: 'Automated Carrier Underwriting Assistance',
    accentColor: '#2b8a3e',
    logoLetter: 'AI',
    badge: 'AI Assistant',
    logoType: 'mountain'
  },
  {
    id: 'humana',
    name: 'Humana Vantage',
    category: 'medicare',
    url: 'https://vantage.humana.com/',
    displayUrl: 'vantage.humana.com',
    tagline: 'Humana Vantage Medicare Advantage & D-SNP Producer Portal',
    accentColor: '#00823B',
    logoLetter: 'H',
    badge: 'MA / MAPD / PDP',
    logoType: 'monogram'
  },
  {
    id: 'aetna',
    name: 'Aetna Producer World',
    category: 'medicare',
    url: 'https://producer.aetna.com/',
    displayUrl: 'producer.aetna.com',
    tagline: 'Producer World Medicare & SilverScript Portal',
    accentColor: '#7D3F98',
    logoLetter: 'A',
    badge: 'Medicare & MedSupp',
    logoType: 'monogram'
  },
  {
    id: 'wellcare',
    name: 'WellCare Workbench',
    category: 'medicare',
    url: 'https://broker.wellcare.com/',
    displayUrl: 'broker.wellcare.com',
    tagline: 'Centene Broker Workbench & Advantage Plans',
    accentColor: '#004B87',
    logoLetter: 'W',
    badge: 'Centene Network',
    logoType: 'monogram'
  },
  {
    id: 'zing-health',
    name: 'Zing Health',
    category: 'medicare',
    url: 'https://www.myzinghealth.com/brokers',
    displayUrl: 'myzinghealth.com/brokers',
    tagline: 'Medicare Advantage HMO & Chronic Special Needs',
    accentColor: '#E84E1B',
    logoLetter: 'Z',
    badge: 'HMO / C-SNP',
    logoType: 'monogram'
  },
  {
    id: 'ambetter',
    name: 'Ambetter Health',
    category: 'health',
    url: 'https://broker.ambetterhealth.com/',
    displayUrl: 'broker.ambetterhealth.com',
    tagline: 'ACA Individual & Family Marketplace Health Plans',
    accentColor: '#00778B',
    logoLetter: 'AM',
    badge: 'ACA Exchange',
    logoType: 'monogram'
  },
  {
    id: 'cigna',
    name: 'Cigna for Brokers',
    category: 'health',
    url: 'https://www.cigna.com/brokers/',
    displayUrl: 'cigna.com/brokers',
    tagline: 'Cigna for Brokers Health & Supplemental',
    accentColor: '#007AA6',
    logoLetter: 'C',
    badge: 'IFP & Dental',
    logoType: 'monogram'
  },
  {
    id: 'unitedhealthcare',
    name: 'UnitedHealthcare (Jarvis)',
    category: 'health',
    url: 'https://www.uhcjarvis.com/',
    displayUrl: 'uhcjarvis.com',
    tagline: 'UHC Jarvis Portal & Golden Rule Exchange',
    accentColor: '#002677',
    logoLetter: 'UHC',
    badge: 'Jarvis Portal',
    logoType: 'monogram'
  },
  {
    id: 'blue-cross',
    name: 'Blue Cross Blue Shield',
    category: 'health',
    url: 'https://www.bcbs.com/',
    displayUrl: 'bcbs.com',
    tagline: 'Nationwide Blue Cross Blue Shield Network Plans',
    accentColor: '#005596',
    logoLetter: 'BC',
    badge: 'Blue Shield',
    logoType: 'monogram'
  },
  {
    id: 'mutual-of-omaha',
    name: 'Mutual of Omaha (SPA)',
    category: 'life',
    url: 'https://www.mutualofomaha.com/broker',
    displayUrl: 'mutualofomaha.com/broker',
    tagline: 'Sales Professional Access (SPA) & Express FE',
    accentColor: '#002F6C',
    logoLetter: 'MO',
    badge: 'Life & Final Exp.',
    logoType: 'monogram'
  },
  {
    id: 'manhattan-life',
    name: 'Manhattan Life',
    category: 'life',
    url: 'https://www.manhattanlife.com/producers',
    displayUrl: 'manhattanlife.com/producers',
    tagline: 'Simplified Issue Final Expense & Supplemental',
    accentColor: '#8C1D40',
    logoLetter: 'ML',
    badge: 'Final Expense',
    logoType: 'monogram'
  },
  {
    id: 'gerber-life',
    name: 'Gerber Life',
    category: 'life',
    url: 'https://www.gerberlife.com/agents',
    displayUrl: 'gerberlife.com/agents',
    tagline: 'Guaranteed Issue Final Expense & Children Plans',
    accentColor: '#003B71',
    logoLetter: 'GL',
    badge: 'Guaranteed Issue',
    logoType: 'monogram'
  }
];

export default function App() {
  // Carrier State
  const [carriers, setCarriers] = useState<CarrierApp[]>(() => {
    try {
      const saved = localStorage.getItem('omkarr_hub_carriers_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CARRIERS;
  });

  // Hub Tabs State (Dynamic Add/Remove Categories Feature)
  const [hubTabs, setHubTabs] = useState<HubTab[]>(() => {
    try {
      const saved = localStorage.getItem('omkarr_hub_tabs_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_HUB_TABS;
  });

  // Left Nav State (Add/Remove feature)
  const [navLinks, setNavLinks] = useState<LeftNavLink[]>(() => {
    try {
      const saved = localStorage.getItem('omkarr_hub_left_nav_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_NAV_LINKS;
  });

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Authentication & Role-Based Access Control State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('admin'); // 'admin' | 'agent'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Sync Auth State & Role with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const emailLower = user.email.toLowerCase();
        if (emailLower === MASTER_ADMIN_EMAIL.toLowerCase()) {
          setUserRole('admin');
        } else {
          try {
            const docId = emailLower.replace(/[^a-z0-9]/g, '_');
            const docSnap = await getDoc(doc(db, 'users', docId));
            if (docSnap.exists() && docSnap.data()?.role) {
              setUserRole(docSnap.data().role as UserRole);
            } else {
              setUserRole('agent');
              await setDoc(doc(db, 'users', docId), {
                email: emailLower,
                role: 'agent',
                createdAt: new Date().toLocaleDateString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          } catch (e) {
            console.error('Error determining role:', e);
            setUserRole('agent');
          }
        }
      } else {
        setUserRole('admin'); // Fallback dev state
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Custom Confirmation Dialog (Replaces blocked window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carrier Modal State
  const [isAddCarrierModalOpen, setIsAddCarrierModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<CarrierApp | null>(null);

  // Tab Modal State (New feature: Add Hub Tab)
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('📑');
  const [newTabDescription, setNewTabDescription] = useState('');

  // Left Nav Modal State
  const [isAddNavModalOpen, setIsAddNavModalOpen] = useState(false);
  const [navFormLabel, setNavFormLabel] = useState('');
  const [navFormIcon, setNavFormIcon] = useState('📌');
  const [navFormUrl, setNavFormUrl] = useState('');
  const [navFormCategory, setNavFormCategory] = useState<string>('medicare');

  // Carrier Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<string>('medicare');
  const [formTagline, setFormTagline] = useState('');
  const [formColor, setFormColor] = useState('#0078d4');
  const [formBadge, setFormBadge] = useState('Active');
  const [formLogoLetter, setFormLogoLetter] = useState('');

  // AI Chat Bot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: 'Hello! I am your Omkarr Insurance Hub AI Assistant. All your carriers, custom tabs, and navigation links are fully indexed in real-time.\n\nAsk me for ANY link (e.g. Humana Vantage, Sunfire Matrix, Aetna Producer World, UHC Jarvis, WellCare, or your custom added links), and I will provide the verified link immediately!',
      timestamp: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Sync with Local Storage
  useEffect(() => {
    localStorage.setItem('omkarr_hub_carriers_v3', JSON.stringify(carriers));
  }, [carriers]);

  useEffect(() => {
    localStorage.setItem('omkarr_hub_tabs_v2', JSON.stringify(hubTabs));
  }, [hubTabs]);

  useEffect(() => {
    localStorage.setItem('omkarr_hub_left_nav_v2', JSON.stringify(navLinks));
  }, [navLinks]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // ==========================================
  // TAB HANDLERS (Add, Edit, Remove Categories)
  // ==========================================
  const handleOpenAddTabModal = () => {
    setNewTabLabel('');
    setNewTabIcon('📑');
    setNewTabDescription('');
    setIsAddTabModalOpen(true);
  };

  const handleSaveNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabLabel.trim()) return;

    // Generate safe unique ID
    const rawId = newTabLabel.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 24);
    const uniqueId = `tab_${rawId}_${Date.now()}`;

    const newTab: HubTab = {
      id: uniqueId,
      label: newTabLabel.trim(),
      icon: newTabIcon.trim() || '📑',
      description: newTabDescription.trim() || undefined,
      isSystem: false
    };

    setHubTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    showToast(`Added new tab "${newTab.label}"`);
    setIsAddTabModalOpen(false);

    // Scroll to applications section
    const el = document.getElementById('applications-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const promptDeleteHubTab = (tab: HubTab) => {
    const carriersInTab = carriers.filter(c => c.category === tab.id).length;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Tab: ${tab.label}`,
      message: `Are you sure you want to remove the "${tab.label}" tab? ${
        carriersInTab > 0 
          ? `${carriersInTab} application(s) currently in this tab will remain available under "All Applications".` 
          : ''
      }`,
      confirmText: 'Delete Tab',
      onConfirm: () => {
        setHubTabs(prev => prev.filter(t => t.id !== tab.id));
        // Move any carrier with this category to 'all' or 'tools'
        setCarriers(prev => prev.map(c => c.category === tab.id ? { ...c, category: 'tools' } : c));
        if (activeTab === tab.id) {
          setActiveTab('all');
        }
        showToast(`Removed tab "${tab.label}"`);
        setConfirmDialog(null);
      }
    });
  };

  const promptResetHubTabs = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Hub Tabs',
      message: 'Restore all categories and tabs back to the original default setup (Medicare, Health, Life, Tools)?',
      confirmText: 'Reset Tabs',
      onConfirm: () => {
        setHubTabs(DEFAULT_HUB_TABS);
        setActiveTab('all');
        localStorage.setItem('omkarr_hub_tabs_v2', JSON.stringify(DEFAULT_HUB_TABS));
        showToast('Hub tabs restored to defaults');
        setConfirmDialog(null);
      }
    });
  };

  // ==========================================
  // CARRIER HANDLERS
  // ==========================================
  const handleOpenAddCarrierModal = () => {
    setEditingCarrier(null);
    setFormName('');
    setFormUrl('https://');
    setFormCategory(activeTab === 'all' ? (hubTabs[1]?.id || 'medicare') : activeTab);
    setFormTagline('');
    setFormColor('#0078d4');
    setFormBadge('Active Portal');
    setFormLogoLetter('');
    setIsAddCarrierModalOpen(true);
  };

  const handleOpenEditCarrierModal = (carrier: CarrierApp) => {
    setEditingCarrier(carrier);
    setFormName(carrier.name);
    setFormUrl(carrier.url);
    setFormCategory(carrier.category);
    setFormTagline(carrier.tagline);
    setFormColor(carrier.accentColor);
    setFormBadge(carrier.badge);
    setFormLogoLetter(carrier.logoLetter);
    setIsAddCarrierModalOpen(true);
  };

  const handleSaveCarrier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    let cleanDisplayUrl = formUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const cleanLetter = formLogoLetter.trim() || formName.trim().substring(0, 2).toUpperCase();

    if (editingCarrier) {
      setCarriers(prev => prev.map(c => c.id === editingCarrier.id ? {
        ...c,
        name: formName.trim(),
        url: formUrl.trim(),
        displayUrl: cleanDisplayUrl,
        category: formCategory,
        tagline: formTagline.trim() || `${formName} Agent Portal`,
        accentColor: formColor,
        badge: formBadge.trim() || 'Active',
        logoLetter: cleanLetter
      } : c));
      showToast(`Updated "${formName}"`);
    } else {
      const newCarrier: CarrierApp = {
        id: 'carrier_' + Date.now(),
        name: formName.trim(),
        url: formUrl.trim(),
        displayUrl: cleanDisplayUrl,
        category: formCategory,
        tagline: formTagline.trim() || `${formName} Agent Portal`,
        accentColor: formColor,
        badge: formBadge.trim() || 'Active',
        logoLetter: cleanLetter,
        logoType: 'monogram'
      };
      setCarriers(prev => [newCarrier, ...prev]);
      showToast(`Added "${formName}" to dashboard`);
    }

    setIsAddCarrierModalOpen(false);
  };

  const promptDeleteCarrier = (carrier: CarrierApp) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Application: ${carrier.name}`,
      message: `Are you sure you want to remove "${carrier.name}" from your Applications grid? You can add it back anytime or reset.`,
      confirmText: 'Delete Carrier',
      onConfirm: () => {
        setCarriers(prev => prev.filter(c => c.id !== carrier.id));
        showToast(`Removed "${carrier.name}"`);
        setConfirmDialog(null);
      }
    });
  };

  const promptResetCarriers = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset All Applications',
      message: 'Restore all carrier portals and tools back to original default settings?',
      confirmText: 'Reset Defaults',
      onConfirm: () => {
        setCarriers(DEFAULT_CARRIERS);
        localStorage.setItem('omkarr_hub_carriers_v3', JSON.stringify(DEFAULT_CARRIERS));
        showToast('Applications reset to defaults');
        setConfirmDialog(null);
      }
    });
  };

  // ==========================================
  // LEFT NAV HANDLERS (Add/Remove)
  // ==========================================
  const handleOpenAddNavModal = () => {
    setNavFormLabel('');
    setNavFormIcon('📌');
    setNavFormUrl('');
    setNavFormCategory(hubTabs[1]?.id || 'medicare');
    setIsAddNavModalOpen(true);
  };

  const handleSaveNavLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navFormLabel.trim()) return;

    const newLink: LeftNavLink = {
      id: 'nav_' + Date.now(),
      label: navFormLabel.trim(),
      icon: navFormIcon.trim() || '📌',
      url: navFormUrl.trim() || undefined,
      tabCategory: navFormCategory
    };

    setNavLinks(prev => [...prev.slice(0, -1), newLink, prev[prev.length - 1]]); // insert before recycle bin
    showToast(`Added "${navFormLabel}" to left navigation`);
    setIsAddNavModalOpen(false);
  };

  const promptDeleteNavLink = (item: LeftNavLink) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove Nav Link: ${item.label}`,
      message: `Are you sure you want to remove "${item.label}" from the left navigation rail?`,
      confirmText: 'Remove Link',
      onConfirm: () => {
        setNavLinks(prev => prev.filter(n => n.id !== item.id));
        showToast(`Removed "${item.label}" from navigation`);
        setConfirmDialog(null);
      }
    });
  };

  const promptResetNavLinks = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Navigation Menu',
      message: 'Restore all left navigation links back to original defaults?',
      confirmText: 'Reset Navigation',
      onConfirm: () => {
        setNavLinks(DEFAULT_NAV_LINKS);
        localStorage.setItem('omkarr_hub_left_nav_v2', JSON.stringify(DEFAULT_NAV_LINKS));
        showToast('Left navigation reset to defaults');
        setConfirmDialog(null);
      }
    });
  };

  const handleNavLinkClick = (item: LeftNavLink) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.tabCategory) {
      setActiveTab(item.tabCategory);
      setSearchQuery('');
      const el = document.getElementById('applications-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (item.filterQuery) {
      setSearchQuery(item.filterQuery);
      setActiveTab('all');
      const el = document.getElementById('applications-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (item.id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveTab('all');
      setSearchQuery('');
    }
  };

  // ==========================================
  // CHAT BOT QUERY HANDLER (Accurate Link Finding)
  // ==========================================
  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })),
          carriers: carriers.map(c => ({ 
            name: c.name, 
            url: c.url, 
            tagline: c.tagline, 
            category: c.category, 
            badge: c.badge 
          })),
          tabs: hubTabs.map(t => ({ id: t.id, label: t.label })),
          navLinks: navLinks.map(n => ({ label: n.label, url: n.url, tabCategory: n.tabCategory }))
        })
      });

      const data = await response.json();
      const replyText = data?.reply || 'I am ready to help you find any carrier portal link or answer questions.';
      
      // Extract and sanitize clean links
      const urlRegex = /(https?:\/\/[^\s)<>"']+)/g;
      const rawMatches = replyText.match(urlRegex) || [];
      const cleanedLinks: { title: string; url: string }[] = [];
      const seenUrls = new Set<string>();

      // Priority 1: Web sources from backend
      if (Array.isArray(data?.webSources)) {
        for (const src of data.webSources) {
          if (src?.url && !seenUrls.has(src.url)) {
            seenUrls.add(src.url);
            cleanedLinks.push({ title: src.title || 'Open Portal', url: src.url });
          }
        }
      }

      // Priority 2: Sanitized URLs found in response text
      for (const raw of rawMatches) {
        const clean = raw.replace(/[.,;:!?)\>"']+$/, '').trim();
        if (clean && !seenUrls.has(clean) && !clean.includes('google.com')) {
          seenUrls.add(clean);
          let title = 'Open Portal';
          try {
            const parsed = new URL(clean);
            const host = parsed.hostname.replace('www.', '');
            // Check matching in user carriers
            const matchingCarrier = carriers.find(c => c.url.includes(host) || clean.includes(c.displayUrl));
            if (matchingCarrier) {
              title = matchingCarrier.name;
            } else if (host.includes('humana')) title = 'Humana Vantage';
            else if (host.includes('sunfire')) title = 'Sunfire Matrix';
            else if (host.includes('aetna')) title = 'Aetna Producer World';
            else if (host.includes('wellcare')) title = 'WellCare Workbench';
            else if (host.includes('uhc') || host.includes('jarvis')) title = 'UHC Jarvis';
            else if (host.includes('ambetter')) title = 'Ambetter Health';
            else if (host.includes('cigna')) title = 'Cigna for Brokers';
            else if (host.includes('mutualofomaha')) title = 'Mutual of Omaha';
            else if (host.includes('manhattanlife')) title = 'Manhattan Life';
            else if (host.includes('gerberlife')) title = 'Gerber Life';
            else if (host.includes('zinghealth')) title = 'Zing Health';
            else if (host.includes('onyxplatform')) title = 'Onyx CRM';
            else if (host.includes('cms.gov')) title = 'CMS Enterprise Portal';
            else title = host;
          } catch (e) {}
          cleanedLinks.push({ title, url: clean });
        }
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        links: cleanedLinks.length > 0 ? cleanedLinks : undefined,
        sources: Array.isArray(data?.webSources) && data.webSources.length > 0 ? data.webSources : undefined
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      // Client-side fallback matching
      const query = userMsg.text.toLowerCase();
      const matchedCarrier = carriers.find(c => query.includes(c.name.toLowerCase()));
      
      if (matchedCarrier) {
        setChatMessages(prev => [...prev, {
          id: 'bot_fallback_' + Date.now(),
          sender: 'assistant',
          text: `Here is the verified link for **${matchedCarrier.name}**:\n\n- **Direct URL:** \`${matchedCarrier.url}\`\n- **Category:** ${matchedCarrier.category.toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          links: [{ title: matchedCarrier.name, url: matchedCarrier.url }]
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: 'bot_err_' + Date.now(),
          sender: 'assistant',
          text: 'I could not connect to the server, but you can find all carrier links directly on your dashboard grid.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filter carriers based on active tab and search query
  const filteredCarriers = carriers.filter(c => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.displayUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Render stylized card logo
  const renderCardGraphic = (carrier: CarrierApp) => {
    if (carrier.logoType === 'crescent') {
      return (
        <div className="sp-logo-box" style={{ background: '#001a33' }}>
          <div className="sp-graphic-crescent"></div>
        </div>
      );
    }
    if (carrier.logoType === 'flame') {
      return (
        <div className="sp-logo-box" style={{ background: '#ffffff', border: '1px solid #f0f0f0' }}>
          <div className="sp-graphic-flame">🔥</div>
        </div>
      );
    }
    if (carrier.logoType === 'shield') {
      return (
        <div className="sp-logo-box" style={{ background: '#005a9e' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>OIH</span>
        </div>
      );
    }
    if (carrier.logoType === 'wave') {
      return (
        <div className="sp-logo-box" style={{ background: '#003366' }}>
          <div className="sp-graphic-wave"></div>
          <span style={{ position: 'relative', zIndex: 2, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>CMS</span>
        </div>
      );
    }
    if (carrier.logoType === 'mountain') {
      return (
        <div className="sp-logo-box" style={{ background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
          <div className="sp-graphic-mountain">⛰️</div>
        </div>
      );
    }
    return (
      <div className="sp-logo-box" style={{ background: carrier.accentColor }}>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
          {carrier.logoLetter || carrier.name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  const currentTabObj = hubTabs.find(t => t.id === activeTab);

  return (
    <div className="sp-root-container">
      {/* Embedded CSS Design System */}
      <style>{`
        :root {
          --sp-navy: #002050;
          --sp-navy-rich: #0b2545;
          --sp-theme: #0078d4;
          --sp-theme-dark: #005a9e;
          --sp-bg-canvas: #f3f2f1;
          --sp-border: #edebe9;
          --sp-border-card: #e1dfdd;
          --sp-text-main: #201f1e;
          --sp-text-muted: #605e5c;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: var(--sp-bg-canvas);
          color: var(--sp-text-main);
          -webkit-font-smoothing: antialiased;
        }

        .sp-root-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Top Suite Bar */
        .sp-suite-bar {
          background-color: var(--sp-navy);
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: #ffffff;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .sp-suite-left { display: flex; align-items: center; gap: 16px; }
        .sp-waffle-icon {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          width: 17px;
          height: 17px;
          cursor: pointer;
        }
        .sp-waffle-dot { width: 3.5px; height: 3.5px; background: #ffffff; border-radius: 0.5px; }
        .sp-suite-app-name { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; }

        .sp-suite-center { flex: 1; max-width: 480px; margin: 0 20px; }
        .sp-suite-search {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 6px 12px;
          gap: 8px;
        }
        .sp-suite-search input {
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 13px;
          width: 100%;
        }
        .sp-suite-search input::placeholder { color: rgba(255, 255, 255, 0.75); }

        .sp-suite-right { display: flex; align-items: center; gap: 14px; }
        .sp-suite-logo-img {
          width: 26px;
          height: 26px;
          border-radius: 4px;
          object-fit: cover;
          border: 1px solid #d4af37;
        }
        .sp-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0078d4;
          color: #ffffff;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        /* Site Header */
        .sp-site-header {
          background: #ffffff;
          border-bottom: 1px solid var(--sp-border);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sp-site-brand-group { display: flex; align-items: center; gap: 14px; }
        .sp-site-logo-img {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          object-fit: cover;
          border: 2px solid #d4af37;
          box-shadow: 0 3px 10px rgba(0, 32, 80, 0.2);
          background: #001938;
        }
        .sp-site-name-wrap h1 { font-size: 19px; font-weight: 700; color: var(--sp-navy); line-height: 1.2; letter-spacing: -0.2px; }
        .sp-site-group-tag { font-size: 12px; color: var(--sp-text-muted); }

        .sp-banner-logo-badge {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid #d4af37;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
          background: #001938;
          flex-shrink: 0;
        }

        .sp-site-actions { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--sp-text-muted); }
        .sp-site-act-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 3px;
        }
        .sp-site-act-btn:hover { background: #f3f2f1; color: var(--sp-theme); }

        /* Main Workspace: Left Sidebar + Center Body */
        .sp-layout-body {
          display: flex;
          flex: 1;
        }

        /* Left Navigation Rail */
        .sp-left-nav {
          width: 250px;
          background: #ffffff;
          border-right: 1px solid var(--sp-border);
          padding: 14px 0 30px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 900px) {
          .sp-left-nav { display: none; }
        }

        .sp-nav-section-title {
          padding: 0 16px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--sp-text-muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sp-nav-items-container {
          flex: 1;
          overflow-y: auto;
        }

        .sp-nav-link-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--sp-text-main);
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
        }
        .sp-nav-link-row:hover {
          background: #f3f2f1;
          color: var(--sp-theme);
        }
        .sp-nav-link-content {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .sp-nav-delete-btn {
          opacity: 0.7;
          background: transparent;
          border: none;
          color: #8a8886;
          padding: 4px 6px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-nav-link-row:hover .sp-nav-delete-btn {
          opacity: 1;
          color: #d13438;
        }
        .sp-nav-delete-btn:hover {
          color: #ffffff !important;
          background: #d13438 !important;
        }

        .sp-left-nav-footer {
          padding: 12px 14px;
          border-top: 1px solid var(--sp-border);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sp-add-nav-btn {
          background: #f3f2f1;
          border: 1px dashed var(--sp-border-card);
          color: var(--sp-navy);
          font-size: 12.5px;
          font-weight: 600;
          padding: 7px 10px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .sp-add-nav-btn:hover {
          background: #e1dfdd;
          color: var(--sp-theme);
          border-color: var(--sp-theme);
        }

        .sp-reset-nav-btn {
          background: transparent;
          border: none;
          color: var(--sp-text-muted);
          font-size: 11.5px;
          cursor: pointer;
          text-align: center;
          padding: 4px;
        }
        .sp-reset-nav-btn:hover {
          color: var(--sp-navy);
          text-decoration: underline;
        }

        /* Center Main Viewport */
        .sp-main-viewport {
          flex: 1;
          padding: 20px 24px 48px;
          max-width: 1400px;
        }

        /* Top Welcome Banner with Skyline Photo */
        .sp-skyline-banner {
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          margin-bottom: 24px;
          min-height: 240px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-image: linear-gradient(to right, rgba(0, 25, 55, 0.95) 0%, rgba(0, 32, 80, 0.88) 42%, rgba(0, 45, 95, 0.45) 75%, rgba(0, 20, 50, 0.2) 100%), url('/src/assets/images/skyline_dusk_waterfront_1791210959694.jpg');
          background-size: cover;
          background-position: center right;
          padding: 30px 32px 22px;
          color: #ffffff;
        }

        .sp-banner-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .sp-welcome-pre { font-size: 19px; font-weight: 500; color: #ffffff; margin-bottom: 2px; }
        .sp-welcome-brand {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .sp-welcome-sub-cyan {
          font-size: 13px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .sp-welcome-sub-desc {
          font-size: 14.5px;
          color: #e0f2fe;
          max-width: 580px;
          line-height: 1.45;
        }

        /* Weather box in banner */
        .sp-banner-weather-box {
          background: rgba(0, 20, 50, 0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 4px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #ffffff;
        }
        .sp-weather-degrees {
          font-size: 26px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Horizontal 4 Shortcut Tiles */
        .sp-shortcut-strip {
          display: flex;
          gap: 14px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .sp-shortcut-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(6px);
          padding: 8px 16px;
          border-radius: 4px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .sp-shortcut-item:hover {
          background: rgba(255, 255, 255, 0.26);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        /* Dynamic Navigation Tabs Row with Add/Remove Feature */
        .sp-tabs-toolbar {
          background: #ffffff;
          border: 1px solid var(--sp-border-card);
          border-radius: 4px;
          padding: 8px 12px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .sp-tabs-group {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          align-items: center;
          padding-bottom: 2px;
        }
        .sp-tab-btn-wrapper {
          display: inline-flex;
          align-items: center;
          position: relative;
        }
        .sp-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          padding: 8px 14px;
          border-radius: 4px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--sp-text-main);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sp-tab-btn:hover { background: #f3f2f1; color: var(--sp-theme); }
        .sp-tab-btn.active {
          background: var(--sp-navy);
          color: #ffffff;
        }
        .sp-tab-count {
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 10px;
          background: rgba(0,0,0,0.08);
        }
        .sp-tab-btn.active .sp-tab-count {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
        }

        /* Delete button on custom tab */
        .sp-tab-del-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(0,0,0,0.1);
          color: inherit;
          font-size: 11px;
          margin-left: 4px;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.15s;
        }
        .sp-tab-del-icon:hover {
          opacity: 1;
          background: #d13438;
          color: #ffffff;
        }
        .sp-tab-btn.active .sp-tab-del-icon {
          background: rgba(255,255,255,0.25);
        }
        .sp-tab-btn.active .sp-tab-del-icon:hover {
          background: #d13438;
          color: #ffffff;
        }

        .sp-add-tab-btn {
          background: #f3f2f1;
          border: 1px dashed var(--sp-theme);
          color: var(--sp-theme);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .sp-add-tab-btn:hover {
          background: #eff6fc;
          border-color: var(--sp-theme-dark);
          color: var(--sp-theme-dark);
        }

        .sp-toolbar-actions { display: flex; align-items: center; gap: 8px; }
        .sp-add-carrier-btn {
          background: var(--sp-theme);
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s;
        }
        .sp-add-carrier-btn:hover { background: #005a9e; }

        .sp-reset-btn {
          background: #ffffff;
          border: 1px solid var(--sp-border-card);
          color: var(--sp-text-muted);
          padding: 7px 10px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .sp-reset-btn:hover { background: #f3f2f1; color: var(--sp-navy); }

        /* Applications Section */
        .sp-apps-section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .sp-apps-title-group h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--sp-navy);
        }
        .sp-apps-title-group p {
          font-size: 13.5px;
          color: var(--sp-text-muted);
        }

        /* 3-Column Applications Grid */
        .sp-apps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .sp-apps-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .sp-apps-grid { grid-template-columns: 1fr; }
        }

        /* Modern Card */
        .sp-app-card {
          background: #ffffff;
          border: 1px solid var(--sp-border-card);
          border-radius: 4px;
          padding: 16px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,0.06);
          transition: all 0.2s;
          position: relative;
        }
        .sp-app-card:hover {
          box-shadow: 0 4px 12px 0 rgba(0,0,0,0.12);
          border-color: #c8c6c4;
          transform: translateY(-1px);
        }

        .sp-card-info-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .sp-card-app-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--sp-navy);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-card-url-link {
          font-size: 12px;
          color: var(--sp-text-muted);
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .sp-card-url-link:hover { color: var(--sp-theme); text-decoration: underline; }

        .sp-card-tagline {
          font-size: 11.5px;
          color: #797775;
          line-height: 1.35;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .sp-card-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }

        .sp-open-btn {
          background: #ffffff;
          border: 1px solid #8a8886;
          border-radius: 2px;
          padding: 4px 12px;
          font-size: 12.5px;
          font-weight: 600;
          color: #323130;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.15s;
        }
        .sp-open-btn:hover {
          background: var(--sp-theme);
          color: #ffffff;
          border-color: var(--sp-theme);
        }

        .sp-card-icon-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #605e5c;
          padding: 4px 6px;
          border-radius: 2px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .sp-card-icon-btn:hover {
          background: #f3f2f1;
          color: var(--sp-navy);
          border-color: #edebe9;
        }
        .sp-card-icon-btn.delete:hover {
          background: #fde7e9;
          color: #d13438;
          border-color: #f8c0c4;
        }

        .sp-card-graphic-side {
          width: 84px;
          height: 84px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sp-logo-box {
          width: 78px;
          height: 78px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }

        .sp-graphic-crescent {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 5px solid #0078d4;
          border-right-color: transparent;
          border-bottom-color: transparent;
          transform: rotate(45deg);
        }

        .sp-graphic-flame { font-size: 34px; line-height: 1; }

        .sp-graphic-wave {
          position: absolute;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle at 70% 30%, #0078d4 15%, transparent 60%);
        }

        .sp-graphic-mountain { font-size: 34px; }

        /* Floating AI Chat Bot Launcher Button */
        .sp-chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, #002050 0%, #0078d4 100%);
          color: #ffffff;
          border: none;
          border-radius: 28px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0, 32, 80, 0.35);
          z-index: 1500;
          transition: all 0.2s ease;
        }
        .sp-chat-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(0, 32, 80, 0.45);
        }
        .sp-chat-fab-pulse {
          position: absolute;
          width: 10px;
          height: 10px;
          top: 10px;
          right: 12px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
        }

        /* Expandable AI Chat Bot Window */
        .sp-chat-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 440px;
          height: 600px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 48px);
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 16px 48px rgba(0, 32, 80, 0.28), 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid var(--sp-border-card);
          display: flex;
          flex-direction: column;
          z-index: 1600;
          overflow: hidden;
          animation: spSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes spSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sp-chat-header {
          background: #002050;
          color: #ffffff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-chat-header-title { display: flex; align-items: center; gap: 10px; }
        .sp-chat-bot-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0078d4;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-chat-header-actions { display: flex; align-items: center; gap: 8px; }
        .sp-chat-hdr-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          opacity: 0.8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .sp-chat-hdr-btn:hover { opacity: 1; background: rgba(255, 255, 255, 0.15); }

        .sp-chat-search-badge {
          background: #f0fdf4;
          color: #166534;
          border-bottom: 1px solid #bbf7d0;
          padding: 6px 14px;
          font-size: 11.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sp-chat-suggestions {
          padding: 8px 12px;
          background: #f8fafc;
          border-bottom: 1px solid var(--sp-border);
          display: flex;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .sp-chip-prompt {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 3px 10px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--sp-navy);
          cursor: pointer;
          transition: all 0.15s;
        }
        .sp-chip-prompt:hover {
          background: #eff6fc;
          border-color: var(--sp-theme);
          color: var(--sp-theme);
        }

        .sp-chat-messages-area {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #faf9f8;
        }

        .sp-chat-bubble {
          max-width: 88%;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        }
        .sp-chat-bubble.user {
          align-self: flex-end;
          background: #002050;
          color: #ffffff;
          border-bottom-right-radius: 2px;
        }
        .sp-chat-bubble.assistant {
          align-self: flex-start;
          background: #ffffff;
          color: var(--sp-text-main);
          border: 1px solid var(--sp-border-card);
          border-bottom-left-radius: 2px;
          box-shadow: 0 1.6px 3.6px rgba(0,0,0,0.06);
        }
        .sp-chat-time {
          font-size: 10px;
          opacity: 0.65;
          margin-top: 6px;
          text-align: right;
        }

        /* Direct Clickable Portal Action Button in Chat */
        .sp-chat-link-btn {
          margin-top: 8px;
          background: #0078d4;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s;
        }
        .sp-chat-link-btn:hover {
          background: #005a9e;
          color: #ffffff;
        }

        .sp-chat-sources-block {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed #edebe9;
          font-size: 11.5px;
          color: #605e5c;
        }
        .sp-chat-sources-title {
          font-weight: 600;
          color: var(--sp-navy);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        .sp-source-link {
          display: block;
          color: var(--sp-theme);
          text-decoration: none;
          margin-bottom: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sp-source-link:hover { text-decoration: underline; }

        .sp-chat-input-row {
          padding: 12px;
          background: #ffffff;
          border-top: 1px solid var(--sp-border);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sp-chat-input {
          flex: 1;
          padding: 9px 12px;
          border: 1px solid var(--sp-border-card);
          border-radius: 4px;
          font-size: 13px;
          outline: none;
        }
        .sp-chat-input:focus { border-color: var(--sp-theme); }
        .sp-chat-send-btn {
          background: var(--sp-theme);
          color: #ffffff;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sp-chat-send-btn:hover { background: #005a9e; }
        .sp-chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Custom Confirmation Modal (Never blocked by iframe sandbox) */
        .sp-confirm-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 16px;
        }
        .sp-confirm-box {
          background: #ffffff;
          width: 100%;
          max-width: 440px;
          border-radius: 6px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
          border: 1px solid var(--sp-border-card);
          overflow: hidden;
          animation: spPop 0.18s ease-out;
        }
        @keyframes spPop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .sp-confirm-header {
          padding: 16px 20px;
          background: #faf9f8;
          border-bottom: 1px solid var(--sp-border);
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--sp-navy);
          font-size: 15px;
          font-weight: 700;
        }
        .sp-confirm-body {
          padding: 20px;
          font-size: 13.5px;
          color: #323130;
          line-height: 1.5;
        }
        .sp-confirm-footer {
          padding: 12px 20px;
          background: #faf9f8;
          border-top: 1px solid var(--sp-border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .sp-confirm-del-btn {
          background: #d13438;
          color: #ffffff;
          border: none;
          padding: 7px 16px;
          border-radius: 3px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .sp-confirm-del-btn:hover { background: #a80000; }

        /* Floating Toast */
        .sp-toast-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #002050;
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 600;
          z-index: 2500;
          animation: spToastIn 0.2s ease-out;
        }
        @keyframes spToastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Generic Modal */
        .sp-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1800;
          padding: 16px;
        }
        .sp-modal-content {
          background: #ffffff;
          width: 100%;
          max-width: 520px;
          border-radius: 6px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: spPop 0.18s ease-out;
        }
        .sp-modal-header {
          background: #002050;
          color: #ffffff;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-modal-form { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .sp-form-group { display: flex; flex-direction: column; gap: 5px; }
        .sp-form-group label { font-size: 12.5px; font-weight: 600; color: #323130; }
        .sp-form-input, .sp-form-select {
          padding: 8px 12px;
          border: 1px solid var(--sp-border-card);
          border-radius: 4px;
          font-size: 13px;
          outline: none;
        }
        .sp-form-input:focus, .sp-form-select:focus { border-color: var(--sp-theme); }
        .sp-modal-footer {
          padding: 14px 20px;
          background: #faf9f8;
          border-top: 1px solid var(--sp-border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .sp-btn-secondary {
          background: #ffffff;
          border: 1px solid var(--sp-border-card);
          color: #323130;
          padding: 7px 16px;
          border-radius: 3px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .sp-btn-secondary:hover { background: #f3f2f1; }
        .sp-btn-primary {
          background: var(--sp-theme);
          color: #ffffff;
          border: none;
          padding: 7px 18px;
          border-radius: 3px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .sp-btn-primary:hover { background: #005a9e; }
      `}</style>

      {/* TOP SUITE BAR */}
      <header className="sp-suite-bar">
        <div className="sp-suite-left">
          <img 
            src="/src/assets/images/omkarr_insurance_logo_1791216978459.jpg" 
            alt="Omkarr Logo" 
            className="sp-suite-logo-img" 
          />
          <span className="sp-suite-app-name">Omkarr Insurance Hub</span>
        </div>

        <div className="sp-suite-center">
          <div className="sp-suite-search">
            <Search size={14} color="#ffffff" style={{ opacity: 0.8 }} />
            <input 
              type="text" 
              placeholder="Search carriers, links, tabs, or portals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <X size={14} color="#ffffff" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>
        </div>

        <div className="sp-suite-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentUser ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="sp-avatar-circle" title={currentUser.email || 'User'}>
                  {(currentUser.email || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.email}
                  </span>
                  <span style={{ 
                    fontSize: '9.5px', 
                    fontWeight: 700, 
                    color: userRole === 'admin' ? '#fde047' : '#94a3b8',
                    textTransform: 'uppercase'
                  }}>
                    {userRole === 'admin' ? '🛡️ Admin' : '👤 Agent (View)'}
                  </span>
                </div>
              </div>

              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Manage team members and roles"
                >
                  <Users size={13} />
                  <span>Team</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => signOut(auth)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                background: '#0078d4',
                border: 'none',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* SITE HEADER */}
      <div className="sp-site-header">
        <div className="sp-site-brand-group">
          <img 
            src="/src/assets/images/omkarr_insurance_logo_1791216978459.jpg" 
            alt="Omkarr Insurance Logo" 
            className="sp-site-logo-img" 
          />
          <div className="sp-site-name-wrap">
            <h1>Omkarr Insurance</h1>
            <div className="sp-site-group-tag">Protection You Can Trust For Life · Internal Agent Portal</div>
          </div>
        </div>

        <div className="sp-site-actions">
          <div className="sp-site-act-btn" onClick={() => setIsChatOpen(true)}>
            <Bot size={15} color="#0078d4" />
            <span>AI Assistant</span>
          </div>

          {/* Admin vs Agent Role Gate */}
          {userRole === 'admin' ? (
            <>
              <div className="sp-site-act-btn" onClick={() => setIsTeamModalOpen(true)}>
                <Shield size={15} color="#0078d4" />
                <span>Team & Roles</span>
              </div>
              <div className="sp-site-act-btn" onClick={handleOpenAddTabModal}>
                <Layers size={15} color="#0078d4" />
                <span>+ Add Hub Tab</span>
              </div>
              <div className="sp-site-act-btn" onClick={handleOpenAddCarrierModal}>
                <Plus size={15} color="#0078d4" />
                <span>+ Add Carrier</span>
              </div>
            </>
          ) : (
            <span style={{ 
              background: '#f1f5f9', 
              color: '#334155', 
              border: '1px solid #cbd5e1', 
              fontSize: '12px', 
              fontWeight: 600, 
              padding: '5px 12px', 
              borderRadius: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <UserCheck size={14} color="#0078d4" />
              <span>Agent View-Only Mode</span>
            </span>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE BODY */}
      <div className="sp-layout-body">
        {/* LEFT NAVIGATION RAIL */}
        <aside className="sp-left-nav" aria-label="Quick Launch Navigation">
          <div className="sp-nav-section-title">
            <span>Navigation Links</span>
            <span style={{ fontSize: '10px', color: '#8a8886' }}>{navLinks.length} items</span>
          </div>

          <div className="sp-nav-items-container">
            {navLinks.map((item) => (
              <div 
                key={item.id} 
                className="sp-nav-link-row"
                onClick={() => handleNavLinkClick(item)}
                title={item.url ? `Opens ${item.url}` : `Filter: ${item.label}`}
              >
                <div className="sp-nav-link-content">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {/* In-App Delete Button - Admin Only */}
                {!item.isSystem && userRole === 'admin' && (
                  <button 
                    type="button" 
                    className="sp-nav-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      promptDeleteNavLink(item);
                    }}
                    title={`Delete tab: ${item.label}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Left Nav Actions: Add Link & Reset - Admin Only */}
          {userRole === 'admin' && (
            <div className="sp-left-nav-footer">
              <button 
                type="button" 
                className="sp-add-nav-btn"
                onClick={handleOpenAddNavModal}
                title="Add a custom tab or quick link to left side"
              >
                <Plus size={14} />
                <span>Add Left Link</span>
              </button>
              <button 
                type="button" 
                className="sp-reset-nav-btn"
                onClick={promptResetNavLinks}
              >
                Reset Left Menu
              </button>
            </div>
          )}
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="sp-main-viewport">
          {/* TOP WELCOME BANNER */}
          <section className="sp-skyline-banner" aria-label="Welcome Banner">
            <div className="sp-banner-top-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img 
                  src="/src/assets/images/omkarr_insurance_logo_1791216978459.jpg" 
                  alt="Omkarr Insurance" 
                  className="sp-banner-logo-badge" 
                />
                <div>
                  <div className="sp-welcome-pre">Welcome to</div>
                  <h2 className="sp-welcome-brand">Omkarr Insurance Hub</h2>
                  <div className="sp-welcome-sub-cyan">PROTECTION YOU CAN TRUST FOR LIFE.</div>
                  <p className="sp-welcome-sub-desc">
                    Everything you need to serve our clients, compare carrier plans, and succeed.
                  </p>
                </div>
              </div>

              {/* Weather Widget */}
              <div className="sp-banner-weather-box">
                <div className="sp-weather-degrees">
                  <span>82°F</span>
                  <span style={{ fontSize: '20px' }}>⛅</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Tampa, FL</div>
                  <div style={{ opacity: 0.85 }}>Mostly cloudy · Local Weather</div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="sp-shortcut-strip">
              <div 
                className="sp-shortcut-item" 
                onClick={() => {
                  const el = document.getElementById('applications-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Users size={16} color="#38bdf8" />
                <span>Go to Carrier Portals ({carriers.length})</span>
              </div>
              <div 
                className="sp-shortcut-item" 
                onClick={() => setIsChatOpen(true)}
              >
                <Bot size={16} color="#38bdf8" />
                <span>Ask AI Assistant for Links</span>
              </div>
            </div>
          </section>

          {/* DYNAMIC NAVIGATION TABS & CARRIER TOOLBAR */}
          <section className="sp-tabs-toolbar">
            <div className="sp-tabs-group" role="tablist">
              {hubTabs.map(tab => {
                const count = tab.id === 'all' 
                  ? carriers.length 
                  : carriers.filter(c => c.category === tab.id).length;

                return (
                  <div key={tab.id} className="sp-tab-btn-wrapper">
                    <button 
                      type="button"
                      className={`sp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.description || tab.label}
                    >
                      {tab.icon && <span>{tab.icon}</span>}
                      <span>{tab.label}</span>
                      <span className="sp-tab-count">{count}</span>

                      {/* Delete icon for non-system custom tabs - Admin Only */}
                      {!tab.isSystem && userRole === 'admin' && (
                        <span 
                          className="sp-tab-del-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteHubTab(tab);
                          }}
                          title={`Remove ${tab.label} tab`}
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Add New Tab Button - Admin Only */}
              {userRole === 'admin' && (
                <button 
                  type="button"
                  className="sp-add-tab-btn"
                  onClick={handleOpenAddTabModal}
                  title="Create a new custom category tab"
                >
                  <Plus size={14} />
                  <span>Add Tab</span>
                </button>
              )}
            </div>

            {/* Toolbar Actions - Admin Only */}
            {userRole === 'admin' ? (
              <div className="sp-toolbar-actions">
                <button 
                  type="button" 
                  className="sp-add-carrier-btn"
                  onClick={handleOpenAddCarrierModal}
                  title="Add a new carrier or application"
                >
                  <Plus size={16} />
                  <span>Add Carrier</span>
                </button>
                <button 
                  type="button" 
                  className="sp-reset-btn"
                  onClick={promptResetCarriers}
                  title="Reset back to default carriers"
                >
                  <RotateCcw size={13} />
                  <span>Reset Carriers</span>
                </button>
                <button 
                  type="button" 
                  className="sp-reset-btn"
                  onClick={promptResetHubTabs}
                  title="Reset back to default hub tabs"
                >
                  <span>Reset Tabs</span>
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                Browsing in agent view-only mode
              </div>
            )}
          </section>

          {/* APPLICATIONS SECTION */}
          <section id="applications-section">
            <div className="sp-apps-section-header">
              <div className="sp-apps-title-group">
                <h2>
                  Applications {currentTabObj && currentTabObj.id !== 'all' ? `· ${currentTabObj.label}` : ''}
                </h2>
                <p>The tools and portals you use every day.</p>
              </div>
              <div 
                style={{ fontSize: '13px', color: '#0078d4', fontWeight: 600, cursor: 'pointer' }} 
                onClick={() => setActiveTab('all')}
              >
                See all ({carriers.length})
              </div>
            </div>

            {/* 3-Column Applications Grid */}
            <div className="sp-apps-grid">
              {filteredCarriers.map((carrier) => (
                <article key={carrier.id} className="sp-app-card">
                  <div className="sp-card-info-side">
                    <h3 className="sp-card-app-title" title={carrier.name}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: carrier.accentColor }}></span>
                      {carrier.name}
                    </h3>
                    <a 
                      href={carrier.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="sp-card-url-link"
                      title={carrier.url}
                    >
                      {carrier.displayUrl}
                    </a>
                    <p className="sp-card-tagline">{carrier.tagline}</p>

                    <div className="sp-card-actions-row">
                      <a 
                        href={carrier.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="sp-open-btn"
                      >
                        <span>Open</span>
                        <ExternalLink size={12} />
                      </a>

                      {/* Admin-Only Edit and Delete Actions */}
                      {userRole === 'admin' && (
                        <>
                          <button 
                            type="button"
                            className="sp-card-icon-btn"
                            onClick={() => handleOpenEditCarrierModal(carrier)}
                            title="Edit carrier details"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button 
                            type="button"
                            className="sp-card-icon-btn delete"
                            onClick={() => promptDeleteCarrier(carrier)}
                            title={`Delete ${carrier.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Graphic Side */}
                  <div className="sp-card-graphic-side">
                    {renderCardGraphic(carrier)}
                  </div>
                </article>
              ))}

              {filteredCarriers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', background: '#ffffff', padding: '40px 20px', textAlign: 'center', border: '1px dashed #c8c6c4', borderRadius: '4px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#323130', marginBottom: '8px' }}>
                    No applications found in {currentTabObj ? currentTabObj.label : 'this tab'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#605e5c', marginBottom: '16px' }}>
                    {userRole === 'admin' 
                      ? 'Click below to add a new carrier or tool to this category.' 
                      : 'An administrator can add carriers to this hub category.'}
                  </p>
                  {userRole === 'admin' && (
                    <button 
                      type="button" 
                      className="sp-add-carrier-btn" 
                      onClick={handleOpenAddCarrierModal}
                    >
                      <Plus size={16} />
                      <span>Add Carrier to this Tab</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* FLOATING AI CHAT BOT LAUNCHER BUTTON */}
      {!isChatOpen && (
        <button 
          type="button" 
          className="sp-chat-fab"
          onClick={() => setIsChatOpen(true)}
          title="Open AI Assistant to find any carrier link or portal"
        >
          <div className="sp-chat-fab-pulse"></div>
          <Bot size={20} />
          <span style={{ fontWeight: 600, fontSize: '13.5px' }}>Ask Hub Assistant</span>
        </button>
      )}

      {/* EXPANDABLE AI CHAT BOT WINDOW */}
      {isChatOpen && (
        <div className="sp-chat-window" role="dialog" aria-label="Insurance Hub Assistant">
          {/* Header */}
          <div className="sp-chat-header">
            <div className="sp-chat-header-title">
              <div className="sp-chat-bot-icon">
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Omkarr Link & Hub Assistant</div>
                <div style={{ fontSize: '11px', color: '#90cdf4', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe size={11} color="#4ade80" />
                  <span>Verified Carrier & Tab Index Active</span>
                </div>
              </div>
            </div>

            <div className="sp-chat-header-actions">
              <button 
                type="button" 
                className="sp-chat-hdr-btn"
                onClick={() => setChatMessages([
                  {
                    id: 'clear_' + Date.now(),
                    sender: 'assistant',
                    text: 'Chat history cleared. What link or carrier portal do you need?',
                    timestamp: 'Just now'
                  }
                ])}
                title="Clear conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button 
                type="button" 
                className="sp-chat-hdr-btn"
                onClick={() => setIsChatOpen(false)}
                title="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status Banner */}
          <div className="sp-chat-search-badge">
            <Sparkles size={12} color="#166534" />
            <span>Provides direct verified links for all carriers, custom tabs & tools</span>
          </div>

          {/* Quick Clickable Suggestions */}
          <div className="sp-chat-suggestions">
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('Give me the official Humana Vantage portal link and broker support phone number')}
            >
              🔗 Humana Vantage
            </span>
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('Give me the Sunfire Matrix portal login link')}
            >
              🔗 Sunfire Matrix
            </span>
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('What is the Aetna Producer World portal link?')}
            >
              🔗 Aetna Producer World
            </span>
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('What is the UHC Jarvis portal link?')}
            >
              🔗 UHC Jarvis
            </span>
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('What is the WellCare broker workbench link?')}
            >
              🔗 WellCare Workbench
            </span>
            <span 
              className="sp-chip-prompt"
              onClick={() => handleSendMessage('Show all configured tabs and links on my dashboard')}
            >
              📂 List all Tabs
            </span>
          </div>

          {/* Chat Messages */}
          <div className="sp-chat-messages-area">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`sp-chat-bubble ${msg.sender}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                
                {/* Clickable Action Link Buttons */}
                {msg.links && msg.links.map((link, idx) => (
                  <div key={idx} style={{ marginTop: '6px' }}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="sp-chat-link-btn"
                    >
                      <span>Open {link.title} ↗</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}

                {/* Verified Web Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sp-chat-sources-block">
                    <div className="sp-chat-sources-title">
                      <Globe size={11} />
                      <span>Verified Sources:</span>
                    </div>
                    {msg.sources.map((src, sIdx) => (
                      <a 
                        key={sIdx} 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="sp-source-link"
                      >
                        ↗ {src.title}: {src.url}
                      </a>
                    ))}
                  </div>
                )}

                <div className="sp-chat-time">{msg.timestamp}</div>
              </div>
            ))}

            {isChatLoading && (
              <div className="sp-chat-bubble assistant" style={{ fontStyle: 'italic', color: '#605e5c', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={14} className="sp-spin" />
                <span>Locating verified official link...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <form 
            className="sp-chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input 
              type="text" 
              placeholder="Ask for any link (e.g. Humana, Sunfire, WellCare, tabs)..." 
              className="sp-chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isChatLoading}
            />
            <button 
              type="submit" 
              className="sp-chat-send-btn"
              disabled={!inputMessage.trim() || isChatLoading}
              title="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* CUSTOM IN-APP CONFIRMATION DIALOG (Never blocked by iframes) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="sp-confirm-backdrop" onClick={() => setConfirmDialog(null)}>
          <div className="sp-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="sp-confirm-header">
              <AlertTriangle size={18} color="#d13438" />
              <span>{confirmDialog.title}</span>
            </div>
            <div className="sp-confirm-body">
              {confirmDialog.message}
            </div>
            <div className="sp-confirm-footer">
              <button 
                type="button" 
                className="sp-btn-secondary" 
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="sp-confirm-del-btn" 
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST */}
      {toastMessage && (
        <div className="sp-toast-bar">
          <Check size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: ADD / CREATE NEW HUB TAB */}
      {isAddTabModalOpen && (
        <div className="sp-modal-overlay" onClick={() => setIsAddTabModalOpen(false)}>
          <div className="sp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Add New Hub Tab / Category
              </h3>
              <button 
                onClick={() => setIsAddTabModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTab} className="sp-modal-form">
              <div className="sp-form-group">
                <label>Tab / Category Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dental & Vision Hub, Florida Blue Hub, Group Benefits"
                  className="sp-form-input"
                  value={newTabLabel}
                  onChange={(e) => setNewTabLabel(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Tab Icon / Emoji</label>
                <input 
                  type="text" 
                  placeholder="e.g. 🦷, 🌟, 💼, 📑, 🌐, 🏥, 🛡️"
                  className="sp-form-input"
                  value={newTabIcon}
                  onChange={(e) => setNewTabIcon(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ancillary carriers, dental plans, and group quotes"
                  className="sp-form-input"
                  value={newTabDescription}
                  onChange={(e) => setNewTabDescription(e.target.value)}
                />
              </div>

              <div className="sp-modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
                <button 
                  type="button" 
                  className="sp-btn-secondary" 
                  onClick={() => setIsAddTabModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sp-btn-primary">
                  Create Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CARRIER */}
      {isAddCarrierModalOpen && (
        <div className="sp-modal-overlay" onClick={() => setIsAddCarrierModalOpen(false)}>
          <div className="sp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                {editingCarrier ? `Edit ${editingCarrier.name}` : 'Add New Application / Carrier'}
              </h3>
              <button 
                onClick={() => setIsAddCarrierModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCarrier} className="sp-modal-form">
              <div className="sp-form-group">
                <label>Carrier / Application Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Humana Vantage, Devoted Health, CarePlus"
                  className="sp-form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Portal URL * (Starting with https://)</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://..."
                  className="sp-form-input"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Category / Hub Tab</label>
                <select 
                  className="sp-form-select"
                  value={formCategory}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddCarrierModalOpen(false);
                      handleOpenAddTabModal();
                    } else {
                      setFormCategory(e.target.value);
                    }
                  }}
                >
                  {hubTabs.filter(t => t.id !== 'all').map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.icon ? `${tab.icon} ` : ''}{tab.label}
                    </option>
                  ))}
                  <option value="__add_new__">+ Create New Hub Tab...</option>
                </select>
              </div>

              <div className="sp-form-group">
                <label>Short Description / Tagline</label>
                <input 
                  type="text" 
                  placeholder="e.g. Medicare Advantage Quoting & Enrollment"
                  className="sp-form-input"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="sp-form-group">
                  <label>Brand Accent Color</label>
                  <input 
                    type="color" 
                    className="sp-form-input"
                    style={{ height: '38px', padding: '2px', cursor: 'pointer' }}
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                  />
                </div>
                <div className="sp-form-group">
                  <label>Logo Abbreviation (1-3 chars)</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    placeholder="e.g. H, SF, MO"
                    className="sp-form-input"
                    value={formLogoLetter}
                    onChange={(e) => setFormLogoLetter(e.target.value)}
                  />
                </div>
              </div>

              <div className="sp-modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
                <button 
                  type="button" 
                  className="sp-btn-secondary" 
                  onClick={() => setIsAddCarrierModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sp-btn-primary">
                  {editingCarrier ? 'Save Changes' : 'Add to Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEFT NAV LINK */}
      {isAddNavModalOpen && (
        <div className="sp-modal-overlay" onClick={() => setIsAddNavModalOpen(false)}>
          <div className="sp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Add Link / Tab to Left Navigation
              </h3>
              <button 
                onClick={() => setIsAddNavModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNavLink} className="sp-modal-form">
              <div className="sp-form-group">
                <label>Tab / Link Label *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dental & Vision Hub, Florida Blue, CMS Guidance"
                  className="sp-form-input"
                  value={navFormLabel}
                  onChange={(e) => setNavFormLabel(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Emoji / Icon (e.g. 🦷, ⚡, 📁, 🌐)</label>
                <input 
                  type="text" 
                  placeholder="Paste or type an emoji like 🦷, 📁, 🔗, 🛡️"
                  className="sp-form-input"
                  value={navFormIcon}
                  onChange={(e) => setNavFormIcon(e.target.value)}
                />
              </div>

              <div className="sp-form-group">
                <label>Target Hub Category to Filter</label>
                <select 
                  className="sp-form-select"
                  value={navFormCategory}
                  onChange={(e) => setNavFormCategory(e.target.value)}
                >
                  {hubTabs.map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.icon ? `${tab.icon} ` : ''}{tab.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sp-form-group">
                <label>External URL (Optional - opens in new tab if filled)</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  className="sp-form-input"
                  value={navFormUrl}
                  onChange={(e) => setNavFormUrl(e.target.value)}
                />
              </div>

              <div className="sp-modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
                <button 
                  type="button" 
                  className="sp-btn-secondary" 
                  onClick={() => setIsAddNavModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sp-btn-primary">
                  Add to Left Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTHENTICATION & LOGIN MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(email) => {
          showToast(`Welcome! Signed in as ${email}`);
        }}
      />

      {/* ADMIN TEAM & ROLE ACCESS MANAGEMENT MODAL */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        currentUserEmail={currentUser?.email || MASTER_ADMIN_EMAIL}
      />
    </div>
  );
}
