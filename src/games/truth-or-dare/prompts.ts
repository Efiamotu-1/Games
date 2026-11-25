export type Level = 'chill' | 'party' | 'wild'
export type PromptKind = 'truth' | 'dare'

export const LEVELS: { id: Level; label: string; description: string }[] = [
  { id: 'chill', label: 'Chill', description: 'Friendly icebreakers. Safe for any group.' },
  { id: 'party', label: 'Party', description: 'Funny and a bit embarrassing. Good for friends.' },
  { id: 'wild', label: 'Wild', description: 'Bolder and more daring. For close friends only.' },
]

// Everything here is meant to be doable in a living room and safe to do: nothing dangerous,
// nothing involving alcohol, nothing sexual. Groups can still agree on their own off-limits topics.
export const BANK: Record<PromptKind, Record<Level, string[]>> = {
  truth: {
    chill: [
      'What is your most useless talent?',
      'What is the best meal you have ever eaten?',
      'What is a movie you secretly love but never admit to?',
      'What is your biggest pet peeve?',
      'If you could live anywhere in the world, where would it be?',
      'What was your favourite cartoon growing up?',
      'What is the weirdest food combination you enjoy?',
      'What is something you are scared of that most people are not?',
      'Which app do you spend the most time on?',
      'What is the best gift you have ever received?',
      'What would you do with a million dollars in the first hour?',
      'What is one thing you have never told anyone in this room?',
      'What song do you know every word to?',
      'What is your most embarrassing nickname?',
    ],
    party: [
      'What is the most embarrassing thing in your search history?',
      'What is the worst lie you have ever told?',
      'Who in this room would you trust the least with a secret?',
      'What is the most childish thing you still do?',
      'What is the longest you have gone without showering?',
      'What is your most cringe memory from school?',
      'Have you ever pretended to like a gift? Which one?',
      'What is the most embarrassing thing you have done in public?',
      'What is the last thing you Googled?',
      'Which person in this room do you think would survive longest in a zombie film?',
      'What is the worst text you have sent to the wrong person?',
      'What is the pettiest reason you stopped talking to someone?',
      'What is your guilty-pleasure song?',
      'If you had to swap lives with someone here for a week, who would it be?',
    ],
    wild: [
      'What is the biggest secret you have kept from your family?',
      'Who in this room do you think is the most likely to become famous, and why?',
      'What is the worst thing you have ever said about someone behind their back?',
      'What is something you did that you still feel guilty about?',
      'What is the most trouble you have ever been in?',
      'Which person here would you least want to be stuck in a lift with, and why?',
      'What is a rumour about you that is actually true?',
      'What is the most money you have wasted on something dumb?',
      'What is one thing you would change about your appearance?',
      'What is the biggest lie you told to get out of something?',
      'Who here do you think judges others the most?',
      'What is your biggest regret from the last year?',
      'What is the most embarrassing thing your parents have caught you doing?',
      'If you had to eliminate one person from this group, who would it be and why?',
    ],
  },
  dare: {
    chill: [
      'Do your best impression of someone in this room until they guess who it is.',
      'Sing the chorus of your favourite song as dramatically as you can.',
      'Talk in a robot voice until your next turn.',
      'Do 10 jumping jacks right now.',
      'Say the alphabet backwards as fast as you can.',
      'Show the last photo in your camera roll to the group.',
      'Balance something on your head for 30 seconds.',
      'Speak in an accent of the group’s choice for the next two minutes.',
      'Do your best runway walk across the room.',
      'Make up a one-line rap about the person on your left.',
      'Try to touch your nose with your tongue for 15 seconds.',
      'Hold a plank for 20 seconds.',
      'Act like a chicken until your next turn.',
      'Draw a portrait of someone here with your eyes closed and show everyone.',
    ],
    party: [
      'Let the group read out the last message you sent to anyone.',
      'Do an interpretive dance of your day today.',
      'Call someone and sing them “Happy Birthday”, whoever the group picks.',
      'Let someone post a harmless status of their choice from your phone.',
      'Eat a spoonful of a condiment the group chooses.',
      'Do your best dramatic movie-trailer voice reading a text from your phone.',
      'Let the group give you a new nickname and answer to it for the rest of the game.',
      'Show the 5th photo in your camera roll and explain it.',
      'Walk like a model, then a crab, then a penguin across the room.',
      'Wear socks on your hands until your next turn.',
      'Try to lick your elbow in front of everyone.',
      'Let the person on your right style your hair however they like.',
      'Make up and perform a 20-second commercial for an object in the room.',
      'Speak only in questions until your next turn.',
    ],
    wild: [
      'Let the group go through your recent photos for 30 seconds.',
      'Send a voice note singing to a contact the group picks.',
      'Post a silly selfie of the group’s choice as your story for an hour.',
      'Do a dramatic slow-motion replay of your most embarrassing moment.',
      'Let the group pick someone to text “I need to tell you something” and then say nothing.',
      'Do your best impression of every person in the room, one after another.',
      'Eat a spoonful of something the group mixes together from the kitchen.',
      'Let the group draw something on your face with a washable pen.',
      'Do a TikTok-style dance in front of everyone with no music.',
      'Say something you admire about each person in the room.',
      'Reveal your screen time for the last week to the group.',
      'Give a one-minute speech on why you should be president of this group.',
      'Swap your phone wallpaper with the person next to you for the rest of the game.',
      'Wear your clothes backwards for the next three rounds.',
    ],
  },
}

/** Mild forfeits for passing. */
export const PENALTIES: string[] = [
  'Do 10 squats.',
  'Do your best villain laugh for 10 seconds.',
  'Give everyone in the room a compliment.',
  'Speak in a whisper until your next turn.',
  'Hold a wall sit for 20 seconds.',
  'Do your best animal impression for the group.',
  'Spin around 5 times, then try to walk in a straight line.',
  'Tell the group a joke. If nobody laughs, tell another.',
  'Hum a song and have the group guess it.',
  'Stand on one leg until the next player finishes.',
]

function pickFrom(pool: string[], seen: string[]): string {
  const fresh = pool.filter((p) => !seen.includes(p))
  const source = fresh.length > 0 ? fresh : pool
  return source[Math.floor(Math.random() * source.length)]
}

export function pickPrompt(kind: PromptKind, level: Level, seen: string[]): string {
  return pickFrom(BANK[kind][level], seen)
}

export function pickPenalty(seen: string[]): string {
  return pickFrom(PENALTIES, seen)
}
