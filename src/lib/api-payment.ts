import { supabase } from "@/integrations/supabase/client";

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  postalCode?: string;
  addressNumber?: string;
}

export interface CreatePaymentResult {
  success: boolean;
  stub?: boolean;
  alreadyCreated?: boolean;
  paymentId?: string;
  pixQrCode?: string;
  pixQrCodeImage?: string;
  expiresAt?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  dueDate?: string;
  immediateConfirmation?: boolean;
  chargeStatus?: string;
  message?: string;
  error?: string;
}

/**
 * Calls the create-payment edge function to process payment via Asaas.
 */
export const createPayment = async (
  orderId: string,
  paymentMethod: "pix" | "credit_card" | "boleto",
  creditCard?: CreditCardData,
  installments?: number,
  payerCpf?: string
): Promise<CreatePaymentResult> => {
  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: { orderId, paymentMethod, creditCard, installments, payerCpf },
  });

  if (error) {
    console.error("createPayment error:", error);
    return { success: false, error: error.message };
  }

  return data as CreatePaymentResult;
};

export interface InstallmentOption {
  n: number;
  label: string;
  value: number;
  total: number;
  hasInterest: boolean;
}

/**
 * Calculates installment options for credit card payments.
 * First 3 installments are interest-free, 4-12 have 1.99% monthly interest.
 */
export const getInstallmentOptions = (total: number): InstallmentOption[] => {
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const options: InstallmentOption[] = [];

  for (let n = 1; n <= 12; n++) {
    if (n <= 3) {
      // Interest-free
      const value = Number((total / n).toFixed(2));
      options.push({
        n,
        label: `${n}x de ${fmt(value)} sem juros`,
        value,
        total,
        hasInterest: false,
      });
    } else {
      // 1.99% monthly interest (compound)
      const rate = 0.0199;
      const installmentValue = Number(
        ((total * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)).toFixed(2)
      );
      const totalWithInterest = Number((installmentValue * n).toFixed(2));
      options.push({
        n,
        label: `${n}x de ${fmt(installmentValue)} (${fmt(totalWithInterest)})`,
        value: installmentValue,
        total: totalWithInterest,
        hasInterest: true,
      });
    }
  }

  return options;
};

/**
 * Creates a producer Asaas sub-account (admin only).
 */
export const createProducerAccount = async (
  producerId: string
): Promise<{ success: boolean; walletId?: string; error?: string }> => {
  const { data, error } = await supabase.functions.invoke(
    "create-producer-account",
    { body: { producerId } }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
};
