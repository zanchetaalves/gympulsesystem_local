
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends React.ComponentProps<typeof Input> {
  mask: string;
  value: string;
  onChange: (value: string) => void;
}

export function MaskedInput({ mask, value, onChange, ...props }: MaskedInputProps) {
  const [maskedValue, setMaskedValue] = useState("");

  // Aplica a máscara ao valor inicial e quando o valor mudar externamente
  useEffect(() => {
    setMaskedValue(applyMask(value, mask));
  }, [value, mask]);

  // Função para aplicar a máscara ao texto
  const applyMask = (text: string, mask: string): string => {
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
  const extractNumeric = (maskedText: string): string => {
    return maskedText.replace(/\D/g, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
