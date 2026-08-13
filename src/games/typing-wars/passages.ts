export const PASSAGES: string[] = [
  'The quick brown fox jumps over the lazy dog while the sun sets slowly behind the distant hills, painting the sky in shades of orange and purple.',
  'Success is not final and failure is not fatal. It is the courage to continue that counts most when the road ahead grows long and uncertain.',
  'A good programmer is someone who always looks both ways before crossing a one way street, and who never trusts a comment more than the code itself.',
  'In the middle of every difficulty lies opportunity, and those who learn to type quickly and accurately often find their thoughts moving faster too.',
  'The only way to do great work is to love what you do. If you have not found it yet, keep looking. Do not settle, for time is precious and short.',
  'Typing quickly is a skill built through repetition, patience, and focus. Every keystroke you make trains your fingers to move with less hesitation.',
  'Simplicity is the ultimate sophistication, and often the hardest thing to achieve, whether you are designing software or writing a single sentence.',
  'The stars above the quiet valley shimmered like scattered diamonds, while a cool breeze carried the scent of pine trees through the silent night.',
  'Practice does not make perfect, but perfect practice makes progress, and every small improvement compounds over weeks and months of steady effort.',
  'Curiosity is the engine of achievement, and those who ask the most questions often uncover the answers that others walk right past every day.',
  'A ship in harbor is safe, but that is not what ships are built for. Sometimes the greatest risk in life is refusing to take one at all.',
  'The mountain climber paused at the ridge, breathing hard, and realized that the view was worth every aching step of the long, difficult climb.',
  'Every expert was once a beginner who refused to give up, and every masterpiece began as a rough draft nobody else was willing to see.',
  'Rain tapped gently against the window as she read late into the night, lost in a story about a kingdom hidden beneath the sea.',
  'The old clock in the hallway ticked steadily, marking each passing hour with a quiet patience that seemed to outlast every visitor who came and went.',
  'Innovation distinguishes between a leader and a follower, and the willingness to try something untested is often what separates the two.',
  'Deep in the forest, the river carved a path through solid rock, patient and unstoppable, shaping the land one drop of water at a time.',
  'Great things are never done alone, they are done by a team of people working together toward something larger than any single person.',
  'The chef moved with quiet precision, chopping vegetables in rhythm while the aroma of garlic and fresh herbs filled the small kitchen.',
  'Knowledge speaks, but wisdom listens, and the most valuable lessons often come from paying close attention rather than speaking first.',
  'Beneath the city streets, a network of tunnels carried trains full of commuters rushing toward jobs they had grown both to love and dread.',
  'The photographer waited hours for the perfect light, understanding that patience was as much a part of the craft as the camera itself.',
  'Change is the only constant in life, and those who adapt quickly to new circumstances tend to thrive where others struggle to keep up.',
  'A single candle can light a thousand others without diminishing its own flame, much like knowledge shared freely between people.',
  'The astronaut looked back at Earth from orbit and felt, for the first time, how small and fragile the whole planet truly seemed.',
  'Discipline is choosing between what you want now and what you want most, and that choice defines nearly everything that follows.',
  'The old librarian knew every shelf by heart, guiding visitors through the maze of books with a calm and practiced confidence.',
  'A journey of a thousand miles begins with a single step, and yet so many people hesitate before taking that very first one.',
  'The garden bloomed slowly through spring, each petal unfurling in its own time, indifferent to anyone waiting to see it finished.',
  'Great leaders inspire not through commands but through example, showing others what is possible before ever asking them to follow.',
  'The scientist repeated the experiment a dozen times, knowing that a single result meant little without consistent proof behind it.',
  'Snow fell silently over the sleeping town, covering rooftops and streets in a soft white blanket that muffled every ordinary sound.',
  'The musician practiced the same passage for hours, chasing a feeling more than a sound, until the notes finally felt like her own.',
  'Time spent laughing is never wasted, and the friendships built during difficult moments often become the strongest of all.',
  'The archaeologist brushed away centuries of dust to reveal a story that had been waiting patiently underground for generations.',
  'A well placed question can open more doors than a hundred confident answers, especially when curiosity leads the way forward.',
  'The lighthouse stood firm against the storm, its beam cutting through the darkness to guide ships safely home through the night.',
  'Habits are formed quietly, one small repeated choice at a time, until eventually they shape the entire direction of a life.',
  'The negotiation lasted late into the evening, both sides slowly finding common ground they had not expected to share.',
  'A quiet morning walk can clear the mind more effectively than hours spent staring at a screen searching for answers.',
  'The engineer double checked every calculation, aware that a single overlooked detail could compromise the entire structure.',
]

let lastIndex = -1

export function getRandomPassage(): string {
  if (PASSAGES.length === 1) return PASSAGES[0]
  let index = Math.floor(Math.random() * PASSAGES.length)
  while (index === lastIndex) {
    index = Math.floor(Math.random() * PASSAGES.length)
  }
  lastIndex = index
  return PASSAGES[index]
}
