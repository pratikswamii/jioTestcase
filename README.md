#jio

This is a full-stack project structure for a Test Case Management System.

## Project Structure
- `backend/`: Java Spring Boot application with MongoDB integration.
- `frontend/`: Angular application with routing enabled.

## Prerequisites
- **Java 17**
- **Maven**
- **Node.js**
- **MongoDB** running locally on port `27017`

---

## Running the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the Spring Boot application using Maven:
   ```bash
   mvn spring-boot:run
   ```
3. The backend will start on `http://localhost:8080`.
   - The test API endpoint is accessible at `http://localhost:8080/api/test`.

---

## Running the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   ng serve
   ```
   Or using npm:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:4200`.
5. Open the browser's developer console (F12 or Right Click -> Inspect -> Console). You should see the message: `"Backend working!"`.
