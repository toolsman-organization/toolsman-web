/**
 * Weight-Based Delivery Calculation Engine
 * 
 * Rules:
 * - Empty cart: 0 KG -> ₹0 delivery
 * - Up to 1 KG -> Base Delivery Charge (for the first 1 KG)
 * - Above 1 KG -> Base Delivery Charge + (Chargeable Weight - 1) * Additional 1 KG Charge
 *   where Chargeable Weight = CEIL(Total Cart Weight in KG)
 */

export interface DeliveryCalculationResult {
  totalWeightKg: number;
  chargeableWeightKg: number;
  deliveryCharge: number;
  baseDeliveryCharge: number;
  additional1KgCharge: number;
}

export interface WeightItem {
  quantity: number;
  weight?: string | number | null;
  product?: {
    weight?: string | number | null;
  } | null;
}

/**
 * Normalizes any product weight string or number into a standard float in Kilograms (KG).
 * Examples:
 *  - "500g" / "500 g" / "500gm" -> 0.5
 *  - "1.5 kg" / "1.5kg" -> 1.5
 *  - "2.4" / 2.4 -> 2.4
 *  - null / undefined / empty -> 1.0 (safe default for power tools)
 */
export function parseWeightInKg(weightInput: string | number | null | undefined): number {
  if (weightInput === null || weightInput === undefined) {
    return 1.0;
  }

  if (typeof weightInput === 'number') {
    return isNaN(weightInput) || weightInput <= 0 ? 1.0 : weightInput;
  }

  const raw = String(weightInput).trim().toLowerCase();
  if (!raw) return 1.0;

  // Check if specifically grams (and not kg)
  const isGrams = (raw.includes('g') || raw.includes('gram') || raw.includes('gm')) && !raw.includes('kg');

  // Extract first numeric match (supports decimals)
  const match = raw.match(/(\d+(\.\d+)?)/);
  if (!match) return 1.0;

  const parsedNumber = parseFloat(match[0]);
  if (isNaN(parsedNumber) || parsedNumber <= 0) return 1.0;

  if (isGrams) {
    return Math.round((parsedNumber / 1000) * 1000) / 1000;
  }

  return Math.round(parsedNumber * 1000) / 1000;
}

/**
 * Calculates the total weight in KG of a list of cart / order items.
 */
export function calculateTotalCartWeight(items: WeightItem[]): number {
  if (!items || items.length === 0) return 0;

  const total = items.reduce((sum, item) => {
    const qty = Math.max(1, parseInt(String(item.quantity || 1), 10));
    const rawWeight = item.product?.weight ?? item.weight;
    const itemWeightKg = parseWeightInKg(rawWeight);
    return sum + (itemWeightKg * qty);
  }, 0);

  // Round to 3 decimal places to prevent float precision drift
  return Math.round(total * 1000) / 1000;
}

/**
 * Calculates the delivery charge based on total weight and admin pricing rules.
 */
export function calculateDeliveryCharge(
  totalWeightKg: number,
  baseCharge: number | string = 100,
  additional1KgCharge: number | string = 50
): DeliveryCalculationResult {
  const base = Math.max(0, parseFloat(String(baseCharge)) || 100);
  const additional = Math.max(0, parseFloat(String(additional1KgCharge)) || 50);

  if (totalWeightKg <= 0) {
    return {
      totalWeightKg: 0,
      chargeableWeightKg: 0,
      deliveryCharge: 0,
      baseDeliveryCharge: base,
      additional1KgCharge: additional,
    };
  }

  // Chargeable Weight = CEIL(Total Weight in KG)
  // Non-empty cart has minimum 1 KG chargeable weight
  const chargeableWeightKg = Math.max(1, Math.ceil(totalWeightKg));

  let deliveryCharge = base;
  if (chargeableWeightKg > 1) {
    deliveryCharge = base + (chargeableWeightKg - 1) * additional;
  }

  return {
    totalWeightKg,
    chargeableWeightKg,
    deliveryCharge,
    baseDeliveryCharge: base,
    additional1KgCharge: additional,
  };
}
