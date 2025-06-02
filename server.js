import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { setupDatabase, getDB } from "./database.js";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const {
  GRAPH_API_TOKEN,
  PHONE_NUMBER_ID,
  WEBHOOK_VERIFY_TOKEN,
  PORT = 3000,
} = process.env;

// Send plain text message
async function sendText(text, to) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📤 Sent message to ${to}: "${text}"`);
  } catch (err) {
    console.error("❌ Failed to send text:", err.response?.data || err.message);
  }
}

// Send insurance template with PDF attachment
async function sendInsuranceTemplate(to) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "insurance",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Rakshit" },
                { type: "text", text: "RakInsurance Premium" },
                { type: "text", text: "May 28, 2025" },
              ],
            },
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    link: "https://cdn.glitch.global/9011f1b7-59c9-4dd0-8086-13e26b4efe93/insurance.pdf?v=1748845134453",
                    filename: "insurance.pdf",
                  },
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`📤 Sent insurance template to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send insurance template:", err.response?.data || err.message);
  }
}

// Generate dynamic PDF
function generatePDF(content, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(20).text("Your Selected Insurance Plan", { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(content);
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// Upload and send document
async function sendDocument(filePath, fileName, to) {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("messaging_product", "whatsapp");
    form.append("type", "document");

    const mediaRes = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          ...form.getHeaders(),
        },
      }
    );

    const mediaId = mediaRes.data.id;

    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          id: mediaId,
          filename: fileName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📤 Sent document ${fileName} to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send document:", err.response?.data || err.message);
  }
}

// Handle incoming WhatsApp messages
app.post("/webhook", async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const text = message?.text?.body;
  const from = message?.from;

  if (text) {
    const lowerText = text.toLowerCase().trim();

    if (lowerText === "insurance") {
      await sendInsuranceTemplate(from);
      await sendText("Please reply with a number (1-5) to choose an insurance plan.", from);
    } else if (["1", "2", "3", "4", "5"].includes(lowerText)) {
      const db = await getDB();
      const plans = await db.all("SELECT * FROM insurance");
      const index = parseInt(lowerText, 10) - 1;
      const plan = plans[index];

      if (plan) {
        await db.run(
          `INSERT INTO user_selection (phone, insurance_id) VALUES (?, ?)`,
          [from, plan.id]
        );

        await sendText(`You selected *${plan.name}*:\n${plan.description}`, from);

        const fileName = `${plan.name.replace(/\s+/g, "_")}_${from}.pdf`;
        const filePath = path.join(os.tmpdir(), fileName);

        const currentDate = new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const userDetails = `Issued To: ${from}\nDate: ${currentDate}`;
        const content = `${plan.name}\n\n${plan.description}\nCoverage: ₹${plan.coverage}\n\n${userDetails}`;

        try {
          await generatePDF(content, filePath);
          await sendDocument(filePath, fileName, from);
          fs.unlink(filePath, () => {}); // cleanup
        } catch (err) {
          console.error("❌ PDF error:", err.message);
          await sendText("Failed to generate your insurance document. Please try again.", from);
        }
      } else {
        await sendText("Invalid plan number. Please choose between 1 and 5.", from);
      }
    } else {
      await sendText("Hi! Type *Insurance* to explore our plans.", from);
    }
  }

  res.sendStatus(200);
});

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    res.status(200).send(challenge);
  } else {
    console.warn("❌ Webhook verification failed");
    res.sendStatus(403);
  }
});

// Initialize DB and start server
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
