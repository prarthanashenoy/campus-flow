import { PrismaClient, Category, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create organizer users
  const alice = await prisma.user.upsert({
    where: { auth0Id: 'seed|organizer-alice' },
    update: {},
    create: {
      auth0Id: 'seed|organizer-alice',
      email: 'alice@university.edu',
      name: 'Alice Johnson',
      role: Role.ORGANIZER,
    },
  })

  const bob = await prisma.user.upsert({
    where: { auth0Id: 'seed|organizer-bob' },
    update: {},
    create: {
      auth0Id: 'seed|organizer-bob',
      email: 'bob@university.edu',
      name: 'Bob Martinez',
      role: Role.ORGANIZER,
    },
  })

  // Create student user
  await prisma.user.upsert({
    where: { auth0Id: 'seed|student-carol' },
    update: {},
    create: {
      auth0Id: 'seed|student-carol',
      email: 'carol@student.university.edu',
      name: 'Carol Smith',
      role: Role.STUDENT,
    },
  })

  // Create opportunities
  const opportunities = [
    {
      title: 'Machine Learning Research Assistant',
      description:
        'Join the AI Lab to assist PhD candidates with data collection, model training, and experiment analysis. Ideal for students with Python and statistics background.',
      category: Category.RESEARCH,
      location: 'AI Lab, Building C',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      capacity: 3,
      organizerId: alice.id,
    },
    {
      title: 'Campus Sustainability Volunteer',
      description:
        'Help coordinate weekly campus clean-up events and promote eco-friendly initiatives. Great opportunity to make a visible environmental impact.',
      category: Category.VOLUNTEER,
      location: 'Campus Grounds',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2027-05-30'),
      capacity: 20,
      organizerId: alice.id,
    },
    {
      title: 'Software Engineering Internship — FinTech',
      description:
        'Six-month paid internship at a local fintech startup. Work on real products with a small engineering team. React and Node.js experience preferred.',
      category: Category.INTERNSHIP,
      location: 'Downtown (hybrid)',
      startDate: new Date('2027-01-10'),
      endDate: new Date('2027-06-30'),
      capacity: 2,
      organizerId: bob.id,
    },
    {
      title: 'Intro to Robotics Workshop',
      description:
        'Hands-on two-day workshop covering basics of robotics: sensors, actuators, and simple autonomous navigation. All materials provided.',
      category: Category.WORKSHOP,
      location: 'Engineering Hall, Room 204',
      startDate: new Date('2026-10-04'),
      endDate: new Date('2026-10-05'),
      capacity: 15,
      organizerId: bob.id,
    },
    {
      title: 'Annual Tech Career Fair',
      description:
        'Meet recruiters from 50+ companies in tech, consulting, and finance. Bring printed résumés and dress professionally.',
      category: Category.EVENT,
      location: 'Student Union, Main Hall',
      startDate: new Date('2026-10-22'),
      endDate: new Date('2026-10-22'),
      capacity: 500,
      organizerId: alice.id,
    },
    {
      title: 'Peer Tutoring Program',
      description:
        'Volunteer as a peer tutor for first-year students in mathematics or computer science. Flexible hours — 2–4 hrs per week.',
      category: Category.VOLUNTEER,
      location: 'Learning Centre',
      startDate: new Date('2026-09-08'),
      endDate: new Date('2027-04-30'),
      capacity: 30,
      organizerId: bob.id,
    },
  ]

  for (const data of opportunities) {
    await prisma.opportunity.upsert({
      where: {
        id: (
          await prisma.opportunity.findFirst({ where: { title: data.title } })
        )?.id ?? 'nonexistent',
      },
      update: {},
      create: data,
    })
  }

  console.log(`Seeded ${opportunities.length} opportunities and 3 users.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
