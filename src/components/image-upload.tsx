import { useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadShopImage(file: File, userId: string, folder: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("shop-media")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("shop-media")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Không tạo được liên kết ảnh.");
  return data.signedUrl;
}

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  userId: string;
  folder: string;
  aspect?: "square" | "wide";
};

export function ImageUpload({ label, value, onChange, userId, folder, aspect = "wide" }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setBusy(true);
    try {
      onChange(await uploadShopImage(file, userId, folder));
      toast.success("Đã tải ảnh lên!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-sand-deep/60 ring-1 ring-border ${
            aspect === "square" ? "size-16" : "h-16 w-28"
          }`}
        >
          {value ? (
            <img src={value} alt={label} className="size-full object-cover" />
          ) : (
            <span className="text-xs text-ink-soft">{busy ? "..." : "Chọn ảnh"}</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-sand-deep px-3.5 py-1.5 text-xs font-semibold text-terra-deep disabled:opacity-60"
            >
              {busy ? "Đang tải..." : value ? "Đổi ảnh" : "Tải ảnh lên"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-terra-deep"
              >
                Gỡ ảnh
              </button>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-ink-soft">JPG/PNG/WebP, tối đa 5MB.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handle(file);
        }}
      />
    </div>
  );
}
