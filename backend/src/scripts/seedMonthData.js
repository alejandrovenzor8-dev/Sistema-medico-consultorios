require('dotenv').config();
const { sequelize, User, Patient, Appointment, ClinicalRecord, Payment } = require('../models');

// Simple function to generate random data without faker
const generateRandomData = {
  firstName: () => {
    const names = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Isabel', 'Pedro', 'Rosa', 'Miguel', 'Carmen', 'Diego', 'Elena', 'José', 'Sofía', 'Francisco'];
    return names[Math.floor(Math.random() * names.length)];
  },
  lastName: () => {
    const surnames = ['García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González', 'Pérez', 'Díaz', 'Sánchez', 'Moreno', 'Jiménez', 'Castillo'];
    return surnames[Math.floor(Math.random() * surnames.length)];
  },
  phone: () => `+34 91 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
  email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
  address: () => `Calle ${Math.floor(Math.random() * 100)}, Apartamento ${Math.floor(Math.random() * 500)}`,
  bloodType: () => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
  allergies: () => ['No conocidas', 'Penicilina', 'Látex', 'Aspirina'][Math.floor(Math.random() * 4)],
  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2),
  randomElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
  randomDate: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  randomSentence: () => {
    const sentences = [
      'Dolor de cabeza recurrente',
      'Molestias articulares',
      'Fatiga general',
      'Problemas digestivos',
      'Tensión muscular',
      'Estrés ocupacional',
      'Insomnio',
      'Mareos ocasionales',
      'Problemas de visión',
      'Taquicardia'
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
  }
};

const seedMonthData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get existing doctors
    const doctors = await User.findAll({ where: { role: 'doctor' } });
    
    if (doctors.length === 0) {
      console.error('❌ No doctors found. Run seed first: npm run seed');
      process.exit(1);
    }

    console.log(`\n📊 Creating test data for the past month...`);

    // Create 15-20 patients
    const patientCount = generateRandomData.randomInt(15, 20);
    const patients = [];
    
    console.log(`\n👥 Creating ${patientCount} patients...`);
    for (let i = 0; i < patientCount; i++) {
      const patient = await Patient.create({
        firstName: generateRandomData.firstName(),
        lastName: generateRandomData.lastName(),
        dateOfBirth: new Date(1970 + generateRandomData.randomInt(0, 50), generateRandomData.randomInt(0, 11), generateRandomData.randomInt(1, 28)),
        gender: generateRandomData.randomElement(['male', 'female', 'other']),
        phone: generateRandomData.phone(),
        email: generateRandomData.email(),
        address: generateRandomData.address(),
        bloodType: generateRandomData.bloodType(),
        allergies: generateRandomData.allergies(),
        emergencyContactName: generateRandomData.firstName() + ' ' + generateRandomData.lastName(),
        emergencyContactPhone: generateRandomData.phone(),
        insuranceProvider: generateRandomData.randomElement(['AXA', 'Mapfre', 'Allianz', 'Generali', 'Sin seguro']),
        insuranceNumber: generateRandomData.randomInt(1000000000, 9999999999).toString(),
        notes: generateRandomData.randomSentence(),
      });
      patients.push(patient);
      process.stdout.write(`\r  ✓ ${i + 1}/${patientCount} patients created`);
    }
    console.log('\n');

    // Create appointments and clinical records for the past 30 days
    console.log(`📅 Creating appointments for the past 30 days...`);
    let appointmentCount = 0;
    let clinicalRecordCount = 0;
    let paymentCount = 0;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create 3-5 appointments per patient
    for (const patient of patients) {
      const appointmentsPerPatient = generateRandomData.randomInt(2, 4);

      for (let i = 0; i < appointmentsPerPatient; i++) {
        const appointmentDate = generateRandomData.randomDate(thirtyDaysAgo, today);
        const doctor = generateRandomData.randomElement(doctors);

        const appointment = await Appointment.create({
          patientId: patient.id,
          doctorId: doctor.id,
          scheduledAt: appointmentDate,
          duration: generateRandomData.randomElement([30, 45, 60]),
          type: generateRandomData.randomElement(['consultation', 'follow_up', 'procedure']),
          status: generateRandomData.randomElement(['completed', 'confirmed', 'cancelled']),
          reason: generateRandomData.randomSentence(),
          notes: generateRandomData.randomSentence(),
          reminderSent: Math.random() > 0.5,
        });
        appointmentCount++;

        // Create clinical record if appointment is completed
        if (appointment.status === 'completed') {
          const clinicalRecord = await ClinicalRecord.create({
            patientId: patient.id,
            appointmentId: appointment.id,
            doctorId: doctor.id,
            visitDate: appointmentDate,
            chiefComplaint: generateRandomData.randomSentence(),
            diagnosis: generateRandomData.randomSentence(),
            treatment: generateRandomData.randomSentence(),
            prescription: generateRandomData.randomSentence(),
            vitalSigns: {
              weight: generateRandomData.randomFloat(50, 120),
              height: generateRandomData.randomFloat(150, 200),
              blood_pressure: `${generateRandomData.randomInt(100, 140)}/${generateRandomData.randomInt(60, 90)}`,
              temperature: generateRandomData.randomFloat(36, 38.5),
              heart_rate: generateRandomData.randomInt(60, 100),
            },
            labResults: generateRandomData.randomSentence(),
            followUpDate: new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            notes: generateRandomData.randomSentence(),
          });
          clinicalRecordCount++;

          // Create payment
          const payment = await Payment.create({
            patientId: patient.id,
            appointmentId: appointment.id,
            amount: generateRandomData.randomFloat(50, 300),
            method: generateRandomData.randomElement(['cash', 'card', 'transfer', 'insurance']),
            status: generateRandomData.randomElement(['completed', 'pending']),
            description: `Consulta - ${appointment.type}`,
            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            paidAt: appointmentDate,
            notes: generateRandomData.randomSentence(),
          });
          paymentCount++;
        }
      }

      process.stdout.write(`\r  ✓ Appointments created for ${patients.indexOf(patient) + 1}/${patients.length} patients`);
    }
    console.log('\n');

    // Summary
    console.log('\n✅ Database seeded with test data!\n');
    console.log('📊 Summary:');
    console.log(`   • Patients created: ${patientCount}`);
    console.log(`   • Appointments created: ${appointmentCount}`);
    console.log(`   • Clinical records created: ${clinicalRecordCount}`);
    console.log(`   • Payments created: ${paymentCount}`);
    console.log('\n🎉 Ready to test the system!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seedMonthData();
