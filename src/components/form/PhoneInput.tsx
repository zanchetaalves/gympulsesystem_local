
import React from "react";
import { MaskedInput } from "./MaskedInput";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

interface PhoneInputProps {
  name: string;
  label?: string;
  placeholder?: string;
}

export function PhoneInput({ name, label = "Telefone", placeholder = "(00) 00000-0000" }: PhoneInputProps) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <MaskedInput
              mask="(00) 00000-0000"
              placeholder={placeholder}
              value={field.value || ""}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
