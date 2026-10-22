import { randomUUID } from 'node:crypto';
import { envConfig } from '../config/env.js';

export interface CreateOrderParams {
  medicineName: string;
  quantity?: number;
  price: string | number;
  currency?: string;
  userId?: string;
  patientName?: string;
  caregiverEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
  referenceId?: string;
}

export interface PayPalOrderResult {
  success: boolean;
  orderId: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  amount: {
    currencyCode: string;
    value: string;
  };
  medicineName: string;
  quantity: number;
  approvalUrl?: string;
  captureUrl?: string;
  simulated?: boolean;
  createTime: string;
  raw?: any;
}

export interface CaptureOrderResult {
  success: boolean;
  orderId: string;
  captureId: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  amount: {
    currencyCode: string;
    value: string;
  };
  payerEmail?: string;
  payerName?: string;
  simulated?: boolean;
  captureTime: string;
  raw?: any;
}

export interface CreateInvoiceParams {
  caregiverEmail: string;
  caregiverName?: string;
  medicineName: string;
  quantity?: number;
  price: string | number;
  currency?: string;
  dueDate?: string;
  note?: string;
  reference?: string;
  exceedsLimitReason?: string;
}

export interface PayPalInvoiceResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'SCHEDULED' | 'CANCELLED';
  amount: {
    currencyCode: string;
    value: string;
  };
  caregiverEmail: string;
  medicineName: string;
  dueDate: string;
  invoiceUrl: string;
  simulated?: boolean;
  createTime: string;
  raw?: any;
}

export interface VaultSetupResult {
  success: boolean;
  tokenId: string;
  customerId: string;
  status: 'APPROVED' | 'ACTIVE';
  monthlySpendingLimit: number;
  simulated?: boolean;
}

export interface VaultChargeParams {
  vaultTokenId: string;
  medicineName: string;
  quantity?: number;
  price: string | number;
  currency?: string;
  userId?: string;
  caregiverEmail?: string;
}

export interface SubscriptionParams {
  planId?: string;
  subscriberEmail: string;
  subscriberName?: string;
  tierName?: string;
  pricePerMonth?: number;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId: string;
  planId: string;
  status: 'APPROVAL_PENDING' | 'ACTIVE' | 'APPROVED';
  tierName: string;
  pricePerMonth: string;
  approvalUrl: string;
  simulated?: boolean;
}

// In-memory token cache to avoid spamming the OAuth endpoint
interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let cachedToken: TokenCache | null = null;

/**
 * Clean and normalize numeric price input (e.g., "$12.50" -> "12.50")
 */
export function normalizePrice(price: string | number): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  const cleaned = price.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) {
    return '12.50';
  }
  return parsed.toFixed(2);
}

/**
 * Fetch OAuth2 Bearer Access Token with TTL caching
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if valid (with 60-second safety margin)
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  // If live/sandbox credentials are not set, return simulated token
  if (!envConfig.hasPayPalCredentials) {
    return 'SIMULATED_PAYPAL_ACCESS_TOKEN';
  }

  const clientId = envConfig.PAYPAL_CLIENT_ID;
  const clientSecret = envConfig.PAYPAL_CLIENT_SECRET;
  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const tokenUrl = `${envConfig.PAYPAL_BASE_URL}/v1/oauth2/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[PayPal Service] OAuth2 failed (Status ${response.status}). Falling back to simulation mode.`);
      return 'SIMULATED_PAYPAL_ACCESS_TOKEN';
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    const expiresInMs = (data.expires_in || 3600) * 1000;

    cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + expiresInMs,
    };

    console.info('[PayPal Service] OAuth2 token refreshed successfully (sandbox/live).');
    return cachedToken.accessToken;
  } catch (err: unknown) {
    console.warn('[PayPal Service] OAuth2 request exception:', (err as Error).message);
    return 'SIMULATED_PAYPAL_ACCESS_TOKEN';
  }
}


export const paypalService = { getPayPalAccessToken };
export default paypalService;
