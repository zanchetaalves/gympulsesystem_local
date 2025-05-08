
import { MaskedInput } from "./MaskedInput";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

interface CPFInputProps {
  name: string;
  label?: string;
  placeholder?: string;
}

export function CPFInput({ name, label = "CPF", placeholder = "000.000.000-00" }: CPFInputProps) {
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
              mask="000.000.000-00"
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
