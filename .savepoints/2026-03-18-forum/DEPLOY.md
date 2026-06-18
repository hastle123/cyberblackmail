# CyberBlackmail — Ubuntu (VM)

## 1. Зависимости

```bash
sudo apt update
sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Проект

```bash
git clone <your-repo> /opt/cyberblackmail
cd /opt/cyberblackmail
npm install
cp .env.example .env
## Перевод RSS на русский (бесплатно)

Достаточно **одного бесплатного ключа** в `.env`:

| Сервис | Ключ | Где взять |
|--------|------|-----------|
| **Google Gemini** (рекомендуется) | `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| **Groq** (альтернатива) | `GROQ_API_KEY` | https://console.groq.com/keys |
| MyMemory | без ключа | запасной, ~1000 слов/день |

```env
GEMINI_API_KEY=AIza...
```

Приоритет: **Gemini → Groq → OpenAI (если есть) → MyMemory**.

Догнать уже импортированные статьи:

```bash
npm run translate
TRANSLATE_LIMIT=10 npm run translate
```

Очистить фейковые «переводы» (копия английского):

```bash
npm run translate:clean
```

npm run db:setup
npm run build
```

## 3. Сайт (systemd)

`/etc/systemd/system/cyberblackmail.service`:

```ini
[Unit]
Description=CyberBlackmail Next.js
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cyberblackmail
Environment=NODE_ENV=production
EnvironmentFile=/opt/cyberblackmail/.env
ExecStart=/usr/bin/npm run start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cyberblackmail
```

Сайт: `http://<IP-VM>:3000` (русская версия: `/ru`).

## 4. Импорт новостей (cron, каждый час)

```bash
crontab -e
```

```cron
0 * * * * cd /opt/cyberblackmail && /usr/bin/npm run ingest >> /var/log/cyberblackmail-ingest.log 2>&1
```

Проверка вручную:

```bash
npm run ingest
```

## 5. HTTP через nginx (опционально)

```nginx
server {
    listen 80;
    server_name your.domain;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 6. Важно

- **SQLite** подходит для одной VM. Для Vercel + отдельный ingest нужен **общий Postgres**.
- Логи ingest: `/var/log/cyberblackmail-ingest.log`
- После обновления кода: `git pull && npm install && npm run build && sudo systemctl restart cyberblackmail`
