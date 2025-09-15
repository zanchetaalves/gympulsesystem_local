
import React, { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  mask: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
}

export function MaskedInput({ mask, value, onChange, ...props }: MaskedInputProps) {
  const [maskedValue, setMaskedValue] = useState("");

  // Aplica a máscara ao valor inicial e quando o valor mudar externamente
  useEffect(() => {
    setMaskedValue(applyMask(value, mask));
  }, [value, mask]);

  // Função para aplicar a máscara ao texto
  const applyMask = (text: string | null | undefined, mask: string): string => {
    if (!text) return "";

    // Remove todos os caracteres não numéricos
    const numericValue = text.replace(/\D/g, "");

    let result = "";
    let numericIndex = 0;

    // Percorre a máscara e substitui os caracteres 0 pelos números do valor
    for (let i = 0; i < mask.length; i++) {
      if (numericIndex >= numericValue.length) break;

      if (mask[i] === "0") {
        result += numericValue[numericIndex];
        numericIndex++;
      } else {
        result += mask[i];
      }
    }

    return result;
  };

  // Extrai apenas os números do valor mascarado
  const extractNumeric = (maskedText: string | null | undefined): string => {
    if (!maskedText) return "";
    return maskedText.replace(/\D/g, "");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = extractNumeric(inputValue);
    const newMaskedValue = applyMask(numericValue, mask);

    setMaskedValue(newMaskedValue);
    onChange(numericValue);
  };

  return (
    <Input
      {...props}
      value={maskedValue}
      onChange={handleChange}
    />
  );
}
