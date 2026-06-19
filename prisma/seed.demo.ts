import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: hashedPassword,
    },
  })
  console.log('✅ Admin user created:', user.email)

  // Create settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: 'Skyline Realty Pvt Ltd',
      companyEmail: 'info@skylinerealty.com',
      companyPhone: '+91 9876543210',
      companyAddress: 'Office 501, Skyline Tower, Sector 18, Noida, UP 201301',
      currency: 'INR',
    },
  })

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Skyline Heights Phase 1',
      description: 'Premium residential apartments with modern amenities',
      location: 'Sector 150, Noida',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201310',
      type: 'Residential',
      status: 'Under Construction',
      reraNumber: 'UPRERAPRJ1234567',
      totalArea: 500000,
      minPrice: 4500000,
      maxPrice: 12000000,
      amenities: 'Swimming Pool,Gym,Clubhouse,Garden,Basketball Court,Jogging Track,24/7 Security',
      nearbyLandmarks: 'Noida Sector 148 Metro, DPS School, Fortis Hospital, Logix City Centre Mall',
      launchDate: new Date('2022-01-01'),
      possessionDate: new Date('2025-12-31'),
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Green Valley Township',
      description: 'Integrated township with plots and villas',
      location: 'Yamuna Expressway, Greater Noida',
      city: 'Greater Noida',
      state: 'Uttar Pradesh',
      type: 'Township',
      status: 'Ready to Move',
      reraNumber: 'UPRERAPRJ7654321',
      totalArea: 2000000,
      minPrice: 3000000,
      maxPrice: 25000000,
      amenities: 'Club House,Swimming Pool,Temple,Shopping Complex,School,Hospital',
      nearbyLandmarks: 'Jewar Airport, Yamuna Expressway, Buddha International Circuit',
      launchDate: new Date('2020-06-01'),
      possessionDate: new Date('2023-06-30'),
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Metro Commercial Hub',
      description: 'Premium commercial spaces near metro',
      location: 'Sector 62, Noida',
      city: 'Noida',
      state: 'Uttar Pradesh',
      type: 'Commercial',
      status: 'Ready to Move',
      reraNumber: 'UPRERAPRJ9876543',
      minPrice: 5000000,
      maxPrice: 50000000,
      amenities: 'Power Backup,Parking,Security,CCTV,Fire Safety',
    },
  })
  console.log('✅ Projects created')

  // Create towers
  const tower1 = await prisma.tower.create({
    data: { projectId: project1.id, name: 'Tower A', totalFloors: 25, totalUnits: 100 },
  })
  const tower2 = await prisma.tower.create({
    data: { projectId: project1.id, name: 'Tower B', totalFloors: 25, totalUnits: 100 },
  })

  // Create floors for Tower A
  const floors = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.floor.create({ data: { towerId: tower1.id, number: i + 1, name: `Floor ${i + 1}` } })
    )
  )

  // Create units for project 1
  const unitTypes = ['2BHK', '3BHK', '4BHK', 'Penthouse']
  const facings = ['North', 'South', 'East', 'West', 'North-East']
  const unitStatuses = ['Available', 'Available', 'Available', 'Booked', 'Sold', 'Reserved']

  const units: any[] = []
  for (let f = 0; f < 5; f++) {
    for (let u = 1; u <= 4; u++) {
      const bhk = unitTypes[u - 1] || '2BHK'
      const size = u === 1 ? 1200 : u === 2 ? 1600 : u === 3 ? 2200 : 3500
      const price = size * 4500
      const status = unitStatuses[Math.floor(Math.random() * unitStatuses.length)]
      const unit = await prisma.unit.create({
        data: {
          projectId: project1.id,
          towerId: tower1.id,
          floorId: floors[f]?.id,
          unitNumber: `A${(f + 1) * 100 + u}`,
          type: 'Apartment',
          size,
          sizeUnit: 'sqft',
          facing: facings[u - 1],
          price,
          plcCharges: Math.floor(Math.random() * 200000),
          parkingCharges: 300000,
          otherCharges: 50000,
          totalPrice: price + 300000 + 50000,
          status,
          bedrooms: u === 1 ? 2 : u === 2 ? 3 : u === 3 ? 4 : 5,
          bathrooms: u === 1 ? 2 : u === 2 ? 3 : u === 3 ? 4 : 5,
          balcony: true,
          parking: true,
          furnishing: 'Unfurnished',
        },
      })
      units.push(unit)
    }
  }

  // Project 2 plots
  for (let i = 1; i <= 10; i++) {
    const sizes = [200, 250, 300, 400, 500]
    const size = sizes[i % sizes.length]
    await prisma.unit.create({
      data: {
        projectId: project2.id,
        unitNumber: `P-${100 + i}`,
        type: 'Plot',
        size,
        sizeUnit: 'sqyd',
        price: size * 15000,
        totalPrice: size * 15000,
        status: i <= 4 ? 'Sold' : i <= 6 ? 'Booked' : 'Available',
        parking: false,
        balcony: false,
        furnishing: 'Unfurnished',
      },
    })
  }
  console.log('✅ Units created')

  // Create leads
  const leadNames = [
    ['Raj Kumar', '9876543210', 'raj@example.com', 'Noida'],
    ['Priya Sharma', '9812345678', 'priya@example.com', 'Delhi'],
    ['Amit Singh', '9898989898', 'amit@example.com', 'Gurgaon'],
    ['Sunita Gupta', '9765432109', 'sunita@example.com', 'Noida'],
    ['Vikram Mehta', '9654321098', 'vikram@example.com', 'Delhi'],
    ['Kavya Nair', '9543210987', 'kavya@example.com', 'Bengaluru'],
    ['Rohit Jain', '9432109876', 'rohit@example.com', 'Mumbai'],
    ['Deepa Agarwal', '9321098765', 'deepa@example.com', 'Noida'],
    ['Suresh Patel', '9210987654', 'suresh@example.com', 'Ahmedabad'],
    ['Meena Rao', '9109876543', 'meena@example.com', 'Hyderabad'],
    ['Arjun Kapoor', '9087654321', 'arjun@example.com', 'Pune'],
    ['Rekha Verma', '9876012345', 'rekha@example.com', 'Noida'],
    ['Manoj Kumar', '9765012345', 'manoj@example.com', 'Delhi'],
    ['Shreya Das', '9654012345', 'shreya@example.com', 'Kolkata'],
    ['Naveen Reddy', '9543012345', 'naveen@example.com', 'Hyderabad'],
  ]
  const statuses = ['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Negotiation', 'Hot Lead', 'Won', 'Lost']
  const sources = ['Website', 'Referral', 'Social Media', 'Hoarding', 'Walk-in', 'Agent', 'Newspaper']
  const priorities = ['Low', 'Medium', 'High', 'Urgent']

  const leads = []
  for (let i = 0; i < leadNames.length; i++) {
    const [name, phone, email, city] = leadNames[i]
    const status = statuses[i % statuses.length]
    const budget = (30 + Math.floor(Math.random() * 70)) * 100000
    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        name,
        phone,
        email,
        city,
        budget,
        budgetMax: budget + 2000000,
        propertyType: i % 3 === 0 ? 'Plot' : i % 2 === 0 ? 'Villa' : 'Apartment',
        source: sources[i % sources.length],
        status,
        priority: priorities[i % priorities.length],
        notes: `Lead from ${sources[i % sources.length]}. Interested in ${i % 2 === 0 ? 'residential' : 'commercial'} property.`,
        followUpDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      },
    })
    leads.push(lead)
  }
  console.log('✅ Leads created')

  // Create customers from won leads
  const wonLeads = leads.filter((l) => l.status === 'Won')
  const customers = []
  for (let i = 0; i < Math.min(wonLeads.length, units.length); i++) {
    const lead = wonLeads[i]
    const unit = units[i]
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        applicantName: lead.name,
        applicantPhone: lead.phone,
        email: lead.email || undefined,
        dateOfAgreement: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000),
        projectId: project1.id,
        unitId: unit.id,
        bookingStatus: 'Active',
        allotmentLetter: true,
        tokenMoney: true,
        idProof: true,
        panCardDoc: i % 2 === 0,
        agreementCopy: true,
        paymentPlan: i % 3 === 0,
        bankDocuments: false,
        possessionLetter: false,
        notes: `Customer converted from lead on ${new Date().toLocaleDateString()}`,
      },
    })
    customers.push(customer)

    // Update unit status
    await prisma.unit.update({ where: { id: unit.id }, data: { status: 'Booked' } })

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        unitId: unit.id,
        bookingDate: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000),
        bookingAmount: 500000,
        totalAmount: unit.totalPrice || 5000000,
        discountAmount: 100000,
        status: 'Confirmed',
        paymentPlan: 'Construction Linked Plan',
      },
    })

    // Create payments for customer
    const paymentAmounts = [500000, 1000000, 750000]
    for (let j = 0; j < 2; j++) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          customerId: customer.id,
          bookingId: booking.id,
          amount: paymentAmounts[j],
          paymentMode: ['Bank Transfer', 'Cheque', 'UPI'][j % 3],
          type: j === 0 ? 'Booking' : 'Installment',
          status: 'Paid',
          paymentDate: new Date(Date.now() - (j + 1) * 15 * 24 * 60 * 60 * 1000),
          receiptNumber: `RCP-${Date.now().toString(36).toUpperCase()}-${j}`,
          transactionId: `TXN${Date.now()}${j}`,
        },
      })
    }
  }
  console.log('✅ Customers and bookings created')

  // Create follow-ups
  const followUpTitles = [
    'Initial call back', 'Site visit follow-up', 'Price negotiation call',
    'Document collection', 'Agreement discussion', 'Payment reminder',
    'Booking confirmation', 'Project update sharing', 'RERA document sharing',
  ]
  for (let i = 0; i < 10; i++) {
    await prisma.followUp.create({
      data: {
        userId: user.id,
        leadId: leads[i % leads.length].id,
        title: followUpTitles[i % followUpTitles.length],
        description: 'Scheduled follow-up for lead management',
        dueDate: new Date(Date.now() + (i - 3) * 24 * 60 * 60 * 1000),
        type: ['Call', 'Meeting', 'Site Visit', 'Email', 'WhatsApp'][i % 5],
        status: i < 3 ? 'Completed' : i < 5 ? 'Missed' : 'Pending',
        priority: ['Low', 'Medium', 'High', 'Urgent'][i % 4],
      },
    })
  }
  console.log('✅ Follow-ups created')

  // Create notifications
  const notifData = [
    { title: 'New Lead Added', message: 'Raj Kumar has been added as a new lead', type: 'success' },
    { title: 'Follow-up Due', message: 'Follow-up with Priya Sharma is due today', type: 'warning' },
    { title: 'Payment Received', message: '₹5,00,000 received from Amit Singh', type: 'success' },
    { title: 'Unit Booked', message: 'Unit A201 has been booked by Sunita Gupta', type: 'info' },
    { title: 'Overdue Follow-up', message: 'You have 3 overdue follow-ups', type: 'warning' },
  ]
  for (const notif of notifData) {
    await prisma.notification.create({
      data: { userId: user.id, ...notif, isRead: false },
    })
  }

  // Create activity logs
  const activities = [
    { action: 'created', entity: 'Lead', description: 'New lead Raj Kumar created' },
    { action: 'updated', entity: 'Lead', description: 'Lead status updated to Hot Lead' },
    { action: 'created', entity: 'Customer', description: 'Customer Priya Sharma created' },
    { action: 'created', entity: 'Booking', description: 'Booking for Unit A201 confirmed' },
    { action: 'created', entity: 'Payment', description: 'Payment of ₹5,00,000 recorded' },
    { action: 'created', entity: 'Project', description: 'Project Skyline Heights Phase 1 created' },
  ]
  for (const activity of activities) {
    await prisma.activityLog.create({ data: { userId: user.id, ...activity } })
  }
  console.log('✅ Notifications and activity logs created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: admin@gmail.com')
  console.log('   Password: admin123')
  console.log('\n🌐 Run: npm run dev')
  console.log('   Open: http://localhost:3000')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
