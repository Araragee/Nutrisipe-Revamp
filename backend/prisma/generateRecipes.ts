import * as fs from 'fs';

const baseRecipes = [
  {
    title: "Pork Adobo",
    description: "A classic Filipino dish combining soy sauce, vinegar, garlic, and pork belly.",
    tags: ["filipino", "pork", "classic", "dinner"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "500g" },
      { name: "Soy sauce", quantity: "1/4 cup" },
      { name: "Vinegar, white", quantity: "1/4 cup" },
      { name: "Garlic, raw", quantity: "6 cloves, crushed" },
      { name: "Black pepper, ground", quantity: "1 tsp" },
      { name: "Bay leaf, dried", quantity: "3 leaves" },
      { name: "Vegetable oil, palm", quantity: "1 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Marinate pork belly in soy sauce, vinegar, and garlic for at least 30 mins." },
      { step: 2, text: "Heat oil in a pan, pan-fry pork pieces until brown." },
      { step: 3, text: "Pour in marinade, add bay leaves and black pepper." },
      { step: 4, text: "Simmer until meat is tender and sauce reduces." },
      { step: 5, text: "Serve with rice." }
    ]
  },
  {
    title: "Chicken Tinola",
    description: "Comforting chicken ginger broth with green papaya and chili leaves.",
    tags: ["soup", "chicken", "comfort-food", "healthy"],
    ingredients: [
      { name: "Chicken drumstick, raw", quantity: "500g" },
      { name: "Ginger, raw", quantity: "2 thumbs, sliced" },
      { name: "Garlic, raw", quantity: "3 cloves, minced" },
      { name: "Onion, red, raw", quantity: "1 medium, chopped" },
      { name: "Papaya, green, raw", quantity: "1 small, wedged" },
      { name: "Chili leaves, raw", quantity: "1 cup" },
      { name: "Fish sauce", quantity: "2 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic, onion, and ginger until fragrant." },
      { step: 2, text: "Add chicken and cook until lightly browned." },
      { step: 3, text: "Add fish sauce and water, let it boil and simmer." },
      { step: 4, text: "Add green papaya and cook until tender." },
      { step: 5, text: "Add chili leaves right before turning off the heat." }
    ]
  },
  {
    title: "Pancit Canton",
    description: "Stir-fried noodles with mixed vegetables and meats.",
    tags: ["noodles", "pancit", "celebration", "lunch"],
    ingredients: [
      { name: "Pancit Canton noodles", quantity: "250g" },
      { name: "Pork, lean, raw", quantity: "150g, sliced" },
      { name: "Shrimp, raw", quantity: "100g, peeled" },
      { name: "Cabbage, raw", quantity: "1 cup, shredded" },
      { name: "Carrot, raw", quantity: "1 medium, julienned" },
      { name: "Soy sauce", quantity: "3 tbsp" },
      { name: "Oyster sauce", quantity: "2 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic and onion, then add pork and shrimp." },
      { step: 2, text: "Add carrots and cabbage, cook slightly." },
      { step: 3, text: "Pour in water, soy sauce, and oyster sauce. Bring to boil." },
      { step: 4, text: "Add pancit canton noodles and toss until liquid is absorbed." }
    ]
  },
  {
    title: "Beef Caldereta",
    description: "Hearty beef stew in rich tomato sauce with liver spread.",
    tags: ["beef", "stew", "tomato", "fiesta"],
    ingredients: [
      { name: "Beef, lean, raw", quantity: "500g, cubed" },
      { name: "Tomato sauce, canned", quantity: "1 cup" },
      { name: "Potato, raw", quantity: "2 medium, cubed" },
      { name: "Carrot, raw", quantity: "1 medium, cubed" },
      { name: "Bell pepper, red, raw", quantity: "1 medium, sliced" },
      { name: "Pork liver, raw", quantity: "50g, mashed (for spread)" },
      { name: "Cheese, cheddar", quantity: "1/4 cup, grated" }
    ],
    instructions: [
      { step: 1, text: "Sear beef cubes until browned. Set aside." },
      { step: 2, text: "Saute garlic and onion. Return beef." },
      { step: 3, text: "Add tomato sauce and water. Simmer until beef is tender." },
      { step: 4, text: "Add potatoes and carrots, cook until soft." },
      { step: 5, text: "Stir in mashed liver, bell peppers, and cheese." }
    ]
  },
  {
    title: "Sinigang na Baboy",
    description: "Tamarind-based sour soup with pork and vegetables.",
    tags: ["soup", "sour", "pork", "comfort"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "500g, cubed" },
      { name: "Tamarind, raw", quantity: "1/2 cup (extract)" },
      { name: "Kangkong, raw", quantity: "1 bunch" },
      { name: "Tomato, raw", quantity: "2 medium, quartered" },
      { name: "White radish, raw", quantity: "1 cup, sliced" },
      { name: "Siling labuyo, raw", quantity: "2 pieces" }
    ],
    instructions: [
      { step: 1, text: "Boil pork belly and tomatoes in water until pork is tender." },
      { step: 2, text: "Add tamarind extract and simmer for 5 minutes." },
      { step: 3, text: "Add radish and siling labuyo." },
      { step: 4, text: "Add kangkong right before serving." }
    ]
  },
  {
    title: "Ginisang Mongo",
    description: "Savory mung bean stew with pork and bitter melon leaves.",
    tags: ["beans", "stew", "healthy", "filipino"],
    ingredients: [
      { name: "Mungbean, dry", quantity: "1 cup" },
      { name: "Pork belly, raw", quantity: "150g, sliced thin" },
      { name: "Garlic, raw", quantity: "3 cloves, crushed" },
      { name: "Tomato, raw", quantity: "2 medium, chopped" },
      { name: "Bitter melon leaves, raw", quantity: "1 cup" },
      { name: "Pork cracklings", quantity: "1/4 cup (optional)" }
    ],
    instructions: [
      { step: 1, text: "Boil mung beans in water until very tender and mushy." },
      { step: 2, text: "Saute garlic, onion, and tomatoes." },
      { step: 3, text: "Add pork and cook until browned." },
      { step: 4, text: "Pour in boiled mung beans and simmer." },
      { step: 5, text: "Turn off heat and stir in bitter melon leaves." }
    ]
  },
  {
    title: "Chicken Inasal",
    description: "Grilled chicken marinated in lemongrass, vinegar, and annatto.",
    tags: ["grilled", "chicken", "bacolod", "bbq"],
    ingredients: [
      { name: "Chicken thigh, bone-in, raw", quantity: "4 pieces" },
      { name: "Lemongrass, raw", quantity: "2 stalks, pounded" },
      { name: "Vinegar, white", quantity: "1/3 cup" },
      { name: "Ginger, raw", quantity: "1 thumb, grated" },
      { name: "Garlic, raw", quantity: "4 cloves, minced" },
      { name: "Annatto seeds", quantity: "1 tbsp, infused in oil" }
    ],
    instructions: [
      { step: 1, text: "Mix lemongrass, vinegar, ginger, garlic, and salt for marinade." },
      { step: 2, text: "Marinate chicken for at least 4 hours." },
      { step: 3, text: "Prepare annatto oil by heating annatto seeds in oil." },
      { step: 4, text: "Grill chicken, basting frequently with annatto oil." }
    ]
  },
  {
    title: "Tortang Talong",
    description: "Eggplant omelet, charred and pan-fried.",
    tags: ["breakfast", "eggplant", "omelet", "vegetarian-option"],
    ingredients: [
      { name: "Eggplant, raw", quantity: "2 medium" },
      { name: "Egg, chicken, whole, raw", quantity: "2 large" },
      { name: "Salt, iodized", quantity: "1/2 tsp" },
      { name: "Vegetable oil, palm", quantity: "2 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Grill or broil eggplants until skin is blackened and charred." },
      { step: 2, text: "Peel the skin off the eggplants, leaving the stem intact." },
      { step: 3, text: "Flatten the eggplant with a fork." },
      { step: 4, text: "Beat eggs with salt, and dip the flattened eggplant into the eggs." },
      { step: 5, text: "Pan-fry until golden brown on both sides." }
    ]
  },
  {
    title: "Pork Sisig",
    description: "Sizzling chopped pork with onions, chili, and calamansi.",
    tags: ["pork", "sizzling", "pulutan", "spicy"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "500g" },
      { name: "Onion, red, raw", quantity: "1 large, minced" },
      { name: "Siling labuyo, raw", quantity: "3 pieces, chopped" },
      { name: "Calamansi, raw", quantity: "3 tbsp juice" },
      { name: "Mayonnaise", quantity: "2 tbsp" },
      { name: "Soy sauce", quantity: "1 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Boil pork belly until tender. Let it cool and chop into small pieces." },
      { step: 2, text: "Pan-fry or grill the chopped pork until crispy." },
      { step: 3, text: "Mix crispy pork with chopped onions, siling labuyo, and calamansi." },
      { step: 4, text: "Stir in mayonnaise and soy sauce." },
      { step: 5, text: "Serve on a hot sizzling plate." }
    ]
  },
  {
    title: "Pinakbet",
    description: "Mixed vegetables sauteed in shrimp paste.",
    tags: ["vegetables", "healthy", "shrimp-paste", "stew"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "150g, sliced" },
      { name: "Squash, raw", quantity: "1 cup, cubed" },
      { name: "Eggplant, raw", quantity: "1 medium, sliced" },
      { name: "Bitter melon, raw", quantity: "1 small, sliced" },
      { name: "Yardlong bean, raw", quantity: "1 cup, cut" },
      { name: "Shrimp paste", quantity: "2 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic, onion, and pork until pork is browned." },
      { step: 2, text: "Add shrimp paste and tomatoes, cook until tomatoes soften." },
      { step: 3, text: "Add squash and water, cook until slightly tender." },
      { step: 4, text: "Add the rest of the vegetables and simmer until all are cooked." }
    ]
  },
  {
    title: "Chicken Curry",
    description: "Filipino-style chicken curry with coconut milk and potatoes.",
    tags: ["chicken", "curry", "coconut", "spicy"],
    ingredients: [
      { name: "Chicken breast, skinless, raw", quantity: "500g, cubed" },
      { name: "Coconut milk, thick", quantity: "1 cup" },
      { name: "Potato, raw", quantity: "2 medium, cubed" },
      { name: "Carrot, raw", quantity: "1 medium, cubed" },
      { name: "Curry powder", quantity: "2 tbsp" },
      { name: "Bell pepper, green, raw", quantity: "1 medium, sliced" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic and onion. Add chicken and cook until browned." },
      { step: 2, text: "Stir in curry powder and mix well." },
      { step: 3, text: "Pour in water and simmer until chicken is tender." },
      { step: 4, text: "Add potatoes and carrots, cook until soft." },
      { step: 5, text: "Pour in coconut milk and bell peppers. Simmer until sauce thickens." }
    ]
  },
  {
    title: "Lumpiang Shanghai",
    description: "Crispy fried spring rolls filled with ground pork.",
    tags: ["appetizer", "pork", "fried", "party"],
    ingredients: [
      { name: "Ground pork, raw", quantity: "500g" },
      { name: "Carrot, raw", quantity: "1 medium, minced" },
      { name: "Onion, red, raw", quantity: "1 medium, minced" },
      { name: "Garlic, raw", quantity: "4 cloves, minced" },
      { name: "Lumpia wrapper, fresh", quantity: "20 pieces" },
      { name: "Vegetable oil, palm", quantity: "2 cups for frying" }
    ],
    instructions: [
      { step: 1, text: "Mix ground pork, carrots, onion, garlic, salt, and pepper in a bowl." },
      { step: 2, text: "Place a small amount of filling on a wrapper and roll tightly." },
      { step: 3, text: "Seal the edge with water." },
      { step: 4, text: "Deep fry in hot oil until golden brown and crispy." }
    ]
  },
  {
    title: "Beef Tapa",
    description: "Cured, pan-fried beef slices, perfect for breakfast.",
    tags: ["breakfast", "beef", "cured", "silog"],
    ingredients: [
      { name: "Beef, lean, raw", quantity: "500g, sliced thin" },
      { name: "Soy sauce", quantity: "3 tbsp" },
      { name: "Vinegar, white", quantity: "2 tbsp" },
      { name: "Garlic, raw", quantity: "1 head, minced" },
      { name: "White sugar", quantity: "1 tbsp" },
      { name: "Black pepper, ground", quantity: "1 tsp" }
    ],
    instructions: [
      { step: 1, text: "Mix soy sauce, vinegar, garlic, sugar, and pepper." },
      { step: 2, text: "Marinate beef slices overnight in the mixture." },
      { step: 3, text: "Pan-fry the beef in a little oil until cooked and slightly caramelized." },
      { step: 4, text: "Serve with garlic rice and fried egg." }
    ]
  },
  {
    title: "Bangus Daing",
    description: "Butterflied milkfish marinated in vinegar and garlic, then fried.",
    tags: ["fish", "breakfast", "fried", "marinated"],
    ingredients: [
      { name: "Bangus, milkfish, raw", quantity: "1 large, butterflied" },
      { name: "Vinegar, white", quantity: "1/2 cup" },
      { name: "Garlic, raw", quantity: "6 cloves, crushed" },
      { name: "Black pepper, ground", quantity: "1 tsp" },
      { name: "Salt, iodized", quantity: "1 tsp" }
    ],
    instructions: [
      { step: 1, text: "Marinate the bangus in vinegar, garlic, pepper, and salt for at least 4 hours." },
      { step: 2, text: "Heat oil in a wide pan." },
      { step: 3, text: "Fry the bangus until golden brown and crispy on both sides." },
      { step: 4, text: "Serve with rice and tomato salsa." }
    ]
  },
  {
    title: "Bicol Express",
    description: "Pork cooked in coconut milk with lots of chilies.",
    tags: ["pork", "spicy", "coconut", "bicol"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "500g, cubed" },
      { name: "Coconut milk, thick", quantity: "2 cups" },
      { name: "Shrimp paste", quantity: "2 tbsp" },
      { name: "Chili pepper, green, raw", quantity: "5 pieces, sliced" },
      { name: "Siling labuyo, raw", quantity: "3 pieces, chopped" },
      { name: "Garlic, raw", quantity: "4 cloves, minced" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic, onion, and pork until browned." },
      { step: 2, text: "Add shrimp paste and cook for 2 minutes." },
      { step: 3, text: "Pour in half of the coconut milk and simmer until pork is tender." },
      { step: 4, text: "Add the rest of the coconut milk and all the chilies. Simmer until sauce thickens and oils out." }
    ]
  },
  {
    title: "Dinuguan",
    description: "Savory pork blood stew with vinegar and chili.",
    tags: ["pork", "stew", "blood", "savory"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "500g, cubed" },
      { name: "Pork blood, raw", quantity: "2 cups" },
      { name: "Vinegar, white", quantity: "1/4 cup" },
      { name: "Chili pepper, green, raw", quantity: "2 pieces" },
      { name: "Garlic, raw", quantity: "4 cloves, minced" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic, onion, and pork until pork is browned." },
      { step: 2, text: "Add water and simmer until pork is tender." },
      { step: 3, text: "Pour in vinegar and let it boil without stirring." },
      { step: 4, text: "Stir in pork blood continuously to prevent lumps." },
      { step: 5, text: "Add green chilies and simmer until sauce thickens." }
    ]
  },
  {
    title: "Lechon Kawali",
    description: "Crispy deep-fried pork belly.",
    tags: ["pork", "fried", "crispy", "sinful"],
    ingredients: [
      { name: "Pork belly, raw", quantity: "1kg, whole piece" },
      { name: "Salt, iodized", quantity: "2 tbsp" },
      { name: "Black pepper, ground", quantity: "1 tsp" },
      { name: "Bay leaf, dried", quantity: "3 leaves" },
      { name: "Vegetable oil, palm", quantity: "4 cups for frying" }
    ],
    instructions: [
      { step: 1, text: "Boil pork belly in water with salt, pepper, and bay leaves until tender." },
      { step: 2, text: "Remove from water, let it cool and dry completely. Prick skin with a fork." },
      { step: 3, text: "Rub salt all over the dried pork." },
      { step: 4, text: "Deep fry in hot oil until skin is blistered and super crispy." },
      { step: 5, text: "Rest before chopping." }
    ]
  },
  {
    title: "Ginataang Kalabasa",
    description: "Squash and yardlong beans cooked in coconut milk.",
    tags: ["vegetables", "coconut", "healthy", "sides"],
    ingredients: [
      { name: "Squash, raw", quantity: "2 cups, cubed" },
      { name: "Yardlong bean, raw", quantity: "1 cup, cut" },
      { name: "Coconut milk, thick", quantity: "1.5 cups" },
      { name: "Shrimp, raw", quantity: "100g, peeled" },
      { name: "Shrimp paste", quantity: "1 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Saute garlic, onion, and shrimp." },
      { step: 2, text: "Add shrimp paste and coconut milk. Bring to a boil." },
      { step: 3, text: "Add squash and simmer until almost soft." },
      { step: 4, text: "Add yardlong beans and cook until vegetables are tender." }
    ]
  },
  {
    title: "Kare-Kare",
    description: "Oxtail and tripe stew in a rich peanut sauce.",
    tags: ["stew", "peanut", "fiesta", "special"],
    ingredients: [
      { name: "Beef shank, raw", quantity: "1kg" },
      { name: "Peanut butter", quantity: "1 cup" },
      { name: "Eggplant, raw", quantity: "2 medium, sliced" },
      { name: "Yardlong bean, raw", quantity: "1 cup, cut" },
      { name: "Baguio beans", quantity: "1 cup, cut" },
      { name: "Shrimp paste", quantity: "1/4 cup (for serving)" }
    ],
    instructions: [
      { step: 1, text: "Boil beef shank until very tender." },
      { step: 2, text: "In a separate pan, saute garlic, onion, and annatto powder for color." },
      { step: 3, text: "Add the beef broth and peanut butter. Stir until smooth and thick." },
      { step: 4, text: "Add the tender beef and vegetables. Cook until vegetables are tender." },
      { step: 5, text: "Serve with shrimp paste on the side." }
    ]
  },
  {
    title: "Tapsilog",
    description: "Classic Filipino breakfast of Tapa, Sinangag (Garlic Rice), and Itlog (Egg).",
    tags: ["breakfast", "beef", "rice", "silog"],
    ingredients: [
      { name: "Beef, lean, raw", quantity: "200g, cured (Tapa)" },
      { name: "Rice, white, cooked", quantity: "2 cups (leftover is best)" },
      { name: "Garlic, raw", quantity: "4 cloves, minced" },
      { name: "Egg, chicken, whole, raw", quantity: "1 large" },
      { name: "Vegetable oil, palm", quantity: "3 tbsp" }
    ],
    instructions: [
      { step: 1, text: "Pan-fry the beef tapa until cooked. Set aside." },
      { step: 2, text: "In the same pan, fry the egg sunny-side up. Set aside." },
      { step: 3, text: "Add more oil if needed, toast the garlic until golden." },
      { step: 4, text: "Add the cooked rice, mix well, and season with salt." },
      { step: 5, text: "Plate the garlic rice, tapa, and egg together." }
    ]
  }
];

const variations = [
  { modifier: "Spicy", addition: "Add lots of chilies for an extra kick.", extraIng: { name: "Siling labuyo, raw", quantity: "5 pieces" } },
  { modifier: "Garlic Lover's", addition: "Loaded with extra toasted garlic.", extraIng: { name: "Garlic, raw", quantity: "1 extra head, roasted" } },
  { modifier: "Healthy", addition: "Reduced oil and added extra greens.", extraIng: { name: "Kangkong, raw", quantity: "1 cup" } }
];

let finalRecipes: any[] = [];

// Create 60 recipes by taking the 20 base recipes and making 3 variations each
for (let base of baseRecipes) {
  // Base
  finalRecipes.push({
    title: base.title,
    description: base.description,
    tags: base.tags,
    ingredients: [...base.ingredients],
    instructions: [...base.instructions]
  });

  // Variations
  for (let i=0; i<2; i++) {
    const v = variations[i];
    finalRecipes.push({
      title: v.modifier + ' ' + base.title,
      description: base.description + ' ' + v.addition,
      tags: [...base.tags, v.modifier.toLowerCase().replace(/[^a-z]/g, '')],
      ingredients: [...base.ingredients, v.extraIng],
      instructions: [...base.instructions, { step: base.instructions.length + 1, text: v.addition }]
    });
  }
}

const fileContent = "export const REAL_RECIPES = " + JSON.stringify(finalRecipes, null, 2) + ";\n";
fs.writeFileSync('/Users/dex/Documents/Nutrisipe-Revamp/backend/prisma/recipes.data.ts', fileContent);
console.log("Generated " + finalRecipes.length + " recipes.");
