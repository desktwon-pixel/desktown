#!/bin/bash

# Extract hostname from DATABASE_URL
# URL format: postgres://user:pass@hostname:port/db...
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+).*/\1/')

echo "Original DB Host: $DB_HOST"

# Resolve to IPv4 using node (since dig/nslookup might not be available or parseable easily)
DB_IP=$(node -e "const dns = require('dns'); dns.resolve4('$DB_HOST', (err, addresses) => { if (err) { console.error(err); process.exit(1); } console.log(addresses[0]); })")

if [ $? -eq 0 ] && [ ! -z "$DB_IP" ]; then
  echo "Resolved DB IP: $DB_IP"
  # Replace hostname with IP in DATABASE_URL
  export DATABASE_URL=${DATABASE_URL/$DB_HOST/$DB_IP}
  echo "DATABASE_URL updated to use IPv4."
else
  echo "Failed to resolve DB IP or IP is empty. Using original URL."
fi

# Force IPv4 order for Node as well
export NODE_OPTIONS="--dns-result-order=ipv4first"

echo "Starting application..."
node dist/index.cjs
