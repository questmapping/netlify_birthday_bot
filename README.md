# Netlify Birthday Reminder App

A simple, password-protected web application hosted on Netlify. It features a graphical user interface (GUI) to manage an address book of contacts with their birthdays. A daily Netlify Scheduled Function will check for birthdays and send a notification if any are found. Data will be stored in a Neon PostgreSQL database, accessed via Prisma ORM. The frontend will be built with Vue.js 3 via CDN for reactivity.

## Fork and Clone this repository and run your own Birthday Reminder App

1.  Fork this repository
2.  Clone the forked repository to your local machine
3.  Install dependencies
4.  Set up environment variables
5.  Run the development server
6.  Deploy to Netlify

## 1. Project Overview

A simple, password-protected web application hosted on Netlify. It features a graphical user interface (GUI) to manage an address book of contacts with their birthdays. A daily Netlify Scheduled Function will check for birthdays and send a notification if any are found. Data will be stored in a Neon PostgreSQL database, accessed via Prisma ORM. The frontend will be built with Vue.js 3 via CDN for reactivity.

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

You can find more details in the [Technical Documentation](project/techdoc.md).

To run this project locally, you will need to have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

After cloning the repository, copy the `.env.template` file to `.env` and fill in the required environment variables. Then you can run the following commands:

```bash
npm install
npm run dev
```

This will start a local development server, and you can access the application at `http://localhost:8888`.

To deploy the application to Netlify, you will need to have a Netlify account. You can sign up for a free account at [netlify.com](https://www.netlify.com/).

After creating a Netlify account, you can deploy the application by following these steps:

1.  Go to [netlify.com](https://www.netlify.com/).
2.  Click on "New site from Git".
3.  Select the repository you cloned the application to.
4.  Follow the prompts to deploy the application.

---
## Known Issues

### Scheduled Functions and @netlify/plugin-schedule

**Note:** The `@netlify/plugin-schedule` plugin is not available on npm and cannot be installed locally. This means:
- You must comment out or remove the `[[plugins]]` block for `@netlify/plugin-schedule` in your `netlify.toml` to run `netlify dev` locally.
- You can still manually test your scheduled function locally using:
  ```sh
  netlify functions:invoke birthday-checker --no-identity
  ```
- For production deployments, you should enable the plugin in the Netlify App UI (see below).

### How to Enable Scheduled Functions in Netlify App UI
1. Deploy your site to Netlify.
2. Go to your site dashboard at [https://app.netlify.com/sites](https://app.netlify.com/sites).
3. Select your site.
4. In the left sidebar, click on **Plugins**.
5. Click **Go to the Netlify Plugin directory** and search for `Schedule Functions`.
6. Click **Install plugin** and follow the prompts to enable scheduled functions for your site.
7. Configure the schedule for your function as needed (e.g., set `birthday-checker` to run daily at 10:00 AM CET).

### .prisma folder
if you get an error while running `netlify dev`, try deleting the .prisma folder inside the node_modules folder (not the one inside @prisma/client) and running `npx prisma generate`.

### functions-internal and functions-serve folders
if you get an error while running `netlify dev`, try deleting the functions-internal and functions-serve folders inside the .netlify folder and running `netlify dev` again.
---
