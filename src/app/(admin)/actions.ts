"use server";

import { revalidatePath } from "next/cache";
import { createAdminDbClient } from "@/lib/supabase/server";

function requireFullAccess() {
  if (process.env.ADMIN_ROLE !== "full_access") {
    throw new Error("Full-access admin role required.");
  }
}

async function logAudit(actionType: string, targetEntityType: string, targetEntityId: string, metadata: Record<string, unknown> = {}) {
  const db = createAdminDbClient();
  await db.from("admin_audit_log").insert({
    action_type: actionType,
    target_entity_type: targetEntityType,
    target_entity_id: targetEntityId || null,
    metadata
  });
}

function toOptionalString(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (raw === null) return undefined;
  const value = String(raw).trim();
  return value.length > 0 ? value : null;
}

function toOptionalNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (raw === null) return undefined;
  const value = String(raw).trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toOptionalBoolean(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (raw === null) return undefined;
  return String(raw) === "true";
}

function toOptionalStringArray(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (raw === null) return undefined;
  const value = String(raw).trim();
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalIntegerArray(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (raw === null) return undefined;
  const value = String(raw).trim();
  if (!value) return [];
  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item));
  return parsed;
}

export async function updateCarStatus(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  await db.from("cars").update({ status }).eq("id", id);
  await logAudit("car_status_updated", "car", id, { status });
  revalidatePath("/cars");
  revalidatePath("/dashboard");
}

export async function updateCarFields(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const updatePayload: Record<string, unknown> = {};
  const requiredStringFields = new Set([
    "license_plate",
    "manufacturer",
    "model",
    "mileage_unit",
    "daily_price_currency",
    "pickup_city",
    "pickup_address",
    "return_city",
    "return_address",
  ]);
  const requiredNumberFields = new Set(["year", "mileage", "daily_price"]);

  const stringFields = [
    "vin_code",
    "license_plate",
    "manufacturer",
    "model",
    "mileage_unit",
    "additional_info_georgian",
    "additional_info_english",
    "steering_wheel",
    "drive_wheels",
    "transmission",
    "daily_price_currency",
    "deposit_currency",
    "discount_unit",
    "minimum_period_unit",
    "pickup_city",
    "pickup_address",
    "pickup_delivery_city",
    "pickup_delivery_currency",
    "return_city",
    "return_address",
    "return_delivery_city",
    "return_delivery_currency",
  ] as const;
  for (const field of stringFields) {
    const value = toOptionalString(formData, field);
    if (value !== undefined && !(requiredStringFields.has(field) && value === null)) {
      updatePayload[field] = value;
    }
  }

  const numberFields = [
    "year",
    "mileage",
    "daily_price",
    "deposit_amount",
    "discount_days",
    "discount_percentage",
    "minimum_period_days",
    "minimum_age",
    "buffer_period_hours",
    "pickup_delivery_price",
    "return_delivery_price",
  ] as const;
  for (const field of numberFields) {
    const value = toOptionalNumber(formData, field);
    if (value !== undefined && !(requiredNumberFields.has(field) && value === null)) {
      updatePayload[field] = value;
    }
  }

  const booleanFields = [
    "driver_required",
    "deposit_enabled",
    "discount_enabled",
    "any_period",
    "minimum_age_enabled",
    "pickup_delivery_enabled",
    "return_delivery_enabled",
  ] as const;
  for (const field of booleanFields) {
    const value = toOptionalBoolean(formData, field);
    if (value !== undefined) updatePayload[field] = value;
  }

  const categories = toOptionalStringArray(formData, "categories");
  if (categories !== undefined) updatePayload.categories = categories;
  const fuelTypes = toOptionalStringArray(formData, "fuel_types");
  if (fuelTypes !== undefined) updatePayload.fuel_types = fuelTypes;
  const additionalFeatures = toOptionalStringArray(formData, "additional_features");
  if (additionalFeatures !== undefined) updatePayload.additional_features = additionalFeatures;
  const seats = toOptionalIntegerArray(formData, "seats");
  if (seats !== undefined) updatePayload.seats = seats;

  if (Object.keys(updatePayload).length === 0) return;

  await db.from("cars").update(updatePayload).eq("id", id);
  await logAudit("car_fields_updated", "car", id, updatePayload);
  revalidatePath("/cars");
}

export async function rejectCarWithReason(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();

  const id = String(formData.get("id") ?? "");
  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();
  if (!id || !rejectionReason) return;

  const { data: car } = await db
    .from("cars")
    .select("id, owner_id, manufacturer, model")
    .eq("id", id)
    .single();
  if (!car?.owner_id) return;

  await db
    .from("cars")
    .update({ status: "rejected", rejection_reason: rejectionReason })
    .eq("id", id);

  const adminSenderId =
    process.env.ADMIN_CHAT_USER_ID ??
    (await (async () => {
      const { data: fallbackAdmin } = await db
        .from("profiles")
        .select("id")
        .ilike("first_name", "admin")
        .limit(1)
        .maybeSingle();
      return fallbackAdmin?.id ?? null;
    })());

  let relatedMessageId: string | null = null;
  let conversationId: string | null = null;

  if (adminSenderId) {
    const user1Id = adminSenderId < car.owner_id ? adminSenderId : car.owner_id;
    const user2Id = adminSenderId < car.owner_id ? car.owner_id : adminSenderId;

    const { data: existingConversation } = await db
      .from("conversations")
      .select("id")
      .eq("user1_id", user1Id)
      .eq("user2_id", user2Id)
      .is("booking_id", null)
      .maybeSingle();

    conversationId = existingConversation?.id ?? null;

    if (!conversationId) {
      const { data: createdConversation } = await db
        .from("conversations")
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          booking_id: null,
          car_id: id,
        })
        .select("id")
        .single();
      conversationId = createdConversation?.id ?? null;
    }

    if (conversationId) {
      const carTitle = `${car.manufacturer ?? ""} ${car.model ?? ""}`.trim() || "your car";
      const chatText = `Your car listing "${carTitle}" was rejected by ADMIN.\nReason: ${rejectionReason}`;
      const { data: insertedMessage } = await db
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: adminSenderId,
          recipient_id: car.owner_id,
          booking_id: null,
          message_text: chatText,
          is_read: false,
          message_type: "system",
          message_metadata: {
            event_type: "admin_car_rejected",
            sender_label: "ADMIN",
            car_id: id,
          },
        })
        .select("id")
        .single();
      relatedMessageId = insertedMessage?.id ?? null;
    }
  }

  await db.rpc("create_notification", {
    p_user_id: car.owner_id,
    p_type: "car_rejected",
    p_title: "Car rejected by ADMIN",
    p_message: rejectionReason,
    p_car_id: id,
    p_message_id: relatedMessageId,
  });

  await logAudit("car_rejected_with_reason", "car", id, {
    rejection_reason: rejectionReason,
    owner_id: car.owner_id,
    conversation_id: conversationId,
    admin_sender_id: adminSenderId,
    chat_message_sent: Boolean(relatedMessageId),
  });
  revalidatePath("/cars");
  revalidatePath("/notifications-log");
}

export async function updateBookingPayment(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "");
  if (!id || !payment_status) return;

  await db.from("bookings").update({ payment_status }).eq("id", id);
  await logAudit("booking_payment_status_updated", "booking", id, { payment_status });
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function updateBookingDates(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "");
  if (!id || !start_date || !end_date) return;

  await db.from("bookings").update({ start_date, end_date }).eq("id", id);
  await logAudit("booking_dates_overridden", "booking", id, { start_date, end_date });
  revalidatePath("/bookings");
}

export async function updateBookingPriceAndLateFee(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const totalAmountRaw = String(formData.get("total_amount") ?? "");
  const lateFeeRaw = String(formData.get("late_fee_amount") ?? "");
  const lateFeeTier = String(formData.get("late_fee_tier") ?? "");
  const payload: Record<string, unknown> = {};
  if (totalAmountRaw) payload.total_amount = Number(totalAmountRaw);
  if (lateFeeRaw) payload.late_fee_amount = Number(lateFeeRaw);
  if (lateFeeTier) payload.late_fee_tier = lateFeeTier;
  if (Object.keys(payload).length === 0) return;

  await db.from("bookings").update(payload).eq("id", id);
  await logAudit("booking_price_or_late_fee_updated", "booking", id, payload);
  revalidatePath("/bookings");
}

export async function issueBookingRefund(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const refundAmount = Number(String(formData.get("refund_amount") ?? "0"));
  const reasonCode = String(formData.get("refund_reason_code") ?? "");
  if (!id || !reasonCode || Number.isNaN(refundAmount)) return;

  await db
    .from("bookings")
    .update({
      payment_status: "refunded",
      refund_amount: refundAmount,
      refund_reason_code: reasonCode
    })
    .eq("id", id);
  await logAudit("refund_issued", "booking", id, { refundAmount, reasonCode });
  revalidatePath("/bookings");
}

export async function cancelBookingTechnicalError(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: "refunded",
      technical_error_cancelled: true,
      refund_reason_code: "technical_error"
    })
    .eq("id", id);
  await logAudit("cancel_full_refund_technical_error", "booking", id);
  revalidatePath("/bookings");
}

export async function flagTerritorialViolation(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("territorial_violation_notes") ?? "");
  if (!id) return;

  await db
    .from("bookings")
    .update({
      territorial_violation_flag: true,
      territorial_violation_notes: note || null
    })
    .eq("id", id);
  await logAudit("territorial_violation_flagged", "booking", id, { note });
  revalidatePath("/bookings");
}

export async function updateDisputeStatus(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const admin_notes = String(formData.get("admin_notes") ?? "");
  const resolution_type = String(formData.get("resolution_type") ?? "");
  const mediation_note_non_binding = String(formData.get("mediation_note_non_binding") ?? "");
  if (!id || !status) return;

  await db
    .from("reports")
    .update({
      status,
      deposit_flow_status: status,
      resolution_type: resolution_type || null,
      admin_notes: admin_notes || null,
      mediation_note_non_binding: mediation_note_non_binding || null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", id);

  await logAudit("mediation_resolved", "report", id, { status, resolution_type });
  revalidatePath("/disputes");
  revalidatePath("/dashboard");
}

export async function updateUserContact(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const first_name = String(formData.get("first_name") ?? "");
  const last_name = String(formData.get("last_name") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone_number = String(formData.get("phone_number") ?? "");

  await db
    .from("profiles")
    .update({ first_name: first_name || null, last_name: last_name || null, email: email || null, phone_number: phone_number || null })
    .eq("id", id);
  await logAudit("user_contact_updated", "user", id);
  revalidatePath("/users");
}

export async function updateUserCompliance(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const docs_verification_status = String(formData.get("docs_verification_status") ?? "");
  const privacy_violation_flag = String(formData.get("privacy_violation_flag") ?? "") === "true";
  const account_status = String(formData.get("account_status") ?? "");
  const privacy_violation_notes = String(formData.get("privacy_violation_notes") ?? "");
  const payload: Record<string, unknown> = {};
  if (docs_verification_status) payload.docs_verification_status = docs_verification_status;
  if (account_status) payload.account_status = account_status;
  payload.privacy_violation_flag = privacy_violation_flag;
  payload.privacy_violation_notes = privacy_violation_notes || null;

  await db.from("profiles").update(payload).eq("id", id);
  await logAudit("user_compliance_updated", "user", id, payload);
  revalidatePath("/users");
}

export async function sendPasswordReset(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.rpc("create_notification", {
    p_user_id: id,
    p_type: "message",
    p_title: "Password reset requested",
    p_message: "Admin requested a password reset. Use forgot password flow."
  });
  await logAudit("password_reset_link_sent", "user", id);
  revalidatePath("/users");
}

export async function updatePayoutStatus(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const hold_reason = String(formData.get("hold_reason") ?? "");
  if (!id || !status) return;

  await db.from("payouts").update({ status, hold_reason: hold_reason || null }).eq("id", id);
  await logAudit("payout_status_changed", "payout", id, { status });
  revalidatePath("/payouts");
}

export async function moderateReview(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  const moderation_status = String(formData.get("moderation_status") ?? "");
  const moderation_notes = String(formData.get("moderation_notes") ?? "");
  if (!id || !moderation_status) return;

  await db
    .from("reviews")
    .update({
      moderation_status,
      moderation_notes: moderation_notes || null,
      moderation_updated_at: new Date().toISOString()
    })
    .eq("id", id);
  await logAudit(moderation_status === "removed" ? "review_removed" : "review_reinstated", "review", id);
  revalidatePath("/reviews");
}

export async function resendNotification(formData: FormData) {
  requireFullAccess();
  const db = createAdminDbClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data } = await db.from("notifications").select("id, delivery_status").eq("id", id).single();
  if (!data || !["failed", "bounced"].includes(String(data.delivery_status ?? ""))) return;

  await db.from("notifications").update({ delivery_status: "delivered", last_resend_at: new Date().toISOString() }).eq("id", id);
  await logAudit("notification_resent", "notification", id);
  revalidatePath("/notifications-log");
}
