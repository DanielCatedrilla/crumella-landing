"use client";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useInView,
} from "framer-motion";

const E = [0.22, 1, 0.36, 1] as const;

const participants = [
  {
    id: 1,
    name: "Irish Rae Villanueva",
    dp: "/mdp/1.jpg",
    momPhoto: "/mp/1.jpg",
    message: `Capanang MGrace I would probably write the longest letter in the world if I tried to explain every reason why you’re the best mom anyone could ever ask for. But if I had to sum it all up, it would be these three things: because you always give your all for me and Sean, because you support me in everything I do, and because even though you’re miles away, I still feel your love and comfort every single day.

Mama, I truly couldn’t ask for anything more because having you already feels like having everything. Distance may separate us, but somehow your warmth still reaches me. Your voice, your care, and your love continue to comfort me no matter how far apart we are.

If I were given the chance to live in every alternate universe, I would still choose you to be my mom. Thank you because I wouldn’t be where I am today, nor become the person I am now, without you.

Everything good in me carries a piece of you.

Hidlaw nako smo, Mama. Please always take care of yourself. 🥹💗`,
  },
  {
    id: 2,
    name: "Joross Simon",
    dp: "/mdp/2.jpg",
    momPhoto: "/mp/2.png",
    message: `To my Mama, Rose Simon

They say you never truly know the weight of a mother’s love until you’re tested. Looking back, I realize you’ve been carrying the weight of my world for as long as I’ve been in it. Thank you for the gift of life, but more importantly, thank you for fighting for that life every single day, finding ways to give me everything I needed even when the world gave you nothing to work with. I know I wasn’t always the easiest to love. I had my moments of pride, my fights, and my rebellion. But while I was busy trying to find my own way, you were working with blood, sweat, and tears to build a future for me. You didn't just teach me how to survive, you disciplined me to the bone that turned a stubborn boy into the man I am today HAHAHAH. 

Thank you, Ma, for being my sanctuary. Beyond just a roof over my head, you gave me a home in your arms a place that was always open, always waiting, and always safe, no matter how many times I wandered off. I still carry the memory of my accident like a shadow. In those darkest days, I felt as fragile as glass, shattered and afraid. But you were there. Ikaw akon sandigan, the steady hand that held me together when I was falling apart. You didn't just act as a mother, you were my guardian angel on earth, refusing to leave my side until the light came back. We are always far apart and there’s an emptiness I can’t quite explain, it’s like a piece of my soul is missing because your presence isn't here. 

I may not have the courage to say this to you in person, but please hear me now: Ma, I love you more than words can carry. Your sacrifices are written on my heart. I promise you, they will never be in vain. I will spend the rest of my life trying to give back the world you gave to me. I will never abandon you, because you never, ever gave up on me.

Happy Mother’s Day to my hero, my home, and my everything.`,
  },
  {
    id: 3,
    name: "Izza Gallaza",
    dp: "/mdp/3.jpg",
    momPhoto: "/mp/3(1).jpg",
    message: `“A Mother Like No Other”

One of my favorite Christian songs to sing whenever we celebrate Mother’s Day, because it reminds me of how blessed I am to have you as my nanay — truly, a mother like no other.

I am lucky to wake up every day without having to worry about what’s on the table kay tanan na ready kag prepare mo na. Ever since elementary, amo nana ang routine, and even now that I’m already in college, it still remains the same and I can say nga thankful gd ako because I still get to experience your love this way.

Although I’m growing older now and becoming more occupied and busy exploring life, you remain by my side no matter what — supporting and guiding me through every step. Thank you, Nay, for teaching me how to pray and for reminding me to believe in myself even when the storms seem impossible to face.

And as the lyrics of the song go, “There may never come a day when I ever can repay all the love that you have giv’n, all the care I have received. I always will be grateful for the things that you have done. 

I will love you ever, for you are a mother like no other.” know that everything I am doing now is for you, mainly because ang handom mo subong is makalupad pa South Korea kag ma-meet si Kim Soo-hyun, taas na ng standards mo madz.🤦‍♀️

Happy Mother’s Day, Myra Gacias! Saranghaeyo lang da ah🫶`,
  },
  {
    id: 4,
    name: "John Nathan Fernandez",
    dp: "/mdp/4.jpg",
    momPhoto: "/mp/4.jpg",
    message: `Dear Nanay Concepcion N. Fernandez✌️

There aren’t many words to say, just like you do. You show love through your actions: by believing in me, caring for me, and loving me and my kuya. Many things you do were taken for granted, but when something’s missing, I notice instantly. Unconsciously I've internalized your hard work, presence, encouragement, discipline, and sense of responsibility that any less makes me feel incomplete. 

I suppose that's what mothers are, examples. You are my shining example. I'd imitate you again and again yet I never could and that's fine. It's said that great legacies aren't meant to be perfect, and I just hope I'm one that is yours. I wish one day I'd be like you to others; a blessing I can't replace, the way that you're irreplaceable in my life.

From the luckiest boy in the world: Happy Mother’s Day, and thank you for your unconditional love. 🥳`,
  },
  {
    id: 5,
    name: "Nerhea Grace Almanon",
    dp: "/mdp/5.jpg",
    momPhoto: "/mp/5.jpg",
    message: `Nerwin Almanon Thank you, ma. For waking up very early to prepare our meals and for being supportive and caring mother. Even though may problems minsan, you never let us feel the pressure instead you share a positive atmosphere at home. 
    
Especially kung ma late ko puli sa dance practices, thankful gd ko kay gin bless ako ni God sang supportive parents. Thank you for everything, ma. I'll spoil you soon with blessings as your loving nga medyo maldita nga subang HAHAHA. 

Forever blessed to have a mother like you!🌼`,
  },
  {
    id: 6,
    name: "Ella Loraine Alcalde",
    dp: "/mdp/6.jpg",
    momPhoto: "/mp/6.jpg",
    message: `Norelyn Tabugo she's the mom, not just because she's a our mom but, all the sacrifices she did for us. Enduring the pain of every abuse and harsh words from other people, but she remain strong for us and telling us to be a better person when we grow up. 
    
Don't be bad to others even though they're doing something bad to you let the karma do it. She's the best mom for she is the reason why we are here in the world, fighting and striving until we are successful in life, so that we can give them back the things that they did and sacrifices she do for us!❤️ 

I love you maa♥️😚`,
  },
  {
    id: 7,
    name: "Jaspher A. Celestial",
    dp: "/mdp/7.jpg",
    momPhoto: "/mp/7.jpg",
    message: `Juna Amion Celestial

My mom is truly the best because she works so incredibly hard as a yaya, whether she's working abroad as an OFW or here at home doing housekeeping. Every single day, she tirelessly dedicates herself to her job, all while being a single mom. Her strength and dedication to our family mean the world to me, and I'm so proud of everything she does.`,
  },
  {
    id: 8,
    name: "Venice Jade Ebalan",
    dp: "/mdp/8.jpg",
    momPhoto: "/mp/8.jpg",
    message: `Borromeo Silvano Janette Ebalan 
    
Not every person who has a child is a parent or a mother, but you surely have been one to me. Still, being a mom is not the only thing that makes you the best mom. It is in my pride that I can say to others, “I got this trait from my mom.” It is in the certainty that whenever life becomes difficult, I can say, “I know my mom will help me.” And it is in the comfort of knowing I can say, “My mom loves me, and I love her.” I believe anyone can become a mom, but not everyone can become the kind of mom I know you are. I love you, nay! 

Happy Mother's Day! ❤️`,
  },
    {
    id: 9,
    name: "Angelo Manares",
    dp: "/mdp/9.jpg",
    momPhoto: "/mp/0.jpg",
    message: `Presentacion Manares I wanted to take a moment to write this and simply say thank you for everything you do. I probably don't say it as often as I should, but your unconditional love and support mean the absolute world to me.

​As I've been navigating the heavy demands of my university studies, spending late nights trying to get my code to run right, and just figuring out my own rhythm in life, I've come to realize how much your presence anchors me. You've always been the steady voice of encouragement behind the scenes. 

Honestly, seeing the patience it takes to care for others has given me a whole new perspective on the endless energy and love you've poured into me over the last 21 years.

​Thank you for always making sure I'm taken care of . I am so incredibly grateful for your quiet sacrifices, your warmth, and just for being you. 

I'm so lucky to be your son.`,
  },
      {
    id: 10,
    name: "Mariede Claire Sumagaysay",
    dp: "/mdp/10.jpg",
    momPhoto: "/mp/0.jpg",
    message: `Thess The embodiment of discipline, patience, and full of love, the one who shaped me to who I am today, the one who is always supportive and takes good care of me no matter what!!!

Strict she may be, but I know that it is for my best and I trust her judgement. She always listens when I have trouble on my mind or any gossips I like to share (mwehehehe), her love is unconditional, my first friend and my role model who I look up to. I am very grateful to have a wonderful mom in my life. No one could come close as cool, fierce and badass as my mom, she's the girlboss! 🫣

I love ya lots, mom, thank you so much for all that you have done for me and that you continue to stay strong and healthy! 🫶💙🩷`,
  },
];

const ambientHearts = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: `${(i * 17 + 5) % 90 + 5}%`,
  delay: (i * 0.9) % 8,
  duration: 12 + (i % 7) * 2,
  size: [18, 24, 14, 30][i % 4],
}));

function Divider() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex items-center gap-4 px-8 my-4 relative z-10 max-w-5xl mx-auto">
      <motion.div
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: E }}
        style={{ originX: 0 }}
        className="flex-1 h-px bg-gradient-to-r from-pink-200/70 via-[#a6dff6]/30 to-transparent"
      />
      <motion.span
        initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="text-pink-300 text-sm shrink-0 select-none"
      >
        ♡
      </motion.span>
      <motion.div
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: E, delay: 0.1 }}
        style={{ originX: 1 }}
        className="flex-1 h-px bg-gradient-to-l from-pink-200/70 via-[#a6dff6]/30 to-transparent"
      />
    </div>
  );
}

function ParticipantCard({ p, index }: { p: typeof participants[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [expanded, setExpanded] = useState(false);

  const isLeft = index % 2 === 0;
  const isLong = p.message.length > 200;

  return (
    <div ref={ref} className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <div className={`flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} gap-12 md:gap-16 items-start md:items-center`}>

        {/* ── Photo Side ── */}
        <motion.div
          initial={{ opacity: 0, x: isLeft ? -70 : 70, filter: "blur(14px)" }}
          animate={inView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.1, ease: E, delay: 0.1 }}
          className="w-full md:w-1/2 relative"
        >
          <div
            className="relative rounded-3xl overflow-hidden aspect-[4/5]"
            style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,192,203,0.2)" }}
          >
            <Image
              src={p.momPhoto}
              alt={`${p.name}'s mom`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>

          {/* DP nameplate */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.55, ease: E, delay: 0.65 }}
            className={`absolute -bottom-5 ${isLeft ? "right-3 md:-right-5" : "left-3 md:-left-5"} flex items-center gap-2.5 bg-white rounded-2xl px-3 py-2.5 shadow-xl border border-pink-100`}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#a6dff6] shrink-0">
              <Image src={p.dp} alt={p.name} fill className="object-cover" />
            </div>
            <p className="text-sm font-black text-black pr-1 whitespace-nowrap">{p.name}</p>
          </motion.div>
        </motion.div>

        {/* ── Message Side ── */}
        <motion.div
          initial={{ opacity: 0, x: isLeft ? 70 : -70, filter: "blur(10px)" }}
          animate={inView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.1, ease: E, delay: 0.22 }}
          className="w-full md:w-1/2 mt-6 md:mt-0"
        >
          {/* Big decorative quote */}
          <div className="text-[5rem] md:text-[7rem] font-serif text-pink-200/50 leading-none select-none -mb-6 -ml-2">
            &ldquo;
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-lg border border-pink-100/60 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-transparent to-[#a6dff6]/10 pointer-events-none rounded-3xl" />

            <div className="relative z-10">
              {/* Message with collapse */}
              <div
                className="relative overflow-hidden transition-[max-height] duration-700 ease-in-out"
                style={{ maxHeight: !expanded && isLong ? "6.5rem" : "2000px" }}
              >
                <p className="text-lg md:text-xl font-serif italic text-gray-700 leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                  {p.message}
                </p>
                {!expanded && isLong && (
                  <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white/95 to-transparent pointer-events-none" />
                )}
              </div>

              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#5bb8e8] hover:text-black transition-colors duration-200"
                >
                  {expanded ? "Read Less" : "Read More"}
                  <motion.svg
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </motion.svg>
                </button>
              )}

              {/* Sender line */}
              <div className="mt-6 pt-5 border-t border-pink-100 flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#a6dff6] shrink-0">
                  <Image src={p.dp} alt={p.name} fill className="object-cover" />
                </div>
                <p className="text-sm font-bold text-black">{p.name}</p>
                <span className="text-pink-300 text-xs ml-auto">♡</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MothersDayPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX, originX: 0 }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#a6dff6] z-[200]"
        aria-hidden
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: E }}
        className="min-h-screen bg-[#fffdf7] overflow-x-hidden"
      >
        <Navbar />

        {/* ════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════ */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Ambient blobs + floating hearts */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-40 left-[20%] w-[600px] h-[600px] rounded-full bg-pink-200/20 blur-[120px]"
            />
            <motion.div
              animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute top-[30%] -right-48 w-[500px] h-[500px] rounded-full bg-[#a6dff6]/15 blur-[100px]"
            />
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
              className="absolute -bottom-40 left-[35%] w-[400px] h-[400px] rounded-full bg-rose-100/25 blur-[100px]"
            />
            {ambientHearts.map((h) => (
              <motion.span
                key={h.id}
                className="absolute text-pink-300/20 select-none font-serif pointer-events-none"
                style={{ left: h.x, top: "-40px", fontSize: h.size }}
                animate={{ y: ["0px", "110vh"], rotate: [0, 180], opacity: [0, 0.5, 0.5, 0] }}
                transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
              >
                ♡
              </motion.span>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-6 pt-36 pb-20">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: E }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-pink-300/60" />
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-pink-400">A Mother&apos;s Day Special</span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-pink-300/60" />
            </motion.div>

            {/* Letter-by-letter title */}
            <h1
              className="font-black text-black tracking-tight leading-none mb-6 flex flex-wrap justify-center"
              style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
            >
              {"Sweet Like Mom".split("").map((char, i) =>
                char === " " ? (
                  <span key={`sp-${i}`} className="inline-block" style={{ width: "0.28em" }} />
                ) : (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 60, rotate: i % 2 === 0 ? 4 : -4 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ duration: 0.65, ease: E, delay: 0.25 + i * 0.04 }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                )
              )}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: E, delay: 1.1 }}
              className="text-base md:text-xl text-gray-500 font-medium tracking-wide mb-20"
            >
              A Mother&apos;s Day Special by{" "}
              <span className="text-black font-black">Crumella</span>
            </motion.p>

            {/* Scroll prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: E, delay: 1.6 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Scroll to read</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="text-pink-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            INTRO
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 w-full px-6 py-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, ease: E }}
            className="max-w-xl mx-auto text-xl md:text-2xl font-serif italic text-gray-500 leading-relaxed"
          >
            Real messages. Real love.{" "}
            <span className="text-black font-sans font-black not-italic">Real moms.</span>
          </motion.p>
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            PARTICIPANT CARDS
        ════════════════════════════════════════════════════ */}
        <section id="tributes" className="relative z-10 w-full">
          {participants.map((p, i) => (
            <div key={p.id}>
              <ParticipantCard p={p} index={i} />
              {i < participants.length - 1 && <Divider />}
            </div>
          ))}
        </section>

        <Divider />

        {/* ════════════════════════════════════════════════════
            CLOSING
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 w-full px-6 py-28 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/20 to-[#a6dff6]/10 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[400px] rounded-full bg-pink-100/15 blur-[100px]" />
          </div>

          <div className="relative max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: E }}
              className="text-5xl mb-8 block"
            >
              🤍
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: E, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-black tracking-tight leading-tight mb-5"
            >
              Happy Mother&apos;s Day.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: E, delay: 0.2 }}
              className="text-xl font-serif italic text-gray-500 mb-14"
            >
              From Crumella, with love 🤍
            </motion.p>

            {/* Logo lockup */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: E, delay: 0.3 }}
              className="mb-12"
            >
              <p className="font-black text-3xl tracking-tighter italic text-black">
                Crumella<span className="text-[#a6dff6]">.</span>
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold mt-1">
                Made to remember
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: E, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/order"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-black text-white font-bold px-10 py-4 text-base shadow-xl hover:shadow-[0_0_50px_rgba(166,223,246,0.5)] hover:scale-105 active:scale-95 transition-all duration-500"
              >
                Order Now &rarr;
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-gray-200 text-black font-bold px-10 py-4 text-base transition-all duration-300 hover:border-black hover:shadow-lg hover:scale-105 active:scale-95"
              >
                &larr; Back to Home
              </Link>
            </motion.div>
          </div>
        </section>

        <div className="relative z-10">
          <Footer />
        </div>
      </motion.main>
    </>
  );
}
