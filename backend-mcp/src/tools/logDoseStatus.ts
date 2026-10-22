import { LogRepo } from '../database/logRepo.js';
import { MedicineRepo } from '../database/medicineRepo.js';
import { getDatabase } from '../database/db.js';
import { getLocalDateString } from '../utils/dateUtils.js';

export const logDoseStatusTool = {
  definition: {
    name: 'logDoseStatus',
    description: "Mark medication dose intake status as 'taken' or 'skipped', with optional clinical or feeling notes. Autonomously checks stock inventory and prompts for PayPal refill if inventory is low (<= 3 pills).",
    inputSchema: {
      type: 'object',
      properties: {
        logId: {
          type: 'string',
          description: 'Unique intake log record identifier (if known).',
        },
        medicineName: {
          type: 'string',
          description: 'Name of medicine spoken by patient (e.g., Amlodipine, Metformin, morning pills).',
        },
        status: {
          type: 'string',
          enum: ['taken', 'skipped', 'pending'],
          description: "New intake status ('taken' or 'skipped'). Defaults to 'taken'.",
        },
        notes: {
          type: 'string',
          description: 'Clinical observation or sensation noted during intake (e.g., "Taken with oatmeal, slight dizziness").',
        },
      },
      required: [],
    },
  },

  async handler(args: { userId?: string; logId?: string; medicineName?: string; status?: 'taken' | 'skipped' | 'pending'; notes?: string }) {
    const todayStr = getLocalDateString();
    const status = args.status || 'taken';
    let targetLogId = args.logId;
    let matchedMedName = args.medicineName || 'Medication';

    // If logId is not explicitly provided, find the most relevant pending dose today
    if (!targetLogId) {
      const todayLogs = await LogRepo.getLogsByDate(todayStr, args.userId);

      if (args.medicineName) {
        const found = todayLogs.find(
          (l) => l.name.toLowerCase().includes(args.medicineName!.toLowerCase()) && l.status === 'pending'
        ) || todayLogs.find((l) => l.name.toLowerCase().includes(args.medicineName!.toLowerCase()));

        if (found) {
          targetLogId = found.logId;
          matchedMedName = found.name;
        } else {
          // Fallback if medicineName is a generic phrase (e.g. "morning pills", "pills", "medication")
          const pendingDose = todayLogs.find((l) => l.status === 'pending') || todayLogs[0];
          if (pendingDose) {
            targetLogId = pendingDose.logId;
            matchedMedName = pendingDose.name;
          }
        }
      } else {
        // Retrieve nearest pending dose
        const pendingDose = todayLogs.find((l) => l.status === 'pending') || todayLogs[0];
        if (pendingDose) {
          targetLogId = pendingDose.logId;
          matchedMedName = pendingDose.name;
        }
      }
    }

    if (!targetLogId) {
      return {
        success: false,
        message: "No pending medication schedule was found to update for today.",
        speechText: "I couldn't find a pending dose scheduled for that medication right now.",
      };
    }

    await LogRepo.updateStatusDirect(targetLogId, status, args.notes);

    // Check remaining stock inventory after dose decrement
    let remainingStock: number | null = null;
    let lowStockWarning = false;
    let priceStr = '$12.50';

    if (status === 'taken') {
      try {
        const db = getDatabase();
        const logRow = db.prepare('SELECT medicine_id FROM intake_logs WHERE id = ?').get(targetLogId) as any;
        if (logRow) {
          const med = await MedicineRepo.getMedicineById(logRow.medicine_id);
          if (med) {
            remainingStock = med.stockCount;
            // Autonomous agentic commerce: trigger warning when stock is <= 3 pills (or <= 5 for safety)
            if (remainingStock <= 3 || remainingStock <= 5) {
              lowStockWarning = true;
            }

            const lower = med.name.toLowerCase();
            if (lower.includes('amlodipine')) priceStr = '$9.80';
            else if (lower.includes('metformin')) priceStr = '$8.40';
            else if (lower.includes('aspirin')) priceStr = '$5.20';
            else if (lower.includes('atorvastatin')) priceStr = '$12.50';
          }
        }
      } catch (e) {
        console.warn('[logDoseStatus] Could not check updated stock:', e);
      }
    }

    let speechText = '';
    if (status === 'taken') {
      if (lowStockWarning && remainingStock !== null) {
        speechText = `Logged as taken. Heads up: you only have ${remainingStock} pills left of ${matchedMedName}. Would you like me to refill a 30-day supply with PayPal for ${priceStr} using your pre-approved Family Wallet?`;
      } else {
        speechText = `Wonderful! I have recorded your ${matchedMedName} as taken.${args.notes ? ' I also saved your note.' : ''}`;
      }
    } else {
      speechText = `I have marked your ${matchedMedName} as skipped.`;
    }

    return {
      success: true,
      logId: targetLogId,
      medicineName: matchedMedName,
      newStatus: status,
      notes: args.notes || null,
      remainingStock,
      lowStockAlert: lowStockWarning
        ? {
            medicineName: matchedMedName,
            remainingStock,
            price: priceStr,
            refillSuggested: true,
            suggestedAction: 'orderRefill',
          }
        : null,
      speechText,
    };
  },
};
