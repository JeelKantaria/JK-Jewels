/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seed data
async function main() {
    console.log('🌱 Seeding database...\n');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jkjewels.com' },
        update: {},
        create: {
            email: 'admin@jkjewels.com',
            name: 'Admin',
            passwordHash: adminPassword,
            role: 'ADMIN',
            isVerified: true,
            authProvider: 'email',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create test customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            email: 'customer@example.com',
            name: 'Test Customer',
            phone: '+919876543210',
            passwordHash: customerPassword,
            role: 'CUSTOMER',
            isVerified: true,
            authProvider: 'email',
        },
    });
    console.log('✅ Test customer created:', customer.email);

    // Create cart for customer
    await prisma.cart.upsert({
        where: { userId: customer.id },
        update: {},
        create: { userId: customer.id },
    });

    // Create categories
    const categories = [
        { name: 'Rings', slug: 'rings', description: 'Elegant rings for every occasion', displayOrder: 1, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800' },
        { name: 'Necklaces', slug: 'necklaces', description: 'Stunning necklaces and pendants', displayOrder: 2, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800' },
        { name: 'Earrings', slug: 'earrings', description: 'Beautiful earrings for every style', displayOrder: 3, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800' },
        { name: 'Bracelets', slug: 'bracelets', description: 'Elegant bracelets and bangles', displayOrder: 4, image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800' },
        { name: 'Pendants', slug: 'pendants', description: 'Delicate pendants for every neckline', displayOrder: 5, image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
    }
    console.log('✅ Categories created:', categories.length);

    // Create Metal Types
    const metalTypes = [
        { name: 'Gold', displayOrder: 1 },
        { name: 'Silver', displayOrder: 2 },
        { name: 'Platinum', displayOrder: 3 },
        { name: 'White Gold', displayOrder: 4 },
        { name: 'Rose Gold', displayOrder: 5 },
    ];

    for (const mt of metalTypes) {
        await prisma.metalType.upsert({
            where: { name: mt.name },
            update: mt,
            create: mt,
        });
    }
    console.log('✅ Metal Types created:', metalTypes.length);

    // Create Purities
    const purities = [
        { name: '24K', metalType: 'Gold', displayOrder: 1 },
        { name: '22K', metalType: 'Gold', displayOrder: 2 },
        { name: '18K', metalType: 'Gold', displayOrder: 3 },
        { name: '14K', metalType: 'Gold', displayOrder: 4 },
        { name: '925 Sterling', metalType: 'Silver', displayOrder: 5 },
        { name: '950 Platinum', metalType: 'Platinum', displayOrder: 6 },
    ];

    for (const p of purities) {
        await prisma.purity.upsert({
            where: { name: p.name },
            update: p,
            create: p,
        });
    }
    console.log('✅ Purities created:', purities.length);

    // Create Occasions
    const occasions = [
        { name: 'Wedding', displayOrder: 1 },
        { name: 'Engagement', displayOrder: 2 },
        { name: 'Anniversary', displayOrder: 3 },
        { name: 'Festival', displayOrder: 4 },
        { name: 'Party', displayOrder: 5 },
        { name: 'Daily Wear', displayOrder: 6 },
        { name: 'Office', displayOrder: 7 },
        { name: 'Traditional', displayOrder: 8 },
        { name: 'Cocktail', displayOrder: 9 },
        { name: 'Special', displayOrder: 10 },
    ];

    for (const occ of occasions) {
        await prisma.occasion.upsert({
            where: { name: occ.name },
            update: occ,
            create: occ,
        });
    }
    console.log('✅ Occasions created:', occasions.length);

    // Get category IDs
    const ringsCategory = await prisma.category.findUnique({ where: { slug: 'rings' } });
    const necklacesCategory = await prisma.category.findUnique({ where: { slug: 'necklaces' } });
    const earringsCategory = await prisma.category.findUnique({ where: { slug: 'earrings' } });
    const braceletsCategory = await prisma.category.findUnique({ where: { slug: 'bracelets' } });

    // Create products with free Unsplash/Pexels images
    const products = [
        // Rings
        {
            sku: 'JK-RNG-001',
            name: 'Royal Diamond Solitaire Ring',
            slug: 'royal-diamond-solitaire-ring',
            description: 'A breathtaking solitaire ring featuring a brilliant-cut diamond set in 18K white gold. Perfect for engagements and special occasions.',
            story: 'Handcrafted by our master artisans, this ring embodies timeless elegance and exceptional craftsmanship passed down through generations.',
            basePrice: 85000,
            metalCost: 45000,
            makingCharge: 12000,
            metalType: 'Gold',
            purity: '18K',
            weight: 4.5,
            categoryId: ringsCategory!.id,
            occasion: ['Wedding', 'Engagement', 'Anniversary'],
            style: ['Classic', 'Elegant'],
            gemstones: ['Diamond'],
            isFeatured: true,
            isNewArrival: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800', type: 'gallery', displayOrder: 1 },
                { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: '6', stockQuantity: 5 },
                { size: '7', stockQuantity: 8 },
                { size: '8', stockQuantity: 6 },
                { size: '9', stockQuantity: 4 },
            ],
        },
        {
            sku: 'JK-RNG-002',
            name: 'Emerald Elegance Ring',
            slug: 'emerald-elegance-ring',
            description: 'A stunning emerald ring surrounded by a halo of diamonds, set in 22K yellow gold. A true statement piece.',
            story: 'Inspired by the lush greenery of Indian forests, this ring captures the essence of nature\'s beauty.',
            basePrice: 125000,
            metalCost: 65000,
            makingCharge: 18000,
            metalType: 'Gold',
            purity: '22K',
            weight: 6.2,
            categoryId: ringsCategory!.id,
            occasion: ['Festival', 'Party', 'Wedding'],
            style: ['Traditional', 'Luxurious'],
            gemstones: ['Emerald', 'Diamond'],
            isFeatured: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: '6', stockQuantity: 3 },
                { size: '7', stockQuantity: 5 },
                { size: '8', stockQuantity: 4 },
            ],
        },
        // Necklaces
        {
            sku: 'JK-NCK-001',
            name: 'Royal Temple Necklace',
            slug: 'royal-temple-necklace',
            description: 'An exquisite temple-style necklace crafted in 22K gold with intricate detailing and ruby accents.',
            story: 'Drawing inspiration from South Indian temple architecture, this necklace is a masterpiece of traditional craftsmanship.',
            basePrice: 285000,
            metalCost: 185000,
            makingCharge: 45000,
            metalType: 'Gold',
            purity: '22K',
            weight: 45.5,
            categoryId: necklacesCategory!.id,
            occasion: ['Wedding', 'Festival', 'Traditional'],
            style: ['Traditional', 'Bridal'],
            gemstones: ['Ruby'],
            isFeatured: true,
            isNewArrival: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800', type: 'gallery', displayOrder: 1 },
                { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: '16 inch', stockQuantity: 2 },
                { size: '18 inch', stockQuantity: 3 },
            ],
        },
        {
            sku: 'JK-NCK-002',
            name: 'Diamond Cascade Pendant',
            slug: 'diamond-cascade-pendant',
            description: 'A delicate pendant featuring cascading diamonds on a fine 18K white gold chain. Perfect for everyday elegance.',
            story: 'Designed for the modern woman, this pendant adds a touch of sparkle to any outfit.',
            basePrice: 45000,
            metalCost: 22000,
            makingCharge: 8000,
            metalType: 'White Gold',
            purity: '18K',
            weight: 3.8,
            categoryId: necklacesCategory!.id,
            occasion: ['Daily Wear', 'Office', 'Party'],
            style: ['Modern', 'Minimalist'],
            gemstones: ['Diamond'],
            isFeatured: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: '16 inch', stockQuantity: 10 },
                { size: '18 inch', stockQuantity: 8 },
            ],
        },
        // Earrings
        {
            sku: 'JK-EAR-001',
            name: 'Jhumka Heritage Earrings',
            slug: 'jhumka-heritage-earrings',
            description: 'Traditional jhumka earrings in 22K gold with kundan work and pearl drops. A timeless classic.',
            story: 'These jhumkas are inspired by Mughal-era designs, bringing centuries of heritage to your collection.',
            basePrice: 58000,
            metalCost: 35000,
            makingCharge: 12000,
            metalType: 'Gold',
            purity: '22K',
            weight: 12.5,
            categoryId: earringsCategory!.id,
            occasion: ['Wedding', 'Festival', 'Traditional'],
            style: ['Traditional', 'Ethnic'],
            gemstones: ['Pearl', 'Kundan'],
            isFeatured: true,
            isNewArrival: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800', type: 'gallery', displayOrder: 1 },
                { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [],
        },
        {
            sku: 'JK-EAR-002',
            name: 'Sapphire Drop Earrings',
            slug: 'sapphire-drop-earrings',
            description: 'Elegant drop earrings featuring blue sapphires surrounded by diamonds in 18K white gold.',
            story: 'The deep blue of Ceylon sapphires meets the brilliance of diamonds in this stunning pair.',
            basePrice: 95000,
            metalCost: 42000,
            makingCharge: 15000,
            metalType: 'White Gold',
            purity: '18K',
            weight: 8.2,
            categoryId: earringsCategory!.id,
            occasion: ['Party', 'Cocktail', 'Anniversary'],
            style: ['Modern', 'Elegant'],
            gemstones: ['Sapphire', 'Diamond'],
            isFeatured: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [],
        },
        // Bracelets
        {
            sku: 'JK-BRC-001',
            name: 'Diamond Tennis Bracelet',
            slug: 'diamond-tennis-bracelet',
            description: 'A classic tennis bracelet featuring a continuous line of brilliant-cut diamonds in 18K white gold.',
            story: 'Timeless and elegant, this bracelet has graced the wrists of royalty and celebrities alike.',
            basePrice: 175000,
            metalCost: 85000,
            makingCharge: 35000,
            metalType: 'White Gold',
            purity: '18K',
            weight: 14.5,
            categoryId: braceletsCategory!.id,
            occasion: ['Party', 'Anniversary', 'Special'],
            style: ['Classic', 'Luxurious'],
            gemstones: ['Diamond'],
            isFeatured: true,
            isNewArrival: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: 'S', stockQuantity: 3 },
                { size: 'M', stockQuantity: 5 },
                { size: 'L', stockQuantity: 4 },
            ],
        },
        {
            sku: 'JK-BRC-002',
            name: 'Traditional Gold Bangle Set',
            slug: 'traditional-gold-bangle-set',
            description: 'A set of 4 handcrafted 22K gold bangles with traditional meenakari work.',
            story: 'These bangles showcase the ancient art of meenakari, perfected over generations in Rajasthan.',
            basePrice: 145000,
            metalCost: 98000,
            makingCharge: 25000,
            metalType: 'Gold',
            purity: '22K',
            weight: 48.0,
            categoryId: braceletsCategory!.id,
            occasion: ['Wedding', 'Festival', 'Traditional'],
            style: ['Traditional', 'Ethnic'],
            gemstones: [],
            isFeatured: true,
            images: [
                { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800', type: 'gallery', displayOrder: 0 },
                { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400', type: 'thumbnail', displayOrder: 0 },
            ],
            variants: [
                { size: '2.4', stockQuantity: 4 },
                { size: '2.6', stockQuantity: 6 },
                { size: '2.8', stockQuantity: 5 },
            ],
        },
    ];

    for (const productData of products) {
        const { images, variants, ...product } = productData;

        const createdProduct = await prisma.product.upsert({
            where: { sku: product.sku },
            update: product,
            create: product,
        });

        // Create images
        for (const image of images) {
            await prisma.productImage.upsert({
                where: {
                    id: `${createdProduct.id}-${image.type}-${image.displayOrder}`
                },
                update: { ...image, productId: createdProduct.id },
                create: {
                    id: `${createdProduct.id}-${image.type}-${image.displayOrder}`,
                    ...image,
                    productId: createdProduct.id
                },
            });
        }

        // Create variants
        for (const variant of variants) {
            await prisma.productVariant.upsert({
                where: {
                    productId_size: {
                        productId: createdProduct.id,
                        size: variant.size,
                    },
                },
                update: variant,
                create: { ...variant, productId: createdProduct.id },
            });
        }
    }
    console.log('✅ Products created:', products.length);

    // Create sample promo code
    await prisma.promoCode.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: {
            code: 'WELCOME10',
            description: '10% off for new customers',
            discountType: 'percentage',
            discountValue: 10,
            maxDiscount: 5000,
            minOrderAmount: 10000,
            usageLimit: 100,
            perUserLimit: 1,
            isFirstOrderOnly: true,
            allowWithOther: false,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
    });
    console.log('✅ Promo code created: WELCOME10');

    // Flat discount code
    await prisma.promoCode.upsert({
        where: { code: 'FLAT500' },
        update: {},
        create: {
            code: 'FLAT500',
            description: '₹500 off on orders above ₹5,000',
            discountType: 'fixed',
            discountValue: 500,
            minOrderAmount: 5000,
            usageLimit: 500,
            perUserLimit: 3,
            isFirstOrderOnly: false,
            allowWithOther: false,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        },
    });
    console.log('✅ Promo code created: FLAT500');

    // Premium discount for high-value orders
    await prisma.promoCode.upsert({
        where: { code: 'LUXURY15' },
        update: {},
        create: {
            code: 'LUXURY15',
            description: '15% off on orders above ₹1,00,000',
            discountType: 'percentage',
            discountValue: 15,
            maxDiscount: 25000,
            minOrderAmount: 100000,
            usageLimit: 50,
            perUserLimit: 2,
            isFirstOrderOnly: false,
            allowWithOther: false,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
    });
    console.log('✅ Promo code created: LUXURY15');

    // Festival offer
    await prisma.promoCode.upsert({
        where: { code: 'FESTIVE20' },
        update: {},
        create: {
            code: 'FESTIVE20',
            description: '20% off on all orders - Festival Special',
            discountType: 'percentage',
            discountValue: 20,
            maxDiscount: 10000,
            minOrderAmount: 15000,
            usageLimit: 200,
            perUserLimit: 1,
            isFirstOrderOnly: false,
            allowWithOther: false,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });
    console.log('✅ Promo code created: FESTIVE20');

    // Small discount, easy to use
    await prisma.promoCode.upsert({
        where: { code: 'SAVE200' },
        update: {},
        create: {
            code: 'SAVE200',
            description: '₹200 off on any order',
            discountType: 'fixed',
            discountValue: 200,
            minOrderAmount: 2000,
            usageLimit: 1000,
            perUserLimit: 5,
            isFirstOrderOnly: false,
            allowWithOther: true, // Can combine with other offers
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        },
    });
    console.log('✅ Promo code created: SAVE200');

    // Create Homepage Settings
    await prisma.homepageSettings.upsert({
        where: { id: 'default-homepage-settings' },
        update: { globalScrollSpeed: 30 },
        create: {
            id: 'default-homepage-settings',
            globalScrollSpeed: 30,
        },
    });
    console.log('✅ Homepage settings created');

    // Create Homepage Rows for each category
    const homepageRows = [
        { categorySlug: 'rings', displayOrder: 0, productDisplay: 'all', scrollDirection: 'auto' },
        { categorySlug: 'necklaces', displayOrder: 1, productDisplay: 'all', scrollDirection: 'auto' },
        { categorySlug: 'earrings', displayOrder: 2, productDisplay: 'all', scrollDirection: 'auto' },
        { categorySlug: 'bracelets', displayOrder: 3, productDisplay: 'all', scrollDirection: 'auto' },
    ];

    for (const row of homepageRows) {
        const category = await prisma.category.findUnique({ where: { slug: row.categorySlug } });
        if (category) {
            await prisma.homepageRow.upsert({
                where: { categoryId: category.id },
                update: {
                    displayOrder: row.displayOrder,
                    productDisplay: row.productDisplay,
                    scrollDirection: row.scrollDirection,
                    isActive: true,
                },
                create: {
                    categoryId: category.id,
                    displayOrder: row.displayOrder,
                    productDisplay: row.productDisplay,
                    scrollDirection: row.scrollDirection,
                    isActive: true,
                },
            });
        }
    }
    console.log('✅ Homepage rows created:', homepageRows.length);

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📋 Test accounts:');
    console.log('   Admin: admin@jkjewels.com / admin123');
    console.log('   Customer: customer@example.com / customer123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
