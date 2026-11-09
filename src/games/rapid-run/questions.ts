export type Level = 'normal' | 'expert'

export interface Question {
  category: string
  text: string
  /** Already shuffled for this deal. */
  options: string[]
  /** Index into options. */
  correct: number
  /** Base points before the streak multiplier. */
  points: number
}

export const LEVELS: { id: Level; label: string; points: number }[] = [
  { id: 'normal', label: 'Normal', points: 100 },
  { id: 'expert', label: 'Expert', points: 250 },
]

type Raw = [category: string, text: string, answer: string, wrong: [string, string, string, string]]

const NORMAL: Raw[] = [
  ['Science', 'Which gas do plants absorb from the air?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen']],
  ['Science', 'How many legs does a spider have?', '8', ['6', '10', '12', '4']],
  ['Science', 'Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Mercury', 'Saturn']],
  ['Science', 'What force pulls objects toward the Earth?', 'Gravity', ['Magnetism', 'Friction', 'Inertia', 'Tension']],
  ['Science', 'Which organ pumps blood around the body?', 'Heart', ['Liver', 'Lung', 'Kidney', 'Stomach']],
  ['Science', 'Which star is at the center of our solar system?', 'The Sun', ['Sirius', 'Polaris', 'Vega', 'Betelgeuse']],
  ['Science', 'At what temperature does water boil at sea level?', '100°C', ['90°C', '50°C', '150°C', '75°C']],
  ['Science', 'Which animal is a mammal?', 'Whale', ['Shark', 'Salmon', 'Octopus', 'Penguin']],

  ['History', 'In which year did World War II end?', '1945', ['1939', '1950', '1944', '1918']],
  ['History', 'Who was the first President of the United States?', 'George Washington', ['Abraham Lincoln', 'Thomas Jefferson', 'John Adams', 'Benjamin Franklin']],
  ['History', 'Which civilization built the pyramids of Giza?', 'Ancient Egyptians', ['Romans', 'Greeks', 'Mayans', 'Babylonians']],
  ['History', 'Which explorer reached the Americas in 1492?', 'Christopher Columbus', ['Marco Polo', 'Vasco da Gama', 'Ferdinand Magellan', 'James Cook']],
  ['History', 'In which ocean did the Titanic sink?', 'Atlantic', ['Pacific', 'Indian', 'Arctic', 'Southern']],
  ['History', 'Which wall fell in 1989?', 'The Berlin Wall', ['The Great Wall', "Hadrian's Wall", 'The Western Wall', 'Antonine Wall']],
  ['History', 'Who was the first person to walk on the Moon?', 'Neil Armstrong', ['Buzz Aldrin', 'Yuri Gagarin', 'John Glenn', 'Michael Collins']],
  ['History', 'Julius Caesar ruled which empire?', 'Roman', ['Ottoman', 'Persian', 'Greek', 'Carthaginian']],

  ['Geography', 'What is the capital of France?', 'Paris', ['Lyon', 'Marseille', 'Nice', 'Toulouse']],
  ['Geography', 'Which is the largest ocean?', 'Pacific', ['Atlantic', 'Indian', 'Arctic', 'Southern']],
  ['Geography', 'Which is the longest river in Africa?', 'Nile', ['Congo', 'Niger', 'Zambezi', 'Limpopo']],
  ['Geography', 'What is the capital of Japan?', 'Tokyo', ['Kyoto', 'Osaka', 'Seoul', 'Beijing']],
  ['Geography', 'Which continent is Egypt in?', 'Africa', ['Asia', 'Europe', 'South America', 'Australia']],
  ['Geography', 'What is the capital of Nigeria?', 'Abuja', ['Lagos', 'Kano', 'Accra', 'Port Harcourt']],
  ['Geography', 'Which is the tallest mountain above sea level?', 'Mount Everest', ['K2', 'Kilimanjaro', 'Mont Blanc', 'Denali']],
  ['Geography', 'Which country is shaped like a boot?', 'Italy', ['Spain', 'Greece', 'Portugal', 'France']],

  ['Mathematics', 'What is 7 × 8?', '56', ['54', '63', '48', '64']],
  ['Mathematics', 'How many sides does a hexagon have?', '6', ['5', '7', '8', '4']],
  ['Mathematics', 'What is the square root of 81?', '9', ['8', '7', '18', '10']],
  ['Mathematics', 'What is 15% of 200?', '30', ['20', '25', '35', '15']],
  ['Mathematics', 'What is 12 squared?', '144', ['124', '122', '164', '132']],
  ['Mathematics', 'Which of these is a prime number?', '13', ['15', '21', '27', '9']],
  ['Mathematics', 'How many degrees are in a right angle?', '90', ['45', '180', '100', '60']],
  ['Mathematics', 'What is 1000 ÷ 8?', '125', ['120', '150', '100', '112']],

  ['Technology', 'What does CPU stand for?', 'Central Processing Unit', ['Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit', 'Central Power Unit']],
  ['Technology', 'Who co-founded Microsoft with Paul Allen?', 'Bill Gates', ['Steve Jobs', 'Elon Musk', 'Mark Zuckerberg', 'Jeff Bezos']],
  ['Technology', 'What does "www" stand for?', 'World Wide Web', ['World Web Work', 'Wide World Web', 'Web World Wire', 'Web World Wide']],
  ['Technology', 'Which company makes the iPhone?', 'Apple', ['Samsung', 'Google', 'Nokia', 'Huawei']],
  ['Technology', 'What does HTML stand for?', 'HyperText Markup Language', ['HighText Machine Language', 'HyperTool Multi Language', 'Hyperlink Text Mode Logic', 'Home Tool Markup Language']],
  ['Technology', 'Binary code uses which digits?', '0 and 1', ['1 and 2', '0 to 9', '0 and 2', '0 and 9']],
  ['Technology', 'Which of these is a web browser?', 'Firefox', ['Excel', 'Photoshop', 'Spotify', 'Word']],
  ['Technology', 'What does USB stand for?', 'Universal Serial Bus', ['Unified Serial Block', 'Universal System Bridge', 'United Signal Bus', 'Universal Signal Buffer']],

  ['Sports', 'How many players per side are on the pitch in football (soccer)?', '11', ['9', '10', '12', '8']],
  ['Sports', 'How many rings are on the Olympic flag?', '5', ['4', '6', '7', '3']],
  ['Sports', 'Which sport is played at Wimbledon?', 'Tennis', ['Golf', 'Cricket', 'Rugby', 'Badminton']],
  ['Sports', 'How many points is a basketball free throw worth?', '1', ['2', '3', '0', '4']],
  ['Sports', 'Which country hosted the 2022 FIFA World Cup?', 'Qatar', ['Russia', 'Brazil', 'Germany', 'Japan']],
  ['Sports', 'Which country won the 2022 FIFA World Cup?', 'Argentina', ['France', 'Brazil', 'Croatia', 'England']],
  ['Sports', 'In golf, one stroke under par is called a what?', 'Birdie', ['Eagle', 'Bogey', 'Albatross', 'Condor']],
  ['Sports', 'About how long is a marathon?', '42 km', ['21 km', '30 km', '50 km', '35 km']],

  ['Pop Culture', 'Who plays Iron Man in the Marvel films?', 'Robert Downey Jr.', ['Chris Evans', 'Chris Hemsworth', 'Mark Ruffalo', 'Tom Holland']],
  ['Pop Culture', 'Which band sang "Bohemian Rhapsody"?', 'Queen', ['The Beatles', 'ABBA', 'Pink Floyd', 'Led Zeppelin']],
  ['Pop Culture', 'In which film does the character Simba appear?', 'The Lion King', ['Bambi', 'Moana', 'Tarzan', 'Frozen']],
  ['Pop Culture', 'Which school does Harry Potter attend?', 'Hogwarts', ['Beauxbatons', 'Durmstrang', 'Ilvermorny', 'Brakebills']],
  ['Pop Culture', 'What color is Shrek?', 'Green', ['Blue', 'Purple', 'Orange', 'Red']],
  ['Pop Culture', 'Which TV show features "the Upside Down"?', 'Stranger Things', ['Dark', 'Wednesday', 'The Witcher', 'Black Mirror']],
  ['Pop Culture', 'Who sang "Shape of You"?', 'Ed Sheeran', ['Justin Bieber', 'Sam Smith', 'Bruno Mars', 'Harry Styles']],
  ['Pop Culture', 'Which company created Mario?', 'Nintendo', ['Sega', 'Sony', 'Atari', 'Microsoft']],

  ['Literature', 'Who wrote Romeo and Juliet?', 'William Shakespeare', ['Charles Dickens', 'Jane Austen', 'Mark Twain', 'Christopher Marlowe']],
  ['Literature', 'Who wrote the Harry Potter books?', 'J.K. Rowling', ['Roald Dahl', 'C.S. Lewis', 'J.R.R. Tolkien', 'Philip Pullman']],
  ['Literature', 'Who wrote Pride and Prejudice?', 'Jane Austen', ['Emily Brontë', 'Charlotte Brontë', 'Mary Shelley', 'Louisa May Alcott']],
  ['Literature', 'Who wrote 1984?', 'George Orwell', ['Aldous Huxley', 'Ray Bradbury', 'H.G. Wells', 'Kurt Vonnegut']],
  ['Literature', 'What is the hobbit in "The Hobbit" called?', 'Bilbo Baggins', ['Frodo Baggins', 'Samwise Gamgee', 'Gandalf', 'Peregrin Took']],
  ['Literature', 'Who wrote Things Fall Apart?', 'Chinua Achebe', ['Wole Soyinka', 'Chimamanda Adichie', 'Ngũgĩ wa Thiong’o', 'Ben Okri']],
  ['Literature', 'Who wrote The Great Gatsby?', 'F. Scott Fitzgerald', ['Ernest Hemingway', 'John Steinbeck', 'William Faulkner', 'J.D. Salinger']],
  ['Literature', 'Who wrote Charlie and the Chocolate Factory?', 'Roald Dahl', ['Dr. Seuss', 'Enid Blyton', 'Beatrix Potter', 'Michael Morpurgo']],

  ['Science', 'Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Earth', 'Mars', 'Jupiter']],
  ['Science', 'What is the hardest natural substance?', 'Diamond', ['Gold', 'Iron', 'Quartz', 'Granite']],
  ['Science', 'Which gas do humans need to breathe in to survive?', 'Oxygen', ['Helium', 'Methane', 'Hydrogen', 'Argon']],
  ['Science', 'How many planets are in our solar system?', '8', ['7', '9', '10', '12']],
  ['Science', 'What is the largest organ of the human body?', 'Skin', ['Liver', 'Brain', 'Heart', 'Stomach']],
  ['Science', 'What type of animal is a Komodo dragon?', 'Lizard', ['Snake', 'Crocodile', 'Frog', 'Turtle']],
  ['Science', 'Which part of a plant mainly carries out photosynthesis?', 'Leaf', ['Root', 'Stem', 'Seed', 'Petal']],
  ['Science', 'What is the freezing point of water in Fahrenheit?', '32°F', ['0°F', '100°F', '212°F', '50°F']],
  ['Science', 'What is the center of an atom called?', 'Nucleus', ['Electron', 'Molecule', 'Membrane', 'Isotope']],
  ['Science', 'Which blood cells carry oxygen around the body?', 'Red blood cells', ['White blood cells', 'Platelets', 'Plasma', 'Antibodies']],
  ['Science', 'What do we call animals that eat only plants?', 'Herbivores', ['Carnivores', 'Omnivores', 'Insectivores', 'Scavengers']],
  ['Science', 'What is the chemical symbol for oxygen?', 'O', ['Ox', 'Og', 'On', 'Oz']],

  ['History', 'Which ancient wonder is the only one still standing today?', 'Great Pyramid of Giza', ['Colossus of Rhodes', 'Hanging Gardens of Babylon', 'Lighthouse of Alexandria', 'Temple of Artemis']],
  ['History', 'Who was the British Prime Minister for most of World War II?', 'Winston Churchill', ['Neville Chamberlain', 'Clement Attlee', 'Margaret Thatcher', 'Tony Blair']],
  ['History', 'Which country gave the Statue of Liberty to the United States?', 'France', ['Britain', 'Spain', 'Italy', 'Germany']],
  ['History', 'In which country did the Renaissance begin?', 'Italy', ['France', 'England', 'Spain', 'Germany']],
  ['History', 'Who painted the Mona Lisa?', 'Leonardo da Vinci', ['Michelangelo', 'Raphael', 'Vincent van Gogh', 'Pablo Picasso']],
  ['History', 'Which ship carried the Pilgrims to America in 1620?', 'Mayflower', ['Santa Maria', 'Titanic', 'Endeavour', 'Victory']],
  ['History', 'Who was nicknamed the "Iron Lady"?', 'Margaret Thatcher', ['Queen Victoria', 'Angela Merkel', 'Golda Meir', 'Indira Gandhi']],
  ['History', 'Which ancient people built Machu Picchu?', 'Incas', ['Aztecs', 'Mayans', 'Romans', 'Egyptians']],
  ['History', 'Which US president issued the Emancipation Proclamation?', 'Abraham Lincoln', ['George Washington', 'Ulysses S. Grant', 'Theodore Roosevelt', 'Thomas Jefferson']],
  ['History', 'In which year did Nigeria gain independence?', '1960', ['1957', '1963', '1950', '1970']],
  ['History', 'Which queen reigned over Britain for 63 years in the 1800s?', 'Queen Victoria', ['Elizabeth I', 'Queen Anne', 'Mary I', 'Elizabeth II']],
  ['History', 'What was the name of the first artificial satellite?', 'Sputnik 1', ['Explorer 1', 'Apollo 1', 'Vostok 1', 'Telstar']],

  ['Geography', 'Which is the largest country by area?', 'Russia', ['Canada', 'China', 'United States', 'Brazil']],
  ['Geography', 'What is the capital of Italy?', 'Rome', ['Milan', 'Venice', 'Naples', 'Florence']],
  ['Geography', 'What is the capital of Brazil?', 'Brasília', ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Buenos Aires']],
  ['Geography', 'Which river runs through London?', 'Thames', ['Seine', 'Danube', 'Rhine', 'Mersey']],
  ['Geography', 'Which is the largest continent?', 'Asia', ['Africa', 'Europe', 'North America', 'Antarctica']],
  ['Geography', 'What is the capital of Egypt?', 'Cairo', ['Alexandria', 'Giza', 'Luxor', 'Khartoum']],
  ['Geography', 'In which country is the city of Mumbai?', 'India', ['Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal']],
  ['Geography', 'Which desert covers much of northern Africa?', 'Sahara', ['Gobi', 'Kalahari', 'Namib', 'Atacama']],
  ['Geography', 'What is the capital of Kenya?', 'Nairobi', ['Mombasa', 'Kampala', 'Dar es Salaam', 'Addis Ababa']],
  ['Geography', 'Which country has a maple leaf on its flag?', 'Canada', ['Australia', 'Ireland', 'Norway', 'Switzerland']],
  ['Geography', 'What is the capital of Ghana?', 'Accra', ['Kumasi', 'Lagos', 'Abidjan', 'Dakar']],
  ['Geography', 'Which ocean lies between Africa and Australia?', 'Indian Ocean', ['Atlantic Ocean', 'Pacific Ocean', 'Arctic Ocean', 'Southern Ocean']],

  ['Mathematics', 'What is 9 × 9?', '81', ['72', '90', '99', '79']],
  ['Mathematics', 'What is half of 150?', '75', ['50', '65', '80', '70']],
  ['Mathematics', 'How many minutes are in 3 hours?', '180', ['120', '150', '200', '360']],
  ['Mathematics', 'What is 100 − 37?', '63', ['67', '73', '57', '53']],
  ['Mathematics', 'Which shape has four equal sides and four right angles?', 'Square', ['Rectangle', 'Rhombus', 'Trapezoid', 'Kite']],
  ['Mathematics', 'What is 25% of 80?', '20', ['25', '15', '10', '40']],
  ['Mathematics', 'How many sides does an octagon have?', '8', ['6', '7', '9', '10']],
  ['Mathematics', 'What comes next: 2, 4, 8, 16, …?', '32', ['24', '30', '28', '64']],
  ['Mathematics', 'What is 11 × 12?', '132', ['121', '144', '122', '112']],
  ['Mathematics', 'What is the perimeter of a square with sides of 5?', '20', ['25', '10', '15', '30']],
  ['Mathematics', 'Which of these is an even number?', '38', ['27', '51', '63', '49']],
  ['Mathematics', 'What is 3 cubed?', '27', ['9', '6', '18', '81']],

  ['Technology', 'Which company owns the Android operating system?', 'Google', ['Apple', 'Microsoft', 'Samsung', 'Nokia']],
  ['Technology', 'What does "AI" stand for in technology?', 'Artificial Intelligence', ['Automated Internet', 'Advanced Input', 'Applied Interface', 'Auto Integration']],
  ['Technology', 'What does GPS stand for?', 'Global Positioning System', ['General Positioning Signal', 'Global Procedure System', 'Geographic Path Sensor', 'Grand Position Service']],
  ['Technology', 'Which platform is known for posts of up to 280 characters?', 'X (Twitter)', ['Instagram', 'TikTok', 'Snapchat', 'LinkedIn']],
  ['Technology', 'What does PDF stand for?', 'Portable Document Format', ['Printed Digital File', 'Personal Data Form', 'Page Design Format', 'Portable Data File']],
  ['Technology', 'Which key deletes the character to the left of the cursor?', 'Backspace', ['Delete', 'Enter', 'Tab', 'Shift']],
  ['Technology', 'Which company makes the Windows operating system?', 'Microsoft', ['Apple', 'Google', 'IBM', 'Dell']],
  ['Technology', 'What does URL stand for?', 'Uniform Resource Locator', ['Universal Resource Link', 'Uniform Remote Locator', 'United Resource Language', 'Unified Routing Line']],
  ['Technology', 'Which company makes the PlayStation?', 'Sony', ['Nintendo', 'Microsoft', 'Sega', 'Atari']],
  ['Technology', "What is the name of Apple's voice assistant?", 'Siri', ['Alexa', 'Cortana', 'Bixby', 'Echo']],
  ['Technology', 'What is a "bug" in software?', 'An error in the code', ['A computer virus', 'A new feature', 'A backup copy', 'A type of cable']],
  ['Technology', 'Which of these is a programming language?', 'Python', ['Windows', 'Photoshop', 'Safari', 'Netflix']],

  ['Sports', 'How many players are on court for one volleyball team?', '6', ['5', '7', '8', '11']],
  ['Sports', 'In which sport do you score a touchdown?', 'American football', ['Baseball', 'Basketball', 'Ice hockey', 'Cricket']],
  ['Sports', 'What color card sends a football player off the pitch?', 'Red', ['Yellow', 'Blue', 'Green', 'Black']],
  ['Sports', 'How many holes are on a standard golf course?', '18', ['9', '12', '16', '20']],
  ['Sports', 'Which country invented cricket?', 'England', ['Australia', 'India', 'South Africa', 'New Zealand']],
  ['Sports', 'In which sport would you perform a slam dunk?', 'Basketball', ['Volleyball', 'Tennis', 'Handball', 'Netball']],
  ['Sports', 'What is the maximum score in one game of ten-pin bowling?', '300', ['100', '200', '250', '500']],
  ['Sports', 'Which boxer called himself "The Greatest"?', 'Muhammad Ali', ['Mike Tyson', 'Floyd Mayweather', 'Joe Frazier', 'George Foreman']],
  ['Sports', 'How long is an Olympic swimming pool?', '50 meters', ['25 meters', '100 meters', '75 meters', '200 meters']],
  ['Sports', 'In tennis, what is a score of zero called?', 'Love', ['Nil', 'Duck', 'Zip', 'Blank']],
  ['Sports', 'Which country is famous for sumo wrestling?', 'Japan', ['China', 'South Korea', 'Thailand', 'Vietnam']],
  ['Sports', 'How many players does a baseball team have on the field?', '9', ['7', '10', '11', '12']],

  ['Pop Culture', 'Which animated film features a snowman called Olaf?', 'Frozen', ['Moana', 'Tangled', 'Brave', 'Encanto']],
  ['Pop Culture', 'Who is the lead singer of Coldplay?', 'Chris Martin', ['Bono', 'Adam Levine', 'Brandon Flowers', 'Thom Yorke']],
  ['Pop Culture', 'Which superhero is Peter Parker?', 'Spider-Man', ['Batman', 'Superman', 'Iron Man', 'Daredevil']],
  ['Pop Culture', 'What is the toy cowboy in Toy Story called?', 'Woody', ['Buzz', 'Rex', 'Hamm', 'Slinky']],
  ['Pop Culture', 'Which singer is known for "Rolling in the Deep"?', 'Adele', ['Beyoncé', 'Rihanna', 'Taylor Swift', 'Lady Gaga']],
  ['Pop Culture', 'Which movie made the line “I’ll be back” famous?', 'The Terminator', ['Rocky', 'Predator', 'Die Hard', 'Rambo']],
  ['Pop Culture', 'Which fictional city does Batman protect?', 'Gotham City', ['Metropolis', 'Star City', 'Central City', 'Smallville']],
  ['Pop Culture', 'Who played Jack in Titanic?', 'Leonardo DiCaprio', ['Brad Pitt', 'Tom Cruise', 'Matt Damon', 'Johnny Depp']],
  ['Pop Culture', 'Which Disney princess has a pet tiger called Rajah?', 'Jasmine', ['Belle', 'Ariel', 'Mulan', 'Pocahontas']],
  ['Pop Culture', 'Which streaming service released Squid Game?', 'Netflix', ['Hulu', 'Disney+', 'HBO Max', 'Prime Video']],
  ['Pop Culture', 'Who sings "Blinding Lights"?', 'The Weeknd', ['Drake', 'Post Malone', 'Bruno Mars', 'Ed Sheeran']],
  ['Pop Culture', "Who is the headmaster of Hogwarts in Harry Potter's early years?", 'Albus Dumbledore', ['Severus Snape', 'Gandalf', 'Sirius Black', 'Remus Lupin']],

  ['Literature', 'Who wrote The Lion, the Witch and the Wardrobe?', 'C.S. Lewis', ['J.R.R. Tolkien', 'Roald Dahl', 'Enid Blyton', 'J.M. Barrie']],
  ['Literature', 'Which author created Sherlock Holmes?', 'Arthur Conan Doyle', ['Agatha Christie', 'Charles Dickens', 'Edgar Allan Poe', 'H.G. Wells']],
  ['Literature', 'In which play does a character say "To be, or not to be"?', 'Hamlet', ['Macbeth', 'Othello', 'King Lear', 'Romeo and Juliet']],
  ['Literature', 'Who wrote Oliver Twist?', 'Charles Dickens', ['Thomas Hardy', 'Jane Austen', 'George Eliot', 'Mark Twain']],
  ['Literature', 'What kind of animal is Winnie-the-Pooh?', 'Bear', ['Rabbit', 'Tiger', 'Donkey', 'Pig']],
  ['Literature', 'Who wrote The Hunger Games?', 'Suzanne Collins', ['Veronica Roth', 'Stephenie Meyer', 'J.K. Rowling', 'Rick Riordan']],
  ['Literature', 'Who wrote Animal Farm?', 'George Orwell', ['Aldous Huxley', 'William Golding', 'John Steinbeck', 'Roald Dahl']],
  ['Literature', 'In Alice in Wonderland, what does Alice follow down the hole?', 'A white rabbit', ['A black cat', 'A mouse', 'A caterpillar', 'A dodo']],
  ['Literature', 'Who wrote Matilda?', 'Roald Dahl', ['Dr. Seuss', 'Judy Blume', 'Enid Blyton', 'A.A. Milne']],
  ['Literature', 'Who wrote Purple Hibiscus?', 'Chimamanda Ngozi Adichie', ['Chinua Achebe', 'Wole Soyinka', 'Ben Okri', 'Buchi Emecheta']],
  ['Literature', 'Who wrote The Alchemist?', 'Paulo Coelho', ['Gabriel García Márquez', 'Isabel Allende', 'Jorge Amado', 'Mario Vargas Llosa']],
  ['Literature', 'Who wrote Treasure Island?', 'Robert Louis Stevenson', ['Daniel Defoe', 'Jonathan Swift', 'Rudyard Kipling', 'Mark Twain']],
]

const EXPERT: Raw[] = [
  ['Science', 'What is the chemical symbol for tungsten?', 'W', ['Tu', 'T', 'Tn', 'Wo']],
  ['Science', 'Which element has atomic number 26?', 'Iron', ['Nickel', 'Cobalt', 'Copper', 'Zinc']],
  ['Science', 'Roughly how fast does light travel?', '300,000 km/s', ['150,000 km/s', '30,000 km/s', '3,000,000 km/s', '3,000 km/s']],
  ['Science', 'Which vitamin does skin make in sunlight?', 'Vitamin D', ['Vitamin A', 'Vitamin C', 'Vitamin K', 'Vitamin B12']],
  ['Science', 'What is the most abundant gas in Earth’s atmosphere?', 'Nitrogen', ['Oxygen', 'Argon', 'Carbon dioxide', 'Hydrogen']],
  ['Science', 'Which planet rotates on its side?', 'Uranus', ['Neptune', 'Saturn', 'Mars', 'Jupiter']],
  ['Science', 'Which organelle produces most of a cell’s ATP?', 'Mitochondria', ['Ribosome', 'Nucleus', 'Golgi apparatus', 'Lysosome']],
  ['Science', 'Which particle carries a negative charge?', 'Electron', ['Proton', 'Neutron', 'Positron', 'Photon']],

  ['History', 'Which treaty formally ended World War I with Germany?', 'Treaty of Versailles', ['Treaty of Paris', 'Treaty of Vienna', 'Peace of Westphalia', 'Treaty of Tordesillas']],
  ['History', 'In which year was the Magna Carta sealed?', '1215', ['1066', '1315', '1415', '1166']],
  ['History', 'Who was the first Roman emperor?', 'Augustus', ['Julius Caesar', 'Nero', 'Constantine', 'Tiberius']],
  ['History', 'In which year did the French Revolution begin?', '1789', ['1776', '1799', '1815', '1804']],
  ['History', 'Who led the 1930 Salt March?', 'Mahatma Gandhi', ['Jawaharlal Nehru', 'Muhammad Ali Jinnah', 'Sardar Patel', 'Subhas Chandra Bose']],
  ['History', 'Who was the first president of independent Ghana?', 'Kwame Nkrumah', ['Jomo Kenyatta', 'Julius Nyerere', 'Nnamdi Azikiwe', 'Léopold Senghor']],
  ['History', 'Suleiman the Magnificent ruled which empire?', 'Ottoman', ['Mughal', 'Safavid', 'Byzantine', 'Qing']],
  ['History', 'In which year was the Berlin Wall built?', '1961', ['1949', '1956', '1971', '1953']],

  ['Geography', 'What is the capital of Australia?', 'Canberra', ['Sydney', 'Melbourne', 'Perth', 'Brisbane']],
  ['Geography', 'Which is the smallest country by area?', 'Vatican City', ['Monaco', 'San Marino', 'Malta', 'Liechtenstein']],
  ['Geography', 'Which river flows through Baghdad?', 'Tigris', ['Euphrates', 'Nile', 'Jordan', 'Danube']],
  ['Geography', 'Which strait separates Europe from Africa at the Mediterranean?', 'Strait of Gibraltar', ['Bosphorus', 'Strait of Hormuz', 'Strait of Malacca', 'Bering Strait']],
  ['Geography', 'What is the capital of Canada?', 'Ottawa', ['Toronto', 'Montreal', 'Vancouver', 'Calgary']],
  ['Geography', 'Which mountain range forms part of the Europe–Asia boundary?', 'Ural Mountains', ['Alps', 'Andes', 'Pyrenees', 'Carpathians']],
  ['Geography', 'What is the capital of Turkey?', 'Ankara', ['Istanbul', 'Izmir', 'Bursa', 'Antalya']],
  ['Geography', 'In which country is the city of Timbuktu?', 'Mali', ['Niger', 'Chad', 'Mauritania', 'Burkina Faso']],

  ['Mathematics', 'What is π to two decimal places?', '3.14', ['3.41', '3.12', '3.18', '3.16']],
  ['Mathematics', 'What is the 5th prime number?', '11', ['9', '13', '7', '10']],
  ['Mathematics', 'What is 2 to the power of 10?', '1024', ['512', '2048', '1000', '1204']],
  ['Mathematics', 'What do the interior angles of a triangle add up to?', '180°', ['90°', '270°', '360°', '120°']],
  ['Mathematics', 'What is 15 × 15?', '225', ['215', '235', '205', '250']],
  ['Mathematics', 'What is the derivative of x²?', '2x', ['x', 'x²', '2', 'x³/3']],
  ['Mathematics', 'What is 0! (zero factorial)?', '1', ['0', 'Undefined', '10', '2']],
  ['Mathematics', 'Solve for x: 3x + 5 = 20', '5', ['4', '6', '15', '7']],

  ['Technology', 'Who created the Linux kernel?', 'Linus Torvalds', ['Richard Stallman', 'Dennis Ritchie', 'Ken Thompson', 'Bjarne Stroustrup']],
  ['Technology', 'Which language is used to style web pages?', 'CSS', ['Python', 'SQL', 'Java', 'C++']],
  ['Technology', 'What does SQL stand for?', 'Structured Query Language', ['Simple Query Logic', 'Sequential Query Language', 'Standard Question Language', 'Systematic Query Link']],
  ['Technology', 'Which HTTP status code means "Not Found"?', '404', ['403', '500', '301', '200']],
  ['Technology', 'Which company originally created JavaScript?', 'Netscape', ['Microsoft', 'Sun Microsystems', 'Google', 'Oracle']],
  ['Technology', 'How many bits are in one byte?', '8', ['4', '16', '10', '2']],
  ['Technology', 'What does RAM stand for?', 'Random Access Memory', ['Read Access Memory', 'Rapid Action Memory', 'Random Allocation Module', 'Run Access Memory']],
  ['Technology', 'What does the "S" in HTTPS stand for?', 'Secure', ['Server', 'Simple', 'Standard', 'Speed']],

  ['Sports', 'Who has won the most Ballon d’Or awards?', 'Lionel Messi', ['Cristiano Ronaldo', 'Michel Platini', 'Johan Cruyff', 'Karim Benzema']],
  ['Sports', 'Which country has won the most men’s FIFA World Cups?', 'Brazil', ['Germany', 'Italy', 'Argentina', 'France']],
  ['Sports', 'How many players per team are on a basketball court?', '5', ['6', '7', '11', '4']],
  ['Sports', 'Which men’s tennis player has the most Grand Slam singles titles?', 'Novak Djokovic', ['Roger Federer', 'Rafael Nadal', 'Pete Sampras', 'Andy Murray']],
  ['Sports', 'Where were the first modern Olympics held in 1896?', 'Athens', ['Paris', 'London', 'Rome', 'Los Angeles']],
  ['Sports', 'How many players are on the field for one rugby union team?', '15', ['13', '11', '12', '10']],
  ['Sports', 'Who holds the men’s 100m world record?', 'Usain Bolt', ['Tyson Gay', 'Yohan Blake', 'Justin Gatlin', 'Asafa Powell']],
  ['Sports', 'Which country hosted the 2016 Summer Olympics?', 'Brazil', ['United Kingdom', 'China', 'Japan', 'Russia']],

  ['Pop Culture', 'Who directed Titanic (1997)?', 'James Cameron', ['Steven Spielberg', 'Ridley Scott', 'Christopher Nolan', 'Martin Scorsese']],
  ['Pop Culture', 'Who released the album "Thriller"?', 'Michael Jackson', ['Prince', 'Madonna', 'Stevie Wonder', 'Whitney Houston']],
  ['Pop Culture', 'Which film won Best Picture at the 2020 Oscars?', 'Parasite', ['1917', 'Joker', 'Ford v Ferrari', 'Once Upon a Time in Hollywood']],
  ['Pop Culture', 'Captain America’s shield is made from which fictional metal?', 'Vibranium', ['Adamantium', 'Uru', 'Mithril', 'Titanium']],
  ['Pop Culture', 'Who released the album "To Pimp a Butterfly"?', 'Kendrick Lamar', ['J. Cole', 'Drake', 'Kanye West', 'Jay-Z']],
  ['Pop Culture', 'Which artist released "Last Last"?', 'Burna Boy', ['Wizkid', 'Davido', 'Rema', 'Asake']],
  ['Pop Culture', 'Which film is the highest-grossing of all time?', 'Avatar', ['Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens', 'Jurassic World']],
  ['Pop Culture', 'Which TV series is set in the continent of Westeros?', 'Game of Thrones', ['The Witcher', 'Vikings', 'The Wheel of Time', 'The Last Kingdom']],

  ['Literature', 'Who wrote One Hundred Years of Solitude?', 'Gabriel García Márquez', ['Jorge Luis Borges', 'Isabel Allende', 'Pablo Neruda', 'Mario Vargas Llosa']],
  ['Literature', 'Who wrote Crime and Punishment?', 'Fyodor Dostoevsky', ['Leo Tolstoy', 'Anton Chekhov', 'Nikolai Gogol', 'Ivan Turgenev']],
  ['Literature', 'Who wrote the poem "The Raven"?', 'Edgar Allan Poe', ['Walt Whitman', 'Robert Frost', 'Emily Dickinson', 'Lord Byron']],
  ['Literature', 'Who wrote Half of a Yellow Sun?', 'Chimamanda Ngozi Adichie', ['Chinua Achebe', 'Buchi Emecheta', 'Ben Okri', 'Ngũgĩ wa Thiong’o']],
  ['Literature', 'In which Shakespeare play does Iago appear?', 'Othello', ['Macbeth', 'Hamlet', 'King Lear', 'Romeo and Juliet']],
  ['Literature', 'Who wrote Don Quixote?', 'Miguel de Cervantes', ['Lope de Vega', 'Federico García Lorca', 'Pedro Calderón de la Barca', 'Luis de Góngora']],
  ['Literature', 'Who wrote The Divine Comedy?', 'Dante Alighieri', ['Petrarch', 'Virgil', 'Boccaccio', 'Geoffrey Chaucer']],
  ['Literature', 'Which novel opens with "Call me Ishmael"?', 'Moby-Dick', ['Treasure Island', 'The Old Man and the Sea', 'Robinson Crusoe', 'Heart of Darkness']],

  ['Science', 'What is the SI unit of force?', 'Newton', ['Joule', 'Watt', 'Pascal', 'Hertz']],
  ['Science', 'What is the chemical formula for table salt?', 'NaCl', ['KCl', 'NaOH', 'CaCl₂', 'HCl']],
  ['Science', 'Who developed the theory of general relativity?', 'Albert Einstein', ['Isaac Newton', 'Niels Bohr', 'Max Planck', 'Galileo Galilei']],
  ['Science', 'What is the pH of pure water at 25°C?', '7', ['0', '5', '9', '14']],
  ['Science', 'Which organelle is the site of photosynthesis?', 'Chloroplast', ['Mitochondrion', 'Ribosome', 'Vacuole', 'Nucleolus']],
  ['Science', 'What is the most abundant element in the universe?', 'Hydrogen', ['Helium', 'Oxygen', 'Carbon', 'Iron']],
  ['Science', 'Which blood type is the universal donor for red blood cells?', 'O negative', ['AB positive', 'A negative', 'B positive', 'O positive']],
  ['Science', 'Roughly how fast does sound travel in air?', '343 m/s', ['34 m/s', '3,430 m/s', '1,000 m/s', '300,000 m/s']],
  ['Science', 'Who discovered penicillin?', 'Alexander Fleming', ['Louis Pasteur', 'Marie Curie', 'Joseph Lister', 'Edward Jenner']],
  ['Science', 'About what percentage of Earth’s atmosphere is oxygen?', '21%', ['78%', '1%', '50%', '9%']],
  ['Science', 'What is the chemical symbol for silver?', 'Ag', ['Si', 'Sv', 'Au', 'Sr']],
  ['Science', 'What is the SI unit of electrical resistance?', 'Ohm', ['Volt', 'Ampere', 'Watt', 'Farad']],

  ['History', 'Who was the first woman to win a Nobel Prize?', 'Marie Curie', ['Mother Teresa', 'Rosalind Franklin', 'Florence Nightingale', 'Ada Lovelace']],
  ['History', 'Which empire built the Colosseum?', 'Roman', ['Greek', 'Byzantine', 'Ottoman', 'Persian']],
  ['History', 'In which year did the Soviet Union dissolve?', '1991', ['1989', '1985', '1993', '1999']],
  ['History', 'Who was the first emperor of a unified China?', 'Qin Shi Huang', ['Kublai Khan', 'Sun Yat-sen', 'Genghis Khan', 'Emperor Wu']],
  ['History', "Which battle ended Napoleon's rule in 1815?", 'Waterloo', ['Trafalgar', 'Austerlitz', 'Borodino', 'Leipzig']],
  ['History', 'Which Egyptian queen allied with Julius Caesar and Mark Antony?', 'Cleopatra', ['Nefertiti', 'Hatshepsut', 'Isis', 'Ramses']],
  ['History', 'Which ship carried Charles Darwin on his famous voyage?', 'HMS Beagle', ['HMS Victory', 'Endeavour', 'Mayflower', 'Bounty']],
  ['History', 'In which year did the Wall Street Crash happen?', '1929', ['1919', '1933', '1939', '1925']],
  ['History', 'Who was the first Prime Minister of Nigeria?', 'Abubakar Tafawa Balewa', ['Nnamdi Azikiwe', 'Obafemi Awolowo', 'Ahmadu Bello', 'Yakubu Gowon']],
  ['History', 'Which 1494 treaty split the New World between Spain and Portugal?', 'Treaty of Tordesillas', ['Treaty of Versailles', 'Treaty of Utrecht', 'Peace of Augsburg', 'Treaty of Ghent']],
  ['History', 'Who led the Haitian Revolution?', 'Toussaint Louverture', ['Simón Bolívar', 'José de San Martín', 'Fidel Castro', 'Benito Juárez']],
  ['History', 'Which dynasty built most of the Great Wall as it stands today?', 'Ming', ['Han', 'Tang', 'Song', 'Qing']],

  ['Geography', 'What is the capital of Argentina?', 'Buenos Aires', ['Santiago', 'Montevideo', 'Lima', 'Bogotá']],
  ['Geography', 'What is the capital of Mongolia?', 'Ulaanbaatar', ['Astana', 'Bishkek', 'Tashkent', 'Kathmandu']],
  ['Geography', 'Which body of water is the lowest point on land?', 'Dead Sea', ['Caspian Sea', 'Lake Baikal', 'Aral Sea', 'Red Sea']],
  ['Geography', 'Which of these countries is landlocked?', 'Bolivia', ['Peru', 'Chile', 'Colombia', 'Ecuador']],
  ['Geography', 'Which is the deepest lake in the world?', 'Lake Baikal', ['Lake Superior', 'Lake Victoria', 'Lake Tanganyika', 'Lake Titicaca']],
  ['Geography', 'What is the capital of Morocco?', 'Rabat', ['Casablanca', 'Marrakesh', 'Tunis', 'Algiers']],
  ['Geography', 'Which US state is the largest by area?', 'Alaska', ['Texas', 'California', 'Montana', 'Nevada']],
  ['Geography', 'What is the capital of Ethiopia?', 'Addis Ababa', ['Nairobi', 'Khartoum', 'Asmara', 'Mogadishu']],
  ['Geography', 'Which strait separates Asia from North America?', 'Bering Strait', ['Drake Passage', 'Strait of Malacca', 'Bosphorus', 'Davis Strait']],
  ['Geography', 'Which mountain range contains Mount Everest?', 'Himalayas', ['Andes', 'Alps', 'Rockies', 'Karakoram']],
  ['Geography', 'Which African country was formerly called Zaire?', 'Democratic Republic of the Congo', ['Republic of the Congo', 'Angola', 'Zambia', 'Uganda']],
  ['Geography', 'What is the capital of Peru?', 'Lima', ['Quito', 'La Paz', 'Bogotá', 'Caracas']],

  ['Mathematics', 'What do the interior angles of a quadrilateral add up to?', '360°', ['180°', '270°', '540°', '720°']],
  ['Mathematics', 'What is 17 × 6?', '102', ['112', '96', '108', '92']],
  ['Mathematics', 'What is the square root of 225?', '15', ['14', '16', '25', '13']],
  ['Mathematics', 'How many edges does a cube have?', '12', ['6', '8', '10', '24']],
  ['Mathematics', 'What is 5! (five factorial)?', '120', ['25', '60', '100', '720']],
  ['Mathematics', 'What is the area of a circle with radius 3?', '9π', ['6π', '3π', '18π', '12π']],
  ['Mathematics', 'What is 0.25 as a fraction?', '1/4', ['1/2', '1/5', '2/5', '3/4']],
  ['Mathematics', 'What is the next prime number after 13?', '17', ['15', '19', '21', '23']],
  ['Mathematics', 'What is log₁₀(1000)?', '3', ['2', '10', '100', '1000']],
  ['Mathematics', 'A triangle has sides 3, 4 and 5. What kind of triangle is it?', 'A right triangle', ['Equilateral', 'Isosceles', 'Obtuse', 'Degenerate']],
  ['Mathematics', 'What is 2 to the power of 8?', '256', ['128', '512', '64', '1024']],
  ['Mathematics', 'What is the sum of the whole numbers from 1 to 10?', '55', ['45', '50', '60', '65']],

  ['Technology', 'What does "IP" stand for in IP address?', 'Internet Protocol', ['Internal Process', 'Input Port', 'Integrated Path', 'Instant Packet']],
  ['Technology', 'Who is credited with inventing the World Wide Web?', 'Tim Berners-Lee', ['Vint Cerf', 'Bill Gates', 'Steve Jobs', 'Marc Andreessen']],
  ['Technology', 'What does GPU stand for?', 'Graphics Processing Unit', ['General Processing Unit', 'Graphical Power Unit', 'Gaming Processor Unit', 'Game Performance Utility']],
  ['Technology', 'In which year was the first iPhone released?', '2007', ['2005', '2009', '2010', '2003']],
  ['Technology', 'What does SSD stand for?', 'Solid State Drive', ['Super Speed Disk', 'Static Storage Device', 'Solid Storage Disk', 'System Software Driver']],
  ['Technology', 'Which data structure works first-in, first-out?', 'Queue', ['Stack', 'Tree', 'Graph', 'Heap']],
  ['Technology', 'Who created the Git version control system?', 'Linus Torvalds', ['Guido van Rossum', 'Dennis Ritchie', 'James Gosling', 'Bjarne Stroustrup']],
  ['Technology', 'What does CSS stand for?', 'Cascading Style Sheets', ['Computer Style System', 'Creative Style Syntax', 'Colorful Style Sheets', 'Coded Style Settings']],
  ['Technology', 'Which language runs natively in every web browser?', 'JavaScript', ['Java', 'Python', 'C#', 'Ruby']],
  ['Technology', 'What is the decimal number 5 in binary?', '101', ['110', '100', '111', '011']],
  ['Technology', 'What does HTTP stand for?', 'HyperText Transfer Protocol', ['HyperText Transmission Process', 'High Transfer Text Protocol', 'Hyperlink Transfer Program', 'Host Text Transfer Protocol']],
  ['Technology', 'Which cryptocurrency was created first?', 'Bitcoin', ['Ethereum', 'Litecoin', 'Dogecoin', 'Ripple']],

  ['Sports', 'Which country has won the most Summer Olympic gold medals overall?', 'United States', ['China', 'Great Britain', 'Germany', 'Russia']],
  ['Sports', 'Who won the first FIFA World Cup in 1930?', 'Uruguay', ['Brazil', 'Argentina', 'Italy', 'Germany']],
  ['Sports', 'How many Grand Slam tennis tournaments are there each year?', '4', ['3', '5', '6', '2']],
  ['Sports', 'Which club has won the most UEFA Champions League titles?', 'Real Madrid', ['AC Milan', 'Bayern Munich', 'Liverpool', 'Barcelona']],
  ['Sports', 'In which sport is the Ryder Cup contested?', 'Golf', ['Tennis', 'Rugby', 'Cricket', 'Sailing']],
  ['Sports', 'Who scored the infamous "Hand of God" goal?', 'Diego Maradona', ['Pelé', 'Lionel Messi', 'Zinedine Zidane', 'Ronaldo']],
  ['Sports', 'How many points is a try worth in rugby union?', '5', ['3', '4', '6', '7']],
  ['Sports', 'Which country won the first Rugby World Cup in 1987?', 'New Zealand', ['Australia', 'England', 'South Africa', 'France']],
  ['Sports', "Who is the NBA's all-time leading regular-season scorer?", 'LeBron James', ['Kareem Abdul-Jabbar', 'Michael Jordan', 'Kobe Bryant', 'Karl Malone']],
  ['Sports', 'In which city does the Tour de France traditionally finish?', 'Paris', ['Lyon', 'Marseille', 'Nice', 'Bordeaux']],
  ['Sports', 'In which country did the ancient Olympic Games originate?', 'Greece', ['Italy', 'Egypt', 'Turkey', 'France']],
  ['Sports', 'Which African country hosted the 2010 FIFA World Cup?', 'South Africa', ['Nigeria', 'Egypt', 'Morocco', 'Ghana']],

  ['Pop Culture', 'Which band released the album Abbey Road?', 'The Beatles', ['The Rolling Stones', 'Led Zeppelin', 'Pink Floyd', 'The Who']],
  ['Pop Culture', 'Who directed Pulp Fiction?', 'Quentin Tarantino', ['Martin Scorsese', 'Steven Spielberg', 'Christopher Nolan', 'David Fincher']],
  ['Pop Culture', 'Which actor played Captain Jack Sparrow?', 'Johnny Depp', ['Orlando Bloom', 'Brad Pitt', 'Geoffrey Rush', 'Tom Hardy']],
  ['Pop Culture', 'Which singer had the alter ego "Sasha Fierce"?', 'Beyoncé', ['Rihanna', 'Lady Gaga', 'Nicki Minaj', 'Katy Perry']],
  ['Pop Culture', 'Which film franchise features the character Dominic Toretto?', 'Fast & Furious', ['Mission: Impossible', 'John Wick', 'The Transporter', 'Need for Speed']],
  ['Pop Culture', 'Which Marvel film is set in Wakanda?', 'Black Panther', ['Thor', 'Doctor Strange', 'Eternals', 'Ant-Man']],
  ['Pop Culture', 'Who sang the 2023 hit "Water"?', 'Tyla', ['Ayra Starr', 'Rema', 'Tems', 'Asake']],
  ['Pop Culture', 'Which TV show follows the chemistry teacher Walter White?', 'Breaking Bad', ['The Wire', 'Ozark', 'Narcos', 'Dexter']],
  ['Pop Culture', 'Which TV show is set in the fictional town of Hawkins, Indiana?', 'Stranger Things', ['Riverdale', 'Twin Peaks', 'Dark', 'Gilmore Girls']],
  ['Pop Culture', 'Who composed the music for the Star Wars films?', 'John Williams', ['Hans Zimmer', 'Ennio Morricone', 'Danny Elfman', 'James Horner']],
  ['Pop Culture', 'Which animation studio made Spirited Away?', 'Studio Ghibli', ['Pixar', 'DreamWorks', 'Toei Animation', 'Madhouse']],
  ['Pop Culture', 'Who played T’Challa in Black Panther?', 'Chadwick Boseman', ['Michael B. Jordan', 'Idris Elba', 'Daniel Kaluuya', 'Winston Duke']],

  ['Literature', 'Who wrote The Catcher in the Rye?', 'J.D. Salinger', ['F. Scott Fitzgerald', 'John Steinbeck', 'Jack Kerouac', 'Harper Lee']],
  ['Literature', 'Who wrote To Kill a Mockingbird?', 'Harper Lee', ['Toni Morrison', 'Maya Angelou', 'Margaret Mitchell', 'Flannery O’Connor']],
  ['Literature', 'Which poet wrote Paradise Lost?', 'John Milton', ['William Blake', 'John Donne', 'Lord Byron', 'Alexander Pope']],
  ['Literature', 'Who wrote Les Misérables?', 'Victor Hugo', ['Alexandre Dumas', 'Gustave Flaubert', 'Émile Zola', 'Marcel Proust']],
  ['Literature', 'Who wrote The Old Man and the Sea?', 'Ernest Hemingway', ['John Steinbeck', 'William Faulkner', 'Mark Twain', 'Jack London']],
  ['Literature', 'Who wrote Beloved?', 'Toni Morrison', ['Alice Walker', 'Maya Angelou', 'Zora Neale Hurston', 'Octavia Butler']],
  ['Literature', 'Who wrote Frankenstein?', 'Mary Shelley', ['Bram Stoker', 'Emily Brontë', 'Jane Austen', 'Percy Shelley']],
  ['Literature', 'Who wrote Wuthering Heights?', 'Emily Brontë', ['Charlotte Brontë', 'Anne Brontë', 'Jane Austen', 'George Eliot']],
  ['Literature', 'Who wrote The Trial?', 'Franz Kafka', ['Thomas Mann', 'Hermann Hesse', 'Albert Camus', 'Jean-Paul Sartre']],
  ['Literature', "Who wrote Death and the King's Horseman?", 'Wole Soyinka', ['Chinua Achebe', 'Ngũgĩ wa Thiong’o', 'J.P. Clark', 'Ola Rotimi']],
  ['Literature', 'Who wrote Ulysses?', 'James Joyce', ['Samuel Beckett', 'W.B. Yeats', 'Oscar Wilde', 'Virginia Woolf']],
  ['Literature', 'In Pride and Prejudice, what is the male lead’s surname?', 'Darcy', ['Bingley', 'Wickham', 'Collins', 'Knightley']],
]

function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toQuestion([category, text, answer, wrong]: Raw, level: Level, rand: () => number): Question {
  const options = shuffle([answer, ...wrong], rand)
  return {
    category,
    text,
    options,
    correct: options.indexOf(answer),
    points: LEVELS.find((l) => l.id === level)?.points ?? 100,
  }
}

/** Endless stream for solo practice: reshuffles when the pool is exhausted and never repeats back-to-back. */
export function createDeck(level: Level) {
  const pool = level === 'expert' ? EXPERT : NORMAL
  let queue: Raw[] = []
  let last: Raw | null = null
  return function next(): Question {
    if (queue.length === 0) {
      queue = shuffle(pool)
      if (queue[queue.length - 1] === last) queue.unshift(queue.pop() as Raw)
    }
    const raw = queue.pop() as Raw
    last = raw
    return toQuestion(raw, level, Math.random)
  }
}

/** Small seeded PRNG so every player in a room deals the identical deck from one shared seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Difficulty = 'mixed' | 'normal' | 'expert'

export interface DealOptions {
  difficulty: Difficulty
  /** Empty means every category. */
  categories: string[]
}

export const CATEGORIES: string[] = [...new Set([...NORMAL, ...EXPERT].map((raw) => raw[0]))]

const MIN_DECK_LENGTH = 160

function poolFor({ difficulty, categories }: DealOptions) {
  const tagged = [
    ...(difficulty === 'expert' ? [] : NORMAL.map((raw) => ({ raw, level: 'normal' as Level }))),
    ...(difficulty === 'normal' ? [] : EXPERT.map((raw) => ({ raw, level: 'expert' as Level }))),
  ]
  const filtered = categories.length > 0 ? tagged.filter(({ raw }) => categories.includes(raw[0])) : tagged
  return filtered.length > 0 ? filtered : tagged
}

export function poolSize(options: DealOptions): number {
  return poolFor(options).length
}

/**
 * A seed-determined deck for the chosen difficulty and categories, with option order shuffled by the same
 * stream. Same seed and options, same deck, on every device. Small pools are reshuffled back to back so a
 * round can't run out of questions.
 */
export function dealSeeded(seed: number, options: DealOptions = { difficulty: 'mixed', categories: [] }): Question[] {
  const rand = mulberry32(seed)
  const pool = poolFor(options)
  const deck: Question[] = []
  while (deck.length < MIN_DECK_LENGTH) {
    const pass = shuffle(pool, rand).map(({ raw, level }) => toQuestion(raw, level, rand))
    // avoid the same question twice in a row where one pass ends and the next begins
    if (deck.length > 0 && pass.length > 1 && pass[0].text === deck[deck.length - 1].text) {
      ;[pass[0], pass[pass.length - 1]] = [pass[pass.length - 1], pass[0]]
    }
    deck.push(...pass)
  }
  return deck
}
