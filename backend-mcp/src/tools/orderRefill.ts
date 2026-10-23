import { MedicineRepo } from '../database/medicineRepo.js';
import { TransactionRepo } from '../database/transactionRepo.js';
import { paypalService } from '../services/paypalService.js';
import { sendEmergencySMS } from '../aws/snsClient.js';

export interface PayPalRefillOrderResult {
  success: boolean;
  orderId: string;
  paypalCaptureId?: string;
  medicineName: string;
  dosage: string;
  quantityAdded: number;
  previousStock: number;
  newStockCount: number;
  estimatedDelivery: string;
  totalPrice: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'COMPLETED' | 'INVOICE_SENT' | 'PENDING';
  familyWalletSpent?: number;
  familyWalletRemaining?: number;
  invoiceUrl?: string;
  pharmacyName: string;
  shippingMethod: string;
  speechText: string;
  richCard: {
    type: 'PayPalOrderReceipt' | 'PayPalInvoiceReceipt';
    orderId: string;
    paypalCaptureId?: string;
    medicineName: string;
    dosage: string;
    quantity: number;
    totalPrice: string;
    currency: string;
    estimatedDelivery: string;
    paymentMethod: string;
    paymentStatus: string;
    newStockCount: number;
    invoiceUrl?: string;
    pharmacyName?: string;
    shippingMethod?: string;
  };
}

// Backward-compatible type alias for legacy references
export type AmazonRefillOrderResult = PayPalRefillOrderResult;

export const orderRefillTool = {
  definition: {
    name: 'orderRefill',
    description:
      'Autonomous 1-Click prescription refill and payment settlement via PayPal Developer Platform (Orders v2 / Vault) when inventory runs low.',
    inputSchema: {
      type: 'object',
      properties: {
        medicineName: {
          type: 'string',
          description: 'Name of medication to refill (e.g., Atorvastatin, Amlodipine, Metformin, Aspirin).',
        },
        quantity: {
          type: 'number',
          description: 'Quantity of tablets to refill (defaults to 30 tablets - 1 month supply).',
        },
        userId: {
          type: 'string',
          description: 'Optional ID of the authenticated patient/user for multi-tenant isolation.',
        },
      },
      required: ['medicineName'],
    },
  },

  async handler(args: { medicineName: string; quantity?: number; userId?: string }): Promise<PayPalRefillOrderResult | any> {
    const quantity = args.quantity && args.quantity > 0 ? Number(args.quantity) : 30;
    const query = args.medicineName ? args.medicineName.trim() : '';
    const userId = args.userId || 'usr_demo';

    // 1. Locate medication in database records
    let matchedMed = await MedicineRepo.findByName(query, args.userId);

    // Fallback: if not found by exact name, locate first low-stock medicine
    if (!matchedMed) {
      const allMeds = await MedicineRepo.getAllMedicines(args.userId);
      matchedMed = allMeds.find((m) => m.stockCount <= 5) || allMeds[0] || null;
    }

    if (!matchedMed) {
      return {
        success: false,
        message: `Could not locate medicine '${query}' in patient records.`,
        speechText: `I couldn't find a matching prescription for ${query} in your records.`,
      };
    }

    const previousStock = matchedMed.stockCount;

    // 2. Estimate 2-Day Delivery Date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    const deliveryFormatted = deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // 3. Pricing Matrix based on medication
    const priceMap: Record<string, number> = {
      atorvastatin: 12.50,
      amlodipine: 9.80,
      metformin: 8.40,
      aspirin: 5.20,
    };

    const medKey = matchedMed.name.toLowerCase();
    let baseUnitPrice = 12.50;
    for (const [key, price] of Object.entries(priceMap)) {
      if (medKey.includes(key)) {
        baseUnitPrice = price;
        break;
      }
    }

    // Scale price by quantity if non-standard (standard is 30 tablets)
    const multiplier = quantity / 30;
    const totalNumeric = parseFloat((baseUnitPrice * multiplier).toFixed(2));
    const totalPrice = `$${totalNumeric.toFixed(2)}`;

    // 4. Check senior's pre-approved monthly spending limit (Family Wallet - $50.00 max threshold)
    const wallet = await TransactionRepo.getUserWallet(userId);
    const limitThreshold = wallet.monthlyLimit || 50.0;
    const currentSpent = wallet.monthlySpent || 0;
    const projectedTotalSpent = parseFloat((currentSpent + totalNumeric).toFixed(2));
    const exceedsLimit = totalNumeric > limitThreshold || projectedTotalSpent > limitThreshold;

    // -------------------------------------------------------------
    // FLOW A: EXCEEDS LIMIT -> Create PayPal Invoice & Dispatch SMS
    // -------------------------------------------------------------
    if (exceedsLimit) {
      console.warn(`[orderRefill] Refill total ($${totalNumeric}) brings monthly spending ($${projectedTotalSpent.toFixed(2)}) above Family Wallet limit ($${limitThreshold.toFixed(2)}). Triggering Invoicing.`);

      const invoice = await paypalService.createInvoice({
        caregiverEmail: wallet.caregiverEmail,
        caregiverName: 'Sarah Connor',
        medicineName: matchedMed.name,
        quantity,
        price: totalNumeric,
        currency: 'USD',
        note: `Medication refill for Eleanor Vance (${matchedMed.name}) costs ${totalPrice}, bringing monthly spending ($${projectedTotalSpent.toFixed(2)}) above the $${limitThreshold.toFixed(2)} Family Wallet limit.`,
        exceedsLimitReason: `Refill price ${totalPrice} brings monthly spending to $${projectedTotalSpent.toFixed(2)}, exceeding approved limit of $${limitThreshold.toFixed(2)}`,
      });

      // Dispatch emergency transactional SMS alert to caregiver
      const smsMessage = `[CareBridge Pay Alert] Eleanor's refill for ${matchedMed.name} (${totalPrice}) exceeds your $${limitThreshold.toFixed(0)} Family Wallet limit. Please authorize via PayPal: ${invoice.invoiceUrl}`;
      await sendEmergencySMS('+15550199', smsMessage, 'Sarah Connor');

      // Record transaction as INVOICE_SENT
      await TransactionRepo.createTransaction({
        userId,
        orderId: invoice.invoiceId,
        medicineName: matchedMed.name,
        quantity,
        amount: totalNumeric,
        currency: 'USD',
        status: 'INVOICE_SENT',
        type: 'invoice',
        payerEmail: wallet.caregiverEmail,
        invoiceUrl: invoice.invoiceUrl,
      });

      const speechText = `This refill order for ${matchedMed.name} is ${totalPrice}, which brings your monthly spending to $${projectedTotalSpent.toFixed(2)} and exceeds your pre-approved $${limitThreshold.toFixed(0)} monthly family wallet limit. I've sent a PayPal approval invoice and SMS alert to your caregiver Sarah to authorize.`;

      return {
        success: true,
        orderId: invoice.invoiceId,
        medicineName: matchedMed.name,
        dosage: matchedMed.dosage,
        quantityAdded: 0,
        previousStock,
        newStockCount: previousStock,
        estimatedDelivery: `Pending Caregiver Approval (${deliveryFormatted})`,
        totalPrice,
        currency: 'USD',
        paymentMethod: 'PayPal Caregiver Invoice Authorization',
        paymentStatus: 'INVOICE_SENT',
        familyWalletSpent: wallet.monthlySpent,
        familyWalletRemaining: wallet.remainingBudget,
        invoiceUrl: invoice.invoiceUrl,
        pharmacyName: 'CareBridge Pharmacy Partner',
        shippingMethod: 'Express 2-Day Delivery (Upon Approval)',
        speechText,
        richCard: {
          type: 'PayPalInvoiceReceipt',
          orderId: invoice.invoiceId,
          medicineName: matchedMed.name,
          dosage: matchedMed.dosage,
          quantity,
          totalPrice,
          currency: 'USD',
          estimatedDelivery: `Pending Approval (${deliveryFormatted})`,
          paymentMethod: 'PayPal Invoicing v2',
          paymentStatus: 'INVOICE_SENT',
          newStockCount: previousStock,
          invoiceUrl: invoice.invoiceUrl,
          pharmacyName: 'CareBridge Pharmacy Partner',
          shippingMethod: 'Express 2-Day Delivery',
        },
      };
    }

    // -------------------------------------------------------------
    // FLOW B: WITHIN LIMIT -> Autonomous 1-Click Refill via PayPal Orders v2 / Vault
    // -------------------------------------------------------------
    const orderResult = await paypalService.createOrder({
      medicineName: matchedMed.name,
      quantity,
      price: totalNumeric,
      currency: 'USD',
      userId,
      patientName: 'Eleanor Vance',
      caregiverEmail: wallet.caregiverEmail,
    });

    const captureResult = await paypalService.captureOrder(orderResult.orderId);

    // Update medication stock count in SQLite
    const newStock = previousStock + quantity;
    await MedicineRepo.refillMedicine(matchedMed.id, quantity);

    // Record completed transaction in SQLite
    await TransactionRepo.createTransaction({
      userId,
      orderId: captureResult.orderId,
      paypalCaptureId: captureResult.captureId,
      medicineName: matchedMed.name,
      quantity,
      amount: totalNumeric,
      currency: 'USD',
      status: 'COMPLETED',
      type: 'refill',
      payerEmail: captureResult.payerEmail || wallet.caregiverEmail,
    });

    const updatedWallet = await TransactionRepo.getUserWallet(userId);
    const speechText = `I've ordered ${quantity} tablets of ${matchedMed.name} for ${totalPrice} using your family's pre-approved PayPal wallet. Order ID is ${captureResult.orderId}. It will arrive on ${deliveryFormatted} with Express 2-Day Delivery.`;

    return {
      success: true,
      orderId: captureResult.orderId,
      paypalCaptureId: captureResult.captureId,
      medicineName: matchedMed.name,
      dosage: matchedMed.dosage,
      quantityAdded: quantity,
      previousStock,
      newStockCount: newStock,
      estimatedDelivery: `${deliveryFormatted} (Express 2-Day)`,
      totalPrice,
      currency: 'USD',
      paymentMethod: 'PayPal Family Wallet (Pre-approved Vault)',
      paymentStatus: 'COMPLETED',
      familyWalletSpent: updatedWallet.monthlySpent,
      familyWalletRemaining: updatedWallet.remainingBudget,
      pharmacyName: 'CareBridge Pharmacy Partner',
      shippingMethod: 'Express 2-Day Delivery',
      speechText,
      richCard: {
        type: 'PayPalOrderReceipt',
        orderId: captureResult.orderId,
        paypalCaptureId: captureResult.captureId,
        medicineName: matchedMed.name,
        dosage: matchedMed.dosage,
        quantity,
        totalPrice,
        currency: 'USD',
        estimatedDelivery: `${deliveryFormatted} (Express 2-Day)`,
        paymentMethod: 'PayPal Orders v2 / Vault',
        paymentStatus: 'COMPLETED',
        newStockCount: newStock,
        pharmacyName: 'CareBridge Pharmacy Partner',
        shippingMethod: 'Express 2-Day Delivery',
      },
    };
  },
};
