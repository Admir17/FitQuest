-- ============================================================
-- FitQuest — Seed Data
-- System exercises + achievements
-- ============================================================

-- ============================================================
-- SYSTEM EXERCISES
-- ============================================================

INSERT INTO exercises (name, category, muscle_groups, is_system, xp_per_set) VALUES

-- Strength: Chest
('Bankdrücken',           'strength', ARRAY['chest','triceps','shoulders'], TRUE, 15),
('Schrägbankdrücken',     'strength', ARRAY['chest','triceps','shoulders'], TRUE, 15),
('Negativbankdrücken',    'strength', ARRAY['chest','triceps'],             TRUE, 14),
('Kurzhantel Flyes',      'strength', ARRAY['chest'],                       TRUE, 12),
('Kabelkreuzen',          'strength', ARRAY['chest'],                       TRUE, 12),
('Liegestütze',           'strength', ARRAY['chest','triceps','shoulders'], TRUE, 10),
('Dips',                  'strength', ARRAY['chest','triceps'],             TRUE, 13),

-- Strength: Back
('Kreuzheben',            'strength', ARRAY['back','glutes','hamstrings'],  TRUE, 20),
('Klimmzüge',             'strength', ARRAY['back','biceps'],               TRUE, 16),
('Langhantelrudern',      'strength', ARRAY['back','biceps'],               TRUE, 16),
('Kurzhantelrudern',      'strength', ARRAY['back','biceps'],               TRUE, 14),
('Latziehen',             'strength', ARRAY['back','biceps'],               TRUE, 14),
('Kabelrudern sitzend',   'strength', ARRAY['back','biceps'],               TRUE, 13),
('Face Pull',             'strength', ARRAY['shoulders','back'],            TRUE, 11),

-- Strength: Legs
('Kniebeuge',             'strength', ARRAY['quads','glutes','hamstrings'], TRUE, 18),
('Frontkniebeuge',        'strength', ARRAY['quads','core'],                TRUE, 17),
('Rumänisches Kreuzheben','strength', ARRAY['hamstrings','glutes'],         TRUE, 17),
('Beinpresse',            'strength', ARRAY['quads','glutes'],              TRUE, 15),
('Ausfallschritte',       'strength', ARRAY['quads','glutes'],              TRUE, 14),
('Bulgarische Kniebeuge', 'strength', ARRAY['quads','glutes'],              TRUE, 15),
('Beinbeuger',            'strength', ARRAY['hamstrings'],                  TRUE, 12),
('Beinstrecker',          'strength', ARRAY['quads'],                       TRUE, 12),
('Wadenheben',            'strength', ARRAY['calves'],                      TRUE, 10),
('Hip Thrust',            'strength', ARRAY['glutes','hamstrings'],         TRUE, 15),

-- Strength: Shoulders
('Schulterdrücken',       'strength', ARRAY['shoulders','triceps'],         TRUE, 15),
('Arnold Press',          'strength', ARRAY['shoulders'],                   TRUE, 14),
('Seitheben',             'strength', ARRAY['shoulders'],                   TRUE, 11),
('Frontheben',            'strength', ARRAY['shoulders'],                   TRUE, 11),
('Reverse Flyes',         'strength', ARRAY['shoulders','back'],            TRUE, 11),
('Shrugs',                'strength', ARRAY['traps'],                       TRUE, 12),

-- Strength: Arms
('Langhantel Curls',      'strength', ARRAY['biceps'],                      TRUE, 12),
('Kurzhantel Curls',      'strength', ARRAY['biceps'],                      TRUE, 11),
('Hammer Curls',          'strength', ARRAY['biceps','forearms'],           TRUE, 11),
('Konzentrations Curls',  'strength', ARRAY['biceps'],                      TRUE, 12),
('Trizepsdrücken',        'strength', ARRAY['triceps'],                     TRUE, 11),
('Skull Crusher',         'strength', ARRAY['triceps'],                     TRUE, 13),
('Trizeps Überkopf',      'strength', ARRAY['triceps'],                     TRUE, 12),
('Diamant Liegestütze',   'strength', ARRAY['triceps','chest'],             TRUE, 11),

-- Core
('Unterarmstütz',         'core', ARRAY['core','abs'],                      TRUE, 10),
('Seitlicher Stütz',      'core', ARRAY['core','obliques'],                 TRUE, 10),
('Crunches',              'core', ARRAY['abs'],                             TRUE,  9),
('Sit-Ups',               'core', ARRAY['abs','hip_flexors'],               TRUE,  9),
('Russian Twist',         'core', ARRAY['obliques','abs'],                  TRUE, 10),
('Beinheben',             'core', ARRAY['abs','hip_flexors'],               TRUE, 10),
('Bauchrad',              'core', ARRAY['abs','core'],                      TRUE, 12),
('Kabelcrunches',         'core', ARRAY['abs'],                             TRUE, 11),
('Dragon Flag',           'core', ARRAY['abs','core'],                      TRUE, 14),
('Hollow Hold',           'core', ARRAY['abs','core'],                      TRUE, 10),

-- Cardio
('Laufen',                'cardio', ARRAY['legs','cardiovascular'],         TRUE, 12),
('Radfahren',             'cardio', ARRAY['legs','cardiovascular'],         TRUE, 11),
('Rudermaschine',         'cardio', ARRAY['back','legs','cardiovascular'],  TRUE, 13),
('Seilspringen',          'cardio', ARRAY['calves','cardiovascular'],       TRUE, 11),
('Burpees',               'cardio', ARRAY['full_body','cardiovascular'],    TRUE, 13),
('Box Jumps',             'cardio', ARRAY['legs','cardiovascular'],         TRUE, 12),
('Treppensteigen',        'cardio', ARRAY['legs','cardiovascular'],         TRUE, 11),
('Ellipsentrainer',       'cardio', ARRAY['legs','cardiovascular'],         TRUE, 10),
('Schwimmen',             'cardio', ARRAY['full_body','cardiovascular'],    TRUE, 13),
('Battle Ropes',          'cardio', ARRAY['shoulders','cardiovascular'],    TRUE, 13),

-- Flexibility
('Yoga Flow',             'flexibility', ARRAY['full_body'],                TRUE,  8),
('Hüftbeuger Dehnung',    'flexibility', ARRAY['hip_flexors'],              TRUE,  7),
('Oberschenkel Dehnung',  'flexibility', ARRAY['hamstrings'],               TRUE,  7),
('Schulter Dehnung',      'flexibility', ARRAY['shoulders'],                TRUE,  7),
('Foam Rolling',          'flexibility', ARRAY['full_body'],                TRUE,  8);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

INSERT INTO achievements (name, description, icon, condition_type, condition_value, xp_reward) VALUES

-- Workout milestones
('Erster Schritt',    'Schliesse dein erstes Workout ab',         '🏁', 'workouts_total', 1,   100),
('Auf dem Weg',       'Schliesse 10 Workouts ab',                 '💪', 'workouts_total', 10,  200),
('Fleissig',          'Schliesse 50 Workouts ab',                 '🏋️', 'workouts_total', 50,  500),
('Legende',           'Schliesse 200 Workouts ab',                '🌟', 'workouts_total', 200, 1000),

-- Streak achievements
('Heisser Start',     'Trainiere 3 Tage in Folge',                '🔥', 'streak_days', 3,   150),
('Woche der Stärke',  'Trainiere 7 Tage in Folge',               '🔥', 'streak_days', 7,   250),
('Eiserner Wille',    'Trainiere 30 Tage in Folge',               '⚡', 'streak_days', 30,  750),
('Unaufhaltsam',      'Trainiere 100 Tage in Folge',              '👑', 'streak_days', 100, 2000),

-- XP milestones
('XP Sammler',        'Verdiene insgesamt 1.000 XP',              '⭐', 'xp_total', 1000,  150),
('Aufsteiger',        'Verdiene insgesamt 5.000 XP',              '🌠', 'xp_total', 5000,  300),
('XP Maschine',       'Verdiene insgesamt 25.000 XP',             '💫', 'xp_total', 25000, 750),

-- Exercise variety
('Neugierig',         'Probiere 5 verschiedene Übungen aus',      '🔬', 'unique_exercises', 5,  100),
('Allrounder',        'Probiere 20 verschiedene Übungen aus',     '🧩', 'unique_exercises', 20, 300),

-- Custom exercises
('Eigener Chef',      'Erstelle deine erste eigene Übung',        '🛠️', 'custom_exercise_created', 1, 100);
