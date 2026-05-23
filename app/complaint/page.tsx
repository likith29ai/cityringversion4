"use client";

export default function ComplaintPage() {
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-10 overflow-hidden">

            {/* glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-600/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">

              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                Raise a Complaint
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                We take every concern seriously.
              </h1>

              <div className="mt-8 space-y-6 text-white/70 leading-relaxed text-[15.5px]">
                <p>
                  If you've experienced an issue — with a ring, a member, a payment, or anything else — please don't hesitate to reach out. Every complaint is reviewed personally by our team.
                </p>
                <p className="text-white">
                  Contact us through any of the channels below and we'll look into it promptly.
                </p>
              </div>

              {/* Contact Cards */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Gmail */}
                <a
                  href="https://mail.google.com/mail/?view=cm&to=cityringonline@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all p-5"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 text-lg">
                    ✉️
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Email</div>
                    <div className="text-white font-medium group-hover:text-blue-300 transition-colors break-all">
                      cityringonline@gmail.com
                    </div>
                    <div className="mt-1 text-xs text-white/40">Click to send via Gmail</div>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href="tel:+919187489526"
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all p-5"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600/20 text-green-400 text-lg">
                    📞
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Phone</div>
                    <div className="text-white font-medium group-hover:text-green-300 transition-colors">
                      +91 91874 89526
                    </div>
                    <div className="mt-1 text-xs text-white/40">Click to call us</div>
                  </div>
                </a>

              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-white/40 text-sm leading-relaxed">
                Please include as much detail as possible — your registered handle, the ring name, and a description of the issue. This helps us resolve your complaint faster.
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