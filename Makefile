BACKEND := backend
WORKOUT := apps/workout

.PHONY: schema generate-api

## Generate OpenAPI schema from Django backend
schema:
	cd $(BACKEND) && docker compose run --rm web python manage.py spectacular --file schema.yml

## Generate RTK Query hooks for workout app (filtered to /api/workout/ + /api/auth/)
generate-api: schema
	cp $(BACKEND)/schema.yml $(WORKOUT)/openapi-schema.yml
	cd $(WORKOUT) && npx @rtk-query/codegen-openapi src/api/rtk-query-codegen.config.js
