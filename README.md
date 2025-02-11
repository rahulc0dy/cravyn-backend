<div align="center">
  <img src="media/logo.png" alt="Cravyn Food Ordering Logo" style="padding:10px" width="200">
  <br>
  <a href="https://github.com/rahulc0dy/cravyn-backend">
    <img src="https://img.shields.io/github/package-json/v/rahulc0dy/cravyn-backend?colorA=333333&colorB=teal" alt="Version">
  </a>
  <a href="https://github.com/rahulc0dy/cravyn-backend/actions/workflows/tests.yml">
    <img src="https://github.com/rahulc0dy/cravyn-backend/actions/workflows/tests.yml/badge.svg" alt="Version">
  </a>
</div>

# Cravyn Food Ordering System Backend

A robust and scalable backend for a food ordering system built with [Express](https://expressjs.com/)
and [Node.js](https://nodejs.org/). Cravyn provides essential API endpoints for managing users, menus, orders, and
payments.

## 🚀 Features

- **User Authentication**: Secure registration and login using JWT-based authentication.
- **Menu Management**: Create, read, update, and delete menu items.
- **Order Processing**: Place, update, cancel orders, and view order history.
- **Payment Integration**: (Optionally integrated with payment gateways for processing payments.)
- **Error Handling & Logging**: Robust error management and logging for easier debugging.
- **REST ful API**: Clean, consistent API endpoints to integrate with any frontend application.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Setup](#-setup)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [Technologies Used](#-technologies-used)
- [License](#-license)
- [Contributing](#contributing)

---

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

---

## ⚙️ Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rahulc0dy/cravyn-backend.git
   cd cravyn-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**

   Create a `.env` file in the root of your project based on the [.env.example](.env.example) provided.

4. **Run the application in development mode:**
   ```bash
   npm run dev
   ```

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory with the variables specified in the [`.env.sample`](.env.sample) file

---

## 📌 Usage

### Register a New User

```bash
curl -X POST http://localhost:<PORT>/api/<version>/<user-type>/register \
-H "Content-Type: application/json" \
-d '{ "name": "johndoe", "email": "johndoe@example.com", "password": "securepassword" }'
```

### Login

```bash
curl -X POST http://localhost:<PORT>/api/<version>/<user-type>/login \
-H "Content-Type: application/json" \
-d '{ "email": "johndoe@example.com", "password": "securepassword" }'
```

### Create a Menu Item

```bash
curl -X POST http://localhost:<PORT>/api/<version>/<user-type>/catalog \
-H "Content-Type: application/json" \
-d '{ "name": "Burger", "description": "Juicy beef burger with cheese", "price": 9.99, "category": "Fast Food" }'
```

### Place an Order

```bash
curl -X POST http://localhost:<PORT>/api/<version>/<user-type>/orders \
-H "Content-Type: application/json" \
-d '{
  "userId": "user_id",
  "items": [{"menuItemId": "menu_item_id", "quantity": 2}],
  "deliveryAddress": "123 Main Street"
}'
```

---

## 🛠️ Technologies Used

- **Express**: Fast, minimalist web framework for Node.js.
- **Node.js**: JavaScript runtime built on Chrome's V8 engine.
- **JWT**: JSON Web Tokens for secure authentication.
- **PostgreSql**: SQL database for storing data.
- **Prisma**: Modern database toolkit and ORM for PostgreSQL and other databases.
- **Other Libraries**: dotenv, morgan, bcrypt, etc.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing

We welcome contributions! Please review our [Contributing Guidelines](CONTRIBUTING.md) to get started.

