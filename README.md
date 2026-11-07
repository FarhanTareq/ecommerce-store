# Sporsify

Sporsify is a production-ready sports gear storefront for Bangladesh. It includes guest checkout, cash-on-delivery, manual bKash/Nagad verification, Google and email/password sign-in, an admin panel, coupon codes, per-size stock, and SEO metadata.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- MongoDB Atlas + native MongoDB driver (no Mongoose)
- Better Auth (email/password + Google OAuth + admin plugin)
- UploadThing v7 for product images
- Zustand for the cart, Zod for validation, Sonner for toasts

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in the values described below
npm run seed
npm run dev
```

Open `http://localhost:3000`. The app builds without API keys, but checkout, admin login, image uploads, and product data need MongoDB and the services below.

Generate a Better Auth secret:

```bash
openssl rand -base64 32
```

## Environment variables

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=

MONGODB_URI=mongodb+srv://...
MONGODB_DB=sporsify

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

UPLOADTHING_TOKEN=

ADMIN_EMAIL=admin@sporsify.com
ADMIN_PASSWORD=a-strong-password
ADMIN_NAME=Sporsify Admin

NEXT_PUBLIC_GA_ID=
GOOGLE_SITE_VERIFICATION=
```

For local development use `http://localhost:3000` for both site URL variables.

## 1. MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user with read/write access.
3. Allow your IP (and `0.0.0.0/0` for Vercel) in Network Access.
4. Copy the connection string into `MONGODB_URI`. Keep `MONGODB_DB=sporsify`.
5. Run `npm run seed` to create indexes, categories, settings, a sample coupon, 20 demo products with images, and the admin account.

The seed is idempotent. Use `npm run setup` to also re-add demo products/coupons when products already exist.

## 2. UploadThing

1. Create an app at [uploadthing.com](https://uploadthing.com).
2. Copy the **V7 token** into `UPLOADTHING_TOKEN`.
3. Product image uploads are admin-only and stored with UploadThing. Deleting a product or removing an image also deletes the uploaded file.

## 3. Google sign-in

1. In Google Cloud Console, configure the OAuth consent screen.
2. Create an OAuth client of type **Web application**.
3. Add the authorized redirect URI:
   `https://your-domain.com/api/auth/callback/google`
   (and `http://localhost:3000/api/auth/callback/google` for local development).
4. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Google sign-in only appears when both values are set. Email/password signup works without Google.

## Admin access

- Admin URL: `/admin/login`
- Credentials: the `ADMIN_EMAIL` / `ADMIN_PASSWORD` used by `npm run seed`.
- If the admin account already exists, running the seed again updates its role to `admin`.
- If you created the account through the normal signup page first, run `npm run seed` again to grant admin access.

From the admin panel you can:

- Create, edit, archive, and delete products
- Upload multiple images per product
- Set price, discount percent, sizes, and stock per size
- Manage coupons with min order, max discount, expiry, usage limits, and per-phone limits
- Update inside/outside Dhaka shipping fees, the free-delivery threshold, bKash/Nagad numbers, contact details, and the announcement ticker
- Change the admin login password at `/admin/account`
- Update order and payment statuses

## Orders and payments

- Guest checkout is the default; no account is required.
- Cash on delivery creates an order with payment status `cod_pending`.
- bKash/Nagad require the customer to submit a transaction ID and become `pending_verification`.
- The admin manually verifies or rejects mobile payments.
- Prices, product discounts, stock, shipping, and coupons are always recalculated on the server before an order is created.
- Stock is decremented per size. On MongoDB Atlas (replica set), order creation uses a transaction; standalone MongoDB falls back to non-transactional writes.
- Customers receive a private confirmation URL at `/orders/[token]` and can track an order at `/track-order` with the order number and phone number.
- Logged-in customers see their order history at `/account`.

## Coupons

Create coupons at `/admin/coupons`. Supported rules:

- Percentage or fixed amount
- Minimum order subtotal
- Maximum discount cap
- Start and expiry dates
- Total usage limit
- Limit per phone number
- Active/inactive toggle

Sample coupon from the seed: `FARHAN10` (10% off). Edit or delete it before launch.

## SEO

- Per-page metadata and canonical URLs
- Product, Offer, Breadcrumb, Organization, and WebSite JSON-LD
- Dynamic `sitemap.xml` and `robots.txt`
- Generated Open Graph image
- Admin, cart, checkout, account, and order pages are excluded from indexing
- Set `NEXT_PUBLIC_SITE_URL` to the production URL before deploying
- Add the Google Search Console verification token to `GOOGLE_SITE_VERIFICATION` if needed
- Set `NEXT_PUBLIC_GA_ID` only after adding a Google Analytics script; the variable is reserved for it

## Deployment (Vercel)

1. Push the project to GitHub and import it into Vercel.
2. Add every environment variable from `.env.example` in the Vercel project settings.
3. Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the production domain.
4. Add the production Google redirect URI in Google Cloud Console.
5. Run `npm run seed` once locally against the production database (or from a one-off environment).
6. Deploy.

## Scripts

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run seed       # indexes, admin, categories, settings, coupons, demo data if empty
npm run setup      # same as seed but also re-adds demo products/coupons
```

## Notes

- Product images are optional; products without images show a branded placeholder.
- The seed adds 20 demo products using Unsplash images. Image URLs are allowed through `next.config.ts`; edit or delete the demo products and upload real photos from the admin panel.
- Resend/transactional email is not wired up. Order updates are shown on the order page and in the account area.
- Keep `BETTER_AUTH_SECRET` private and unique per environment.
