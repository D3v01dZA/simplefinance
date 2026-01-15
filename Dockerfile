# Stage 1: Build UI
FROM node:20 AS ui-builder
WORKDIR /build/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN sed -i 's|http://localhost:8080|.|g' ./src/app/serverSlice.ts
RUN npm run build

# Stage 2: Build API
FROM rust AS api-builder
WORKDIR /build/api
COPY api/ ./
# Copy UI build artifacts to static directory for embedding
COPY --from=ui-builder /build/ui/build ./static
COPY --from=ui-builder /build/ui/fav.svg ./static/
RUN sed -i 's|database.db|/data/database.db|g' ./src/main.rs
RUN sed -i 's|127.0.0.1|0.0.0.0|g' ./src/main.rs
RUN cargo test --release
RUN cargo build --release

# Stage 3: Final image
FROM ubuntu:24.04
RUN apt update && apt install sqlite3 -y
WORKDIR /app/
COPY --from=api-builder /build/api/target/release/simplefinance-api /usr/bin/simplefinance-api
CMD ["/usr/bin/simplefinance-api"]