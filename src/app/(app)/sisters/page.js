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
      className="flex items-center gap-4 py-3 px-1 -mx-1 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Avatar
        src={sister.profilePhotoUrl}
        name={sister.fullName}
        size="md"
        className="ring-2 ring-brand-lighter shrink-0"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {sister.fullName}
          </p>
          {sister.verificationTier === "trusted" ? (
            <Badge variant="trusted" size="xs">Trusted</Badge>
          ) : sister.verificationTier === "verified" ? (
            <Badge variant="verified" size="xs">✓ Verified</Badge>
          ) : (
            <Badge variant="gray" size="xs">Member</Badge>
          )}
        </div>

        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-500">
          {sister.role && ROLE_LABELS[sister.role] && sister.role !== "guest" && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              {ROLE_LABELS[sister.role]}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1 min-w-0">
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
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-1">
      <Skeleton variant="avatar" className="w-11 h-11 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export default function SistersPage() {
  const [query, setQuery] = useState("");
  const [sisters, setSisters] = useState([]);
  const [total, setTotal] = useState(0);
  const [listTotal, setListTotal] = useState(0);
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
    setListTotal(d.data?.listTotal ?? 0);
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

  const hasMore = sisters.length < listTotal;

  return (
    <AppLayout title="All sisters">
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-28 lg:pb-10 space-y-5">
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
          <div className="divide-y divide-gray-200">
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
          <div className="divide-y divide-gray-200">
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
