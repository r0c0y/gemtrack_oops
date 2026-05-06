const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'test200@gmail.com';
  const plainPassword = 'test123*';
  console.log(`Seeding heavy dummy data for ${email}...`);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: 'Test 200 Admin',
        shopProfile: {
          create: {
            shopName: 'Premium Jewels (Test)',
            phone: '9998887776',
            address: '456 Diamond Street, Mumbai'
          }
        }
      }
    });
    console.log('✅ Created User & Shop Profile');
  } else {
    console.log('⚠️ User already exists, appending data to existing user...');
  }

  // Generate 5 Customers
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const c = await prisma.customer.create({
      data: {
        name: `Customer ${i} (Demo)`,
        phone: `98765${Math.floor(Math.random() * 90000) + 10000}`,
        email: `cust${i}_${Date.now()}@example.com`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][i%5],
        userId: user.id
      }
    });
    customers.push(c);
  }
  console.log('✅ Created 5 Customers');

  // Generate 15 Items (10 Sold, 5 Unsold)
  const items = [];
  const categories = ['Necklace', 'Ring', 'Bangle', 'Earrings', 'Chain'];
  const metals = ['Gold', 'Silver', 'Platinum'];
  const purities = ['22K', '18K', '24K'];

  for (let i = 1; i <= 15; i++) {
    const isSold = i <= 10;
    const grossWeight = (Math.random() * 20 + 5).toFixed(2);
    const price = Math.floor(Math.random() * 200000 + 10000);
    
    const item = await prisma.item.create({
      data: {
        name: `Beautiful ${metals[i%3]} ${categories[i%5]}`,
        sku: `SKU-${Date.now()}-${i}`,
        huid: `HUID${Math.floor(Math.random() * 900000)}`,
        purity: purities[i%3],
        category: categories[i%5],
        metal: metals[i%3],
        grossWeight: parseFloat(grossWeight),
        netWeight: parseFloat(grossWeight) - 0.5,
        makingPerGm: 500,
        wastagePct: 2.5,
        price: price,
        isSold: isSold,
        userId: user.id
      }
    });
    items.push(item);
  }
  console.log('✅ Created 15 Items (10 Sold, 5 Unsold)');

  // Generate 5 Sales (Linking the 10 sold items)
  for (let i = 0; i < 5; i++) {
    const customer = customers[i];
    // Each sale gets 2 items
    const item1 = items[i * 2];
    const item2 = items[i * 2 + 1];
    
    const totalAmount = item1.price + item2.price;
    const isPartial = i % 2 === 0; // Every alternate sale is partial
    const amountPaid = isPartial ? Math.floor(totalAmount / 2) : totalAmount;
    
    await prisma.sale.create({
      data: {
        billNumber: `INV-${Date.now()}-${i}`,
        totalSaleAmount: totalAmount,
        amountPaid: amountPaid,
        amountDue: totalAmount - amountPaid,
        paymentStatus: isPartial ? 'PARTIAL' : 'PAID',
        userId: user.id,
        customerId: customer.id,
        saleItems: {
          create: [
            { itemId: item1.id, soldPrice: item1.price },
            { itemId: item2.id, soldPrice: item2.price }
          ]
        },
        payments: {
          create: [
            { amountPaid: amountPaid, paymentMethod: ['Cash', 'Card', 'UPI'][i%3] }
          ]
        }
      }
    });
  }
  console.log('✅ Created 5 Sales with SaleItems and Payments');
  
  console.log(`\n🎉 DONE! You can now log in with:
Email: ${email}
Password: ${plainPassword}
`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
