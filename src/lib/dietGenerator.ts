export interface DietRequest {
  name: string;
  age: number;
  weight: number;
  goal: 'fat_loss' | 'muscle_gain' | 'fitness_maintenance';
  foodType: 'veg' | 'non-veg' | 'egg';
}

export function generateCustomDietPlan(req: DietRequest) {
  const { name, age, weight, goal, foodType } = req;

  let calorieTarget = '2,000 kcal';
  let proteinTarget = `${Math.round(weight * 1.6)}g Protein`;
  let goalLabel = 'General Fitness';

  if (goal === 'fat_loss') {
    calorieTarget = `${Math.max(1500, Math.round(weight * 22))} kcal (Calorie Deficit)`;
    goalLabel = 'Fat Loss & Shredding';
  } else if (goal === 'muscle_gain') {
    calorieTarget = `${Math.round(weight * 32)} kcal (Hypertrophy Surplus)`;
    proteinTarget = `${Math.round(weight * 2.0)}g High Protein`;
    goalLabel = 'Lean Muscle Gain';
  }

  const meals = [];

  // Breakfast
  if (foodType === 'veg') {
    meals.push({
      timing: '08:00 AM - 09:00 AM',
      title: 'Power Breakfast (Veg)',
      items: [
        'Besan chilla (2 pcs) with paneer stuffing (50g)',
        '1 cup curd or 1 glass soy milk',
        '1 handful soaked almonds & walnuts',
      ],
      notes: 'High complex carbs and plant protein for sustained morning energy.'
    });
  } else if (foodType === 'egg') {
    meals.push({
      timing: '08:00 AM - 09:00 AM',
      title: 'Power Breakfast (Eggitarian)',
      items: [
        '3 boiled eggs (2 whites + 1 whole) OR 3-egg omelet',
        '2 slices 100% whole wheat/multigrain bread',
        '1 cup black coffee or green tea without sugar',
      ],
      notes: 'Lean protein source to boost morning metabolism.'
    });
  } else {
    meals.push({
      timing: '08:00 AM - 09:00 AM',
      title: 'Power Breakfast (Non-Veg)',
      items: [
        '3 whole eggs boiled / scrambled',
        'Oatmeal (40g) cooked with skim milk & sliced banana',
        '1 cup green tea',
      ],
      notes: 'Balanced macro breakdown with high biological value protein.'
    });
  }

  // Mid-Morning Snack
  meals.push({
    timing: '11:30 AM',
    title: 'Pre-Lunch Fruit Booster',
    items: [
      '1 Apple or Seasonal Orange / Papaya bowl',
      '1 glass coconut water or lemon water with pink salt',
    ],
    notes: 'Electrolyte replenishment & essential micronutrients.'
  });

  // Lunch
  if (foodType === 'veg') {
    meals.push({
      timing: '01:30 PM - 02:00 PM',
      title: 'Anabolic Lunch (Veg)',
      items: [
        '2 multigrain rotis or 1 bowl brown rice',
        '1 bowl thick dal (Moong/Arhar) or Rajma/Chole',
        '100g low fat Paneer or Tofu bhurji',
        'Fresh green cucumber-carrot salad with lemon juice',
      ],
      notes: 'Fibrous greens aid digestion and curb mid-day cravings.'
    });
  } else {
    meals.push({
      timing: '01:30 PM - 02:00 PM',
      title: 'Anabolic Lunch (High Protein)',
      items: [
        '150g grilled/boiled chicken breast or fish tikka',
        '2 rotis or 1 small cup steamed rice',
        '1 bowl mixed green vegetable/salad',
        '1 small bowl plain curd',
      ],
      notes: 'Optimal muscle protein synthesis trigger.'
    });
  }

  // Pre-Workout Snack
  meals.push({
    timing: '05:00 PM (45 min before City Gym workout)',
    title: 'Pre-Workout Fuel',
    items: [
      '1 medium banana + 1 tablespoon peanut butter',
      'Strong black coffee / warm water with honey (optional)',
    ],
    notes: 'Quick digesting carbs to power heavy lifting and stamina.'
  });

  // Post-Workout Snack
  meals.push({
    timing: '07:30 PM (Within 30 mins after gym)',
    title: 'Post-Workout Recovery',
    items: [
      foodType === 'veg' 
        ? '1 scoop Whey protein in water OR 250ml Sattu water with roasted chana'
        : '4 boiled egg whites OR 1 scoop Whey isolate in water',
      '3-4 dates or 1 small banana',
    ],
    notes: 'Restores glycogen reserves and begins muscle repair immediately.'
  });

  // Dinner
  meals.push({
    timing: '09:00 PM - 09:30 PM',
    title: 'Light Recovery Dinner',
    items: [
      foodType === 'veg'
        ? 'Paneer / Soya chunks stir-fry with broccoli, capsicum & beans'
        : 'Grilled chicken salad or boiled eggs (3 whites) with sauteed veggies',
      '1 light multigrain roti (optional if on strict cut)',
      '1 warm cup of turmeric water or chamomile tea before bed',
    ],
    notes: 'Light on the stomach to ensure deep sleep & overnight recovery.'
  });

  const waterIntake = `${Math.max(3.5, Math.round((weight * 0.04) * 10) / 10)} Liters / Day`;

  const tips = [
    'Drink at least 500ml water as soon as you wake up.',
    'Strictly avoid refined sugar, sodas, and oily roadside fried foods.',
    'Aim for 7-8 hours of sound sleep every night for maximum growth hormones.',
    'Always warmup 5 minutes before weight training at City Gym.',
    'Consistency in training 4-5 days a week is key to seeing visible changes!'
  ];

  return {
    goal: goalLabel,
    foodType,
    calorieTarget: `${calorieTarget} | ${proteinTarget}`,
    waterIntake,
    meals,
    tips
  };
}
