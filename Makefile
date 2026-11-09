setup:
	cp -n .env.example .env || true
	docker compose up -d
	npm install
dev:
	npm run dev
test:
	npm test
