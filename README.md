# Attendance Management System

A full-stack attendance management system with RFID integration.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- RFID Reader (SYC ID&IC compatible)

## Project Structure

```
.
├── backend/         # NestJS backend
├── frontend/        # React frontend
└── components/      # Shared components
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd attendance
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Environment Setup:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Update the environment variables with your configuration

## Environment Variables

The following environment variables are required:

```
# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=attendance_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# API Configuration
PORT=3001
HOST=localhost
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE attendance_db;
```

2. Run migrations:
```bash
cd backend
npm run migrate:dev
```

3. (Optional) Seed the database:
```bash
npm run seed
```

## Development

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Production Build

1. Build the backend:
```bash
cd backend
npm run build
```

2. Build the frontend:
```bash
cd frontend
npm run build
```

## Security Considerations

- All sensitive information should be stored in environment variables
- JWT secrets should be strong and unique per environment
- Database passwords should be complex and regularly updated
- CORS is configured to restrict access to known origins

## Deployment

1. Set up environment variables on your hosting platform
2. Build both frontend and backend applications
3. Deploy the backend API first
4. Update the frontend API URL environment variable
5. Deploy the frontend application

## RFID Reader Setup

1. Connect the RFID reader to your system
2. Update the `config.json` with your device's specifications:
   - vendor_id
   - product_id
   - device_name

## Troubleshooting

Common issues and their solutions:

1. Database Connection Issues:
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. RFID Reader Not Detected:
   - Verify USB connection
   - Check device permissions
   - Confirm vendor and product IDs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license here]
