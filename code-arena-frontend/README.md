# Code Arena Frontend

## Run the application

Install dependencies and start the frontend from this directory:

```sh
npm install
npm run dev
```

By default, the frontend uses `http://localhost:5000/api` for API requests and
`http://localhost:5000` for authenticated Socket.IO connections. Set
`VITE_API_BASE_URL` and `VITE_SOCKET_URL` in the frontend environment when the
backend is hosted elsewhere. The backend must be running with PostgreSQL and
Redis available for matchmaking and battles.

Run `npm run lint` and `npm run build` to validate the frontend.
