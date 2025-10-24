# Resto AI

A comprehensive restaurant management system with AI-powered reservation handling and Zenchef integration.

## Overview

This monorepo contains a full-stack application for restaurant management, including:

- **Backend API**: RESTful API server built with NestJS for handling restaurant operations, reservations, and AI-powered features
- **Zenchef Integration**: Seamless integration with Zenchef reservation management system
- **Reservation Management**: Smart reservation handling with filtering, sorting, and AI assistance
- **Shared Packages**: Reusable components including contracts, database models, utilities, and common configurations

## Key Features

- **Reservation Management**: Create, update, cancel, and search reservations with intelligent filtering
- **Zenchef Integration**: Direct integration with Zenchef API for restaurant operations
- **Smart Filtering**: Automatic filtering of reservations older than 1 week
- **Intelligent Sorting**: Reservations sorted by status priority (confirmed > other > cancelled) and date proximity
- **Availability Checking**: Real-time table availability with seating preferences
- **Customer Search**: Fuzzy search capabilities for finding reservations by phone or name
- **AI-Powered Features**: Intelligent reservation management and customer assistance
- **Multi-Restaurant Support**: Manage multiple restaurant locations from a single platform

## Architecture

This project uses a monorepo structure with:

- **apps/**: Contains the backend API and worker applications
- **packages/**: Shared libraries including contracts, database models, utilities, and common configurations
- **docker/**: Docker configuration for containerized deployment

## Author

K V Adhityan

- Website: [adhityan.com](https://adhityan.com/)
- Email: me@adhityan.com