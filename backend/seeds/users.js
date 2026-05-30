require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const SEED_USERS = [
  { name: 'Alice Agent',       email: 'agent@gsp.com',       password: 'password123', role: 'agent' },
  { name: 'Carol Counsellor',  email: 'counsellor@gsp.com',  password: 'password123', role: 'counsellor' },
  { name: 'Quinn QA',          email: 'qa@gsp.com',          password: 'password123', role: 'qa_officer' },
  { name: 'Adam Admissions',   email: 'admissions@gsp.com',  password: 'password123', role: 'admission_officer' },
  { name: 'Victor Visa',       email: 'visa@gsp.com',        password: 'password123', role: 'visa_officer' },
  { name: 'Emma Enrolment',    email: 'enrolment@gsp.com',   password: 'password123', role: 'enrolment_officer' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const data of SEED_USERS) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`  skip  ${data.email} (already exists)`);
      continue;
    }
    const user = new User(data);
    await user.save();
    console.log(`  seeded ${data.email} [${data.role}]`);
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
