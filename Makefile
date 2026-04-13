.PHONY: help install dev up down logs ps cert rotate-prefix nginx-test

COMPOSE_PROD := docker compose -f docker-compose.prod.yml --env-file .env
NGINX_CONTAINER := tainted-grail-nginx

help: ## Показать таргеты
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  %-16s %s\n", $$1, $$2}'

install: ## Установить зависимости (server + client)
	cd server && npm install
	cd client && npm install

dev: ## Запустить dev-compose (server+client+db)
	docker compose up -d --build

up: ## Prod: поднять/обновить сервис (всё автоматом)
	@bash deploy/up.sh

down: ## Prod: остановить сервисы
	$(COMPOSE_PROD) down

logs: ## Prod: логи
	$(COMPOSE_PROD) logs -f --tail=100

ps: ## Prod: статус
	$(COMPOSE_PROD) ps

cert: ## Выпустить/перевыпустить SSL-сертификат
	@bash deploy/cert.sh

rotate-prefix: ## Сгенерировать новый URL_PREFIX и применить
	@grep -q '^URL_PREFIX=' .env || { echo "ERROR: в .env нет URL_PREFIX"; exit 1; }
	@NEW=$$(openssl rand -hex 12) && \
	sed -i "s/^URL_PREFIX=.*/URL_PREFIX=$$NEW/" .env && \
	echo "→ Новый префикс: /$$NEW/" && \
	$(MAKE) up

nginx-test: ## Проверить валидность nginx-конфига
	docker exec $(NGINX_CONTAINER) nginx -t
