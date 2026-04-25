.PHONY: help install dev up down logs ps setup cert-rotate cert-autorenew-install cert-autorenew-uninstall rotate-prefix nginx-test

COMPOSE_PROD := docker compose -f docker-compose.prod.yml --env-file .env
NGINX_CONTAINER := tainted-grail-nginx

help: ## Показать таргеты
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-28s %s\n", $$1, $$2}'

install: ## Установить зависимости (server + client)
	cd server && npm install
	cd client && npm install

dev: ## Запустить dev-compose (server+client+db)
	docker compose up -d --build

setup: ## [root, one-time] ACL для bot + первый серт + systemd-timer для авто-ротации
	@bash deploy/setup.sh

up: ## [bot] Prod: git pull, build, поднять/обновить сервис
	@bash deploy/up.sh

down: ## [bot] Prod: остановить сервисы
	$(COMPOSE_PROD) down

logs: ## [bot] Prod: логи
	$(COMPOSE_PROD) logs -f --tail=100

ps: ## [bot] Prod: статус
	$(COMPOSE_PROD) ps

cert-rotate: ## [root] Разовая ручная ротация SSL-серта (escape hatch)
	@bash deploy/cert.sh

cert-autorenew-install: ## [root] Установить systemd-timer для авто-ротации серта
	@bash deploy/autorenew-install.sh

cert-autorenew-uninstall: ## [root] Снять systemd-timer для авто-ротации серта
	@bash deploy/autorenew-uninstall.sh

rotate-prefix: ## [bot] Сгенерировать новый URL_PREFIX и применить
	@grep -q '^URL_PREFIX=' .env || { echo "ERROR: в .env нет URL_PREFIX"; exit 1; }
	@NEW=$$(openssl rand -hex 12) && \
	sed -i "s/^URL_PREFIX=.*/URL_PREFIX=$$NEW/" .env && \
	echo "→ Новый префикс: /$$NEW/" && \
	$(MAKE) up

nginx-test: ## [bot] Проверить валидность nginx-конфига
	docker exec $(NGINX_CONTAINER) nginx -t
