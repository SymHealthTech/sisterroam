"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import VerificationGate from "@/components/ui/VerificationGate";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Save,
  ImagePlus,
  X,
} from "lucide-react";
import { calculateReadTime } from "@/lib/utils";
import { directUpload } from "@/lib/uploadClient";

const CATEGORIES = [
  { value: "solo_travel", label: "Solo Travel" },
  { value: "cycling", label: "Cycling" },
  { value: "trekking", label: "Trekking" },
  { value: "running", label: "Running" },
  { value: "safety_experience", label: "Safety Experience" },
  { value: "cultural_immersion", label: "Cultural Immersion" },
  { value: "food_journey", label: "Food Journey" },
  { value: "budget_travel", label: "Budget Travel" },
  { value: "tips_and_advice", label: "Tips & Advice" },
  { value: "co_traveller_experience", label: "Co-traveller" },
  { value: "hosting_experience", label: "Hosting Experience" },
  { value: "destination_guide", label: "Destination Guide" },
];

function ToolbarButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand-lighter rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}

export default function NewStoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [title, setTitle] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverPubId, setCoverPubId] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftSlug, setDraftSlug] = useState(null);
  const [draftReady, setDraftReady] = useState(false);

  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const editorRef = useRef(null);

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCoverUploading(true);
    try {
      const { url, publicId } = await directUpload(file, {
        folder: "sisterroam/stories",
        type: "blog_cover",
      });
      setCoverImageUrl(url);
      setCoverPubId(publicId);
    } catch (err) {
      toast.error(err.message ?? "Upload failed. Try again.");
    } finally {
      setCoverUploading(false);
    }
  }

  const tier = session?.user?.verificationTier;
  const isVerified = tier && tier !== "basic";

  // Load draft data once session is available
  useEffect(() => {
    if (!draftId || !session?.user?.id) return;
    fetch("/api/stories/my-stories")
      .then((r) => r.json())
      .then((d) => {
        const draft = (d.data?.stories ?? []).find((s) => s._id === draftId);
        if (!draft) {
          toast.error("Draft not found");
          return;
        }
        setTitle(draft.title ?? "");
        setCoverImageUrl(draft.coverImageUrl ?? "");
        setCoverPubId(draft.coverImagePublicId ?? "");
        setCategory(draft.category ?? "");
        setTags(draft.tags ?? []);
        setContent(draft.content ?? "");
        setDraftSlug(draft.slug);
        setDraftReady(true);
      })
      .catch(() => toast.error("Failed to load draft"));
  }, [draftId, session?.user?.id]);

  // Populate the contentEditable editor once — only when draftReady flips true.
  // Must NOT include `content` in deps; that would re-run on every keystroke and
  // reset innerHTML, sending the cursor back to the top.
  useEffect(() => {
    if (!draftReady || !editorRef.current) return;
    editorRef.current.innerHTML = content;
    const text = editorRef.current.innerText ?? "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadTime(words > 0 ? calculateReadTime(text) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady]);

  function handleEditorInput() {
    const text = editorRef.current?.innerText ?? "";
    setContent(editorRef.current?.innerHTML ?? "");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadTime(words > 0 ? calculateReadTime(text) : "");
  }

  function execCmd(cmd, value = null) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (!tags.includes(tag) && tags.length < 5)
        setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  }

  async function save(isPublished) {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    const setter = isPublished ? setPublishing : setSaving;
    setter(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        coverImageUrl,
        coverImagePublicId: coverPubId,
        category: category || undefined,
        tags,
        excerpt: editorRef.current?.innerText?.slice(0, 200),
        isPublished,
      };

      const res = draftSlug
        ? await fetch(`/api/stories/${draftSlug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/stories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "Failed to save");
        return;
      }
      toast.success(isPublished ? "Your story is published!" : "Draft saved");
      router.push("/community/stories");
    } finally {
      setter(false);
    }
  }

  if (!isVerified) {
    return (
      <AppLayout title="Share a Story">
        <VerificationGate mode="page" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Share a Story">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your story title…"
          maxLength={200}
          className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent"
        />

        {/* Cover image */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Cover image{" "}
            <span className="text-gray-400 font-normal">
              (optional but recommended)
            </span>
          </p>
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
            {coverImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImageUrl("");
                    setCoverPubId("");
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  aria-label="Remove cover image"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white text-xs transition-colors"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-brand hover:bg-brand-lighter/30 transition-colors"
              >
                {coverUploading ? (
                  <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm font-medium">Add cover image</span>
                    <span className="text-xs">Recommended 16:9</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={handleCoverChange}
            />
          </div>
        </div>

        {/* Category + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-danger">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(up to 5)</span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type + Enter"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2.5 py-1 bg-brand-lighter text-brand text-xs rounded-full"
              >
                {t}
                <button
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  className="hover:text-brand-dark"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Rich text editor */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
            <ToolbarButton title="Bold" onClick={() => execCmd("bold")}>
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => execCmd("italic")}>
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarButton
              title="Heading 2"
              onClick={() => execCmd("formatBlock", "H2")}
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              onClick={() => execCmd("formatBlock", "H3")}
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarButton
              title="Bullet list"
              onClick={() => execCmd("insertUnorderedList")}
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered list"
              onClick={() => execCmd("insertOrderedList")}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Quote"
              onClick={() => execCmd("formatBlock", "BLOCKQUOTE")}
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolbarButton
              title="Link"
              onClick={() => {
                const url = window.prompt("Enter URL");
                if (url) execCmd("createLink", url);
              }}
            >
              <Link2 className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            data-placeholder="Start writing your story…&#10;&#10;Share where you went, what you experienced, and what other sisters should know."
            className="min-h-[300px] p-4 text-sm text-gray-800 leading-relaxed focus:outline-none prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:whitespace-pre-line"
            suppressContentEditableWarning
          />
        </div>

        {wordCount > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {wordCount} words · {readTime}
          </p>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 lg:left-60">
        <Button
          variant="secondary"
          onClick={() => save(false)}
          loading={saving}
          disabled={saving || publishing}
          className="flex-1 flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" /> Save draft
        </Button>
        <Button
          onClick={() => save(true)}
          loading={publishing}
          disabled={saving || publishing}
          className="flex-1"
        >
          Publish story
        </Button>
      </div>
    </AppLayout>
  );
}
