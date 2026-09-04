/**
 * Mock data for WORKMAT Worker App UI
 */

export const WORKER = {
  id: 'w1',
  name: 'Rajesh Kumar',
  phone: '+91 98XXX XXXXX',
  photo: null, // will use initials
  rating: 4.7,
  completedJobs: 342,
  memberSince: 'Jan 2024',
  skills: ['Electrician', 'Wiring', 'Fan Repair'],
  cooperative: 'Shramik Cooperative Society',
  aadhar: 'XXXX XXXX 4521',
  city: 'Hyderabad',
  isAvailable: true,
};

export const NEW_JOB_REQUEST = {
  id: 'job_101',
  serviceType: 'Electrical Repair',
  serviceIcon: 'lightning-bolt',
  customer: {
    name: 'Priya Sharma',
    rating: 4.5,
    photo: null,
  },
  location: {
    address: '12-2-831, Mehdipatnam, Hyderabad',
    landmark: 'Near City Hospital',
    distance: '3.2 km',
    estimatedTime: '12 min',
  },
  services: [
    { name: 'Fan Installation', price: 350 },
    { name: 'Switchboard Repair', price: 250 },
  ],
  baseAmount: 600,
  requestedAt: '2 min ago',
};

export const CURRENT_JOB = {
  id: 'job_099',
  serviceType: 'Plumbing',
  serviceIcon: 'water-pump',
  customer: {
    name: 'Amit Patel',
    rating: 4.8,
    photo: null,
  },
  location: {
    address: '5-9-22, Banjara Hills, Hyderabad',
    landmark: 'Opp. KBR Park Gate 2',
    distance: '1.5 km',
    estimatedTime: '6 min',
  },
  services: [
    { name: 'Pipe Leak Repair', price: 400 },
    { name: 'Tap Replacement', price: 300 },
  ],
  baseAmount: 700,
  extraAmount: 150,
  totalAmount: 850,
  currentStep: 2, // 0: Accepted, 1: On The Way, 2: Arrived, 3: Work Started, 4: Completed
  acceptedAt: '10:30 AM',
};

export const TODAYS_JOBS = [
  { id: 'job_097', service: 'Fan Repair', customer: 'Suresh M.', amount: 450, status: 'completed', time: '9:00 AM' },
  { id: 'job_098', service: 'Wiring', customer: 'Kavitha R.', amount: 800, status: 'completed', time: '11:30 AM' },
  { id: 'job_099', service: 'Plumbing', customer: 'Amit P.', amount: 850, status: 'in-progress', time: '2:15 PM' },
];

export const EARNINGS = {
  today: 2100,
  todayJobs: 3,
  weekly: 12450,
  weeklyJobs: 18,
  monthly: 48200,
  monthlyJobs: 67,
  extraEarned: 2350,
};

export const CHAT_MESSAGES = [
  { id: '1', sender: 'customer', text: 'Hello, when can you arrive?', time: '2:10 PM' },
  { id: '2', sender: 'worker', text: 'I will be there in 15 minutes', time: '2:11 PM' },
  { id: '3', sender: 'customer', text: 'Please bring extra wire if possible', time: '2:12 PM' },
  { id: '4', sender: 'worker', text: 'Sure, I will carry extra materials', time: '2:13 PM' },
  { id: '5', sender: 'customer', text: 'Thank you! 🙏', time: '2:14 PM' },
];

export const JOB_STEPS = [
  'Accepted',
  'On The Way',
  'Arrived',
  'Work Started',
  'Completed',
];
