.PHONY: dev down logs install

install:
	cd server && npm install
	cd client && npm install

dev:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f
