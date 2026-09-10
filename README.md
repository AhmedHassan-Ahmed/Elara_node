# EAN Stack Technical Documentation

**Backend Technical Guide**

- **Project:** EAN Stack E-Commerce Project
- **Version:** 1.0
- **Backend:** Node.js + Express
- **Base API:** `http://localhost:5000/api`

>

---

## 1. Executive Summary

EAN Stack is a backend-focused e-commerce platform providing:

- Customer accounts
- Seller accounts and seller product management
- Product and category management
- Shopping cart
- Authenticated checkout
- Stripe payments
- Orders and order status tracking
- Wishlist/favorites
- Reviews and ratings
- Administrator operations
- Optional bonus features such as promo codes, notifications, rewards, referrals, and Google login

---

## 2. Technology Stack

| Component         | Technology                      | Purpose                            |
| ----------------- | ------------------------------- | ---------------------------------- |
| Runtime           | Node.js                         | Backend runtime                    |
| Web Framework     | Express.js                      | HTTP server and REST API           |
| Database          | MongoDB + Mongoose              | Persistent data storage            |
| API               | RESTful JSON API                | Client/backend communication       |
| Authentication    | JWT                             | Authenticated API access           |
| Password Security | bcrypt                          | Password hashing                   |
| Payments          | Stripe                          | Online card payments only          |
| Email             | Email provider / Nodemailer     | Confirmation and order emails      |
| Media Storage     | Cloud storage (e.g. Cloudinary) | Product images                     |
| Source Control    | GitHub                          | Feature branches and collaboration |

---

## 2.2 Key Dependencies

| Category          | Library            | Purpose                                    |
| ----------------- | ------------------ | ------------------------------------------ |
| Backend Framework | Express            | REST API and HTTP server                   |
| Runtime           | Node.js            | Backend runtime                            |
| Database          | MongoDB / Mongoose | Data storage and database modeling         |
| Authentication    | jsonwebtoken       | Token-based authentication                 |
| Security          | bcryptjs           | Password hashing                           |
| Security          | helmet             | HTTP security headers                      |
| Security          | cors               | Cross-origin resource sharing              |
| Security          | express-rate-limit | Rate limiting                              |
| Validation        | express-validator  | Request validation                         |
| Payments          | stripe             | Stripe payment gateway                     |
| Email             | nodemailer         | Email confirmation and order notifications |
| File Upload       | multer             | Multipart form-data handling               |
| Image Storage     | cloudinary         | Cloud image hosting                        |

## 2.3 Development Tools

| Tool    | Purpose                                     |
| ------- | ------------------------------------------- |
| nodemon | Automatic server restart during development |
| dotenv  | Environment configuration                   |
| Git     | Version control                             |
| GitHub  | Source-code hosting and collaboration       |

## 3. Scope and Roles

### Roles

The project has three roles:

1. **Customer/User**
2. **Seller**
3. **Admin**

Each role has different permissions and protected resources.

### Checkout Rule

Guests may browse and maintain a temporary cart, but they **cannot place an order** until they authenticate.

### Payment Rule

Stripe is the only selected payment gateway.

The following are excluded:

- Cash on Delivery
- Wallet payments
- Other payment gateways

---

## 4. Recommended Project Structure

```text
ean-stack/
├── src/
│   ├── app.ts
│   ├── config/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── stripe.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── seller.controller.ts
│   │   ├── product.controller.ts
│   │   ├── category.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── checkout.controller.ts
│   │   ├── order.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── review.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── category.model.ts
│   │   ├── seller.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   ├── payment.model.ts
│   │   ├── review.model.ts
│   │   ├── wishlist.model.ts
│   │   ├── promo.model.ts
│   │   └── banner.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── seller.routes.ts
│   │   ├── product.routes.ts
│   │   ├── category.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── checkout.routes.ts
│   │   ├── order.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── review.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── stripe.service.ts
│   │   └── image.service.ts
│   └── utils/
│       ├── errors.ts
│       ├── response.ts
│       └── helpers.ts
├── server.ts
├── package.json
├── .env.example
└── README.md
```

---

## 5. Backend Architecture

The backend should use separation of concerns:

- **Routes** connect URLs to controllers.
- **Middleware** handles authentication, authorization, validation, and errors.
- **Controllers** handle incoming requests and coordinate operations.
- **Services** contain reusable business and integration logic.
- **Models** represent persistent data.
- **MongoDB** stores application records.

### Architecture Flow

```text
Client / Frontend / Postman
            |
            v
       Express Server
            |
   +--------+---------+
   |        |         |
 Routes  Middleware Controllers
                       |
                    Services
                       |
                     Models
                       |
                    MongoDB

External services:
  Stripe -> payments
  Email Provider -> confirmation/order notifications
  Media Storage -> product images
```

---

## 6. Core Data Models

| Model     | Main Responsibility                                                        |
| --------- | -------------------------------------------------------------------------- |
| User      | Identity, authentication status, role, profile basics, and account status  |
| Category  | Product categories                                                         |
| Product   | Name, description, price, seller, category, images, and stock              |
| Cart      | Customer cart and quantities                                               |
| Order     | Purchased items, purchase-time prices, shipping, payment, and order states |
| Payment   | Stripe payment record/status linked to an order                            |
| Review    | Customer rating/review linked to a product and eligible purchase           |
| Wishlist  | Customer favorite products                                                 |
| PromoCode | Optional bonus discounts/coupons                                           |
| Banner    | Admin-managed homepage/promotional content                                 |

### Main Relationships

```text
User
 ├── Customer Profile / Wishlist / Cart / Orders / Reviews
 ├── Seller Profile
 └── Seller Products / Seller Orders

Category
 └── Products

Product
 ├── Seller
 ├── Reviews
 ├── Wishlist Items
 └── Order Items

Order
 └── Payment
```

---

## 7. API Modules

The complete endpoint list, HTTP methods, access rules, and route notes are maintained in the separate **EAN Stack API Documentation**.

The selected base URL is:

```text
http://localhost:5000/api
```

| Module         | Main Routes                                                           | Access                    |
| -------------- | --------------------------------------------------------------------- | ------------------------- |
| Authentication | `/api/auth/*`                                                         | Public / Auth             |
| User/Profile   | `/api/users/me/*`                                                     | Customer                  |
| Seller/Profile | `/api/sellers/me/*`                                                   | Seller                    |
| Categories     | `/api/categories/*`                                                   | Public / Admin            |
| Products       | `/api/products/*`                                                     | Public / Seller / Admin   |
| Cart           | `/api/cart/*`                                                         | Customer                  |
| Checkout       | `/api/checkout/*`                                                     | Customer                  |
| Orders         | `/api/orders/*`                                                       | Customer / Admin          |
| Seller Orders  | `/api/seller/orders/*`                                                | Seller                    |
| Stripe         | `/api/payments/stripe/*`                                              | Customer / Stripe         |
| Reviews        | `/api/products/:productId/reviews`, `/api/reviews/*`                  | Public / Customer / Admin |
| Admin          | `/api/admin/*`                                                        | Admin                     |
| Bonus          | `/api/promos`, `/api/notifications`, `/api/referrals`, `/api/rewards` | As implemented            |

---

## 8. Authentication & Authorization

- Customers can register, authenticate, confirm email, and access their own protected resources.
- Sellers can register/authenticate and access seller-only resources.
- Admin operations require authenticated administrator privileges.
- Authorization is enforced on the backend.
- Frontend restrictions are not considered security.
- Customers can access only their own protected profile, cart, orders, wishlist, and eligible reviews.
- Passwords must never be stored in plain text.
- Authentication secrets must remain outside source code.

### Role-Based Access

```text
Customer
 ├── Profile
 ├── Wishlist
 ├── Cart
 ├── Checkout
 ├── Orders
 └── Eligible Reviews

Seller
 ├── Seller Profile
 ├── Own Products
 ├── Inventory
 └── Seller Orders

Admin
 ├── Users
 ├── Sellers
 ├── Products
 ├── Categories
 ├── Orders
 ├── Reviews
 └── Banners
```

---

## 9. Cart, Checkout & Order Flow

```text
1. Customer adds products to cart.
              ↓
2. Backend validates product and quantity/stock.
              ↓
3. Checkout preview recalculates subtotal,
   charges and discount if applicable.
              ↓
4. Server calculates the authoritative total.
   Client totals are NOT trusted.
              ↓
5. Stripe PaymentIntent is created.
              ↓
6. Stripe payment result/webhook is verified.
              ↓
7. Order is finalized after the required
   payment outcome.
              ↓
8. Stock and order/payment updates avoid
   duplicate processing.
              ↓
9. Relevant order events can trigger
   email notifications.
```

### Important Rules

- Only authenticated customers can place orders.
- Stock must be checked before finalizing an order.
- Product prices must be calculated from trusted backend data.
- Client-provided totals must not be trusted.
- Payment and order state changes should be idempotent.

---

## 10. Stripe Payment Integration

Stripe is the **only selected online card-payment gateway**.

### Payment Responsibilities

- Create Stripe PaymentIntents.
- Use a server-calculated amount.
- Record payment status.
- Associate payment with the relevant order.
- Handle successful, failed, cancelled, and pending outcomes.
- Verify Stripe webhook signatures.
- Prevent duplicate payment/order processing.

### Sensitive Card Information

Sensitive card information should not be unnecessarily stored or exposed by the backend.

Card saving/autofill may be implemented later as a bonus using Stripe's secure mechanisms.

---

## 11. Reviews & Ratings

A customer may review or rate a product **only after successfully purchasing and paying for that product**.

The backend must verify purchase eligibility before accepting the review.

### Rules

```text
Customer
   |
   v
Has purchased product?
   |
   +---- No ----> REVIEW_NOT_ALLOWED
   |
   +---- Yes
          |
          v
     Allow Review
```

Administrators may moderate reviews if review moderation is implemented.

---

## 12. Product & Inventory

A product contains, at minimum:

- Name
- Description
- Price
- Images
- Category
- Stock availability

### Product Features

- Browse products
- Search by name/relevant product information
- Filter by price
- Filter by category
- Additional filters where implemented
- Admin create/update/deactivate products
- Sellers can create/update/deactivate their own products
- Seller ownership must be enforced server-side
- Stock validation

### Stock Rule

The backend must reject orders that exceed available stock.

```text
Requested Quantity > Available Stock
                    |
                    v
          INSUFFICIENT_STOCK
```

---

## 13. Error & Response Standard

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation",
    "details": []
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code            | Example                         |
| ----------- | --------------------- | ------------------------------- |
| `400`       | `VALIDATION_ERROR`    | Invalid or missing request data |
| `401`       | `UNAUTHORIZED`        | Authentication missing/invalid  |
| `401`       | `INVALID_CREDENTIALS` | Login credentials are incorrect |
| `403`       | `FORBIDDEN`           | Authenticated but not permitted |
| `404`       | `NOT_FOUND`           | Resource not found              |
| `409`       | `CONFLICT`            | Business/resource conflict      |
| `409`       | `INSUFFICIENT_STOCK`  | Not enough stock                |
| `402`       | `PAYMENT_FAILED`      | Stripe payment failed           |
| `500`       | `SERVER_ERROR`        | Unexpected backend failure      |

### Example with `details`

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock available",
    "details": [
      {
        "productId": "123",
        "requestedQuantity": 5,
        "availableQuantity": 2
      }
    ]
  }
}
```

---

## 14. Security Implementation

| Area           | Rule                                                              |
| -------------- | ----------------------------------------------------------------- |
| Authentication | Secure authenticated sessions/tokens with appropriate expiration  |
| Passwords      | Hash passwords; never store plain text                            |
| Authorization  | RBAC with Customer, Seller, and Admin roles                       |
| Input          | Validate and sanitize input according to context                  |
| Secrets        | Store DB, JWT, Stripe and email secrets in environment variables  |
| Ownership      | Enforce seller/customer ownership server-side                     |
| Prices         | Never trust client-provided prices/totals                         |
| Stripe         | Verify webhook signatures                                         |
| Idempotency    | Prevent duplicate payment/order processing                        |
| Soft Delete    | Deactivate records when historical records must remain consistent |

---

## 15. Environment Variables

Create a `.env` file locally.

Example:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=<mongodb_connection_string>

JWT_SECRET=<jwt_secret>
JWT_EXPIRES_IN=<token_expiry>

EMAIL_HOST=<smtp_host>
EMAIL_PORT=<smtp_port>
EMAIL_USER=<email_user>
EMAIL_PASSWORD=<email_password>

STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

### Important

Never commit real secrets to GitHub.

Use `.env.example` as the safe template:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=

JWT_SECRET=
JWT_EXPIRES_IN=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 16. GitHub Development Workflow

The project requirements specify GitHub usage and a separate branch for each feature.

### Recommended Workflow

```text
dev
 |
 +-- feature/authentication
 |
 +-- feature/products
 |
 +-- feature/categories
 |
 +-- feature/cart
 |
 +-- feature/checkout
 |
 +-- feature/stripe-payment
 |
 +-- feature/orders
 |
 +-- feature/reviews
 |
 +-- feature/admin
```

### Rules

- Use `dev` as the main development branch.
- Do not develop features directly on `dev`.
- Create a separate feature branch for each major feature.
- Create feature branches from `dev`.
- Use clear commit messages.
- Use Pull Requests for integration/review where possible.
- Merge completed and tested feature branches into `dev`.
- Keep `dev` stable and integration-ready.
- Keep `main` reserved for the stable/production version.
- Keep README and technical documentation updated.

## 17. Development Priorities

| Phase | Features                                                                     |
| ----- | ---------------------------------------------------------------------------- |
| 1     | Express setup, MongoDB connection, environment configuration                 |
| 2     | Authentication, email confirmation, Customer/Seller/Admin authorization      |
| 3     | Categories, products, seller ownership, stock, search/filtering              |
| 4     | Cart and checkout calculation                                                |
| 5     | Stripe PaymentIntent, webhook, and payment records                           |
| 6     | Orders, seller order processing, status tracking, and email notifications    |
| 7     | Wishlist, reviews/ratings, and admin/seller management                       |
| 8     | Bonus features: promo codes, notifications, rewards, referrals, Google login |

---

## 19. Scope Notes

This documentation follows the current EAN Stack scope:

- Customer + Seller + Admin
- Node.js + Express
- MongoDB
- Authenticated checkout
- Stripe-only payments
- Product/category management
- Cart and orders
- Reviews and ratings
- Wishlist
- Admin management
- Seller product and order management
- Backend-only requirements

Bonus features should be implemented as soon as possible.

---

## 20. Source Alignment

This technical guide is aligned with the current EAN Stack Backend SRS and the separate API Documentation.

The Backend SRS defines the backend responsibilities and business rules, while the API Documentation defines the endpoint-level contract.

### Documentation Relationship

```text
                 EAN Stack Project
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
        SRS        API Documentation  Technical
     "What?"          "Endpoints"     Guide
                                      "How?"
```

### Final Implementation Reference

The team should use:

1. **Backend SRS** → Requirements and business rules
2. **API Documentation** → Routes, methods, access, responses
3. **Technical Documentation** → Project architecture and implementation structure
4. **README** → Setup and running instructions

---

**EAN Stack E-Commerce Project — Backend Technical Documentation**
