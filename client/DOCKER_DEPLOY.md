# Docker Deployment с HTTPS

Этот гайд поможет запустить Slotmachine клиент с HTTPS через Docker и nginx.

## Требования

- Docker
- Docker Compose
- OpenSSL (для генерации SSL сертификатов)

## Быстрый старт

### 1. Установите зависимости (если еще не установлены)

```bash
npm install
```

### 2. Создайте SSL сертификаты

**Вариант A: Self-signed сертификат (для тестирования)**

```bash
./generate-ssl.sh
```

**Вариант B: Let's Encrypt (для продакшена с доменом)**

Если у вас есть домен, используйте certbot:

```bash
# Установите certbot
sudo apt-get update
sudo apt-get install certbot

# Получите сертификат
sudo certbot certonly --standalone -d ваш-домен.ru

# Скопируйте сертификаты
mkdir -p ssl
sudo cp /etc/letsencrypt/live/ваш-домен.ru/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/ваш-домен.ru/privkey.pem ssl/key.pem
```

### 3. Соберите и запустите Docker контейнер

```bash
docker-compose up -d --build
```

### 4. Проверьте статус

```bash
docker-compose ps
docker-compose logs -f
```

### 5. Откройте приложение

**Для self-signed сертификата:**
- Откройте https://158.160.195.111 в браузере
- Браузер покажет предупреждение о безопасности (это нормально для self-signed)
- Нажмите "Продолжить" или "Accept the Risk"

**Для Let's Encrypt сертификата:**
- Откройте https://ваш-домен.ru

## Управление

### Остановить контейнер
```bash
docker-compose down
```

### Перезапустить
```bash
docker-compose restart
```

### Просмотр логов
```bash
docker-compose logs -f
```

### Пересобрать после изменений в коде
```bash
docker-compose down
docker-compose up -d --build
```

## Структура файлов

```
client/
├── Dockerfile              # Конфигурация Docker
├── docker-compose.yml      # Docker Compose конфигурация
├── nginx.conf             # Конфигурация nginx
├── generate-ssl.sh        # Скрипт генерации SSL
├── .dockerignore          # Исключения для Docker
└── ssl/                   # SSL сертификаты (создается автоматически)
    ├── cert.pem
    └── key.pem
```

## Troubleshooting

### Phantom не подключается

1. Убедитесь что используете HTTPS (не HTTP)
2. Для self-signed сертификата: примите предупреждение браузера
3. Проверьте что Phantom установлен и активен
4. Откройте консоль браузера (F12) и проверьте ошибки

### Порты заняты

Если порты 80 или 443 уже заняты:

```bash
# Проверьте какой процесс использует порт
sudo lsof -i :80
sudo lsof -i :443

# Остановите конфликтующий сервис
sudo systemctl stop nginx  # если запущен системный nginx
```

### Ошибки сборки

```bash
# Очистите Docker кеш
docker system prune -a

# Пересоберите
docker-compose up -d --build --force-recreate
```

## Продакшен

Для продакшена рекомендуется:

1. Использовать настоящий домен
2. Установить Let's Encrypt сертификат
3. Настроить автообновление сертификатов
4. Добавить мониторинг и логирование

### Автообновление Let's Encrypt

Добавьте в crontab:

```bash
0 3 * * * certbot renew --quiet && docker-compose restart
```
