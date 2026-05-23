"use client";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* BANNER */}
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full h-[80px] sm:h-[120px] md:h-[180px] lg:h-[280px]">
          <img
            src="/banner.png"
            alt="CityRing banner"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-black" />
        </div>
      </section>


    



      {/* CONTENT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-4 sm:px-6 py-8 sm:py-12 lg:py-14 pb-16">

        <div className="max-w-3xl mx-auto">

          <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-10 overflow-hidden">


            {/* glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />



            <div className="relative">

              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                About CityRing
              </div>


              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                Where cities become circles.
              </h1>



              <div className="mt-8 space-y-6 text-white/70 leading-relaxed text-[15.5px]">


                <p>
                  CityRing was born from the belief that meaningful connections are not built in noise, but in the right circles.
                </p>


                <p>
                  In every city, there are people moving with intention — individuals shaping their paths, exploring their interests, and building their lives with quiet focus. Often, they exist parallel to one another, connected by place and purpose, yet separated by the absence of the right space to meet.
                </p>


                <p className="text-white">
                  CityRing exists to bridge that distance.
                </p>


                <p>
                  It is a curated system of private rings — each one shaped by shared interests, shared cities, and shared direction. Every ring is built with care, and every member is part of that ring for a reason.
                </p>


                <p>
                  We believe that when the right people find each other, conversations become richer, opportunities become organic, and a sense of belonging emerges without force.
                </p>


                <p className="text-white">
                  CityRing is designed to protect that experience.
                </p>


                <p>
                  Membership is deliberate. Growth is intentional. And every connection is meant to add value, not noise.
                </p>


                <p className="text-white">
                  This is not about reaching everyone.
                </p>


                <p className="text-white">
                  It is about reaching the right ones.
                </p>


                <p className="text-white font-medium pt-4">
                  CityRing is where cities become circles.
                  <br />
                  And circles become communities.
                </p>


              </div>


            </div>


          </div>

        </div>

      </section>



      {/* FOOTER */}
      <footer className="border-t border-white/10">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-sm text-white/50">

          © {new Date().getFullYear()} CityRing. Built for real communities.

        </div>

      </footer>


    </main>
  );
}