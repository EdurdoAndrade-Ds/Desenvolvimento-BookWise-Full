FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV NPM_CONFIG_REGISTRY=${NPM_REGISTRY}

COPY frontend/package.json frontend/package-lock.json ./
RUN sed -i -E "s|https?://[^/]+/artifactory/api/npm/[^/]+/|${NPM_CONFIG_REGISTRY%/}/|g" package-lock.json \
    && npm ci --ignore-scripts --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=backend-build /app/backend/target/*.jar app.jar

ENV SERVER_PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
