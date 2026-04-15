import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260415233000_fix_order_balance_trigger.sql"
);

describe("producer balance trigger migration", () => {
  it("derives the producer from the event instead of NEW.producer_id", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).not.toContain("NEW.producer_id");
    expect(migrationSql).toContain("JOIN public.events e ON e.id = o.event_id");
    expect(migrationSql).toContain("e.producer_id = p_producer_id");
  });

  it("skips duplicate balance updates when a paid order is updated again", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain("TG_OP = 'UPDATE'");
    expect(migrationSql).toContain("OLD.status = 'paid'");
    expect(migrationSql).toContain("OLD.payment_status = 'paid'");
  });

  it("logs enough context to debug balance processing", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain("RAISE NOTICE");
    expect(migrationSql).toContain("update_producer_balance_after_sale");
  });

  it("keeps free orders pending until confirm_order_payment runs", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain("'pending',");
    expect(migrationSql).toContain("CASE WHEN v_is_free THEN 'free' ELSE NULL END");
    expect(migrationSql).toContain("now() + interval '15 minutes'");
  });
});