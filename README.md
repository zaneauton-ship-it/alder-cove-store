# Alder & Cove storefront

This package contains a custom static storefront for **Alder & Cove**, operated by **Foothills Online Listings LLC**.

## Included
- Static HTML/CSS/JS storefront
- 88-product vanity catalog in `assets/products.json`
- Branded SVG wordmark and favicon
- Product-specific branded placeholder artwork in `assets/placeholders/`
- Cloudflare Pages Functions for embedded Stripe Checkout
- Policy pages tailored to your launch setup

## Launch profile
- Brand: Alder & Cove
- Legal entity: Foothills Online Listings LLC
- Support email: info@foothillslistings.online
- Processing time: 72 hours
- Return window: 30 days
- Shipping region at launch: United States
- Checkout: embedded Stripe Checkout
- Taxes: handled in Stripe with `automatic_tax` enabled

## Deploy on Cloudflare Pages
1. Create a new Pages project in Cloudflare.
2. Upload this folder or connect a Git repo containing these files.
3. In Pages project settings, add these environment variables:
   - `STRIPE_SECRET_KEY`
   - `PUBLIC_SITE_URL` = `https://foothillslistings.online`
4. Update `assets/config.js` and replace `pk_test_replace_me` with your Stripe publishable key.
5. In Stripe Dashboard:
   - activate Stripe Tax
   - enable the payment methods you want
   - set branding if desired
6. Add `foothillslistings.online` as a custom domain in Cloudflare Pages and point your DNS records accordingly.

## Embedded Stripe Checkout notes
This build uses Stripe Checkout Sessions with `ui_mode: embedded_page`, `automatic_tax: enabled`, and a return page at `/success.html`.

## Current limitation
The scraper CSV did not include product image URLs. To keep the site visually polished and launch-ready, the storefront currently uses branded product-specific SVG placeholders. If you later obtain true product image URLs, replace each product's `image` field in `assets/products.json` with the real URL or local asset path.

## Catalog source
The product catalog was generated from:
- `dataset_wayfair-scraper_2026-03-29_04-05-36-242.csv`
