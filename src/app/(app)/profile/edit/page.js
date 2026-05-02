"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import ImageUpload from "@/components/ui/ImageUpload";
import Skeleton from "@/components/ui/Skeleton";

/* ── Static data ─────────────────────────────────────────── */

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belgium",
  "Bolivia",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Maldives",
  "Malta",
  "Mexico",
  "Moldova",
  "Mongolia",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const COMMON_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Arabic",
  "Portuguese",
  "Bengali",
  "Russian",
  "Urdu",
  "Indonesian",
  "German",
  "Japanese",
  "Mandarin",
  "Telugu",
  "Marathi",
  "Tamil",
  "Turkish",
  "Korean",
  "Italian",
  "Gujarati",
  "Punjabi",
  "Swahili",
  "Dutch",
  "Polish",
  "Vietnamese",
  "Ukrainian",
  "Romanian",
  "Greek",
  "Thai",
  "Malay",
  "Kannada",
  "Malayalam",
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "relative", label: "Relative" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

const EDUCATION_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const TRAVELLER_CATEGORIES = [
  { value: "solo_traveller", label: "Solo Traveller" },
  { value: "backpacker", label: "Backpacker" },
  { value: "cyclist", label: "Cyclist" },
  { value: "trekker", label: "Trekker" },
  { value: "runner", label: "Runner" },
  { value: "ultramarathon", label: "Ultra Runner" },
  { value: "road_tripper", label: "Road Tripper" },
  { value: "family_tourist", label: "Family Traveller" },
];

/* ── Reusable sub-components ─────────────────────────────── */

function TagInput({ label, tags, onChange, suggestions = [], placeholder }) {
  const [inputVal, setInputVal] = useState("");
  const [showSugg, setShowSugg] = useState(false);

  const filtered = suggestions
    .filter(
      (s) =>
        s.toLowerCase().startsWith(inputVal.toLowerCase()) && !tags.includes(s),
    )
    .slice(0, 5);

  function addTag(tag) {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInputVal("");
    setShowSugg(false);
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputVal.trim()) addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0)
      removeTag(tags[tags.length - 1]);
  }

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          {label}
        </label>
      )}
      <div className="min-h-[44px] flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent transition-colors">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 bg-brand-lighter text-brand text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="text-brand/60 hover:text-brand"
              aria-label={`Remove ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setShowSugg(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm outline-none placeholder:text-gray-400 bg-transparent py-0.5"
        />
      </div>
      {showSugg && filtered.length > 0 && (
        <div className="mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-10 relative">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-1">
        Type and press Enter or comma to add
      </p>
    </div>
  );
}

function SearchableSelect({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref}>
      {label && (
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full h-[44px] sm:h-[40px] flex items-center justify-between px-3 rounded-lg border bg-white text-sm transition-colors",
          open
            ? "ring-2 ring-brand border-transparent"
            : "border-gray-200 hover:border-gray-300",
          value ? "text-gray-900" : "text-gray-400",
        )}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 relative">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-gray-50",
                  value === o && "text-brand font-medium",
                )}
              >
                {o}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-gray-900 pb-1 border-b border-gray-50">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function ProfileEditPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [showHobbies, setShowHobbies] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoPublicId, setProfilePhotoPublicId] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cities, setCities] = useState([]);
  const [citiesFetchedFor, setCitiesFetchedFor] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [countriesVisited, setCountriesVisited] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");

  const loadingCities = !!country && citiesFetchedFor !== country;

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCities(!data.error && Array.isArray(data.data) ? data.data.sort() : []);
        setCitiesFetchedFor(country);
      })
      .catch(() => { if (!cancelled) { setCities([]); setCitiesFetchedFor(country); } });
    return () => { cancelled = true; };
  }, [country]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const u = d.data;
        setProfilePhotoUrl(u.profilePhotoUrl ?? "");
        setProfilePhotoPublicId(u.profilePhotoPublicId ?? "");
        setFullName(u.fullName ?? "");
        setAge(u.age ?? "");
        setGender(u.gender ?? "");
        setCity(u.city ?? "");
        setCountry(u.country ?? "");
        setLanguages(u.languages ?? []);
        setEducation(u.education ?? "");
        setOccupation(u.occupation ?? "");
        setBio(u.bio ?? "");
        setCountriesVisited(u.countriesVisited ?? []);
        setCategories(u.travellerCategories ?? []);
        setHobbies(u.hobbies ?? []);
        setInstagram(u.instagramUrl ?? "");
        setLinkedin(u.linkedinUrl ?? "");
        setFacebook(u.facebookUrl ?? "");
        setEmergencyName(u.emergencyContactName ?? "");
        setEmergencyPhone(u.emergencyContactPhone ?? "");
        setEmergencyRel(u.emergencyContactRelationship ?? "");
        setEmergencyEmail(u.emergencyContactEmail ?? "");
        if (u.hobbies?.length > 0) setShowHobbies(true);
        if (u.instagramUrl || u.linkedinUrl || u.facebookUrl)
          setShowSocial(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const buildPayload = useCallback(
    () => ({
      profilePhotoUrl: profilePhotoUrl || undefined,
      profilePhotoPublicId: profilePhotoPublicId || undefined,
      fullName,
      age: age ? Number(age) : undefined,
      gender: gender || undefined,
      city: city || undefined,
      country: country || undefined,
      languages,
      education: education || undefined,
      occupation: occupation || undefined,
      bio: bio || undefined,
      countriesVisited,
      travellerCategories: categories,
      hobbies,
      instagramUrl: instagram || undefined,
      linkedinUrl: linkedin || undefined,
      facebookUrl: facebook || undefined,
      emergencyContactName: emergencyName || undefined,
      emergencyContactPhone: emergencyPhone || undefined,
      emergencyContactRelationship: emergencyRel || undefined,
      emergencyContactEmail: emergencyEmail || undefined,
    }),
    [
      profilePhotoUrl,
      profilePhotoPublicId,
      fullName,
      age,
      gender,
      city,
      country,
      languages,
      education,
      occupation,
      bio,
      countriesVisited,
      categories,
      hobbies,
      instagram,
      linkedin,
      facebook,
      emergencyName,
      emergencyPhone,
      emergencyRel,
      emergencyEmail,
    ],
  );

  const userId = session?.user?.id;

  const save = useCallback(
    async (showToast = false) => {
      if (!userId) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) {
          const d = await res.json();
          toast.error(d.error ?? "Failed to save");
          return;
        }
        if (showToast) {
          setSavedAt(new Date());
          toast.success("Profile saved!");
          update({ profilePhotoUrl: profilePhotoUrl || undefined, fullName });
          router.push("/profile");
          return;
        }
        update({ profilePhotoUrl: profilePhotoUrl || undefined, fullName });
      } catch {
        toast.error("Network error. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [userId, buildPayload, profilePhotoUrl, fullName, update, router],
  );

  function field(setter) {
    return (e) => setter(e.target.value);
  }

  function toggleCategory(val) {
    setCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val],
    );
  }

  if (loading) {
    return (
      <AppLayout title="Edit Profile">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Edit Profile">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
        {savedAt && (
          <div className="flex items-center gap-1.5 text-xs text-teal font-medium">
            <Check className="w-3.5 h-3.5" /> Saved just now
          </div>
        )}

        {/* Photo */}
        <Section title="Profile photo">
          <div className="flex flex-col items-center gap-2">
            <ImageUpload
              currentImageUrl={profilePhotoUrl}
              name={fullName}
              onUploadComplete={({ url, publicId }) => {
                setProfilePhotoUrl(url);
                setProfilePhotoPublicId(publicId ?? "");
                update({ profilePhotoUrl: url });
              }}
            />
            <p className="text-xs text-gray-400">Tap to update your photo</p>
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Basic information">
          <Input
            label="Full name"
            value={fullName}
            onChange={field(setFullName)}
            placeholder="Your real name"
            required
          />
          <Input
            label="Age"
            type="number"
            value={age}
            onChange={field(setAge)}
            placeholder="e.g. 28"
            min={18}
            max={99}
          />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Gender
            </label>
            <div className="flex items-center gap-2 h-[44px] sm:h-[40px] px-3 rounded-xl border-2 border-brand bg-brand-lighter text-brand text-sm font-medium select-none">
              <span className="text-lg" aria-hidden="true">♀️</span>
              Female
            </div>
          </div>
          <SearchableSelect
            label="Home country"
            value={country}
            onChange={(v) => { setCity(""); setCountry(v); }}
            options={COUNTRIES}
            placeholder="Select your country"
          />
          {country && (
            loadingCities ? (
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">Home city</label>
                <div className="h-[44px] sm:h-[40px] rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 text-sm text-gray-400">
                  Loading cities…
                </div>
              </div>
            ) : cities.length > 0 ? (
              <SearchableSelect
                label="Home city"
                value={city}
                onChange={setCity}
                options={cities}
                placeholder="Select your city"
              />
            ) : (
              <Input
                label="Home city"
                value={city}
                onChange={field(setCity)}
                placeholder="Enter your city"
              />
            )
          )}
        </Section>

        {/* About */}
        <Section title="About you">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Bio</label>
              <span
                className={cn(
                  "text-[11px]",
                  bio.length > 480 ? "text-amber" : "text-gray-400",
                )}
              >
                {bio.length}/500
              </span>
            </div>
            <Textarea
              value={bio}
              rows={4}
              placeholder="Tell the community about yourself…"
              maxLength={500}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Select
            label="Education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Select level"
            options={EDUCATION_OPTIONS}
          />
          <Input
            label="Occupation"
            value={occupation}
            onChange={field(setOccupation)}
            placeholder="e.g. Software engineer"
          />
        </Section>

        {/* Travel */}
        <Section title="Travel profile">
          <TagInput
            label="Languages spoken"
            tags={languages}
            onChange={setLanguages}
            suggestions={COMMON_LANGUAGES}
            placeholder="Type a language and press Enter…"
          />
          <TagInput
            label="Countries visited"
            tags={countriesVisited}
            onChange={setCountriesVisited}
            suggestions={COUNTRIES}
            placeholder="Type a country and press Enter…"
          />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Traveller type
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAVELLER_CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleCategory(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
                    categories.includes(value)
                      ? "border-brand bg-brand text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowHobbies((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-brand font-medium"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  showHobbies && "rotate-90",
                )}
              />
              {showHobbies
                ? "Hide hobbies & interests"
                : "Add hobbies & interests"}
            </button>
            {showHobbies && (
              <div className="mt-3">
                <TagInput
                  tags={hobbies}
                  onChange={setHobbies}
                  placeholder="e.g. Photography, Yoga…"
                />
              </div>
            )}
          </div>
        </Section>

        {/* Emergency contact */}
        <Section title="Emergency contact">
          <p className="text-xs text-gray-500">
            Used only during safety emergencies. Not shown publicly.
          </p>
          <Input
            label="Contact name"
            value={emergencyName}
            onChange={field(setEmergencyName)}
            placeholder="Full name"
          />
          <Input
            label="Phone number"
            value={emergencyPhone}
            onChange={field(setEmergencyPhone)}
            placeholder="+1 555 000 0000"
          />
          <Select
            label="Relationship"
            value={emergencyRel}
            onChange={(e) => setEmergencyRel(e.target.value)}
            placeholder="Select relationship"
            options={RELATIONSHIP_OPTIONS}
          />
          <Input
            label="Email (optional)"
            value={emergencyEmail}
            onChange={field(setEmergencyEmail)}
            placeholder="contact@email.com"
            type="email"
          />
        </Section>

        {/* Social links */}
        <Section>
          <button
            type="button"
            onClick={() => setShowSocial((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-brand font-medium"
          >
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                showSocial && "rotate-90",
              )}
            />
            {showSocial ? "Hide social links" : "Add social media links"}
          </button>
          {showSocial && (
            <div className="space-y-3 mt-3">
              <Input
                label="Instagram"
                value={instagram}
                onChange={field(setInstagram)}
                placeholder="https://instagram.com/yourhandle"
              />
              <Input
                label="LinkedIn"
                value={linkedin}
                onChange={field(setLinkedin)}
                placeholder="https://linkedin.com/in/yourname"
              />
              <Input
                label="Facebook"
                value={facebook}
                onChange={field(setFacebook)}
                placeholder="https://facebook.com/yourname"
              />
            </div>
          )}
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2.5 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={() => save(true)}>
            Save changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
