"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { Search, X, MapPin, Globe, Users, Briefcase } from "lucide-react";

const LIMIT = 30;

const ROLE_LABELS = {
  host: "Host",
  both: "Host & traveller",
  guest: "Traveller",
};

function SisterCard({ sister }) {
  const visited = sister.countriesVisited?.length ?? 0;
  const location = [sister.city, sister.country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/user/${sister._id}`}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:border-brand hover:shadow-sm transition-all"
    >
      <Avatar
        src={sister.profilePhotoUrl}
        name={sister.fullName}
        size="lg"
        className="ring-2 ring-brand-lighter"
      />
      <div className="min-w-0 w-full">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {sister.fullName}
        </p>
        {sister.role && ROLE_LABELS[sister.role] && sister.role !== "guest" && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
            <Briefcase className="w-3 h-3 shrink-0" />
            {ROLE_LABELS[sister.role]}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
        {location && (
          <span className="flex items-center gap-1 truncate max-w-full">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        )}
        {visited > 0 && (
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {visited} {visited === 1 ? "country" : "countries"} visited
          </span>
        )}
      </div>

      {sister.verificationTier === "trusted" ? (
        <Badge variant="trusted">Trusted</Badge>
      ) : sister.verificationTier === "verified" ? (
        <Badge variant="verified">✓ Verified</Badge>
      ) : (
        <Badge variant="gray">Member</Badge>
      )}
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2">
      <Skeleton variant="avatar" className="w-16 h-16" />
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export default function SistersPage() {
  const [query, setQuery] = useState("");
  const [sisters, setSisters] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);

  const fetchSisters = useCallback(async (q, skip = 0, append = false) => {
    const params = new URLSearchParams({ limit: String(LIMIT), skip: String(skip) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/users/sisters?${params.toString()}`);
    if (!res.ok) return;
    const d = await res.json();
    const next = d.data?.sisters ?? [];
    setTotal(d.data?.total ?? 0);
    setSisters((prev) => (append ? [...prev, ...next] : next));
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchSisters("").finally(() => setLoading(false));
  }, [fetchSisters]);

  // Debounced search
  function onSearchChange(value) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchSisters(value.trim()).finally(() => setLoading(false));
    }, 300);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchSisters(query.trim(), sisters.length, true);
    setLoadingMore(false);
  }

  const hasMore = sisters.length < total;

  return (
    <AppLayout title="All sisters">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sisters by name or initials…"
            className="w-full pl-10 pr-10 py-3 rounded-[10px] border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {query && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500">
            {total === 0
              ? query
                ? `No sisters match “${query}”`
                : "No sisters yet"
              : `${total} sister${total !== 1 ? "s" : ""}${query ? " found" : ""}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : sisters.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="w-12 h-12 mx-auto text-gray-200" />
            <h3 className="text-base font-semibold text-gray-900">
              No sisters found
            </h3>
            <p className="text-sm text-gray-500">
              {query
                ? "Try a different name or initials."
                : "Check back soon as more sisters join."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sisters.map((s) => (
              <SisterCard key={s._id} sister={s} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2 pb-6">
            <Button
              onClick={handleLoadMore}
              loading={loadingMore}
              variant="secondary"
              size="md"
            >
              Load more sisters
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
