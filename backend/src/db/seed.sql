-- ============================================================
-- FitQuest — Seed Data
-- System exercises + achievements
-- ============================================================

-- ============================================================
-- SYSTEM EXERCISES
-- ============================================================

INSERT INTO exercises (name, category, muscle_groups, is_system, xp_per_set) VALUES

-- Strength: Chest
('Bench Press',           'strength', ARRAY['chest','triceps','shoulders'], TRUE, 15),
('Incline Bench Press',   'strength', ARRAY['chest','triceps','shoulders'], TRUE, 15),
('Decline Bench Press',   'strength', ARRAY['chest','triceps'],             TRUE, 14),
('Dumbbell Fly',          'strength', ARRAY['chest'],                       TRUE, 12),
('Cable Fly',             'strength', ARRAY['chest'],                       TRUE, 12),
('Push-Up',               'strength', ARRAY['chest','triceps','shoulders'], TRUE, 10),
('Dips',                  'strength', ARRAY['chest','triceps'],             TRUE, 13),

-- Strength: Back
('Deadlift',              'strength', ARRAY['back','glutes','hamstrings'],  TRUE, 20),
('Pull-Up',               'strength', ARRAY['back','biceps'],               TRUE, 16),
('Barbell Row',           'strength', ARRAY['back','biceps'],               TRUE, 16),
('Dumbbell Row',          'strength', ARRAY['back','biceps'],               TRUE, 14),
('Lat Pulldown',          'strength', ARRAY['back','biceps'],               TRUE, 14),
('Seated Cable Row',      'strength', ARRAY['back','biceps'],               TRUE, 13),
('Face Pull',             'strength', ARRAY['shoulders','back'],            TRUE, 11),

-- Strength: Legs
('Squat',                 'strength', ARRAY['quads','glutes','hamstrings'], TRUE, 18),
('Front Squat',           'strength', ARRAY['quads','core'],                TRUE, 17),
('Romanian Deadlift',     'strength', ARRAY['hamstrings','glutes'],         TRUE, 17),
('Leg Press',             'strength', ARRAY['quads','glutes'],              TRUE, 15),
('Lunges',                'strength', ARRAY['quads','glutes'],              TRUE, 14),
('Bulgarian Split Squat', 'strength', ARRAY['quads','glutes'],              TRUE, 15),
('Leg Curl',              'strength', ARRAY['hamstrings'],                  TRUE, 12),
('Leg Extension',         'strength', ARRAY['quads'],                       TRUE, 12),
('Calf Raise',            'strength', ARRAY['calves'],                      TRUE, 10),
('Hip Thrust',            'strength', ARRAY['glutes','hamstrings'],         TRUE, 15),

-- Strength: Shoulders
('Overhead Press',        'strength', ARRAY['shoulders','triceps'],         TRUE, 15),
('Arnold Press',          'strength', ARRAY['shoulders'],                   TRUE, 14),
('Lateral Raise',         'strength', ARRAY['shoulders'],                   TRUE, 11),
('Front Raise',           'strength', ARRAY['shoulders'],                   TRUE, 11),
('Rear Delt Fly',         'strength', ARRAY['shoulders','back'],            TRUE, 11),
('Shrug',                 'strength', ARRAY['traps'],                       TRUE, 12),

-- Strength: Arms
('Barbell Curl',          'strength', ARRAY['biceps'],                      TRUE, 12),
('Dumbbell Curl',         'strength', ARRAY['biceps'],                      TRUE, 11),
('Hammer Curl',           'strength', ARRAY['biceps','forearms'],           TRUE, 11),
('Preacher Curl',         'strength', ARRAY['biceps'],                      TRUE, 12),
('Tricep Pushdown',       'strength', ARRAY['triceps'],                     TRUE, 11),
('Skull Crusher',         'strength', ARRAY['triceps'],                     TRUE, 13),
('Overhead Tricep Ext',   'strength', ARRAY['triceps'],                     TRUE, 12),
('Diamond Push-Up',       'strength', ARRAY['triceps','chest'],             TRUE, 11),

-- Core
('Plank',                 'core', ARRAY['core','abs'],                      TRUE, 10),
('Side Plank',            'core', ARRAY['core','obliques'],                 TRUE, 10),
('Crunch',                'core', ARRAY['abs'],                             TRUE,  9),
('Sit-Up',                'core', ARRAY['abs','hip_flexors'],               TRUE,  9),
('Russian Twist',         'core', ARRAY['obliques','abs'],                  TRUE, 10),
('Leg Raise',             'core', ARRAY['abs','hip_flexors'],               TRUE, 10),
('Ab Wheel',              'core', ARRAY['abs','core'],                      TRUE, 12),
('Cable Crunch',          'core', ARRAY['abs'],                             TRUE, 11),
('Dragon Flag',           'core', ARRAY['abs','core'],                      TRUE, 14),
('Hollow Hold',           'core', ARRAY['abs','core'],                      TRUE, 10),

-- Cardio
('Running',               'cardio', ARRAY['legs','cardiovascular'],         TRUE, 12),
('Cycling',               'cardio', ARRAY['legs','cardiovascular'],         TRUE, 11),
('Rowing Machine',        'cardio', ARRAY['back','legs','cardiovascular'],  TRUE, 13),
('Jump Rope',             'cardio', ARRAY['calves','cardiovascular'],       TRUE, 11),
('Burpee',                'cardio', ARRAY['full_body','cardiovascular'],    TRUE, 13),
('Box Jump',              'cardio', ARRAY['legs','cardiovascular'],         TRUE, 12),
('Stair Climbing',        'cardio', ARRAY['legs','cardiovascular'],         TRUE, 11),
('Elliptical',            'cardio', ARRAY['legs','cardiovascular'],         TRUE, 10),
('Swimming',              'cardio', ARRAY['full_body','cardiovascular'],    TRUE, 13),
('Battle Ropes',          'cardio', ARRAY['shoulders','cardiovascular'],    TRUE, 13),

-- Flexibility
('Yoga Flow',             'flexibility', ARRAY['full_body'],                TRUE,  8),
('Hip Flexor Stretch',    'flexibility', ARRAY['hip_flexors'],              TRUE,  7),
('Hamstring Stretch',     'flexibility', ARRAY['hamstrings'],               TRUE,  7),
('Shoulder Stretch',      'flexibility', ARRAY['shoulders'],                TRUE,  7),
('Foam Rolling',          'flexibility', ARRAY['full_body'],                TRUE,  8);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

INSERT INTO achievements (name, description, icon, condition_type, condition_value, xp_reward) VALUES

-- Workout milestones
('First Step',        'Complete your first workout',           '🏁', 'workouts_total', 1,   100),
('On Your Way',       'Complete 10 workouts',                  '💪', 'workouts_total', 10,  200),
('Dedicated',         'Complete 50 workouts',                  '🏋️', 'workouts_total', 50,  500),
('Legend',            'Complete 200 workouts',                 '🌟', 'workouts_total', 200, 1000),

-- Streak achievements
('Hot Start',         'Train 3 days in a row',                 '🔥', 'streak_days', 3,   150),
('Week Warrior',      'Train 7 days in a row',                 '🔥', 'streak_days', 7,   250),
('Iron Will',         'Train 30 days in a row',                '⚡', 'streak_days', 30,  750),
('Unstoppable',       'Train 100 days in a row',               '👑', 'streak_days', 100, 2000),

-- XP milestones
('XP Collector',      'Earn a total of 1,000 XP',              '⭐', 'xp_total', 1000,  150),
('Rising Star',       'Earn a total of 5,000 XP',              '🌠', 'xp_total', 5000,  300),
('XP Machine',        'Earn a total of 25,000 XP',             '💫', 'xp_total', 25000, 750),

-- Exercise variety
('Explorer',          'Try 5 different exercises',             '🔬', 'unique_exercises', 5,  100),
('All-Rounder',       'Try 20 different exercises',            '🧩', 'unique_exercises', 20, 300),

-- Custom exercises
('Your Own Boss',     'Create your first custom exercise',     '🛠️', 'custom_exercise_created', 1, 100);
