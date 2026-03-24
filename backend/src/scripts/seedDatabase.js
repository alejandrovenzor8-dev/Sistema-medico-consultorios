require('dotenv').config();
const { sequelize, User } = require('../models');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Models synchronized');

    // Check if admin already exists
    const adminExists = await User.findOne({ where: { email: 'admin@consultorio.com' } });
    if (adminExists) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Create default users
    const users = [
      {
        name: 'Admin Consultorio',
        email: 'admin@consultorio.com',
        password: 'admin123456',
        role: 'admin',
      },
      {
        name: 'Dr. Juan Pérez',
        email: 'doctor@consultorio.com',
        password: 'doctor123456',
        role: 'doctor',
      },
      {
        name: 'María Recepción',
        email: 'receptionist@consultorio.com',
        password: 'receptionist123456',
        role: 'receptionist',
      },
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n🌱 Database seeded successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@consultorio.com');
    console.log('  Password: admin123456');
    console.log('  Role: admin\n');
    console.log('Doctor:');
    console.log('  Email: doctor@consultorio.com');
    console.log('  Password: doctor123456');
    console.log('  Role: doctor\n');
    console.log('Receptionist:');
    console.log('  Email: receptionist@consultorio.com');
    console.log('  Password: receptionist123456');
    console.log('  Role: receptionist');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
