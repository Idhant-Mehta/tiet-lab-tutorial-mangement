# Overview

CodeEval is a web-based programming assignment platform designed for computer science education. The application enables teachers to create, distribute, and evaluate C programming assignments while providing students with an integrated coding environment for solving problems. The platform features AI-powered assignment generation, real-time code submission, and automated feedback systems.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing a component-based architecture with the following key design decisions:

- **React Router Alternative**: Uses Wouter for lightweight client-side routing, providing simpler navigation management compared to React Router
- **UI Framework**: Implements Shadcn/UI components built on Radix UI primitives, offering accessible and customizable interface elements
- **State Management**: Employs TanStack Query (React Query) for server state management, eliminating the need for complex client-side state solutions like Redux
- **Styling**: Uses Tailwind CSS with CSS custom properties for theming, enabling consistent design system implementation
- **Form Handling**: Integrates React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The backend follows a RESTful API design using Express.js with TypeScript:

- **Framework**: Express.js provides the web server foundation with middleware-based request processing
- **Authentication**: Implements Passport.js with local strategy for session-based authentication, using crypto for password hashing
- **Session Management**: Uses express-session with configurable storage backends (memory store for development)
- **API Structure**: Organizes routes by feature (auth, assignments, submissions) with centralized error handling
- **Type Safety**: Shares TypeScript schemas between frontend and backend using a shared module approach

## Data Storage Solutions
The application uses a flexible storage architecture:

- **ORM**: Drizzle ORM provides type-safe database interactions with PostgreSQL dialect support
- **Schema Design**: Implements three core entities - users (teachers/students), assignments (with embedded problem data), and submissions
- **Database**: Configured for PostgreSQL with Neon Database integration for cloud deployment
- **Development Storage**: Includes in-memory storage implementation for development and testing environments

## Authentication and Authorization
Security is implemented through multiple layers:

- **Password Security**: Uses Node.js crypto module with scrypt for secure password hashing and salt generation
- **Session Management**: Express-session handles user sessions with configurable storage and security settings
- **Role-Based Access**: Implements teacher/student role differentiation with route-level authorization checks
- **CSRF Protection**: Session-based authentication provides implicit CSRF protection

## External Dependencies

### AI Integration
- **OpenAI API**: Integrates GPT-5 for automated programming assignment generation, creating problems with varying difficulty levels and comprehensive test cases
- **Content Generation**: AI generates problem descriptions, input/output specifications, constraints, and test cases based on specified topics and difficulty distributions

### Database Services
- **Neon Database**: Cloud PostgreSQL service for production database hosting with serverless scaling capabilities
- **Connection Management**: Uses @neondatabase/serverless for optimized database connections in serverless environments

### Development Tools
- **Vite**: Modern build tool providing fast development server with Hot Module Replacement (HMR) and optimized production builds
- **TypeScript**: End-to-end type safety across frontend, backend, and shared schemas
- **Drizzle Kit**: Database migration and schema management tool for PostgreSQL operations

### UI and Styling
- **Radix UI**: Provides accessible, unstyled component primitives for complex UI elements like dialogs, dropdowns, and form controls
- **Tailwind CSS**: Utility-first CSS framework with custom design system implementation
- **Lucide React**: Icon library providing consistent iconography throughout the application

### Code Execution Environment
The application is designed to integrate with code execution services for running and testing submitted C programs, though the specific execution backend is configurable based on deployment requirements.