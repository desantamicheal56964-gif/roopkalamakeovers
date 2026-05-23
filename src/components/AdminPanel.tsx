import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, Lock, ShieldAlert, LogOut, Calendar, Clock, 
  CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff, Search,
  Sliders, Trash2, Edit3, ChevronLeft, ChevronRight, FileDown, 
  HelpCircle, MessageSquare, Mail, Bell, Settings, Plus, Play, Info, Users
} from "lucide-react";
import { Service } from "../types";
import { LUXURY_SERVICES } from "../data";

// Helper for formatting price in Indian Rupees
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

interface AdminPanelProps {
  onClose: () => void;
  onBookingSuccess: () => void; // Trigger a refresh on client
}

interface Booking {
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

interface SalonSettings {
  workingHours: { start: string; end: string };
  availableSlots: string[];
  maxBookingsPerDay: number;
  holidays: string[];
  blockedDates: string[];
  disabledSlotsByDate: { [date: string]: string[] };
}

export default function AdminPanel({ onClose, onBookingSuccess }: AdminPanelProps) {
  // Authentication states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("roopkala_token"));
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);

  // Inactivity timeout state
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes inactivity
  const WARNING_MS = 30 * 1000; // 30 seconds warning
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dashboard appointment management states
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [cabinSettings, setCabinSettings] = useState<SalonSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date("2026-05-22").toISOString().split("T")[0] // default with target dates
  );

  // Interface view states
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date("2026-05"));
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "appointments" | "settings" | "notifications" | "customers">("overview");

  // Edit fields modal
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingFormName, setEditingFormName] = useState("");
  const [editingFormPhone, setEditingFormPhone] = useState("");
  const [editingFormDate, setEditingFormDate] = useState("");
  const [editingFormTime, setEditingFormTime] = useState("");
  const [editingFormNotes, setEditingFormNotes] = useState("");
  const [editingFormStatus, setEditingFormStatus] = useState<any>("pending");
  const [editingFormServices, setEditingFormServices] = useState<Service[]>([]);

  // Settings modification fields
  const [maxBookingsField, setMaxBookingsField] = useState<number>(5);
  const [workHoursStart, setWorkHoursStart] = useState("09:00");
  const [workHoursEnd, setWorkHoursEnd] = useState("20:00");
  const [newHolidayField, setNewHolidayField] = useState("");
  const [newBlockedField, setNewBlockedField] = useState("");

  // Simulated notifications feed logs
  const [notificationLogs, setNotificationLogs] = useState<Array<{id: string, text: string, type: 'whatsapp' | 'email', date: string}>>([
    { id: "log-1", text: "SMS update sent - Appointment #booking-101 approved for Shalini Rajput.", type: "whatsapp", date: "Just now" },
    { id: "log-2", text: "Custom Bridal package quotation emailed safely to Aarti Verma.", type: "email", date: "2 mins ago" },
    { id: "log-3", text: "Slot reservation logged for Simran Kaur on May 24, 2026.", type: "whatsapp", date: "15 mins ago" },
    { id: "log-4", text: "System Alert: Salon hours updated to 9:00 AM - 8:00 PM NCR standards.", type: "email", date: "1 hour ago" },
  ]);

  // ------------------------------------------------------------------
  // INACTIVITY AUTO LOGOUT ENGINE
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        handleLogout("Session Expired due to 5 mins of inactivity.");
      } else if (elapsed >= INACTIVITY_LIMIT_MS - WARNING_MS) {
        setInactivityWarning(true);
      } else {
        setInactivityWarning(false);
      }
    };

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      if (inactivityWarning) setInactivityWarning(false);
    };

    // Add list of activity hooks
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keypress", resetActivity);
    window.addEventListener("scroll", resetActivity);
    window.addEventListener("click", resetActivity);

    // Checks every 10 seconds
    timerRef.current = setInterval(checkInactivity, 10000);

    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keypress", resetActivity);
      window.removeEventListener("scroll", resetActivity);
      window.removeEventListener("click", resetActivity);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token, inactivityWarning]);

  // Verify token of me endpoint at launch
  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Stale session login token");
        return res.json();
      })
      .then(data => {
        if (data.loggedIn) {
          setOwnerInfo(data.owner);
          loadDashboardData();
        } else {
          handleLogout();
        }
      })
      .catch(() => {
        handleLogout();
      });
    }
  }, [token]);

  // Load appointments and configurations settings
  const loadDashboardData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const apptsRes = await fetch("/api/appointments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const settingsRes = await fetch("/api/settings");

      if (apptsRes.ok && settingsRes.ok) {
        const appts = await apptsRes.json();
        const settings = await settingsRes.json();
        setAppointments(appts);
        setCabinSettings(settings);
        
        // Populate settings fields
        setMaxBookingsField(settings.maxBookingsPerDay);
        setWorkHoursStart(settings.workingHours.start);
        setWorkHoursEnd(settings.workingHours.end);
      }
    } catch (e) {
      console.error("Dashboard failed loading", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("roopkala_token", data.token);
        setToken(data.token);
        setOwnerInfo(data.owner);
        setUsername("");
        setPassword("");
        lastActivityRef.current = Date.now();
      } else {
        setAuthError(data.error || "Login credentials authentication failed.");
      }
    } catch (err) {
      setAuthError("Failed connection with security authentication module.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = (reason?: string) => {
    localStorage.removeItem("roopkala_token");
    setToken(null);
    setOwnerInfo(null);
    setInactivityWarning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (reason) {
      alert(reason);
    }
  };

  // ------------------------------------------------------------------
  // ADMIN CONTROL OPERATIONS (APPROVE, CANCEL, COMPLETED, DELETE, EDIT)
  // ------------------------------------------------------------------
  const updateAppointmentStatus = async (item: Booking, newStatus: Booking["status"]) => {
    try {
      const res = await fetch(`/api/appointments/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Log manual triggers safely
        const logMsg = `SMS update sent - Appointment #${item.id} transitioned to ${newStatus} for ${item.name}.`;
        setNotificationLogs(prev => [
          { id: `log-${Date.now()}`, text: logMsg, type: "whatsapp", date: "Just now" },
          ...prev
        ]);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this reservation?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save changes to edit modal form
  const saveEditedBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const formattedServices = editingFormServices.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price
    }));

    const rawBaseSum = formattedServices.reduce((sum, current) => sum + current.price, 0);
    const finalizedGross = formattedServices.length >= 2 ? Math.round(rawBaseSum * 0.90) : rawBaseSum;

    try {
      const res = await fetch(`/api/appointments/${editingBooking.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingFormName,
          phone: editingFormPhone,
          date: editingFormDate,
          time: editingFormTime,
          notes: editingFormNotes,
          status: editingFormStatus,
          selectedServices: formattedServices,
          totalPrice: finalizedGross
        })
      });

      if (res.ok) {
        setEditingBooking(null);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------------------------------------------------------
  // ADMIN SYSTEM CONFIGURATIONS WRITER
  // ------------------------------------------------------------------
  const updateSalonConfigs = async () => {
    if (!cabinSettings) return;
    try {
      const updated = {
        ...cabinSettings,
        workingHours: { start: workHoursStart, end: workHoursEnd },
        maxBookingsPerDay: maxBookingsField
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        alert("Salon configuration rules updated successfully.");
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addHoliday = async () => {
    if (!newHolidayField || !cabinSettings) return;
    if (cabinSettings.holidays.includes(newHolidayField)) return;
    try {
      const updated = {
        ...cabinSettings,
        holidays: [...cabinSettings.holidays, newHolidayField].sort()
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setNewHolidayField("");
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeHoliday = async (hDate: string) => {
    if (!cabinSettings) return;
    try {
      const updated = {
        ...cabinSettings,
        holidays: cabinSettings.holidays.filter(d => d !== hDate)
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedField || !cabinSettings) return;
    if (cabinSettings.blockedDates.includes(newBlockedField)) return;
    try {
      const updated = {
        ...cabinSettings,
        blockedDates: [...cabinSettings.blockedDates, newBlockedField].sort()
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setNewBlockedField("");
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeBlockedDate = async (bDate: string) => {
    if (!cabinSettings) return;
    try {
      const updated = {
        ...cabinSettings,
        blockedDates: cabinSettings.blockedDates.filter(d => d !== bDate)
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSlotLock = async (dateStr: string, slotStr: string) => {
    if (!cabinSettings) return;
    const currentList = cabinSettings.disabledSlotsByDate[dateStr] || [];
    const updatedList = currentList.includes(slotStr) 
      ? currentList.filter(s => s !== slotStr)
      : [...currentList, slotStr];

    const updated = {
      ...cabinSettings,
      disabledSlotsByDate: {
        ...cabinSettings.disabledSlotsByDate,
        [dateStr]: updatedList
      }
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------------------------------------------------------
  // DATA SELECTION AND FILTER COMPUTINGS (FOR STATS & TABLES)
  // ------------------------------------------------------------------
  const statistics = useMemo(() => {
    return {
      total: appointments.length,
      todayCount: appointments.filter(b => b.date === "2026-05-22" && b.status !== "cancelled" && b.status !== "rejected").length,
      upcoming: appointments.filter(b => new Date(b.date) >= new Date("2026-05-22") && b.status === "pending").length,
      completed: appointments.filter(b => b.status === "completed").length,
      cancelled: appointments.filter(b => b.status === "cancelled" || b.status === "rejected").length,
      approvedActive: appointments.filter(b => b.status === "approved").length
    };
  }, [appointments]);

  const filteredAppointmentsList = useMemo(() => {
    let result = [...appointments];

    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        b => b.name.toLowerCase().includes(term) || b.phone.includes(term)
      );
    }

    return result;
  }, [appointments, statusFilter, searchTerm]);

  // Appointments on currently focused calendar date
  const selectedDayBookings = useMemo(() => {
    return appointments.filter(b => b.date === selectedCalendarDate);
  }, [appointments, selectedCalendarDate]);

  // Calendar dates visual mapping generator
  const calendarWeeks = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const startOfCurrentMonth = new Date(year, month, 1);
    const startOffset = startOfCurrentMonth.getDay(); // 0 is Sunday, etc.

    const daysCount = new Date(year, month + 1, 0).getDate();

    const resultCells: Array<{ dayNum: number | null; dateStr: string | null }> = [];

    // Fill preceding offsets
    for (let i = 0; i < startOffset; i++) {
      resultCells.push({ dayNum: null, dateStr: null });
    }

    // Fill active days
    for (let day = 1; day <= daysCount; day++) {
      const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      resultCells.push({ dayNum: day, dateStr: formattedDate });
    }

    // Group into 7-day chunks (weeks)
    const weeks: typeof resultCells[] = [];
    for (let i = 0; i < resultCells.length; i += 7) {
      weeks.push(resultCells.slice(i, i + 7));
    }

    return weeks;
  }, [currentCalendarMonth]);

  // ------------------------------------------------------------------
  // EXPORT UTILITIES (CSV / EXCEL AND PRINTS)
  // ------------------------------------------------------------------
  const triggerExcelExport = () => {
    // Generate beautiful tab-separated output representing Excel format
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Customer Name,Phone,Date,Time,Services,Total Price (INR),Notes,Status,Created At\n";

    filteredAppointmentsList.forEach(b => {
      const serviceStr = b.selectedServices.map(s => s.name).join(" | ");
      const row = `"${b.id}","${b.name}","${b.phone}","${b.date}","${b.time}","${serviceStr}",${b.totalPrice},"${b.notes.replace(/"/g, '""')}","${b.status}","${b.createdAt}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `Roopkala_Client_Planner_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const triggerPDFPrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Roopkala Makeover - Elite Concierge Booking Manifest</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; }
            h1 { font-family: Georgia, serif; text-align: center; color: #AC8A5A; margin-bottom: 5px; }
            h3 { text-align: center; color: #666; font-weight: normal; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #fcf9f2; color: #AC8A5A; font-weight: 600; }
            span.badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: bold; }
            .badge-pending { background-color: #fef3c7; color: #d97706; }
            .badge-approved { background-color: #d1fae5; color: #059669; }
            .badge-completed { background-color: #dbeafe; color: #2563eb; }
            .badge-cancelled { background-color: #fee2e2; color: #dc2626; }
          </style>
        </head>
        <body onload="window.print()">
          <h1>✦ ROOPKALA MAKEOVER ✦</h1>
          <h3>Elite Customer Sanctuary Manifest - ${new Date().toLocaleDateString('en-IN')}</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Preferred Date & Time</th>
                <th>Selected Treatments</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAppointmentsList.map(b => `
                <tr>
                  <td><strong>${b.id}</strong></td>
                  <td>${b.name}</td>
                  <td>${b.phone}</td>
                  <td>${b.date} @ ${b.time}</td>
                  <td>${b.selectedServices.map(s => s.name).join(", ")}</td>
                  <td>INR ${b.totalPrice.toLocaleString("en-IN")}</td>
                  <td><span class="badge badge-${b.status}">${b.status}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ------------------------------------------------------------------
  // RENDERS (GATED LOGIN VS SECURE SYSTEM OFFICE)
  // ------------------------------------------------------------------
  if (!token) {
    return (
      <div className="fixed inset-0 bg-[#070707c2] backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="glass bg-[#0d0d11]/95 border border-[#FF0080]/20 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-left space-y-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#FF0080] to-[#E6C280] rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-[#FF0080]/10">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl text-white tracking-wide">Owner Gateway</h2>
            <p className="text-stone-400 text-xs">
              Elite security protocols active. Enter authentication keys.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">
                Username Identifier
              </label>
              <input 
                type="text" 
                required
                placeholder="Manager input key"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full glass bg-black/40 text-stone-100 border border-white/15 focus:border-[#FF0080] py-3 px-4 rounded text-xs focus:outline-none placeholder-stone-600 font-sans"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">
                Secret Password Code
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="Secret security string"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full glass bg-black/40 text-stone-100 border border-white/15 focus:border-[#FF0080] py-3 pl-4 pr-10 rounded text-xs focus:outline-none placeholder-stone-600 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-gradient-to-r from-[#FF0080] to-[#E6C280] font-sans text-xs font-semibold uppercase tracking-wider text-white rounded hover:shadow-lg shadow-[#FF0080]/15 duration-300 cursor-pointer flex items-center justify-center space-x-2 mt-4"
            >
              <Lock className="w-4 h-4" />
              <span>{isAuthenticating ? "Verifying..." : "Verify Identity"}</span>
            </button>
          </form>

          <p className="text-[9px] text-[#FF0080]/50 tracking-tight text-center font-mono">
            SECURE HANDSHAKE SIGNATURE INTEGRATIVE SHA-512 MATRIX
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // MASTER SECURE DESKTOP BOARD PANEL
  // ------------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-[#050507] z-50 flex flex-col pt-0 pb-0 overflow-y-auto" id="admin-gated-portal">
      
      {/* INACTIVITY CONSOLE WARNING OVERLAY */}
      {inactivityWarning && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass bg-stone-900 border border-rose-500/30 p-8 rounded-xl max-w-sm text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-[#FF0080] animate-bounce mx-auto" />
            <div className="space-y-1">
              <h4 className="text-white font-semibold">Security Vault Inactivity Lockout</h4>
              <p className="text-stone-300 text-xs leading-relaxed">
                Your coordinates are dormant. The vault will auto-logout shortly to protect elite proprietary files.
              </p>
            </div>
            <button
              onClick={() => {
                lastActivityRef.current = Date.now();
                setInactivityWarning(false);
              }}
              className="px-5 py-2.5 bg-[#FF0080] text-white font-sans text-xs font-semibold rounded cursor-pointer"
            >
              Extend Session
            </button>
          </div>
        </div>
      )}

      {/* HEADER RAIL SYSTEM */}
      <header className="bg-black/60 border-b border-white/10 px-4 py-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#FF0080]/10 border border-[#FF0080]/20 text-[#FF0080] rounded">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif text-white font-medium text-sm tracking-widest uppercase">
                ROOPKALA MAKEOVER
              </span>
              <span className="text-[9px] font-mono font-semibold bg-gradient-to-r from-[#FF0080] to-amber-400 text-xs text-transparent bg-clip-text px-1 border border-[#FF0080]/30 rounded">
                OWNER DESK
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono">
              Welcome back, {ownerInfo?.title || "Sarla Ji"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadDashboardData()}
            className="p-2 rounded bg-white/5 hover:bg-white/10 text-stone-300 cursor-pointer"
            title="Real-Time Refresh Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => handleLogout()}
            className="px-3 py-1.5 text-xs font-sans font-medium text-stone-300 bg-white/5 border border-white/10 hover:bg-[#FF0080]/15 hover:border-[#FF0080]/30 hover:text-white rounded space-x-1.5 flex items-center transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TWO PANEL OFFICE LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT NAV BAR CONTROL UNIT */}
        <nav className="lg:col-span-2 bg-[#0a0a0f] border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-1">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`w-full text-left px-3.5 py-3 rounded text-xs gap-3 flex items-center font-medium transition-colors ${activeSubTab === "overview" ? "bg-gradient-to-r from-[#FF0080]/15 to-transparent border-l-2 border-[#FF0080] text-white" : "text-stone-400 hover:bg-white/3 hover:text-stone-200"}`}
          >
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>Interactive Calendar</span>
          </button>

          <button
            onClick={() => setActiveSubTab("appointments")}
            className={`w-full text-left px-3.5 py-3 rounded text-xs gap-3 flex items-center font-medium transition-colors ${activeSubTab === "appointments" ? "bg-gradient-to-r from-[#FF0080]/15 to-transparent border-l-2 border-[#FF0080] text-white" : "text-stone-400 hover:bg-white/3 hover:text-stone-200"}`}
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>All Bookings Ledger</span>
          </button>

          <button
            onClick={() => setActiveSubTab("settings")}
            className={`w-full text-left px-3.5 py-3 rounded text-xs gap-3 flex items-center font-medium transition-colors ${activeSubTab === "settings" ? "bg-gradient-to-r from-[#FF0080]/15 to-transparent border-l-2 border-[#FF0080] text-white" : "text-stone-400 hover:bg-white/3 hover:text-stone-200"}`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Scheduling & Hours</span>
          </button>

          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`w-full text-left px-3.5 py-3 rounded text-xs gap-3 flex items-center font-medium transition-colors ${activeSubTab === "notifications" ? "bg-gradient-to-r from-[#FF0080]/15 to-transparent border-l-2 border-[#FF0080] text-white" : "text-stone-400 hover:bg-white/3 hover:text-stone-200"}`}
          >
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Dispatch System</span>
          </button>

          <button
            onClick={() => setActiveSubTab("customers")}
            className={`w-full text-left px-3.5 py-3 rounded text-xs gap-3 flex items-center font-medium transition-colors ${activeSubTab === "customers" ? "bg-gradient-to-r from-[#FF0080]/15 to-transparent border-l-2 border-[#FF0080] text-white" : "text-stone-400 hover:bg-white/3 hover:text-stone-200"}`}
          >
            <Users className="w-4 h-4 text-pink-400" />
            <span>Customers Table (Firestore)</span>
          </button>

          <div className="pt-8 px-3 hidden lg:block">
            <div className="p-3 bg-white/3 rounded-xl border border-white/5 space-y-2">
              <span className="text-[9px] font-mono text-[#FF0080] uppercase tracking-widest block font-bold">✦ CONCIERGE TIP</span>
              <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                To block a slot, open the <strong>Scheduling & Hours</strong> tab, or hover dates to disable specific coordinate configurations.
              </p>
            </div>
          </div>
        </nav>

        {/* MAIN BODY WINDOW WORKSPACE */}
        <main className="lg:col-span-10 p-4 md:p-8 overflow-y-auto space-y-6 text-left">
          
          {/* STATS STRIP */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Today's Active</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-serif text-white">{statistics.todayCount}</span>
                <span className="text-[10.5px] text-[#FF0080] font-mono font-bold">May 22</span>
              </div>
            </div>

            <div className="glass bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Approval Pending</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-serif text-amber-400">{statistics.upcoming}</span>
                <span className="text-[10.5px] text-stone-500 font-mono">Unreviewed</span>
              </div>
            </div>

            <div className="glass bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Active Approved</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-serif text-emerald-400">{statistics.approvedActive}</span>
                <span className="text-[10.5px] text-stone-500 font-mono">Booked</span>
              </div>
            </div>

            <div className="glass bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Total Ledger size</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-serif text-white">{statistics.total}</span>
                <span className="text-[10.5px] text-stone-500 font-mono">Logged</span>
              </div>
            </div>
          </section>

          {/* TAB 1: INTERACTIVE CALENDAR WORKSPACE */}
          {activeSubTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Interactive Grid Calendar */}
              <div className="lg:col-span-7 glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="font-serif text-lg text-white font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF0080]" strokeWidth={1.5} />
                    <span>Beauty Sanctuary Calendar</span>
                  </h3>
                  
                  <div className="flex items-center space-x-1 bg-black/40 border border-white/5 rounded-lg p-1">
                    <button
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1)))}
                      className="p-1 hover:bg-white/5 rounded text-stone-400 hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-stone-200 px-2 font-semibold">
                      {currentCalendarMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1)))}
                      className="p-1 hover:bg-white/5 rounded text-stone-400 hover:text-white cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Table Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[10.5px] font-mono text-stone-400 font-semibold uppercase tracking-wider border-b border-white/5 pb-2">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                <div className="space-y-1.5">
                  {calendarWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 gap-1.5">
                      {week.map((cell, cIdx) => {
                        const isSelected = cell.dateStr === selectedCalendarDate;
                        const countOnDay = cell.dateStr ? appointments.filter(b => b.date === cell.dateStr && b.status !== 'cancelled' && b.status !== 'rejected').length : 0;
                        const hasPendingOnDay = cell.dateStr ? appointments.some(b => b.date === cell.dateStr && b.status === "pending") : false;
                        const isHoliday = cell.dateStr ? cabinSettings?.holidays.includes(cell.dateStr) : false;
                        const isBlocked = cell.dateStr ? cabinSettings?.blockedDates.includes(cell.dateStr) : false;

                        return (
                          <div key={cIdx} className="aspect-square relative">
                            {cell.dayNum && (
                              <button
                                onClick={() => cell.dateStr && setSelectedCalendarDate(cell.dateStr)}
                                className={`w-full h-full rounded-xl flex flex-col items-center justify-center border transition-all duration-300 relative cursor-pointer ${
                                  isSelected 
                                    ? "bg-[#FF0080]/20 border-[#FF0080] text-white font-bold" 
                                    : isBlocked 
                                    ? "bg-stone-950 text-stone-700 border-dashed border-red-950/40"
                                    : isHoliday
                                    ? "bg-teal-950/15 text-teal-600 border-teal-950/20"
                                    : "bg-black/30 hover:bg-white/5 border-white/5 hover:border-white/10 text-stone-300"
                                }`}
                              >
                                <span className={`text-xs ${isBlocked ? "line-through text-stone-600" : ""}`}>{cell.dayNum}</span>
                                
                                <div className="flex gap-1 mt-1 justify-center">
                                  {/* Dots indicators */}
                                  {countOnDay > 0 && (
                                    <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#FF0080]"}`} />
                                  )}
                                  {hasPendingOnDay && (
                                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                                  )}
                                  {isHoliday && (
                                    <span className="w-1 h-1 rounded-full bg-teal-400" title="Holiday" />
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[10.5px] font-mono text-stone-500 pt-2 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-[#FF0080] rounded" />
                    <span>Approved Makeover</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded" />
                    <span>Pending Approval</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-teal-600 rounded" />
                    <span>Salon Holiday</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-red-800 rounded" />
                    <span>Blocked Date</span>
                  </div>
                </div>
              </div>

              {/* Day Details Workspace Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#FF0080] uppercase tracking-widest block font-bold">
                        ✦ FOCUS SCHEDULE
                      </span>
                      <h4 className="font-serif text-white font-semibold text-sm">
                        Schedule Preferences for {selectedCalendarDate}
                      </h4>
                    </div>
                    {cabinSettings?.blockedDates.includes(selectedCalendarDate) && (
                      <span className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-500/20 px-2.5 py-1 rounded">
                        BLOCKED DATE
                      </span>
                    )}
                    {cabinSettings?.holidays.includes(selectedCalendarDate) && (
                      <span className="text-[10px] font-mono text-teal-400 bg-teal-950/20 border border-teal-500/20 px-2.5 py-1 rounded">
                        SALON HOLIDAY
                      </span>
                    )}
                  </div>

                  {/* Day capacity rules */}
                  <div className="py-3 px-3 my-3 bg-black/40 rounded-lg text-xs flex justify-between text-stone-300 font-sans border border-white/5">
                    <span>Active bookings count: <strong>{selectedDayBookings.length}</strong></span>
                    <span>Max cap rule: <strong>{cabinSettings?.maxBookingsPerDay || 5} bookings</strong></span>
                  </div>

                  {selectedDayBookings.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 space-y-2">
                      <HelpCircle className="w-8 h-8 mx-auto" />
                      <p className="text-xs">No active bridal or beauty appointments scheduled on this date.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {selectedDayBookings.map(app => (
                        <div key={app.id} className="p-3.5 glass bg-white/3 border border-white/5 hover:border-white/10 rounded-xl space-y-3.5 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-white font-semibold flex items-center space-x-1.5">
                                <span>{app.name}</span>
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded tracking-wider ${
                                  app.status === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' :
                                  app.status === 'completed' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/10' :
                                  app.status === 'pending' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10' :
                                  'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                                }`}>
                                  {app.status}
                                </span>
                              </p>
                              <p className="text-[10px] text-stone-400 font-mono mt-1 font-semibold">{app.phone}</p>
                            </div>
                            <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/50 border border-white/5 text-stone-200">
                              🕒 {app.time}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-stone-500 block">Selected Treatments:</span>
                            <p className="text-[11px] text-amber-100 font-sans font-medium">
                              {app.selectedServices.map(s => s.name).join(", ")}
                            </p>
                            {app.notes && (
                              <p className="text-[10px] bg-black/20 border border-white/5 p-2 rounded text-stone-400 leading-relaxed max-w-full">
                                note: "{app.notes}"
                              </p>
                            )}
                          </div>

                          {/* Quick decision triggers */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <span className="font-mono text-xs font-semibold text-amber-400">{formatCurrency(app.totalPrice)}</span>
                            
                            <div className="flex items-center space-x-2">
                              {app.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(app, "approved")}
                                    className="p-1 px-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-[10px] text-white font-sans rounded font-semibold cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(app, "rejected")}
                                    className="p-1 px-2.5 bg-rose-950/40 border border-rose-500/20 text-[10px] text-rose-300 rounded cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <button
                                  onClick={() => updateAppointmentStatus(app, "completed")}
                                  className="p-1 px-2.5 bg-blue-700 text-white font-sans rounded font-semibold cursor-pointer text-[10px] transition-colors"
                                >
                                  Mark Completed
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingBooking(app);
                                  setEditingFormName(app.name);
                                  setEditingFormPhone(app.phone);
                                  setEditingFormDate(app.date);
                                  setEditingFormTime(app.time);
                                  setEditingFormNotes(app.notes);
                                  setEditingFormStatus(app.status);
                                  // Populate matching service elements from listing
                                  const matchingServices = LUXURY_SERVICES.filter(service => 
                                    app.selectedServices.some(as => as.id === service.id)
                                  );
                                  setEditingFormServices(matchingServices);
                                }}
                                className="p-1 px-2 hover:bg-white/5 rounded text-stone-400 hover:text-white cursor-pointer"
                                title="Full Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OVERALL APPOINTMENT MASTER LEDGER */}
          {activeSubTab === "appointments" && (
            <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 space-y-6">
              
              {/* Ledger Controls & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#FF0080]" />
                  <h3 className="font-serif text-lg text-white font-semibold">Ledger Management Panel</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={triggerExcelExport}
                    className="p-2 bg-emerald-900/40 border border-emerald-500/20 text-[11px] text-emerald-400 hover:bg-emerald-800/40 rounded flex items-center space-x-1 px-3 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download CSV/Excel</span>
                  </button>
                  <button
                    onClick={triggerPDFPrint}
                    className="p-2 bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-xs text-white font-semibold rounded flex items-center space-x-1 px-3 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Print Manifest (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Live search input strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search by client name, identifier, phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full glass bg-black/40 border border-white/10 focus:border-[#FF0080] pl-10 pr-4 py-2.5 rounded-lg text-xs font-sans text-stone-100"
                  />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded-lg text-xs text-stone-300"
                  >
                    <option value="all">Filters: All Status</option>
                    <option value="pending">⏳ Pending Reviews</option>
                    <option value="approved">✅ Confirmed Approved</option>
                    <option value="completed">💙 Style Completed</option>
                    <option value="cancelled">❌ Cancelled / Rejected</option>
                  </select>
                </div>
              </div>

              {/* Appointments details table */}
              {filteredAppointmentsList.length === 0 ? (
                <div className="py-20 text-center text-stone-500">
                  <AlertTriangle className="w-12 h-12 text-[#FF0080] opacity-35 mx-auto mb-3" />
                  <p className="text-xs">No client registrations matches your active queries.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-white/5 text-stone-400 font-mono text-[10px] uppercase tracking-wider pb-2">
                        <th className="py-3 px-2">Booking ID</th>
                        <th className="py-3 px-2">Client Details</th>
                        <th className="py-3 px-2">Schedule Coordinates</th>
                        <th className="py-3 px-2">Treatments Pack</th>
                        <th className="py-3 px-2">Gross Price</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAppointmentsList.map((app) => (
                        <tr key={app.id} className="hover:bg-white/3 transition-colors">
                          <td className="py-4 px-2 font-mono text-stone-400">
                            <strong>{app.id}</strong>
                          </td>
                          <td className="py-4 px-2 space-y-0.5">
                            <p className="font-semibold text-white">{app.name}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{app.phone}</p>
                          </td>
                          <td className="py-4 px-2">
                            <p className="text-stone-200">{app.date}</p>
                            <p className="text-[10px] text-stone-500 font-mono">🕒 {app.time}</p>
                          </td>
                          <td className="py-4 px-2 max-w-xs truncate" title={app.selectedServices.map(s => s.name).join(", ")}>
                            <p className="text-stone-300 font-medium">
                              {app.selectedServices.map(s => s.name).join(", ")}
                            </p>
                          </td>
                          <td className="py-4 px-2 font-mono font-semibold text-amber-400">
                            {formatCurrency(app.totalPrice)}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2.5 py-1 text-[9px] uppercase font-mono rounded tracking-wider ${
                              app.status === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' :
                              app.status === 'completed' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/10' :
                              app.status === 'pending' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10' :
                              'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingBooking(app);
                                  setEditingFormName(app.name);
                                  setEditingFormPhone(app.phone);
                                  setEditingFormDate(app.date);
                                  setEditingFormTime(app.time);
                                  setEditingFormNotes(app.notes);
                                  setEditingFormStatus(app.status);
                                  const matchingServices = LUXURY_SERVICES.filter(service => 
                                    app.selectedServices.some(as => as.id === service.id)
                                  );
                                  setEditingFormServices(matchingServices);
                                }}
                                className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteAppointment(app.id)}
                                className="p-1 hover:bg-rose-950 hover:text-rose-400 rounded text-stone-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOLIDAYS, BLOCKED DATES & WORK HOURS RULES */}
          {activeSubTab === "settings" && cabinSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Working hours configuration */}
              <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left space-y-4">
                <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <span>Working Hours & Daily Cap</span>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">Salon Opens</label>
                      <input
                        type="time"
                        value={workHoursStart}
                        onChange={e => setWorkHoursStart(e.target.value)}
                        className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-xs text-stone-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">Salon Closes</label>
                      <input
                        type="time"
                        value={workHoursEnd}
                        onChange={e => setWorkHoursEnd(e.target.value)}
                        className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-xs text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">
                      Maximum Active Daily Bookings Limit
                    </label>
                    <div className="flex items-center space-x-3 bg-black/30 p-3 rounded border border-white/5">
                      <input
                        type="range"
                        min={1}
                        max={15}
                        value={maxBookingsField}
                        onChange={e => setMaxBookingsField(Number(e.target.value))}
                        className="flex-1 accent-[#FF0080] cursor-pointer"
                      />
                      <span className="text-white font-mono font-bold text-sm bg-[#FF0080]/20 min-w-[35px] text-center px-2 py-1 rounded">
                        {maxBookingsField}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      Auto-prevents client bookings after this number of active appointments is reached on any target date.
                    </p>
                  </div>

                  <button
                    onClick={updateSalonConfigs}
                    className="w-full py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-xs font-semibold text-white rounded cursor-pointer transition-colors mt-2"
                  >
                    Commit Configuration Rules
                  </button>
                </div>
              </div>

              {/* Block slots for specific calendar dates */}
              <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left space-y-4">
                <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Disable Hourly Salon Slots</span>
                </h3>

                <div className="space-y-3 font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-[#FF0080] uppercase block">Select Calendar Date</label>
                    <input
                      type="date"
                      value={selectedCalendarDate}
                      onChange={e => setSelectedCalendarDate(e.target.value)}
                      className="w-full glass bg-black/40 border border-white/10 py-2 px-3 rounded text-xs text-stone-100 font-medium"
                    />
                  </div>

                  <p className="text-[11px] text-stone-300">
                    Click any hourly slot to disable it entirely for <strong>{selectedCalendarDate}</strong>.
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {cabinSettings.availableSlots.map(slot => {
                      const isDisabled = (cabinSettings.disabledSlotsByDate[selectedCalendarDate] || []).includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleSlotLock(selectedCalendarDate, slot)}
                          className={`py-2 rounded text-xs font-mono border transition-all cursor-pointer ${
                            isDisabled 
                              ? "bg-red-950/40 text-red-400 border-red-500/20" 
                              : "bg-black/30 text-stone-300 border-white/5 hover:border-white/10"
                          }`}
                        >
                          {slot}
                          <span className="block text-[8px] font-sans font-semibold text-center mt-0.5 uppercase">
                            {isDisabled ? "Locked" : "Open"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Holidays and Blocked Dates manager */}
              <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left space-y-4">
                <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-sky-400" />
                  <span>Holiday Calendar Rules</span>
                </h3>

                <div className="space-y-4 font-sans text-xs">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHolidayField}
                      onChange={e => setNewHolidayField(e.target.value)}
                      className="flex-1 glass bg-black/40 border border-white/10 px-3 py-2 rounded text-xs text-stone-100"
                    />
                    <button
                      onClick={addHoliday}
                      className="px-4 py-2 bg-[#FF0080] text-white text-xs font-semibold rounded cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {cabinSettings.holidays.length === 0 ? (
                      <p className="text-stone-500 font-mono text-[11px]">No custom holidays specified.</p>
                    ) : (
                      cabinSettings.holidays.map(hDate => (
                        <div key={hDate} className="flex items-center justify-between p-2 bg-black/30 border border-white/5 rounded-lg">
                          <span className="font-mono text-stone-200">{hDate}</span>
                          <button
                            onClick={() => removeHoliday(hDate)}
                            className="text-stone-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Special Blocked Dates manager */}
              <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left space-y-4">
                <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>Temporary Blocked Coordinates</span>
                </h3>

                <div className="space-y-4 font-sans text-xs">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newBlockedField}
                      onChange={e => setNewBlockedField(e.target.value)}
                      className="flex-1 glass bg-black/40 border border-white/10 px-3 py-2 rounded text-xs text-stone-100"
                    />
                    <button
                      onClick={addBlockedDate}
                      className="px-4 py-2 bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-xs text-white font-semibold rounded cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Block</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {cabinSettings.blockedDates.length === 0 ? (
                      <p className="text-stone-500 font-mono text-[11px]">No temporary blocked dates listed.</p>
                    ) : (
                      cabinSettings.blockedDates.map(bDate => (
                        <div key={bDate} className="flex items-center justify-between p-2 bg-black/30 border border-white/5 rounded-lg">
                          <span className="font-mono text-stone-200">{bDate}</span>
                          <button
                            onClick={() => removeBlockedDate(bDate)}
                            className="text-stone-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: DISPATCH / ALERTS LOG UNIT */}
          {activeSubTab === "notifications" && (
            <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 text-left space-y-4">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>Concierge Notification dispatch Logs</span>
              </h3>

              <p className="text-xs text-stone-300 font-sans max-w-2xl leading-relaxed">
                Roopkala is configured with simulation gateways for WhatsApp and email alerts. Below is the live tracker log showing communication dispatches triggered by status approvals and customer bookings.
              </p>

              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50">
                <div className="grid grid-cols-12 gap-2 bg-white/3 p-3 text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold border-b border-white/5">
                  <span className="col-span-8">Activity String</span>
                  <span className="col-span-2">Channel</span>
                  <span className="col-span-2 text-right">Dispatch Frame</span>
                </div>

                <div className="divide-y divide-white/5 font-mono text-xs">
                  {notificationLogs.map(log => (
                    <div key={log.id} className="grid grid-cols-12 gap-2 p-3.5 hover:bg-white/2 transition-colors items-center">
                      <div className="col-span-8 text-stone-200 text-[11px]">
                        {"[ALERT] "}{log.text}
                      </div>
                      <div className="col-span-2">
                        {log.type === "whatsapp" ? (
                          <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                            WhatsApp
                          </span>
                        ) : (
                          <span className="text-[9px] bg-sky-950/40 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                            Email Server
                          </span>
                        )}
                      </div>
                      <span className="col-span-2 text-right text-[10px] text-stone-500">
                        {log.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#FF0080]/15 bg-[#FF0080]/5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center font-sans text-xs pt-4">
                <div>
                  <h4 className="text-white font-semibold mb-1">Trigger Manual Broadcaster Test</h4>
                  <p className="text-stone-400">
                    Need to dispatch an urgent schedule update directly onto the console debugger manually?
                  </p>
                </div>
                <button
                  onClick={() => {
                    const testLog = `Broadcaster Test triggered manually for all active schedules.`;
                    setNotificationLogs(prev => [
                      { id: `log-${Date.now()}`, text: testLog, type: "whatsapp", date: "Just now" },
                      ...prev
                    ]);
                    console.log(`[ALERT BROADCASTER] Manual broadcast tests triggered safely. No errors.`);
                  }}
                  className="py-2.5 bg-gradient-to-r from-[#FF0080] to-[#E6C280] font-semibold text-white rounded cursor-pointer leading-none text-center"
                >
                  Broadcast Alerts Simulation
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER DIRECTORY SYSTEM (FIRESTORE DATA TABLE) */}
          {activeSubTab === "customers" && (() => {
            interface CustomerEntry {
              phone: string;
              name: string;
              bookings: Booking[];
              totalSpent: number;
              completedCount: number;
              lastBooking: Booking;
            }

            // Group appointments by customer phone number safely using strong typing
            const customersMap: { [key: string]: CustomerEntry } = {};
            
            appointments.forEach((appt) => {
              const phone = appt.phone || "N/A";
              if (!customersMap[phone]) {
                customersMap[phone] = {
                  phone,
                  name: appt.name || "Unknown Customer",
                  bookings: [],
                  totalSpent: 0,
                  completedCount: 0,
                  lastBooking: appt,
                };
              }
              customersMap[phone].bookings.push(appt);
              if (appt.status === "completed") {
                customersMap[phone].completedCount += 1;
              }
              if (appt.status !== "cancelled" && appt.status !== "rejected") {
                customersMap[phone].totalSpent += appt.totalPrice || 0;
              }
              // Keep the newest booking as the lastBooking representation
              if (new Date(appt.date) > new Date(customersMap[phone].lastBooking.date)) {
                customersMap[phone].lastBooking = appt;
                customersMap[phone].name = appt.name; // Use most recent name
              }
            });

            const customersList = Object.values(customersMap);

            // Filter customers based on search query
            const filteredCustomers = customersList.filter(c => 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              c.phone.includes(searchTerm)
            );

            return (
              <div className="glass bg-white/3 border border-white/10 rounded-2xl p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-pink-400" />
                    <div>
                      <h3 className="font-serif text-lg text-white font-semibold">Customer Profiles Directory</h3>
                      <p className="text-[11px] text-stone-400 mt-0.5">Real-time compilation of unique salon clients fetched directly from Firestore database</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-mono text-stone-300">
                    Total Active Customers: <strong className="text-white">{customersList.length}</strong>
                  </div>
                </div>

                {/* Search bar inside customers ledger */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Search customer profiles by name or contact coordinates..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full glass bg-black/40 border border-white/10 focus:border-[#FF0080] pl-10 pr-4 py-2.5 rounded-lg text-xs font-sans text-stone-100 placeholder-stone-500"
                  />
                </div>

                {/* Customer profiles details table */}
                {filteredCustomers.length === 0 ? (
                  <div className="py-20 text-center text-stone-500">
                    <Users className="w-12 h-12 text-[#FF0080] opacity-35 mx-auto mb-3" />
                    <p className="text-xs">No customer profiles matched your search parameters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-white/5 text-stone-400 font-mono text-[10px] uppercase tracking-wider pb-2">
                          <th className="py-3 px-2">Customer Profile Name</th>
                          <th className="py-3 px-2">Contact Number</th>
                          <th className="py-3 px-2 text-center">Sessions Booked</th>
                          <th className="py-3 px-2 text-center">Styling Completed</th>
                          <th className="py-3 px-2">Latest Status (Date)</th>
                          <th className="py-3 px-2 text-right">Action Workspace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredCustomers.map((cust) => (
                          <tr key={cust.phone} className="hover:bg-white/3 transition-colors">
                            <td className="py-4 px-2">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-pink-950/40 border border-pink-500/25 flex items-center justify-center font-bold text-pink-300 font-serif text-sm">
                                  {cust.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-stone-100">{cust.name}</p>
                                  <span className="text-[10px] text-stone-400">ID: <strong className="font-mono text-[9px] text-[#FF0080]">CUST-{cust.phone.slice(-4)}</strong></span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 font-mono text-stone-300">
                              {cust.phone}
                            </td>
                            <td className="py-4 px-2 text-center font-mono font-medium text-stone-200">
                              {cust.bookings.length}
                            </td>
                            <td className="py-4 px-2 text-center">
                              {cust.completedCount > 0 ? (
                                <span className="inline-flex items-center rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 text-[10px] whitespace-nowrap font-mono font-semibold">
                                  {cust.completedCount} Sessions
                                </span>
                              ) : (
                                <span className="text-stone-500 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-mono rounded tracking-wider ${
                                cust.lastBooking.status === 'approved' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' :
                                cust.lastBooking.status === 'completed' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/10' :
                                cust.lastBooking.status === 'pending' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10' :
                                'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                              }`}>
                                {cust.lastBooking.status} ({cust.lastBooking.date})
                              </span>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button
                                onClick={() => {
                                  // Trigger pre-filled search in ledger layout tab or simulate customer detail view
                                  setSearchTerm(cust.phone);
                                  setActiveSubTab("appointments");
                                }}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-[#FF0080]/10 hover:text-white border border-white/5 rounded text-[10.5px] text-stone-300 font-sans tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <span>Inspect History</span>
                                <Info className="w-3.5 h-3.5 text-pink-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </main>
      </div>

      {/* FULL FIELD RECORD EDIT MODAL POPUP */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form className="glass bg-[#0d0d12] border border-white/10 rounded-2xl p-6 max-w-xl w-full text-left space-y-4 max-h-[90vh] overflow-y-auto" onSubmit={saveEditedBooking}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-serif text-lg text-white font-semibold flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Adjust Treatment Record #{editingBooking.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-1 rounded hover:bg-white/5 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-400 block font-bold">FullName</label>
                <input
                  type="text"
                  required
                  value={editingFormName}
                  onChange={e => setEditingFormName(e.target.value)}
                  className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-400 block font-bold">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={editingFormPhone}
                  onChange={e => setEditingFormPhone(e.target.value)}
                  className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-400 block font-bold">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={editingFormDate}
                  onChange={e => setEditingFormDate(e.target.value)}
                  className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-400 block font-bold">Selected Time Hour</label>
                <input
                  type="time"
                  required
                  value={editingFormTime}
                  onChange={e => setEditingFormTime(e.target.value)}
                  className="w-full glass bg-black/40 border border-white/10 p-2.5 rounded text-white"
                />
              </div>
            </div>

            <div className="text-xs font-sans space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-stone-400 block font-semibold mb-1">
                Status Condition
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["pending", "approved", "completed", "cancelled"].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEditingFormStatus(st)}
                    className={`py-2 rounded font-mono select-none uppercase text-[10px] border tracking-wider transition-all duration-300 cursor-pointer ${
                      editingFormStatus === st 
                        ? st === 'approved' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500' :
                          st === 'completed' ? 'bg-indigo-900/40 text-indigo-400 border-indigo-500' :
                          st === 'pending' ? 'bg-amber-950/40 text-amber-400 border-amber-500' :
                          'bg-rose-950/20 text-rose-300 border-rose-500'
                        : "bg-black/30 text-stone-400 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-sans space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-[#FF0080] block font-bold">
                Edit Services Cart Configuration
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-black/40 rounded-lg border border-white/5">
                {LUXURY_SERVICES.map(service => {
                  const isChecked = editingFormServices.some(s => s.id === service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setEditingFormServices(prev => prev.filter(s => s.id !== service.id));
                        } else {
                          setEditingFormServices(prev => [...prev, service]);
                        }
                      }}
                      className={`text-left p-2 rounded text-[10px] border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isChecked 
                          ? "bg-[#FF0080]/15 text-white border-[#FF0080]/30" 
                          : "bg-black/20 text-stone-400 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <span className="truncate">{service.name}</span>
                      <span className="font-mono ml-1 shrink-0 font-semibold">{formatCurrency(service.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-sans">
              <label className="text-[10px] uppercase font-mono text-stone-400 block font-bold">Custom Notes</label>
              <textarea
                rows={2}
                value={editingFormNotes}
                onChange={e => setEditingFormNotes(e.target.value)}
                className="w-full glass bg-black/40 border border-white/10 p-2 px-3 rounded text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10 text-xs font-sans">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 glass bg-white/5 border border-white/10 text-stone-300 rounded hover:bg-white/10 cursor-pointer"
              >
                Close Dialog
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-[#FF0080] to-[#E6C280] text-white font-semibold rounded cursor-pointer"
              >
                Confirm Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
