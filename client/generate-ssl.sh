#!/bin/bash

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=RU/ST=State/L=City/O=Organization/CN=158.160.195.111"

echo "SSL certificates generated successfully in ./ssl/"
echo "cert.pem - Certificate"
echo "key.pem - Private key"
