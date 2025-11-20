A full-stack Electronic Health Record (EHR) system built with React frontend and Node.js/Express backend.

## 🚀 Features

- **Patient Management**: Register and manage patient records
- **Patient Search**: Find patients by ID with detailed information
- **RESTful API**: Complete backend API for EHR operations
- **Responsive Design**: Modern web interface

## 🛠 Technology Stack

### Frontend
- React 18
- Modern CSS
- Responsive Design

### Backend
- Node.js
- Express.js
- CORS enabled

### Deployment
- AWS EC2 Ubuntu
- Apache2 Web Server
- PM2 Process Manager

## 📁 Project Structure
ehrApp/
├── frontend/ # React frontend application
│ ├── public/ # Static assets
│ ├── src/ # Source code
│ │ ├── components/ # React components
│ │ │ ├── PatientForm.jsx
│ │ │ └── PatientSearch.jsx
│ │ ├── App.js # Main application component
│ │ ├── App.css # Application styles
│ │ └── index.js # Application entry point
│ ├── package.json # Frontend dependencies
│ └── build/ # Production build (generated)
├── backend/ # Node.js/Express backend
│ ├── server.js # Express server
│ └── package.json # Backend dependencies
└── README.md # Project documentation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Frontend Setup
```bash
cd frontend
npm install
npm start

###Backend Setup

cd backend
npm install
npm start

API Endpoints
Method	Endpoint	Description
GET	/api/health	Health check
POST	/api/patients	Create new patient
GET	/api/patients	Get all patients
GET	/api/patients/:id	Get patient by ID
🚀 Deployment
The application is deployed on AWS EC2 with:

Frontend served by Apache2

Backend running on Node.js with PM2

Apache proxy configuration for API routing
