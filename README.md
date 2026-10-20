# Transaction Webhook Service

A Node.js backend service for accepting transaction webhooks and
processing transactions asynchronously.

## Tech Stack

- Node.js
- Express
- MongoDB and Mongoose
- Redis and BullMQ

## Features

- Health check endpoint
- Fast webhook acknowledgment using HTTP 202
- Background transaction processing with a 30-second delay
- Duplicate transaction prevention using a unique database index
- Persistent transaction status and timestamps

## Run Locally

1. Install Node.js and Docker Desktop.
2. Install dependencies:

   npm install

3. Start MongoDB and Redis:

   docker compose up -d

4. Configure your .env file.
5. Start the API:

   npm run dev

6. Start the worker in another terminal:

   npm run worker

## API Endpoints

- GET /
- POST /v1/webhooks/transactions
- GET /v1/transactions/:transaction_id

## Technical Decisions

The API acknowledges accepted transactions without waiting for
background processing. BullMQ and Redis handle queued work, while
MongoDB stores transaction state and enforces transaction ID uniqueness.

## Deployment

API URL: Add after deployment.
API documentation: Add after deployment.