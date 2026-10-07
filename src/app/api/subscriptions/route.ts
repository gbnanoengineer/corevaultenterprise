import { NextResponse } from "next/server";
import { getActiveOrgContext } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const orgId = activeOrg.id;

    const subscriptions = db.prepare(`
      SELECT * FROM subscriptions
      WHERE organization_id = ?
      ORDER BY next_renewal_date ASC, cost DESC
    `).all(orgId) as any[];

    // Compute monthly equivalent burn
    let monthlyBurn = 0;
    subscriptions.forEach((sub) => {
      if (sub.active) {
        if (sub.billing_cycle === "monthly") {
          monthlyBurn += sub.cost;
        } else if (sub.billing_cycle === "annual") {
          monthlyBurn += sub.cost / 12;
        } else if (sub.billing_cycle === "quarterly") {
          monthlyBurn += sub.cost / 3;
        }
      }
    });

    return NextResponse.json({
      subscriptions,
      summary: {
        totalSubscriptions: subscriptions.length,
        activeCount: subscriptions.filter((s) => s.active).length,
        monthlyBurn: Math.round(monthlyBurn * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Subscriptions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getActiveOrgContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized or no active organization" }, { status: 401 });
    }

    const { activeOrg } = context;
    const orgId = activeOrg.id;

    const body = await req.json();
    const {
      name,
      category = "Dev Tools",
      cost,
      currency = activeOrg.currency || "USD",
      billing_cycle = "monthly",
      next_renewal_date,
      payment_method = "Company Card",
      auto_renew = 1,
      active = 1,
      notes = "",
      url = "",
    } = body;

    if (!name || !cost || isNaN(parseFloat(cost))) {
      return NextResponse.json({ error: "Valid subscription name and cost required" }, { status: 400 });
    }

    const id = "sub_" + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO subscriptions (id, name, category, cost, currency, billing_cycle, next_renewal_date, payment_method, auto_renew, active, notes, url, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      category,
      parseFloat(cost),
      currency,
      billing_cycle,
      next_renewal_date || new Date().toISOString().split("T")[0],
      payment_method,
      auto_renew ? 1 : 0,
      active ? 1 : 0,
      notes,
      url,
      orgId
    );

    const created = db.prepare("SELECT * FROM subscriptions WHERE id = ? AND organization_id = ?").get(id, orgId);
    return NextResponse.json({ success: true, subscription: created });
  } catch (error) {
    console.error("Subscriptions POST error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
