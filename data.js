/* Settle — the tool library, feelings, what's going on, and body areas */
'use strict';

const CATS = [
  { id: 'breath', name: 'Breathing', icon: 'wind' },
  { id: 'ground', name: 'Grounding', icon: 'anchor' },
  { id: 'touch', name: 'Soothing touch', icon: 'hand' },
  { id: 'move', name: 'Movement', icon: 'move' },
  { id: 'vagus', name: 'Voice, face and cold', icon: 'wave' },
  { id: 'rest', name: 'Rest and imagery', icon: 'moon' },
];
const catById = id => CATS.find(c => c.id === id) || (id === 'routine' ? { id: 'routine', name: 'Routine', icon: 'leaf' } : CATS[0]);
const GOOD = {
  quick: 'Quick', discreet: 'Discreet', high: 'Very activated', anxious: 'Anxious', anger: 'Angry',
  shutdown: 'Numb or shut down', low: 'Low or sad', tension: 'Pain or tension', sleep: 'Sleep',
};

const SCAN_STEPS = [
  ['Settle in. Let your body be heavy and supported.', 12], ['Notice your breathing, without changing it.', 12],
  ['Your feet: toes, soles and heels. Notice, then soften.', 20], ['Your lower legs: shins and calves.', 20], ['Your knees.', 15],
  ['Your thighs, front and back. Let them be heavy.', 20], ['Your hips and bottom, resting on the surface beneath you.', 20],
  ['Your belly. Let it be soft as it rises and falls.', 20], ['Your lower back. Breathe into it.', 20],
  ['Your chest and upper back. Notice your heartbeat if you can.', 20], ['Your hands and fingers.', 20], ['Your arms, up to your shoulders.', 20],
  ['Your shoulders. Let them drop away from your ears.', 20], ['Your neck and throat.', 20], ['Your jaw. Let your teeth part.', 15],
  ['Your face: cheeks, eyes and forehead. Let them soften.', 20], ['The top of your head.', 15], ['Now your whole body at once, breathing. Rest here.', 30],
];
const PMR_GROUPS = [
  ['hands', 'Make tight fists'], ['forearms', 'Bend your hands back at the wrists'], ['upper arms', 'Bend your elbows and tighten your biceps'],
  ['shoulders', 'Shrug your shoulders up towards your ears'], ['forehead', 'Raise your eyebrows as high as they go'],
  ['eyes and cheeks', 'Squeeze your eyes shut and scrunch your face'], ['jaw', 'Press your teeth together gently and pull the corners of your mouth back'],
  ['neck', 'Press your head gently back into the chair or pillow'], ['upper back', 'Squeeze your shoulder blades together'],
  ['belly', 'Pull your belly in tight'], ['bottom', 'Squeeze your buttocks together'], ['thighs', 'Press your knees together and tighten your thighs'],
  ['calves', 'Pull your toes up towards your face'], ['feet', 'Curl your toes under'],
];
const PMR_STEPS = [['Get comfortable. Breathe slowly and let your body settle.', 15, 1]]
  .concat(...PMR_GROUPS.map(([g, how]) => [[`${how}. Hold it…`, 6, 0], [`Let go. Feel your ${g} soften and grow heavy.`, 12, 1]]))
  .concat([['Notice your whole body: loose, heavy and warm. Rest here.', 30, 1]]);

// guide.t: breath (phases), steps (timed prompts), senses (5-4-3-2-1), bilateral (left-right taps), sway (pendulum),
// tapcount (count your breaths), alpha (alphabet game). Steps come from tool.steps unless guide.s gives [text, secs, flex].
const TOOLS = [
  /* ---------- breathing ---------- */
  { id: 'sigh', name: 'Physiological sigh', cat: 'breath', durs: [1, 2, 3, 5], def: 2, good: ['quick', 'high', 'anxious', 'anger'],
    short: 'Two breaths in through the nose, then one long sigh out. The quickest way to take the edge off.',
    steps: ['Breathe in through your nose until your lungs feel full.', 'Without breathing out, sip in a little more air through your nose.', 'Breathe out slowly through your mouth, all the way, like a long, relieved sigh.', 'Let the next breath come by itself, then repeat.'],
    why: 'The second sip of air re-opens tiny air sacs in the lungs, and the long breath out slows your heart through the vagus nerve. In a 2023 Stanford study, five minutes a day of these “cyclic sighs” eased anxiety and lifted mood more than mindfulness meditation did.',
    guide: { t: 'breath', p: [{ id: 'std', label: 'Standard', ph: [['in', 2.5], ['in2', 1.2, 'Sip in more'], ['out', 6, 'Long sigh out'], ['rest', 1.5]] }, { id: 'slow', label: 'Slower', ph: [['in', 3], ['in2', 1.5, 'Sip in more'], ['out', 8, 'Long sigh out'], ['rest', 2]] }] } },
  { id: 'exhale', name: 'Long exhale', cat: 'breath', durs: [1, 2, 3, 5, 10, 15], def: 3, good: ['discreet', 'high', 'anxious', 'anger', 'sleep'],
    short: 'Breathe out for longer than you breathe in. Simple, quiet and works anywhere.',
    steps: ['Breathe in gently through your nose.', 'Breathe out slowly through your nose or softly pursed lips, taking longer than the in-breath.', 'Let the out-breath be soft and unforced, like a slow leak.', 'Follow the circle: it grows as you breathe in and shrinks as you breathe out.'],
    why: 'Your heart speeds up slightly on every in-breath and slows on every out-breath. Making the out-breath longer leans into the slowing side, which is run by the vagus nerve, your nervous system’s main brake.',
    guide: { t: 'breath', p: [{ id: '4-6', label: '4 in · 6 out', ph: [['in', 4], ['out', 6]] }, { id: '4-8', label: '4 in · 8 out', ph: [['in', 4], ['out', 8]] }, { id: '3-6', label: '3 in · 6 out', ph: [['in', 3], ['out', 6]] }, { id: '5-10', label: '5 in · 10 out', ph: [['in', 5], ['out', 10]] }] } },
  { id: 'box', name: 'Box breathing', cat: 'breath', durs: [1, 2, 3, 5, 10], def: 3, good: ['discreet', 'anxious', 'anger'],
    short: 'In, hold, out, hold, all for the same count. Steadying when you need to stay sharp.',
    steps: ['Breathe in through your nose for a count of 4.', 'Hold gently for 4. Keep your shoulders and throat relaxed.', 'Breathe out slowly for 4.', 'Hold, empty, for 4. Then start again.'],
    why: 'The even rhythm slows your breathing and gives an anxious mind a simple job. Pilots, paramedics and soldiers use it to stay calm and clear under pressure.',
    caution: 'If the holds make you more anxious or light-headed, shorten them or try Long exhale instead.',
    guide: { t: 'breath', p: [{ id: '4', label: '4-4-4-4', ph: [['in', 4], ['hold', 4], ['out', 4], ['rest', 4, 'Hold, empty']] }, { id: '3', label: '3-3-3-3', ph: [['in', 3], ['hold', 3], ['out', 3], ['rest', 3, 'Hold, empty']] }, { id: '5', label: '5-5-5-5', ph: [['in', 5], ['hold', 5], ['out', 5], ['rest', 5, 'Hold, empty']] }] } },
  { id: 'coherent', name: 'Resonance breathing', cat: 'breath', durs: [3, 5, 10, 15, 20], def: 5, good: ['discreet', 'anxious', 'sleep'],
    short: 'Slow, even breaths at about six a minute. Builds a calmer, more resilient nervous system over time.',
    steps: ['Sit comfortably and let your belly be soft.', 'Breathe in through your nose for about 5 seconds.', 'Breathe out through your nose for about 5 seconds.', 'Keep it smooth and quiet, with no pause at the top or bottom.'],
    why: 'At 5 to 6 breaths a minute, your heart rhythm and breathing fall into step, which raises heart rate variability (HRV), a sign of a flexible, resilient nervous system. The benefits build with regular practice: try 10 to 20 minutes a day.',
    guide: { t: 'breath', p: [{ id: '5.5', label: '5.5 in · 5.5 out', ph: [['in', 5.5], ['out', 5.5]] }, { id: '5', label: '5 in · 5 out', ph: [['in', 5], ['out', 5]] }, { id: '6', label: '6 in · 6 out', ph: [['in', 6], ['out', 6]] }, { id: '4-6', label: '4 in · 6 out', ph: [['in', 4], ['out', 6]] }] } },
  { id: '478', name: '4-7-8 breathing', cat: 'breath', durs: [1, 2, 3, 5], def: 1, good: ['sleep', 'anxious'],
    short: 'In for 4, hold for 7, out for 8. A favourite for falling asleep.',
    steps: ['Rest the tip of your tongue just behind your top front teeth.', 'Breathe in quietly through your nose for 4.', 'Hold your breath for 7.', 'Breathe out through your mouth for 8, with a soft “whoosh”.', 'Start with 4 rounds and build up over time.'],
    why: 'The hold and the very long out-breath slow your breathing right down and shift you towards rest. Popularised by Dr Andrew Weil, it’s widely used for sleep and anxious moments.',
    caution: 'The hold can make you light-headed: stop and breathe normally if it does. Skip the hold if you’re pregnant or have a heart or lung condition.',
    guide: { t: 'breath', p: [{ id: 'std', label: '4-7-8', ph: [['in', 4], ['hold', 7], ['out', 8, 'Out with a whoosh']] }, { id: 'short', label: 'Shorter: 2-3.5-4', ph: [['in', 2], ['hold', 3.5], ['out', 4, 'Out with a whoosh']] }] } },
  { id: 'belly', name: 'Belly breathing', cat: 'breath', durs: [2, 3, 5, 10, 15], def: 5, good: ['discreet', 'tension', 'anxious', 'sleep'],
    short: 'Breathe low and slow into your belly, with a hand there to feel it rise and fall.',
    steps: ['Sit back or lie down. Put one hand on your chest and one on your belly.', 'Breathe in through your nose and let your belly rise into your hand. The hand on your chest stays fairly still.', 'Breathe out slowly and feel your belly fall.', 'If it feels hard, try lying on your back with your knees bent.'],
    why: 'Stress pulls breathing up into the chest and shoulders. Breathing with your diaphragm is slower and deeper, relaxes your neck and shoulders, and tells your body it’s safe to rest.',
    guide: { t: 'breath', p: [{ id: '4-6', label: '4 in · 6 out', ph: [['in', 4, 'Belly rises'], ['out', 6, 'Belly falls']] }, { id: '3-5', label: '3 in · 5 out', ph: [['in', 3, 'Belly rises'], ['out', 5, 'Belly falls']] }, { id: '5-7', label: '5 in · 7 out', ph: [['in', 5, 'Belly rises'], ['out', 7, 'Belly falls']] }] } },
  { id: 'nostril', name: 'Alternate nostril breathing', cat: 'breath', durs: [1, 3, 5, 10], def: 3, good: ['anxious', 'sleep'],
    short: 'Breathe in one side of your nose and out the other. Gives a busy mind something gentle to do.',
    steps: ['Rest your left hand in your lap. Bring your right thumb to your right nostril and your ring finger to your left.', 'Close the right nostril and breathe in through the left.', 'Close the left, open the right, and breathe out through the right.', 'Breathe in through the right, then switch and breathe out through the left. That’s one round.'],
    why: 'It slows your breathing and needs just enough focus to pull your attention away from worries. Studies show it can lower heart rate and blood pressure and ease anxiety.',
    caution: 'Skip it if your nose is blocked.',
    guide: { t: 'breath', p: [{ id: '4-6', label: '4 in · 6 out', ph: [['in', 4, 'In through the left'], ['out', 6, 'Out through the right'], ['in', 4, 'In through the right'], ['out', 6, 'Out through the left']] }, { id: '4-4', label: '4 in · 4 out', ph: [['in', 4, 'In through the left'], ['out', 4, 'Out through the right'], ['in', 4, 'In through the right'], ['out', 4, 'Out through the left']] }] } },
  { id: 'pursed', name: 'Pursed-lip breathing', cat: 'breath', durs: [1, 2, 3, 5], def: 2, good: ['quick', 'high', 'anxious'],
    short: 'In through your nose, then out slowly through pursed lips, like cooling hot soup.',
    steps: ['Relax your neck and shoulders.', 'Breathe in through your nose for 2.', 'Purse your lips as if you’re about to whistle or blow out a candle.', 'Breathe out gently through your lips for 4, twice as long as the in-breath.'],
    why: 'The small opening slows the out-breath naturally, which steadies your breathing and heart rate. It’s especially helpful when you feel you can’t get enough air.',
    guide: { t: 'breath', p: [{ id: '2-4', label: '2 in · 4 out', ph: [['in', 2], ['out', 4, 'Out through pursed lips']] }, { id: '3-6', label: '3 in · 6 out', ph: [['in', 3], ['out', 6, 'Out through pursed lips']] }] } },
  { id: 'count', name: 'Count your breaths', cat: 'breath', durs: [1, 3, 5, 10], def: 3, good: ['discreet', 'anxious', 'sleep'],
    short: 'Breathe naturally and count each out-breath up to ten. Tap to count and watch your breathing slow.',
    steps: ['Breathe naturally. Don’t try to change it.', 'At the end of each out-breath, count: one, then two, up to ten.', 'At ten, start again at one. If you lose count, simply start again. That’s part of it.', 'In the app, tap the circle at the end of each out-breath.'],
    why: 'Counting gives your attention a simple anchor, which quietens racing thoughts. As you settle, your breathing usually slows by itself, and the app shows you how many breaths a minute you’re taking.',
    guide: { t: 'tapcount' } },
  { id: 'ocean', name: 'Ocean breath', cat: 'breath', durs: [1, 3, 5, 10], def: 3, good: ['anxious', 'sleep'],
    short: 'Slow breaths through your nose with a soft, wave-like sound in your throat.',
    steps: ['Breathe out through your mouth as if fogging up a mirror: “haaa”. Notice the slight narrowing at the back of your throat.', 'Now close your mouth and keep that gentle narrowing as you breathe in and out through your nose.', 'Your breath should sound like soft waves. Keep it smooth and quiet.', 'Let the out-breath be a little longer than the in-breath.'],
    why: 'Called ujjayi in yoga. The soft sound slows the breath and gives you something soothing to listen to, and the gentle resistance in your throat lengthens each breath.',
    guide: { t: 'breath', p: [{ id: '4-6', label: '4 in · 6 out', ph: [['in', 4], ['out', 6]] }, { id: '5-7', label: '5 in · 7 out', ph: [['in', 5], ['out', 7]] }] } },

  /* ---------- grounding ---------- */
  { id: '54321', name: '5-4-3-2-1 senses', cat: 'ground', durs: [1, 2, 3, 5], def: 3, good: ['quick', 'discreet', 'high', 'anxious'],
    short: 'Name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell and 1 you can taste.',
    steps: ['Look around and name 5 things you can see.', 'Notice 4 things you can feel: your feet, the chair, your clothes, the air.', 'Listen for 3 things you can hear.', 'Find 2 things you can smell, or 2 smells you like.', 'Notice 1 thing you can taste, or one good thing about right now.'],
    why: 'Turning to your senses pulls your attention out of racing thoughts and into the present. It tells your nervous system where you are right now: here, not in the threat.',
    guide: { t: 'senses' } },
  { id: 'orient', name: 'Orienting', cat: 'ground', durs: [1, 2, 3, 5], def: 2, good: ['quick', 'high', 'anxious', 'shutdown'],
    short: 'Slowly look around the space you’re in, as if you’ve just arrived, and let your eyes rest on what you like.',
    steps: ['Let your eyes wander slowly around the space, as if you’ve just arrived somewhere new.', 'Let your head and neck turn too, slowly, as far as is comfortable. Look behind you.', 'Let your eyes rest on something you like the look of: a colour, a shape, the light.', 'Notice what happens in your body. Maybe a deeper breath, a swallow or a softening.', 'Keep exploring at your own pace.'],
    why: 'Looking around is how mammals check they’re safe. Doing it slowly and on purpose, a practice from Somatic Experiencing, signals safety to the oldest parts of your brain, and often brings a deep breath or sigh.',
    guide: { t: 'steps', each: 25, loop: true } },
  { id: 'feet', name: 'Feet on the floor', cat: 'ground', durs: [1, 2, 3, 5], def: 1, good: ['quick', 'discreet', 'high', 'anxious', 'shutdown'],
    short: 'Press your feet into the floor and feel it push back. Works anywhere, and nobody can tell.',
    steps: ['Sit or stand with both feet flat on the floor.', 'Press down gently and feel the floor pushing back up.', 'Notice your heels, the balls of your feet and your toes.', 'Rock your weight slowly side to side, then front to back. Come back to the middle.', 'Imagine roots growing down from your feet, holding you steady.'],
    why: 'Pressure through your feet and legs tells your brain where your body is. That sense of solid support is grounding, especially when you feel floaty, panicky or spaced out.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'wide', name: 'Wide view', cat: 'ground', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'anxious'],
    short: 'Soften your eyes and take in the edges of everything you can see, like looking at the horizon.',
    steps: ['Look straight ahead and rest your eyes on one point.', 'Without moving your eyes, notice the edges of what you can see: left and right, above and below.', 'Let your gaze go soft and wide, as if you’re looking out at the horizon.', 'Stay with the whole view at once. If your eyes lock onto something, soften them again.'],
    why: 'Stress narrows your vision onto the threat. Deliberately widening your gaze (panoramic vision) goes with a calmer, less alert state, and is one of the quickest ways to change gear.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'object', name: 'Hold something', cat: 'ground', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'high', 'anxious'],
    short: 'Pick up any object and explore it closely: its weight, temperature, texture and edges.',
    steps: ['Pick up something nearby: keys, a stone, a mug, your phone case.', 'Feel its weight. Is it warm or cool?', 'Run your fingers over it. Notice the texture, edges and any patterns.', 'Look at it as if you’ve never seen one before. Describe it to yourself in detail.'],
    why: 'Focusing on one real, physical thing fills your senses with something neutral and crowds out alarm signals. Some people carry a grounding object, like a smooth stone, for exactly this.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'listen', name: 'Listen', cat: 'ground', durs: [1, 2, 3, 5], def: 2, good: ['discreet', 'anxious', 'sleep'],
    short: 'Close your eyes and listen: for the furthest sound, then the closest, then the quietest.',
    steps: ['Close your eyes or lower your gaze.', 'Listen for the furthest sound you can hear.', 'Now the closest sound. Maybe your own breathing.', 'Now the quietest sound you can find.', 'Let sounds come and go without naming them, like weather passing.'],
    why: 'Listening outward moves your attention away from inner alarm and widens your awareness. Hearing ordinary sounds around you helps confirm that you’re safe right now.',
    guide: { t: 'steps', each: 25, loop: true } },
  { id: 'alpha', name: 'Alphabet game', cat: 'ground', durs: [1, 2, 3, 5], def: 2, good: ['discreet', 'high', 'anxious'],
    short: 'Pick a category and name one thing for each letter of the alphabet.',
    steps: ['Pick a category: animals, foods, cities, bands, anything at all. The app can suggest one.', 'Name one for each letter: A is for…, B is for…', 'Stuck on a letter? Skip it and keep going.', 'Reached Z? Pick a new category.'],
    why: 'When your nervous system is in alarm, the thinking part of your brain goes quiet. A calm, absorbing puzzle switches it back on and helps turn the alarm down.',
    guide: { t: 'alpha' } },
  { id: 'nameit', name: 'Name it to tame it', cat: 'ground', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'anxious', 'anger', 'low'],
    short: 'Put what you’re feeling into words: “My chest is tight. I feel anxious.”',
    steps: ['Notice what’s happening in your body and say it simply: “My jaw is tight.” “My heart is racing.”', 'Name the feeling: “I’m anxious.” “I’m angry.” “I feel overwhelmed.”', 'Add: “It makes sense that I feel this way.”', 'Notice whether anything shifts after naming it, even a little.'],
    why: 'Putting feelings into words, called affect labelling, calms the brain’s alarm centre (the amygdala). Brain scans show the effect even when people don’t expect it to help.',
    guide: { t: 'steps', each: 20, loop: true } },

  /* ---------- soothing touch ---------- */
  { id: 'heart', name: 'Hand on heart', cat: 'touch', durs: [1, 2, 3, 5], def: 2, good: ['quick', 'high', 'anxious', 'low'],
    short: 'Rest a warm hand on your heart, and maybe one on your belly. Breathe into your hands.',
    steps: ['Rest one hand on the centre of your chest. Add your other hand on your belly if you like.', 'Feel the warmth and gentle weight of your hands.', 'Breathe slowly into your hands.', 'You might say to yourself: “This is hard right now. I’m here. I’ve got you.”'],
    why: 'Warm, gentle touch is one of the body’s oldest signals of safety. Research shows soothing self-touch can lower the stress hormone cortisol, much like a hug from someone else.',
    guide: { t: 'steps', each: 30, loop: true } },
  { id: 'butterfly', name: 'Butterfly hug', cat: 'touch', durs: [1, 2, 3, 5], def: 2, good: ['high', 'anxious', 'low'],
    short: 'Cross your arms over your chest and tap slowly, left and right, like a butterfly’s wings.',
    steps: ['Cross your arms over your chest so your hands rest just below your collarbones, or on your upper arms.', 'Hook your thumbs together if that feels good.', 'Tap slowly with your hands, left then right, at the pace shown.', 'Breathe slowly. Close your eyes or let your gaze rest on the floor.', 'Notice what you feel, without judging it.'],
    why: 'Slow, alternating left-right tapping (bilateral stimulation) comes from EMDR trauma therapy, where the butterfly hug was developed to help people settle distress. The steady rhythm is soothing in itself. Headphones make the left-right sounds clearer.',
    guide: { t: 'bilateral', rates: [[0.8, 'Slow'], [1.1, 'Steady'], [1.4, 'Brisk']] } },
  { id: 'selfhold', name: 'Self-holding', cat: 'touch', durs: [2, 3, 5, 10], def: 3, good: ['high', 'anxious', 'shutdown'],
    short: 'Gentle holds that help you feel contained and in one piece, from Somatic Experiencing.',
    steps: ['Place one hand on your forehead and the other on your chest. Rest here and notice what happens.', 'When you feel a shift, like a breath, warmth or settling, move the forehead hand to your belly. Rest here.', 'Now hug yourself: one hand under the opposite armpit, the other on the outside of your opposite upper arm.', 'Notice the feeling of being held, with clear edges. Stay as long as you like.'],
    why: 'Peter Levine, who developed Somatic Experiencing, uses these holds to help people feel the edges of their body. That sense of containment helps when you feel scattered, flooded or spacey.',
    guide: { t: 'steps', w: [35, 30, 5, 30], stretch: true } },
  { id: 'squeeze', name: 'Squeeze and release', cat: 'touch', durs: [1, 2, 3], def: 1, good: ['quick', 'high', 'shutdown', 'anger'],
    short: 'Firm pressure, like a weighted blanket: squeeze down your arms and legs, or give yourself a big hug.',
    steps: ['Wrap your arms around yourself and squeeze firmly for a few breaths. Then let go.', 'Squeeze down one arm from shoulder to hand, firmly. Then the other arm.', 'Do the same down each leg, from hip to foot.', 'Finish by pressing your palms together hard for 5 seconds. Let go and notice.'],
    why: 'Firm, deep pressure calms the nervous system: it’s why weighted blankets and tight hugs feel settling. It also helps you feel your body’s edges when you feel spaced out.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'havening', name: 'Slow stroking (havening)', cat: 'touch', durs: [1, 2, 3, 5], def: 2, good: ['high', 'anxious', 'low', 'sleep'],
    short: 'Slowly stroke your upper arms, palms and face, the way you’d comfort a child.',
    steps: ['Cross your arms and rest your palms on your shoulders.', 'Stroke slowly down from your shoulders to your elbows, then lift and start again at the shoulders. Slow and gentle.', 'Then rub your palms together slowly, like washing your hands.', 'Then close your eyes and stroke your face gently from forehead to chin.', 'You can hum a tune or count slowly while you do it.'],
    why: 'Slow, gentle stroking, at about the speed of a caress, activates special nerve fibres in the skin (C-tactile fibres) linked to comfort and calm. Havening is a technique built around this soothing touch.',
    guide: { t: 'steps', each: 30, loop: true } },
  { id: 'tapping', name: 'Tapping (EFT)', cat: 'touch', durs: [1, 2, 3, 5], def: 3, good: ['high', 'anxious'],
    short: 'Tap gently on points on your face and upper body while you name what you feel.',
    intro: 'With two or three fingertips, tap each point gently 5 to 7 times while you breathe slowly. You can say what’s bothering you as you tap: “Even though I feel anxious, I’m OK.”',
    steps: ['Top of the head', 'Start of the eyebrow, near the nose', 'Side of the eye, on the bone', 'Under the eye, on the bone', 'Under the nose', 'In the crease of the chin', 'Just below the collarbone', 'Under the arm, a hand’s width below the armpit'],
    why: 'Tapping (Emotional Freedom Techniques) pairs rhythmic touch with naming what you feel. Several studies show it reduces anxiety and stress, though experts still debate how it works.',
    guide: { t: 'steps', each: 12, loop: true, head: 'Tap gently, 5 to 7 times' } },
  { id: 'warmth', name: 'Warmth', cat: 'touch', durs: [2, 3, 5, 10], def: 3, good: ['shutdown', 'tension', 'low', 'sleep'],
    short: 'Wrap your hands around a warm drink, hold a heat pack to your belly, or stand under a warm shower.',
    steps: ['Find some warmth: a hot drink, a heat pack or hot water bottle, a warm shower or a blanket.', 'Hold it against your hands, belly or chest.', 'Notice the warmth spreading. Where do you feel it most?', 'Breathe slowly and let your muscles soften into the heat.'],
    why: 'Warmth relaxes tight muscles and feels like safety to the body. It’s especially good when you feel cold, numb, shut down or achy.',
    guide: { t: 'steps', each: 40, loop: true } },
  { id: 'palming', name: 'Palming your eyes', cat: 'touch', durs: [1, 2, 3], def: 1, good: ['quick', 'tension', 'sleep'],
    short: 'Rub your palms until warm and cup them over your closed eyes. A rest for tired, busy eyes.',
    steps: ['Rub your palms together briskly until they feel warm.', 'Close your eyes and cup your palms over them, fingers on your forehead. Don’t press on your eyes.', 'Enjoy the darkness and warmth. Let your eyes go heavy.', 'Breathe slowly. Rub your palms again whenever you like.'],
    why: 'Your eyes are always scanning, and screens keep them busy. Darkness and warmth let the eye muscles rest, and the stillness tells your body it’s safe to switch off.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'massage', name: 'Jaw, face and scalp massage', cat: 'touch', durs: [1, 2, 3, 5], def: 2, good: ['tension', 'discreet', 'sleep'],
    short: 'Rub slow circles into your jaw muscles, temples and the base of your skull.',
    steps: ['Find the muscles at the back of your jaw (they bulge when you clench). Rub slow circles with your fingertips.', 'Let your mouth fall slightly open as you go.', 'Move to your temples and rub slow circles there.', 'Then the base of your skull, where your neck meets your head. Press gently and circle.', 'Finish by running your fingers through your hair and over your scalp.'],
    why: 'We hold a lot of stress in the jaw, face and neck. Massage loosens these muscles, and gentle touch is soothing in itself. It can ease tension headaches too.',
    guide: { t: 'steps', each: 30, loop: true } },
  { id: 'hands', name: 'Hand massage', cat: 'touch', durs: [1, 2, 3, 5], def: 2, good: ['discreet', 'tension', 'anxious'],
    short: 'Massage your palm, each finger and the web between thumb and finger.',
    steps: ['Press your thumb into the palm of your other hand and rub slow circles.', 'Gently squeeze and pull each finger, from base to tip.', 'Press into the web between your thumb and first finger. Hold for a few breaths.', 'Swap hands and repeat.'],
    why: 'Your hands are packed with touch receptors, so massaging them is very soothing, and it’s easy to do quietly in a meeting or on the bus.',
    guide: { t: 'steps', each: 25, loop: true } },

  /* ---------- movement ---------- */
  { id: 'shake', name: 'Shake it out', cat: 'move', durs: [1, 2, 3, 5], def: 2, good: ['high', 'anxious', 'anger', 'shutdown'],
    short: 'Shake your hands, arms and legs loosely, like an animal shaking off a scare.',
    steps: ['Stand with your feet hip-width apart and your knees soft.', 'Start by shaking your hands. Let it spread up into your arms and shoulders.', 'Bounce gently through your knees and let your legs shake too.', 'Let it be loose and messy. Shake for as long as feels right.', 'Slow down gradually, then stand still. Notice the buzzing and tingling in your body.'],
    why: 'Animals shake after a threat to release the stress energy. Shaking helps your body burn off adrenaline and finish the stress response instead of holding on to it.',
    caution: 'Go gently if you have joint, back or balance problems. You can do it sitting down.',
    guide: { t: 'steps', w: [10, 25, 25, 25, 15], stretch: true } },
  { id: 'pmr', name: 'Progressive muscle relaxation', cat: 'move', durs: [5, 10, 15, 20], def: 10, good: ['tension', 'sleep', 'anxious'],
    short: 'Tense each muscle group for a few seconds, then let go and feel the difference.',
    steps: ['Get comfortable, sitting or lying down.', 'Working through your body, tense each area for about 5 seconds, at about half strength.', 'Then let go all at once and notice the difference.', 'Follow the prompts: hands, arms, shoulders, face, neck, back, belly, legs and feet.'],
    why: 'Tensing on purpose and then letting go teaches your body the difference between holding and releasing. It’s one of the best-studied ways to relax, for anxiety, stress and sleep.',
    caution: 'Tense gently, never to the point of pain or cramp. Skip any area that’s injured or sore.',
    guide: { t: 'steps', s: PMR_STEPS, stretch: true } },
  { id: 'neck', name: 'Neck and shoulder release', cat: 'move', durs: [1, 2, 3, 5], def: 2, good: ['tension', 'discreet'],
    short: 'Shrug, roll and gently stretch the neck and shoulders, where stress loves to sit.',
    steps: ['Shrug your shoulders up to your ears, hold for a breath, then drop them with a sigh. Do it 3 times.', 'Roll your shoulders slowly back 5 times, then forward 5 times.', 'Tilt your right ear towards your right shoulder and breathe there for a few breaths. Then the left.', 'Turn your head slowly to look over one shoulder, then the other.', 'Let your shoulders drop and your arms hang heavy.'],
    why: 'When we’re stressed, the shoulders creep up and the neck braces, ready for action. Gentle movement releases that guarding and tells your body the danger has passed.',
    caution: 'Move slowly and stay within a comfortable range. Stop if anything causes pain, numbness or dizziness.',
    guide: { t: 'steps', w: [20, 20, 25, 20, 15], stretch: true } },
  { id: 'jaw', name: 'Unclench your jaw', cat: 'move', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'tension'],
    short: 'Let your teeth part, your tongue rest and your jaw hang loose. Check your shoulders while you’re there.',
    steps: ['Notice your jaw. Are your teeth touching? Let them part.', 'Let your tongue rest softly on the floor of your mouth.', 'Open your mouth wide, as if yawning, then let it close softly without your teeth touching.', 'Slide your jaw gently from side to side a few times.', 'Soften your eyes and forehead. Drop your shoulders.'],
    why: 'A clenched jaw is one of the most common ways we brace against stress, and it feeds tension into the head and neck. Letting it go sends a quick “stand down” signal to the body.',
    guide: { t: 'steps', each: 15, loop: true } },
  { id: 'wallpush', name: 'Wall push', cat: 'move', durs: [1, 2, 3], def: 1, good: ['quick', 'high', 'anger'],
    short: 'Push against a wall as hard as is comfortable, then let go. Somewhere for “fight” energy to go.',
    steps: ['Stand an arm’s length from a wall with your palms flat on it at shoulder height.', 'Push as if you’re trying to move the wall. Feel it through your arms, back and legs. Hold for about 10 seconds.', 'Let go and step back. Notice your arms and hands.', 'Rest, then repeat 3 to 5 times.'],
    why: 'When you’re angry or keyed up, your muscles are primed for action. Pushing gives that energy a safe outlet, and strong pressure through your joints is calming.',
    caution: 'Push firmly but don’t strain, and stop if anything hurts.',
    guide: { t: 'steps', s: [['Palms flat on the wall at shoulder height.', 5, 0], ['Push! As if you could move the wall.', 10, 0], ['Let go. Step back and notice your arms.', 15, 1]], loop: true } },
  { id: 'sway', name: 'Rock or sway', cat: 'move', durs: [1, 2, 3, 5, 10], def: 3, good: ['high', 'anxious', 'sleep', 'discreet'],
    short: 'Rock gently forward and back, or side to side, in a slow, steady rhythm.',
    steps: ['Sitting or standing, start to rock gently forward and back, or side to side.', 'Find a slow, steady rhythm that feels soothing. Follow the pace on screen if it helps.', 'Let your breathing settle into the rhythm.', 'Keep going for as long as it feels good.'],
    why: 'Rhythmic, repetitive movement is one of the oldest ways humans soothe: it’s how we calm babies. Rocking settles the nervous system through the balance organs in your inner ear.',
    guide: { t: 'sway', rates: [[5, 'Slow'], [4, 'Steady'], [3, 'Quicker']] } },
  { id: 'walk', name: 'Slow walk', cat: 'move', durs: [2, 5, 10, 15, 20], def: 5, good: ['anxious', 'high', 'anger', 'low'],
    short: 'Walk slowly and feel each step: heel, sole, toes. Match your breath to your steps.',
    steps: ['Walk at about half your normal speed, indoors or out.', 'Feel each foot: the heel landing, the roll through the sole, the push from your toes.', 'Breathe in for 3 or 4 steps and out for 4 to 6 steps.', 'Let your arms swing loosely and your eyes take in what’s around you.', 'If your mind wanders, come back to the feeling of your feet.'],
    why: 'Walking combines rhythm, movement and taking in your surroundings, and gives stress chemicals somewhere to go. Slowing it down and pairing steps with breath makes it calming rather than energising.',
    guide: { t: 'steps', each: 45, loop: true } },
  { id: 'yawn', name: 'Yawn and stretch', cat: 'move', durs: [1, 2, 3], def: 1, good: ['quick', 'shutdown', 'tension'],
    short: 'Stretch like a cat after a nap and let a yawn come. Fake one until a real one arrives.',
    steps: ['Reach your arms up high and wide. Spread your fingers.', 'Arch and twist gently, stretching wherever feels good.', 'Open your mouth wide and fake a big yawn. Keep going until a real one comes.', 'Let your arms drop and shake out your hands.'],
    why: 'Yawning and stretching together (pandiculation) are the body’s natural reset: they wake the muscles up and shift you out of high alert. Yawns often arrive by themselves as you settle.',
    guide: { t: 'steps', each: 15, loop: true } },
  { id: 'bounce', name: 'Gentle bounce', cat: 'move', durs: [1, 2, 3], def: 1, good: ['quick', 'shutdown', 'low'],
    short: 'Bounce lightly through your heels and let your arms hang loose. Good for foggy, flat or numb.',
    steps: ['Stand with soft knees and your feet hip-width apart.', 'Bounce gently up and down through your heels, keeping your toes on the floor.', 'Let your arms, shoulders and jaw hang loose and jiggle.', 'Gradually slow down and stop. Notice the tingling and aliveness.'],
    why: 'When you’re shut down, gentle rhythmic movement brings energy back into the body without a shock. Bouncing wakes up your circulation and your sense of where your body is.',
    caution: 'Hold on to a chair or wall if your balance isn’t great.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'cross', name: 'Cross-body march', cat: 'move', durs: [1, 2, 3], def: 1, good: ['quick', 'shutdown'],
    short: 'March on the spot, touching each hand to the opposite knee.',
    steps: ['March slowly on the spot.', 'As each knee lifts, touch it with the opposite hand.', 'Keep a steady rhythm. Follow the left-right pace on screen.', 'Breathe easily. Slow down gradually to finish.'],
    why: 'Crossing the middle of your body uses both sides together, and a steady left-right rhythm is regulating. It’s a good way to wake up when you feel foggy or frozen.',
    caution: 'Do it sitting down, touching opposite knees, if standing isn’t comfortable.',
    guide: { t: 'bilateral', rates: [[0.8, 'Slow'], [1.1, 'Steady']] } },

  /* ---------- voice, face and cold (vagus nerve) ---------- */
  { id: 'cold', name: 'Cold water on your face', cat: 'vagus', durs: [0.5, 1, 2], def: 0.5, good: ['quick', 'high', 'anger'],
    short: 'Cold on your face while you hold your breath triggers the dive reflex and slows your heart, fast.',
    steps: ['Fill a bowl with cold water (add ice if you like), or grab a cold pack or frozen peas wrapped in a cloth.', 'Take a breath and hold it.', 'Put your face in the water, or hold the cold pack over your eyes and cheeks, for 15 to 30 seconds.', 'Come up, breathe slowly, and repeat if you need to.', 'No bowl? Splash cold water on your face, or hold something cold to your eyes and cheeks.'],
    why: 'Cold on your face plus a held breath sets off the mammalian dive reflex, which slows your heart within seconds. It’s the “T” (temperature) in the TIPP skills from dialectical behaviour therapy (DBT), used for very high distress.',
    caution: 'Check with your doctor first if you have a heart condition, a slow heart rate or an eating disorder, or take heart medication. Keep breath holds short and comfortable.',
    guide: { t: 'steps', s: [['Get your cold water or cold pack ready.', 8, 0], ['Breathe in and hold your breath.', 3, 0], ['Face in the cold now. Keep holding your breath.', 20, 0], ['Come up. Breathe slowly and gently.', 15, 1]], loop: true } },
  { id: 'hum', name: 'Humming breath', cat: 'vagus', durs: [1, 2, 3, 5, 10], def: 3, good: ['anxious', 'high', 'shutdown', 'sleep'],
    short: 'Breathe in through your nose, then hum on a long out-breath. Feel the buzz in your face and chest.',
    steps: ['Sit comfortably. Relax your jaw and close your lips gently.', 'Breathe in through your nose.', 'Hum on the out-breath, low and steady, until your breath runs out naturally.', 'Feel the vibration in your lips, face, throat and chest.', 'For more calm, cover your ears with your thumbs while you hum (bee breath).'],
    why: 'Humming vibrates your vocal cords, which are wired to the vagus nerve, and stretches out the out-breath. It also boosts nitric oxide in your nose. In yoga it’s called bhramari, or bee breath.',
    guide: { t: 'breath', p: [{ id: '4-8', label: '4 in · 8 hum', ph: [['in', 4], ['out', 8, 'Hummm…']] }, { id: '3-6', label: '3 in · 6 hum', ph: [['in', 3], ['out', 6, 'Hummm…']] }, { id: '5-10', label: '5 in · 10 hum', ph: [['in', 5], ['out', 10, 'Hummm…']] }] } },
  { id: 'voo', name: 'Voo breath', cat: 'vagus', durs: [1, 2, 3, 5], def: 2, good: ['high', 'anxious', 'shutdown'],
    short: 'On a long out-breath, make a deep, low “voooo” sound, like a foghorn, and feel it in your belly.',
    steps: ['Breathe in gently and fully.', 'As you breathe out, make a deep, low “voooo” sound, like a distant foghorn.', 'Let the sound vibrate down into your belly. Go as low as is comfortable.', 'At the end of the breath, pause. Let the next breath come in by itself.'],
    why: 'From Peter Levine’s Somatic Experiencing. The low vibration stimulates your belly and chest, where the vagus nerve runs, and the long sound slows your breathing down.',
    guide: { t: 'breath', p: [{ id: 'std', label: 'Standard', ph: [['in', 3.5], ['out', 9, 'Voooooo…'], ['rest', 2.5, 'Pause']] }, { id: 'short', label: 'Shorter', ph: [['in', 3], ['out', 6, 'Voooooo…'], ['rest', 2, 'Pause']] }] } },
  { id: 'sing', name: 'Sing or chant', cat: 'vagus', durs: [1, 2, 3, 5, 10], def: 3, good: ['shutdown', 'low', 'anxious'],
    short: 'Sing a song you love, loud or soft. The car and the shower count.',
    steps: ['Pick a song you know and love. Songs with long notes are ideal.', 'Sing it, loud or soft. It doesn’t need to sound good.', 'Let your out-breaths be long and full.', 'Notice how your body feels when the song ends.'],
    why: 'Singing lengthens your out-breath and works the muscles of your throat and face, which are linked to the vagus nerve. Studies of singing, especially in groups, show lower stress and better mood.',
    guide: { t: 'steps', each: 40, loop: true } },
  { id: 'eyes', name: 'Eye reset', cat: 'vagus', durs: [1, 2, 3], def: 2, good: ['tension', 'anxious'],
    short: 'With your hands behind your head, look to one side with just your eyes until you sigh, yawn or swallow.',
    steps: ['Sit or lie down and interlace your fingers behind your head.', 'Keep your head still and look to the right with just your eyes.', 'Stay there for 30 to 60 seconds, until you notice a sigh, yawn or swallow.', 'Bring your eyes back to the middle, then do the same to the left.'],
    why: 'From Stanley Rosenberg’s book on the vagus nerve. Many people notice a sigh, swallow or yawn: signs the body is shifting into a calmer state. Some find it eases neck and shoulder tension too.',
    guide: { t: 'steps', s: [['Fingers laced behind your head. Keep your head still.', 6, 0], ['Look to the right with just your eyes. Wait for a sigh, yawn or swallow.', 45, 1], ['Eyes back to the middle. Breathe.', 6, 0], ['Now look to the left with just your eyes. Wait for a sigh, yawn or swallow.', 45, 1], ['Eyes back to the middle. Rest your arms.', 10, 0]], stretch: true } },
  { id: 'ears', name: 'Ear massage', cat: 'vagus', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'anxious', 'tension'],
    short: 'Gently squeeze, roll and stretch your ears, and rub the hollow just inside the ear.',
    steps: ['Hold the tops of your ears between thumb and finger. Squeeze and roll gently, working down to the lobes.', 'Gently pull your earlobes down and out a few times.', 'With a fingertip, rub slow circles in the hollow just inside your ear (not in the ear canal).', 'Cup your hands over your ears and enjoy the quiet for a few breaths.'],
    why: 'Part of the outer ear is supplied by a branch of the vagus nerve, which is why medical ear-stimulation devices target it. Gentle massage is soothing, and many people find it settling.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'halfsmile', name: 'Soft face, half-smile', cat: 'vagus', durs: [1, 2, 3], def: 1, good: ['quick', 'discreet', 'anger', 'anxious'],
    short: 'Relax your face from forehead to chin and let the corners of your mouth lift slightly.',
    steps: ['Soften your forehead and the space between your eyebrows.', 'Let your eyes go soft, as if looking at something you love.', 'Unclench your jaw and let your tongue rest.', 'Let the corners of your lips turn up very slightly: a half-smile, with a relaxed face.', 'Rest your hands in your lap, palms up and open.'],
    why: 'Your face and nervous system talk both ways. Relaxing your face into a gentle half-smile (a DBT skill) sends safety signals back to the brain, and open palms (“willing hands”) ease the body’s readiness to fight.',
    guide: { t: 'steps', each: 15, loop: true } },

  /* ---------- rest and imagery ---------- */
  { id: 'scan', name: 'Body scan', cat: 'rest', durs: [3, 5, 10, 15, 20, 30], def: 10, good: ['sleep', 'tension', 'anxious'],
    short: 'Move your attention slowly through your body, noticing and softening as you go.',
    steps: ['Lie down or sit back comfortably. Let your eyes close or rest on the floor.', 'Move your attention slowly through your body, from your feet up to your head.', 'In each area, notice what’s there: warmth, tingling, tightness, or nothing at all.', 'Breathe into anything tight and let it soften on the out-breath. There’s no need to change anything.', 'Follow the prompts on screen.'],
    why: 'Slow, curious attention to the body builds interoception, your sense of what’s happening inside you, and often releases tension you didn’t know you were holding. It’s at the heart of mindfulness-based stress reduction.',
    guide: { t: 'steps', s: SCAN_STEPS, stretch: true } },
  { id: 'safe', name: 'Safe place', cat: 'rest', durs: [2, 3, 5, 10, 15], def: 5, good: ['anxious', 'sleep', 'low'],
    short: 'Picture a place where you feel safe and at ease, and let your body soak it up.',
    steps: ['Get comfortable and close your eyes if you like.', 'Bring to mind a place where you feel safe and at ease. It can be real, remembered or imagined.', 'Notice what you can see there: colours, light, shapes.', 'What can you hear? What can you smell? Is it warm or cool?', 'Notice where in your body you feel the ease. Let it spread.', 'Stay as long as you like. You can come back here any time.'],
    why: 'Your nervous system responds to what you imagine, not just what’s in front of you. Time in a safe place in your mind lets your body rehearse calm, and makes it easier to find again.',
    guide: { t: 'steps', w: [8, 14, 18, 20, 22, 18], stretch: true } },
  { id: 'resource', name: 'Someone on your side', cat: 'rest', durs: [1, 2, 3, 5], def: 2, good: ['anxious', 'low', 'high'],
    short: 'Bring to mind a person, pet or place that makes you feel safe or loved, and notice your body respond.',
    steps: ['Think of someone who makes you feel safe, loved or understood. A person, a pet, even a character.', 'Picture them with you as clearly as you can: their face, their voice, how it feels to be near them.', 'Notice what happens in your body: warmth, softening, a deeper breath, a smile.', 'Stay with those feelings. Let them grow if they want to.'],
    why: 'In Somatic Experiencing this is called resourcing. Feeling connected to someone, even in your imagination, switches on the social side of your nervous system: the opposite of fight or flight.',
    guide: { t: 'steps', w: [20, 30, 30, 20], stretch: true } },
  { id: 'pendulate', name: 'Pendulation', cat: 'rest', durs: [2, 3, 5, 10], def: 3, good: ['tension', 'anxious'],
    short: 'Swing your attention gently between somewhere that feels OK and somewhere tense or sore.',
    steps: ['Find a place in your body that feels OK, neutral or even pleasant: your hands, your feet, your back against the chair.', 'Rest your attention there for a while.', 'Now briefly notice a place that feels tense, sore or uncomfortable. Just a quick visit.', 'Come back to the OK place and rest there again.', 'Keep swinging gently between the two, spending longer in the OK place.'],
    why: 'From Somatic Experiencing. Moving between discomfort and ease, a little at a time, helps your nervous system work through stress without getting flooded. Often the uncomfortable place softens by itself.',
    guide: { t: 'steps', s: [['Find a place in your body that feels OK, neutral or even pleasant.', 15, 0], ['Rest your attention in the OK place.', 30, 1], ['Briefly visit a place that feels tense or uncomfortable.', 10, 0], ['Come back to the OK place. Rest there.', 30, 1]], loop: true, from: 1 } },
  { id: 'glimmers', name: 'Glimmers', cat: 'rest', durs: [1, 2, 3, 5], def: 2, good: ['low', 'shutdown', 'discreet'],
    short: 'Look for small moments of safety or joy, and let each one land in your body.',
    steps: ['Look around, or think back over today, for a glimmer: a small moment of safety, connection or joy.', 'Maybe sunlight on a wall, a good coffee, a kind message, a bird, a smell you love.', 'When you find one, pause on it for a few breaths. Let it land in your body.', 'Notice how your body responds, even slightly. Then look for another.'],
    why: 'Glimmers, a term from polyvagal therapist Deb Dana, are the opposite of triggers: small cues of safety. Noticing them on purpose trains your nervous system to spot safety, not just danger.',
    guide: { t: 'steps', each: 30, loop: true } },
  { id: 'container', name: 'Container', cat: 'rest', durs: [1, 2, 3, 5], def: 2, good: ['anxious', 'sleep', 'high'],
    short: 'Imagine putting what’s bothering you into a strong container, to come back to later.',
    steps: ['Imagine a container strong enough to hold what’s bothering you: a box, a safe, a jar with a lid.', 'Picture it in detail: its size, colour, material, and how it closes.', 'Put the worries, images or feelings inside, one by one. You can write them on paper in your mind first.', 'Close it firmly. Lock it if you like.', 'Put it somewhere safe. You can open it later, when you choose to.'],
    why: 'Used in trauma therapy to set distressing things aside for now, so you can get on with your day or get to sleep. You’re not getting rid of them, just choosing when to deal with them.',
    guide: { t: 'steps', w: [20, 20, 30, 15, 15], stretch: true } },
  { id: 'kind', name: 'Kind words', cat: 'rest', durs: [1, 2, 3, 5], def: 1, good: ['quick', 'low', 'anxious'],
    short: 'With a hand on your heart, speak to yourself the way you would to a good friend who’s struggling.',
    steps: ['Put a hand on your heart, or wherever feels comforting.', 'Say to yourself, slowly: “This is a moment of struggle.”', '“Struggle is part of being human. I’m not alone in this.”', '“May I be kind to myself. May I give myself what I need.”', 'Or find your own words: the kind you’d say to a friend.'],
    why: 'This is Kristin Neff’s self-compassion break. Self-criticism keeps your threat system switched on, while kindness and warm touch switch on your soothing system. Self-compassion is linked to lower anxiety and stress.',
    guide: { t: 'steps', each: 20, loop: true } },
  { id: 'legsup', name: 'Legs up the wall', cat: 'rest', durs: [3, 5, 10, 15], def: 5, good: ['sleep', 'tension', 'high'],
    short: 'Lie on your back with your legs resting up a wall or on a chair. Deeply restful.',
    steps: ['Sit sideways next to a wall, then swing your legs up as you lie back. Or rest your calves on a chair or the couch.', 'Let your arms rest by your sides, palms up.', 'Close your eyes and let your breathing slow down.', 'Let the floor take your full weight.', 'To come out, bend your knees and roll onto your side for a few breaths before sitting up.'],
    why: 'Lying down with your legs raised helps blood flow back to your heart, which triggers a reflex that slows your heart rate. With the floor taking your weight, your muscles can fully let go.',
    caution: 'Skip it if you have glaucoma, are in later pregnancy, or it strains your back or hips. Come up slowly.',
    guide: { t: 'steps', w: [10, 10, 30, 35, 15], stretch: true } },
  { id: 'child', name: 'Child’s pose', cat: 'rest', durs: [1, 2, 3, 5], def: 2, good: ['tension', 'sleep', 'high'],
    short: 'Kneel, sit back on your heels and fold forward with your forehead down. Breathe into your back.',
    steps: ['Kneel on the floor with your big toes together and your knees apart.', 'Sit back towards your heels and fold forward, resting your forehead on the floor or a cushion.', 'Let your arms rest by your sides, or stretch them out in front.', 'Breathe slowly into your back and feel it widen.', 'Stay as long as is comfortable. Come up slowly.'],
    why: 'Folding forward is a naturally protective, comforting shape. Resting your forehead calms the body, and breathing into your back gently stretches tight muscles.',
    caution: 'Put a cushion under your hips or knees if they’re uncomfortable. Skip it if you have knee or hip injuries.',
    guide: { t: 'steps', w: [10, 15, 10, 45, 20], stretch: true } },
  { id: 'heavy', name: 'Heavy rest', cat: 'rest', durs: [3, 5, 10, 15, 20], def: 10, good: ['sleep', 'high', 'tension'],
    short: 'Lie under a heavy blanket, or rest a pillow on your belly, and let your body sink.',
    steps: ['Lie down under a heavy blanket, or rest a pillow or folded blanket on your belly or lap.', 'Let the surface beneath you take all your weight.', 'With each out-breath, let yourself sink a little more.', 'Notice the weight on top of you and the support below.', 'Let your mind drift. There’s nothing to do right now.'],
    why: 'Gentle pressure on the body, like a weighted blanket, calms the nervous system, and lying fully supported lets your muscles stop holding you up. Many people find it helps them drop into rest or sleep.',
    guide: { t: 'steps', w: [15, 15, 25, 20, 25], stretch: true } },
  { id: 'sounds', name: 'Nature sounds', cat: 'rest', durs: [3, 5, 10, 15, 20, 30], def: 10, good: ['sleep', 'anxious', 'high'],
    short: 'Rest and listen to rain, ocean waves, a forest, a stream or crickets at night.',
    steps: ['Get comfortable and pick a sound you like.', 'Let your eyes close, or rest them on the picture.', 'Let your breathing slow down and follow the sound.', 'When your mind wanders, come back to listening.'],
    why: 'Natural sounds like rain, waves and birdsong are linked to lower stress and a shift towards rest. Listening gives your attention somewhere gentle to settle. The sounds are made by the app, so they work offline.',
    guide: { t: 'scape' } },
];
const toolById = id => TOOL_MAP[id] || otherTool(id);
const toolName = id => { const t = toolById(id); return t ? t.name : String(id).startsWith('r-') ? 'A deleted routine' : String(id).startsWith('u-') ? 'A deleted tool' : 'A tool'; };
const TOOL_MAP = Object.create(null);
TOOLS.forEach(t => { TOOL_MAP[t.id] = t; });
// Your own tools (u-…) work like built-in ones: their steps are paced across the time you choose.
function customTool(c) {
  const steps = c.steps.length ? c.steps : [c.short || `Take your time with ${c.name}.`];
  return Object.assign({}, c, { steps, why: '', custom: true, guide: { t: 'steps', w: steps.map(() => 1), stretch: true } });
}
// A routine (r-…) is a chain of tools run one after another.
function routineTool(r) {
  const total = sum(r.steps.map(s => s.mins));
  return { id: r.id, name: r.name, cat: 'routine', routine: r, short: r.steps.map(s => `${toolName(s.tool)} ${durLabel(s.mins)}`).join(' → '),
    steps: r.steps.map(s => `${toolName(s.tool)} for ${durLabel(s.mins)}`), why: '', durs: [total], def: total, good: [], guide: { t: 'routine' } };
}
function otherTool(id) {
  id = String(id || '');
  if (id.startsWith('u-')) { const c = S.custom.find(x => x.id === id); return c ? customTool(c) : null; }
  if (id.startsWith('r-')) { const r = S.routines.find(x => x.id === id); return r ? routineTool(r) : null; }
  return null;
}
const allTools = () => TOOLS.concat(S.custom.map(customTool));

const DEFAULTS = {
  routines: [
    { id: 'r-sos', name: 'SOS', steps: [{ tool: 'sigh', mins: 1, pattern: '' }, { tool: 'feet', mins: 1, pattern: '' }, { tool: '54321', mins: 2, pattern: '' }] },
    { id: 'r-morning', name: 'Morning reset', steps: [{ tool: 'sigh', mins: 1, pattern: '' }, { tool: 'shake', mins: 2, pattern: '' }, { tool: 'orient', mins: 2, pattern: '' }] },
    { id: 'r-desk', name: 'Desk reset', steps: [{ tool: 'jaw', mins: 1, pattern: '' }, { tool: 'wide', mins: 1, pattern: '' }, { tool: 'exhale', mins: 2, pattern: '' }] },
    { id: 'r-winddown', name: 'Wind down', steps: [{ tool: 'exhale', mins: 3, pattern: '' }, { tool: 'legsup', mins: 5, pattern: '' }, { tool: 'scan', mins: 10, pattern: '' }] },
  ],
  triggers: ['Conflict', 'Deadline', 'Running late', 'Crowds', 'Loud noise', 'Bad news', 'Feeling judged', 'Too much to do', 'Physical pain', 'A memory', 'Tired', 'Hungry'],
  pros: [{ name: 'Lifeline (any time)', phone: '13 11 14' }, { name: 'Beyond Blue (any time)', phone: '1300 22 4636' }, { name: 'Emergency', phone: '000' }],
};

/* ---------- body sensations and glimmers ---------- */
const QUALS = [['tight', 'Tight'], ['pain', 'Pain'], ['ache', 'Aching'], ['buzz', 'Buzzing'], ['tingle', 'Tingling'], ['heavy', 'Heavy'], ['numb', 'Numb'], ['flutter', 'Fluttery'], ['warm', 'Warm'], ['cold', 'Cold']];
const QUAL_LABEL = Object.fromEntries(QUALS);
const qualText = v => (v.q || []).map(q => QUAL_LABEL[q] || q).join(', ');
const GKINDS = [['nature', 'Nature'], ['people', 'People'], ['animals', 'Animals'], ['music', 'Music'], ['food', 'Food and drink'], ['comfort', 'Comfort'], ['beauty', 'Beauty'], ['moment', 'A small moment']];
const GKIND_LABEL = Object.fromEntries(GKINDS);
const SLEEP_Q = ['Terrible', 'Poor', 'OK', 'Good', 'Great'];
const ENERGY = ['Drained', 'Low', 'OK', 'Good', 'Full of energy'];

// Durations offered for a tool: its own suggestions plus the full set, so you can always pick 1, 5, 10 min etc.
const ALL_DURS = [0.5, 1, 2, 3, 5, 10, 15, 20, 30];
const durLabel = m => (m < 1 ? `${Math.round(m * 60)} sec` : Math.abs(m - Math.round(m)) < 0.01 ? `${Math.round(m)} min` : m * 2 === Math.round(m * 2) ? `${m} min` : fmtSecs(m * 60));

/* ---------- feelings and what's going on ---------- */
const FEELS = [
  { g: 'Settled', items: [['calm', 'Calm'], ['safe', 'Safe'], ['grounded', 'Grounded'], ['connected', 'Connected'], ['content', 'Content'], ['rested', 'Rested']] },
  { g: 'Activated', items: [['anxious', 'Anxious'], ['onedge', 'On edge'], ['wired', 'Wired'], ['restless', 'Restless'], ['irritable', 'Irritable'], ['angry', 'Angry'], ['overwhelmed', 'Overwhelmed'], ['panicky', 'Panicky'], ['scared', 'Scared'], ['rushed', 'Rushed']] },
  { g: 'Low or shut down', items: [['numb', 'Numb'], ['foggy', 'Foggy'], ['flat', 'Flat'], ['heavy', 'Heavy'], ['exhausted', 'Exhausted'], ['disconnected', 'Disconnected'], ['frozen', 'Frozen'], ['sad', 'Sad']] },
];
const FEEL_LABEL = Object.fromEntries(FEELS.flatMap(g => g.items));
const feelLabel = id => (own(FEEL_LABEL, id) ? FEEL_LABEL[id] : id);
const SHUTDOWN_FEELS = ['numb', 'foggy', 'flat', 'heavy', 'exhausted', 'disconnected', 'frozen'];
const TAGS = [['work', 'Work'], ['family', 'Family'], ['partner', 'Partner'], ['friends', 'Friends'], ['social', 'Social'], ['health', 'Health'], ['sleep', 'Sleep'], ['food', 'Food'], ['caffeine', 'Caffeine'], ['exercise', 'Exercise'], ['money', 'Money'], ['commute', 'Commute'], ['screens', 'Screens'], ['news', 'News'], ['noise', 'Noise'], ['alone', 'Alone time']];
const TAG_LABEL = Object.fromEntries(TAGS);
const tagLabel = id => (own(TAG_LABEL, id) ? TAG_LABEL[id] : String(id).replace(/^c:/, ''));

/* ---------- body areas ---------- */
const REGIONS = {
  head: 'Head (forehead and temples)', jaw: 'Jaw and face', headBack: 'Back of head', throat: 'Throat', neck: 'Neck',
  shoulderL: 'Left shoulder', shoulderR: 'Right shoulder', chest: 'Chest', upperBack: 'Upper back', stomach: 'Stomach', lowerBack: 'Lower back',
  hipL: 'Left hip and glute', hipR: 'Right hip and glute', armL: 'Left upper arm', armR: 'Right upper arm', forearmL: 'Left forearm', forearmR: 'Right forearm',
  handL: 'Left hand', handR: 'Right hand', thighL: 'Left thigh', thighR: 'Right thigh', kneeL: 'Left knee', kneeR: 'Right knee',
  calfL: 'Left lower leg', calfR: 'Right lower leg', footL: 'Left foot', footR: 'Right foot',
};
const REGION_SHORT = { head: 'Head', jaw: 'Jaw', headBack: 'Back of head', hipL: 'Left hip', hipR: 'Right hip' };
const regionName = id => (own(REGIONS, id) ? REGIONS[id] : id);
const regionShort = id => (own(REGION_SHORT, id) ? REGION_SHORT[id] : regionName(id));
const REGION_GROUPS = [
  ['Head and neck', ['head', 'jaw', 'headBack', 'throat', 'neck']],
  ['Torso', ['shoulderL', 'shoulderR', 'chest', 'upperBack', 'stomach', 'lowerBack', 'hipL', 'hipR']],
  ['Arms', ['armL', 'armR', 'forearmL', 'forearmR', 'handL', 'handR']],
  ['Legs', ['thighL', 'thighR', 'kneeL', 'kneeR', 'calfL', 'calfR', 'footL', 'footR']],
];
const KINDS = { t: 'Tension', p: 'Pain', b: 'Pain and tension' };
const bodyList = b => Object.entries(b || {}).sort((x, y) => y[1].n - x[1].n);
const bodySummary = (b, max = 3) => {
  const l = bodyList(b);
  if (!l.length) return '';
  return l.slice(0, max).map(([k, v]) => `${regionShort(k)} ${v.n}`).join(' · ') + (l.length > max ? ` · +${l.length - max}` : '');
};
