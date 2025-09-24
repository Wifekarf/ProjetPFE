# Project Index: Symfony + React Quiz & Programming Platform

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Core Functionalities](#core-functionalities)
- [Frontend Components](#frontend-components)
- [Security Model](#security-model)
- [AI Integration](#ai-integration)
- [Development Setup](#development-setup)
- [Extension Patterns](#extension-patterns)

## Project Overview

**Type**: Full-stack web application  
**Backend**: Symfony 6.4 with PHP 8.1+  
**Frontend**: React 19 with Vite  
**Purpose**: Comprehensive platform for quiz management, programming problem solving, and team management

### Key Features
- Quiz creation and assessment system
- Programming problem solving with AI evaluation
- Team management and collaboration
- Role-based access control
- AI-powered profile generation
- Real-time quiz sessions
- Guest access capabilities

## Technology Stack

### Backend (Symfony 6.4)
```yaml
Framework: Symfony 6.4
PHP Version: 8.1+
Database: Doctrine ORM with migrations
Authentication: JWT (LexikJWTAuthenticationBundle)
API: RESTful endpoints
Security: Role-based access control
AI Integration: Gemini Service
File Upload: Image and CV upload
```

### Frontend (React 19)
```yaml
Framework: React 19 with Vite
Routing: React Router DOM 7.5
Styling: Tailwind CSS 4.1
Animations: Framer Motion
HTTP Client: Axios with interceptors
UI Components: React Icons, React Select
Charts: Recharts for data visualization
```

## Architecture

### Project Structure
```
full-pfe-project/
├── backend fin/                 # Symfony Backend
│   ├── src/
│   │   ├── Controller/         # API Controllers
│   │   ├── Entity/            # Database Entities
│   │   ├── Repository/        # Data Access Layer
│   │   ├── Enum/             # Enumerations
│   │   ├── Service/          # Business Logic
│   │   └── Security/         # Authentication
│   ├── config/               # Configuration
│   ├── migrations/           # Database Migrations
│   └── public/              # Public Assets
└── QuizFront/               # React Frontend
    ├── src/
    │   ├── Admin/           # Admin Components
    │   ├── Auth/            # Authentication
    │   ├── User/            # User Components
    │   ├── Quiz/            # Quiz System
    │   ├── ProgProblem/     # Programming Problems
    │   ├── TeamManagement/  # Team Management
    │   ├── services/        # API Services
    │   └── Layout/          # Layout Components
    └── public/             # Static Assets
```

### Data Flow
1. **Authentication**: JWT-based with role validation
2. **API Communication**: Axios interceptors with automatic token handling
3. **State Management**: React hooks + LocalStorage for persistence
4. **Real-time Features**: WebSocket-like session management for quizzes

## Database Schema

### Core Entities

#### User Management
```php
// User Entity
- id: integer (primary key)
- email: string (unique)
- username: string
- password: string (hashed)
- role: UserRole enum
- rank: UserRank enum
- points_total_all: integer
- date_creation: datetime
- image: string (nullable)
- cv: string (nullable)
- status: string (active/inactive)
- profile_attributes: json (nullable)
```

#### Quiz System
```php
// Quiz Entity
- id: integer (primary key)
- nom: string
- nb_question: integer
- points_total: integer
- type: string
- date_debut: datetime
- date_fin: datetime
- date_creation: datetime
- code: string (8 chars, nullable)
- image: string (nullable)

// Question Entity
- id: integer (primary key)
- question: string
- options: json
- correctAnswer: string
- difficulty: string
- points: integer
- time: integer
- image: string (nullable)
- language: Langages (relation)
```

#### Programming Problems
```php
// ProgProblem Entity
- id: integer (primary key)
- title: string
- description: text
- nb_tasks: integer
- points_total: integer
- difficulty: string (easy/medium/hard)
- language: Langages (relation)
- time_limit: integer
- date_creation: datetime
- date_debut: datetime
- date_fin: datetime
- code: string (8 chars, nullable)

// Task Entity
- id: integer (primary key)
- title: string
- description: text
- sampleTestCases: json
- modelSolution: text
- difficulty: string
- points: integer
- time: integer
- evaluationCriteria: json
- language: Langages (relation)
```

#### Team Management
```php
// Team Entity
- id: integer (primary key)
- name: string
- teamManager: User (relation)
- members: User[] (many-to-many)
```

### Enumerations
```php
// UserRole Enum
enum UserRole: string
{
    case ROLE_USER = 'ROLE_USER';
    case ROLE_ADMIN = 'ROLE_ADMIN';
    case ROLE_TEAM_MANAGER = 'ROLE_TEAM_MANAGER';
}

// UserRank Enum
enum UserRank: string
{
    case JUNIOR = 'JUNIOR';
    case SENIOR = 'SENIOR';
    case ALTERNATE = 'ALTERNATE';
}
```

## API Endpoints

### Authentication & User Management
```yaml
POST /api/login:
  description: User authentication
  request: { email, password }
  response: { token, user_data }

POST /api/register:
  description: User registration
  request: { username, email, password }
  response: { user_data }

PUT /api/users/{id}:
  description: Update user data
  request: { pointsTotalAll }
  response: { id }

POST /api/users/upload:
  description: File upload (image/CV)
  request: FormData with image/cv files
  response: { message, image, cv }

POST /api/users/generate-profile:
  description: AI profile generation from CV
  response: { message, attributes }

GET /api/users/profile-attributes:
  description: Get profile attributes
  response: { attributes }
```

### Quiz Management
```yaml
GET /api/quizzes:
  description: List all quizzes
  response: Array of quiz objects

POST /api/quizzes:
  description: Create new quiz
  request: { nom, type, date_debut, date_fin }
  response: { id, message }

PUT /api/quizzes/{id}:
  description: Update quiz
  request: Quiz data
  response: { message }

DELETE /api/quizzes/{id}:
  description: Delete quiz
  response: { message }

POST /api/quizzes/{id}/upload:
  description: Upload quiz image
  request: FormData with image
  response: { message }
```

### Question Management
```yaml
GET /api/questions:
  description: List all questions
  response: Array of question objects

POST /api/questions/create:
  description: Create question
  request: { question, options, correctAnswer, difficulty, points, time, language_id }
  response: { id, message }

PUT /api/questions/{id}:
  description: Update question
  request: Question data
  response: { message }

DELETE /api/questions/{id}:
  description: Delete question
  response: { message }
```

### Programming Problems
```yaml
GET /api/prog-problems:
  description: List programming problems
  response: Array of problem objects

POST /api/prog-problems:
  description: Create problem
  request: { title, description, difficulty, date_debut, date_fin }
  response: { id, message }

PUT /api/prog-problems/{id}:
  description: Update problem
  request: Problem data
  response: { message }

DELETE /api/prog-problems/{id}:
  description: Delete problem
  response: { message }
```

### Task Management
```yaml
GET /api/tasks:
  description: List all tasks
  response: Array of task objects

POST /api/tasks/create:
  description: Create task
  request: { task_title, description, points, language_id, time, difficulty }
  response: { id, message }

PUT /api/tasks/{id}:
  description: Update task
  request: Task data
  response: { message }

DELETE /api/tasks/{id}:
  description: Delete task
  response: { message }
```

### Team Management
```yaml
GET /api/rhm/teams/fetch:
  description: List teams
  response: { teams: Array, total: number }

POST /api/rhm/teams/create:
  description: Create team
  request: { name, description, managerId, memberIds }
  response: { id, message }

PUT /api/rhm/teams/{id}:
  description: Update team
  request: Team data
  response: { message }

DELETE /api/rhm/teams/{id}:
  description: Delete team
  response: { message }
```

### Quiz Sessions & Guest Access
```yaml
POST /api/quiz/session/start:
  description: Start quiz session
  request: { quizId, userId }
  response: { sessionId }

POST /api/quiz/session/{id}/audit:
  description: Audit session
  request: { type, payload }
  response: { ok: true }

POST /api/quiz/session/{id}/lock:
  description: Lock session
  response: { locked: true }

POST /api/quiz/session/{id}/submit:
  description: Submit quiz
  request: { answers }
  response: { ok: true }

POST /api/quiz/guest/history:
  description: Record guest attempt
  request: { email, quizId, scorePoints, correctAnswers, userAnswer }
  response: { status: 'recorded', id }
```

### Programming Actions
```yaml
POST /prog-actions/assign-tasks-to-problem:
  description: Assign tasks to problem
  request: { progProblemId, taskIds }
  response: { message }

POST /prog-actions/assign-problems-to-users:
  description: Assign problems to users
  request: { progProblemId, userIds }
  response: { message }

POST /prog-actions/submit-solution:
  description: Submit code solution
  request: { progProblemId, taskId, code, language }
  response: { submissionId, evaluation }

POST /prog-actions/evaluate-solutions:
  description: AI evaluation
  request: { submissions }
  response: { evaluations }
```

## Core Functionalities

### 1. Quiz System
- **Quiz Creation**: Admin interface for creating quizzes with questions, time limits, scoring
- **Quiz Assignment**: Assign quizzes to specific users or teams
- **Quiz Taking**: Real-time interface with timer and progress tracking
- **Guest Access**: Anonymous users via unique codes
- **Results Tracking**: Comprehensive scoring and analytics
- **Session Management**: Secure sessions with audit trails

### 2. Programming Problem System
- **Problem Creation**: Create programming challenges with multiple tasks
- **Task Management**: Individual programming tasks with test cases
- **Code Submission**: Users submit code solutions
- **AI Evaluation**: Gemini-powered code evaluation and feedback
- **Progress Tracking**: Track completion of individual tasks
- **Language Support**: Multiple programming language support

### 3. Team Management
- **Team Creation**: Create teams with managers and members
- **Role Assignment**: Assign team managers and members
- **Team Analytics**: Track team performance and scores
- **Member Management**: Add/remove team members

### 4. User Management
- **Role-based Access**: Different interfaces for different user roles
- **Profile Management**: User profiles with images and CVs
- **AI Profile Generation**: Automatic profile attributes from CV
- **Points System**: Track user achievements and scores
- **Status Management**: Active/inactive user accounts

### 5. Analytics & Reporting
- **User Statistics**: Comprehensive user performance metrics
- **Quiz Analytics**: Quiz completion rates and scores
- **Team Performance**: Team-based analytics and comparisons
- **Programming Progress**: Track coding challenge completion

## Frontend Components

### Authentication Components
```jsx
// Auth/Login.jsx - User login interface
// Auth/Register.jsx - User registration
// Auth/ForgotPassword.jsx - Password recovery
// Auth/ResetPassword.jsx - Password reset
```

### User Dashboard Components
```jsx
// User/Home.jsx - User statistics and recent activity
// User/PlayQuiz/PlayQuiz.jsx - Quiz taking interface
// User/PlayProgrammingProblem.jsx - Programming challenge interface
// User/QuizComplete.jsx - Quiz completion summary
```

### Admin Interface Components
```jsx
// Admin/Home.jsx - Admin dashboard with system statistics
// Admin/Quiz.jsx - Quiz management interface
// Admin/Questions.jsx - Question management
// Admin/ManageUsers.jsx - User management
// Admin/RHManagerManagement.jsx - RH manager management
```

### Programming Problem Components
```jsx
// ProgProblem/ProgProblem.jsx - Problem management
// ProgProblem/Task.jsx - Task management
// ProgProblem/TaskToProblem.jsx - Task assignment
// ProgProblem/ProblemToUser.jsx - User assignment
// ProgProblem/SolveProblem.jsx - Problem solving interface
```

### Team Management Components
```jsx
// TeamManagement/TeamManagement.jsx - Team overview
// TeamManagement/CreateTeamModal.jsx - Team creation
// TeamManagement/TeamMemberModal.jsx - Member management
```

### Guest Access Components
```jsx
// CodeGeust/JoinPage.jsx - Guest quiz entry
// CodeGeust/QuizGuest.jsx - Guest quiz interface
```

## Security Model

### Authentication & Authorization
- **JWT-based authentication** with LexikJWTAuthenticationBundle
- **Role-based access control** with Symfony Security
- **Session management** with secure token handling
- **Password hashing** with Symfony security components

### Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** via Doctrine ORM
- **XSS protection** with proper output escaping
- **CSRF protection** for forms

### File Upload Security
- **File type validation** for images and documents
- **Size limits** to prevent abuse
- **Secure file storage** with unique filenames
- **Path traversal protection**

## AI Integration

### Gemini Service
```php
// Service/GeminiService.php
class GeminiService
{
    public function generateProfileFromCV(string $cvPath): array
    public function evaluateCode(string $code, string $language, array $criteria): array
    public function generateFeedback(string $submission, array $evaluation): string
}
```

### AI Features
- **CV Analysis**: Automatic profile attribute generation from uploaded CVs
- **Code Evaluation**: AI-powered programming solution evaluation
- **Feedback Generation**: Intelligent feedback for programming submissions
- **Performance Insights**: AI-driven analytics and recommendations

## Development Setup

### Backend Setup
```bash
# Navigate to backend directory
cd "backend fin"

# Install dependencies
composer install

# Configure environment
cp .env.example .env
# Edit .env with database and API keys

# Run database migrations
php bin/console doctrine:migrations:migrate

# Start development server
php bin/console server:start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd QuizFront

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```env
# Backend .env
DATABASE_URL="mysql://user:password@localhost/database_name"
JWT_SECRET_KEY="your-jwt-secret-key"
GEMINI_API_KEY="your-gemini-api-key"

# Frontend .env
VITE_API_BASE_URL="http://localhost:8000"
```

## Extension Patterns

### 1. Adding New API Endpoints

#### Step 1: Create Entity (if needed)
```php
// backend fin/src/Entity/NewEntity.php
<?php

namespace App\Entity;

use App\Repository\NewEntityRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: NewEntityRepository::class)]
class NewEntity
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    // Add getters and setters
}
```

#### Step 2: Create Controller
```php
// backend fin/src/Controller/NewController.php
<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/new-endpoint', name: 'api_new_')]
class NewController extends AbstractController
{
    #[Route('/', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // Implementation
        return $this->json(['data' => 'example']);
    }

    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Implementation
        return $this->json(['message' => 'Created']);
    }
}
```

#### Step 3: Create Repository (if needed)
```php
// backend fin/src/Repository/NewEntityRepository.php
<?php

namespace App\Repository;

use App\Entity\NewEntity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class NewEntityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, NewEntity::class);
    }

    // Add custom query methods
}
```

### 2. Adding New Frontend Features

#### Step 1: Create Component
```jsx
// QuizFront/src/NewFeature/NewComponent.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import AuthLayout from '../Layout/AuthLayout';

export default function NewComponent() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/api/new-endpoint');
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">New Feature</h1>
                {/* Component content */}
            </div>
        </AuthLayout>
    );
}
```

#### Step 2: Add Route
```jsx
// QuizFront/src/main.jsx
import NewComponent from './NewFeature/NewComponent.jsx';

// Add to Routes
<Route path="/new-feature" element={<NewComponent />} />
```

#### Step 3: Create API Service
```javascript
// QuizFront/src/services/newFeatureApi.js
import api from './api';

export const newFeatureApi = {
    getData: () => api.get('/api/new-endpoint'),
    createData: (data) => api.post('/api/new-endpoint', data),
    updateData: (id, data) => api.put(`/api/new-endpoint/${id}`, data),
    deleteData: (id) => api.delete(`/api/new-endpoint/${id}`),
};
```

### 3. Adding New User Roles

#### Step 1: Update Enum
```php
// backend fin/src/Enum/UserRole.php
enum UserRole: string
{
    case ROLE_USER = 'ROLE_USER';
    case ROLE_ADMIN = 'ROLE_ADMIN';
    case ROLE_TEAM_MANAGER = 'ROLE_TEAM_MANAGER';
    case ROLE_NEW_ROLE = 'ROLE_NEW_ROLE'; // Add new role
}
```

#### Step 2: Update Security Configuration
```yaml
# backend fin/config/packages/security.yaml
security:
    role_hierarchy:
        ROLE_ADMIN: [ROLE_NEW_ROLE]
        ROLE_NEW_ROLE: [ROLE_USER]
```

#### Step 3: Add Role-based Components
```jsx
// QuizFront/src/NewRole/NewRoleDashboard.jsx
export default function NewRoleDashboard() {
    // Component for new role
}
```

### 4. Adding New Features to Existing Modules

#### For Quiz System
```php
// 1. Extend Quiz entity
#[ORM\Column(type: 'json', nullable: true)]
private ?array $newFeature = null;

// 2. Update QuizController
#[Route('/new-feature', name: 'new_feature', methods: ['POST'])]
public function newFeature(Request $request): JsonResponse
{
    // Implementation
}

// 3. Update frontend quiz components
// QuizFront/src/Quiz/Quiz.jsx - Add new feature UI
```

#### For Programming Problems
```php
// 1. Extend ProgProblem entity
#[ORM\Column(type: 'text', nullable: true)]
private ?string $newCriteria = null;

// 2. Update evaluation logic
// Service/GeminiService.php - Add new evaluation criteria

// 3. Update frontend problem interface
// QuizFront/src/ProgProblem/ProgProblem.jsx - Add new feature
```

#### For Team Management
```php
// 1. Add new team properties
#[ORM\Column(type: 'string', nullable: true)]
private ?string $newProperty = null;

// 2. Update team controllers
// Controller/TeamController.php - Add new endpoints

// 3. Extend team management UI
// QuizFront/src/TeamManagement/TeamManagement.jsx - Add new features
```

### 5. Database Migration Pattern
```php
// backend fin/migrations/Version20250101000000.php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250101000000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user ADD new_column VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user DROP new_column');
    }
}
```

### 6. Frontend State Management Pattern
```jsx
// Custom hook for new feature
// QuizFront/src/hooks/useNewFeature.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useNewFeature = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/new-endpoint');
            setData(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createData = async (newData) => {
        try {
            const response = await api.post('/api/new-endpoint', newData);
            setData(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, error, createData, fetchData };
};
```

## Common Patterns

### API Response Format
```json
{
    "success": true,
    "data": {},
    "message": "Operation completed successfully",
    "errors": []
}
```

### Error Handling Pattern
```php
// Backend
try {
    // Operation
    return $this->json(['success' => true, 'data' => $result]);
} catch (\Exception $e) {
    return $this->json(['success' => false, 'error' => $e->getMessage()], 500);
}
```

```jsx
// Frontend
try {
    const response = await api.post('/api/endpoint', data);
    // Handle success
} catch (error) {
    console.error('Error:', error.response?.data?.error || error.message);
    // Handle error
}
```

### Authentication Pattern
```jsx
// Frontend authentication check
useEffect(() => {
    if (!localStorage.getItem("user")) {
        navigate("/login");
    }
}, []);
```

### Loading State Pattern
```jsx
const [loading, setLoading] = useState(true);

// In component
{loading ? (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
) : (
    // Component content
)}
```

This structured documentation provides a complete reference for understanding and extending the Symfony + React project, with clear patterns for adding new features while maintaining consistency with the existing architecture. 