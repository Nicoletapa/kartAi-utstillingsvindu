import { create } from 'zustand';
import type { Feature } from 'geojson';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils'; 
import type { Map } from 'leaflet';

// --- Types ---
export interface Guide {
  title: string;
  url: string;
  description?: string;
}

export interface ChatItem {
  text: string;
  isUser: boolean;
  guides?: Guide[];
  timestamp?: number; 
  original_header?: string;
}

interface MapRefState {
  map: Map | null;
  ready: boolean;
  containerId: string | null;
}

// --- State Interface ---
interface ChatState {
  chatItems: ChatItem[];
  isExpanded: boolean;
  isVisible: boolean; 
  showChatbot: boolean; 
  lastDrawnShape: Feature | null;
  spatialAnalysis: SpatialAnalysisResult | null;
  mapInstanceRef: MapRefState; 
  isTyping: boolean;
  error: string | null;
}

// --- Actions Interface ---
interface ChatActions {
  addMessage: (item: ChatItem) => void;
  toggleExpand: () => void;
  setVisible: (visible: boolean) => void;
  setShowChatbot: (show: boolean) => void;
  openBubble: () => void;
  closeBubble: () => void;
  setLastDrawnShape: (shape: Feature | null, analysis?: SpatialAnalysisResult | null) => void;
  setMapInstance: (mapState: MapRefState) => void;
  clearMapInstance: () => void;
  setIsTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void; 
}

// --- Store Implementation ---
export const useChatStore = create<ChatState & ChatActions>((set) => ({
  // --- Initial State ---
  chatItems: [],
  isExpanded: false,
  isVisible: false,
  showChatbot: false, 
  lastDrawnShape: null,
  spatialAnalysis: null,
  mapInstanceRef: { map: null, ready: false, containerId: null },
  isTyping: false,
  error: null,

  // --- Actions ---
  addMessage: (item) => set((state) => ({
    chatItems: [{ ...item, timestamp: Date.now() }, ...state.chatItems], 
    error: null, 
  })),

  toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),

  setVisible: (visible) => set({ isVisible: visible }),

  setShowChatbot: (show) => set({ showChatbot: show }),

  openBubble: () => {
    set({ showChatbot: true });
    setTimeout(() => set({ isVisible: true }), 10);
  },

  closeBubble: () => {
    set({ isVisible: false });
    setTimeout(() => {
      set({ showChatbot: false, isExpanded: false }); 
    }, 300); 
  },

  setLastDrawnShape: (shape, analysis = null) => set({
    lastDrawnShape: shape,
    spatialAnalysis: analysis
  }),

  setMapInstance: (mapState) => set({ mapInstanceRef: mapState }),

  clearMapInstance: () => set({ mapInstanceRef: { map: null, ready: false, containerId: null } }),

  setIsTyping: (typing) => set({ isTyping: typing }),

  setError: (error) => set({ error: error }),

  clearChat: () => set({ chatItems: [], error: null }),
}));

// --- Constants ---
export const MIN_OVERSIKT_PATH = '/atlas-app/sidebar/min-oversikt';
export const MAIN_CHATBOT_SECTION_ID = 'main-chatbot-section';
