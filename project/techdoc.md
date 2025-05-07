# Netlify Birthday Reminder App - Development Plan (Prisma ORM + Neon DB + Vue.js CDN - Node 20)

## 1. Project Overview

A simple, password-protected web application hosted on Netlify. It will feature a graphical user interface (GUI) to manage an address book of contacts with their birthdays. A daily Netlify Scheduled Function will check for birthdays and send a notification if any are found. Data will be stored in a Neon PostgreSQL database, accessed via Prisma ORM. The frontend will be built with Vue.js 3 via CDN for reactivity.

## 2. Core Technologies

*   **Node.js Version (for Netlify Functions & local dev):** Node.js 20.x (LTS)
*   **Frontend:** HTML, CSS, JavaScript with **Vue.js 3 (via CDN)**.
*   **Styling:** Custom CSS for a modern dark theme.
*   **Backend (Netlify Functions):** Node.js 20.x.
*   **ORM:** Prisma.
*   **Database:** PostgreSQL (hosted on Neon).
*   **Authentication:** Simple password check via Netlify Function.
*   **Scheduled Tasks:** Netlify Scheduled Functions.
*   **Notifications:** Telegram Bot API.
*   **Deployment:** Netlify.

## 3. Key Features

*   Password-protected access to the application.
*   Graphical User Interface for CRUD (Create, Read, Update, Delete) operations on contacts.
*   Contact information includes:
    *   Name (string, required)
    *   Birthday (string "DD/MM", required)
    *   Birth Year (integer, optional)
    *   Mobile Number (string, optional)
    *   Custom Greeting Message (string, required)
*   A Netlify Scheduled Function runs daily at 10:00 AM CET.
*   The scheduled function checks the address book for any contacts whose birthday (day and month) matches the current date.
*   If a birthday is found, a notification containing the contact's record (name, greeting message, mobile, birth year) is sent.

## 4. Recommended Notification Method: Telegram Bot

*   **Rapid:** Messages are delivered almost instantly.
*   **Certain:** High reliability.
*   **Free:** Creating and using a Telegram bot is free.
*   **Setup:**
    1.  Open Telegram and search for "BotFather".
    2.  Start a chat with BotFather and send the `/newbot` command.
    3.  Follow the prompts to choose a name and username for your bot. The username must end in "bot" (e.g., `MyBirthdayReminderBot`).
    4.  BotFather will provide you with an **API Token**. Save this token securely.
    5.  Find your **Chat ID**:
        *   Send a message to your newly created bot (you'll need to find it by its username and start a chat).
        *   Then, open your web browser and go to the URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` (replace `<YOUR_BOT_TOKEN>` with the token you received).
        *   Look for a JSON response. Inside the `result` array, find the message you sent. The `chat.id` value within that message object is your personal Chat ID. Save this ID.
    6.  These (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) will be stored as environment variables.

## 5. Development Plan

---

### Phase 0: Environment Setup

**0.1. Node.js Version:**
    *   Using NVM (Node Version Manager) locally is highly recommended.
        ```bash
        nvm install 20
        nvm use 20
        ```
    *   Create an `.nvmrc` file in your project root with the Node.js version:
        ```
        20
        ```
        This file helps ensure consistent Node.js versions across environments and can be used by `nvm use` automatically.
    *   (Optional but good practice) Set a `NODE_VERSION` environment variable in your Netlify site's build settings (Site settings > Build & deploy > Environment > Environment variables) to `20`.

**0.2. Project Initialization:**
    *   Create a new directory for your project and navigate into it.
    *   Initialize a Node.js project:
        ```bash
        npm init -y
        ```
    *   Initialize a Git repository:
        ```bash
        git init
        ```
    *   Create a `.gitignore` file:
        ```
        node_modules/
        .env
        netlify/state.json # Netlify Dev state file
        netlify/.netlify # Netlify Dev build cache
        dist/ # If you have a frontend build step outputting to dist
        ```

---

### Phase 1: Backend Setup - Neon DB, Prisma ORM, Auth & Scheduled Function Core

**1.1. Install Dependencies:**
    *   Prisma CLI (as a dev dependency):
        ```bash
        npm install --save-dev prisma
        ```
    *   Prisma Client (as a regular dependency):
        ```bash
        npm install @prisma/client
        ```
    *   (Optional, for Telegram) A robust HTTP client like `axios` or use the built-in `https` module. If using `axios`:
        ```bash
        npm install axios
        ```
        (The example will use the `https` module for simplicity, avoiding an extra dependency).

**1.2. Neon Database Setup:**
    *   Go to [https://neon.tech/](https://neon.tech/) and log in or sign up.
    *   Create a new Project if you haven't already for this app.
    *   Once the project is ready, Neon will provide you with a **Database Connection URL**. It typically looks like `postgresql://user:password@ep-abc-xyz-123456.region.aws.neon.tech/dbname?sslmode=require`. Copy this URL.

**1.3. Environment Variables:**
    *   Create a `.env` file in your project root for local development (this file is in `.gitignore` and should not be committed).
        ```dotenv
        # .env
        DATABASE_URL="postgresql://user:password@ep-abc-xyz-123456.region.aws.neon.tech/dbname?sslmode=require" # Your Neon connection string
        APP_PASSWORD="your_chosen_strong_password_for_the_app"
        TELEGRAM_BOT_TOKEN="your_telegram_bot_api_token"
        TELEGRAM_CHAT_ID="your_telegram_chat_id"
        ```
    *   These variables will also need to be set in your Netlify site's environment settings later.

**1.4. Prisma ORM Setup:**
    *   Initialize Prisma in your project:
        ```bash
        npx prisma init --datasource-provider postgresql
        ```
        This creates a `prisma` folder with a `schema.prisma` file and updates your `.env` with a `DATABASE_URL` placeholder (which you've already set).
    *   Define your `Contact` model in `prisma/schema.prisma`:
        ```prisma
        // prisma/schema.prisma
        generator client {
          provider      = "prisma-client-js"
          // Ensure binaryTargets are appropriate for Netlify's Lambda environment (Node.js 20.x usually rhel-openssl-3.0.x)
          // It's good to include "native" for local development.
          // Check Netlify's current Lambda environment if issues arise.
          binaryTargets = ["native", "rhel-openssl-3.0.x"]
        }

        datasource db {
          provider = "postgresql" // For Neon
          url      = env("DATABASE_URL")
          // Neon connection strings usually include ?sslmode=require, Prisma client handles this.
        }

        model Contact {
          id              String    @id @default(cuid()) // cuid() is a good default for unique IDs
          name            String
          birthday        String    // Storing as "DD/MM" string as requested
          birthYear       Int?      // Optional integer for birth year
          mobileNumber    String?   // Optional string for mobile number
          greetingMessage String    // Required string for the birthday greeting
          createdAt       DateTime  @default(now())
          updatedAt       DateTime  @updatedAt
        }
        ```
    *   Create your first database migration. This will create the `Contact` table in your Neon database:
        ```bash
        npx prisma migrate dev --name init_contacts
        ```
        Follow the prompts. Prisma will ask you to confirm.
    *   Generate the Prisma Client based on your schema:
        ```bash
        npx prisma generate
        ```
        This command should also be part of your build process to ensure the client is always up-to-date.

**1.5. Basic Netlify Function for Authentication (`netlify/functions/login.js`):**
    *   Create a directory `netlify/functions/` (or just `functions/` if you prefer, then adjust `netlify.toml`).
    ```javascript
    // netlify/functions/login.js
    exports.handler = async function(event, context) {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }

        try {
            const { password } = JSON.parse(event.body);
            const appPassword = process.env.APP_PASSWORD;

            if (!appPassword) {
                console.error("APP_PASSWORD environment variable is not set.");
                return {
                    statusCode: 500,
                    body: JSON.stringify({ success: false, message: 'Server configuration error.' })
                };
            }

            if (password === appPassword) {
                // For this simple app, a success flag is sufficient.
                // In more complex apps, return a JWT or session token.
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: 'Login successful' })
                };
            } else {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ success: false, message: 'Invalid password' })
                };
            }
        } catch (error) {
            console.error("Login function error:", error);
            return { 
                statusCode: 400, // Bad request if JSON parsing fails
                body: JSON.stringify({ success: false, message: 'Login failed due to invalid request or server error.' }) 
            };
        }
    };
    ```

**1.6. Netlify Functions for Contact CRUD Operations:**
    *   Create a `prismaClient.js` utility for shared Prisma Client instance (optional but good practice):
    ```javascript
    // netlify/functions/utils/prismaClient.js
    const { PrismaClient } = require('@prisma/client');
    let prisma;

    function getPrismaClient() {
        if (!prisma) {
            prisma = new PrismaClient();
        }
        return prisma;
    }

    module.exports = getPrismaClient;
    ```

    *   `netlify/functions/get-contacts.js`:
    ```javascript
    // netlify/functions/get-contacts.js
    const getPrismaClient = require('./utils/prismaClient');

    exports.handler = async function(event, context) {
        // In a real app, add authentication check here (e.g., verify JWT)
        const prisma = getPrismaClient();
        try {
            const contacts = await prisma.contact.findMany({
                orderBy: {
                    name: 'asc' 
                }
            });
            return {
                statusCode: 200,
                body: JSON.stringify(contacts)
            };
        } catch (error) {
            console.error("Error fetching contacts:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Could not fetch contacts.", details: error.message })
            };
        } finally {
            // Disconnecting is less critical with some serverless-aware drivers/proxies,
            // but for direct connections, it's safer to manage explicitly.
            // However, Prisma's client is designed to be long-lived.
            // For frequent invocations, instantiating outside and not disconnecting might be better.
            // For now, let's keep it simple. If issues arise, revisit this.
            // await prisma.$disconnect(); // For single instance outside handler, don't disconnect here.
        }
    };
    ```
    *Note on `prisma.$disconnect()`: If `prisma` is instantiated *outside* the handler (as with the `getPrismaClient` utility), you should *not* call `$disconnect()` inside each function handler's `finally` block, as it would close the shared client. The client is designed to manage its connections. Disconnecting is more relevant if you create a new `PrismaClient` instance *inside* each handler.*

    *   `netlify/functions/create-contact.js`:
    ```javascript
    // netlify/functions/create-contact.js
    const getPrismaClient = require('./utils/prismaClient');

    exports.handler = async function(event, context) {
        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }
        // Add auth check
        const prisma = getPrismaClient();
        try {
            const data = JSON.parse(event.body);

            if (!data.name || !data.birthday || !data.greetingMessage) {
                return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields: name, birthday, greetingMessage."}) };
            }
            if (!/^\d{1,2}\/\d{1,2}$/.test(data.birthday)) {
                 return { statusCode: 400, body: JSON.stringify({ error: "Invalid birthday format. Use DD/MM (e.g., 25/12)." }) };
            }
            if (data.birthYear && (isNaN(parseInt(data.birthYear)) || parseInt(data.birthYear) < 1900 || parseInt(data.birthYear) > new Date().getFullYear())) {
                return { statusCode: 400, body: JSON.stringify({ error: "Invalid birth year." }) };
            }


            const newContact = await prisma.contact.create({
                data: {
                    name: data.name,
                    birthday: data.birthday,
                    birthYear: data.birthYear ? parseInt(data.birthYear) : null,
                    mobileNumber: data.mobileNumber || null,
                    greetingMessage: data.greetingMessage,
                }
            });
            return {
                statusCode: 201, // Created
                body: JSON.stringify(newContact)
            };
        } catch (error) {
            console.error("Create contact error:", error);
            if (error.name === 'PrismaClientKnownRequestError') { // More specific error handling
                return { statusCode: 409, body: JSON.stringify({ error: "Database constraint violation.", details: error.message })};
            }
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Error creating contact.", details: error.message })
            };
        }
    };
    ```

    *   `netlify/functions/update-contact.js`:
    ```javascript
    // netlify/functions/update-contact.js
    const getPrismaClient = require('./utils/prismaClient');

    exports.handler = async function(event, context) {
        if (event.httpMethod !== 'PUT') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }
        // Add auth check

        const prisma = getPrismaClient();
        const { id } = event.queryStringParameters;
        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: "Contact ID is required for update." }) };
        }

        try {
            const data = JSON.parse(event.body);

            // Add validation similar to create-contact
            if (!data.name || !data.birthday || !data.greetingMessage) { /* ... */ }
            if (!/^\d{1,2}\/\d{1,2}$/.test(data.birthday)) { /* ... */ }
            if (data.birthYear && (isNaN(parseInt(data.birthYear)) || parseInt(data.birthYear) < 1900 || parseInt(data.birthYear) > new Date().getFullYear())) { /* ... */ }


            const updatedContact = await prisma.contact.update({
                where: { id: id },
                data: {
                    name: data.name,
                    birthday: data.birthday,
                    birthYear: data.birthYear ? parseInt(data.birthYear) : null,
                    mobileNumber: data.mobileNumber || null,
                    greetingMessage: data.greetingMessage,
                    updatedAt: new Date() // Explicitly set updatedAt
                }
            });
            return {
                statusCode: 200,
                body: JSON.stringify(updatedContact)
            };
        } catch (error) {
            console.error(`Error updating contact ${id}:`, error);
            if (error.code === 'P2025') { // Prisma error code for record not found
                return { statusCode: 404, body: JSON.stringify({ error: "Contact not found." }) };
            }
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Error updating contact.", details: error.message })
            };
        }
    };
    ```

    *   `netlify/functions/delete-contact.js`:
    ```javascript
    // netlify/functions/delete-contact.js
    const getPrismaClient = require('./utils/prismaClient');

    exports.handler = async function(event, context) {
        if (event.httpMethod !== 'DELETE') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }
        // Add auth check
        const prisma = getPrismaClient();
        const { id } = event.queryStringParameters;
        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: "Contact ID is required for deletion." }) };
        }

        try {
            await prisma.contact.delete({
                where: { id: id }
            });
            return {
                statusCode: 200, // Or 204 No Content
                body: JSON.stringify({ message: "Contact deleted successfully." })
            };
        } catch (error) {
            console.error(`Error deleting contact ${id}:`, error);
            if (error.code === 'P2025') { // Prisma error code for record not found
                return { statusCode: 404, body: JSON.stringify({ error: "Contact not found." }) };
            }
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Error deleting contact.", details: error.message })
            };
        }
    };
    ```

**1.7. Scheduled Function (`netlify/functions/birthday-checker.js`):**
    ```javascript
    // netlify/functions/birthday-checker.js
    const getPrismaClient = require('./utils/prismaClient');
    const https = require('https'); // Using built-in https module

    async function sendTelegramMessage(botToken, chatId, text) {
        const message = encodeURIComponent(text);
        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=Markdown`;

        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch(e) {
                            console.error("Telegram JSON parse error:", e, "Data:", data);
                            reject(new Error(`Telegram API response parse error: ${e.message}`));
                        }
                    } else {
                        console.error("Telegram API Error Response:", data);
                        reject(new Error(`Telegram API error: ${res.statusCode} - ${data}`));
                    }
                });
            });
            req.on('error', (err) => {
                console.error("Error sending Telegram message (network):", err);
                reject(err);
            });
            req.end();
        });
    }

    exports.handler = async function(event, context) {
        console.log("Birthday checker scheduled function running...");
        const prisma = getPrismaClient();
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.");
            return { statusCode: 500, body: "Notification service environment variables not configured." };
        }
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL not configured for birthday checker.");
             return { statusCode: 500, body: "Database environment variable not configured." };
        }


        try {
            const contacts = await prisma.contact.findMany();
            
            // Get current date. Netlify functions run in UTC.
            // 10:00 AM CET needs to be converted to UTC.
            // CET is UTC+1 (winter) or UTC+2 (summer).
            // For simplicity, let's assume users enter birthday based on their local interpretation
            // and we check against the server's UTC date.
            // A more robust solution would involve timezone libraries (e.g. date-fns-tz) and
            // potentially storing user's timezone or normalizing birthdays to UTC.
            const now = new Date(); 
            const currentDayUTC = now.getUTCDate();
            const currentMonthUTC = now.getUTCMonth() + 1; // JavaScript months are 0-indexed

            console.log(`Birthday check for UTC date: ${currentDayUTC}/${currentMonthUTC}`);

            let notificationsSent = 0;
            for (const contact of contacts) {
                // Assuming contact.birthday is "DD/MM"
                const [birthDayStr, birthMonthStr] = contact.birthday.split('/');
                const birthDay = parseInt(birthDayStr, 10);
                const birthMonth = parseInt(birthMonthStr, 10);

                if (isNaN(birthDay) || isNaN(birthMonth)) {
                    console.warn(`Skipping contact ${contact.name} due to invalid birthday format: ${contact.birthday}`);
                    continue;
                }

                console.log(`Checking contact: ${contact.name}, Birthday: ${birthDay}/${birthMonth}`);

                if (birthDay === currentDayUTC && birthMonth === currentMonthUTC) {
                    const birthYearInfo = contact.birthYear ? `\nNato/a nel: ${contact.birthYear}` : '';
                    const mobileInfo = contact.mobileNumber ? `\nCellulare: ${contact.mobileNumber}` : '';
                    const message = `🎂 *Tanti Auguri a ${contact.name}!* 🎉\n\n${contact.greetingMessage}${birthYearInfo}${mobileInfo}`;
                    
                    try {
                        await sendTelegramMessage(botToken, chatId, message);
                        console.log(`Notification sent for ${contact.name}`);
                        notificationsSent++;
                    } catch (telError) {
                        console.error(`Failed to send Telegram notification for ${contact.name}:`, telError.message);
                    }
                }
            }

            return {
                statusCode: 200,
                body: `Birthday check complete. ${notificationsSent} notifications sent for UTC date ${currentDayUTC}/${currentMonthUTC}.`
            };
        } catch (error) {
            console.error("Error in birthday checker function:", error);
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Birthday checker failed.", details: error.message }) 
            };
        }
    };
    ```

**1.8. Netlify Configuration (`netlify.toml`):**
    *   Create a `netlify.toml` file in your project root:
    ```toml
    [build]
      command = "npm run build" # We'll add a build script to package.json
      functions = "netlify/functions" # Or just "functions/" if you named it that
      publish = "public"         # Directory containing index.html, css, js

    # Scheduled function for birthday checks
    # Cron syntax is for UTC. 10:00 AM CET is:
    # - 09:00 UTC during Central European Standard Time (CEST is UTC+2, so 08:00 UTC)
    # - 08:00 UTC during Central European Summer Time (CET is UTC+1, so 09:00 UTC)
    # Let's pick one, e.g., 08:00 UTC, to roughly align with summer 10AM CET.
    # You might need to adjust this or make the checker timezone aware.
    [functions."birthday-checker"]
      schedule = "0 8 * * *" # Runs daily at 08:00 UTC 
                              # Adjust if you want exactly 10AM CET regardless of DST.
                              # e.g., "0 9 * * *" for winter 10AM CET. Consider two functions or TZ logic.

    # Redirect all paths to index.html for client-side routing if you were using it (not for this app)
    # [[redirects]]
    #   from = "/*"
    #   to = "/index.html"
    #   status = 200
    ```

**1.9. `package.json` Scripts:**
    *   Update your `package.json` to include a build script that generates Prisma Client.
    ```json
    {
      "name": "netlify-birthday-reminder",
      "version": "1.0.0",
      "description": "Birthday reminder app on Netlify",
      "main": "index.js", // Not really used for this serverless app
      "scripts": {
        "build": "npx prisma generate", // Generates Prisma Client
        "dev": "netlify dev" // For local development using Netlify CLI
      },
      "keywords": ["netlify", "prisma", "vue", "birthday"],
      "author": "Your Name",
      "license": "ISC",
      "dependencies": {
        "@prisma/client": "^5.10.2", // Use latest version
        "axios": "^1.6.7" // Or remove if using 'https' directly
      },
      "devDependencies": {
        "prisma": "^5.10.2" // Use latest version
      }
    }
    ```
    *(Adjust Prisma/Axios versions to the latest stable when you start)*.
    *Note: `npm run postinstall` script `prisma generate` is also a common pattern and often preferred as it runs after `npm install` during Netlify's build process.*
    If you prefer `postinstall`:
    ```json
    "scripts": {
      "build": "echo \"No explicit frontend build step, Prisma generate runs on postinstall\"",
      "postinstall": "npx prisma generate",
      "dev": "netlify dev"
    },
    ```

---

### Phase 2: Frontend Development - HTML Structure, Vue.js Integration, and Styling

**2.1. Create `public` Directory:**
    *   This directory will contain your static frontend assets.
        ```bash
        mkdir public
        ```

**2.2. HTML Structure (`public/index.html`):**
    ```html
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Birthday Reminder</title>
        <link rel="stylesheet" href="style.css">
        <!-- Vue.js 3 CDN (Global Build) -->
        <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    </head>
    <body>
        <div id="app" v-cloak> <!-- v-cloak helps hide uncompiled Vue templates -->

            <!-- Login Screen -->
            <section v-if="!isLoggedIn" id="login-screen" class="app-section">
                <h2>Accesso Amministrazione</h2>
                <form @submit.prevent="handleLogin" class="styled-form">
                    <div>
                        <label for="login-password">Password:</label>
                        <input type="password" id="login-password" v-model="loginForm.password" placeholder="Password" required>
                    </div>
                    <button type="submit" :disabled="uiState.loggingIn">
                        {{ uiState.loggingIn ? 'Accesso in corso...' : 'Accedi' }}
                    </button>
                    <p v-if="uiState.loginMessage" class="message" :class="{ 'error-message': !loginSuccess, 'success-message': loginSuccess }">
                        {{ uiState.loginMessage }}
                    </p>
                </form>
            </section>

            <!-- Main Application Content -->
            <main v-else id="app-content">
                <header class="app-header">
                    <h1>Rubrica Compleanni</h1>
                    <button @click="handleLogout" class="logout-button">Logout</button>
                </header>
                
                <!-- Contact Form Section -->
                <section id="contact-form-section" class="app-section">
                    <h2 id="form-title">{{ uiState.editingContactId ? 'Modifica Contatto' : 'Aggiungi Nuovo Contatto' }}</h2>
                    <form @submit.prevent="saveContact" class="styled-form">
                        <input type="hidden" v-model="contactForm.id">
                        <div>
                            <label for="contact-name">Nome:</label>
                            <input type="text" id="contact-name" v-model.trim="contactForm.name" required>
                        </div>
                        <div>
                            <label for="contact-birthday">Compleanno (GG/MM):</label>
                            <input type="text" id="contact-birthday" v-model.trim="contactForm.birthday" placeholder="es. 25/12" pattern="\d{1,2}/\d{1,2}" required>
                        </div>
                        <div>
                            <label for="contact-birthYear">Anno di Nascita (opzionale):</label>
                            <input type="number" id="contact-birthYear" v-model.number="contactForm.birthYear" placeholder="es. 1990" min="1900" :max="new Date().getFullYear()">
                        </div>
                        <div>
                            <label for="contact-mobileNumber">Cellulare (opzionale):</label>
                            <input type="tel" id="contact-mobileNumber" v-model.trim="contactForm.mobileNumber">
                        </div>
                        <div>
                            <label for="contact-greetingMessage">Messaggio di Auguri:</label>
                            <textarea id="contact-greetingMessage" v-model.trim="contactForm.greetingMessage" rows="3" required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" :disabled="uiState.savingContact">
                                {{ uiState.savingContact ? 'Salvataggio...' : (uiState.editingContactId ? 'Aggiorna Contatto' : 'Salva Contatto') }}
                            </button>
                            <button type="button" v-if="uiState.editingContactId" @click="cancelEdit" class="cancel-button">Annulla Modifica</button>
                        </div>
                         <p v-if="uiState.formMessage" class="message" :class="{ 'error-message': !formSuccess, 'success-message': formSuccess }">
                            {{ uiState.formMessage }}
                        </p>
                    </form>
                </section>

                <!-- Contact List Section -->
                <section id="contact-list-section" class="app-section">
                    <h2>Elenco Contatti</h2>
                    <div v-if="uiState.loadingContacts" class="loading-indicator">Caricamento contatti...</div>
                    <div v-else-if="contacts.length === 0 && !uiState.fetchError" class="empty-state">
                        Nessun contatto presente. Aggiungine uno per iniziare!
                    </div>
                     <div v-else-if="uiState.fetchError" class="error-message">
                        Errore nel caricamento dei contatti: {{ uiState.fetchError }}
                    </div>
                    <div v-else id="contact-list-container">
                        <div v-for="contact in contacts" :key="contact.id" class="contact-item">
                            <h3>{{ contact.name }}</h3>
                            <p><strong>Compleanno:</strong> {{ contact.birthday }}</p>
                            <p v-if="contact.birthYear"><strong>Anno di Nascita:</strong> {{ contact.birthYear }}</p>
                            <p><strong>Cellulare:</strong> {{ contact.mobileNumber || 'N/D' }}</p>
                            <p><strong>Messaggio Auguri:</strong></p>
                            <p class="greeting-text">{{ contact.greetingMessage }}</p>
                            <div class="contact-actions">
                                <button @click="startEditContact(contact)" class="edit-button">Modifica</button>
                                <button @click="confirmDeleteContact(contact.id)" class="delete-button" :disabled="uiState.deletingContactId === contact.id">
                                    {{ uiState.deletingContactId === contact.id ? 'Eliminazione...' : 'Elimina' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>

        <script src="app.js"></script> <!-- Vue.js application logic -->
    </body>
    </html>
    ```

**2.3. CSS Styling (`public/style.css`):**
    ```css
    /* public/style.css */
    :root {
        --bg-color: #121212; /* Darker background */
        --surface-color: #1e1e1e; /* Slightly lighter for cards/sections */
        --primary-color: #bb86fc; /* Purple - common in dark themes */
        --primary-variant-color: #3700b3;
        --secondary-color: #03dac6; /* Teal accent */
        --text-color: #e0e0e0;
        --text-secondary-color: #b0b0b0;
        --error-color: #cf6679;
        --success-color: #66bb6a; /* Green for success messages */
        --border-color: #333333;
        --input-bg: #2c2c2c;
        --button-hover-bg: #280065; /* Darker purple for hover */
    }

    [v-cloak] { display: none; }

    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 0;
        padding: 20px;
        line-height: 1.6;
    }

    #app {
        max-width: 800px;
        margin: 0 auto;
    }

    .app-section {
        background-color: var(--surface-color);
        padding: 25px;
        border-radius: 8px;
        margin-bottom: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border-color);
    }

    .app-header h1 {
        color: var(--primary-color);
        margin: 0;
        font-size: 2rem;
    }

    h2 {
        color: var(--secondary-color);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 1.5rem;
    }

    .styled-form div {
        margin-bottom: 15px;
    }

    .styled-form label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: var(--text-secondary-color);
    }

    input[type="text"],
    input[type="password"],
    input[type="number"],
    input[type="tel"],
    textarea {
        width: calc(100% - 22px); /* Account for padding */
        padding: 12px 10px;
        background-color: var(--input-bg);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
    }

    input[type="text"]:focus,
    input[type="password"]:focus,
    input[type="number"]:focus,
    input[type="tel"]:focus,
    textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-variant-color);
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    button {
        background-color: var(--primary-color);
        color: var(--bg-color); /* High contrast text on primary button */
        font-weight: bold;
        border: none;
        padding: 12px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s ease, transform 0.1s ease;
    }

    button:hover:not(:disabled) {
        background-color: var(--button-hover-bg);
        color: var(--text-color);
        transform: translateY(-1px);
    }

    button:disabled {
        background-color: #555;
        color: #999;
        cursor: not-allowed;
    }

    .form-actions {
        margin-top: 20px;
    }

    .form-actions .cancel-button {
        background-color: var(--surface-color);
        color: var(--text-secondary-color);
        border: 1px solid var(--border-color);
        margin-left: 10px;
    }
    .form-actions .cancel-button:hover {
        background-color: var(--border-color);
        color: var(--text-color);
    }
    
    .logout-button {
        background-color: var(--error-color);
        color: var(--bg-color);
    }
    .logout-button:hover {
         background-color: #b00020; /* Darker error color */
         color: var(--text-color);
    }


    .message {
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    .error-message {
        color: var(--bg-color);
        background-color: var(--error-color);
        border: 1px solid #b00020;
    }
    .success-message {
        color: var(--bg-color);
        background-color: var(--success-color);
        border: 1px solid #4caf50;
    }

    #contact-list-container {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .contact-item {
        background-color: var(--input-bg); /* Slightly different from section bg for depth */
        padding: 20px;
        border-radius: 6px;
        border-left: 4px solid var(--secondary-color);
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .contact-item h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: var(--primary-color);
        font-size: 1.25rem;
    }

    .contact-item p {
        margin: 8px 0;
        font-size: 0.95rem;
        color: var(--text-secondary-color);
    }
    .contact-item p strong {
        color: var(--text-color);
    }

    .greeting-text {
        white-space: pre-wrap; /* Preserve newlines from textarea */
        background-color: var(--surface-color);
        padding: 8px;
        border-radius: 4px;
        font-style: italic;
    }

    .contact-actions {
        margin-top: 15px;
        border-top: 1px solid var(--border-color);
        padding-top: 15px;
    }

    .contact-actions button {
        padding: 8px 12px;
        font-size: 0.9rem;
        margin-right: 10px;
    }
    .contact-actions .edit-button {
        background-color: var(--secondary-color);
        color: var(--bg-color);
    }
    .contact-actions .edit-button:hover {
        background-color: #02b09b; /* Darker teal */
    }
    .contact-actions .delete-button {
        background-color: var(--error-color);
        color: var(--bg-color);
    }
     .contact-actions .delete-button:hover {
        background-color: #b00020; /* Darker error color */
    }

    .loading-indicator, .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--text-secondary-color);
        font-style: italic;
    }
    ```

**2.4. Vue.js Application Logic (`public/app.js`):**
    ```javascript
    // public/app.js
    const { createApp, ref, reactive, onMounted, computed, watch } = Vue;

    const App = {
        setup() {
            // --- Reactive State ---
            const isLoggedIn = ref(localStorage.getItem('isLoggedIn') === 'true');
            const contacts = ref([]);
            
            const loginForm = reactive({ password: '' });
            const initialContactFormState = {
                id: null, name: '', birthday: '', birthYear: null,
                mobileNumber: '', greetingMessage: ''
            };
            const contactForm = reactive({ ...initialContactFormState });

            const uiState = reactive({
                loggingIn: false,
                loginMessage: '',
                loadingContacts: false,
                fetchError: null,
                savingContact: false,
                formMessage: '',
                editingContactId: null,
                deletingContactId: null,
            });
            const loginSuccess = ref(false); // For styling login message
            const formSuccess = ref(false); // For styling form message

            // --- Computed Properties ---
            // (editingContactId is now in uiState)

            // --- API Helper ---
            const callApi = async (endpoint, method = 'GET', body = null) => {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                };
                if (body) {
                    options.body = JSON.stringify(body);
                }
                const response = await fetch(`/.netlify/functions/${endpoint}`, options);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
                    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
                }
                if (response.status === 204) return null; // No content for DELETE
                return response.json();
            };
            
            // --- Authentication Methods ---
            const handleLogin = async () => {
                uiState.loggingIn = true;
                uiState.loginMessage = '';
                loginSuccess.value = false;
                try {
                    const data = await callApi('login', 'POST', { password: loginForm.password });
                    if (data.success) {
                        localStorage.setItem('isLoggedIn', 'true');
                        isLoggedIn.value = true;
                        loginForm.password = '';
                        uiState.loginMessage = data.message;
                        loginSuccess.value = true;
                        fetchContacts(); 
                    } else {
                        throw new Error(data.message || 'Login failed.');
                    }
                } catch (error) {
                    uiState.loginMessage = error.message;
                    localStorage.removeItem('isLoggedIn');
                } finally {
                    uiState.loggingIn = false;
                    setTimeout(() => { uiState.loginMessage = ''; loginSuccess.value = false; }, 3000);
                }
            };

            const handleLogout = () => {
                localStorage.removeItem('isLoggedIn');
                isLoggedIn.value = false;
                contacts.value = [];
                Object.assign(contactForm, initialContactFormState);
                uiState.editingContactId = null;
            };

            // --- Contact CRUD Methods ---
            const resetContactForm = () => {
                Object.assign(contactForm, initialContactFormState);
                uiState.editingContactId = null;
                uiState.formMessage = '';
                formSuccess.value = false;
            };

            const fetchContacts = async () => {
                if (!isLoggedIn.value) return;
                uiState.loadingContacts = true;
                uiState.fetchError = null;
                try {
                    contacts.value = await callApi('get-contacts');
                } catch (error) {
                    console.error('Failed to load contacts:', error);
                    uiState.fetchError = error.message;
                } finally {
                    uiState.loadingContacts = false;
                }
            };

            const saveContact = async () => {
                if (!isLoggedIn.value) return;

                if (!/^\d{1,2}\/\d{1,2}$/.test(contactForm.birthday)) {
                    uiState.formMessage = "Formato compleanno non valido. Usare GG/MM (es. 25/12).";
                    formSuccess.value = false;
                    setTimeout(() => { uiState.formMessage = ''; }, 3000);
                    return;
                }
                 if (contactForm.birthYear && (contactForm.birthYear < 1900 || contactForm.birthYear > new Date().getFullYear())) {
                    uiState.formMessage = "Anno di nascita non valido.";
                    formSuccess.value = false;
                    setTimeout(() => { uiState.formMessage = ''; }, 3000);
                    return;
                }


                uiState.savingContact = true;
                uiState.formMessage = '';
                formSuccess.value = false;
                const isEditing = !!uiState.editingContactId;
                const endpoint = isEditing ? `update-contact?id=${uiState.editingContactId}` : 'create-contact';
                const method = isEditing ? 'PUT' : 'POST';

                try {
                    const payload = { ...contactForm };
                    if (payload.birthYear === '' || payload.birthYear === null || isNaN(payload.birthYear)) {
                         payload.birthYear = null;
                    } else {
                        payload.birthYear = parseInt(payload.birthYear);
                    }
                    if (payload.mobileNumber === '') payload.mobileNumber = null;


                    await callApi(endpoint, method, payload);
                    uiState.formMessage = `Contatto ${isEditing ? 'aggiornato' : 'salvato'} con successo!`;
                    formSuccess.value = true;
                    resetContactForm();
                    fetchContacts();
                } catch (error) {
                    console.error('Error saving contact:', error);
                    uiState.formMessage = `Errore nel salvataggio: ${error.message}`;
                } finally {
                    uiState.savingContact = false;
                    setTimeout(() => { uiState.formMessage = ''; formSuccess.value = false; }, 3000);
                }
            };

            const startEditContact = (contact) => {
                uiState.editingContactId = contact.id;
                contactForm.id = contact.id;
                contactForm.name = contact.name;
                contactForm.birthday = contact.birthday;
                contactForm.birthYear = contact.birthYear;
                contactForm.mobileNumber = contact.mobileNumber;
                contactForm.greetingMessage = contact.greetingMessage;
                uiState.formMessage = '';
                formSuccess.value = false;
                window.scrollTo({ top: document.getElementById('contact-form-section').offsetTop - 20, behavior: 'smooth' });
            };

            const cancelEdit = () => {
                resetContactForm();
            };

            const confirmDeleteContact = async (id) => {
                if (!isLoggedIn.value) return;
                if (window.confirm('Sei sicuro di voler eliminare questo contatto? L\'azione è irreversibile.')) {
                    uiState.deletingContactId = id;
                    try {
                        await callApi(`delete-contact?id=${id}`, 'DELETE');
                        fetchContacts(); // Refresh list
                        // Optionally show success message
                    } catch (error) {
                        console.error('Error deleting contact:', error);
                        alert(`Errore nell'eliminazione del contatto: ${error.message}`);
                    } finally {
                        uiState.deletingContactId = null;
                    }
                }
            };

            // --- Lifecycle Hooks & Watchers ---
            onMounted(() => {
                if (isLoggedIn.value) {
                    fetchContacts();
                }
            });

            // Optional: Clear form message when user starts typing again after an error
            watch([() => contactForm.name, () => contactForm.birthday], () => {
                if (uiState.formMessage && !formSuccess.value) { // Only clear if it was an error message
                    uiState.formMessage = '';
                }
            });


            return {
                isLoggedIn,
                contacts,
                loginForm,
                contactForm,
                uiState, // Contains all UI related reactive properties
                loginSuccess,
                formSuccess,
                handleLogin,
                handleLogout,
                fetchContacts,
                saveContact,
                startEditContact,
                cancelEdit,
                confirmDeleteContact
            };
        }
    };

    createApp(App).mount('#app');
    ```

---

### Phase 3: Testing and Refinement

**3.1. Local Development & Testing:**
    *   Install Netlify CLI if you haven't: `npm install -g netlify-cli`.
    *   Log in: `netlify login`.
    *   Link to your Netlify site (or create one): `netlify link` or `netlify init`.
    *   Run the local development server: `netlify dev`.
        *   This will start a server, run your Netlify functions locally, and serve your frontend from the `public` directory.
        *   It will also pick up your `.env` file for environment variables.
    *   Test all functionalities:
        *   Login/Logout.
        *   Creating, reading, updating, and deleting contacts.
        *   Form validation and error messages.
        *   Responsive design on different screen sizes.
    *   Test the scheduled function manually:
        `netlify functions:invoke birthday-checker --no-identity`
        (Add test data to your Neon DB that has a birthday for the current UTC day to verify notification).

**3.2. Debugging:**
    *   Use browser developer tools for frontend debugging (Vue devtools extension is helpful).
    *   Check `console.log` outputs from Netlify functions in the `netlify dev` terminal.

---

### Phase 4: Deployment to Netlify

**4.1. Environment Variables on Netlify:**
    *   Go to your site on Netlify (app.netlify.com).
    *   Navigate to "Site settings" > "Build & deploy" > "Environment".
    *   Add the following environment variables:
        *   `DATABASE_URL`: Your full Neon PostgreSQL connection string (e.g., `postgresql://user:password@...neon.tech/dbname?sslmode=require`).
        *   `APP_PASSWORD`: The password you chose for app access.
        *   `TELEGRAM_BOT_TOKEN`: Your Telegram bot's API token.
        *   `TELEGRAM_CHAT_ID`: Your Telegram chat ID for notifications.
        *   `NODE_VERSION`: `20` (or your chosen Node.js LTS version).

**4.2. Deployment:**
    *   Commit all your changes to your Git repository:
        ```bash
        git add .
        git commit -m "Initial version of birthday reminder app"
        ```
    *   Push to your main branch (e.g., `main` or `master`) on GitHub/GitLab/Bitbucket (whichever you connected to Netlify):
        ```bash
        git push origin main
        ```
    *   Netlify will automatically detect the push and start a new build and deployment based on your `netlify.toml` and `package.json` settings.
    *   Monitor the deploy log in the Netlify dashboard.

**4.3. Post-Deployment Testing:**
    *   Access your live Netlify site URL.
    *   Repeat all functional tests performed locally.
    *   Check Netlify function logs for the `birthday-checker` after it's scheduled to run (or invoke it manually from Netlify UI if possible for testing, though direct invocation in UI is limited for scheduled ones).
    *   Ensure Telegram notifications are received correctly.

---

## 6. TODO - Future Improvements & Developments

*   **[ ] Enhanced Authentication:** Implement JWT-based authentication for better security if the app were to scale or handle more sensitive data.
*   **[ ] Proper Timezone Handling for Birthdays & Notifications:**
    *   Use a library like `date-fns-tz` in the `birthday-checker` function to accurately determine "today" in CET, accounting for Daylight Saving Time.
    *   Consider allowing users to specify their timezone if the app were multi-user.
    *   Store birthdays consistently (e.g., always store Day/Month, and let the checker function handle timezone logic for "today").
*   **[ ] Frontend Build System (Vite):** If the frontend grows, migrate from CDN Vue to a build setup using Vite for better tooling (Single File Components, optimized builds, HMR).
*   **[ ] Advanced Data Validation:** Use a library like Zod or Joi for more robust server-side validation in Netlify Functions, complementing Prisma's basic type safety.
*   **[ ] UI/UX Enhancements:**
    *   Add sorting/filtering options for the contact list.
    *   Implement more sophisticated "toast" notifications for user feedback instead of simple `alert()` or inline messages.
    *   Consider a loading spinner overlay for API calls.
    *   Pagination for very long contact lists.
*   **[ ] Import/Export Contacts:** Allow users to import contacts from a CSV/JSON file or export their current list.
*   **[ ] Multiple Notification Channels:** Allow configuration of other notification methods (e.g., email via an email service provider like SendGrid).
*   **[ ] Unit & Integration Tests:** Write automated tests for Netlify Functions and critical frontend logic using frameworks like Jest or Vitest.
*   **[ ] Connection Pooling (Prisma Accelerate/PgBouncer):** If direct connections to Neon become a bottleneck or you hit connection limits with increased usage, integrate Prisma Accelerate or configure Neon's PgBouncer.
*   **[ ] Password Hashing for `APP_PASSWORD`:** For better security, store a hashed version of `APP_PASSWORD` in the environment variable and compare a hash of the input password during login.
*   **[ ] Error Monitoring:** Integrate an error monitoring service (e.g., Sentry) for Netlify Functions.
*   **[ ] User-Specific Settings:** If it were to become multi-user, store settings like preferred notification time.
*   **[ ] Accessibility (A11y) Review:** Conduct a thorough accessibility review to ensure the app is usable by people with disabilities (ARIA attributes, keyboard navigation, color contrast).