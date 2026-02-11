import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, X, User as UserIcon, LogOut, MapPin, Gamepad2, 
  Calendar, Camera, Smartphone, Mail, Lock, ShieldCheck, RefreshCw, Star, Clock, CheckCircle, MessageCircle, BadgeCheck, ArrowLeft, UserPlus, LogIn, Settings, Edit, Trash2, PlusCircle, Save, Power, DollarSign, Image as ImageIcon, IndianRupee, Upload, Tag, ImagePlus, Megaphone, Eye, EyeOff, ChevronRight, ChevronLeft, Info, Key, Users, Briefcase, Ban, Unlock, AlertCircle, FileText, Type, Printer, Download, QrCode, Scan
} from 'lucide-react';
import { HERO_IMAGES as INITIAL_HERO_IMAGES, GAMES as INITIAL_GAMES } from './constants';
import { User, Game, AuthView, Booking, Offer, ShopSettings, SiteContent } from './types';
import ChatAssistant from './components/ChatAssistant';

// Declare confetti on window
declare global {
  interface Window {
    confetti: any;
    Html5QrcodeScanner: any;
  }
}

// --- Types for Mock DB ---
interface DBUser extends User {
  password?: string; 
}

// --- Utils ---
// Generates a 10-digit ID
const generateId = () => {
  const min = 1000000000;
  const max = 9999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to extract dominant color from image (Simple implementation)
const extractColorFromImage = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        resolve(`rgb(${data[0]}, ${data[1]}, ${data[2]})`);
      } else {
        resolve('#ffffff');
      }
    };
    img.onerror = () => resolve('#ffffff');
  });
};

// Helper for file upload handling (Moved to global scope)
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(ev.target?.result) callback(ev.target.result as string);
    };
    reader.readAsDataURL(e.target.files[0]);
  }
};

// Invoice Generator Function
const openInvoice = (booking: Booking, user: User, siteContent: SiteContent, game?: Game, autoPrint: boolean = true) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const invoiceDate = new Date(booking.timestamp).toLocaleDateString();
  const dueDate = booking.date;
  const subtotal = game ? game.pricePerHour * booking.duration : booking.price; // Approximation if game not found
  const discountAmount = subtotal - booking.price;

  // Generate QR Data URL
  const qrData = `${window.location.origin}?bid=${booking.id}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Invoice #${booking.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; margin: 0; padding: 20px; }
        .invoice-container { max-width: 800px; margin: auto; background: white; padding: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-radius: 8px; position: relative; }
        .invoice-box { width: 100%; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo-text { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 2px; }
        .logo-sub { font-size: 14px; color: #666; }
        .company-info { text-align: right; font-size: 14px; color: #555; line-height: 1.6; }
        .invoice-title { font-size: 40px; color: #000; font-weight: bold; margin: 0 0 20px 0; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .bill-to h3 { margin-top: 0; color: #333; font-size: 16px; text-transform: uppercase; border-bottom: 2px solid #00f3ff; display: inline-block; padding-bottom: 5px; }
        .bill-to p { margin: 5px 0; font-size: 14px; color: #555; }
        .invoice-meta p { margin: 5px 0; font-size: 14px; color: #555; text-align: right; }
        .invoice-meta span { font-weight: bold; color: #333; display: inline-block; min-width: 100px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f8fafc; color: #333; font-weight: bold; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 14px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #555; }
        .col-right { text-align: right; }
        .totals { float: right; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-row.final { border-bottom: none; border-top: 2px solid #333; font-weight: bold; font-size: 18px; color: #000; margin-top: 10px; padding-top: 15px; background-color: #f0fdf4; padding: 15px 10px; }
        .footer { margin-top: 80px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; clear: both; }
        
        .action-bar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; }
        .btn { padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 14px; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.8; }
        .btn-print { background: #00f3ff; color: #000; }
        .btn-close { background: #334155; color: #fff; }

        /* QR Code Bottom Left */
        .qr-footer {
           position: absolute;
           bottom: 40px;
           left: 40px;
           text-align: center;
        }
        .qr-footer img {
           width: 100px;
           height: 100px;
           border: 4px solid #000;
           padding: 2px;
        }
        .qr-footer p {
           font-size: 10px;
           color: #666;
           margin-top: 5px;
           font-weight: bold;
           text-transform: uppercase;
        }

        @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; padding: 0; margin: 0; }
            .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="action-bar no-print">
           <button onclick="window.print()" class="btn btn-print">PRINT / SAVE PDF</button>
           <button onclick="window.close()" class="btn btn-close">CLOSE</button>
        </div>

        <div class="invoice-box">
          <div class="header">
            <div>
               <div class="logo-text">VISHNU</div>
               <div class="logo-sub">GAME CENTER</div>
            </div>
            <div class="company-info">
               <strong>VISHNU Game Center</strong><br>
               ${siteContent.footerAddress}<br>
               support@vishnugames.com<br>
               +91 99999 99999
            </div>
          </div>

          <h1 class="invoice-title">INVOICE</h1>

          <div class="info-grid">
             <div class="bill-to">
                <h3>Bill To</h3>
                <p><strong>${user.name}</strong></p>
                <p>ID: ${user.id}</p>
                <p>${user.email}</p>
                <p>${user.mobile}</p>
             </div>
             <div class="invoice-meta">
                <p><span>Invoice No:</span> #${booking.id}</p>
                <p><span>Date of Issue:</span> ${invoiceDate}</p>
                <p><span>Booking Date:</span> ${dueDate}</p>
             </div>
          </div>

          <table>
             <thead>
                <tr>
                   <th>Item</th>
                   <th>Description</th>
                   <th class="col-right">Hours</th>
                   <th class="col-right">Rate</th>
                   <th class="col-right">Amount</th>
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td>Gaming Session</td>
                   <td>${booking.gameTitle} (${booking.date} @ ${booking.time})</td>
                   <td class="col-right">${booking.duration}</td>
                   <td class="col-right">₹${game ? game.pricePerHour : 'N/A'}</td>
                   <td class="col-right">₹${subtotal}</td>
                </tr>
             </tbody>
          </table>

          <div class="totals">
             <div class="total-row">
                <span>Subtotal</span>
                <span>₹${subtotal}</span>
             </div>
             <div class="total-row">
                <span>Discount ${booking.couponCode ? `(${booking.couponCode})` : ''}</span>
                <span>- ₹${discountAmount.toFixed(0)}</span>
             </div>
             <div class="total-row">
                <span>Tax (0%)</span>
                <span>₹0.00</span>
             </div>
             <div class="total-row final">
                <span>Total</span>
                <span>₹${booking.price}</span>
             </div>
          </div>

          <div class="qr-footer">
             <img src="${qrImageSrc}" alt="Scan for Entry" />
             <p>Scan for Entry</p>
          </div>

          <div class="footer">
             <p>Thank you for your business!</p>
             <p>Terms: Please arrive 10 minutes before your scheduled slot. Cancellations must be made 2 hours in advance.</p>
          </div>
        </div>
      </div>
      ${autoPrint ? '<script>window.onload = function() { window.print(); }</script>' : ''}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// --- Sub Components ---

// QR Code Modal for Users
const QRCodeModal = ({ isOpen, onClose, booking }: { isOpen: boolean, onClose: () => void, booking: Booking | null }) => {
   if (!isOpen || !booking) return null;
   const qrData = `${window.location.origin}?bid=${booking.id}`;
   const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
   const isExpired = booking.status === 'expired';

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
         <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(255,255,255,0.2)]" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black"><X size={20}/></button>
            <h3 className="text-black font-bold text-xl mb-1">SCAN TICKET</h3>
            <p className="text-gray-500 text-xs mb-4">Show this to the admin for verification</p>
            
            <div className="bg-gray-100 p-4 rounded-xl mb-4 inline-block relative overflow-hidden">
               <img 
                  src={qrImageSrc} 
                  alt="QR Code" 
                  className={`mix-blend-multiply transition-all duration-300 ${isExpired ? 'opacity-25 blur-sm grayscale' : ''}`} 
               />
               
               {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                     <div className="border-4 border-red-600 text-red-600 px-2 py-1 transform -rotate-45 rounded opacity-90 shadow-2xl bg-white/50 backdrop-blur-sm">
                        <span className="block text-2xl font-black tracking-widest uppercase font-display border-t-2 border-b-2 border-red-600 py-1 border-dashed whitespace-nowrap">
                          EXPIRED
                        </span>
                     </div>
                  </div>
               )}
            </div>
            
            <p className={`text-xs font-mono font-bold ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
               ID: {booking.id} {isExpired && '(INVALID)'}
            </p>
         </div>
      </div>
   );
};

// Scanner Modal for Admin
const ScannerModal = ({ isOpen, onClose, onScanSuccess }: { isOpen: boolean, onClose: () => void, onScanSuccess: (id: string) => void }) => {
   useEffect(() => {
      if (isOpen && window.Html5QrcodeScanner) {
         const scanner = new window.Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
         );
         
         scanner.render((decodedText: string) => {
            scanner.clear();
            // Try to extract bid parameter from URL
            try {
               const url = new URL(decodedText);
               const bid = url.searchParams.get('bid');
               if (bid) {
                  onScanSuccess(bid);
               } else {
                  // Fallback if just ID is scanned
                  onScanSuccess(decodedText);
               }
            } catch (e) {
               // Not a URL, maybe just the ID string
               onScanSuccess(decodedText);
            }
         }, (error: any) => {
            // Ignore scan errors, they happen every frame
         });

         return () => {
            scanner.clear().catch((error: any) => console.error("Failed to clear scanner", error));
         };
      }
   }, [isOpen, onScanSuccess]);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4">
         <div className="w-full max-w-md relative">
            <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-red-500"><X size={32}/></button>
            <h3 className="text-white text-center font-bold text-xl mb-4">SCAN CUSTOMER QR</h3>
            <div id="reader" className="bg-black border border-neon-blue rounded-xl overflow-hidden"></div>
            <p className="text-center text-gray-400 text-xs mt-4">Point camera at the booking QR code</p>
         </div>
      </div>
   );
};

// Colorful Ticket Modal Component
const TicketModal = ({ booking, onClose }: { booking: Booking | null, onClose: () => void }) => {
   if (!booking) return null;
   
   const isExpired = booking.status === 'expired';

   return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in duration-200">
         <div className={`bg-slate-900 border-2 ${isExpired ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-neon-green shadow-[0_0_50px_rgba(34,197,94,0.3)]'} rounded-2xl w-full max-w-md p-6 relative overflow-hidden`}>
            {/* Background Effects */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isExpired ? 'bg-red-600/10' : 'bg-neon-green/10'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"><X size={24}/></button>
            
            <div className="flex flex-col items-center mb-6 relative z-10">
               {isExpired ? (
                  <div className="mt-4 mb-4 border-4 border-red-600 text-red-600 px-8 py-2 transform -rotate-12 rounded-lg opacity-90 shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-black/40 backdrop-blur-sm">
                     <span className="text-3xl font-black tracking-widest uppercase font-display border-t-2 border-b-2 border-red-600 py-1 border-dashed">
                       EXPIRED
                     </span>
                  </div>
               ) : (
                  <>
                     <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center border border-green-500 mb-2 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        <CheckCircle size={32} className="text-green-500" />
                     </div>
                     <h3 className="text-2xl font-display font-bold text-white tracking-widest">TICKET VERIFIED</h3>
                  </>
               )}
               <p className={`${isExpired ? 'text-red-400' : 'text-green-400'} font-mono text-sm`}>ID: {booking.id}</p>
            </div>
            
            <div className="space-y-4 mb-6 bg-slate-950/80 p-6 rounded-xl border border-slate-800 relative z-10">
               <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Player</span>
                  <span className="text-white font-bold text-lg">{booking.userName}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Game</span>
                  <span className="text-neon-blue font-bold">{booking.gameTitle}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Date</span>
                  <span className="text-white">{booking.date}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Time</span>
                  <span className="text-white font-mono">{booking.time}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Payment</span>
                  <span className="text-neon-green font-bold">₹{booking.price} (PAID)</span>
               </div>
            </div>
            
            <button onClick={onClose} className={`w-full ${isExpired ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-green-600 hover:bg-green-500 shadow-green-900/50'} text-white font-bold py-3 rounded-lg shadow-lg transition-all relative z-10`}>
               {isExpired ? 'BOOKING AGAIN' : 'APPROVE ENTRY'}
            </button>
         </div>
      </div>
   );
};

const Navbar = ({ user, onLoginClick, onLogout, onChangePage, currentPage, siteContent }: { 
  user: User | null; 
  onLoginClick: () => void; 
  onLogout: () => void;
  onChangePage: (page: string) => void;
  currentPage: string;
  siteContent: SiteContent;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper for smooth scrolling with offset for fixed header
  const smoothScrollToBooking = () => {
    setTimeout(() => {
      const section = document.getElementById('booking-panel');
      if (section) {
        const yOffset = -100; // 80px navbar + 20px cushion
        const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBookingClick = () => {
    if (currentPage === 'home') {
      smoothScrollToBooking();
    } else {
      onChangePage('home');
      // Allow render to complete then scroll
      smoothScrollToBooking();
    }
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    if (currentPage === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onChangePage('home');
      window.scrollTo(0, 0);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-40 bg-neon-dark/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-neon-blue/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 cursor-pointer group" onClick={handleHomeClick}>
            <h1 className="font-display text-2xl md:text-3xl font-bold bg-clip-text text-transparent group-hover:scale-105 transition-transform"
                style={{ backgroundImage: `linear-gradient(to right, ${siteContent.navTitleColor1 || '#00f3ff'}, ${siteContent.navTitleColor2 || '#bc13fe'})` }}>
              {siteContent.navTitlePart1 || 'VISHNU'} {siteContent.navTitlePart2 || 'Game Center'}
            </h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button onClick={handleHomeClick} className="text-gray-300 hover:text-neon-cyan px-3 py-2 transition-colors font-medium font-sans">Home</button>
              {(!user || (user && !user.isAdmin)) && (
                 <button onClick={handleBookingClick} className="text-gray-300 hover:text-neon-cyan px-3 py-2 transition-colors font-medium font-sans">Booking</button>
              )}
              <button className="text-gray-300 hover:text-neon-cyan px-3 py-2 transition-colors font-medium font-sans">Nearby Hubs</button>
              
              {user ? (
                <div className="flex items-center gap-4 ml-8">
                  <div 
                    onClick={() => onChangePage(user.isAdmin ? 'admin' : 'profile')}
                    className={`flex items-center gap-2 cursor-pointer group py-1.5 px-4 rounded-full border transition-all shadow-lg ${
                      user.isAdmin 
                      ? 'bg-red-900/40 border-red-500 hover:border-red-400 shadow-red-500/20' 
                      : 'bg-slate-800/80 border-slate-700 hover:border-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.1)] hover:shadow-[0_0_15px_rgba(188,19,254,0.4)]'
                    }`}
                  >
                    <img 
                      src={user.photoUrl} 
                      alt="Profile" 
                      className={`h-8 w-8 rounded-full object-cover ring-2 ${user.isAdmin ? 'ring-red-500' : 'ring-neon-purple'}`}
                    />
                    <span className={`text-sm font-bold transition-colors ${user.isAdmin ? 'text-red-400 group-hover:text-red-300' : 'group-hover:text-neon-purple'}`}>
                      {user.isAdmin ? `ADMIN (${user.role || 'STAFF'})` : user.name}
                    </span>
                    {user.isVerified && !user.isAdmin && <BadgeCheck size={18} className="text-neon-blue ml-1" />}
                  </div>
                  <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors" title="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-neon-blue to-cyan-500 text-black font-bold px-6 py-2 rounded-full hover:shadow-[0_0_20px_#00f3ff] transition-all transform hover:-translate-y-0.5"
                >
                  LOGIN
                </button>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-neon-cyan p-2">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-neon-dark border-b border-white/10 absolute top-20 left-0 w-full z-30 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <button onClick={handleHomeClick} className="text-white block px-3 py-2 text-base font-medium">Home</button>
             {(!user || (user && !user.isAdmin)) && (
               <button onClick={handleBookingClick} className="text-white block px-3 py-2 text-base font-medium">Booking</button>
             )}
             {user ? (
               <>
                <button onClick={() => {onChangePage(user.isAdmin ? 'admin' : 'profile'); setIsMenuOpen(false)}} className={`block px-3 py-2 text-base font-bold ${user.isAdmin ? 'text-red-500' : 'text-neon-purple'}`}>
                  {user.isAdmin ? 'Admin Dashboard' : 'My Account'}
                </button>
                <button onClick={() => {onLogout(); setIsMenuOpen(false)}} className="text-gray-400 block px-3 py-2 text-base font-medium">Logout</button>
               </>
             ) : (
                <button onClick={() => {onLoginClick(); setIsMenuOpen(false)}} className="text-neon-cyan block px-3 py-2 text-base font-bold">Login / Signup</button>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ... AuthModal, HeroSection, GameCard, GamesGrid, UserProfile, BookingModal (Preserved)
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  onRegister: (user: DBUser) => void;
  onValidate: (identifier: string, pass: string) => DBUser | undefined;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, onRegister, onValidate }) => {
  // ... (AuthModal content preserved)
  const [view, setView] = useState<AuthView>(AuthView.SELECT_MODE);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN'); 
  const [formData, setFormData] = useState({
    emailOrMobile: '', 
    password: '',
    name: '',
    mobile: '',
    email: '', // Stores the full email for signup
    age: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('https://picsum.photos/seed/default/100/100');
  const [otpSent, setOtpSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingUser, setPendingUser] = useState<DBUser | null>(null);
  const [loginError, setLoginError] = useState('');

  // Helper to extract username part from email for input display
  const getUsername = (email: string) => email.replace('@gmail.com', '');

  useEffect(() => {
    if (isOpen) {
      setView(AuthView.SELECT_MODE);
      setAuthMode('LOGIN');
      setOtpSent(false);
      setIsSuccess(false);
      setShowPassword(false);
      setLoginError('');
      setFormData({
        emailOrMobile: '',
        password: '',
        name: '',
        mobile: '',
        email: '',
        age: '',
        otp: ''
      });
      setPendingUser(null);
      setLoadingText('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if(ev.target?.result) setPhotoPreview(ev.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    setLoadingText('AUTHENTICATING...');
    
    setTimeout(() => {
      const user = onValidate(formData.emailOrMobile, formData.password);
      
      if (user) {
        if (user.isBlocked) {
          setLoading(false);
          setLoginError('ACCESS DENIED. Your account has been blocked by Administrator.');
          return;
        }

        if (user.isAdmin) {
          // Admins login directly without OTP for this demo
          onAuthSuccess(user);
          setLoading(false);
        } else {
          setPendingUser(user);
          setLoading(false);
          setAuthMode('LOGIN');
          setOtpSent(true);
          setView(AuthView.OTP_VERIFY);
        }
      } else {
        setLoading(false);
        // Explicit Error Message
        setLoginError('Account not found. Please Create an Account.');
      }
    }, 1500);
  };

  const handleSignupStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('CREATING ID...'); 
    
    setTimeout(() => {
      const newUser: DBUser = {
        id: generateId(), // Uses new 10 digit generator
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        age: parseInt(formData.age),
        photoUrl: photoPreview,
        isVerified: true,
        password: formData.password,
        credits: 0,
        isBlocked: false
      };
      setPendingUser(newUser);

      setLoading(false);
      setAuthMode('SIGNUP');
      setOtpSent(true);
      setView(AuthView.OTP_VERIFY);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (window.confetti) {
        var duration = 15 * 1000;
        var animationEnd = Date.now() + duration;
        var skew = 1;

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        (function frame() {
            var timeLeft = animationEnd - Date.now();
            var ticks = Math.max(200, 500 * (timeLeft / duration));
            skew = Math.max(0.8, skew - 0.001);

            window.confetti({
            particleCount: 1,
            startVelocity: 0,
            ticks: ticks,
            origin: {
                x: Math.random(),
                // since particles fall down, skew start toward the top
                y: (Math.random() * skew) - 0.2
            },
            colors: ['#ffffff'],
            shapes: ['circle'],
            gravity: randomInRange(0.4, 0.6),
            scalar: randomInRange(0.4, 1),
            drift: randomInRange(-0.4, 0.4)
            });

            if (timeLeft > 0) {
            requestAnimationFrame(frame);
            }
        }());
    }

    setLoading(true);
    setLoadingText('VERIFYING CODE...');
    
    setTimeout(() => {
       setLoading(false);
       setIsSuccess(true);

       setTimeout(() => {
         if (authMode === 'SIGNUP') {
           onRegister(pendingUser);
         }
         onAuthSuccess(pendingUser);
         onClose();
       }, 1500); 
    }, 1500);
  };

  const handleResendOtp = (method: 'sms' | 'whatsapp' | 'email') => {
    setLoading(true);
    setLoadingText('RESENDING OTP...');
    let target = '';
    if (authMode === 'LOGIN') {
       target = formData.emailOrMobile;
    } else {
       target = method === 'email' ? formData.email : formData.mobile;
    }

    setTimeout(() => {
      setLoading(false);
      alert(`OTP Resent to ${target} via ${method.toUpperCase()}! Check your messages.`);
    }, 1200);
  };

  const getHeaderTitle = () => {
    if (isSuccess) return 'SUCCESS';
    switch (view) {
      case AuthView.SELECT_MODE: return 'WELCOME GAMER';
      case AuthView.LOGIN: return 'PLAYER LOGIN';
      case AuthView.SIGNUP: return 'NEW CHARACTER';
      case AuthView.OTP_VERIFY: return 'VERIFY IDENTITY';
      default: return 'WELCOME';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-neon-blue/30 w-full max-w-md rounded-2xl shadow-[0_0_40px_rgba(0,243,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800/50 p-6 text-center border-b border-white/5 relative shrink-0">
          {(view === AuthView.LOGIN || view === AuthView.SIGNUP) && !isSuccess && (
            <button 
              onClick={() => {
                setView(AuthView.SELECT_MODE);
                setShowPassword(false);
                setLoginError('');
              }} 
              className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-[60] p-1 rounded-full hover:bg-white/5"
          >
            <X size={20} />
          </button>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide relative z-0">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar min-h-[300px] flex flex-col justify-center">
          
          {isSuccess ? (
             <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-300">
                {/* Animated Tick */}
                <div className="w-28 h-28 bg-neon-green/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(10,255,10,0.4)] mb-6 border border-neon-green/30 relative">
                   <svg className="checkmark-svg w-16 h-16" viewBox="0 0 52 52">
                      <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                      <path className="checkmark-tick" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                   </svg>
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-2 tracking-wider drop-shadow-[0_0_10px_rgba(10,255,10,0.5)]">VERIFIED!</h3>
                <p className="text-gray-400 text-center font-sans">Identity confirmed.<br/>Redirecting to Dashboard...</p>
             </div>
          ) : (
             <>
               {view === AuthView.SELECT_MODE && (
                 <div className="flex flex-col gap-4 py-8">
                   <button 
                    onClick={() => setView(AuthView.LOGIN)}
                    className="group relative h-20 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-neon-blue rounded-xl flex items-center px-6 transition-all duration-300 overflow-hidden"
                   >
                     <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-colors mr-4 shrink-0">
                       <LogIn size={24} />
                     </div>
                     <div className="text-left">
                       <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">LOGIN</h3>
                       <p className="text-xs text-gray-500">Access your account</p>
                     </div>
                     <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 -translate-x-2">
                       <ArrowLeft className="rotate-180 text-neon-blue" />
                     </div>
                   </button>

                   <button 
                    onClick={() => setView(AuthView.SIGNUP)}
                    className="group relative h-20 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-neon-purple rounded-xl flex items-center px-6 transition-all duration-300 overflow-hidden"
                   >
                     <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-neon-purple group-hover:text-white transition-colors mr-4 shrink-0">
                       <UserPlus size={24} />
                     </div>
                     <div className="text-left">
                       <h3 className="text-lg font-bold text-white group-hover:text-neon-purple transition-colors">NEW USER</h3>
                       <p className="text-xs text-gray-500">Create a new character</p>
                     </div>
                     <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 -translate-x-2">
                       <ArrowLeft className="rotate-180 text-neon-purple" />
                     </div>
                   </button>
                 </div>
               )}

               {view === AuthView.LOGIN && (
                <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-right duration-300">
                  {/* Error Message Display */}
                  {loginError && (
                    <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-lg text-sm flex items-start gap-2 animate-pulse">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{loginError}</p>
                      </div>
                    </div>
                  )}

                  <div className="relative group">
                    <label className="text-xs text-gray-500 mb-1 block pl-1">Gmail ID / Mobile</label>
                    <div className="relative">
                       <UserIcon className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                       <input 
                          type="text" 
                          placeholder="Enter Gmail ID or Mobile Number" 
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] focus:outline-none transition-all"
                          value={formData.emailOrMobile}
                          onChange={e => {
                             setFormData({...formData, emailOrMobile: e.target.value});
                             setLoginError('');
                          }}
                          required
                        />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="text-xs text-gray-500 mb-1 block pl-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                        <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Password" 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-white focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] focus:outline-none transition-all"
                        value={formData.password}
                        onChange={e => {
                            setFormData({...formData, password: e.target.value});
                            setLoginError(''); // Clear error on type
                        }}
                        required
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-500 hover:text-neon-blue transition-colors"
                        >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-neon-blue to-cyan-600 text-black font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_#00f3ff] transition-all mt-4 transform hover:-translate-y-0.5"
                  >
                    {loading ? loadingText : 'LOGIN'}
                  </button>
                  <div className="text-center mt-4">
                     <p className="text-gray-400 text-sm">Don't have an ID?</p>
                     <button type="button" onClick={() => setView(AuthView.SIGNUP)} className="text-neon-blue font-bold hover:text-white transition-colors mt-1">CREATE ACCOUNT</button>
                  </div>
                </form>
              )}

              {view === AuthView.SIGNUP && (
                <form onSubmit={handleSignupStep1} className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neon-purple mb-2 relative group shadow-[0_0_15px_rgba(188,19,254,0.3)]">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                        <Camera size={24} className="text-white" />
                      </div>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                    </div>
                    <span className="text-xs text-neon-purple font-bold tracking-wider">UPLOAD AVATAR</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <input 
                      type="text" placeholder="Player Name" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-purple focus:outline-none transition-colors"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
                    />
                     <input 
                      type="number" placeholder="Age" className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-purple focus:outline-none transition-colors"
                      value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required
                    />
                  </div>
                  
                  <div className="relative group">
                    <Smartphone className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-neon-purple transition-colors" size={18} />
                    <input 
                      type="tel" placeholder="Mobile Number (WhatsApp)" className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 text-white focus:border-neon-purple focus:outline-none transition-colors"
                      value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required
                    />
                  </div>

                  <div className="relative group">
                    <label className="text-xs text-gray-500 mb-1 block pl-1">Email Address</label>
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden group-focus-within:border-neon-purple group-focus-within:shadow-[0_0_10px_rgba(188,19,254,0.3)] transition-all">
                       <div className="pl-3 text-gray-500">
                          <Mail size={18} />
                       </div>
                       <input 
                          type="text" 
                          placeholder="username" 
                          className="bg-transparent text-white p-3 w-full focus:outline-none"
                          value={getUsername(formData.email)}
                          onChange={e => {
                             setFormData({...formData, email: e.target.value + '@gmail.com'});
                          }}
                          required
                        />
                       <div className="bg-slate-800 text-gray-400 px-3 py-3 font-mono text-sm border-l border-slate-700">
                          @gmail.com
                       </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-neon-purple transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Password" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-white focus:border-neon-purple focus:outline-none transition-colors"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-neon-purple transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-400 bg-slate-950/50 p-2 rounded">
                    <input type="checkbox" required className="accent-neon-purple w-4 h-4" />
                    <span>I agree to Game Center Rules & Terms</span>
                  </div>

                  <button className="w-full bg-gradient-to-r from-neon-purple to-fuchsia-600 text-white font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_#bc13fe] transition-all mt-2 transform hover:-translate-y-0.5">
                    {loading ? loadingText : 'SEND OTP'}
                  </button>

                  <p className="text-center text-gray-400 text-sm mt-2">
                    Already registered? <span onClick={() => setView(AuthView.LOGIN)} className="text-neon-purple cursor-pointer hover:underline font-bold">Login</span>
                  </p>
                </form>
              )}

              {view === AuthView.OTP_VERIFY && (
                <form onSubmit={handleVerifyOtp} className="space-y-6 text-center py-4 animate-in slide-in-from-right duration-300">
                  <div>
                    <p className="text-gray-300 text-sm mb-2">Enter the security code sent to:</p>
                    {authMode === 'LOGIN' ? (
                       <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                         <p className="text-white font-mono text-lg">{formData.emailOrMobile}</p>
                       </div>
                    ) : (
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        <p className="text-white font-mono flex items-center justify-center gap-2"><Smartphone size={14} className="text-neon-purple"/> {formData.mobile}</p>
                        <p className="text-white font-mono flex items-center justify-center gap-2"><Mail size={14} className="text-neon-purple"/> {formData.email}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center gap-4">
                     {[1,2,3,4].map(i => (
                       <input 
                        key={i} 
                        type="text" 
                        maxLength={1} 
                        className="w-14 h-14 text-center text-2xl font-bold bg-slate-950 border border-neon-green/50 rounded-xl focus:border-neon-green focus:shadow-[0_0_15px_#0aff0a] focus:outline-none transition-all text-neon-green"
                      />
                     ))}
                  </div>

                  <button 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-neon-green to-emerald-600 text-black font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_#0aff0a] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={20} />
                      {loading ? loadingText : 'VERIFY & ENTER'}
                  </button>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-500 mb-3">OTP not received?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={() => handleResendOtp('whatsapp')} 
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-green-600/20 text-green-400 hover:text-green-300 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-green-500/50"
                      >
                        <MessageCircle size={16} /> WhatsApp
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleResendOtp('sms')} 
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-blue-500/50"
                      >
                        <Smartphone size={16} /> SMS
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleResendOtp('email')}
                      className="mt-3 text-gray-500 hover:text-white text-xs flex items-center justify-center gap-1 mx-auto"
                    >
                      <Mail size={12} /> Resend via Email
                    </button>
                  </div>
                </form>
              )}
             </>
          )}
        </div>
      </div>
    </div>
  );
}

// ... Sub Components Implementations ...
// (Remaining components like HeroSection, GamesGrid, etc. are kept as is, but must be included in the file output to prevent truncation)

const HeroSection = ({ onChangePage, user, onLoginClick, heroImages, currentPage, siteContent }: { 
  onChangePage: (page: string) => void;
  user: User | null;
  onLoginClick: () => void;
  heroImages: string[];
  currentPage: string;
  siteContent: SiteContent;
}) => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIdx(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const handleCtaClick = () => {
    if (user && user.isAdmin) {
      onChangePage('admin');
      return;
    }
    
    // Booking smooth scroll logic with offset
    const scrollToBooking = () => {
       setTimeout(() => {
         const section = document.getElementById('booking-panel');
         if (section) {
           const yOffset = -100; // Offset for navbar
           const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
           window.scrollTo({ top: y, behavior: 'smooth' });
         }
       }, 100);
    };

    if (currentPage === 'home') {
      scrollToBooking();
    } else {
      onChangePage('home');
      scrollToBooking();
    }
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      {heroImages.map((img, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIdx ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-neon-dark via-neon-dark/60 to-transparent z-10" />
          <img src={img} alt="Hero" className="w-full h-full object-cover" />
        </div>
      ))}

      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4">
        {/* If Hero Image is present, it acts as the Logo/Title Image, text becomes hidden or stylized below */}
        {siteContent.heroImage && (
          <img 
            src={siteContent.heroImage} 
            alt="Hero Logo" 
            className="h-24 md:h-32 object-contain mb-4 animate-in fade-in zoom-in duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
          />
        )}
        
        {/* Main Heading Text - Styled with extracted color if available, or hover effect */}
        <h2 
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
           className={`font-display text-4xl md:text-6xl font-black mb-4 tracking-wider drop-shadow-lg transition-all duration-300 cursor-default ${
             isHovered 
               ? 'bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-cyan-500' 
               : 'text-white animate-pulse-fast'
           }`}
           style={{
             // If hovered, color must be transparent for bg-clip-text to work.
             // If not hovered, use the dynamic color or default white.
             color: isHovered ? 'transparent' : (siteContent.heroTextColor || '#ffffff'),
             textShadow: isHovered 
               ? '0 0 30px rgba(0, 243, 255, 0.4)' // Cyan glow on hover
               : (siteContent.heroTextColor ? `0 0 20px ${siteContent.heroTextColor}` : 'none')
           }}
        >
          {siteContent.heroTitle}
        </h2>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 font-light">
          {siteContent.heroSubtitle}
        </p>
        <button 
          onClick={handleCtaClick}
          className="bg-neon-purple hover:bg-fuchsia-600 text-white font-bold py-4 px-10 rounded-full shadow-[0_0_20px_#bc13fe] hover:shadow-[0_0_40px_#bc13fe] transition-all transform hover:scale-105 flex items-center gap-2"
        >
          {user ? (
            user.isAdmin ? <><Settings /> OPEN ADMIN PANEL</> : <><Gamepad2 /> BOOK YOUR RIG</>
          ) : (
             <><Gamepad2 /> BOOK YOUR RIG</>
          )}
        </button>
      </div>
    </div>
  );
};

// 4. Games Grid (Booking Panel) with Smooth Sliding Image Slider
const GameCard: React.FC<{ game: Game, onBookGame: (game: Game) => void, shopIsOpen: boolean }> = ({ game, onBookGame, shopIsOpen }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  useEffect(() => {
    if (game.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIdx(prev => (prev + 1) % game.images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [game.images]);

  return (
    <div className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-neon-blue transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]">
      {/* Sliding Image Container */}
      <div className="relative h-48 overflow-hidden bg-black">
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out w-full" 
          style={{ transform: `translateX(-${currentImgIdx * 100}%)` }}
        >
          {game.images.map((img, idx) => (
             <div key={idx} className="min-w-full h-full relative flex-shrink-0">
                <img 
                  src={img} 
                  alt={game.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${game.available ? 'group-hover:scale-110' : 'grayscale brightness-50'}`}
                />
             </div>
          ))}
        </div>

        {/* Overlays (Static on top of slider) */}
        {game.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-20">
             {game.images.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImgIdx ? 'bg-neon-cyan' : 'bg-white/50'}`}></div>
             ))}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur text-neon-cyan px-3 py-1 rounded text-xs font-bold border border-neon-cyan/30 z-20">
          {game.category}
        </div>
        
        {/* WAITING LIST RUBBER STAMP - Only show if not available AND shop is open */}
        {!game.available && shopIsOpen && (
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 pointer-events-none">
              <div className="border-4 border-red-600 text-red-600 px-6 py-2 transform -rotate-12 rounded-lg opacity-90 shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-black/20 backdrop-blur-sm">
                 <span className="text-2xl font-black tracking-widest uppercase font-display border-t-2 border-b-2 border-red-600 py-1 border-dashed">
                   WAITING
                 </span>
              </div>
           </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-display text-xl font-bold text-white mb-2">{game.title}</h3>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-gray-400 text-sm">Rate</p>
            <p className="text-2xl font-bold text-neon-green">₹{game.pricePerHour}<span className="text-sm text-gray-500">/hr</span></p>
          </div>
          <button 
            onClick={() => onBookGame(game)}
            disabled={!game.available || !shopIsOpen}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              shopIsOpen 
                 ? (game.available 
                    ? 'bg-neon-blue text-black hover:bg-white' 
                    : 'bg-red-600 text-white cursor-not-allowed opacity-90 hover:bg-red-700 shadow-[0_0_10px_#ef4444]') 
                 : 'bg-slate-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {shopIsOpen ? (game.available ? 'BOOK NOW' : 'WAITING') : 'CLOSED'}
          </button>
        </div>
      </div>
    </div>
  );
}

const GamesGrid = ({ onBookGame, games, shopSettings, offers }: { onBookGame: (game: Game) => void, games: Game[], shopSettings: ShopSettings, offers: Offer[] }) => {
  const activeOffers = offers.filter(o => o.active);
  // Filter out hidden (blocked) games
  const visibleGames = games.filter(g => !g.isHidden);

  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      {/* Active Offers Banner */}
      {shopSettings.isOpen && activeOffers.length > 0 && (
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeOffers.map(offer => (
             <div key={offer.id} className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-xl p-6 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 bg-yellow-500/10 w-40 h-40 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
                
                {/* EXPIRED STAMP - IF CLAIMS FULL */}
                {offer.currentClaims >= offer.maxClaims && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 pointer-events-none">
                      <div className="border-4 border-red-600 text-red-600 px-6 py-2 transform -rotate-12 rounded-lg opacity-90 shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-black/20 backdrop-blur-sm">
                        <span className="text-2xl font-black tracking-widest uppercase font-display border-t-2 border-b-2 border-red-600 py-1 border-dashed">
                          EXPIRED
                        </span>
                      </div>
                  </div>
                )}

                <div className="z-10">
                   <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <Megaphone size={18} className="animate-bounce" />
                      <span className="font-bold tracking-wider text-xs">SPECIAL OFFER - {offer.percentage}% OFF</span>
                   </div>
                   <h3 className="text-2xl font-display font-bold text-white mb-1">{offer.title}</h3>
                   <p className="text-gray-300 text-sm mb-1">{offer.description}</p>
                   {/* Claim Progress */}
                   <div className="w-full bg-slate-900/50 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ width: `${(offer.currentClaims / offer.maxClaims) * 100}%`}}
                      ></div>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1">{offer.maxClaims - offer.currentClaims} coupons left</p>
                </div>
                <div className="z-10 bg-black/50 border border-yellow-500/50 px-4 py-2 rounded-lg text-center backdrop-blur-sm flex flex-col items-center min-w-[100px]">
                   <p className="text-xs text-gray-400 uppercase">Use Code</p>
                   <p className="text-xl font-mono font-bold text-yellow-400 tracking-widest">{offer.discountCode}</p>
                </div>
             </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-12">
        <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-neon-blue"></div>
        <h2 className="font-display text-3xl font-bold text-white text-center">BATTLE STATIONS</h2>
        <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-neon-blue"></div>
      </div>

      {!shopSettings.isOpen && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 p-6 rounded-xl text-center mb-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold font-display mb-2 flex items-center justify-center gap-2"><Lock size={24} /> VISHNU GAME CENTER IS CURRENTLY CLOSED</h3>
          <p>We are updating our systems or currently closed. <br/> Hours: {shopSettings.openTime} - {shopSettings.closeTime}</p>
        </div>
      )}

      {/* Grid container */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${!shopSettings.isOpen ? 'opacity-75' : ''}`}>
        {visibleGames.length > 0 ? (
          visibleGames.map(game => (
            <GameCard key={game.id} game={game} onBookGame={onBookGame} shopIsOpen={shopSettings.isOpen} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-500">
             <p className="text-xl font-display">No Available Slots</p>
             <p className="text-sm">All battle stations are currently closed or under maintenance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserProfile = ({ user, onUpdatePhoto, onNavigateToBooking, bookings, siteContent, games }: { 
  user: User, 
  onUpdatePhoto: (url: string) => void, 
  onNavigateToBooking: () => void,
  bookings: Booking[],
  siteContent: SiteContent,
  games: Game[]
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showQrModal, setShowQrModal] = useState<Booking | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if(ev.target?.result) onUpdatePhoto(ev.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const activeBookings = bookings.filter(b => b.userId === user.id && (b.status === 'confirmed' || b.status === 'expired'));
  
  return (
    <div className="pt-28 pb-20 px-4 max-w-4xl mx-auto min-h-screen">
      <div className="bg-slate-900/80 backdrop-blur border border-neon-purple/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border-b border-white/5 relative">
           <div className="absolute -bottom-10 left-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-900 ring-2 ring-neon-purple shadow-[0_0_20px_#bc13fe]">
                   <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-neon-purple p-1.5 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
              </div>
           </div>
        </div>

        <div className="mt-12 px-8 pb-8">
           <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-display font-bold text-white flex items-center gap-2">
                  {user.name} <Star className="text-yellow-400 fill-yellow-400" size={20} />
                </h2>
                <p className="text-gray-400">Level 5 Member • {user.email}</p>
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-1"><Smartphone size={12}/> {user.mobile}</p>
              </div>
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
                 <p className="text-xs text-gray-400 uppercase tracking-wider">Credits</p>
                 <p className="text-2xl font-bold text-neon-green">₹{user.credits.toLocaleString()}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="flex items-center gap-3 mb-2 text-neon-blue">
                    <Clock size={20} />
                    <h3 className="font-bold">Recent Hours</h3>
                 </div>
                 <p className="text-2xl font-display font-bold text-white">14.5 hrs</p>
                 <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="flex items-center gap-3 mb-2 text-neon-purple">
                    <CheckCircle size={20} />
                    <h3 className="font-bold">Bookings</h3>
                 </div>
                 <p className="text-2xl font-display font-bold text-white">{activeBookings.length}</p>
                 <p className="text-xs text-gray-500">Active Sessions</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="flex items-center gap-3 mb-2 text-neon-green">
                    <Gamepad2 size={20} />
                    <h3 className="font-bold">Favorite Rig</h3>
                 </div>
                 <p className="text-lg font-display font-bold text-white truncate">PC - Battle Stn 04</p>
                 <p className="text-xs text-gray-500">Most played</p>
              </div>
           </div>

           <h3 className="mt-10 mb-4 font-display text-xl font-bold text-white border-l-4 border-neon-blue pl-3">Active Bookings</h3>
           
           {activeBookings.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBookings.map(booking => (
                   <div 
                      key={booking.id} 
                      className={`bg-slate-950 rounded-xl p-6 border transition-colors relative group ${booking.status === 'expired' ? 'border-red-900/30 opacity-75' : 'border-slate-800 hover:border-neon-blue'}`}
                   >
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h4 className="font-bold text-white text-lg">{booking.gameTitle}</h4>
                            <p className="text-xs text-neon-cyan">Booking ID: {booking.id}</p>
                         </div>
                         <div className={`px-2 py-1 rounded text-xs font-bold border ${booking.status === 'confirmed' ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
                            {booking.status.toUpperCase()}
                         </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                         <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar size={14} className="text-gray-500"/> {booking.date}
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Clock size={14} className="text-gray-500"/> {booking.time} ({booking.duration.toFixed(2)} hr)
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-300">
                            <DollarSign size={14} className="text-gray-500"/> <span className="text-white font-bold">₹{booking.price}</span>
                         </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-slate-800">
                         <button 
                            onClick={() => {
                               const game = games.find(g => g.id === booking.gameId);
                               openInvoice(booking, user, siteContent, game, false); // View Mode
                            }}
                            className="flex-1 bg-slate-800 hover:bg-white hover:text-black text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                         >
                            <Eye size={14} /> View
                         </button>
                         {/* QR BUTTON */}
                         <button 
                            onClick={() => setShowQrModal(booking)}
                            className="w-12 bg-white text-black hover:bg-neon-blue text-xs font-bold py-2 rounded transition-colors flex items-center justify-center"
                            title="Show QR Code"
                         >
                            <QrCode size={18} />
                         </button>
                         <button 
                            onClick={() => {
                               const game = games.find(g => g.id === booking.gameId);
                               openInvoice(booking, user, siteContent, game, true); // Print Mode
                            }}
                            className="flex-1 bg-neon-blue hover:bg-cyan-400 text-black text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                         >
                            <Printer size={14} /> Print
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           ) : (
            <div className="bg-slate-950 rounded-xl p-6 text-center border border-slate-800/50">
               <p className="text-gray-400 italic">No active bookings right now. Time to play!</p>
               <button 
                  onClick={onNavigateToBooking}
                  className="mt-4 text-neon-blue hover:text-white text-sm font-bold uppercase tracking-wider hover:underline"
               >
                  Book a Session
               </button>
            </div>
           )}
        </div>
      </div>
      
      {/* QR Modal Component */}
      <QRCodeModal isOpen={!!showQrModal} onClose={() => setShowQrModal(null)} booking={showQrModal} />
    </div>
  );
};

const AdminDashboard = ({ 
  users, setUsers, 
  games, setGames, 
  shopSettings, setShopSettings,
  offers, setOffers,
  heroImages, setHeroImages,
  adminUsers, setAdminUsers,
  currentUser, setCurrentUser,
  allBookings, setAllBookings,
  siteContent, setSiteContent
}: { 
  users: DBUser[], setUsers: React.Dispatch<React.SetStateAction<DBUser[]>>,
  games: Game[], setGames: React.Dispatch<React.SetStateAction<Game[]>>,
  shopSettings: ShopSettings, setShopSettings: React.Dispatch<React.SetStateAction<ShopSettings>>,
  offers: Offer[], setOffers: React.Dispatch<React.SetStateAction<Offer[]>>,
  heroImages: string[], setHeroImages: React.Dispatch<React.SetStateAction<string[]>>,
  adminUsers: User[], setAdminUsers: React.Dispatch<React.SetStateAction<User[]>>,
  currentUser: User | null, setCurrentUser: (u: User | null) => void,
  allBookings: Booking[], setAllBookings: React.Dispatch<React.SetStateAction<Booking[]>>,
  siteContent: SiteContent, setSiteContent: React.Dispatch<React.SetStateAction<SiteContent>>
}) => {
  const [activeTab, setActiveTab] = useState<'SHOP' | 'STAFF' | 'USERS' | 'BOOKINGS' | 'GAMES' | 'OFFERS' | 'HOME SLIDER' | 'SITE CONTENT' | 'MY PROFILE'>('SHOP');
  const [viewUser, setViewUser] = useState<DBUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [myProfileForm, setMyProfileForm] = useState<Partial<User>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const tabs: string[] = ['SHOP', 'USERS', 'BOOKINGS', 'GAMES', 'OFFERS', 'HOME SLIDER', 'SITE CONTENT', 'MY PROFILE'];
  if (currentUser?.role === 'OWNER') {
     tabs.splice(1, 0, 'STAFF');
  }

  useEffect(() => {
    if (activeTab === 'MY PROFILE' && currentUser) {
      setMyProfileForm({ ...currentUser });
    }
  }, [activeTab, currentUser]);
  
  const handleScanSuccess = (scanData: string) => {
     setShowScanner(false);
     const booking = allBookings.find(b => b.id === scanData);
     if (booking) {
        setScannedBooking(booking);
     } else {
        alert("Sorry, this is not scan.");
     }
  };

  const handleSaveBookingEdit = () => {
     if (!editingBooking) return;
     const updatedBooking: Booking = { ...editingBooking, status: 'expired' };
     setAllBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  };

  const toggleGameStatus = (id: string) => setGames(prev => prev.map(g => g.id === id ? { ...g, available: !g.available } : g));
  const toggleGameBlock = (id: string) => setGames(prev => prev.map(g => g.id === id ? { ...g, isHidden: !g.isHidden } : g));
  const updateGame = (id: string, field: keyof Game, value: any) => setGames(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  const deleteGame = (id: string) => { if(window.confirm('Delete this game slot?')) setGames(prev => prev.filter(g => g.id !== id)); };
  const addGameSlot = () => { setGames(prev => [...prev, { id: generateId(), title: 'New Game Slot', category: 'PC', images: ['https://picsum.photos/seed/new/400/300'], pricePerHour: 100, available: true, isHidden: false }]); };
  const handleGameImageAdd = (gameId: string, url: string) => { if(!url.trim()) return; setGames(prev => prev.map(g => g.id === gameId ? { ...g, images: [...g.images, url] } : g)); };
  const handleGameImageRemove = (gameId: string, imgIndex: number) => { setGames(prev => prev.map(g => g.id === gameId ? { ...g, images: g.images.filter((_, i) => i !== imgIndex) } : g)); };
  // Using global handleFileUpload for handleFileUpload callback
  const updateUserCredit = (userId: string, amount: number) => setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: amount } : u));
  const handleLocalUserEdit = (field: keyof DBUser, value: string | number) => { if (viewUser) setViewUser({ ...viewUser, [field]: value }); };
  const saveUserChanges = () => { if (viewUser) { setUsers(prev => prev.map(u => u.id === viewUser.id ? viewUser : u)); setViewUser(null); alert("User details updated successfully."); } };
  const deleteUser = (userId: string) => { if(window.confirm('Delete this user?')) { setUsers(prev => prev.filter(u => u.id !== userId)); if (viewUser?.id === userId) setViewUser(null); } };
  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const newUser: DBUser = { id: generateId(), name: formData.get('name') as string, email: formData.get('email') as string, mobile: formData.get('mobile') as string, age: parseInt(formData.get('age') as string), credits: parseInt(formData.get('credits') as string) || 0, password: 'password123', photoUrl: 'https://ui-avatars.com/api/?name=' + (formData.get('name') as string), isVerified: true }; setUsers(prev => [...prev, newUser]); setShowAddUser(false); };
  const addOffer = () => { setOffers(prev => [...prev, { id: generateId(), title: 'New Discount', description: 'Get off on games', discountCode: 'SALE10', percentage: 10, active: false, maxClaims: 100, currentClaims: 0 }]); };
  const updateOffer = (id: string, field: keyof Offer, value: any) => setOffers(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  const deleteOffer = (id: string) => setOffers(prev => prev.filter(o => o.id !== id));
  const addHeroImage = (url: string) => { if(!url.trim()) return; setHeroImages(prev => [...prev, url]); };
  const removeHeroImage = (index: number) => setHeroImages(prev => prev.filter((_, i) => i !== index));
  const handleAddStaff = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const newStaff: User = { id: generateId(), name: formData.get('name') as string, email: formData.get('email') as string, password: formData.get('password') as string, mobile: formData.get('mobile') as string, role: formData.get('role') as any, isAdmin: true, isVerified: true, age: 25, credits: 0, photoUrl: 'https://ui-avatars.com/api/?name=' + (formData.get('name') as string), isBlocked: false, }; setAdminUsers(prev => [...prev, newStaff]); setShowAddStaff(false); };
  const deleteStaff = (id: string) => { if (id === currentUser?.id) { alert("You cannot delete yourself!"); return; } if(window.confirm('Delete this staff member?')) setAdminUsers(prev => prev.filter(a => a.id !== id)); };
  const toggleStaffBlock = (id: string) => { if (id === currentUser?.id) { alert("You cannot block yourself!"); return; } setAdminUsers(prev => prev.map(user => user.id === id ? { ...user, isBlocked: !user.isBlocked } : user )); };
  const saveMyProfile = () => { if (!currentUser) return; const updatedUser = { ...currentUser, ...myProfileForm, id: currentUser.id, role: currentUser.role } as User; if (myProfileForm.password && myProfileForm.password.trim() !== '') { updatedUser.password = myProfileForm.password; } else { updatedUser.password = currentUser.password; } setAdminUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u)); setCurrentUser(updatedUser); alert("Profile Saved Successfully!"); };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, async (url) => {
        const updatedContent = { ...siteContent, heroImage: url };
        try {
            const color = await extractColorFromImage(url);
            updatedContent.heroTextColor = color;
        } catch (error) {
            console.error("Failed to extract color", error);
        }
        setSiteContent(updatedContent);
    });
  };

  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
        setSiteContent({ ...siteContent, footerImage: url });
    });
  };

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Admin Header Tabs */}
        <div className="bg-gradient-to-r from-red-900/50 to-slate-900 p-6 border-b border-red-500/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold text-white tracking-wider flex items-center gap-3">
              <Settings className="text-red-500 animate-spin-slow" /> {siteContent.adminName || 'ADMIN COMMAND CENTER'}
            </h2>
            <p className="text-red-400 text-sm mt-1">Logged in as: {currentUser?.name} ({currentUser?.role})</p>
          </div>
          <button onClick={() => setShowScanner(true)} className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-[0_0_20px_white] hover:scale-105 transition-transform flex items-center gap-2 border-2 border-neon-blue mr-4"> <Scan size={20} /> ADMIN SCANNER </button>
          <div className="flex flex-wrap gap-2 justify-center"> {tabs.map(tab => ( <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-[0_0_15px_#ef4444]' : 'bg-slate-800 text-gray-400 hover:text-white'}`}> {tab} </button> ))} </div>
        </div>
        
        {/* Content of Tabs */}
        <div className="p-6">
          {/* ... Other Tabs Code ... */}
          {activeTab === 'SHOP' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in duration-300">
               <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${shopSettings.isOpen ? 'bg-green-500/20 shadow-[0_0_40px_#22c55e]' : 'bg-red-500/20 shadow-[0_0_40px_#ef4444]'}`}> <Power size={64} className={shopSettings.isOpen ? 'text-green-500' : 'text-red-500'} /> </div> <h3 className="text-3xl font-bold text-white">{shopSettings.isOpen ? 'SHOP IS OPEN' : 'SHOP IS CLOSED'}</h3> <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 w-full max-w-md"> <h4 className="text-gray-400 text-sm font-bold uppercase mb-4 text-center">Schedule Settings</h4> <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700 mb-4"> <div className="flex items-center gap-2"> <Clock size={18} className={shopSettings.autoMode ? 'text-neon-blue' : 'text-gray-500'} /> <span className="text-sm font-bold text-white">Auto-Schedule Mode</span> </div> <button onClick={() => setShopSettings({...shopSettings, autoMode: !shopSettings.autoMode})} className={`w-12 h-6 rounded-full p-1 transition-colors ${shopSettings.autoMode ? 'bg-neon-blue' : 'bg-slate-700'}`}> <div className={`w-4 h-4 rounded-full bg-white transition-transform ${shopSettings.autoMode ? 'translate-x-6' : 'translate-x-0'}`} /> </button> </div> <div className={`flex gap-4 mb-4 ${!shopSettings.autoMode ? 'opacity-50' : ''}`}> <div className="flex-1"> <label className="text-xs text-gray-500 block mb-1">Opening Time</label> <input type="time" value={shopSettings.openTime} onChange={e => setShopSettings({...shopSettings, openTime: e.target.value})} className="bg-slate-900 text-white p-2 rounded w-full border border-slate-700" /> </div> <div className="flex-1"> <label className="text-xs text-gray-500 block mb-1">Closing Time</label> <input type="time" value={shopSettings.closeTime} onChange={e => setShopSettings({...shopSettings, closeTime: e.target.value})} className="bg-slate-900 text-white p-2 rounded w-full border border-slate-700" /> </div> </div> <button disabled={shopSettings.autoMode} onClick={() => setShopSettings({...shopSettings, isOpen: !shopSettings.isOpen})} className={`w-full px-8 py-3 rounded-lg font-bold text-lg transition-all ${shopSettings.autoMode ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : (shopSettings.isOpen ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white')}`}> {shopSettings.autoMode ? 'MANAGED AUTOMATICALLY' : (shopSettings.isOpen ? 'CLOSE SHOP (MANUAL)' : 'OPEN SHOP (MANUAL)')} </button> {shopSettings.autoMode && <p className="text-xs text-gray-500 text-center mt-2">Shop opens/closes automatically based on time.</p>} </div>
            </div>
          )}
          
          {/* ... (STAFF, USERS tabs) ... */}
          {activeTab === 'STAFF' && currentUser?.role === 'OWNER' && (
             <div className="animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-bold text-white">Manage Admin Staff</h3> <button onClick={() => setShowAddStaff(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-500"><UserPlus size={18} /> Add Staff</button> </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {adminUsers.map(staff => ( <div key={staff.id} className={`bg-slate-950 border rounded-xl p-4 flex flex-col gap-4 relative ${staff.isBlocked ? 'border-red-600 opacity-75' : 'border-slate-800'}`}> {staff.isBlocked && <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">BLOCKED</div>} <div className="flex items-center gap-4"> <img src={staff.photoUrl} className="w-12 h-12 rounded-full border-2 border-red-500" alt="Avatar"/> <div> <h4 className="font-bold text-white">{staff.name} {staff.id === currentUser?.id && '(You)'}</h4> <p className="text-xs text-red-400 font-bold uppercase">{staff.role}</p> </div> </div> <div className="space-y-1 text-sm text-gray-400"> <p className="flex items-center gap-2"><Mail size={14}/> {staff.email}</p> <p className="flex items-center gap-2"><Smartphone size={14}/> {staff.mobile}</p> <p className="flex items-center gap-2"><Key size={14}/> {staff.password ? '••••••••' : 'No Password'}</p> </div> {staff.id !== currentUser?.id && ( <div className="flex gap-2 mt-auto"> <button onClick={() => toggleStaffBlock(staff.id)} className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded border transition-colors ${staff.isBlocked ? 'bg-green-900/50 text-green-400 border-green-800 hover:bg-green-900' : 'bg-orange-900/50 text-orange-400 border-orange-800 hover:bg-orange-900'}`}> {staff.isBlocked ? <><Unlock size={14} /> UNBLOCK</> : <><Ban size={14} /> BLOCK</>} </button> <button onClick={() => deleteStaff(staff.id)} className="flex-1 bg-slate-900 hover:bg-red-900/50 text-red-500 text-xs font-bold py-2 rounded border border-slate-800 hover:border-red-500 transition-colors cursor-pointer"> REMOVE ACCESS </button> </div> )} </div> ))} </div> {showAddStaff && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"> <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-md p-6"> <h3 className="text-xl font-bold text-white mb-4">Add New Admin/Staff</h3> <form onSubmit={handleAddStaff} className="space-y-3"> <input name="name" placeholder="Full Name" required className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> <input name="email" type="email" placeholder="Login Email" required className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> <input name="password" type="text" placeholder="Initial Password" required className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> <input name="mobile" placeholder="Mobile" required className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> <select name="role" required className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none"> <option value="STAFF">General Staff</option> <option value="OFFICE STAFF">Office Staff</option> <option value="MANAGER">Manager</option> <option value="ADMIN">Admin</option> <option value="OWNER">Owner</option> </select> <div className="flex gap-2 mt-4"> <button type="button" onClick={() => setShowAddStaff(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold">Cancel</button> <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-500">Create Admin</button> </div> </form> </div> </div> )}
             </div>
          )}
          {activeTab === 'USERS' && (
             <div className="animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-bold text-white">Registered Users</h3> <button onClick={() => setShowAddUser(true)} className="bg-neon-blue text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white"> <UserPlus size={18} /> Add User </button> </div> <div className="overflow-x-auto rounded-xl border border-slate-800"> <table className="w-full text-left border-collapse"> <thead> <tr className="bg-slate-950 text-gray-400 border-b border-gray-800"> <th className="p-4">User</th> <th className="p-4">Contact</th> <th className="p-4">Credits (₹)</th> <th className="p-4">Actions</th> </tr> </thead> <tbody className="divide-y divide-gray-800"> {users.filter(u => !u.isAdmin).map(user => ( <tr key={user.id} className="hover:bg-slate-800/50 transition-colors bg-slate-900/50"> <td className="p-4 flex items-center gap-3"> <img src={user.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" /> <div> <p className="font-bold text-white">{user.name}</p> <p className="text-xs text-gray-500 font-mono">ID: {user.id}</p> </div> </td> <td className="p-4 text-sm text-gray-300"> <p>{user.mobile}</p> <p className="text-xs text-gray-500">{user.email}</p> </td> <td className="p-4"> <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-2 border border-slate-800 w-32"> <IndianRupee size={16} className="text-green-500" /> <input type="number" value={user.credits} onChange={(e) => updateUserCredit(user.id, parseInt(e.target.value) || 0)} className="bg-transparent w-full text-green-400 font-bold focus:outline-none" /> </div> </td> <td className="p-4"> <div className="flex gap-2"> <button onClick={() => setViewUser(user)} className="p-2 bg-slate-800 text-neon-blue rounded hover:bg-white"><Edit size={16}/></button> <button onClick={() => deleteUser(user.id)} className="p-2 bg-slate-800 text-red-500 rounded hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button> </div> </td> </tr> ))} </tbody> </table> </div>
             </div>
          )}
          {activeTab === 'BOOKINGS' && (
             <div className="animate-in slide-in-from-bottom duration-300">
                <h3 className="text-xl font-bold text-white mb-4">All Bookings</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-gray-400"> <tr className="border-b border-gray-800"> <th className="p-3">ID</th> <th className="p-3">User</th> <th className="p-3">Game</th> <th className="p-3">Date/Time</th> <th className="p-3">Status</th> <th className="p-3 text-right">Actions</th> </tr> </thead>
                    <tbody className="divide-y divide-gray-800">
                      {allBookings.map(b => {
                        const bUser = users.find(u => u.id === b.userId) || { name: b.userName, email: 'N/A', mobile: 'N/A', id: b.userId, credits: 0, photoUrl: '', isVerified: false } as unknown as User;
                        const bGame = games.find(g => g.id === b.gameId);
                        return ( <tr key={b.id} className="hover:bg-slate-800/50 text-gray-300"> <td className="p-3 font-mono text-neon-cyan">{b.id}</td> <td className="p-3 font-bold">{b.userName}</td> <td className="p-3">{b.gameTitle}</td> <td className="p-3">{b.date} @ {b.time} ({b.duration}h)</td> <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'confirmed' ? 'bg-green-900/50 text-green-400' : (b.status === 'expired' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400')}`}>{b.status}</span></td> <td className="p-3 text-right"> <div className="flex justify-end gap-2"> <button onClick={() => setEditingBooking(b)} className="p-2 bg-slate-800 hover:bg-yellow-500 hover:text-black rounded transition-colors text-yellow-500" title="Edit Booking Time"> <Edit size={16} /> </button> <button onClick={() => openInvoice(b, bUser, siteContent, bGame, false)} className="p-2 bg-slate-800 hover:bg-neon-blue hover:text-black rounded transition-colors text-neon-blue" title="View Invoice"> <Eye size={16} /> </button> <button onClick={() => openInvoice(b, bUser, siteContent, bGame, true)} className="p-2 bg-slate-800 hover:bg-white hover:text-black rounded transition-colors text-white" title="Print Invoice"> <Printer size={16} /> </button> </div> </td> </tr> );
                      })}
                      {allBookings.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No bookings yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
          {/* ... (Other Tabs GAMES, OFFERS, HOME SLIDER, SITE CONTENT, MY PROFILE - Preserved) ... */}
          {activeTab === 'GAMES' && (
             <div className="animate-in slide-in-from-bottom duration-300"> <div className="flex justify-between items-center mb-6"> <h3 className="text-xl font-bold text-white">Manage Slots ({games.length})</h3> <button onClick={addGameSlot} className="flex items-center gap-2 bg-neon-blue text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"> <PlusCircle size={20} /> Add Slot </button> </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {games.map(game => ( <div key={game.id} className={`bg-slate-950 border rounded-xl p-4 relative group hover:border-red-500/50 transition-colors ${game.isHidden ? 'opacity-60 border-gray-700' : 'border-slate-800'}`}> {game.isHidden && <div className="absolute top-2 right-2 z-50 bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-500">HIDDEN / BLOCKED</div>} <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-black group-inner"> <img src={game.images[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Slot" /> <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2 border-t border-slate-800 max-h-24 overflow-y-auto"> <p className="text-xs text-gray-400 mb-1 font-bold">Images ({game.images.length})</p> <div className="flex flex-wrap gap-2 mb-2"> {game.images.map((img, idx) => ( <div key={idx} className="relative w-10 h-10 border border-slate-600 rounded"> <img src={img} className="w-full h-full object-cover" /> <button onClick={() => handleGameImageRemove(game.id, idx)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white"><X size={8}/></button> </div> ))} </div> <div className="flex gap-1"> <input placeholder="Add Image URL" className="flex-1 bg-slate-800 text-xs px-2 py-1 rounded text-white border border-slate-700" onKeyDown={(e) => {if(e.key === 'Enter') {handleGameImageAdd(game.id, (e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value = '';}}} /> <label className="cursor-pointer bg-slate-700 p-1 rounded hover:bg-neon-blue hover:text-black transition-colors flex items-center justify-center w-8"> <Upload size={14} /> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handleGameImageAdd(game.id, url))} /> </label> </div> </div> </div> <div className="space-y-3"> <div className="flex justify-between items-center gap-2"> <input value={game.title} onChange={(e) => updateGame(game.id, 'title', e.target.value)} className="bg-transparent w-full text-lg font-bold text-white border-b border-transparent focus:border-red-500 focus:outline-none" placeholder="Game Title"/> </div> <div className="flex gap-2"> <div className="flex-1 bg-slate-900 rounded p-2 border border-slate-800"> <p className="text-xs text-gray-500 mb-1">Price (₹/hr)</p> <input type="number" value={game.pricePerHour} onChange={(e) => updateGame(game.id, 'pricePerHour', parseInt(e.target.value))} className="bg-transparent w-full font-bold text-neon-green focus:outline-none"/> </div> <div className="flex-1 bg-slate-900 rounded p-2 border border-slate-800"> <p className="text-xs text-gray-500 mb-1">Category</p> <input list={`cat-list-${game.id}`} value={game.category} onChange={(e) => updateGame(game.id, 'category', e.target.value)} className="bg-transparent w-full font-bold text-white focus:outline-none"/> <datalist id={`cat-list-${game.id}`}><option value="PC"/><option value="PS5"/><option value="Xbox"/><option value="VR"/><option value="Racing Sim"/></datalist> </div> </div> <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 relative z-10"> <div className="flex items-center justify-between"> <span className="text-xs text-gray-500 uppercase">Availability</span> <div className="flex items-center gap-2"> <span className={`text-[10px] font-bold uppercase ${game.available ? 'text-green-500' : 'text-red-500'}`}>{game.available ? 'BOOKING OPEN' : 'WAITING LIST'}</span> <button onClick={() => toggleGameStatus(game.id)} className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${game.available ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white'}`}>{game.available ? 'CLOSE SLOT' : 'OPEN SLOT'}</button> </div> </div> <div className="flex items-center justify-between"> <span className="text-xs text-gray-500 uppercase">Visibility</span> <div className="flex items-center gap-2"> <button onClick={() => toggleGameBlock(game.id)} className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${!game.isHidden ? 'border-gray-500 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black'}`}>{!game.isHidden ? 'BLOCK / HIDE' : 'UNBLOCK / SHOW'}</button> </div> </div> <div className="flex justify-end pt-2"> <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteGame(game.id); }} className="bg-slate-900 text-gray-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full border border-slate-700 hover:border-red-500 transition-all shadow-lg cursor-pointer" title="Delete Permanently"><Trash2 size={16}/></button> </div> </div> </div> </div> ))} </div> </div>
          )}
          {activeTab === 'OFFERS' && (
             <div className="animate-in slide-in-from-bottom duration-300"> <div className="flex justify-between items-center mb-6"> <h3 className="text-xl font-bold text-white">Offer Panel</h3> <button onClick={addOffer} className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"><Tag size={20} /> New Offer</button> </div> <div className="space-y-4"> {offers.map(offer => ( <div key={offer.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center"> <div className="flex-1 space-y-2 w-full"> <div className="flex gap-2"> <input value={offer.title} onChange={(e) => updateOffer(offer.id, 'title', e.target.value)} placeholder="Offer Title (e.g., Summer Sale)" className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-full text-white font-bold focus:border-yellow-500 focus:outline-none"/> <input value={offer.discountCode} onChange={(e) => updateOffer(offer.id, 'discountCode', e.target.value)} placeholder="CODE" className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-32 text-yellow-400 font-mono font-bold text-center focus:border-yellow-500 focus:outline-none uppercase"/> </div> <div className="flex gap-2"> <input type="number" value={offer.percentage} onChange={(e) => updateOffer(offer.id, 'percentage', parseInt(e.target.value))} placeholder="%" className="bg-slate-900 border border-slate-800 rounded px-3 py-2 w-20 text-white font-bold focus:border-yellow-500 focus:outline-none"/> <input value={offer.description} onChange={(e) => updateOffer(offer.id, 'description', e.target.value)} placeholder="Description" className="bg-transparent border-none w-full text-sm text-gray-400 focus:text-white"/> </div> <div className="flex items-center gap-2 text-xs text-gray-500"> <span>Max Claims:</span> <input type="number" value={offer.maxClaims} onChange={(e) => updateOffer(offer.id, 'maxClaims', parseInt(e.target.value))} className="bg-slate-900 border border-slate-800 w-16 px-1 rounded text-white"/> <span>Used: {offer.currentClaims}</span> </div> </div> <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end"> <button onClick={() => updateOffer(offer.id, 'active', !offer.active)} className={`px-4 py-2 rounded-lg font-bold text-xs ${offer.active ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-gray-500'}`}>{offer.active ? 'ACTIVE' : 'INACTIVE'}</button> <button onClick={() => deleteOffer(offer.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={18}/></button> </div> </div> ))} {offers.length === 0 && <p className="text-gray-500 text-center py-4">No offers created yet.</p>} </div> </div>
          )}
          {activeTab === 'HOME SLIDER' && (
             <div className="animate-in slide-in-from-bottom duration-300"> <div className="flex justify-between items-center mb-6"> <h3 className="text-xl font-bold text-white">Home Page Slides ({heroImages.length})</h3> <div className="flex gap-2"> <label className="flex items-center gap-2 bg-neon-blue text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors cursor-pointer"> <Upload size={20} /> Upload Image <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, addHeroImage)} /> </label> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {heroImages.map((img, idx) => ( <div key={idx} className="relative h-48 rounded-xl overflow-hidden group border border-slate-800 hover:border-neon-blue"> <img src={img} className="w-full h-full object-cover" alt={`Slide ${idx}`} /> <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"> <button onClick={() => removeHeroImage(idx)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-500"><Trash2 size={16} /> Remove</button> </div> </div> ))} </div> <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800"> <p className="text-sm text-gray-400 mb-2">Or Add via URL (Supported: JPG, PNG, GIF, WEBP):</p> <div className="flex gap-2"> <input type="text" placeholder="https://example.com/image.jpg" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-blue" onKeyDown={(e) => {if (e.key === 'Enter') {addHeroImage((e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value = '';}}} /> <button className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700">Add</button> </div> </div> </div>
          )}
          {activeTab === 'SITE CONTENT' && (
             <div className="animate-in slide-in-from-bottom duration-300 max-w-4xl mx-auto"> <h3 className="text-xl font-bold text-white mb-6">Edit Site Text Content</h3> <div className="grid grid-cols-1 gap-8"> 
             
             {/* Admin Panel Settings */}
             <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl">
                 <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={18} /> General Settings</h4>
                 <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-2 font-bold uppercase">Website Name (Navigation)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Part 1 */}
                           <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-1 bg-black/50 text-[10px] text-gray-400 rounded-bl">Start</div>
                              <label className="text-[10px] text-gray-400 block mb-1 uppercase">Nav Title Part 1</label>
                              <div className="flex gap-2">
                                 <input
                                    type="text"
                                    value={siteContent.navTitlePart1 || ''}
                                    onChange={(e) => setSiteContent({...siteContent, navTitlePart1: e.target.value})}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-neon-blue focus:outline-none"
                                    placeholder="e.g. VISHNU"
                                 />
                                 <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden relative cursor-pointer" title="Garden Color (Gradient Start)">
                                    <input 
                                       type="color" 
                                       value={siteContent.navTitleColor1 || '#00f3ff'} 
                                       onChange={(e) => setSiteContent({...siteContent, navTitleColor1: e.target.value})}
                                       className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                    />
                                 </div>
                              </div>
                           </div>
                           {/* Part 2 */}
                           <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-1 bg-black/50 text-[10px] text-gray-400 rounded-bl">End</div>
                              <label className="text-[10px] text-gray-400 block mb-1 uppercase">Nav Title Part 2</label>
                              <div className="flex gap-2">
                                 <input
                                    type="text"
                                    value={siteContent.navTitlePart2 || ''}
                                    onChange={(e) => setSiteContent({...siteContent, navTitlePart2: e.target.value})}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm focus:border-neon-purple focus:outline-none"
                                    placeholder="e.g. Game Center"
                                 />
                                 <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden relative cursor-pointer" title="Garden Color (Gradient End)">
                                    <input 
                                       type="color" 
                                       value={siteContent.navTitleColor2 || '#bc13fe'} 
                                       onChange={(e) => setSiteContent({...siteContent, navTitleColor2: e.target.value})}
                                       className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Admin Dashboard Header</label>
                        <input
                        type="text"
                        value={siteContent.adminName || ''}
                        onChange={(e) => setSiteContent({...siteContent, adminName: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-red-500 focus:outline-none"
                        placeholder="e.g. ADMIN COMMAND CENTER"
                        />
                    </div>
                 </div>
             </div>

             <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl"> <h4 className="text-lg font-bold text-neon-blue mb-4 flex items-center gap-2"><Type size={18} /> Hero Section (Top Slide Text)</h4> <div className="space-y-4"> <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6 flex items-center gap-4"> <div className="w-20 h-20 bg-black rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden shrink-0"> {siteContent.heroImage ? ( <img src={siteContent.heroImage} className="w-full h-full object-contain" alt="Hero Logo" /> ) : ( <ImageIcon className="text-gray-600" /> )} </div> <div className="flex-1"> <label className="text-sm font-bold text-white mb-1 block">Hero Logo / Branding Image</label> <p className="text-xs text-gray-500 mb-3">Upload a transparent PNG for best results. Text color will auto-adjust to match.</p> <div className="flex gap-2"> <label className="cursor-pointer bg-neon-blue text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-white transition-colors flex items-center gap-2 inline-flex"> <Upload size={14} /> {siteContent.heroImage ? 'Change Image' : 'Upload Image'} <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} /> </label> {siteContent.heroImage && ( <button onClick={() => setSiteContent({...siteContent, heroImage: undefined})} className="bg-slate-800 text-red-400 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-700 transition-colors" > Remove </button> )} </div> </div> </div> <div className="flex gap-4 items-end"> <div className="flex-1"> <label className="text-xs text-gray-500 block mb-1">Main Heading</label> <input type="text" value={siteContent.heroTitle} onChange={(e) => setSiteContent({...siteContent, heroTitle: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-display text-xl focus:border-neon-blue focus:outline-none" placeholder="e.g. NEXT LEVEL GAMING"/> </div> <div className="flex flex-col items-center"> <label className="text-xs text-gray-500 mb-1">Color</label> <div className="w-12 h-[52px] bg-slate-900 border border-slate-700 rounded relative overflow-hidden cursor-pointer hover:border-neon-blue transition-colors" title="Change Heading Color"> <input type="color" value={siteContent.heroTextColor || '#ffffff'} onChange={(e) => setSiteContent({...siteContent, heroTextColor: e.target.value})} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer p-0 border-0" /> <div className="absolute inset-0 pointer-events-none flex items-center justify-center"> <div className="w-6 h-6 rounded-full border border-white/30 shadow-md" style={{backgroundColor: siteContent.heroTextColor || '#ffffff'}}></div> </div> </div> </div> </div> <div> <label className="text-xs text-gray-500 block mb-1">Subtitle / Description</label> <textarea value={siteContent.heroSubtitle} onChange={(e) => setSiteContent({...siteContent, heroSubtitle: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-gray-300 h-24 focus:border-neon-blue focus:outline-none resize-none" placeholder="e.g. Experience ultra-low latency..."/> </div> </div> </div> <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl"> <h4 className="text-lg font-bold text-neon-purple mb-4 flex items-center gap-2"><MapPin size={18} /> Footer Section (Bottom Location)</h4> <div className="space-y-4"> 
             
             {/* Footer Logo Upload */}
             <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-6 flex items-center gap-4">
                <div className="w-20 h-20 bg-black rounded-lg border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                   {siteContent.footerImage ? (
                      <img src={siteContent.footerImage} className="w-full h-full object-contain" alt="Footer Logo" />
                   ) : (
                      <ImageIcon className="text-gray-600" />
                   )}
                </div>
                <div className="flex-1">
                   <label className="text-sm font-bold text-white mb-1 block">Footer Logo / Branding Image</label>
                   <p className="text-xs text-gray-500 mb-3">Brand logo displayed at the bottom of the page.</p>
                   <div className="flex gap-2">
                      <label className="cursor-pointer bg-neon-purple text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-fuchsia-500 transition-colors flex items-center gap-2 inline-flex">
                         <Upload size={14} /> {siteContent.footerImage ? 'Change Image' : 'Upload Image'}
                         <input type="file" className="hidden" accept="image/*" onChange={handleFooterImageUpload} />
                      </label>
                      {siteContent.footerImage && (
                         <button onClick={() => setSiteContent({...siteContent, footerImage: undefined})} className="bg-slate-800 text-red-400 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-700 transition-colors" > Remove </button>
                      )}
                   </div>
                </div>
             </div>

             <div className="flex gap-4 items-start"> <div className="flex-1"> <label className="text-xs text-gray-500 block mb-1">Location Address / Title</label> <input type="text" value={siteContent.footerAddress} onChange={(e) => setSiteContent({...siteContent, footerAddress: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-bold focus:border-neon-purple focus:outline-none" placeholder="e.g. CYBER PLAZA, LEVEL 3"/> </div> </div> <div> <label className="text-xs text-gray-500 block mb-1">Additional Text (Hours, Features)</label> <input type="text" value={siteContent.footerText} onChange={(e) => setSiteContent({...siteContent, footerText: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-gray-300 focus:border-neon-purple focus:outline-none" placeholder="e.g. Open Hours: 09:00 - 23:00 • High Speed Fiber"/> </div> </div> </div> </div> </div>
          )}
          {activeTab === 'MY PROFILE' && (
             <div className="animate-in slide-in-from-bottom duration-300 max-w-2xl mx-auto"> <h3 className="text-xl font-bold text-white mb-6">Edit My Admin Profile</h3> <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-6"> <div className="flex justify-center"> <div className="relative group"> <img src={myProfileForm.photoUrl} className="w-24 h-24 rounded-full border-4 border-red-500 object-cover" /> <label className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full cursor-pointer hover:bg-white hover:text-black transition-colors"> <Edit size={16} /> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setMyProfileForm({...myProfileForm, photoUrl: url}))} /> </label> </div> </div> <div className="space-y-4"> <div> <label className="text-sm text-gray-500 mb-1 block">Display Name</label> <input value={myProfileForm.name || ''} onChange={(e) => setMyProfileForm({...myProfileForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> </div> <div> <label className="text-sm text-gray-500 mb-1 block flex items-center gap-2"><Key size={14} /> Login Email / ID</label> <input value={myProfileForm.email || ''} onChange={(e) => setMyProfileForm({...myProfileForm, email: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white focus:border-red-500 focus:outline-none" /> </div> <div> <label className="text-sm text-gray-500 mb-1 block">Role (Read Only)</label> <input value={myProfileForm.role || ''} disabled className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-gray-500 italic" /> </div> <div> <label className="text-sm text-gray-500 mb-1 block flex items-center gap-2"><Lock size={14} /> Update Password</label> <input type="text" value={myProfileForm.password || ''} onChange={(e) => setMyProfileForm({...myProfileForm, password: e.target.value})} placeholder="Enter new password to change" className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono focus:border-red-500 focus:outline-none" /> <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password. If changed, use new password next login.</p> </div> </div> <div className="pt-4 border-t border-slate-800"> <button onClick={saveMyProfile} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-500 shadow-[0_0_15px_#ef4444] transition-all">SAVE CHANGES & UPDATE DATABASE</button> </div> </div> </div>
          )}
        </div>
      </div>
      
      {/* Modals Preserved */}
      {viewUser && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"> <div className="bg-slate-900 border border-neon-blue/50 rounded-2xl w-full max-w-md p-6"> <h3 className="text-xl font-bold text-white mb-4">Edit User</h3> <div className="space-y-4"> <div><label className="text-xs text-gray-500">Name</label><input value={viewUser.name} onChange={e => handleLocalUserEdit('name', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"/></div> <div><label className="text-xs text-gray-500">Email</label><input value={viewUser.email} onChange={e => handleLocalUserEdit('email', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"/></div> <div><label className="text-xs text-gray-500">Mobile</label><input value={viewUser.mobile} onChange={e => handleLocalUserEdit('mobile', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"/></div> <div className="flex gap-2 mt-4"> <button onClick={() => setViewUser(null)} className="flex-1 bg-slate-800 text-white py-2 rounded">Cancel</button> <button onClick={saveUserChanges} className="flex-1 bg-neon-blue text-black font-bold py-2 rounded">Save</button> </div> </div> </div> </div> )}
      {showAddUser && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"> <div className="bg-slate-900 border border-neon-blue/50 rounded-2xl w-full max-w-md p-6"> <h3 className="text-xl font-bold text-white mb-4">Add New User</h3> <form onSubmit={handleAddUser} className="space-y-3"> <input name="name" placeholder="Full Name" required className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white"/> <input name="email" type="email" placeholder="Email" required className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white"/> <input name="mobile" placeholder="Mobile" required className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white"/> <input name="age" type="number" placeholder="Age" required className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white"/> <input name="credits" type="number" placeholder="Initial Credits" defaultValue="0" className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white"/> <div className="flex gap-2 mt-4"> <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 bg-slate-800 text-white py-2 rounded">Cancel</button> <button type="submit" className="flex-1 bg-neon-blue text-black font-bold py-2 rounded">Add User</button> </div> </form> </div> </div> )}
      {editingBooking && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"> <div className="bg-black border border-yellow-500 rounded-xl w-full max-w-md p-6 relative shadow-[0_0_30px_rgba(234,179,8,0.15)]"> <h3 className="text-xl font-bold text-white mb-6">Edit Booking Details</h3> <div className="space-y-5"> <div> <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Date</label> <input type="date" value={editingBooking.date} onChange={e => setEditingBooking({...editingBooking, date: e.target.value})} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition-colors outline-none" style={{ colorScheme: 'dark' }} /> </div> <div> <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Time</label> <input type="time" value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition-colors outline-none" style={{ colorScheme: 'dark' }} /> </div> <div> <label className="text-gray-500 text-xs font-bold uppercase mb-2 block">Duration</label> <div className="flex gap-4"> <div className="flex-1"> <input type="number" placeholder="0" value={Math.floor(editingBooking.duration)} onChange={e => { const h = Math.max(0, parseInt(e.target.value) || 0); const m = Math.round((editingBooking.duration - Math.floor(editingBooking.duration)) * 60); setEditingBooking({...editingBooking, duration: h + m/60}); }} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition-colors outline-none" /> <span className="text-xs text-gray-500 mt-1 block font-bold">HOURS</span> </div> <div className="flex-1"> <input type="number" placeholder="0" max="59" value={Math.round((editingBooking.duration - Math.floor(editingBooking.duration)) * 60)} onChange={e => { const h = Math.floor(editingBooking.duration); let m = parseInt(e.target.value) || 0; if (m < 0) m = 0; if (m >= 60) m = 59; setEditingBooking({...editingBooking, duration: h + m/60}); }} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none transition-colors outline-none" /> <span className="text-xs text-gray-500 mt-1 block font-bold">MINUTES</span> </div> </div> </div> <div className="flex gap-4 mt-8"> <button onClick={() => setEditingBooking(null)} className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold py-3 rounded-lg border border-gray-800 transition-all"> Cancel </button> <button onClick={() => { handleSaveBookingEdit(); setEditingBooking(null); }} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.4)]"> Save Adjustments </button> </div> </div> </div> </div> )}
      
      {/* Scanner Result Modals */}
      <ScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} onScanSuccess={handleScanSuccess} />
      <TicketModal booking={scannedBooking} onClose={() => setScannedBooking(null)} />
    </div>
  );
};

const BookingModal = ({ isOpen, game, onClose, offers, onConfirm, shopSettings }: {
  isOpen: boolean;
  game: Game | null;
  onClose: () => void;
  offers: Offer[];
  onConfirm: (details: any) => void;
  shopSettings: ShopSettings;
}) => {
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setLoading(false);
      setCoupon('');
      setAppliedDiscount(0);
      setDuration(1);
      setTime('');
    }
  }, [isOpen]);

  const handleApplyCoupon = () => {
    const offer = offers.find(o => o.discountCode === coupon && o.active);
    if (offer) {
       if (offer.currentClaims >= offer.maxClaims) {
          alert("This coupon has reached its maximum usage limit.");
          setAppliedDiscount(0);
          return;
       }
       setAppliedDiscount(offer.percentage);
    } else {
       alert("Invalid or inactive coupon code.");
       setAppliedDiscount(0);
    }
  };

  const handleConfirm = () => {
     if (!time) {
        alert("Please select a time.");
        return;
     }
     
     setLoading(true);
     setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
            onConfirm({
               game,
               date,
               time,
               duration,
               couponCode: appliedDiscount > 0 ? coupon : null,
               discount: appliedDiscount
            });
            onClose();
        }, 1500);
     }, 1500);
  };

  if (!isOpen || !game) return null;

  const subtotal = game.pricePerHour * duration;
  const total = Math.round(subtotal * (1 - appliedDiscount/100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
       <div className="bg-slate-900 border border-neon-blue rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,243,255,0.2)]">
          {/* Header */}
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
             <h3 className="font-display font-bold text-white text-xl tracking-wider">BOOK BATTLE STATION</h3>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24}/></button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar">
             {success ? (
                <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in">
                   <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] border border-green-500/30">
                      <CheckCircle size={48} className="text-green-500" />
                   </div>
                   <h3 className="text-3xl font-display font-bold text-white mb-2 tracking-wide">CONFIRMED!</h3>
                   <p className="text-gray-400 font-sans">Your rig is reserved. GLHF!</p>
                </div>
             ) : (
                <div className="space-y-6">
                   <div className="flex gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <img src={game.images[0]} className="w-24 h-24 object-cover rounded-lg border border-slate-700 shadow-lg" alt={game.title} />
                      <div>
                         <h4 className="font-bold text-white text-lg font-display tracking-wide">{game.title}</h4>
                         <span className="inline-block bg-neon-blue/10 text-neon-blue text-xs font-bold px-2 py-0.5 rounded border border-neon-blue/30 mb-2">{game.category}</span>
                         <p className="text-gray-400 text-sm">Rate: <span className="text-neon-green font-bold">₹{game.pricePerHour}/hr</span></p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs text-gray-500 mb-1 block font-bold uppercase">Date</label>
                         <div className="relative group">
                            <Calendar className="absolute left-3 top-3 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={16} />
                            <input 
                              type="date" 
                              value={date} 
                              min={getLocalDateString()}
                              onChange={(e) => setDate(e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 w-full text-white text-sm focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] outline-none transition-all" 
                            />
                         </div>
                      </div>
                      <div>
                         <label className="text-xs text-gray-500 mb-1 block font-bold uppercase">Start Time</label>
                         <div className="relative group">
                            <Clock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={16} />
                            <input 
                              type="time" 
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 w-full text-white text-sm focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] outline-none transition-all" 
                            />
                         </div>
                      </div>
                   </div>

                   <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-xs text-gray-500 font-bold uppercase">Duration</label>
                        <span className="text-neon-blue font-bold text-lg">{duration} Hour{duration > 1 ? 's' : ''}</span>
                      </div>
                      <input 
                         type="range" 
                         min="0.5" 
                         max="8" 
                         step="0.5"
                         value={duration} 
                         onChange={(e) => setDuration(parseFloat(e.target.value))}
                         className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                      />
                      <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                         <span>30m</span>
                         <span>2h</span>
                         <span>4h</span>
                         <span>6h</span>
                         <span>8h</span>
                      </div>
                   </div>

                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full"></div>
                      <label className="text-xs text-gray-500 mb-2 block font-bold uppercase flex items-center gap-2"><Tag size={12}/> PROMO CODE</label>
                      <div className="flex gap-2 relative z-10">
                         <input 
                           type="text" 
                           placeholder="ENTER CODE" 
                           value={coupon}
                           onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                           className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 outline-none uppercase font-mono tracking-wider"
                         />
                         <button 
                           onClick={handleApplyCoupon}
                           className="bg-slate-800 hover:bg-yellow-500 hover:text-black text-gray-300 hover:font-bold px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-yellow-500"
                         >
                           APPLY
                         </button>
                      </div>
                      {appliedDiscount > 0 && (
                         <div className="mt-2 flex items-center gap-2 text-green-400 text-xs font-bold animate-pulse">
                            <CheckCircle size={14}/> 
                            <span>COUPON APPLIED: {appliedDiscount}% OFF</span>
                         </div>
                      )}
                   </div>

                   <div className="border-t border-slate-800 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-400 text-sm">
                         <span>Subtotal</span>
                         <span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      {appliedDiscount > 0 && (
                         <div className="flex justify-between text-green-400 text-sm">
                            <span>Discount</span>
                            <span>- ₹{(subtotal - total).toFixed(0)}</span>
                         </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 border-dashed mt-2">
                         <span className="text-white text-sm font-bold uppercase tracking-wider">Total To Pay</span>
                         <span className="text-3xl font-bold text-neon-green font-display">₹{total}</span>
                      </div>
                   </div>

                   <button 
                      onClick={handleConfirm}
                      disabled={loading || !time}
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${loading || !time ? 'bg-slate-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-neon-blue to-cyan-600 text-black hover:shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:scale-[1.02]'}`}
                   >
                      {loading ? (
                         <>
                           <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                           PROCESSING...
                         </>
                      ) : (
                         <>CONFIRM BOOKING <ChevronRight size={20} /></>
                      )}
                   </button>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// ... Main App Export (Preserved)
export default function App() {
  // ... App Component Logic Preserved ...
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState<{isOpen: boolean, game: Game | null}>({isOpen: false, game: null});
  
  // ... Admin Lifted State ...
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [heroImages, setHeroImages] = useState<string[]>(INITIAL_HERO_IMAGES);
  
  // Initialize Special Offers with specified limits (ALL INACTIVE BY DEFAULT)
  const [offers, setOffers] = useState<Offer[]>([
     { id: 'off1', title: 'Starter Pack', description: 'Small discount for new joiners', discountCode: 'LEVEL10', percentage: 10, active: false, maxClaims: 100, currentClaims: 0 },
     { id: 'off2', title: 'Power Up', description: 'Get a boost', discountCode: 'BOOST20', percentage: 20, active: false, maxClaims: 50, currentClaims: 0 },
     { id: 'off3', title: 'Pro Gamer', description: 'Serious gaming session', discountCode: 'PRO30', percentage: 30, active: false, maxClaims: 30, currentClaims: 0 },
     { id: 'off4', title: 'Epic Loot', description: 'Big savings', discountCode: 'LOOT40', percentage: 40, active: false, maxClaims: 20, currentClaims: 0 },
     { id: 'off5', title: 'Half Life', description: 'Half price gaming', discountCode: 'HALF50', percentage: 50, active: false, maxClaims: 10, currentClaims: 0 },
     { id: 'off6', title: 'Super 60', description: 'Super savings', discountCode: 'SUPER60', percentage: 60, active: false, maxClaims: 8, currentClaims: 0 },
     { id: 'off7', title: 'Lucky 7', description: 'Huge discount', discountCode: 'LUCKY70', percentage: 70, active: false, maxClaims: 6, currentClaims: 0 },
     { id: 'off8', title: 'Elite 8', description: 'For the elite few', discountCode: 'ELITE80', percentage: 80, active: false, maxClaims: 4, currentClaims: 0 },
     { id: 'off9', title: 'Near Free', description: 'Almost free gaming', discountCode: 'FREE90', percentage: 90, active: false, maxClaims: 2, currentClaims: 0 },
     { id: 'off10', title: 'The One', description: 'The golden ticket', discountCode: 'GOLD100', percentage: 100, active: false, maxClaims: 1, currentClaims: 0 },
  ]);
  
  // Global Settings with Auto Mode
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
     isOpen: true,
     openTime: '09:00',
     closeTime: '23:00',
     autoMode: true // Default to Auto
  });

  // Site Content State (Hero & Footer Text)
  const [siteContent, setSiteContent] = useState<SiteContent>({
    heroTitle: 'NEXT LEVEL GAMING',
    heroSubtitle: 'Experience ultra-low latency, RTX 4090 rigs, and immersive VR worlds. The ultimate sanctuary for pro gamers.',
    footerAddress: 'CYBER PLAZA, LEVEL 3',
    footerText: 'Open Hours: 09:00 - 23:00 • High Speed Fiber • Pro Gear',
    adminName: 'ADMIN COMMAND CENTER',
    navTitlePart1: 'VISHNU',
    navTitlePart2: 'Game Center',
    navTitleColor1: '#00f3ff',
    navTitleColor2: '#bc13fe',
  });

  // Booking Data for Admin
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Auto Shop Status Logic
  useEffect(() => {
    if (!shopSettings.autoMode) return;

    const checkTime = () => {
      const now = new Date();
      // Format current time as HH:MM to match input
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [openH, openM] = shopSettings.openTime.split(':').map(Number);
      const [closeH, closeM] = shopSettings.closeTime.split(':').map(Number);
      
      const startMinutes = openH * 60 + openM;
      const endMinutes = closeH * 60 + closeM;
      
      let shouldBeOpen = false;
      
      if (endMinutes < startMinutes) {
        // Overnight schedule (e.g. 10 PM to 2 AM)
        shouldBeOpen = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      } else {
        // Normal schedule (e.g. 9 AM to 9 PM)
        shouldBeOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }

      if (shopSettings.isOpen !== shouldBeOpen) {
        setShopSettings(prev => ({ ...prev, isOpen: shouldBeOpen }));
      }
    };

    checkTime(); // Run immediately on mount/change
    const interval = setInterval(checkTime, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [shopSettings.autoMode, shopSettings.openTime, shopSettings.closeTime, shopSettings.isOpen]);

  // Auto-Expire Bookings
  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();
      setAllBookings(prev => prev.map(booking => {
         if (booking.status === 'confirmed') {
            const bookingEnd = new Date(`${booking.date}T${booking.time}`);
            // Use setTime for accurate fractional hour support (e.g. 1.5 hours)
            bookingEnd.setTime(bookingEnd.getTime() + booking.duration * 60 * 60 * 1000); 
            
            if (now > bookingEnd) {
               return { ...booking, status: 'expired' };
            }
         }
         return booking;
      }));
    };

    // Check immediately and then every minute
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for external scans via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bid = urlParams.get('bid');

    if (bid) {
       // Only allow "Admin" to stay on URL with logic, or just always redirect non-admins
       // Requirement: "any other scanner should redirect to the booking page"
       
       // Since user/admin login isn't persistent on refresh in this demo,
       // checking `user.isAdmin` here is tricky unless we had persistence.
       // Assuming standard behavior: If you refresh, you are logged out.
       // So anyone scanning (reloading page) gets redirected.
       
       // Clean URL
       window.history.replaceState(null, '', window.location.pathname);
       
       // Force to booking page/home
       setCurrentPage('home');
       setTimeout(() => {
          const section = document.getElementById('booking-panel');
          if (section) {
            const yOffset = -100;
            const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
       }, 500);
    }
  }, []);

  // Admin Users List
  const [adminUsers, setAdminUsers] = useState<User[]>([
    {
       id: 'admin-001',
       name: 'VISHNU Owner',
       email: 'admin123',
       password: 'vishnugame123',
       mobile: '9999999999',
       role: 'OWNER',
       isAdmin: true,
       isVerified: true,
       age: 30,
       credits: 99999,
       photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
       isBlocked: false
    }
  ]);

  // --- Client-Side Mock Database ---
  const [usersDB, setUsersDB] = useState<DBUser[]>([
    {
      id: generateId(),
      name: 'GamerOne',
      email: 'gamer@example.com',
      mobile: '5550199',
      age: 24,
      photoUrl: 'https://picsum.photos/seed/gamer1/100/100',
      isVerified: true,
      password: 'password123',
      credits: 500
    }
  ]);

  // Handlers
  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthOpen(false);
    if (userData.isAdmin) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('profile');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const handleBookGame = (game: Game) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setBookingModal({ isOpen: true, game });
  };

  const confirmBooking = (details: any) => {
     // Handle Coupon Usage
     if (details.couponCode) {
        setOffers(prevOffers => prevOffers.map(o => {
           if (o.discountCode === details.couponCode) {
              return { ...o, currentClaims: o.currentClaims + 1 };
           }
           return o;
        }));
     }

     // Use Dynamic Duration from Details
     // Round price to match display in booking modal
     const price = Math.round(details.game.pricePerHour * details.duration * (1 - details.discount/100));

     // Create Booking Record
     const newBooking: Booking = {
        id: generateId(),
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest',
        gameId: details.game.id,
        gameTitle: details.game.title,
        date: details.date,
        time: details.time,
        duration: details.duration, // Use dynamic duration
        price: price,
        status: 'confirmed',
        couponCode: details.couponCode,
        timestamp: new Date().toISOString()
     };

     setAllBookings(prev => [...prev, newBooking]);
     
     // IMPORTANT: Modal closing is now handled by the BookingModal component itself
     // after the animation completes. We DO NOT close it here.
  };

  const handleUpdatePhoto = (newUrl: string) => {
    if(user) {
      const updatedUser = { ...user, photoUrl: newUrl };
      setUser(updatedUser);
      // Update DB as well so it persists if they re-login in same session
      if(user.isAdmin) {
          setAdminUsers(prev => prev.map(u => u.id === user.id ? { ...u, photoUrl: newUrl } as User : u));
      } else {
          setUsersDB(prev => prev.map(u => u.id === user.id ? { ...u, photoUrl: newUrl } : u));
      }
    }
  };

  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
        setSiteContent({ ...siteContent, footerImage: url });
    });
  };

  // Mock DB Methods
  const registerUser = (newUser: DBUser) => {
    setUsersDB(prev => [...prev, newUser]);
  };

  const validateUserCredentials = (identifier: string, pass: string) => {
    // Check Admins first
    const admin = adminUsers.find(a => 
      (a.email === identifier || a.mobile === identifier) && a.password === pass
    );
    if (admin) return admin as DBUser;

    // Check Users
    return usersDB.find(u => 
      (u.email === identifier || u.mobile === identifier) && u.password === pass
    );
  };

  return (
    <div className="min-h-screen bg-neon-dark text-white font-sans selection:bg-neon-purple selection:text-white">
      <Navbar 
        user={user} 
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onChangePage={setCurrentPage}
        currentPage={currentPage}
        siteContent={siteContent}
      />

      <main>
        {currentPage === 'home' && (
          <>
            <HeroSection 
              onChangePage={setCurrentPage} 
              user={user} 
              onLoginClick={() => setIsAuthOpen(true)} 
              heroImages={heroImages} 
              currentPage={currentPage}
              siteContent={siteContent}
            />
            {(!user || (user && !user.isAdmin)) && (
               <div id="booking-panel">
                  <GamesGrid onBookGame={handleBookGame} games={games} shopSettings={shopSettings} offers={offers} />
               </div>
            )}
            
            {/* Footer */}
            <div className="bg-slate-900 border-t border-slate-800 py-12 text-center mt-10">
               {siteContent.footerImage && (
                  <div className="flex justify-center mb-6">
                     <img 
                        src={siteContent.footerImage} 
                        alt="Brand Logo" 
                        className="h-16 md:h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                     />
                  </div>
               )}
               <div className="flex justify-center items-center gap-2 text-neon-blue mb-4">
                 <MapPin />
                 <span className="font-display font-bold text-xl">{siteContent.footerAddress}</span>
               </div>
               <p className="text-gray-500 mb-2">{siteContent.footerText}</p>
               <p className="text-gray-600 text-xs">VISHNU Game Center © 2024</p>
            </div>
          </>
        )}

        {currentPage === 'booking' && (
           <div className="pt-20">
              <GamesGrid onBookGame={handleBookGame} games={games} shopSettings={shopSettings} offers={offers} />
           </div>
        )}

        {currentPage === 'profile' && user && !user.isAdmin && (
          <UserProfile 
            user={user} 
            onUpdatePhoto={handleUpdatePhoto} 
            onNavigateToBooking={() => {
              setCurrentPage('home');
              setTimeout(() => {
                const section = document.getElementById('booking-panel');
                if (section) {
                  const yOffset = -100;
                  const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 100);
            }}
            bookings={allBookings}
            siteContent={siteContent}
            games={games}
          />
        )}

        {currentPage === 'admin' && user?.isAdmin && (
           <AdminDashboard 
             users={usersDB} setUsers={setUsersDB} 
             games={games} setGames={setGames}
             shopSettings={shopSettings} setShopSettings={setShopSettings}
             offers={offers} setOffers={setOffers}
             heroImages={heroImages} setHeroImages={setHeroImages}
             adminUsers={adminUsers} setAdminUsers={setAdminUsers}
             currentUser={user} setCurrentUser={setUser}
             allBookings={allBookings} setAllBookings={setAllBookings}
             siteContent={siteContent} setSiteContent={setSiteContent}
           />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleLoginSuccess}
        onRegister={registerUser}
        onValidate={validateUserCredentials}
      />
      
      <BookingModal 
        isOpen={bookingModal.isOpen}
        game={bookingModal.game}
        onClose={() => setBookingModal({isOpen: false, game: null})}
        offers={offers}
        onConfirm={confirmBooking}
        shopSettings={shopSettings}
      />

      <ChatAssistant />
    </div>
  );
}