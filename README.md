# KartAi Utstillingsvindu

Each year, the Norwegian public spends about 5.6 billion NOK on planning and validating building applications. The process is complex, time-consuming, and often yields poor-quality submissions. The KartAI project aims to streamline this by developing AI tools to support the application process. The project is a collaboration between the University of Agder (UiA) and KartAI.

KartAI's main goal is to streamline municipal work processes related to cadastre and building case processing using automated, advanced data-driven methods, including artificial intelligence in combination with proactive user and citizen dialogue. The goal is to contribute to automating and streamlining the processing of building cases.

## Project Objectives

**The main objectives of our bachelor project were:**

### Develop a Chatbot Assistant

We created an AI-powered chatbot designed to act as a digital supervisor—similar to a caseworker at Kristiansand Municipality. The chatbot guides applicants through relevant regulations, zoning plans, and procedural requirements for building projects. By asking questions and providing tailored feedback, it helps users understand what is required for their specific project.

### Implement a Digital Building Application Platform

We developed a web application that allows users to create and submit digital building applications. This process is supported by integrated KartAI technologies that assist in identifying missing documentation, checking application quality against official checklists, and offering suggestions for improvement. The goal is to help applicants submit more complete and correct applications.

## Final Product

The following is a brief overview of the final product, including the system architecture and screenshots of the web application and the AI Summary Assistant.

![System Architecture](/docs/images/system_architecture.png)

## Prerequisites

Before you start, make sure the following tools are installed on your system:

- **Git:** Version control system to clone the project repository - [Download Git](https://git-scm.com/downloads)

## Setup

Start by going into the `/webapp` folder, making a copy of the `.env.example` file and renaming it to `.env`. This file contains the environment variables that the application needs to run. Open the `.env` file and update the environment variables according to your local or production setup.

## Usage

To run the full application locally, follow these steps:

### 1. Start the Frontend

From the `/webapp` directory, run:

```bash
npm run dev
```

This starts the frontend development server at http://localhost:3000.

### 2. Start the Backend

From the root directory, run the following script to start the backend services:

```bash
./setup.sh
```

### 3. Start the Database

From the `/webapp` directory, start the MySQL database with:

```bash
./start-database.sh
```

### 4. Access the Application

Once all services are running, you can access the application at http://localhost:3000.

> **🔑 Demo Login:** For testing purposes, a mock user is available with the following credentials:
>
> - **Username:** `user`
> - **Password:** `user`

### 5. API Documentation

The Swagger documentation for the API is available at [http://localhost:8000/docs](http://localhost:8000/docs).

> **💡 Note:** For full functionality, the AI models from the KartAI project must also be running. During development, we ran these models as Docker containers locally. In the future, they are expected to be available as public APIs.

## Documentation

- [Developer Setup](/docs/manuals/developer_setup.md)
- [T3 Start Guide](/docs/manuals/t3_guide.md)
