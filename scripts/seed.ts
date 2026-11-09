import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { getDb, getMongoClient, getDatabaseName, isDbConfigured } = await import(
    "../lib/db/client"
  );

  if (!isDbConfigured()) {
    console.error(
      "\nMongoDB is not configured.\nAdd MONGODB_URI to .env.local (copy .env.example) and run again.\n",
    );
    process.exitCode = 1;
    return;
  }

  const db = await getDb();
  const client = getMongoClient();
  console.log(`Connected to MongoDB database: ${getDatabaseName()}`);

  console.log("Creating indexes…");
  await Promise.all([
    db.collection("products").createIndex({ slug: 1 }, { unique: true }),
    db.collection("products").createIndex({ status: 1, createdAt: -1 }),
    db.collection("products").createIndex({ category: 1, status: 1 }),
    db.collection("products").createIndex({ featured: 1, status: 1 }),
    db.collection("products").createIndex(
      { name: "text", description: "text", tags: "text" },
      { name: "product_search" },
    ),
    db.collection("categories").createIndex({ slug: 1 }, { unique: true }),
    db.collection("coupons").createIndex({ code: 1 }, { unique: true }),
    db.collection("coupons").createIndex({ active: 1 }),
    db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true }),
    db.collection("orders").createIndex({ publicToken: 1 }, { unique: true }),
    db.collection("orders").createIndex({ "customer.phone": 1, createdAt: -1 }),
    db.collection("orders").createIndex({ status: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ couponCode: 1, "customer.phone": 1 }),
    db.collection("user").createIndex({ email: 1 }, { unique: true }),
    db.collection("session").createIndex({ token: 1 }, { unique: true }),
    db.collection("session").createIndex({ userId: 1 }),
    db.collection("account").createIndex({ providerId: 1, accountId: 1 }),
    db.collection("verification").createIndex({ identifier: 1 }),
    db.collection("subscribers").createIndex({ email: 1 }, { unique: true }),
  ]);
  console.log("Indexes ready.");

  const { fallbackCategories } = await import("../lib/db/categories");
  for (const category of fallbackCategories) {
    const existing = await db
      .collection("categories")
      .findOne({ slug: category.slug });
    await db.collection("categories").updateOne(
      { slug: category.slug },
      {
        $set: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: existing?.image || category.image,
          sortOrder: category.sortOrder,
          active: existing?.active ?? true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }
  console.log(`Categories ready (${fallbackCategories.length}).`);

  console.log("Creating default store settings…");
  await db.collection("settings").updateOne(
    { _id: "store" as never },
    {
      $setOnInsert: {
        insideDhakaFee: 70,
        outsideDhakaFee: 150,
        freeShippingThreshold: 3000,
        bkashNumber: "01308880030",
        nagadNumber: "01308880030",
        contactPhone: "01308880030",
        contactEmail: "farhantareqofficial@gmail.com",
        address: "House 35, Road 05, Sector 12, Uttara, Dhaka-1230",
        facebookUrl: "",
        instagramUrl: "",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@sporsify.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME || "Sporsify Admin";

  if (!adminPassword) {
    console.warn(
      "\nADMIN_PASSWORD is not set. Skipping admin creation. Add it to .env.local and run npm run seed again.\n",
    );
  } else {
    const existing = await db.collection("user").findOne({ email: adminEmail });
    if (existing) {
      await db.collection("user").updateOne(
        { _id: existing._id },
        { $set: { role: "admin", name: adminName, updatedAt: new Date() } },
      );
      console.log(`Admin account already exists — role ensured for ${adminEmail}.`);
    } else {
      console.log("Creating admin account…");
      const { betterAuth } = await import("better-auth");
      const { mongodbAdapter } = await import("@better-auth/mongo-adapter");
      const seedAuth = betterAuth({
        database: mongodbAdapter(client.db(getDatabaseName()), { client }),
        secret:
          process.env.BETTER_AUTH_SECRET ||
          "sporsify-development-secret-change-me-in-production",
        emailAndPassword: { enabled: true, minPasswordLength: 8 },
        user: {
          additionalFields: {
            phone: { type: "string", required: false, defaultValue: "" },
          },
        },
      });
      try {
        await seedAuth.api.signUpEmail({
          body: { email: adminEmail, password: adminPassword, name: adminName },
        });
        await db.collection("user").updateOne(
          { email: adminEmail },
          { $set: { role: "admin", emailVerified: true, updatedAt: new Date() } },
        );
        console.log(`Admin account created: ${adminEmail}`);
      } catch (error) {
        console.error("Could not create admin account:", error);
        console.error(
          "Tip: if the account exists, sign up once in the UI, then run this seed again to grant admin.",
        );
      }
    }
  }

  const productCount = await db.collection("products").countDocuments({});
  const seedDemo = process.argv.includes("--all") || productCount === 0;

  if (seedDemo) {
    console.log("Seeding demo products…");
    const now = new Date();
    const demo = [
      {
        name: "Velocity Pro Cricket Bat",
        slug: "velocity-pro-cricket-bat",
        category: "cricket",
        brand: "Sporsify",
        price: 4500,
        discountPercent: 15,
        description:
          "A balanced English willow bat built for clean timing and confident strokes. Pick the size that matches your height and get match-ready. Comes with a protective toe guard and a free bat cover.",
        sizes: [
          { size: "Size 6", stock: 8 },
          { size: "Harrow", stock: 5 },
          { size: "SH", stock: 3 },
        ],
        tags: ["cricket", "bat", "match-ready"],
        featured: true,
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Cricket bat and ball on a field",
      },
      {
        name: "Striker Match Football",
        slug: "striker-match-football",
        category: "football",
        brand: "Sporsify",
        price: 2200,
        discountPercent: 10,
        description:
          "A durable thermally bonded match ball with true flight and a soft touch. Suitable for turf and artificial surfaces, with a reliable shape that holds through every session.",
        sizes: [
          { size: "Size 4", stock: 12 },
          { size: "Size 5", stock: 15 },
        ],
        tags: ["football", "match ball", "football gear"],
        featured: true,
        image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Football on a green pitch",
      },
      {
        name: "Apex Run Shoes",
        slug: "apex-run-shoes",
        category: "running",
        brand: "Sporsify",
        price: 3800,
        discountPercent: 20,
        description:
          "Lightweight daily trainers with a responsive foam midsole and breathable knit upper. Built for road runs, gym days and everything between.",
        sizes: [
          { size: "40", stock: 4 },
          { size: "41", stock: 7 },
          { size: "42", stock: 9 },
          { size: "43", stock: 6 },
          { size: "44", stock: 2 },
        ],
        tags: ["running", "shoes", "road"],
        featured: true,
        image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Running shoes on a track",
      },
      {
        name: "Iron Grip Gym Gloves",
        slug: "iron-grip-gym-gloves",
        category: "fitness",
        brand: "Sporsify",
        price: 1200,
        discountPercent: 0,
        description:
          "Padded palm gloves with a secure wrist wrap for lifting, pulling and pressing. Keep your grip strong through every set.",
        sizes: [
          { size: "S", stock: 10 },
          { size: "M", stock: 14 },
          { size: "L", stock: 8 },
          { size: "XL", stock: 3 },
        ],
        tags: ["gym", "gloves", "lifting"],
        featured: false,
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Gym training equipment",
      },
      {
        name: "Smash Carbon Badminton Racket",
        slug: "smash-carbon-badminton-racket",
        category: "badminton",
        brand: "Sporsify",
        price: 3200,
        discountPercent: 12,
        description:
          "A lightweight carbon racket with a fast swing and stable head. Strung and ready for court sessions and club matches.",
        sizes: [{ size: "One Size", stock: 9 }],
        tags: ["badminton", "racket", "carbon"],
        featured: true,
        image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Badminton racket and shuttlecock",
      },
      {
        name: "Court King Basketball",
        slug: "court-king-basketball",
        category: "basketball",
        brand: "Sporsify",
        price: 2800,
        discountPercent: 18,
        description:
          "Deep-channel composite basketball with a tacky grip for indoor and outdoor courts. Holds pressure and feels broken-in from day one.",
        sizes: [
          { size: "Size 6", stock: 6 },
          { size: "Size 7", stock: 11 },
        ],
        tags: ["basketball", "outdoor", "match ball"],
        featured: false,
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Basketball on a court",
      },
      {
        name: "Pro Keeper Football Gloves",
        slug: "pro-keeper-football-gloves",
        category: "football",
        brand: "Sporsify",
        price: 1650,
        discountPercent: 0,
        description:
          "Latex palm goalkeeper gloves with finger support and a snug wrist closure. Confidence for every cross and every shot.",
        sizes: [
          { size: "M", stock: 7 },
          { size: "L", stock: 5 },
          { size: "XL", stock: 2 },
        ],
        tags: ["football", "goalkeeper", "gloves"],
        featured: false,
        image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Football training session",
      },
      {
        name: "FlexTrain Resistance Bands Set",
        slug: "flextrain-resistance-bands-set",
        category: "fitness",
        brand: "Sporsify",
        price: 900,
        discountPercent: 25,
        description:
          "Five loop bands from light to extra heavy, with a carry pouch and exercise guide. A full home workout in one small bag.",
        sizes: [{ size: "One Size", stock: 20 }],
        tags: ["fitness", "home workout", "bands"],
        featured: false,
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Home fitness workout equipment",
      },
      {
        name: "Apex Cricket Helmet",
        slug: "apex-cricket-helmet",
        category: "cricket",
        brand: "Sporsify",
        price: 3200,
        discountPercent: 10,
        description:
          "A lightweight cricket helmet with a reinforced grille, comfortable padding and a secure rear adjuster. Protection built for long innings.",
        sizes: [
          { size: "S", stock: 6 },
          { size: "M", stock: 8 },
          { size: "L", stock: 4 },
        ],
        tags: ["cricket", "helmet", "protection"],
        featured: false,
        image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Cricket protective gear",
      },
      {
        name: "PaceLite Running Shorts",
        slug: "pacelite-running-shorts",
        category: "running",
        brand: "Sporsify",
        price: 1450,
        discountPercent: 10,
        description:
          "Breathable running shorts with a lightweight liner, zip pocket and reflective details. Designed to move without distraction.",
        sizes: [
          { size: "S", stock: 8 },
          { size: "M", stock: 12 },
          { size: "L", stock: 10 },
          { size: "XL", stock: 5 },
        ],
        tags: ["running", "shorts", "apparel"],
        featured: false,
        image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Runner training outdoors",
      },
      {
        name: "PowerCore Adjustable Dumbbell",
        slug: "powercore-adjustable-dumbbell",
        category: "fitness",
        brand: "Sporsify",
        price: 5200,
        discountPercent: 18,
        description:
          "A compact adjustable dumbbell that replaces a full rack. Change weights quickly for presses, rows, squats and accessory work.",
        sizes: [{ size: "20 kg", stock: 7 }],
        tags: ["fitness", "dumbbell", "strength"],
        featured: true,
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Dumbbells in a gym",
      },
      {
        name: "TrailBlaze Running Jacket",
        slug: "trailblaze-running-jacket",
        category: "running",
        brand: "Sporsify",
        price: 2900,
        discountPercent: 15,
        description:
          "A wind-resistant running jacket with a breathable back panel and reflective trim. Ready for early starts and changing weather.",
        sizes: [
          { size: "S", stock: 5 },
          { size: "M", stock: 8 },
          { size: "L", stock: 6 },
          { size: "XL", stock: 3 },
        ],
        tags: ["running", "jacket", "apparel"],
        featured: false,
        image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Runner in a training jacket",
      },
      {
        name: "Precision Football Boots",
        slug: "precision-football-boots",
        category: "football",
        brand: "Sporsify",
        price: 3900,
        discountPercent: 20,
        description:
          "Lightweight football boots with a textured upper for close control and a firm-ground soleplate for traction. Built for fast feet and firm surfaces.",
        sizes: [
          { size: "40", stock: 4 },
          { size: "41", stock: 6 },
          { size: "42", stock: 8 },
          { size: "43", stock: 5 },
          { size: "44", stock: 3 },
        ],
        tags: ["football", "boots", "firm ground"],
        featured: true,
        image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Football boots on grass",
      },
      {
        name: "Agility Training Cones — Set of 20",
        slug: "agility-training-cones-set",
        category: "football",
        brand: "Sporsify",
        price: 650,
        discountPercent: 0,
        description:
          "Bright, flexible training cones for agility drills, football sessions and school sports. Comes with a carry stand.",
        sizes: [{ size: "One Size", stock: 30 }],
        tags: ["training", "agility", "football"],
        featured: false,
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Football training drills",
      },
      {
        name: "ProMat Yoga & Training Mat",
        slug: "promat-yoga-training-mat",
        category: "fitness",
        brand: "Sporsify",
        price: 1800,
        discountPercent: 12,
        description:
          "A cushioned non-slip training mat for yoga, mobility and floor workouts. Lightweight, easy to roll and built for daily practice.",
        sizes: [{ size: "One Size", stock: 16 }],
        tags: ["fitness", "yoga", "mat"],
        featured: false,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Fitness training mat",
      },
      {
        name: "StrikeForce Cricket Pads",
        slug: "strikeforce-cricket-pads",
        category: "cricket",
        brand: "Sporsify",
        price: 2400,
        discountPercent: 12,
        description:
          "Lightweight batting pads with high-density foam and a secure strapping system. Comfortable protection for nets and match days.",
        sizes: [
          { size: "Youth", stock: 6 },
          { size: "Adult", stock: 9 },
        ],
        tags: ["cricket", "pads", "protection"],
        featured: false,
        image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Cricket batting equipment",
      },
      {
        name: "FeatherLite Shuttlecock Pack",
        slug: "featherlite-shuttlecock-pack",
        category: "badminton",
        brand: "Sporsify",
        price: 750,
        discountPercent: 5,
        description:
          "A pack of durable feather shuttlecocks with a consistent flight and stable cork base. Suitable for practice and club play.",
        sizes: [{ size: "Pack of 6", stock: 24 }],
        tags: ["badminton", "shuttlecock", "practice"],
        featured: false,
        image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Badminton shuttlecock on a racket",
      },
      {
        name: "HoopStar Basketball Shoes",
        slug: "hoopstar-basketball-shoes",
        category: "basketball",
        brand: "Sporsify",
        price: 4200,
        discountPercent: 15,
        description:
          "Supportive basketball shoes with a grippy outsole, cushioned midsole and padded ankle collar. Built for quick cuts and hard landings.",
        sizes: [
          { size: "40", stock: 3 },
          { size: "41", stock: 5 },
          { size: "42", stock: 7 },
          { size: "43", stock: 4 },
          { size: "44", stock: 2 },
        ],
        tags: ["basketball", "shoes", "court"],
        featured: true,
        image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Basketball shoes and gym training",
      },
      {
        name: "Rebound Training Basketball",
        slug: "rebound-training-basketball",
        category: "basketball",
        brand: "Sporsify",
        price: 1900,
        discountPercent: 10,
        description:
          "A durable training basketball with a consistent bounce and comfortable grip. Ideal for daily practice, drills and outdoor courts.",
        sizes: [{ size: "Size 7", stock: 14 }],
        tags: ["basketball", "training", "outdoor"],
        featured: false,
        image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Basketball player training on court",
      },
      {
        name: "Matchday Leather Cricket Ball",
        slug: "matchday-leather-cricket-ball",
        category: "cricket",
        brand: "Sporsify",
        price: 850,
        discountPercent: 5,
        description:
          "A hand-stitched leather cricket ball with a pronounced seam. Consistent shape and bounce for practice and club matches.",
        sizes: [{ size: "One Size", stock: 25 }],
        tags: ["cricket", "ball", "leather"],
        featured: false,
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Leather cricket ball",
      },
    ];

    for (const item of demo) {
      await db.collection("products").updateOne(
        { slug: item.slug },
        {
          $set: {
            name: item.name,
            slug: item.slug,
            category: item.category,
            description: item.description,
            brand: item.brand,
            price: item.price,
            discountPercent: item.discountPercent,
            images: [
              {
                key: "",
                url: item.image,
                alt: item.imageAlt,
              },
            ],
            sizes: item.sizes,
            tags: item.tags,
            featured: item.featured,
            status: "active",
            seoTitle: `${item.name} — ${item.brand}`,
            seoDescription: item.description.replace(/\s+/g, " ").slice(0, 155),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
    console.log(`Demo products seeded (${demo.length}).`);
  } else {
    console.log(`Products already exist (${productCount}); skipping demo products.`);
  }

  console.log("Creating sample coupon…");
  const now = new Date();
  await db.collection("coupons").deleteMany({ code: { $in: ["PLAY10", "SPORT200"] } });
  await db.collection("coupons").updateOne(
    { code: "FARHAN10" },
    {
      $setOnInsert: {
        code: "FARHAN10",
        type: "percent",
        value: 10,
        minSubtotal: 0,
        maxDiscount: 0,
        startsAt: null,
        expiresAt: null,
        usageLimit: null,
        usedCount: 0,
        perPhoneLimit: null,
        active: true,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log("\nSetup complete.");
  if (adminPassword) {
    console.log(`Admin login: ${adminEmail} (password from ADMIN_PASSWORD)`);
    console.log("Admin URL: /admin/login");
  }
  console.log("Start the store with: npm run dev\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { getMongoClient } = await import("../lib/db/client");
      await getMongoClient().close();
    } catch {
      // ignore shutdown errors
    }
  });
