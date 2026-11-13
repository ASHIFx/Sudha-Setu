# Sudha Setu

## Run frontend and backend in one Docker container

The Docker image builds the React frontend and serves it, along with the Express API and Socket.IO endpoint, from one container on port 5000. MongoDB is not included; configure `MONGO_URI` for a reachable MongoDB instance.

1. Copy `backend/.env.example` to `backend/.env` and set at least `MONGO_URI` and a `JWT_SECRET` of 32 or more characters. Add any other credentials needed by the features you use.
2. Start the app from the repository root:

   ```sh
   docker compose up --build
   ```

3. Open `http://localhost:5000`. The API health endpoint is `http://localhost:5000/api/health`.

Set `CLIENT_ORIGINS` in the environment or `backend/.env` to the browser-facing origin when accessing the app through a different hostname or port. Stop the container with `docker compose down`.
