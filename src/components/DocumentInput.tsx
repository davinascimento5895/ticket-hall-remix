import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeDocument, detectDocumentType, formatDocument, validateDocument } from "@/utils/document";

interface DocumentInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (result: { valid: boolean; type: "cpf" | "cnpj" | null; error?: string }) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export function DocumentInput({
  value,
  onChange,
  onValidation,
  disabled,
  label = "CPF ou CNPJ",
  placeholder = "000.000.000-00 ou 00.000.000/0000-00",
  id = "document-input",
  required,
}: DocumentInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const detectedType = detectDocumentType(sanitizeDocument(value));

  // Sync display value when external value changes
  useEffect(() => {
    const type = detectDocumentType(sanitizeDocument(value));
    setDisplayValue(formatDocument(value, type || "cpf"));
  }, [value]);

  const runValidation = useCallback(
    (rawValue: string) => {
      const result = validateDocument(rawValue);
      setError(result.error || null);
      onValidation?.(result);
      return result;
    },
    [onValidation]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = sanitizeDocument(e.target.value);
      const type = detectDocumentType(raw);
      const formatted = formatDocument(raw, type || "cpf");
      setDisplayValue(formatted);
      onChange(raw);

      // Clear error while typing if under min length
      if (raw.length < 11) {
        setError(null);
      } else if (touched) {
        runValidation(raw);
      }
    },
    [onChange, touched, runValidation]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    runValidation(value);
  }, [value, runValidation]);

  const badgeText = detectedType ? (detectedType === "cpf" ? "CPF" : "CNPJ") : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={18}
          className={error ? "border-destructive pr-16" : "pr-16"}
        />
        {badgeText && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {badgeText}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
