const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = '200@gmail.com';
  console.log(`Seeding data for ${email}...`);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: 'Demo User 200',
        shopProfile: {
          create: {
            shopName: 'GemTrack Demo Shop',
            phone: '9876543210',
            address: '123 Demo Street, City'
          }
        }
      }
    });
    console.log('Created User & Shop Profile');
  } else {
    console.log('User already exists');
  }

  // Create a customer
  const customer = await prisma.customer.create({
    data: {
      name: 'John Doe',
      phone: `999${Math.floor(Math.random() * 10000000)}`,
      userId: user.id
    }
  });
  console.log('Created Customer');

  // Create an item
  const item = await prisma.item.create({
    data: {
      name: 'Gold Necklace 22K',
      sku: `SKU-${Math.floor(Math.random() * 10000)}`,
      purity: '22K',
      category: 'Necklace',
      metal: 'Gold',
      grossWeight: 15.5,
      netWeight: 15.0,
      price: 105000,
      userId: user.id
    }
  });
  console.log('Created Item');

  // Create a sale
  const sale = await prisma.sale.create({
    data: {
      billNumber: `BILL-${Math.floor(Math.random() * 10000)}`,
      totalSaleAmount: 105000,
      amountPaid: 105000,
      amountDue: 0,
      paymentStatus: 'PAID',
      userId: user.id,
      customerId: customer.id,
      saleItems: {
        create: [
          {
            itemId: item.id,
            soldPrice: 105000
          }
        ]
      }
    }
  });
  
  // Mark item as sold
  await prisma.item.update({
    where: { id: item.id },
    data: { isSold: true }
  });

  console.log('Created Sale');
  console.log('Seeding complete! Password is: password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
