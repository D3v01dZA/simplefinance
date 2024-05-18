FROM rust AS builder
WORKDIR /build/
COPY ./ ./
RUN sed -i 's|database.db|/data/database.db|g' ./src/main.rs
RUN cargo build --release

FROM ubuntu:24.04
WORKDIR /app/
COPY --from=builder /build/target/release/simplefinance-api /usr/bin/simplefinance-api
CMD ["/usr/bin/simplefinance-api"]