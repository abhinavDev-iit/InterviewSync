# InterviewSync

InterviewSync is a compact real-time coding interview platform. Interviewers create rooms with a problem and starter code, candidates join with a room code, and candidate edits are streamed live with Socket.IO. The app also supports sandboxed code runs through Judge0, interview feedback, and role-based room access.

## Local setup

1. Install dependencies with `npm install`, `npm install --prefix backend`, and `npm install --prefix frontend`.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `JWT_SECRET`. Set `CODE_EXECUTION_API_URL` and `CODE_EXECUTION_API_KEY` if your Judge0 host requires authentication.
3. Optionally copy `frontend/.env.example` to `frontend/.env` when the API is not at `http://localhost:5000`.
4. Start both apps with `npm run dev` from the project root.

Run all tests with `npm test` and build the frontend with `npm run build`.
