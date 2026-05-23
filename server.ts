import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Firebase Config safely from file or environment variables fallback
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

try {
  let firebaseConfig: any = null;
  
  if (fs.existsSync(CONFIG_PATH)) {
    const configContent = fs.readFileSync(CONFIG_PATH, "utf8");
    firebaseConfig = JSON.parse(configContent);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
    console.log("[FIREBASE INFO] Local config file missing; loading configuration from environment variables.");
    firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    };
  }

  if (firebaseConfig) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || firebaseConfig.projectId);
    console.log("[FIREBASE SUCCESS] Firestore database interface initialized successfully.");
  } else {
    console.warn("[FIREBASE WARN] Neither firebase-applet-config.json file nor Firebase environment variables were found. Falling back to local offline persistence.");
  }
} catch (err) {
  console.error("[FIREBASE ERROR] Failed to initialize Firebase backend database:", err);
}

// Files paths for local fallback persistence
const DATA_DIR = process.env.VERCEL === "1" ? "/tmp/data" : path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[PERSISTENCE WARN] Failed to create data folder:", err);
}

// ------------------------------------------------------------------
// AUTHENTICATION SECURITY SETUP
// ------------------------------------------------------------------
const OWNER_USERNAME = "thequeensarla123";
const PASSWORD_SALT = "roopkala_secure_salt_2026";
// Hash for "oxford54321" precalculated using SHA-512 and PBKDF2
const EXPECTED_HASH = crypto
  .pbkdf2Sync("oxford54321", PASSWORD_SALT, 1000, 64, "sha512")
  .toString("hex");

const JWT_SECRET = process.env.JWT_SECRET || "roopkala_sanctuary_elite_token_key_2026";

// Generate customized secure token (HMAC SHA256 base64url standard structure)
function generateToken(payload: { username: string; role: string }, expiryMinutes = 60): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
  const fullPayload = { ...payload, exp };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}

// Validate custom secure token
function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

// Security Middleware to protect Owner routes
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: Owner token required." });
  }

  const token = authHeader.split(" ")[1];
  const verified = verifyToken(token);
  if (!verified || verified.role !== "owner") {
    return res.status(403).json({ error: "Access Forbidden: Owner credential invalid or timed out." });
  }

  req.user = verified;
  next();
}

// Extend Request type to hold user info
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ------------------------------------------------------------------
// INITIALIZE SEED DATA
// ------------------------------------------------------------------
export interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  selectedServices: Array<{ id: string; name: string; price: number }>;
  notes: string;
  bridalPackageType: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  totalPrice: number;
  createdAt: string;
}

export interface SalonSettings {
  workingHours: { start: string; end: string };
  availableSlots: string[];
  maxBookingsPerDay: number;
  holidays: string[];
  blockedDates: string[];
  disabledSlotsByDate: { [date: string]: string[] };
}

const DEFAULT_SETTINGS: SalonSettings = {
  workingHours: { start: "09:00", end: "20:00" },
  availableSlots: [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00"
  ],
  maxBookingsPerDay: 5,
  holidays: ["2026-06-01", "2026-10-02"], // Seed holidays
  blockedDates: ["2026-06-15"], // Blocked coordinates
  disabledSlotsByDate: {
    "2026-05-25": ["13:00", "14:00"] // Lunch hour blocked
  }
};

const SEED_APPOINTMENTS: Booking[] = [
  {
    id: "booking-101",
    name: "Shalini Rajput",
    phone: "9898951234",
    date: "2026-05-22",
    time: "10:00",
    selectedServices: [
      { id: "bridal-royal", name: "Royal Signature Bridal Makeover", price: 24999 }
    ],
    notes: "Requires specific baby's breath accessory setup. Golden elements.",
    bridalPackageType: "Standard",
    status: "approved",
    totalPrice: 24999,
    createdAt: new Date().toISOString()
  },
  {
    id: "booking-102",
    name: "Neha Goel",
    phone: "9123456789",
    date: "2026-05-22",
    time: "13:00",
    selectedServices: [
      { id: "skin-gold-facial", name: "Roopkala 24K Gold Luxury Glow Treatment", price: 5500 }
    ],
    notes: "Pre-wedding trial session. Skin is sensitive to direct oils.",
    bridalPackageType: "Standard",
    status: "completed",
    totalPrice: 5500,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "booking-103",
    name: "Aarti Verma",
    phone: "9555660012",
    date: "2026-05-23",
    time: "11:00",
    selectedServices: [
      { id: "bridal-hd", name: "Classic High-Definition HD Bridal Makeup", price: 18500 },
      { id: "essential-gel-nails", name: "Glass-Gel Bridal Nail Extensions", price: 3500 }
    ],
    notes: "Double volume extension styling preferred.",
    bridalPackageType: "Sagan Package",
    status: "pending",
    totalPrice: 19800, // includes 10% multi discount
    createdAt: new Date().toISOString()
  },
  {
    id: "booking-104",
    name: "Simran Kaur",
    phone: "9676767112",
    date: "2026-05-24",
    time: "09:00",
    selectedServices: [
      { id: "bridal-engagement", name: "Celestial Engagement & Sagan Makeup", price: 12000 }
    ],
    notes: "Needs absolute on-time exit for morning sagan.",
    bridalPackageType: "Sagan Package",
    status: "pending",
    totalPrice: 12000,
    createdAt: new Date(Date.now() - 20 * 3600000).toISOString()
  },
  {
    id: "booking-105",
    name: "Meera Oberoi",
    phone: "9812349812",
    date: "2026-05-20",
    time: "15:00",
    selectedServices: [
      { id: "hair-balayage", name: "French Balayage & Glaze Melt", price: 8500 }
    ],
    notes: "First time visit, references from Instagram portfolio look.",
    bridalPackageType: "Standard",
    status: "completed",
    totalPrice: 8500,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "booking-106",
    name: "Rhea Sen",
    phone: "9000111222",
    date: "2026-05-19",
    time: "16:00",
    selectedServices: [
      { id: "bridal-party", name: "Glitz & Glam Custom Party Makeover", price: 6500 }
    ],
    notes: "Cancelled due to matching bridesmaid coordinate delays.",
    bridalPackageType: "Standard",
    status: "cancelled",
    totalPrice: 6500,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

// Read settings
async function getSettings(): Promise<SalonSettings> {
  if (db) {
    try {
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SalonSettings;
      } else {
        await setDoc(docRef, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (err) {
      console.error("Firestore read settings failed, running local JSON fallback. error:", err);
    }
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
    } catch (err) {
      console.warn("[PERSISTENCE WARN] Failed to write default settings file locally:", err);
    }
    return DEFAULT_SETTINGS;
  }
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

// Save settings 
async function saveSettings(settings: SalonSettings): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, "settings", "config");
      await setDoc(docRef, settings);
    } catch (err) {
      console.error("Firestore save settings failed, error:", err);
    }
  }
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
  } catch (err) {
    console.warn("[PERSISTENCE WARN] Failed to save settings file locally:", err);
  }
}

// Read appointments
async function getAppointments(): Promise<Booking[]> {
  if (db) {
    try {
      const colRef = collection(db, "appointments");
      const qSnap = await getDocs(colRef);
      if (qSnap.empty) {
        console.log("Firestore empty. Seeding initial appointments...");
        for (const booking of SEED_APPOINTMENTS) {
          await setDoc(doc(db, "appointments", booking.id), booking);
        }
        return SEED_APPOINTMENTS;
      }
      const list: Booking[] = [];
      qSnap.forEach((docSnap) => {
        list.push(docSnap.data() as Booking);
      });
      return list;
    } catch (err) {
      console.error("Firestore read appointments failed, running local JSON fallback. error:", err);
    }
  }
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    try {
      fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(SEED_APPOINTMENTS, null, 2), "utf8");
    } catch (err) {
      console.warn("[PERSISTENCE WARN] Failed to write seed appointments file locally:", err);
    }
    return SEED_APPOINTMENTS;
  }
  try {
    const data = fs.readFileSync(APPOINTMENTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return SEED_APPOINTMENTS;
  }
}

// Save appointments
async function saveAppointments(appointments: Booking[]): Promise<void> {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), "utf8");
  } catch (err) {
    console.warn("[PERSISTENCE WARN] Failed to save appointments file locally:", err);
  }
}

// Save single appointment to firestore (helper)
async function saveAppointmentToDb(booking: Booking): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, "appointments", booking.id);
      await setDoc(docRef, booking);
    } catch (err) {
      console.error("Firestore save booking failed, error:", err);
    }
  }
}

// Delete single appointment from firestore (helper)
async function deleteAppointmentFromDb(id: string): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, "appointments", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Firestore delete booking failed, error:", err);
    }
  }
}

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// 1. PUBLIC SETTINGS LOAD
app.get("/api/settings", async (req, res) => {
  res.json(await getSettings());
});

// 2. ADMIN SETTINGS EXCLUSIVE UPDATE
app.put("/api/settings", authenticateAdmin, async (req, res) => {
  try {
    const settings = req.body as SalonSettings;
    if (!settings.workingHours || !Array.isArray(settings.availableSlots)) {
      return res.status(400).json({ error: "Invalid settings dataset structure." });
    }
    await saveSettings(settings);
    res.json({ message: "Salon settings updated successfully.", settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to write settings." });
  }
});

// 3. OWNER SECURE AUTHENTICATOR
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing identity credentials." });
  }

  const computedHash = crypto
    .pbkdf2Sync(password, PASSWORD_SALT, 1000, 64, "sha512")
    .toString("hex");

  if (username === OWNER_USERNAME && computedHash === EXPECTED_HASH) {
    // Generate secure token with 60 minutes duration
    const jwtToken = generateToken({ username, role: "owner" }, 60);
    return res.json({
      success: true,
      token: jwtToken,
      owner: { username: OWNER_USERNAME, role: "owner", title: "Queen Sarla" }
    });
  } else {
    return res.status(401).json({ error: "Invalid Username or Secret Password coordinate." });
  }
});

// Auth integrity check
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ loggedIn: false, error: "Access Denied." });
  }
  const token = authHeader.split(" ")[1];
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ loggedIn: false, error: "Token timed out or is corrupted." });
  }
  res.json({ loggedIn: true, owner: { username: verified.username, role: verified.role, title: "Queen Sarla" } });
});

// 4. CLIENT BOOKING SUBSTRATE WITH COMPLEX CONTROLS & TRIPLE CHECKS
app.post("/api/appointments/book", async (req, res) => {
  try {
    const { name, phone, date, time, selectedServices, notes, bridalPackageType } = req.body;

    if (!name || !phone || !date || !time || !Array.isArray(selectedServices)) {
      return res.status(400).json({ error: "Incomplete booking details. Please fill in all required fields." });
    }

    const configurations = await getSettings();
    const currentBookings = await getAppointments();

    // Checked standard date limits: date format or block dates
    if (configurations.blockedDates.includes(date)) {
      return res.status(400).json({
        error: "Notice: The requested date is temporarily blocked for special salon events. Please select another date."
      });
    }

    // Checked holidays
    if (configurations.holidays.includes(date)) {
      return res.status(400).json({
        error: "Holiday Rest: The salon is closed on this holiday. Please choose an alternate date."
      });
    }

    // Check individual disabled time slots for specific dates (e.g. customized slot closure)
    const disabledSlotsForDay = configurations.disabledSlotsByDate[date] || [];
    if (disabledSlotsForDay.includes(time)) {
      return res.status(400).json({
        error: "Slot Restricted: This hours range on this date has been blocked by Management."
      });
    }

    // Checked double booking (strict slot match check for active bookings)
    const identicalActiveBooking = currentBookings.find(
      (b) => b.date === date && b.time === time && b.status !== "cancelled" && b.status !== "rejected"
    );
    if (identicalActiveBooking) {
      return res.status(400).json({
        error: `Booking Override: Slot ${time} on ${date} is already locked by another client. Please customize another slot.`
      });
    }

    // Checked maximum bookings per day threshold
    const activeOnThisDay = currentBookings.filter(
      (b) => b.date === date && b.status !== "cancelled" && b.status !== "rejected"
    ).length;
    if (activeOnThisDay >= configurations.maxBookingsPerDay) {
      return res.status(400).json({
        error: `Daily Ceiling Reached: Our makeup coordinators are fully optimized on ${date} (Limit: ${configurations.maxBookingsPerDay} active). Please select a different date for premium dedicated grooming attention!`
      });
    }

    // Compute prices with multiselection 10% discount to keep local parity
    const baseSum = selectedServices.reduce((acc: number, curr: any) => acc + (curr.price || 0), 0);
    const totalWithDiscounts = selectedServices.length >= 2 ? Math.round(baseSum * 0.90) : baseSum;

    // Create unique record
    const newRecord: Booking = {
      id: `booking-${crypto.randomBytes(4).toString("hex")}`,
      name,
      phone,
      date,
      time,
      selectedServices,
      notes: notes || "",
      bridalPackageType: bridalPackageType || "Standard",
      status: "pending",
      totalPrice: totalWithDiscounts,
      createdAt: new Date().toISOString()
    };

    currentBookings.push(newRecord);
    await saveAppointments(currentBookings);
    await saveAppointmentToDb(newRecord);

    // Simulate server side real-time logs and notifications (Emails & WhatsApp integration logged on console debug output)
    console.log(`[REAL-TIME DISPATCH] WhatsApp dispatched manually to ${phone} with details.`);
    console.log(`[REAL-TIME DISPATCH] Booking Confirmation Email logged for ${name}`);

    return res.status(201).json(newRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to dispatch booking parameters." });
  }
});

// 5. ADMIN BOOKINGS MANAGEMENT (Protected)
app.get("/api/appointments", authenticateAdmin, async (req, res) => {
  const { search, status, date } = req.query;
  let appointments = await getAppointments();

  // Search filter
  if (search) {
    const term = String(search).toLowerCase();
    appointments = appointments.filter(
      (b) => b.name.toLowerCase().includes(term) || b.phone.includes(term)
    );
  }

  // Status Filter
  if (status && status !== "all") {
    appointments = appointments.filter((b) => b.status === status);
  }

  // Date Filter
  if (date) {
    appointments = appointments.filter((b) => b.date === date);
  }

  // Sort: newest first
  appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(appointments);
});

// 6. ADMIN UPDATE STATUS (Protected)
app.put("/api/appointments/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const current = await getAppointments();

  const index = current.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Booking coordinate index not found." });
  }

  // Preserve ID and creation, apply update block details safely
  const updatedBooking = {
    ...current[index],
    ...updates,
    id: current[index].id // ID remains immutable
  };

  current[index] = updatedBooking;
  await saveAppointments(current);
  await saveAppointmentToDb(updatedBooking);

  // Print email/WhatsApp hooks log on status changes
  console.log(`[STATUS NOTIFICATION UPDATE] Approved/Rejected state change for booking ${id} trigger set to WhatsApp logs!`);

  res.json(updatedBooking);
});

// 7. ADMIN DELETE APPOINTMENT (Protected)
app.delete("/api/appointments/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const current = await getAppointments();

  const filtered = current.filter((b) => b.id !== id);
  if (filtered.length === current.length) {
    return res.status(404).json({ error: "Target appointment not found." });
  }

  await saveAppointments(filtered);
  await deleteAppointmentFromDb(id);
  res.json({ message: "Appointment record permanently removed." });
});

// ------------------------------------------------------------------
// VITE AND STATIC ASSETS INTEGRATION
// ------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM ONLINE] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
