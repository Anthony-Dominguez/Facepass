import Link from "next/link";

const features = [
  {
    title: "Biometric Guard",
    description:
      "DeepFace verifies liveliness and match quality so only the right person ever unlocks the vault.",
  },
  {
    title: "End-to-End Encryption",
    description:
      "Secrets are encrypted with Fernet before they hit the database. Vault keys never leave your control.",
  },
  {
    title: "Instant Deployment",
    description:
      "Biometric gatekeeping is paired with Fernet-encrypted storage so even leaked databases stay useless to attackers.",
  },
];

const testimonials = [
  {
    quote:
      "FacePass let us replace SMS codes with selfie auth. Employees love how fast it is and security is thrilled.",
    name: "Morgan Reeves",
    role: "Head of Security, Navisys",
  },
  {
    quote:
      "The vault UI feels premium and the encryption model is transparent. Our customers finally trust password sharing again.",
    name: "Alicia Tran",
    role: "CTO, Parabola Fintech",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),transparent_45%)]" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <span className="text-xl font-semibold tracking-[0.3em] text-sky-300">
          FacePass
        </span>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 sm:flex">
          <Link href="#features" className="transition hover:text-white">
            Features
          </Link>
          <Link href="#testimonials" className="transition hover:text-white">
            Proof
          </Link>
          <Link href="#pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link
            href="/auth"
            className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-slate-500 hover:text-white"
          >
            Log in
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-24">
        <section className="mt-16 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-sky-200">
              Zero-friction security
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
              Passwords protected by the only thing{" "}
              <span className="text-sky-400">no one can copy</span>.
            </h1>
            <p className="text-lg text-slate-300 sm:text-xl">
              FacePass Vault combines DeepFace biometric verification with
              encrypted credential storage. Drop passwords, secrets, and API
              keys behind a selfie-powered gate that feels effortless for real
              users and impossible for imposters.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
              >
                Launch FacePass
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                View the stack
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div>
                <p className="text-xl font-semibold text-white">3M+</p>
                <p>verifications completed</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-white">0</p>
                <p>compromised vaults to date</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-sky-500/40 via-transparent to-pink-500/20 blur-3xl" />
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur">
              <div className="border-b border-slate-800 p-6">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
                  Live Confidence Score
                </p>
                <p className="mt-4 text-4xl font-semibold text-sky-300">99.7%</p>
              </div>
              <div className="space-y-6 p-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Encrypted Secrets
                  </p>
                  <p className="mt-3 text-lg text-white">
                    • AWS root credentials{" "}
                    <span className="text-slate-400">updated 2h ago</span>
                  </p>
                  <p className="text-lg text-white">
                    • Postgres connection string{" "}
                    <span className="text-slate-400">updated 14m ago</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-sky-600/30 via-sky-500/20 to-slate-900 p-5 text-sm text-slate-200">
                  “Selfie auth is our most-loved feature after launch. The vault
                  UX turned one of our roughest compliance gaps into a delight.”
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-12">
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Why FacePass Vault
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Security-grade tech, startup speed.
            </h2>
            <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
              Ship enterprise trust without enterprise complexity. Our FastAPI
              backend, DeepFace inference, and Next.js experience work together
              out of the box.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-slate-950/50 transition hover:border-sky-500/50 hover:shadow-sky-500/20"
              >
                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="testimonials"
          className="rounded-[3rem] border border-slate-800 bg-slate-900/60 p-10 shadow-2xl backdrop-blur"
        >
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Loved by security-first teams
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Trusted by teams handling billions in secrets.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <p className="text-lg text-slate-200">“{testimonial.quote}”</p>
                <div className="mt-6 text-sm text-slate-400">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="rounded-[3rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-900/40 p-10 shadow-2xl"
        >
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Pricing
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Simple scale. Bring your own infrastructure.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Starter
              </p>
              <p className="mt-4 text-4xl font-semibold text-white">
                $0{" "}
                <span className="text-sm font-normal text-slate-400">
                  self-hosted
                </span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                <li>• Face auth + password vault UI</li>
                <li>• SQLite + Fernet encryption</li>
                <li>• Community Slack</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-sky-500/60 bg-sky-500/10 p-6 shadow-lg shadow-sky-500/20">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-200">
                Growth
              </p>
              <p className="mt-4 text-4xl font-semibold text-white">
                $179{" "}
                <span className="text-sm font-normal text-slate-200">
                  /month
                </span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-100">
                <li>• Managed DeepFace inference</li>
                <li>• Hardware security module add-on</li>
                <li>• 24/7 incident desk</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                Enterprise
              </p>
              <p className="mt-4 text-4xl font-semibold text-white">
                Let’s talk
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                <li>• Dedicated on-prem engineers</li>
                <li>• Custom risk-scoring pipelines</li>
                <li>• FedRAMP &amp; HIPAA pathways</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                Ready to launch FacePass?
              </p>
              <p className="text-sm text-slate-400">
                Spin up your FastAPI instance, connect the Next.js client, and
                start replacing passwords with presence.
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/60 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FacePass Vault. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="transition hover:text-white">
              Login
            </Link>
            <Link href="mailto:hi@facepass.dev" className="transition hover:text-white">
              Contact
            </Link>
            <Link href="#pricing" className="transition hover:text-white">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
