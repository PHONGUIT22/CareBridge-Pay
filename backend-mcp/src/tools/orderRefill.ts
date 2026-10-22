import { MedicineRepo } from '../database/medicineRepo.js';

export interface AmazonRefillOrderResult {
  success: boolean;
  orderId: string;
  medicineName: string;
  dosage: string;
  quantityAdded: number;
  previousStock: number;
  newStockCount: number;
  estimatedDelivery: string;
  totalPrice: string;
  pharmacyName: string;
  shippingMethod: string;
  speechText: string;
  richCard: {
    type: 'AmazonPharmacyOrder';
    orderId: string;
    medicineName: string;
    dosage: string;
    quantity: number;
    totalPrice: string;
    estimatedDelivery: string;
    shippingMethod: string;
    pharmacyName: string;
    newStockCount: number;
  };
}

export const orderRefillTool = {
  definition: {
    name: 'orderRefill',
    description:
      'Autonomous 1-Click prescription refill and payment settlement via PayPal Developer Platform (Orders v2 / Vault) when inventory runs low.