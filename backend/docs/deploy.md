# Deploying Flyball on your own server

One domain, two processes behind nginx:

```
https://flyball.example.com
  /api/*, /health  →  Laravel  (php-fpm, this folder's public/index.php)
  everything else  →  Next.js  (next start on 127.0.0.1:3000)
```

Same origin means no CORS, and the session cookie is first-party. The Gemini
key exists only in `backend/.env` on the server.

Examples assume Ubuntu/Debian, the repo at `/srv/flyball_web`, and a `flyball`
system user; adjust paths and names to taste.

## 1. Backend

```bash
sudo apt install php8.3-fpm php8.3-sqlite3 php8.3-mbstring php8.3-curl php8.3-intl php8.3-xml composer
cd /srv/flyball_web/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
#   APP_ENV=production  APP_DEBUG=false  APP_URL=https://flyball.example.com
#   GEMINI_API_KEY=...  FLYBALL_BUFFER_TARGET=3
php artisan key:generate
touch database/flyball_app.sqlite database/flyball_cache.sqlite
php artisan migrate --force
php artisan config:cache && php artisan route:cache
sudo chown -R flyball:www-data storage bootstrap/cache database
sudo chmod -R ug+rw storage bootstrap/cache database
```

AI requests can run for up to ~3 minutes on a cache miss, so raise the PHP
limits in the FPM pool (`/etc/php/8.3/fpm/pool.d/flyball.conf`):

```ini
request_terminate_timeout = 200
php_admin_value[max_execution_time] = 200
```

### Queue worker (keeps ready rounds/boards warm)

`/etc/systemd/system/flyball-queue.service`:

```ini
[Unit]
Description=Flyball queue worker
After=network.target

[Service]
User=flyball
WorkingDirectory=/srv/flyball_web/backend
ExecStart=/usr/bin/php artisan queue:work --timeout=900 --tries=1 --sleep=3
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now flyball-queue
```

Skip it only if you set `FLYBALL_BUFFER_TARGET=0`. After deploying new code run
`php artisan queue:restart`.

## 2. Frontend

```bash
cd /srv/flyball_web/frontend
npm ci
npm run build            # also syncs ../backend/resources/shared
```

`/etc/systemd/system/flyball-web.service` (or use pm2):

```ini
[Unit]
Description=Flyball Next.js
After=network.target

[Service]
User=flyball
WorkingDirectory=/srv/flyball_web/frontend
Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now flyball-web
```

## 3. nginx

```nginx
server {
    listen 443 ssl http2;
    server_name flyball.example.com;
    # ssl_certificate / ssl_certificate_key — e.g. from certbot

    # Next.js adds frame/nosniff/referrer headers to pages; these cover the API too.
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;

    # Laravel: API + health check
    location ~ ^/(api/|health$) {
        root /srv/flyball_web/backend/public;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/index.php;
        fastcgi_param HTTPS on;
        fastcgi_pass unix:/run/php/php8.3-fpm-flyball.sock;
        fastcgi_read_timeout 200s;
    }

    # Next.js: every page
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name flyball.example.com;
    return 301 https://$host$request_uri;
}
```

`fastcgi_param HTTPS on` is what makes Laravel mark the session cookie
`Secure`.

## 4. Check it

```bash
curl https://flyball.example.com/health        # {"status":"ok","aiConfigured":true}
journalctl -u flyball-queue -f                 # buffer refills after the first requests
```

## Updating

```bash
git pull
cd backend && composer install --no-dev -o && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan queue:restart
cd ../frontend && npm ci && npm run build && sudo systemctl restart flyball-web
```
