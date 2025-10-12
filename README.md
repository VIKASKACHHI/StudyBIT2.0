# Welcome to your Bit PYQ and notes plateform project

## Project info

## How can I edit this code?

There are several ways of editing your application.


**Use your preferred IDE**


Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## Avoiding 404 on refresh / deep links

When hosting this single-page app on static hosts (Netlify, GitHub Pages, S3, etc.), refreshing a route other than `/` can return a 404 because the host looks for a matching file. This project includes a couple of simple fallbacks placed in the `public/` folder:

- `public/404.html` — a small HTML file that redirects to `/` so browsers that serve the 404 page will get routed back to the SPA.
- `public/_redirects` — Netlify redirect rule to serve `index.html` for all routes (`/* /index.html 200`).

How to test locally:

1. Run the dev server (Vite) with `npm run dev` and open a nested route, e.g. `/browse`.
2. Refresh the page — Vite already handles history API fallback in dev, so this should work.

How to test on Netlify:

1. Deploy the `dist/` build normally.
2. Visit a nested route and refresh; Netlify will use the `_redirects` rule to serve `index.html` and the app router will handle the URL.

Notes for other hosts:

- GitHub Pages: create a `404.html` in `public/` (already added) so GitHub Pages will serve it for unknown paths and redirect to `/`.
- Nginx / Apache: configure a rewrite rule to forward all requests to `index.html` (history API fallback). For example, Nginx `try_files $uri /index.html;`.

Preview image (Open Graph / Twitter)

To show a rich link preview when sharing the site, place a preview image at `public/preview.png`. The app's `index.html` already includes Open Graph and Twitter meta tags that point to `/preview.png`.

Test link previews:

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator




