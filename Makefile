
GEN_IMG_NAME := humanitec/dynamic-env-action-api-generate

build-api-generate:
	docker build -t $(GEN_IMG_NAME) .

generate-client:
	docker run --rm -it -v $(PWD):/app -w /app $(GEN_IMG_NAME) \
		openapi-generator-cli generate -i ./openapi.json -g typescript-axios -o ./src/humanitec/generated
