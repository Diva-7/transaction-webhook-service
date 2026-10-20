# Transaction Webhook Service

A Node.js service that accepts transaction webhook requests, stores transaction records in MongoDB, and processes them asynchronously using BullMQ and Redis.

**Live API:** https://transaction-webhook-service-0qa4.onrender.com  
**GitHub Repository:** https://github.com/Diva-7/transaction-webhook-service

## Features

- Accepts transaction webhook requests and responds with `202 Accepted`.
- Stores transaction details and processing status in MongoDB Atlas.
- Processes transactions asynchronously using BullMQ and Redis.
- Simulates an external processing step with a 30-second delay.
- Provides an endpoint to check transaction status.
- Uses unique transaction IDs to prevent duplicate transaction records.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — REST API framework
- **MongoDB Atlas** — Persistent transaction storage
- **Mongoose** — MongoDB object modeling
- **Redis Cloud** — Queue storage
- **BullMQ** — Asynchronous job processing
- **Render** — Application hosting

## Architecture

The API and BullMQ worker run in the same Render Web Service.

1. The API receives a transaction webhook.
2. The transaction is stored in MongoDB with status `PROCESSING`.
3. A job is added to the BullMQ queue in Redis.
4. The API returns `202 Accepted` without waiting for processing to finish.
5. The worker waits 30 seconds to simulate an external API call.
6. The worker updates the transaction status to `PROCESSED` and records `processed_at`.
7. Clients can retrieve the latest status using the transaction endpoint.

## API Endpoints

Base URL:

```text
https://transaction-webhook-service-0qa4.onrender.com
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/v1/webhooks/transactions` | Submit a transaction |
| GET | `/v1/transactions/:transaction_id` | Retrieve transaction details and status |

### 1. Health Check

**Request**

```http
GET /
```

Example:

```bash
curl https://transaction-webhook-service-0qa4.onrender.com/
```

The endpoint returns the service health status and the current timestamp.

### 2. Submit a Transaction

**Request**

```http
POST /v1/webhooks/transactions
Content-Type: application/json
```

Example:

```bash
curl -X POST \
  https://transaction-webhook-service-0qa4.onrender.com/v1/webhooks/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-demo-001",
    "source_account": "ACC001",
    "destination_account": "ACC002",
    "amount": 100,
    "currency": "INR"
  }'
```

A valid request returns HTTP `202 Accepted` while processing continues asynchronously.

### Request Fields

| Field | Type | Description |
|---|---|---|
| `transaction_id` | String | Unique transaction identifier |
| `source_account` | String | Source account identifier |
| `destination_account` | String | Destination account identifier |
| `amount` | Number | Transaction amount; must be positive |
| `currency` | String | Three-letter currency code, such as `INR` |

### 3. Get Transaction Status

**Request**

```http
GET /v1/transactions/:transaction_id
```

Example:

```bash
curl https://transaction-webhook-service-0qa4.onrender.com/v1/transactions/txn-demo-001
```

A transaction starts with status `PROCESSING`. After successful processing, its status becomes `PROCESSED`.

The transaction response includes the transaction details, `created_at`, and `processed_at`. The `processed_at` field is `null` while the transaction is still processing.

## Idempotency

The service uses a unique transaction ID to prevent duplicate transaction records. Repeated requests with the same `transaction_id` should not create another transaction or trigger duplicate processing.

A unique database constraint helps enforce this behavior when concurrent requests arrive.

## Local Setup

### Prerequisites

- Node.js 22 or a version compatible with the installed dependencies
- npm
- MongoDB Atlas or a local MongoDB instance
- A Redis instance compatible with BullMQ

### 1. Clone the Repository

```bash
git clone https://github.com/Diva-7/transaction-webhook-service.git
cd transaction-webhook-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3333
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_cloud_tls_connection_url
NODE_ENV=development
```

Replace the placeholder values with your actual connection strings.

**Security:** Do not commit `.env` or expose database credentials in your repository.

### 4. Start the Application

```bash
npm start
```

The API and BullMQ worker start in the same Node.js process.

Local API URL:

```text
http://localhost:3333
```

The application uses `process.env.PORT` when a port is provided by the hosting platform, with `3333` as the local default.

## Deployment on Render

The application is deployed as a single Render Web Service.

**Build Command**

```bash
npm install
```

**Start Command**

```bash
npm start
```

Configure these environment variables in the Render service settings:

- `MONGODB_URI` — MongoDB Atlas connection string
- `REDIS_URL` — Redis Cloud TLS connection URL
- `NODE_ENV` — `production`

Render supplies the production `PORT` environment variable. MongoDB Atlas must allow connections from the Render service's outbound IP ranges.

The Redis connection must use the correct Redis Cloud endpoint, port, credentials, and TLS settings.

## Design Decisions

- **Express.js** provides a lightweight REST API.
- **MongoDB Atlas** stores transaction records and timestamps.
- **BullMQ and Redis** separate request acceptance from delayed processing.
- **Unique transaction IDs** help enforce idempotency.
- **A single Render Web Service** runs the API and worker to reduce hosting costs for the assessment.

## Limitations

- The 30-second delay simulates an external API call; it does not perform an actual financial transfer.
- Render free web services can spin down during inactivity, which may delay background processing.
- This implementation is intended for an engineering assessment, not as a production payment-processing system.
- A production system would require stronger job recovery guarantees, monitoring, authentication, and reconciliation.

## License

Created as part of a full-stack engineering assessment.
