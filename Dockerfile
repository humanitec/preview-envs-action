FROM node:16-alpine as base


FROM base as api-generate

RUN apk add --no-cache openjdk17

RUN npm install @openapitools/openapi-generator-cli -g
