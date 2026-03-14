import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "compliance.ai | Enterprise Compliance",
  description: "Autonomous Accounts Payable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body suppressHydrationWarning className={`${inter.className} text-black dark:text-white flex h-screen overflow-hidden transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="compliance-theme">
          <AuthGuard>
            {/* HYPERBOLOID FLOW v2 ANIMATED BACKGROUND */}
            <div className="fixed inset-0 z-[-1] w-full h-full overflow-hidden transition-colors duration-700">

              {/* Theme-aware CSS variables */}
              <style>{`
                /* ─── LIGHT MODE: Analogous warm rose/mauve palette ─── */
                /* Purple → shift warm → rose-pink-mauve (color wheel analogy) */
                :root {
                  --hyp-scene-bg:    #0a0a1a;
                  --hyp-scene-mid:   #1a1a3a;
                  --hyp-scene-far:   #050510;

                  /* Light mode overrides */
                  --hyp-outer-0:    #b06090;
                  --hyp-outer-1:    #c878a8;
                  --hyp-outer-2:    #d090b8;
                  --hyp-outer-hi:   #d8a0c0;

                  --hyp-middle-0:   #c070a0;
                  --hyp-middle-1:   #d888b8;
                  --hyp-middle-2:   #e0a0c8;
                  --hyp-middle-hi:  #e8b0d0;

                  --hyp-inner-0:    #c878a8;
                  --hyp-inner-1:    #e090c0;
                  --hyp-inner-2:    #eda8d0;
                  --hyp-inner-hi:   #f0b8d8;

                  --hyp-core-0:     #d090b8;
                  --hyp-core-1:     #e8a8cc;
                  --hyp-core-hi:    #f5c0dc;

                  --hyp-center-glow: rgba(255,255,255,0.95);
                  --hyp-orb-1:       rgba(180,90,160,0.5);
                  --hyp-orb-2:       rgba(200,120,170,0.4);
                }

                /* ─── DARK MODE: Exact original colors from the user ─── */
                .dark {
                  --hyp-outer-0:    #2d1b69;
                  --hyp-outer-1:    #4a2d8a;
                  --hyp-outer-2:    #6b3fa0;
                  --hyp-outer-hi:   #7c4db8;

                  --hyp-middle-0:   #4a2d8a;
                  --hyp-middle-1:   #6b3fa0;
                  --hyp-middle-2:   #8b5fc8;
                  --hyp-middle-hi:  #a070d8;

                  --hyp-inner-0:    #6b3fa0;
                  --hyp-inner-1:    #8b5fc8;
                  --hyp-inner-2:    #b080e8;
                  --hyp-inner-hi:   #c090f0;

                  --hyp-core-0:     #8b5fc8;
                  --hyp-core-1:     #b080e8;
                  --hyp-core-hi:    #e8c0ff;

                  --hyp-center-glow: rgba(255,255,255,0.9);
                  --hyp-orb-1:       rgba(120,80,220,0.6);
                  --hyp-orb-2:       rgba(180,100,255,0.5);
                }
              `}</style>

              {/* Scene radial base */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 50% 50%, var(--hyp-scene-mid,#1a1a3a) 0%, var(--hyp-scene-bg,#0f0f2f) 40%, var(--hyp-scene-far,#050510) 100%)',
              }} />
              {/* Light mode override for scene base */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#fff0fa] via-[#f5e6ff] to-[#ede0f8] dark:opacity-0 transition-opacity duration-700" />

              {/* Hyperboloid SVG container */}
              <div className="hyp-container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-full"
                   style={{filter: 'blur(40px)'}}>

                {/* Outer layer — widest, most blur */}
                <svg className="hyp-outer absolute inset-0 w-full h-full"
                     style={{filter: 'blur(60px)', opacity: 0.4}}
                     viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="hGradOuter" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%"   stopColor="var(--hyp-outer-0)"  stopOpacity="0.8" />
                      <stop offset="20%"  stopColor="var(--hyp-outer-1)"  stopOpacity="0.9" />
                      <stop offset="40%"  stopColor="var(--hyp-outer-2)"  stopOpacity="0.6" />
                      <stop offset="50%"  stopColor="var(--hyp-outer-hi)" stopOpacity="0.3" />
                      <stop offset="60%"  stopColor="var(--hyp-outer-2)"  stopOpacity="0.6" />
                      <stop offset="80%"  stopColor="var(--hyp-outer-1)"  stopOpacity="0.9" />
                      <stop offset="100%" stopColor="var(--hyp-outer-0)"  stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 300 Q 150 480, 500 500 Q 850 480, 1000 300 L 1000 700 Q 850 520, 500 500 Q 150 520, 0 700 Z"
                        fill="url(#hGradOuter)" />
                </svg>

                {/* Middle layer */}
                <svg className="hyp-middle absolute inset-0 w-full h-full"
                     style={{filter: 'blur(40px)', opacity: 0.6}}
                     viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="hGradMiddle" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%"   stopColor="var(--hyp-middle-0)"  stopOpacity="0.9"  />
                      <stop offset="25%"  stopColor="var(--hyp-middle-1)"  stopOpacity="0.95" />
                      <stop offset="45%"  stopColor="var(--hyp-middle-2)"  stopOpacity="0.7"  />
                      <stop offset="50%"  stopColor="var(--hyp-middle-hi)" stopOpacity="0.4"  />
                      <stop offset="55%"  stopColor="var(--hyp-middle-2)"  stopOpacity="0.7"  />
                      <stop offset="75%"  stopColor="var(--hyp-middle-1)"  stopOpacity="0.95" />
                      <stop offset="100%" stopColor="var(--hyp-middle-0)"  stopOpacity="0.9"  />
                    </linearGradient>
                  </defs>
                  <path d="M 0 350 Q 180 460, 500 480 Q 820 460, 1000 350 L 1000 650 Q 820 540, 500 520 Q 180 540, 0 650 Z"
                        fill="url(#hGradMiddle)" />
                </svg>

                {/* Inner layer */}
                <svg className="hyp-inner absolute inset-0 w-full h-full"
                     style={{filter: 'blur(25px)', opacity: 0.8}}
                     viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="hGradInner" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%"   stopColor="var(--hyp-inner-0)"  stopOpacity="1"   />
                      <stop offset="30%"  stopColor="var(--hyp-inner-1)"  stopOpacity="1"   />
                      <stop offset="48%"  stopColor="var(--hyp-inner-2)"  stopOpacity="0.8" />
                      <stop offset="50%"  stopColor="var(--hyp-inner-hi)" stopOpacity="0.5" />
                      <stop offset="52%"  stopColor="var(--hyp-inner-2)"  stopOpacity="0.8" />
                      <stop offset="70%"  stopColor="var(--hyp-inner-1)"  stopOpacity="1"   />
                      <stop offset="100%" stopColor="var(--hyp-inner-0)"  stopOpacity="1"   />
                    </linearGradient>
                  </defs>
                  <path d="M 0 400 Q 200 450, 500 465 Q 800 450, 1000 400 L 1000 600 Q 800 550, 500 535 Q 200 550, 0 600 Z"
                        fill="url(#hGradInner)" />
                </svg>

                {/* Core layer — brightest */}
                <svg className="hyp-core absolute inset-0 w-full h-full"
                     style={{filter: 'blur(15px)', opacity: 1}}
                     viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="hGradCore" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%"   stopColor="var(--hyp-core-0)"  stopOpacity="1"   />
                      <stop offset="35%"  stopColor="var(--hyp-core-1)"  stopOpacity="1"   />
                      <stop offset="48%"  stopColor="var(--hyp-core-hi)" stopOpacity="0.9" />
                      <stop offset="50%"  stopColor="#ffffff"            stopOpacity="0.7" />
                      <stop offset="52%"  stopColor="var(--hyp-core-hi)" stopOpacity="0.9" />
                      <stop offset="65%"  stopColor="var(--hyp-core-1)"  stopOpacity="1"   />
                      <stop offset="100%" stopColor="var(--hyp-core-0)"  stopOpacity="1"   />
                    </linearGradient>
                  </defs>
                  <path d="M 0 430 Q 220 455, 500 470 Q 780 455, 1000 430 L 1000 570 Q 780 545, 500 530 Q 220 545, 0 570 Z"
                        fill="url(#hGradCore)" />
                </svg>
              </div>

              {/* Center horizontal glow */}
              <div className="hyp-center-pulse absolute top-1/2 left-1/2 w-[30vw] h-[8vh] pointer-events-none"
                   style={{
                     background: 'radial-gradient(ellipse, var(--hyp-center-glow) 0%, rgba(200,180,255,0.7) 30%, rgba(150,120,255,0.4) 60%, transparent 100%)',
                     filter: 'blur(30px)',
                   }} />

              {/* Ambient orbs */}
              <div className="hyp-drift-1 absolute w-[500px] h-[500px] rounded-full pointer-events-none"
                   style={{top: '-20%', left: '20%',
                     background: 'radial-gradient(circle, var(--hyp-orb-1) 0%, transparent 70%)',
                     filter: 'blur(100px)', opacity: 0.3}} />
              <div className="hyp-drift-2 absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                   style={{bottom: '-10%', right: '20%',
                     background: 'radial-gradient(circle, var(--hyp-orb-2) 0%, transparent 70%)',
                     filter: 'blur(100px)', opacity: 0.3}} />

              {/* Film grain */}
              <div className="hyp-grain absolute -top-1/4 -left-1/4 w-[200%] h-[200%] pointer-events-none"
                   style={{
                     opacity: 0.03,
                     backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                   }} />

              {/* Vignette */}
              <div className="absolute inset-0 pointer-events-none"
                   style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.9) 100%)'}} />
            </div>



            {/* THE DYNAMIC SIDEBAR (Hides on login and landing page) */}
            <Sidebar />

            {/* THE MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto relative bg-transparent pt-16 md:pt-0">
              {children}
            </main>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}