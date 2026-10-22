import { getDatabase } from './db.js';

export interface TransactionRecord {
  id: string;
  userId: string;
  orderId: string;
  paypalCaptureId?: string | null;
  medicineName: string;
  quantity: number;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'INVOICE_SENT' | 'FAILED' | 'APPROVED' | 'PAID';
  type: 'refill' | 'subscription' | 'invoice';
  payerEmail?: string | null;
  invoiceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  id?: string;
  userId?: string;
  orderId: string;
  paypalCaptureId?: string | null;
  medicineName: string;
  quantity?: number;
  amount: number | string;
  currency?: string;
  status?: 'COMPLETED' | 'PENDING' | 'INVOICE_SENT' | 'FAILED' | 'APPROVED' | 'PAID';
  type?: 'refill' | 'subscription' | 'invoice';
  payerEmail?: string | null;
  invoiceUrl?: string | null;
}

export interface UserWalletInfo {
  userId: string;
  monthlyLimit: number;
  monthlySpent: number;
  remainingBudget: number;
  paypalVaultId: string;
  caregiverEmail: string;
}

export const TransactionRepo = {
  /**
   * Insert a new PayPal commerce transaction into SQLite
   */
  async createTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
    const db = getDatabase();
    const id = input.id || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userId = input.userId || 'usr_demo';
    const numAmount = typeof input.amount === 'number' ? input.amount : parseFloat(String(input.amount).replace(/[^0-9.]/g, '')) || 0;
    const now = new Date().toISOString();

    const record: TransactionRecord = {
      id,
      userId,
      orderId: input.orderId,
      paypalCaptureId: input.paypalCaptureId || null,
      medicineName: input.medicineName,
      quantity: input.quantity || 30,
      amount: numAmount,
      currency: input.currency || 'USD',
      status: input.status || 'COMPLETED',
      type: input.type || 'refill',
      payerEmail: input.payerEmail || null,
      invoiceUrl: input.invoiceUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO transactions (id, user_id, order_id, paypal_capture_id, medicine_name, quantity, amount, currency, status, type, payer_email, invoice_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.userId,
      record.orderId,
      record.paypalCaptureId,
      record.medicineName,
      record.quantity,
      record.amount,
      record.currency,
      record.status,
      record.type,
      record.payerEmail,
      record.invoiceUrl,
      record.createdAt,
      record.updatedAt
    );

    // If completed transaction, update user's monthly spent
    if (record.status === 'COMPLETED') {
      try {
        db.prepare(`
          UPDATE users 
          SET monthly_wallet_spent = COALESCE(monthly_wallet_spent, 0) + ? 
          WHERE id = ?
        `).run(record.amount, userId);
      } catch (e) {
        // Safe fallback
      }
    }

    return record;
  },

  /**
   * Update transaction status and capture ID (e.g. from PayPal Webhook)
   */
  async updateStatusByOrderId(orderId: string, status: string, captureId?: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (captureId) {
      db.prepare(`
        UPDATE transactions 
        SET status = ?, paypal_capture_id = ?, updated_at = ?
        WHERE order_id = ? OR paypal_capture_id = ? OR id = ?
      `).run(status, captureId, now, orderId, captureId, orderId);
    } else {
      db.prepare(`
        UPDATE transactions 
        SET status = ?, updated_at = ?
        WHERE order_id = ? OR id = ?
      `).run(status, now, orderId, orderId);
    }
  },

  /**
   * Find transaction by order ID or capture ID
   */
  async getByOrderId(orderId: string): Promise<TransactionRecord | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM transactions WHERE order_id = ? OR id = ? OR paypal_capture_id = ?').get(orderId, orderId, orderId) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      orderId: row.order_id,
      paypalCaptureId: row.paypal_capture_id,
      medicineName: row.medicine_name,
      quantity: row.quantity,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      type: row.type,
      payerEmail: row.payer_email,
      invoiceUrl: row.invoice_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * List transactions for medical-financial ledger
   */
  async getTransactions(userId?: string, limit: number = 50): Promise<TransactionRecord[]> {
    const db = getDatabase();
    let rows: any[];
    if (userId) {
      rows = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as any[];
    } else {
      rows = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    }

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      orderId: row.order_id,
      paypalCaptureId: row.paypal_capture_id,
      medicineName: row.medicine_name,
      quantity: row.quantity,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      type: row.type,
      payerEmail: row.payer_email,
      invoiceUrl: row.invoice_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Retrieve senior's Family Wallet limits and balance
   */
  async getUserWallet(userId: string = 'usr_demo'): Promise<UserWalletInfo> {
    const db = getDatabase();
    const row = db.prepare('SELECT monthly_wallet_limit, monthly_wallet_spent, paypal_vault_id, caregiver_email FROM users WHERE id = ?').get(userId) as any;

    const monthlyLimit = row?.monthly_wallet_limit !== undefined && row?.monthly_wallet_limit !== null ? Number(row.monthly_wallet_limit) : 50.0;
    const monthlySpent = row?.monthly_wallet_spent !== undefined && row?.monthly_wallet_spent !== null ? Number(row.monthly_wallet_spent) : 0.0;
    const remainingBudget = Math.max(0, monthlyLimit - monthlySpent);
    const paypalVaultId = row?.paypal_vault_id || 'VAULT-DEMO-FAMILY-WALLET';
    const caregiverEmail = row?.caregiver_email || 'sarah@carebridge.ai';

    return {
      userId,
      monthlyLimit,
      monthlySpent,
      remainingBudget,
      paypalVaultId,
      caregiverEmail,
    };
  },

  /**
   * Reset or modify monthly spent / limit
   */
  async updateWalletLimit(userId: string, newLimit: number): Promise<void> {
    const db = getDatabase();
    db.prepare('UPDATE users SET monthly_wallet_limit = ? WHERE id = ?').run(newLimit, userId);
  },
};
