UI/UX Design System
Concurrent Manufacturing Tracker Interface
Design Philosophy: Apple Minimalist + Manufacturing Optimized
Target: Mobile-First Web App | Touch: Gloves-Friendly
1. DESIGN PRINCIPLES
1.1 Core Philosophy
Clarity Through Typography: Information hierarchy via font weight and size, not color
Touch-First: All interactive elements minimum 44px (Apple HIG), ideally 52px for manufacturing
Immediate Feedback: Visual + haptic response untuk setiap action
Zero Clutter: Whitespace as design element, monochrome palette
1.2 Manufacturing Context
Visibility: Critical info (progress %) harus terbaca dari 1 meter (large text)
Speed: Input harus < 3 detik (Quick Set buttons primary, slider secondary)
Reliability: Offline-capable, auto-sync when online
2. COLOR SYSTEM (Zinc Monochrome)
2.1 Palette
css
Copy
/* Backgrounds */
--bg-page: #fafafa;        /* zinc-50 */
--bg-card: #ffffff;        /* white */
--bg-input: #f4f4f5;       /* zinc-100 */

/* Text */
--text-primary: #18181b;   /* zinc-950 */
--text-secondary: #71717a; /* zinc-500 */
--text-muted: #a1a1aa;     /* zinc-400 */

/* Accents */
--accent-primary: #18181b; /* zinc-900 - buttons, active */
--accent-secondary: #e4e4e7; /* zinc-200 - borders */

/* Status (Minimal usage) */
--status-complete: #10b981; /* emerald-500 - 100% only */
--status-warning: #f59e0b;  /* amber-500 - problems only */
2.2 Progress Color Mapping
css
Copy
/* Progress bar fill by percentage */
0-25%:   #d4d4d8  /* zinc-300 */
26-50%:  #a1a1aa  /* zinc-400 */
51-75%:  #71717a  /* zinc-500 */
76-99%:  #3f3f46  /* zinc-600 */
100%:    #10b981  /* emerald-500 - Success */
3. TYPOGRAPHY
3.1 Font Stack
css
Copy
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
font-family-mono: 'SF Mono', SFMono-Regular, ui-monospace, monospace; /* For numbers */
3.2 Type Scale
Table
Copy
Element	Size	Weight	Usage
Hero	32px (text-3xl)	700	Page titles
Title	24px (text-2xl)	600	PO Numbers
Subtitle	20px (text-xl)	600	Item names
Body	16px (text-base)	400	Descriptions
Label	14px (text-sm)	500	Track labels
Caption	12px (text-xs)	400	Timestamps
Progress Display	48px (text-5xl)	700	Current % (monospace)
Track Percent	14px	600	Small % labels
4. SPACING & LAYOUT
4.1 Spacing Scale (4px base)
css
Copy
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
4.2 Touch Targets (CRITICAL)
css
Copy
--touch-min: 44px;  /* Apple minimum */
--touch-comfort: 52px; /* Manufacturing optimal */
--touch-large: 64px; /* Primary actions */

/* All buttons minimum */
min-height: 52px;
min-width: 52px;
4.3 Layout Grid
Mobile: Single column, max-width 100%, padding 16px (px-4)
Tablet: 2 columns for lists, padding 24px
Desktop: Centered container max-w-5xl (1024px)
5. COMPONENTS
5.1 Cards (Primary Container)
Standard Card:
css
Copy
.card {
  background: #ffffff;
  border-radius: 16px;       /* rounded-2xl */
  padding: 20px;             /* p-5 */
  border: 1px solid #e4e4e7; /* zinc-200 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
Track Card:
plain
Copy
┌─────────────────────────────────────┐
│ DRAFTING                     80%  │ ← Flex row
│ ████████████░░░░░░░░░░░░            │ ← Progress bar h-3
│                                     │
│ Last: 10:30 AM by Budi              │ ← Caption
└─────────────────────────────────────┘
5.2 Progress Input Component (Smart Input)
Layout:
plain
Copy
┌─────────────────────────────────────┐
│ PRODUCTION                          │ ← Label uppercase tracking-wide
│                                     │
│            ┌──────────┐             │
│            │    60%   │             │ ← 48px font-bold monospace
│            └──────────┘             │
│                                     │
│ Quick Set:                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│ │ 0% │ │25% │ │50% │ │75% │ │100%│ │ ← 52px touch target
│ └────┘ └────┘ └────┘ └────┘ └────┘ │
│                                     │
│ Fine Adjust:                        │
│ ┌──────┐         ┌──────┐          │
│ │  -5% │ ◀━━━━▶  │  +5% │          │
│ └──────┘         └──────┘          │
│                                     │
│ Note (Optional):                    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      UPDATE PROGRESS            │ │ ← Full width, 56px height
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
Component Specs:
Quick Set Buttons: 52px × 52px, rounded-xl, font-semibold
Fine Adjust: 56px × 44px, outlined style
Slider: Hidden by default (advanced mode), toggle via settings
Progress Display: 48px, font-mono, font-bold
Update Button: 56px height (primary action), bg-zinc-900
Interaction:
Tap Quick Set → Instant update display → Tap Update to confirm
Or: Tap Fine Adjust multiple times → Update
Or: Long press Quick Set for 0.5s → Slider appears (fine control)
5.3 Progress Bar
Standard:
css
Copy
.progress-container {
  height: 12px;              /* h-3 */
  background: #f4f4f5;       /* zinc-100 */
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* Color by value */
.progress-fill[data-value="0-25"] { background: #d4d4d8; }
.progress-fill[data-value="26-50"] { background: #a1a1aa; }
.progress-fill[data-value="51-75"] { background: #71717a; }
.progress-fill[data-value="76-99"] { background: #3f3f46; }
.progress-fill[data-value="100"] { background: #10b981; }
5.4 Buttons
Primary Button:
css
Copy
.btn-primary {
  background: #18181b;
  color: #ffffff;
  height: 56px;
  padding: 0 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, opacity 0.2s;
}

.btn-primary:active {
  transform: scale(0.98);
  opacity: 0.9;
}
Quick Set Button:
css
Copy
.btn-quick {
  background: #f4f4f5;
  color: #18181b;
  height: 52px;
  width: 52px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.btn-quick:hover {
  background: #e4e4e7;
}

.btn-quick.active {
  background: #18181b;
  color: #ffffff;
  border-color: #18181b;
}
5.5 Input Fields
Text Input:
css
Copy
.input {
  height: 52px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #d4d4d8;
  background: #ffffff;
  font-size: 16px; /* Prevent iOS zoom */
  color: #18181b;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(24,24,27,0.1);
}
Textarea (Note):
css
Copy
.textarea {
  min-height: 80px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #d4d4d8;
  resize: vertical;
  font-family: inherit;
}
5.6 Activity Log Item
plain
Copy
┌─────────────────────────────────────┐
│ ●                                   │ ← Status dot (colored)
│ ├─ 10:30 AM                         │ ← Time
│ ├─ Andi increased Production        │ ← Action
│ │  from 30% to 60% (+30%)           │ ← Detail
│ └─ "Finishing toolpath"             │ ← User note (optional)
│                                     │
│ ────                                │ ← Divider
│                                     │
│ ● 09:15 AM                          │
│   Sari completed Purchasing         │
│   from 90% to 100% (+10%)           │
└─────────────────────────────────────┘
6. PAGE LAYOUTS
6.1 Mobile Structure
plain
Copy
┌─────────────────────────────────────┐
│ Status Bar (System)                 │
├─────────────────────────────────────┤
│ Header                    [👤]      │ ← h-14, sticky
│ Title                    Profile    │
├─────────────────────────────────────┤
│                                     │
│ Scrollable Content                  │
│ (Tracks, Logs, Forms)               │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation                   │ ← h-16, fixed
│ 🏠   📋    ➕    📊    ⚙️           │
│ Home  POs  New  Stats  Profile      │
└─────────────────────────────────────┘
6.2 Department Dashboard (Workshop Example)
plain
Copy
┌─────────────────────────────────────┐
│ Production Floor              ⚙️    │
├─────────────────────────────────────┤
│                                     │
│ MY ACTIVE JOBS                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Bearing SKF 6205            🔴  │ │
│ │                                 │ │
│ │ Production:        60%          │ │
│ │ ████████████░░░░░░              │ │
│ │                                 │ │
│ │ [Update Progress]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ OTHER DEPARTMENTS                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Drafting: 80% (Budi)            │ │
│ │ Purchasing: 100% ✅             │ │
│ │ QC: 0% (Waiting)                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ RECENT ACTIVITY                     │
│ • 10:30 Andi +30% Production        │
│ • 09:15 Sari completed Purchasing   │
│                                     │
└─────────────────────────────────────┘
6.3 Progress Update Modal (Bottom Sheet)
plain
Copy
┌─────────────────────────────────────┐
│         ━━━━━ (drag handle)         │ ← h-6
│ Update Production                   │
│ Bearing SKF 6205                    │
├─────────────────────────────────────┤
│                                     │
│ Current: 60%                        │
│                                     │
│         ┌──────────┐                │
│         │    75%   │                │ ← Large display
│         └──────────┘                │
│                                     │
│ Quick: [0][25][50][75][100]         │
│                                     │
│ Fine: [-5%]      [+5%]              │
│                                     │
│ Note:                               │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      CONFIRM UPDATE             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
7. INTERACTION PATTERNS
7.1 Touch Gestures
Tap: Standard selection
Long Press: Reveal options / Advanced mode
Pull Down: Refresh data
Swipe Left (list items): Quick actions (Edit, View History)
7.2 Feedback
Haptic: Light impact on button press (if supported)
Visual:
Button scale 0.98 on press
Progress bar animated width transition
Toast notification for success (2s duration)
Sound: Optional click sound on update (manufacturing noise consideration)
7.3 Loading States
Skeleton: Shimmer effect on cards saat initial load
Button: Spinner menggantikan text, maintain height
Optimistic UI: Update display immediately, rollback on error
8. RESPONSIVE BREAKPOINTS
css
Copy
/* Mobile First */
/* Base: < 640px */

/* Tablet: >= 640px */
@media (min-width: 640px) {
  .container { max-width: 640px; margin: 0 auto; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .sidebar { display: block; width: 280px; }
  .bottom-nav { display: none; }
}
9. ACCESSIBILITY
9.1 Touch Accessibility
Minimum 44px touch targets (52px recommended)
Spacing antar tombol minimum 8px
Focus indicators visible (ring-2 ring-zinc-400)
9.2 Visual Accessibility
Contrast ratio minimum 4.5:1
Progress bar tidak hanya rely on color (width + text)
Font size minimum 16px untuk inputs (prevent zoom)
9.3 Screen Reader
Semantic HTML (button, not div onclick)
Aria-label untuk icon buttons
Live region untuk progress updates
10. COMPONENT EXAMPLES (React)
SmartProgressInput.tsx
tsx
Copy
interface SmartProgressInputProps {
  department: string;
  currentValue: number;
  onUpdate: (value: number, note?: string) => void;
}

export function SmartProgressInput({ 
  department, 
  currentValue, 
  onUpdate 
}: SmartProgressInputProps) {
  const [value, setValue] = useState(currentValue);
  const [note, setNote] = useState('');

  const quickSets = [0, 25, 50, 75, 100];

  const adjust = (delta: number) => {
    const newVal = Math.max(0, Math.min(100, value + delta));
    setValue(newVal);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-zinc-200">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-6">
        {department}
      </h3>

      {/* Large Display */}
      <div className="text-center mb-8">
        <span className="text-5xl font-bold font-mono text-zinc-900">
          {value}%
        </span>
      </div>

      {/* Quick Set */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {quickSets.map((q) => (
          <button
            key={q}
            onClick={() => setValue(q)}
            className={cn(
              "h-14 rounded-xl font-semibold text-sm transition-all",
              value === q 
                ? "bg-zinc-900 text-white" 
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            )}
          >
            {q}%
          </button>
        ))}
      </div>

      {/* Fine Adjust */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => adjust(-5)}
          className="h-12 px-6 rounded-xl border-2 border-zinc-200 font-medium text-zinc-700 active:bg-zinc-100"
        >
          -5%
        </button>
        <div className="flex-1 mx-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-zinc-900 transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
        <button 
          onClick={() => adjust(5)}
          className="h-12 px-6 rounded-xl border-2 border-zinc-200 font-medium text-zinc-700 active:bg-zinc-100"
        >
          +5%
        </button>
      </div>

      {/* Optional Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add note (optional)..."
        className="w-full h-24 p-4 rounded-xl border border-zinc-200 resize-none text-base mb-4 focus:outline-none focus:border-zinc-900"
      />

      {/* Confirm */}
      <button
        onClick={() => onUpdate(value, note)}
        disabled={value === currentValue}
        className="w-full h-14 bg-zinc-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        Update Progress
      </button>
    </div>
  );
}
TrackCard.tsx
tsx
Copy
interface TrackCardProps {
  department: string;
  progress: number;
  updatedBy?: string;
  updatedAt?: string;
  isEditable?: boolean;
  onUpdate?: () => void;
}

export function TrackCard({ 
  department, 
  progress, 
  updatedBy, 
  updatedAt,
  isEditable,
  onUpdate 
}: TrackCardProps) {
  const getProgressColor = (p: number) => {
    if (p === 100) return 'bg-emerald-500';
    if (p >= 76) return 'bg-zinc-600';
    if (p >= 51) return 'bg-zinc-500';
    if (p >= 26) return 'bg-zinc-400';
    return 'bg-zinc-300';
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 border",
      isEditable ? "border-zinc-900" : "border-zinc-200"
    )}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {department}
        </span>
        <span className="text-sm font-bold font-mono text-zinc-900">
          {progress}%
        </span>
      </div>

      <div className="h-3 bg-zinc-100 rounded-full overflow-hidden mb-3">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getProgressColor(progress))}
          style={{ width: `${progress}%` }}
        />
      </div>

      {updatedBy && (
        <p className="text-xs text-zinc-400 mb-3">
          Last: {updatedAt} by {updatedBy}
        </p>
      )}

      {isEditable && (
        <button 
          onClick={onUpdate}
          className="w-full h-11 bg-zinc-100 text-zinc-900 rounded-xl font-semibold text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          Update
        </button>
      )}
    </div>
  );
}
End of UI/UX Design System