import {
  TodayDataResponse,
  HistoryDataResponse,
  MedicinesResponse,
  DoseActionResponse,
  ClinicalAdviceResponse,
  PayPalRefillOrder,
  AmazonRefillOrder,
  PayPalTransaction,
  WalletStatus,
  SubscriptionResponse,
  VitalsRecord,
  LogStatus,
  AgentTurnResponse,
  RingDeviceHubResult,
  DrugInteractionCheckResult,
  GuardianNegotiationResult,
} from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_MCP_URL ||
  'http://localhost:3001';

const DEFAULT_TIMEOUT_MS = 8000;

function getActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('carebridge_auth_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.userId || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers || {});
  const userId = getActiveUserId();
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const mcpClient = {
  /**
   * POST /api/auth/login
   * Multi-user authentication & demo isolation
   */
  async login(credentials: {
    email: string;
    pin?: string;
    role?: 'caregiver' | 'senior';
  }): Promise<{
    success: boolean;
    user: {
      id: string;
      email: string;
      role: 'caregiver' | 'senior';
      isPro: boolean;
      isDemo: boolean;
      name?: string;
      isOnboarded?: boolean;
      caregiverName?: string;
      patientName?: string;
      patientAge?: number;
    };
  }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Authentication failed: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/agent/turn
   * Bedrock Claude Native Tool-Use & Agentic Loop Orchestrator
   */
  async executeAgentTurn(query: string): Promise<AgentTurnResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/agent/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`Failed to execute agent turn: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/ring
   * Ring Smart Doorbell & Access Hub Controller
   */
  async triggerRingAction(
    action: 'checkFrontPorch' | 'triggerEmergencyDoorUnlock' | 'getDeviceStatus' = 'checkFrontPorch',
    reason?: string
  ): Promise<RingDeviceHubResult> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/ring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    if (!res.ok) {
      throw new Error(`Failed to trigger Ring action: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * GET /api/schedule?date=YYYY-MM-DD
   * Fetch medication schedule, vitals, and caregiver profile for a specific date
   */
  async getSchedule(dateStr?: string): Promise<TodayDataResponse> {
    const url = dateStr
      ? `${API_BASE_URL}/api/schedule?date=${encodeURIComponent(dateStr)}`
      : `${API_BASE_URL}/api/schedule`;
    const res = await fetchWithTimeout(url, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch schedule: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Backward-compatible alias for getSchedule
   */
  async getTodayData(dateStr?: string): Promise<TodayDataResponse> {
    return this.getSchedule(dateStr);
  },

  /**
   * POST /api/toggle
   * Toggle dose status (pending <-> taken) and update SQLite inventory
   */
  async toggleDose(
    logId: string,
    currentStatus: string
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, currentStatus }),
    });
    if (!res.ok) {
      throw new Error(`Failed to toggle dose: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/vitals
   * Record vital signs (blood pressure, blood sugar, heart rate)
   */
  async recordVitals(vitals: Partial<VitalsRecord>): Promise<any> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitals),
    });
    if (!res.ok) {
      throw new Error(`Failed to record vitals: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * GET /api/history
   * Fetch full 30-day medication and vitals history
   */
  async getHistory(): Promise<HistoryDataResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/history`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch history: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * GET /api/medicines
   * Fetch prescription medication catalog
   */
  async getMedicines(): Promise<MedicinesResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/medicines`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch medicines: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/advisor
   * Send clinical symptom query to AI advisor (AWS Bedrock Claude)
   */
  async askClinicalAdvisor(query: string): Promise<ClinicalAdviceResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`Failed to ask clinical advisor: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/seed
   * Trigger 30-day clinical demo data reset and seed
   */
  async triggerDataSeed(): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/seed`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to trigger data seed: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/dose
   * Log dose status via voice command or direct UI selection
   */
  async logDoseStatus(args: {
    logId?: string;
    medicineName?: string;
    status?: LogStatus | string;
    notes?: string;
  }): Promise<DoseActionResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/dose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      throw new Error(`Failed to log dose status: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/note
   * Save clinical note for a medication dose
   */
  async saveDoseNote(
    logId: string,
    notes: string
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, notes }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save dose note: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/medicines
   */
  async addMedicine(medicine: {
    name: string;
    dosage: string;
    reminderTimes?: string[];
    daysOfWeek?: string[];
    stockCount?: number;
    type?: 'medication' | 'routine';
  }): Promise<{ success: boolean; id?: string; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine),
    });
    if (!res.ok) {
      throw new Error(`Failed to add medicine: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * PUT /api/medicines/:id
   */
  async updateMedicine(
    id: string,
    medicine: {
      name: string;
      dosage: string;
      reminderTimes?: string[];
      daysOfWeek?: string[];
      stockCount?: number;
      type?: 'medication' | 'routine';
    }
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine),
    });
    if (!res.ok) {
      throw new Error(`Failed to update medicine: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * DELETE /api/medicines/:id
   */
  async deleteMedicine(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/medicines/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete medicine: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/medicines/check-interaction
   * Automated Drug-Drug Safety & Beers Criteria interaction checker
   */
  async checkDrugInteraction(
    newMedicineName: string,
    currentMedicines?: string[]
  ): Promise<DrugInteractionCheckResult> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/medicines/check-interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newMedicineName, currentMedicines }),
    });
    if (!res.ok) {
      throw new Error(`Failed to check drug interactions: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/refill (PayPal 1-Click Vault / Family Wallet Refill MCP Tool)
   */
  async orderRefill(params: {
    medicineName: string;
    medicineId?: string;
    quantity?: number;
  }): Promise<PayPalRefillOrder> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/refill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to place PayPal prescription refill: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * GET /api/transactions
   * Retrieve Medical-Financial Ledger for Caregiver & Doctor AG Grid Analytics
   */
  async getTransactions(limit: number = 50): Promise<{
    success: boolean;
    transactions: PayPalTransaction[];
    wallet: WalletStatus;
    count: number;
  }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/transactions?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch transactions: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * GET /api/wallet
   * Retrieve senior's Family Wallet limits and balance
   */
  async getWallet(): Promise<{ success: boolean; wallet: WalletStatus }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/wallet`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch wallet: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/wallet/limit
   * Adjust Caregiver Family Wallet monthly spending limit
   */
  async updateWalletLimit(limit: number): Promise<{ success: boolean; message: string; wallet: WalletStatus }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/wallet/limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update wallet limit: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/subscription/create
   * Create Caregiver Copilot subscription ($9.99/mo) via PayPal Subscriptions API
   */
  async createSubscription(params?: {
    subscriberEmail?: string;
    subscriberName?: string;
  }): Promise<SubscriptionResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/subscription/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    if (!res.ok) {
      throw new Error(`Failed to create PayPal subscription: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Subscribe to backend Server-Sent Events (SSE)
   * Real-time push for PayPal webhooks, transactions, and refills
   */
  subscribeToEvents(onEvent: (event: { type: string; data: any }) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }
    try {
      const eventSource = new EventSource(`${API_BASE_URL}/api/events`);
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          // ignore keepalive comments
        }
      };
      eventSource.onerror = () => {
        // SSE will automatically attempt reconnection
      };
      return () => {
        eventSource.close();
      };
    } catch (e) {
      return () => {};
    }
  },

  /**
   * POST /api/guardian/negotiate
   * Health Guardian persona persuasion & Sarah Circuit-Breaker
   */
  async negotiateAdherence(params: {
    medicineName: string;
    refusalReason?: string;
    personaId?: string;
    turnCount?: number;
  }): Promise<GuardianNegotiationResult> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/guardian/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to negotiate adherence: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * POST /api/user/profile
   * Save Caregiver and Patient profile for onboarding
   */
  async saveUserProfile(profile: {
    caregiverName: string;
    patientName: string;
    patientAge: number;
    userId?: string;
  }): Promise<{ success: boolean; user?: any }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(`Failed to save user profile: ${res.statusText}`);
    }
    return res.json();
  },

  // Backward-compatible alias helpers
  fetchSchedule(dateStr?: string) {
    return this.getSchedule(dateStr);
  },
  fetchTodayData(dateStr?: string) {
    return this.getSchedule(dateStr);
  },
  fetchHistory() {
    return this.getHistory();
  },
  fetchMedicines() {
    return this.getMedicines();
  },
  seedDemoData() {
    return this.triggerDataSeed();
  },
};
