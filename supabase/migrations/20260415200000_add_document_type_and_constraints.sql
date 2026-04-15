-- Migration: Add document_number/document_type constraints and migrate legacy CPF/CNPJ data
-- Date: 2026-04-15

-- ============================================
-- 1. Ensure document columns exist
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT;

-- ============================================
-- 2. Migrate existing CPF records to new columns (only if cpf column still exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cpf'
  ) THEN
    UPDATE public.profiles
    SET document_number = regexp_replace(cpf, '\D', '', 'g'),
        document_type = 'cpf'
    WHERE document_number IS NULL
      AND cpf IS NOT NULL
      AND cpf <> '';
  END IF;
END $$;

-- ============================================
-- 3. Migrate existing CNPJ records to new columns (only if cnpj column still exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cnpj'
  ) THEN
    UPDATE public.profiles
    SET document_number = regexp_replace(cnpj, '\D', '', 'g'),
        document_type = 'cnpj'
    WHERE document_number IS NULL
      AND cnpj IS NOT NULL
      AND cnpj <> '';
  END IF;
END $$;

-- ============================================
-- 4. Set default document_type for any remaining NULLs (required for NOT NULL)
-- ============================================
UPDATE public.profiles
SET document_type = 'cpf'
WHERE document_type IS NULL;

-- ============================================
-- 5. Add CHECK constraint for document_type values
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_document_type_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_document_type_check
      CHECK (document_type IN ('cpf', 'cnpj'));
  END IF;
END $$;

-- ============================================
-- 6. Add CHECK constraint for document_number format
--    cpf  -> exactly 11 digits
--    cnpj -> exactly 14 digits
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_document_number_format_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_document_number_format_check
      CHECK (
        document_number IS NULL OR
        (
          document_type = 'cpf'
          AND document_number ~ '^\d{11}$'
        ) OR
        (
          document_type = 'cnpj'
          AND document_number ~ '^\d{14}$'
        )
      );
  END IF;
END $$;

-- ============================================
-- 7. Make document_type NOT NULL
-- ============================================
ALTER TABLE public.profiles
  ALTER COLUMN document_type SET NOT NULL;

-- ============================================
-- 8. Add UNIQUE constraint on document_number for global uniqueness
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_document_number_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_document_number_unique
      UNIQUE (document_number);
  END IF;
END $$;
