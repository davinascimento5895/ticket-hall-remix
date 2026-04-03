import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validação de CPF
function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

// Validação de CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  const calcDigit = (pos: number) => {
    let sum = 0;
    let weight = pos - 7;
    for (let i = 0; i < pos; i++) {
      sum += parseInt(cleaned.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const result = 11 - (sum % 11);
    return result > 9 ? 0 : result;
  };
  
  const digit1 = calcDigit(12);
  const digit2 = calcDigit(13);
  
  return digit1 === parseInt(cleaned.charAt(12)) && digit2 === parseInt(cleaned.charAt(13));
}

// Validação de chave PIX
function validatePixKey(key: string, type: string): { valid: boolean; error?: string } {
  const cleaned = key.trim();
  
  switch (type) {
    case "cpf":
      if (!validateCPF(cleaned)) {
        return { valid: false, error: "CPF inválido" };
      }
      return { valid: true };
      
    case "cnpj":
      if (!validateCNPJ(cleaned)) {
        return { valid: false, error: "CNPJ inválido" };
      }
      return { valid: true };
      
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleaned)) {
        return { valid: false, error: "E-mail inválido" };
      }
      if (cleaned.length > 77) {
        return { valid: false, error: "E-mail muito longo (máx. 77 caracteres)" };
      }
      return { valid: true };
      
    case "phone":
      const phoneDigits = cleaned.replace(/\D/g, "");
      // DDD + 9 dígitos (formato brasileiro atual)
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        return { valid: false, error: "Telefone inválido. Use formato: (11) 98765-4321" };
      }
      return { valid: true };
      
    case "random":
      // Chave aleatória (UUID) - 36 caracteres
      if (cleaned.length !== 36) {
        return { valid: false, error: "Chave aleatória inválida (deve ter 36 caracteres)" };
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cleaned)) {
        return { valid: false, error: "Formato de chave aleatória inválido" };
      }
      return { valid: true };
      
    default:
      return { valid: false, error: "Tipo de chave PIX inválido" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const { amount, pixKey, pixKeyType } = await req.json();

    // Validations
    if (!amount || isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pixKey || !pixKeyType) {
      return new Response(
        JSON.stringify({ error: "PIX key and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar formato da chave PIX
    const pixValidation = validatePixKey(pixKey, pixKeyType);
    if (!pixValidation.valid) {
      return new Response(
        JSON.stringify({ error: pixValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const minWithdrawal = 10; // Minimum R$ 10
    if (amount < minWithdrawal) {
      return new Response(
        JSON.stringify({ error: `Minimum withdrawal is R$ ${minWithdrawal}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (wallet.available_balance < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from("wallet_withdrawals")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["requested", "processing"]);

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return new Response(
        JSON.stringify({ error: "You have pending withdrawals. Please wait for them to be processed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate fee (0% for now, can be adjusted)
    const feePercentage = 0;
    const feeAmount = amount * (feePercentage / 100);
    const netAmount = amount - feeAmount;

    // Start transaction - deduct from wallet
    const { error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        available_balance: wallet.available_balance - amount,
        pending_withdrawal: (wallet.pending_withdrawal || 0) + amount
      })
      .eq("id", wallet.id);

    if (walletUpdateError) throw walletUpdateError;

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("wallet_withdrawals")
      .insert({
        user_id: userId,
        amount: amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        status: "requested"
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    // Create wallet transaction record
    await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        user_id: userId,
        tx_type: "withdrawal",
        direction: "debit",
        amount: amount,
        description: `Saque solicitado - ${pixKeyType}: ${pixKey.substring(0, 4)}...`,
        reference_type: "wallet_withdrawal",
        reference_id: withdrawal.id,
        status: "completed"
      });

    // Create notification for user
    await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "withdrawal_requested",
        title: "Saque solicitado",
        message: `Seu saque de ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(netAmount)} foi solicitado e será processado em até 2 dias úteis.`,
        metadata: {
          withdrawal_id: withdrawal.id,
          amount: amount
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        withdrawalId: withdrawal.id,
        amount: amount,
        netAmount: netAmount,
        message: "Withdrawal requested successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
