"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, Home, RefreshCw, Shield, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

const ROLE_ACTIONS = {
  guest: [
    {
      icon: Search,
      title: "Find a host",
      desc: "Browse verified hosts in your destination",
      href: "/explore",
    },
    {
      icon: Shield,
      title: "Get verified",
      desc: "Verify your ID to unlock more hosts",
      href: "/profile",
    },
    {
      icon: Users,
      title: "Join the community",
      desc: "Connect with sister travellers worldwide",
      href: "/community",
    },
  ],
  host: [
    {
      icon: Home,
      title: "Set up hosting",
      desc: "Create your hosting profile and availability",
      href: "/profile",
    },
    {
      icon: Shield,
      title: "Get verified",
      desc: "Build trust with ID and background checks",
      href: "/profile",
    },
    {
      icon: Users,
      title: "Meet the community",
      desc: "Explore the SisterRoam community feed",
      href: "/community",
    },
  ],
  both: [
    {
      icon: Search,
      title: "Find a host",
      desc: "Browse verified hosts in your destination",
      href: "/explore",
    },
    {
      icon: Home,
      title: "Set up hosting",
      desc: "Open your home to sister travellers",
      href: "/profile",
    },
    {
      icon: MapPin,
      title: "Explore the world",
      desc: "See where the community is heading",
      href: "/community",
    },
  ],
};

export default function OnboardingCompletePage() {
  const { data: session } = useSession();
  const [animating, setAnimating] = useState(false);

  const user = session?.user;
  const role = user?.role ?? "guest";
  const actions = ROLE_ACTIONS[role] ?? ROLE_ACTIONS.guest;

  useEffect(() => {
    const t = setTimeout(() => setAnimating(true), 100);

    import("canvas-confetti")
      .then(({ default: confetti }) => {
        const end = Date.now() + 3500;
        const colors = ["#5D1A8B", "#D4537E", "#7F77DD", "#1D9E75", "#EF9F27"];

        function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        }
        frame();
      })
      .catch(() => {});

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Logo — scale-in animation */}
        <div
          className={cn(
            "flex justify-center mb-8 transition-all duration-700",
            animating ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
          <Logo variant="stacked" theme="light" size="xl" href="/" />
        </div>

        {/* Card */}
        <div
          className={cn(
            "bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center transition-all duration-700 delay-200",
            animating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          {/* Avatar */}
          {user && (
            <div className="flex justify-center mb-4">
              <Avatar
                src={user.profilePhotoUrl}
                name={user.fullName}
                size="xl"
              />
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to SisterRoam
            {user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}! 🎉
          </h1>

          <div className="flex justify-center mb-6">
            <Badge variant="verified" size="md">
              Basic Member
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            You&apos;re now part of a global community of women who travel and
            host with trust.
          </p>

          {/* Action cards */}
          <div className="text-left mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              What would you like to do first?
            </p>
            <div className="space-y-2">
              {actions.map(({ icon: Icon, title, desc, href }) => (
                <Link
                  key={href + title}
                  href={href}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-100 hover:border-brand hover:bg-brand-lighter/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-lighter flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                    <Icon
                      className="w-4.5 h-4.5 text-brand group-hover:text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Button variant="primary" fullWidth href="/feed">
            Take me to my dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
