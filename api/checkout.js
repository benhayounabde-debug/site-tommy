const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");

// Initialiser Firebase Admin une seule fois
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://site-1-8effa.web.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { trackingId } = req.body;

    if (!trackingId) {
      return res.status(400).json({ error: "trackingId requis" });
    }

    // Recuperer la commande depuis Firestore
    const snap = await db
      .collection("orders")
      .where("trackingId", "==", trackingId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Commande introuvable" });
    }

    const orderDoc = snap.docs[0];
    const order = orderDoc.data();

    if (order.paymentStatus === "paye") {
      return res.status(400).json({ error: "Commande deja payee" });
    }

    if (order.status !== "valide") {
      return res.status(400).json({ error: "Commande non validee" });
    }

    // Extraire le montant (ex: "25€", "25,50€")
    const priceStr = order.price || "0";
    const amount = Math.round(
      parseFloat(priceStr.replace(/[^0-9.,]/g, "").replace(",", ".")) * 100
    );

    if (amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    // Creer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: order.productName || "Commande Tommy3D",
              description: `Commande N° ${trackingId}`,
            },
            unit_amount: amount,
          },
          quantity: order.quantity || 1,
        },
      ],
      metadata: {
        trackingId: trackingId,
        orderId: orderDoc.id,
      },
      success_url: `https://site-1-8effa.web.app/paiement.html?id=${trackingId}&status=success`,
      cancel_url: `https://site-1-8effa.web.app/paiement.html?id=${trackingId}&status=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erreur creation session:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
