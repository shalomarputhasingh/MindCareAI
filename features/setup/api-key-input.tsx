"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  id?: string;
  label?: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Password-style API key field with a show/hide toggle.
 *
 * Shared by the setup wizard and the settings page so the two never drift.
 * Always starts masked; never logs or otherwise surfaces the value except to
 * whatever the caller does with `onChange`.
 */
export function ApiKeyInput({
  id,
  label = "API key",
  value,
  onChange,
  placeholder = "Paste your key",
  autoFocus,
  disabled,
  className,
}: ApiKeyInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide API key" : "Show API key"}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
