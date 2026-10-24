import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { initDB, getDatabase } from '../src/database/db.js';
import { seedDemoData } from '../src/database/seedDemoData.js';
import { MedicineRepo } from '../src/database/medicineRepo.js';
import { TransactionRepo } from '../src/database/transactionRepo.js';
import { orderRefillTool } from '../src/tools/orderRefill.js';
import { handleAgentTurn } from '../src/tools/agentTurnHandler.js';

describe('Phase 2: PayPal Agentic Commerce & Autonomous Healthcare Settlement', () => {
  beforeAll(async () => {
    initDB();
    await seedDemoData('usr_demo', true);
  });

  describe('1. orderRefillTool & Family Wallet Autonomy', () => {
    it('executes 1-Click Refill via PayPal Orders v2 & Vault when within monthly limit', async () => {
      const allMeds = await MedicineRepo.getAllMedicines('usr_demo');
      const med = allMeds.find((m) => m.name.toLowerCase().includes('amlodipine')) || allMeds[0];
      const prevStock = med.stockCount;

      const result = await orderRefillTool.handler({
        medicineName: med.name,
        quantity: 30,
        userId: 'usr_demo',
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.paypalCaptureId).toBeDefined();
      expect(result.paymentStatus).toBe('COMPLETED');
      expect(result.paymentMethod).toContain('PayPal');
      expect(result.quantityAdded).toBe(30);
      expect(result.newStockCount).toBe(prevStock + 30);
      expect(result.richCard.type).toBe('PayPalOrderReceipt');
      expect(result.speechText).toContain('PayPal');
      expect(result.speechText).toContain(result.orderId);

      // Verify transaction saved in database
      const txns = await TransactionRepo.getTransactions('usr_demo');
      const createdTxn = txns.find((t) => t.orderId === result.orderId);
      expect(createdTxn).toBeDefined();
      expect(createdTxn?.status).toBe('COMPLETED');
      expect(createdTxn?.amount).toBe(9.80);

      // Verify wallet spent updated
      const wallet = await TransactionRepo.getUserWallet('usr_demo');
      expect(wallet.monthlySpent).toBeGreaterThanOrEqual(9.80);
    });

    it('triggers PayPal Caregiver Invoice & SMS alert when refill order exceeds monthly wallet limit', async () => {
      const allMeds = await MedicineRepo.getAllMedicines('usr_demo');
      const med = allMeds[0];
      const prevStock = med.stockCount;

      // Request massive quantity (300 pills) which will exceed $50 limit
      const result = await orderRefillTool.handler({
        medicineName: med.name,
        quantity: 300,
        userId: 'usr_demo',
      });

      expect(result.success).toBe(true);
      expect(result.paymentStatus).toBe('INVOICE_SENT');
      expect(result.quantityAdded).toBe(0); // Inventory not added until caregiver authorizes
      expect(result.newStockCount).toBe(prevStock);
      expect(result.invoiceUrl).toContain('paypal.com');
      expect(result.richCard.type).toBe('PayPalInvoiceReceipt');
      expect(result.speechText).toContain('exceeds');
      expect(result.speechText).toContain('invoice');

      // Verify transaction recorded as INVOICE_SENT
      const txn = await TransactionRepo.getByOrderId(result.orderId);
      expect(txn).toBeDefined();
      expect(txn?.status).toBe('INVOICE_SENT');
      expect(txn?.type).toBe('invoice');
    });

    it('triggers INVOICE_SENT when cumulative monthly spending exceeds family wallet limit', async () => {
      await seedDemoData('usr_demo', true);
      const allMeds = await MedicineRepo.getAllMedicines('usr_demo');
      const med = allMeds[0];

      // First refill: 30 tablets ($9.80) -> within $50 limit
      const res1 = await orderRefillTool.handler({
        medicineName: med.name,
        quantity: 30,
        userId: 'usr_demo',
      });
      expect(res1.paymentStatus).toBe('COMPLETED');

      // Update wallet spent to $45.00 so next refill pushes it over $50
      const db = getDatabase();
      db.prepare('UPDATE users SET monthly_wallet_spent = 45.00 WHERE id = ?').run('usr_demo');

      // Second refill: $9.80 -> cumulative spent = $45 + $9.80 = $54.80 > $50.00 limit
      const res2 = await orderRefillTool.handler({
        medicineName: med.name,
        quantity: 30,
        userId: 'usr_demo',
      });

      expect(res2.success).toBe(true);
      expect(res2.paymentStatus).toBe('INVOICE_SENT');
      expect(res2.richCard.type).toBe('PayPalInvoiceReceipt');
      expect(res2.speechText).toContain('exceeds');
      expect(res2.speechText).toContain('invoice');

      // Reset wallet spent so subsequent test suites start with clean limits
      db.prepare('UPDATE users SET monthly_wallet_spent = 0.00 WHERE id = ?').run('usr_demo');
    });
  });

  describe('2. Voice Turn Orchestration with PayPal Intent Recognition', () => {
    beforeAll(async () => {
      await seedDemoData('usr_demo', true);
    });

    it('recognizes "Refill my blood pressure pills with PayPal" and executes settlement', async () => {
      const res = await handleAgentTurn({
        query: 'Refill my blood pressure pills with PayPal',
        userId: 'usr_demo',
      });

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('orderRefill');
      expect(res.toolArgs?.medicineName).toBe('Amlodipine');
      expect(res.speechResponse).toContain('PayPal');
      expect(res.speechResponse).toContain('Amlodipine');
      expect(res.toolResult.richCard.type).toBe('PayPalOrderReceipt');
    });

    it('recognizes "Order more Metformin" and triggers orderRefill tool', async () => {
      const res = await handleAgentTurn({
        query: 'Order more Metformin',
        userId: 'usr_demo',
      });

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('orderRefill');
      expect(res.toolArgs?.medicineName).toBe('Metformin');
    });

    it('recognizes generic "Buy pills" and routes to orderRefill tool', async () => {
      const res = await handleAgentTurn({
        query: 'Buy pills',
        userId: 'usr_demo',
      });

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('orderRefill');
    });

    it('recognizes "Order 90 days of Metformin with express shipping." and triggers caregiver invoice escalation', async () => {
      await seedDemoData('usr_demo', true);
      const res = await handleAgentTurn({
        query: 'Order 90 days of Metformin with express shipping.',
        userId: 'usr_demo',
      });

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('orderRefill');
      expect(res.toolArgs?.medicineName).toBe('Metformin');
      expect(res.toolArgs?.quantity).toBe(180);
      expect(res.toolResult.paymentStatus).toBe('INVOICE_SENT');
      expect(res.toolResult.richCard.type).toBe('PayPalInvoiceReceipt');
      expect(res.speechResponse).toContain('invoice');
    });
  });

  describe('3. PayPal Webhooks & SSE Event Integration', () => {
    it('handles CHECKOUT.ORDER.APPROVED webhook and captures order', async () => {
      const webhookPayload = {
        id: 'WH-12345',
        event_type: 'CHECKOUT.ORDER.APPROVED',
        create_time: new Date().toISOString(),
        resource: {
          id: '5O19TESTORDER123',
          status: 'APPROVED',
          amount: { currency_code: 'USD', value: '12.50' },
        },
      };

      const response = await request(app)
        .post('/api/paypal/webhook')
        .set('paypal-transmission-id', 'TX-12345')
        .set('paypal-transmission-sig', 'SIG-12345')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.event).toBe('CHECKOUT.ORDER.APPROVED');
    });

    it('handles PAYMENT.CAPTURE.COMPLETED webhook and updates transaction status', async () => {
      // First create a pending transaction
      await TransactionRepo.createTransaction({
        userId: 'usr_demo',
        orderId: 'ORDER-WEBHOOK-TEST-001',
        medicineName: 'Atorvastatin 20mg',
        quantity: 30,
        amount: 12.50,
        currency: 'USD',
        status: 'PENDING',
      });

      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAP-WEBHOOK-001',
          order_id: 'ORDER-WEBHOOK-TEST-001',
          status: 'COMPLETED',
          amount: { currency_code: 'USD', value: '12.50' },
        },
      };

      const response = await request(app)
        .post('/api/paypal/webhook')
        .set('paypal-transmission-id', 'TX-67890')
        .set('paypal-transmission-sig', 'SIG-67890')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      const txn = await TransactionRepo.getByOrderId('ORDER-WEBHOOK-TEST-001');
      expect(txn?.status).toBe('COMPLETED');
      expect(txn?.paypalCaptureId).toBe('CAP-WEBHOOK-001');
    });

    it('handles INVOICING.INVOICE.PAID webhook and refills inventory', async () => {
      const med = (await MedicineRepo.getAllMedicines('usr_demo'))[0];
      const initialStock = med.stockCount;

      await TransactionRepo.createTransaction({
        userId: 'usr_demo',
        orderId: 'INV-WEBHOOK-TEST-002',
        medicineName: med.name,
        quantity: 30,
        amount: 25.00,
        status: 'INVOICE_SENT',
        type: 'invoice',
      });

      const webhookPayload = {
        event_type: 'INVOICING.INVOICE.PAID',
        resource: {
          id: 'INV-WEBHOOK-TEST-002',
          status: 'PAID',
        },
      };

      const response = await request(app)
        .post('/api/paypal/webhook')
        .set('paypal-transmission-id', 'TX-INV-001')
        .set('paypal-transmission-sig', 'SIG-INV-001')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      const updatedMed = await MedicineRepo.getMedicineById(med.id);
      expect(updatedMed!.stockCount).toBe(initialStock + 30);
    });

    it('handles BILLING.SUBSCRIPTION.ACTIVATED and upgrades user to Pro tier', async () => {
      const webhookPayload = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
          id: 'I-SUB-WEBHOOK-999',
          custom_id: 'usr_demo',
          status: 'ACTIVE',
        },
      };

      const response = await request(app)
        .post('/api/paypal/webhook')
        .set('paypal-transmission-id', 'TX-SUB-001')
        .set('paypal-transmission-sig', 'SIG-SUB-001')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      const db = getDatabase();
      const user = db.prepare('SELECT is_pro FROM users WHERE id = ?').get('usr_demo') as any;
      expect(user.is_pro).toBe(1);
    });
  });

  describe('4. Ledger & Family Wallet REST Endpoints', () => {
    it('GET /api/transactions returns medical-financial ledger entries', async () => {
      const response = await request(app)
        .get('/api/transactions?userId=usr_demo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.wallet).toBeDefined();
    });

    it('GET /api/wallet & POST /api/wallet/limit modifies monthly budget threshold', async () => {
      const getRes = await request(app).get('/api/wallet?userId=usr_demo');
      expect(getRes.status).toBe(200);
      expect(getRes.body.wallet.monthlyLimit).toBeDefined();

      const postRes = await request(app)
        .post('/api/wallet/limit')
        .send({ userId: 'usr_demo', limit: 75.0 });

      expect(postRes.status).toBe(200);
      expect(postRes.body.wallet.monthlyLimit).toBe(75.0);
    });
  });
});
