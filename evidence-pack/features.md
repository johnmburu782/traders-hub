# Features implemented in the inspected source

The list below describes behavior visible in the checked-in client-side code. It is not a claim that every user flow has passed end-to-end testing.

## Public pages and appearance

- Landing page with product messaging, navigation, calls to action, and contact/footer content.
- Shared responsive-oriented layout, design tokens, typography, cards, forms, tables, badges, and dark-mode styles.
- Theme toggle with the selected light/dark preference persisted in `localStorage`.
- Toast notifications and mobile navigation toggle helpers.

## Accounts

- Separate business and buyer registration/login forms.
- Client-side required-field, email, phone, and password-confirmation validation in registration code.
- Duplicate email checks and role-aware local session helpers.
- Logout handling and route guarding for the business dashboard.

## Marketplace

- Product catalog with search, category filtering, sorting, pagination, and availability/discount presentation.
- Guest or buyer cart, quantity changes, item removal, subtotal/delivery/total calculations, and checkout flow.
- Buyer order history and tracking display.
- Demo catalog/business seeding when no products exist.

## Business dashboard

- Overview KPIs, revenue and best-seller charts, and recent orders.
- Product listing/search and product add/edit/delete flows.
- Orders view and status presentation.
- Debtor list/search, add-debtor flow, payment marking, and debt reporting.
- Notifications list/read state and business profile editing.
- Demo products, debtors, and orders are seeded for an empty business view.

## Important implementation limitation

These workflows use browser-side `localStorage`. The source stores account password values in that storage and includes demo credentials/data in the catalog seed code. This implementation is suitable only as a prototype/demo; source inspection does not establish production-grade authentication, access control, data protection, payment processing, or persistence across browsers/devices.
