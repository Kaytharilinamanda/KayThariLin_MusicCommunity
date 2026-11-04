# Harmony Music Community

React and Tailwind stay in this folder. Laravel in `laravel/` is the API and the server for http://localhost:8000. MySQL stores the accounts, events, tickets, workshops, courses, orders, posts, announcements, reviews, and notifications.

## Run on port 8000

1. Start MySQL in the XAMPP Control Panel.
2. Create the database if it does not exist:

```sql
CREATE DATABASE IF NOT EXISTS music_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. In Git Bash, from the project folder:

```bash
cd laravel
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

4. In a second Git Bash window, from the project folder, build the React app into Laravel's public folder:

```bash
npm install
npm run build
```

Open http://localhost:8000.

`php artisan migrate:fresh --seed` rebuilds the MySQL tables and loads the catalog. Do not commit `.env`. The example file uses database `music_community`, user `root`, and an empty password, which matches a default XAMPP install.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@harmony.community | HarmonyAdmin1 |
| Organizer | organizer@harmony.community | Organizer123 |
| User | user@harmony.community | Listener123 |

There is one admin account. Public registration is only for users and organizers. Organizers submit events, tickets, workshops, courses, categories, centers, and enrollments. Admin approves or rejects them and can manage user and organizer accounts.

## Optional Vite dev server

`npm run dev` still runs the React app with hot reload and proxies `/api` to http://127.0.0.1:8000. Start Laravel first. The address to use for the finished app is port 8000.
