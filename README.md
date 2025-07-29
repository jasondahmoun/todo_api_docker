# Todo API with Docker

A simple RESTful Todo API built with Express.js and MySQL, fully containerized with Docker.

## Project Objectives

This project demonstrates:
- Building a RESTful API with Express.js
- Using MySQL for data persistence
- Containerization with Docker and Docker Compose
- DevOps practices and CI/CD preparation
- Using a GitHub Projects Kanban board for project management

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL 8
- **Containerization**: Docker, Docker Compose
- **Project Management**: GitHub Projects (Kanban)

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v4.0 or higher)
- [Git](https://git-scm.com/)

## Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/todo_api_docker.git
cd todo_api_docker
```

### Start the application with Docker Compose

```bash
docker compose up --build
```

The API will be available at http://localhost:3000

### Local Development (without Docker)

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with database configuration (already in the repo, edit if needed)

3. Start local MySQL server or connect to your existing database

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /tasks   | List all tasks |
| GET    | /tasks/:id | Get a specific task by ID |
| POST   | /tasks   | Create a new task |
| PUT    | /tasks/:id | Update an existing task |
| DELETE | /tasks/:id | Delete a task |

### Request/Response Examples

#### Create a Task
```json
{
  "description": "Learn Docker"
}

{
  "id": 1,
  "description": "Learn Docker",
  "state": "todo",
  "created_at": "2023-04-10T14:20:00.000Z"
}
```

#### Update a Task
```json
{
  "state": "doing"
}

{
  "id": 1,
  "description": "Learn Docker",
  "state": "doing",
  "created_at": "2023-04-10T14:20:00.000Z"
}
```

## Project Management

The development of this project is tracked using a GitHub Projects Kanban board. Check the [project board](https://github.com/your-username/todo_api_docker/projects/1) to see the current state of development.

## CI/CD

This project is prepared for CI/CD with GitHub Actions. A workflow file will be added in `.github/workflows/ci.yml` to automate the build, testing, and deployment processes.

## Contributing

1. Create an issue in the GitHub repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## License

This project is licensed under the ISC License.
