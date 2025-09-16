# **App Name**: ReasyBook

## Core Features:

- Tenant Onboarding: Allow businesses to sign up via a registration form and create a unique subdomain. Admin approval is required to activate the tenant account.
- Subscription Management: Configure different subscription plans with limits (e.g., max users, max locations).
- Service and Staff Management: Enable tenants to create and manage services (name, duration, price) and invite staff members.
- Staff-Service Assignment: Provide an interface to explicitly assign which staff members can perform each service.
- Real-time Availability Calculation: Provide an API endpoint to calculate available slots for a service, considering staff schedules, exceptions, and existing bookings, only for the staff assigned to that service. Uses AI as a tool to incorporate schedules and resources when determining the bookings.
- Booking Widget: Offer a clean and responsive booking widget that tenants can embed on their websites, guiding customers to select a service, view availability, choose a slot, and complete their details.
- Payment Processing: Integrate Stripe for payment processing during the booking flow.

## Style Guidelines:

- Primary color: Soft, calming blue (#64B5F6) to inspire trust and reliability.
- Background color: Light gray (#F5F5F5), a desaturated hue of the primary, for a clean, professional backdrop.
- Accent color: Muted green (#81C784), analogous to blue, to highlight key actions.
- Body and headline font: 'PT Sans', a humanist sans-serif that provides a modern look and feel, and reads well in many sizes.
- Use a consistent set of simple, line-based icons for services, staff, and booking-related actions.
- Employ a card-based layout for dashboards, presenting information in a modular and digestible format.
- Incorporate subtle transitions and animations to enhance user experience and provide feedback on interactions.