# WhatsApp Insurance Bot  

This project implements a full-stack WhatsApp chatbot using **WhatsApp Cloud API**, **Node.js**, and **PDFKit** to automate insurance plan selection and **PDF generation** for customers.

Users can interact with the bot by typing `"insurance"` on WhatsApp, choose a plan from a list, and receive a dynamically generated **PDF insurance document** that includes their details and selected plan information.


##  Features

- ✅ WhatsApp Cloud API integration with webhook.
- ✅ SQLite database to store available plans and user selections.
- ✅ **Dynamic PDF generation** with user's phone number and insurance details.
- ✅ Template message support with pre-attached sample document.
- ✅ Real-time document upload and delivery via WhatsApp document API.

---

##  Screenshots & Demos

You can view the chatbot in action and setup steps here:  
📂 [Demo Video – Google Drive](https://drive.google.com/file/d/1Z2WhRPgB-a2gN6zd0Xvfnivs7pvwYNNZ/view?usp=sharing)

---

##  Project Structure

├── server.js # Main server handling webhook and message logic  
├── database.js # SQLite setup and helper functions   
├── .env # Contains API credentials and configs  
└── README.md # You're here!  


---

##  How It Works

1. **Webhook Setup**  
   Webhook is registered with WhatsApp Cloud API and handles incoming messages (`/webhook` endpoint).

2. **Triggering the Flow**  
   User sends the keyword `insurance` on WhatsApp. This:
   - Sends a pre-approved template with a static insurance PDF.
   - Asks the user to select a plan by replying with a number (1–5).

3. **PDF Generation & Delivery**  
   When the user responds:
   - The selected plan is fetched from the database.
   - A **custom PDF** is generated using PDFKit with:
     - Plan name, description, coverage
     - User’s WhatsApp number
     - Current date
   - The PDF is uploaded to WhatsApp and sent as a document.

4. **Database**  
   Two tables:
   - `insurance`: stores 5 pre-defined insurance plans
   - `user_selection`: logs user's chosen plan and phone number


##  Technologies Used

| Stack | Tech |
|-------|------|
| Backend | Node.js, Express |
| Database | SQLite |
| PDF Generation | PDFKit |
| Messaging API | WhatsApp Cloud API (Graph API) |
| Deployment | Localhost or Glitch/Vercel/Render |


##  Sample Interaction

> User: insurance  
> Bot: [Sends template with insurance.pdf]  
> Bot: Please reply with a number (1–5) to choose an insurance plan.  
> User: 2  
> Bot: You selected "Health Plus": Covers hospitalization, surgeries, etc.  
> Bot: [Sends dynamically generated PDF with full details]  



---

## 🗃️ Database Schema

```sql
CREATE TABLE insurance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  coverage INTEGER
);

CREATE TABLE user_selection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  insurance_id INTEGER
);
```


##  Testing
You can test using:

WhatsApp Sandbox or real business account

Tools like ngrok for exposing localhost during dev


##  Author

Built by **Rakshit Bansal** — learning and exploring how APIs and messaging platforms connect, sending files as attachments in marketing templates.  
This project was created as part of a practical WhatsApp Cloud API learning series.  
Feel free to fork or suggest improvements!








