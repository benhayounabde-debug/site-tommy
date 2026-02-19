const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe");
const cors = require("cors")({origin: true});

admin.initializeApp();
const db = admin.firestore();

// ===== Creer une session de paiement Stripe =====
exports.createCheckoutSession = functions
    .region("europe-west1")
    .https.onRequest((req, res) => {
      cors(req, res, async () => {
        if (req.method !== "POST") {
          return res.status(405).json({error: "Method not allowed"});
        }

        try {
          const {trackingId} = req.body;

          if (!trackingId) {
            return res.status(400).json({error: "trackingId requis"});
          }

          // Recuperer la commande depuis Firestore
          const snap = await db.collection("orders")
              .where("trackingId", "==", trackingId)
              .limit(1)
              .get();

          if (snap.empty) {
            return res.status(404).json({error: "Commande introuvable"});
          }

          const orderDoc = snap.docs[0];
          const order = orderDoc.data();

          // Verifier que la commande est bien en attente de paiement
          if (order.paymentStatus === "paye") {
            return res.status(400).json({error: "Commande deja payee"});
          }

          if (order.status !== "valide") {
            return res.status(400).json({
              error: "Commande non validee",
            });
          }

          // Extraire le montant du prix (ex: "25€", "25,50€", "25.50€")
          const priceStr = order.price || "0";
          const amount = Math.round(
              parseFloat(priceStr.replace(/[^0-9.,]/g, "").replace(",", ".")) *
              100,
          );

          if (amount <= 0) {
            return res.status(400).json({error: "Montant invalide"});
          }

          // Cle secrete Stripe depuis la config Firebase
          const stripeSecret = functions.config().stripe?.secret;
          if (!stripeSecret) {
            return res.status(500).json({
              error: "Stripe non configure",
            });
          }

          const stripeClient = stripe(stripeSecret);

          // Creer la session Stripe Checkout
          const session = await stripeClient.checkout.sessions.create({
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

          return res.status(200).json({url: session.url});
        } catch (err) {
          console.error("Erreur creation session:", err);
          return res.status(500).json({error: err.message});
        }
      });
    });

// ===== Webhook Stripe - confirme le paiement =====
exports.stripeWebhook = functions
    .region("europe-west1")
    .https.onRequest(async (req, res) => {
      const stripeSecret = functions.config().stripe?.secret;
      const webhookSecret = functions.config().stripe?.webhook_secret;

      if (!stripeSecret || !webhookSecret) {
        return res.status(500).send("Stripe non configure");
      }

      const stripeClient = stripe(stripeSecret);
      const sig = req.headers["stripe-signature"];

      let event;
      try {
        event = stripeClient.webhooks.constructEvent(
            req.rawBody,
            sig,
            webhookSecret,
        );
      } catch (err) {
        console.error("Webhook signature invalide:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Traiter l'evenement de paiement reussi
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const {trackingId, orderId} = session.metadata;

        try {
          await db.collection("orders").doc(orderId).update({
            paymentStatus: "paye",
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Paiement confirme pour commande ${trackingId}`);
        } catch (err) {
          console.error("Erreur mise a jour commande:", err);
          return res.status(500).send("Erreur interne");
        }
      }

      return res.status(200).json({received: true});
    });
