import { supabase } from "@/integrations/supabase/client";

export interface WalletSummaryResponse {
  success: boolean;
  error?: string;
  wallet?: {
    user_id: string;
    available_balance: number;
    pending_balance: number;
    locked_balance: number;
    total_earned: number;
    total_withdrawn: number;
    updated_at: string;
  };
  ledger?: Array<{
    id: string;
    wallet_tx_type: string;
    direction: "credit" | "debit";
    amount: number;
    status: string;
    balance_bucket: string;
    reference_type: string;
    reference_id: string | null;
    description: string;
    available_at: string | null;
    created_at: string;
    metadata?: Record<string, unknown>;
  }>;
  withdrawals?: Array<{
    id: string;
    amount: number;
    fee_amount: number;
    net_amount: number;
    status: string;
    pix_key: string;
    pix_key_type: string | null;
    requested_at: string;
    paid_at: string | null;
    failure_reason: string | null;
    created_at: string;
  }>;
}

export async function getUserWalletSummary() {
  const { data, error } = await supabase.functions.invoke("get-user-wallet");
  if (error) throw error;
  return data as WalletSummaryResponse;
}

export async function requestWalletWithdrawal(params: {
  amount: number;
  pixKey: string;
  pixKeyType: "cpf" | "email" | "phone" | "random";
}) {
  const { data, error } = await supabase.functions.invoke("request-wallet-withdrawal", {
    body: params,
  });

  if (error) throw error;
  return data as { success: boolean; error?: string; withdrawalId?: string; amount?: number; feeAmount?: number; netAmount?: number };
}
