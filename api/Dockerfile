FROM rust AS builder
WORKDIR /build/
COPY ./ ./
RUN sed -i 's|database.db|/data/database.db|g' ./src/main.rs
RUN sed -i 's|127.0.0.1|0.0.0.0|g' ./src/main.rs
RUN cargo test --release
RUN cargo build --release

FROM ubuntu:24.04
RUN apt update && apt install sqlite3 -y
WORKDIR /app/
COPY --from=builder /build/target/release/simplefinance-api /usr/bin/simplefinance-api
CMD ["/usr/bin/simplefinance-api"]
