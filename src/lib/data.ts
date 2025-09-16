export const staff = [
  { id: '1', name: 'Jane Doe', email: 'jane.d@example.com', role: 'Stylist' },
  { id: '2', name: 'John Smith', email: 'john.s@example.com', role: 'Barber' },
  { id: '3', name: 'Emily White', email: 'emily.w@example.com', role: 'Nail Artist' },
  { id: '4', name: 'Michael Brown', email: 'michael.b@example.com', role: 'Masseuse' },
];

export const services = [
  { id: '1', name: "Women's Haircut", duration: 60, price: 75.00, staffIds: ['1'] },
  { id: '2', name: "Men's Haircut", duration: 30, price: 40.00, staffIds: ['2'] },
  { id: '3', name: 'Deep Tissue Massage', duration: 60, price: 120.00, staffIds: ['4'] },
  { id: '4', name: 'Classic Manicure', duration: 45, price: 50.00, staffIds: ['3'] },
  { id: '5', name: 'Color & Highlights', duration: 120, price: 150.00, staffIds: ['1'] },
];

export const subscriptionPlans = {
  current: "Pro",
  limits: {
    users: 10,
    locations: 3,
  },
  usage: {
    users: 4,
    locations: 1,
  }
};
