export interface CategoryPrompt {
  category: string
  letter: string
}

/** category -> lowercase words used to validate answers for that category */
export const WORD_BANK: Record<string, string[]> = {
  Animals: [
    'ant', 'bear', 'cat', 'dog', 'elephant', 'fox', 'goat', 'horse', 'iguana', 'jaguar',
    'kangaroo', 'lion', 'monkey', 'newt', 'owl', 'panda', 'quail', 'rabbit', 'snake', 'shark',
    'sheep', 'sparrow', 'tiger', 'urchin', 'vulture', 'wolf', 'yak', 'zebra',
  ],
  Countries: [
    'argentina', 'brazil', 'canada', 'denmark', 'egypt', 'france', 'germany', 'hungary', 'india',
    'italy', 'japan', 'kenya', 'laos', 'mexico', 'norway', 'oman', 'peru', 'qatar', 'russia',
    'spain', 'sweden', 'switzerland', 'thailand', 'uganda', 'vietnam', 'yemen', 'zambia',
  ],
  Foods: [
    'apple', 'bacon', 'cheese', 'donut', 'egg', 'fries', 'grapes', 'honey', 'ice cream', 'jam',
    'kebab', 'lasagna', 'mango', 'noodles', 'orange', 'pasta', 'quiche', 'rice', 'salad', 'soup',
    'taco', 'udon', 'vanilla', 'waffle', 'yogurt', 'ziti',
  ],
  'Movies & Shows': [
    'avatar', 'batman', 'cars', 'dune', 'elf', 'frozen', 'gladiator', 'heat', 'inception', 'joker',
    'kingsman', 'lego movie', 'moana', 'nemo', 'oppenheimer', 'psycho', 'quantum leap', 'rocky',
    'shrek', 'titanic', 'up', 'vertigo', 'wall-e',
  ],
  'Sports & Games': [
    'archery', 'badminton', 'chess', 'darts', 'esports', 'fencing', 'golf', 'hockey', 'judo',
    'karate', 'lacrosse', 'mahjong', 'netball', 'olympics', 'polo', 'quidditch', 'rugby', 'soccer',
    'tennis', 'ultimate', 'volleyball', 'wrestling',
  ],
  Jobs: [
    'accountant', 'baker', 'chef', 'dentist', 'engineer', 'farmer', 'guard', 'hairdresser',
    'illustrator', 'janitor', 'kindergarten teacher', 'lawyer', 'mechanic', 'nurse', 'optometrist',
    'pilot', 'quantity surveyor', 'reporter', 'surgeon', 'teacher', 'usher', 'vet', 'welder',
  ],
}

export const CATEGORIES: string[] = Object.keys(WORD_BANK)

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

let lastCategory = ''

/** Picks a random category and a letter that has at least one valid word in that category's word bank. */
export function getRandomPrompt(): CategoryPrompt {
  let category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  if (CATEGORIES.length > 1) {
    while (category === lastCategory) {
      category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    }
  }
  lastCategory = category

  const availableLetters = LETTERS.filter((letter) =>
    WORD_BANK[category].some((word) => word[0].toUpperCase() === letter),
  )
  const letter = availableLetters[Math.floor(Math.random() * availableLetters.length)]

  return { category, letter }
}

/** An answer is valid if it starts with the round's letter and appears in that category's word bank. */
export function isValidAnswer(category: string, letter: string, answer: string): boolean {
  const trimmed = answer.trim().toLowerCase()
  if (!trimmed) return false
  if (trimmed[0].toUpperCase() !== letter.toUpperCase()) return false
  const bank = WORD_BANK[category] ?? []
  return bank.some((word) => word.toLowerCase() === trimmed)
}

/** All words in a category that start with the given letter, e.g. for showing examples or hints. */
export function wordsFor(category: string, letter: string): string[] {
  const bank = WORD_BANK[category] ?? []
  return bank.filter((word) => word[0].toUpperCase() === letter.toUpperCase())
}

/** A random word from this round's valid pool, used to build a length hint without spoiling which word it is. */
export function pickHintWord(category: string, letter: string): string | null {
  const words = wordsFor(category, letter)
  if (words.length === 0) return null
  return words[Math.floor(Math.random() * words.length)]
}
