#!/bin/bash
# Скрипт для пополнения казны через Solana CLI

VAULT_ADDRESS="99HiteJ3VVqrsNXdu2TJv7H9E76YFACgQrSwfhi9cLWT"

if [ -z "$1" ]; then
    echo "Использование: ./scripts/add-to-vault.sh <количество_SOL>"
    echo "Пример: ./scripts/add-to-vault.sh 1"
    exit 1
fi

AMOUNT=$1
echo "Пополнение казны на $AMOUNT SOL..."
solana transfer $VAULT_ADDRESS $AMOUNT --allow-unfunded-recipient

echo ""
echo "Проверка баланса казны:"
solana balance $VAULT_ADDRESS

