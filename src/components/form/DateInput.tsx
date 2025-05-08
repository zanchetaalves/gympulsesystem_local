
import React, { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MaskedInput } from "./MaskedInput";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface DateInputProps {
  name: string;
  label?: string;
  placeholder?: string;
}

export function DateInput({ name, label = "Data", placeholder = "DD/MM/AAAA" }: DateInputProps) {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Função para converter string de data (DD/MM/YYYY) para objeto Date
  const stringToDate = (dateString: string): Date | undefined => {
    if (!dateString || dateString.length !== 10) return undefined;
    
    const [day, month, year] = dateString.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
    
    // Importante: o mês no construtor Date é base 0 (janeiro = 0)
    const date = new Date(year, month - 1, day);
    
    // Verificar se é uma data válida
    if (
      date.getDate() !== day || 
      date.getMonth() !== month - 1 || 
      date.getFullYear() !== year
    ) {
      return undefined;
    }
    
    return date;
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        // Atualiza o input value quando o valor do campo muda
        useEffect(() => {
          if (field.value) {
            const date = field.value instanceof Date ? field.value : new Date(field.value);
            if (!isNaN(date.getTime())) {
              setInputValue(format(date, "dd/MM/yyyy"));
            }
          } else {
            setInputValue("");
          }
        }, [field.value]);
        
        return (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <div className="relative">
                <FormControl>
                  <MaskedInput
                    mask="00/00/0000"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(value) => {
                      setInputValue(value);
                      if (value.length === 8) {
                        const formattedValue = value.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
                        const date = stringToDate(formattedValue);
                        if (date) {
                          field.onChange(date);
                        }
                      } else if (!value) {
                        field.onChange(undefined);
                      }
                    }}
                    className="pr-10"
                  />
                </FormControl>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="absolute right-0 top-0 h-full px-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setOpen(false);
                  }}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
