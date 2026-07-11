import dotenv from 'dotenv';
import { connectDB } from './db.js';
import Ingredient from './models/Ingredient.js';
import MenuItem from './models/MenuItem.js';
import mongoose from 'mongoose';

dotenv.config();

async function seed() {
  await connectDB();

  const existingIngredients = await Ingredient.countDocuments();
  const existingMenuItems = await MenuItem.countDocuments();
  if (existingIngredients > 0 || existingMenuItems > 0) {
    console.log('Data already exists, skipping seed. Delete your collections first if you want to reseed.');
    process.exit(0);
  }

  const egg = await Ingredient.create({ name: 'Egg', unit: 'pcs', stock: 200 });
  const milk = await Ingredient.create({ name: 'Milk', unit: 'ml', stock: 20000 });
  const flour = await Ingredient.create({ name: 'Flour', unit: 'g', stock: 15000 });
  const cheese = await Ingredient.create({ name: 'Cheese', unit: 'g', stock: 8000 });
  const onion = await Ingredient.create({ name: 'Onion', unit: 'g', stock: 6000 });
  const oil = await Ingredient.create({ name: 'Cooking oil', unit: 'ml', stock: 10000 });
  const berbere = await Ingredient.create({ name: 'Berbere', unit: 'g', stock: 4000 });
  const tomato = await Ingredient.create({ name: 'Tomato', unit: 'g', stock: 8000 });
  const garlic = await Ingredient.create({ name: 'Garlic', unit: 'g', stock: 2000 });
  const shiroPowder = await Ingredient.create({ name: 'Shiro powder', unit: 'g', stock: 6000 });
  const chicken = await Ingredient.create({ name: 'Chicken', unit: 'g', stock: 15000 });
  const beef = await Ingredient.create({ name: 'Beef', unit: 'g', stock: 15000 });
  const niterKibbeh = await Ingredient.create({ name: 'Niter kibbeh (spiced butter)', unit: 'g', stock: 3000 });
  const pasta = await Ingredient.create({ name: 'Dry pasta', unit: 'g', stock: 10000 });
  const injera = await Ingredient.create({ name: 'Injera', unit: 'pcs', stock: 300 });

  await MenuItem.create({
    name: 'Pizza',
    price: 350,
    recipe: [
      { ingredient: egg._id, qty: 3.5 },
      { ingredient: milk._id, qty: 200 },
      { ingredient: flour._id, qty: 250 },
      { ingredient: cheese._id, qty: 150 }
    ]
  });

  await MenuItem.create({
    name: 'Burger',
    price: 180,
    recipe: [
      { ingredient: egg._id, qty: 1 },
      { ingredient: flour._id, qty: 80 },
      { ingredient: onion._id, qty: 20 }
    ]
  });

  await MenuItem.create({
    name: 'Enkulal Firfir',
    price: 90,
    recipe: [
      { ingredient: egg._id, qty: 2 },
      { ingredient: milk._id, qty: 30 },
      { ingredient: onion._id, qty: 20 },
      { ingredient: oil._id, qty: 10 },
      { ingredient: berbere._id, qty: 5 },
      { ingredient: injera._id, qty: 1 }
    ]
  });

  await MenuItem.create({
    name: 'Shiro Wat',
    price: 80,
    recipe: [
      { ingredient: shiroPowder._id, qty: 100 },
      { ingredient: oil._id, qty: 30 },
      { ingredient: onion._id, qty: 20 },
      { ingredient: garlic._id, qty: 5 },
      { ingredient: injera._id, qty: 1 }
    ]
  });

  await MenuItem.create({
    name: 'Doro Wat',
    price: 220,
    recipe: [
      { ingredient: chicken._id, qty: 200 },
      { ingredient: onion._id, qty: 40 },
      { ingredient: berbere._id, qty: 15 },
      { ingredient: niterKibbeh._id, qty: 20 },
      { ingredient: egg._id, qty: 1 },
      { ingredient: injera._id, qty: 1 }
    ]
  });

  await MenuItem.create({
    name: 'Tibs',
    price: 260,
    recipe: [
      { ingredient: beef._id, qty: 200 },
      { ingredient: onion._id, qty: 25 },
      { ingredient: oil._id, qty: 20 },
      { ingredient: tomato._id, qty: 20 },
      { ingredient: garlic._id, qty: 5 },
      { ingredient: injera._id, qty: 1 }
    ]
  });

  await MenuItem.create({
    name: 'Pasta',
    price: 150,
    recipe: [
      { ingredient: pasta._id, qty: 150 },
      { ingredient: tomato._id, qty: 60 },
      { ingredient: onion._id, qty: 20 },
      { ingredient: oil._id, qty: 15 },
      { ingredient: cheese._id, qty: 30 }
    ]
  });

  console.log('Seed data created: 7 menu items, 14 ingredients.');
  await mongoose.disconnect();
  process.exit(0);
}

seed();