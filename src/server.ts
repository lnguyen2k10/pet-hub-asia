import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

import { createClient } from "@supabase/supabase-js";

import * as crypto from 'node:crypto';

async function handleSepayWebhook(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const signature = request.headers.get("X-SePay-Signature");
    const timestamp = request.headers.get("X-SePay-Timestamp");
    const expectedToken = (process.env.SEPAY_WEBHOOK_TOKEN || "").trim();
    
    let payload;

    if (signature && timestamp) {
      // Xác thực bằng HMAC-SHA256 (Bảo mật cao nhất)
      const rawBody = await request.text();
      const expectedSignature = 'sha256=' + crypto.createHmac('sha256', expectedToken).update(timestamp + '.' + rawBody).digest('hex');
      
      if (signature !== expectedSignature) {
        console.error("HMAC Auth failed. Expected:", expectedSignature, "Got:", signature);
        return new Response(JSON.stringify({ success: false, message: "Invalid HMAC signature" }), { status: 401 });
      }
      payload = JSON.parse(rawBody);
    } else {
      // Xác thực bằng API Key thông thường
      if (expectedToken && !authHeader.includes(expectedToken)) {
        console.error("Auth failed. Expected:", expectedToken, "Got:", authHeader);
        return new Response(JSON.stringify({ success: false, message: "Unauthorized", debug_header: authHeader }), { status: 401 });
      }
      payload = await request.json();
    }
    console.log("Nhận webhook từ SePay:", payload);

    if (payload.transferType === "in") {
      let phone = "";
      const prefix = "PET";
      
      // SePay tự trích xuất nếu có cấu hình Cú pháp
      if (payload.code && payload.code.toUpperCase().startsWith(prefix)) {
        phone = payload.code.substring(prefix.length).trim();
      } 
      // Fallback tự tìm trong nội dung chuyển khoản
      else if (payload.content) {
        const match = payload.content.toUpperCase().match(/PET\s*(\d{8,15})/);
        if (match) phone = match[1];
      }

      if (phone) {
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { data: requestRecord, error: searchError } = await supabaseAdmin
          .from("membership_requests")
          .select("*")
          .eq("contact_phone", phone)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!searchError && requestRecord) {
          const now = new Date();
          const nextYear = new Date();
          nextYear.setFullYear(now.getFullYear() + 1);

          const { error: updateError } = await supabaseAdmin
            .from("membership_requests")
            .update({
              status: "approved",
              reviewed_at: now.toISOString(),
              starts_at: now.toISOString(),
              expires_at: nextYear.toISOString(),
              admin_note: `Duyệt tự động qua SePay (Giao dịch: ${payload.id})`
            })
            .eq("id", requestRecord.id);

          if (updateError) {
            console.error("Lỗi khi duyệt tự động:", updateError);
          } else {
            console.log(`Đã duyệt tự động thành công cho đơn ${requestRecord.id}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Lỗi server xử lý webhook:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/api/sepay' && request.method === 'POST') {
        return await handleSepayWebhook(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
