"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { AVATARS, getAvatar } from "@/lib/avatars";

const GRADE_LEVELS = [
  "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  "Grade 11", "Grade 12",
  "1st Year College", "2nd Year College", "3rd Year College", "4th Year College", "5th Year College",
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface Profile {
  display_name: string;
  gender: string | null;
  school: string | null;
  show_school: boolean;
  grade_level: string | null;
  bio: string;
  birth_year: number;
  avatar: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [school, setSchool] = useState("");
  const [showSchool, setShowSchool] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("default");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, gender, school, show_school, grade_level, bio, birth_year, avatar")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setGender(data.gender ?? "");
        setSchool(data.school ?? "");
        setShowSchool(data.show_school);
        setGradeLevel(data.grade_level ?? "");
        setBio(data.bio ?? "");
        setAvatar(data.avatar ?? "default");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!displayName.trim()) { setError("Display name is required."); return; }
    setError(""); setSaving(true); setSaved(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        gender: gender || null,
        school: school.trim() || null,
        show_school: showSchool,
        grade_level: gradeLevel || null,
        bio: bio.trim(),
        avatar,
      })
      .eq("id", user.id);

    setSaving(false);
    if (err) { setError("Failed to save. Try again."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const currentAvatar = getAvatar(avatar);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "580px" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          I-update ang profile mo. Ang display name lang ang visible sa ibang students.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile section */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-faint)" }}>
            Profile
          </p>

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: currentAvatar.bg }}>
              {currentAvatar.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Display Name
              </label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="dark-input" placeholder="Your display name" />
            </div>
          </div>

          {/* Avatar picker */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Choose Avatar
            </label>
            <div className="grid grid-cols-10 gap-2">
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all"
                  style={{
                    background: a.bg,
                    outline: avatar === a.id ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                    outlineOffset: "2px",
                    transform: avatar === a.id ? "scale(1.1)" : "scale(1)",
                  }}>
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
              Bio
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))}
              className="dark-input resize-none" rows={2}
              placeholder="Short intro about yourself… (optional)" />
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{bio.length}/150</p>
          </div>

          {/* Gender */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Gender
            </label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button key={g.value} onClick={() => setGender(g.value)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={gender === g.value ? {
                    background: "linear-gradient(90deg, rgba(245,158,11,0.25), rgba(111,192,180,0.1))",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                  } : {
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade level */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
              Grade Level
            </label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
              className="dark-input">
              <option value="">Select grade level…</option>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Birth year (read-only) */}
          {profile?.birth_year && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Birth Year
              </label>
              <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--bg-surface)", color: "var(--text-faint)" }}>
                {profile.birth_year} <span className="text-xs ml-2">(cannot be changed)</span>
              </p>
            </div>
          )}
        </div>

        {/* School section */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-faint)" }}>
            School
          </p>

          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
              School Name
            </label>
            <input value={school} onChange={(e) => setSchool(e.target.value)}
              className="dark-input" placeholder="e.g. UP Diliman, DLSU, Rizal High School…" />
          </div>

          {/* Show school toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setShowSchool((p) => !p)}
              className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
              style={{ background: showSchool ? "linear-gradient(90deg,#F59E0B,#6FC0B4)" : "var(--bg-white-muted)" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: showSchool ? "calc(100% - 18px)" : "2px" }} />
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-body)" }}>
                Show school sa profile
              </span>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Kapag off, hindi makikita ng ibang students ang school mo.
              </p>
            </div>
          </label>
        </div>

        {/* Save */}
        {error && (
          <p className="text-sm rounded-xl px-4 py-2.5"
            style={{ background: "var(--accent-red-bg)", color: "var(--accent-red)", border: "1px solid var(--accent-red-border)" }}>
            {error}
          </p>
        )}

        <button onClick={handleSave} disabled={saving}
          className="btn-glow w-full" style={{ padding: "12px 24px" }}>
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
