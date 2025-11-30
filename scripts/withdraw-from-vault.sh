#!/bin/bash
# Script to withdraw funds from the treasury vault

VAULT_ADDRESS="99HiteJ3VVqrsNXdu2TJv7H9E76YFACgQrSwfhi9cLWT"

if [ -z "$1" ]; then
    echo "Использование: ./scripts/withdraw-from-vault.sh <количество_SOL>"
    echo "Пример: ./scripts/withdraw-from-vault.sh 0.5"
    echo ""
    echo "Этот скрипт выводит средства из казны на ваш кошелек."
    echo "Казна сохраняет минимальный баланс для аренды (~0.000967 SOL)."
    exit 1
fi

AMOUNT=$1
echo "Вывод средств из казны: $AMOUNT SOL..."
echo ""

# Run the TypeScript script
npm run withdraw $AMOUNT

echo ""
echo "Проверка баланса казны после вывода:"
solana balance $VAULT_ADDRESS
