# 🧪 Testes do PriceInput - Suporte à Vírgula

## ✅ Casos de Uso Suportados

### **Entrada com Vírgula (Padrão Brasileiro)**
- ✅ `150,50` → `150.5` (number)
- ✅ `1,5` → `1.5` (number)  
- ✅ `1000,99` → `1000.99` (number)
- ✅ `,50` → `0.5` (number)

### **Entrada com Ponto (Padrão Internacional)**
- ✅ `150.50` → `150.5` (number)
- ✅ `1.5` → `1.5` (number)
- ✅ `1000.99` → `1000.99` (number)

### **Entrada Mista (Separador de Milhares + Decimal)**
- ✅ `1.250,50` → `1250.5` (number)
- ✅ `10.000,99` → `10000.99` (number)

### **Exibição (Sempre em Formato Brasileiro)**
- ✅ `150.5` → exibe `150,5`
- ✅ `1000.99` → exibe `1000,99`
- ✅ `0` → exibe `` (vazio)

### **Comportamento de Edição**
- ✅ **Em foco:** Mostra exatamente o que o usuário digita
- ✅ **Fora de foco:** Formata automaticamente para padrão brasileiro
- ✅ **Validação:** Permite apenas números, vírgula e ponto
- ✅ **Limpeza:** Remove caracteres inválidos automaticamente

## 🎯 Exemplos de Uso

```tsx
// Exemplo 1: Cadastro de Pagamento
<PriceInput
  label="Valor (R$)"
  value={amount}
  onChange={setAmount}
  required
/>

// Exemplo 2: Preço de Plano
<PriceInput
  label="Preço (R$)"
  placeholder="0,00"
  value={price}
  onChange={setPrice}
/>
```

## 📋 Casos de Teste Manual

1. **Digite:** `150,50` → **Deve:** Aceitar e converter para 150.5
2. **Digite:** `1.250,99` → **Deve:** Aceitar e converter para 1250.99
3. **Digite:** `abc150,50` → **Deve:** Filtrar e manter apenas `150,50`
4. **Clique fora:** → **Deve:** Formatar para padrão brasileiro com vírgula
5. **Valor zero:** → **Deve:** Campo vazio quando em foco

## ⚠️ Limitações Conhecidas

- Não suporta separador de milhares na exibição (ex: 1.250,50)
- Máximo de uma vírgula ou ponto por entrada
- Não valida valores máximos (depende da validação do formulário)
