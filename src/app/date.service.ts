import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor() { }

  friendlytruthList: string[] = [
    "What’s the most embarrassing thing you’ve ever done in public?",
    "Have you ever kept a secret from your best friend?",
    "If you could swap lives with one person for a day, who would it be?",
    "What’s your biggest fear?",
    "Have you ever lied to get out of trouble?",
    "Who was your first crush?",
    "What’s a talent you have that no one knows about?",
    "If you could have one superpower, what would it be?",
    "Have you ever forgotten someone’s birthday and lied about it?",
    "What’s the weirdest dream you’ve ever had?",
    "If you could eat only one food for the rest of your life, what would it be?",
    "Have you ever sent a text to the wrong person? What was it?",
    "What’s one thing you’ve done that you regret?",
    "If you could go anywhere in the world right now, where would you go?",
    "What’s the last thing you Googled?"
  ];

  friendlydareList: string[] = [
    "Sing your favorite song in a funny voice.",
    "Do your best impression of someone in the group.",
    "Take a selfie and post it with the caption 'Feeling awesome today!'",
    "Say the alphabet backward as fast as you can.",
    "Do 10 jumping jacks while pretending to be a chicken.",
    "Text a random contact in your phone saying, 'You’re amazing!'",
    "Balance a book on your head and walk across the room.",
    "Speak in an accent for the next 5 minutes.",
    "Share the first photo in your phone’s gallery.",
    "Dance without music for 30 seconds.",
    "Let the person to your left write something funny on your forehead with a marker.",
    "Do your best animal impression for the next minute.",
    "Call a random number and say, 'You’re invited to my secret party!'",
    "Tell a joke so bad it’s funny.",
    "Act like your favorite movie character until someone guesses who it is."
  ];

  adultnormaltruthList: string[] = [
    "What’s the most embarrassing thing you’ve ever done in public?",
    "Have you ever had a crush on someone in this room?",
    "What’s the worst haircut you’ve ever had?",
    "If you could go on a date with anyone here, who would it be?",
    "What’s something you’re afraid to tell your parents?",
    "Who is your celebrity crush?",
    "Have you ever had a crush on a teacher?",
    "What’s the most trouble you’ve gotten into at school?",
    "What’s your most awkward childhood memory?",
    "If you could change one thing about yourself, what would it be?",
    "What’s the last lie you told?",
    "Have you ever stolen something? What was it?",
    "What’s the silliest thing you’ve done in front of someone you liked?",
    "If you could be famous for one thing, what would it be?",
    "What’s your biggest fear?"
  ];

  // Dare questions for a group of boys and girls
  adultnormaldareList: string[] = [
    "Imitate someone in the room for the next minute.",
    "Do your best dance move for 30 seconds.",
    "Post a funny selfie with a random caption.",
    "Call your crush and tell them they are amazing.",
    "Do 15 push-ups.",
    "Talk in a funny accent for the next 5 minutes.",
    "Let someone in the room pick a funny outfit for you to wear for the next 10 minutes.",
    "Dance to a song without music for 30 seconds.",
    "Give someone a compliment.",
    "Pretend to be a waiter/waitress and take someone's 'order'.",
    "Do your best impression of a famous person.",
    "Take a silly picture and post it on social media.",
    "Try to touch your toes for a minute while balancing.",
    "Send a message to a random contact saying, 'I miss you!'",
    "Do your best animal impression."
  ];

  boystruthList: string[] = [
    "What’s the most embarrassing thing you’ve done while trying to impress someone?",
    "Have you ever had a crush on a friend's girlfriend?",
    "What’s the biggest lie you’ve told to get out of trouble?",
    "If you had to choose between your best friend and your dream girl, who would you pick?",
    "What’s the craziest thing you’ve done while drunk?",
    "Have you ever cheated in a relationship? Be honest.",
    "What’s the most inappropriate thing you’ve done at a party?",
    "What’s one thing you’re afraid of that you’ve never told anyone?",
    "What’s the dumbest thing you’ve done to impress a girl?",
    "Who is your biggest competition in life and why?",
    "What’s the most risky thing you’ve ever done?",
    "Have you ever been caught doing something you shouldn’t have? What happened?",
    "Who in the group do you think would survive the longest in a zombie apocalypse and why?",
    "If you could date any celebrity, who would it be?",
    "What’s the most mischievous thing you’ve done as a kid?"
  ];

  // Dare questions for boys (deadly combo)
  boysdareList: string[] = [
    "Do 30 push-ups without stopping.",
    "Send a message to your ex saying, 'I miss you.'",
    "Call someone from your contact list and sing happy birthday to them, even if it’s not their birthday.",
    "Take a shot of hot sauce.",
    "Act like a baby for the next 5 minutes.",
    "Let someone in the room pick your outfit for the rest of the game.",
    "Post a ridiculous status on your social media account.",
    "Do your best impression of a football coach giving a motivational speech.",
    "Dance like nobody’s watching for 1 minute.",
    "Pretend to be your favorite action hero for the next 3 minutes.",
    "Let someone write something embarrassing on your forehead with a marker.",
    "Post a picture of your most embarrassing moment on your social media.",
    "Do 20 jumping jacks while singing a song from your childhood.",
    "Make a prank call to a random number and tell them they're on a game show.",
    "Try to do a handstand for 30 seconds."
  ];

  girlstruthList: string[] = [
    "What’s the most embarrassing thing you’ve done while trying to impress someone?",
    "Have you ever had a crush on someone in this room?",
    "What’s the biggest secret you’ve kept from your best friend?",
    "What’s the most outrageous thing you’ve done to get attention from a guy?",
    "If you had to choose between your best friend and your boyfriend, who would you pick?",
    "What’s the biggest lie you’ve told to get out of trouble?",
    "Have you ever broken someone’s heart? What happened?",
    "What’s the most scandalous thing you’ve done at a party?",
    "What’s your guilty pleasure that you’d never admit in front of others?",
    "If you could change one thing about your appearance, what would it be?",
    "Have you ever sent a flirty text to the wrong person?",
    "Who in the group do you think is the best at keeping secrets?",
    "What’s the weirdest thing you’ve done when you’re alone?",
    "What’s the most embarrassing thing you’ve done in front of a crush?",
    "If you could go on a date with anyone, who would it be?"
  ];

  // Dare questions for girls (deadly combo)
  girlsdareList: string[] = [
    "Dance like nobody’s watching for 1 minute.",
    "Call your crush and tell them they’re amazing.",
    "Take a funny selfie and post it with the caption, 'Feeling fabulous!'",
    "Let someone draw a funny mustache on your face with a marker.",
    "Do your best catwalk down the room.",
    "Post a funny status on your social media about this game.",
    "Send a heart emoji to the last person you texted.",
    "Try to do 20 squats while saying, 'I’m a strong, independent woman!'",
    "Let someone pick an outfit for you to wear for the next 10 minutes.",
    "Pretend to be a famous celebrity for the next 3 minutes.",
    "Do an impression of your favorite singer or actress.",
    "Let someone write something funny on your forehead with a marker.",
    "Call a random number and sing ‘Happy Birthday’ to them.",
    "Do 10 jumping jacks while pretending to be a cheerleader.",
    "Post a video of you singing your favorite song and tag a friend."
  ];

  duocoupletruthlist: string[] = [];
  duocoupledarelist: string[] = [];

  adultdeadtruthlist: string[] = [];
  adultdeaddarelist: string[] = [];

  honeymoontruthlist: string[] = [];
  honeymoondarelist: string[] = [];
}
