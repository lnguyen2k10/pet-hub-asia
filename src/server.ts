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
    const expectedToken = (process.env["SEPAY_WEBHOOK_TOKEN"] || "").trim();
    
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
      let paymentCode = "";
      const prefix = "PET";
      
      // SePay tự trích xuất nếu có cấu hình Cú pháp
      if (payload.code && payload.code.toUpperCase().startsWith(prefix)) {
        paymentCode = payload.code.substring(prefix.length).trim().toUpperCase();
      } 
      // Fallback tự tìm trong nội dung chuyển khoản
      else if (payload.content) {
        const match = payload.content.toUpperCase().match(/PET\s*([A-Z0-9]{6})/);
        if (match) paymentCode = match[1];
      }

      if (paymentCode) {
        const supabaseAdmin = createClient(
          process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "",
          process.env["SUPABASE_SERVICE_ROLE_KEY"] || ""
        );

        // Lấy tất cả đơn pending
        const { data: pendingRequests } = await supabaseAdmin
          .from("membership_requests")
          .select("*, membership_plans(*)")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        // Tìm đơn của user có user_id bắt đầu bằng paymentCode
        const userRequests = pendingRequests?.filter((r: { user_id: string }) => 
          (r.user_id.split("-")[0] || "").substring(0, 6).toUpperCase() === paymentCode
        ) || [];

        const transferAmount = payload.transferAmount ?? 0;
        
        // Chọn đơn khớp số tiền gần nhất, hoặc lấy đơn mới nhất
        let requestRecord = null;
        if (userRequests.length > 0) {
          // Ưu tiên đơn có amount khớp trong ngưỡng ±10%
          const exactMatch = userRequests.find((r: { amount: number }) =>
            Math.abs(r.amount - transferAmount) / Math.max(r.amount, 1) < 0.1
          );
          requestRecord = exactMatch ?? userRequests[0];
        }

        if (requestRecord) {
          const now = new Date();
          
          // Lấy thời hạn từ gói (nếu có), mặc định 365 ngày
          const plan = (requestRecord as { membership_plans?: { duration_days?: number } }).membership_plans;
          const durationDays: number = plan?.duration_days ?? 365;
          
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + durationDays);

          const { error: updateError } = await supabaseAdmin
            .from("membership_requests")
            .update({
              status: "approved",
              reviewed_at: now.toISOString(),
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              admin_note: `Duyệt tự động qua SePay (Giao dịch: ${payload.id}, Số tiền: ${transferAmount}đ, Thời hạn: ${durationDays} ngày)`
            })
            .eq("id", requestRecord.id);

          // Nếu shop chưa publish → publish luôn
          if (!updateError && requestRecord.shop_id) {
            await supabaseAdmin
              .from("shops")
              .update({ is_published: true })
              .eq("id", requestRecord.shop_id);
          }

          if (updateError) {
            console.error("Lỗi khi duyệt tự động:", updateError);
          } else {
            console.log(`✅ Đã kích hoạt gói ${durationDays} ngày cho đơn ${requestRecord.id} (code: ${paymentCode})`);
          }
        } else {
          console.log(`⚠️ Không tìm thấy đơn chờ duyệt cho Code: ${paymentCode}`);
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

async function handleContactSubmit(request: Request): Promise<Response> {
  try {
    const payload = await request.json();
    const botToken = process.env["TELEGRAM_BOT_TOKEN"] || process.env["VITE_TELEGRAM_BOT_TOKEN"];
    const chatId = process.env["TELEGRAM_CHAT_ID"] || process.env["VITE_TELEGRAM_CHAT_ID"];

    if (!botToken || !chatId) {
      console.warn("Chưa cấu hình Telegram Bot. Vui lòng thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào .env");
      return new Response(JSON.stringify({ success: true, message: "No telegram config" }), { 
        status: 200, 
        headers: { "content-type": "application/json" } 
      });
    }

    const message = `🔔 **Có tin nhắn liên hệ mới từ 1Pet.Asia**\n\n` +
      `👤 **Tên:** ${payload.name || "Không có tên"}\n` +
      `📞 **SĐT/Email:** ${payload.contact || "Không có SĐT/Email"}\n` +
      `💬 **Tin nhắn:**\n${payload.message || "Không có nội dung"}`;

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error("Lỗi gửi Telegram:", err);
      throw new Error("Telegram API error");
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "content-type": "application/json" } 
    });
  } catch (error) {
    console.error("Lỗi xử lý form liên hệ:", error);
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
      if (url.pathname === '/api/contact' && request.method === 'POST') {
        return await handleContactSubmit(request);
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
