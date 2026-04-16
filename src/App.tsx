import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Flame,
  Gauge,
  Home,
  KeyRound,
  Layers3,
  Moon,
  PackageCheck,
  PaintRoller,
  Route,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  Truck,
  Trophy,
  Wallet2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { cn } from "./lib/utils";
import {
  criticalDependencies,
  executiveSummary,
  kpiMetrics,
  movePhases,
  overallProgress,
  targetDate,
  todayLabel,
  type Phase,
  type Status,
} from "./data/move-plan";

type Theme = "light" | "dark";
type TabId = "overview" | "budget" | "timeline" | "logistics";
type ChartKind =
  | "area"
  | "line"
  | "bar"
  | "stacked"
  | "donut"
  | "radar"
  | "radial"
  | "heatmap"
  | "waterfall"
  | "timeline"
  | "scorecards"
  | "pipeline";

type VisualSpec = {
  id: string;
  title: string;
  eyebrow: string;
  detail: string;
  kind: ChartKind;
  size?: "wide" | "tall";
  data: Array<Record<string, string | number>>;
  metric?: string;
};

type ChartCategory = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  visualIds: string[];
};

const flour = "#ff8a1f";
const amber = "#ffb155";
const mint = "#49c7a2";
const blue = "#6378ff";
const rose = "#ff6f7e";
const violet = "#9568ff";
const slate = "#64748b";

const tabMeta: Record<TabId, { label: string; icon: LucideIcon; summary: string }> = {
  overview: {
    label: "Overview",
    icon: Gauge,
    summary: "Move health, mission score, readiness, risk and momentum in one command layer.",
  },
  budget: {
    label: "Budget & Cost",
    icon: CircleDollarSign,
    summary: "Burn, overlap, deposits, hidden costs, sensitivity and scenario control.",
  },
  timeline: {
    label: "Timeline & Readiness",
    icon: Route,
    summary: "Gantt, dependencies, blockers, buffers, task aging and critical path clarity.",
  },
  logistics: {
    label: "Logistics & Execution",
    icon: Truck,
    summary: "Packing, vendors, utilities, inventory, room readiness and day-of execution.",
  },
};

const statusMeta: Record<Status, { label: string; color: string; tone: string }> = {
  planned: { label: "Planned", color: slate, tone: "bg-slate-400" },
  in_progress: { label: "In motion", color: blue, tone: "bg-blue-500" },
  ready: { label: "Ready", color: mint, tone: "bg-emerald-500" },
  blocked: { label: "Blocked", color: rose, tone: "bg-rose-500" },
  critical: { label: "Critical", color: amber, tone: "bg-amber-500" },
};

const weeks = ["Apr W3", "Apr W4", "May W1", "May W2", "May W3", "May W4", "Jun W1", "Jun W2", "Jun W3"];

const readinessTrend = weeks.map((week, index) => ({
  week,
  readiness: [22, 29, 38, 47, 57, 68, 78, 88, 94][index],
  risk: [64, 59, 54, 48, 43, 34, 25, 18, 12][index],
  momentum: [18, 24, 34, 45, 52, 64, 72, 83, 91][index],
}));

const budgetBurn = weeks.map((week, index) => ({
  week,
  planned: [320, 740, 1160, 1880, 2660, 3480, 4240, 4980, 5360][index],
  actual: [280, 690, 1240, 1760, 2580, 3310, 4060, 4740, 5210][index],
  buffer: [620, 560, 540, 490, 430, 360, 310, 260, 220][index],
}));

const costCategories = [
  { name: "Deposit", value: 1700, color: flour },
  { name: "Rent overlap", value: 920, color: blue },
  { name: "Paint", value: 560, color: mint },
  { name: "Movers", value: 480, color: amber },
  { name: "Utilities", value: 260, color: violet },
  { name: "Buffer", value: 620, color: rose },
];

const packingRooms = [
  { name: "Bedroom", packed: 68, fragile: 16, setup: 42 },
  { name: "Kitchen", packed: 42, fragile: 38, setup: 25 },
  { name: "Studio", packed: 76, fragile: 8, setup: 58 },
  { name: "Living", packed: 51, fragile: 18, setup: 34 },
  { name: "Bath", packed: 64, fragile: 5, setup: 48 },
];

const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].flatMap((day, dayIndex) =>
  ["AM", "Mid", "PM"].map((slot, slotIndex) => ({
    day,
    slot,
    value: [24, 36, 42, 55, 67, 82, 74, 63, 48, 39, 52, 71, 85, 92, 76, 57, 44, 35, 31, 46, 60][
      dayIndex * 3 + slotIndex
    ],
  })),
);

const missionBadges = [
  { title: "Contract Locked", level: "Level 2", progress: 76, icon: KeyRound },
  { title: "Packing Streak", level: "6 days", progress: 64, icon: Flame },
  { title: "Budget Guardian", level: "A-", progress: 82, icon: ShieldAlert },
  { title: "Move-In Ready", level: "Level 4", progress: overallProgress, icon: Trophy },
];

const challenges = [
  { task: "Confirm painting quote", reward: "+120 pts", done: true },
  { task: "Schedule mover shortlist", reward: "+160 pts", done: true },
  { task: "Utilities transfer window", reward: "+180 pts", done: false },
  { task: "Pack kitchen fragile set", reward: "+140 pts", done: false },
];

const phaseCoordinates = movePhases.map((phase) => ({
  name: `F${phase.number}`,
  title: phase.shortTitle,
  start: phase.startWeek,
  duration: Math.max(1, phase.endWeek - phase.startWeek + 1),
  progress: phase.progress,
  status: phase.status,
}));

const overviewVisuals: VisualSpec[] = [
  {
    id: "move-health",
    title: "Move health trajectory",
    eyebrow: "Readiness vs risk",
    detail: "A narrative pulse of readiness rising while execution risk compresses.",
    kind: "area",
    size: "wide",
    data: readinessTrend,
    metric: "94%",
  },
  {
    id: "mission-score",
    title: "Mission score ring",
    eyebrow: "Road to move-in",
    detail: "The overall progress ring turns the plan into a visible finish line.",
    kind: "radial",
    data: [{ name: "Mission", value: overallProgress, fill: flour }],
    metric: `${overallProgress}%`,
  },
  {
    id: "critical-radar",
    title: "Move control radar",
    eyebrow: "Operational balance",
    detail: "A health-dashboard view across cost, time, dependencies and confidence.",
    kind: "radar",
    data: [
      { axis: "Cost", score: 74 },
      { axis: "Time", score: 68 },
      { axis: "Packing", score: 54 },
      { axis: "Access", score: 82 },
      { axis: "Risk", score: 61 },
      { axis: "Energy", score: 77 },
    ],
    metric: "73",
  },
  {
    id: "weekly-focus",
    title: "Weekly focus load",
    eyebrow: "Narrative rhythm",
    detail: "Shows when the move asks for the most attention and decisions.",
    kind: "bar",
    data: weeks.map((week, index) => ({ week, value: [28, 46, 62, 74, 83, 77, 58, 44, 31][index] })),
  },
  {
    id: "achievement-rail",
    title: "Achievement rail",
    eyebrow: "Badges unlocked",
    detail: "Useful rewards for behaviors that actually reduce moving friction.",
    kind: "scorecards",
    size: "wide",
    data: missionBadges.map((badge) => ({ name: badge.title, value: badge.progress })),
  },
  {
    id: "risk-donut",
    title: "Risk concentration",
    eyebrow: "Attention split",
    detail: "Contract and logistics dominate the current risk profile.",
    kind: "donut",
    data: [
      { name: "Contract", value: 32, color: flour },
      { name: "Logistics", value: 27, color: blue },
      { name: "Budget", value: 21, color: rose },
      { name: "Setup", value: 20, color: mint },
    ],
  },
  {
    id: "momentum-line",
    title: "Momentum index",
    eyebrow: "Plan velocity",
    detail: "A compact read on whether progress is accelerating quickly enough.",
    kind: "line",
    data: readinessTrend,
    metric: "+23",
  },
  {
    id: "phase-state",
    title: "Phase state stack",
    eyebrow: "Current mix",
    detail: "How the eight phases distribute across ready, moving and blocked states.",
    kind: "stacked",
    data: [
      { week: "Now", ready: 2, moving: 1, blocked: 1, planned: 4 },
      { week: "Next", ready: 3, moving: 2, blocked: 1, planned: 2 },
      { week: "Move-in", ready: 6, moving: 1, blocked: 0, planned: 1 },
    ],
  },
  {
    id: "completion-heatmap",
    title: "Completion heatmap",
    eyebrow: "Best work windows",
    detail: "Highlights the windows where small tasks can unlock big progress.",
    kind: "heatmap",
    data: heatmapDays,
  },
  {
    id: "challenge-board",
    title: "Challenge board",
    eyebrow: "Micro rewards",
    detail: "Four near-term actions that raise confidence without adding noise.",
    kind: "pipeline",
    size: "wide",
    data: challenges.map((challenge, index) => ({
      name: challenge.task,
      value: challenge.done ? 100 : 38 + index * 12,
    })),
  },
];

const budgetVisuals: VisualSpec[] = [
  {
    id: "budget-burn",
    title: "Budget burn curve",
    eyebrow: "Expected vs actual",
    detail: "Tracks whether the cash curve is staying inside the move envelope.",
    kind: "area",
    size: "wide",
    data: budgetBurn,
    metric: "$5.21M",
  },
  {
    id: "category-donut",
    title: "Category allocation",
    eyebrow: "Cost mix",
    detail: "Deposit and overlap are the big levers; buffer protects the finish.",
    kind: "donut",
    data: costCategories.map((item) => ({ name: item.name, value: item.value, color: item.color })),
  },
  {
    id: "hidden-costs",
    title: "Hidden-cost radar",
    eyebrow: "Sensitivity",
    detail: "Surfaces the costs most likely to surprise the plan.",
    kind: "radar",
    data: [
      { axis: "Fees", score: 48 },
      { axis: "Repairs", score: 67 },
      { axis: "Delivery", score: 58 },
      { axis: "Utilities", score: 42 },
      { axis: "Food", score: 38 },
      { axis: "Buffer", score: 74 },
    ],
  },
  {
    id: "overlap-weeks",
    title: "Overlap cost ladder",
    eyebrow: "Scenario",
    detail: "Shows the cost of choosing calm overlap versus a compressed move.",
    kind: "waterfall",
    data: [
      { name: "Base", value: 4100 },
      { name: "+1 wk", value: 4380 },
      { name: "+2 wk", value: 4660 },
      { name: "+3 wk", value: 4940 },
      { name: "+4 wk", value: 5220 },
    ],
  },
  {
    id: "deposit-recovery",
    title: "Deposit recovery probability",
    eyebrow: "Confidence band",
    detail: "A simple odds curve for how much cash returns after handoff.",
    kind: "line",
    data: weeks.map((week, index) => ({
      week,
      readiness: [42, 48, 52, 58, 63, 69, 73, 78, 83][index],
      risk: [34, 37, 41, 44, 49, 53, 58, 61, 66][index],
    })),
    metric: "83%",
  },
  {
    id: "utility-map",
    title: "Utility transfer cost map",
    eyebrow: "Activation",
    detail: "Internet, power and admin costs by activation window.",
    kind: "bar",
    data: [
      { week: "Internet", value: 88 },
      { week: "Power", value: 64 },
      { week: "Gas", value: 42 },
      { week: "Admin", value: 57 },
      { week: "Locks", value: 73 },
    ],
  },
  {
    id: "cash-buffer",
    title: "Cash buffer runway",
    eyebrow: "Resilience",
    detail: "How much financial cushion remains after each move milestone.",
    kind: "area",
    data: budgetBurn.map((point) => ({ week: point.week, readiness: point.buffer, risk: point.actual / 12 })),
  },
  {
    id: "quote-comparison",
    title: "Vendor quote comparison",
    eyebrow: "Mover bids",
    detail: "Compares mover quotes with quality weighting and risk premiums.",
    kind: "stacked",
    data: [
      { week: "A", ready: 220, moving: 40, blocked: 18, planned: 30 },
      { week: "B", ready: 260, moving: 28, blocked: 12, planned: 18 },
      { week: "C", ready: 190, moving: 64, blocked: 33, planned: 26 },
    ],
  },
  {
    id: "payment-timeline",
    title: "Payment milestone timeline",
    eyebrow: "Cash events",
    detail: "The cash calendar that matters most before keys and move day.",
    kind: "timeline",
    size: "wide",
    data: [
      { name: "Reserve", start: 0, duration: 1, progress: 100 },
      { name: "Deposit", start: 2, duration: 2, progress: 72 },
      { name: "Paint", start: 4, duration: 2, progress: 34 },
      { name: "Movers", start: 6, duration: 1, progress: 20 },
      { name: "Closeout", start: 8, duration: 1, progress: 10 },
    ],
  },
  {
    id: "budget-scorecards",
    title: "Financial control cards",
    eyebrow: "Guardrails",
    detail: "Budget health as a set of fast operational indicators.",
    kind: "scorecards",
    data: [
      { name: "Buffer", value: 82 },
      { name: "Quotes", value: 68 },
      { name: "Overlap", value: 74 },
      { name: "Deposit", value: 61 },
    ],
  },
];

const timelineVisuals: VisualSpec[] = [
  {
    id: "immersive-gantt",
    title: "Immersive Gantt roadmap",
    eyebrow: "Critical path",
    detail: "The full moving plan as a dependency-aware road to move-in.",
    kind: "timeline",
    size: "wide",
    data: phaseCoordinates,
    metric: "8 phases",
  },
  {
    id: "readiness-trend",
    title: "Weekly readiness trend",
    eyebrow: "Preparedness",
    detail: "Readiness improves fastest after access, painting and packing converge.",
    kind: "line",
    data: readinessTrend,
  },
  {
    id: "dependency-radar",
    title: "Dependency radar",
    eyebrow: "Blocker exposure",
    detail: "Shows which dependency groups can still affect the date.",
    kind: "radar",
    data: [
      { axis: "Contract", score: 78 },
      { axis: "Access", score: 72 },
      { axis: "Notice", score: 61 },
      { axis: "Paint", score: 58 },
      { axis: "Movers", score: 52 },
      { axis: "Utilities", score: 45 },
    ],
  },
  {
    id: "phase-duration",
    title: "Phase duration bars",
    eyebrow: "Load by block",
    detail: "A compact read of where time is consumed.",
    kind: "bar",
    data: movePhases.map((phase) => ({
      week: `F${phase.number}`,
      value: (phase.durationDays[0] + phase.durationDays[1]) / 2,
    })),
  },
  {
    id: "blocker-donut",
    title: "Blocker mix",
    eyebrow: "Risk source",
    detail: "The current split of attention across external blockers.",
    kind: "donut",
    data: [
      { name: "Access", value: 31, color: flour },
      { name: "Contract", value: 25, color: blue },
      { name: "Paint", value: 18, color: mint },
      { name: "Mover", value: 16, color: rose },
      { name: "Admin", value: 10, color: violet },
    ],
  },
  {
    id: "buffer-burn",
    title: "Time buffer burn",
    eyebrow: "Slack",
    detail: "Protects the plan from losing calm in the last two weeks.",
    kind: "area",
    data: weeks.map((week, index) => ({
      week,
      readiness: [21, 19, 18, 15, 13, 10, 8, 6, 5][index],
      risk: [7, 8, 10, 11, 13, 14, 15, 17, 18][index],
    })),
  },
  {
    id: "task-aging",
    title: "Task aging profile",
    eyebrow: "Aging work",
    detail: "Old tasks are the ones most likely to become emotional drag.",
    kind: "stacked",
    data: [
      { week: "0-2d", ready: 9, moving: 5, blocked: 1, planned: 3 },
      { week: "3-5d", ready: 6, moving: 6, blocked: 3, planned: 4 },
      { week: "6+d", ready: 2, moving: 4, blocked: 5, planned: 2 },
    ],
  },
  {
    id: "milestone-heatmap",
    title: "Milestone intensity heatmap",
    eyebrow: "Calendar load",
    detail: "Shows where the calendar becomes dense and needs protection.",
    kind: "heatmap",
    data: heatmapDays.map((point) => ({ ...point, value: Math.max(12, Number(point.value) - 8) })),
  },
  {
    id: "unlock-pipeline",
    title: "Milestone unlock pipeline",
    eyebrow: "Next gates",
    detail: "A game-like sequence of unlocks that also reflects real dependencies.",
    kind: "pipeline",
    size: "wide",
    data: [
      { name: "Decision", value: 100 },
      { name: "Keys", value: 74 },
      { name: "Notice", value: 38 },
      { name: "Paint", value: 24 },
      { name: "Move day", value: 12 },
    ],
  },
  {
    id: "critical-scorecards",
    title: "Critical path scorecards",
    eyebrow: "Execution health",
    detail: "Five fast checks for whether the road still holds.",
    kind: "scorecards",
    data: [
      { name: "Access", value: 74 },
      { name: "Notice", value: 48 },
      { name: "Packing", value: 57 },
      { name: "Vendors", value: 62 },
    ],
  },
];

const logisticsVisuals: VisualSpec[] = [
  {
    id: "packing-progress",
    title: "Room-by-room packing",
    eyebrow: "Execution",
    detail: "Packing, fragile handling and setup readiness in one room grid.",
    kind: "stacked",
    size: "wide",
    data: packingRooms.map((room) => ({
      week: room.name,
      ready: room.packed,
      moving: room.fragile,
      blocked: room.setup,
      planned: Math.max(0, 100 - room.packed),
    })),
  },
  {
    id: "inventory-donut",
    title: "Inventory state",
    eyebrow: "Item flow",
    detail: "What is packed, pending, donated, sold or still undecided.",
    kind: "donut",
    data: [
      { name: "Packed", value: 46, color: flour },
      { name: "Pending", value: 26, color: blue },
      { name: "Donate", value: 12, color: mint },
      { name: "Sell", value: 9, color: amber },
      { name: "Decide", value: 7, color: rose },
    ],
  },
  {
    id: "vendor-score",
    title: "Vendor readiness score",
    eyebrow: "Mover shortlist",
    detail: "Balances availability, price, quality and confidence.",
    kind: "radar",
    data: [
      { axis: "Price", score: 71 },
      { axis: "Slots", score: 64 },
      { axis: "Reviews", score: 82 },
      { axis: "Insurance", score: 55 },
      { axis: "Speed", score: 69 },
      { axis: "Care", score: 76 },
    ],
  },
  {
    id: "utility-activation",
    title: "Service activation timeline",
    eyebrow: "Utilities",
    detail: "Activation status for internet, power, gas and admin services.",
    kind: "timeline",
    data: [
      { name: "Internet", start: 3, duration: 3, progress: 42 },
      { name: "Power", start: 2, duration: 2, progress: 64 },
      { name: "Gas", start: 4, duration: 2, progress: 28 },
      { name: "Locks", start: 5, duration: 1, progress: 18 },
    ],
  },
  {
    id: "truck-booking",
    title: "Truck booking score",
    eyebrow: "Day-of risk",
    detail: "Booking confidence by week as vendor decisions firm up.",
    kind: "line",
    data: weeks.map((week, index) => ({
      week,
      readiness: [18, 26, 34, 44, 57, 68, 76, 84, 88][index],
      risk: [62, 58, 54, 46, 39, 32, 24, 18, 16][index],
    })),
  },
  {
    id: "donation-pipeline",
    title: "Donate / sell / throw pipeline",
    eyebrow: "Declutter flow",
    detail: "Turns decluttering into visible progress instead of hidden work.",
    kind: "pipeline",
    size: "wide",
    data: [
      { name: "Sort", value: 72 },
      { name: "Donate", value: 48 },
      { name: "Sell", value: 36 },
      { name: "Recycle", value: 28 },
      { name: "Dispose", value: 22 },
    ],
  },
  {
    id: "setup-readiness",
    title: "Setup readiness curve",
    eyebrow: "First night",
    detail: "Tracks whether the first night will feel calm and functional.",
    kind: "area",
    data: readinessTrend.map((point) => ({
      week: point.week,
      readiness: Math.max(12, Number(point.readiness) - 10),
      risk: Math.max(8, Number(point.risk) - 12),
    })),
  },
  {
    id: "fragile-heatmap",
    title: "Fragile item heatmap",
    eyebrow: "Care load",
    detail: "Fragile packing pressure across rooms and time windows.",
    kind: "heatmap",
    data: heatmapDays.map((point, index) => ({ ...point, value: (Number(point.value) + index * 7) % 100 })),
  },
  {
    id: "execution-scorecards",
    title: "Execution scorecards",
    eyebrow: "Operational checks",
    detail: "Fast signals for the tasks that determine move-day quality.",
    kind: "scorecards",
    data: [
      { name: "Packing", value: 58 },
      { name: "Movers", value: 62 },
      { name: "Utilities", value: 44 },
      { name: "Inventory", value: 69 },
    ],
  },
  {
    id: "load-by-room",
    title: "Load by room",
    eyebrow: "Effort sizing",
    detail: "Compares item volume across rooms so effort can be staged.",
    kind: "bar",
    data: packingRooms.map((room) => ({ week: room.name, value: room.packed + room.fragile })),
  },
];

const visualsByTab: Record<TabId, VisualSpec[]> = {
  overview: overviewVisuals,
  budget: budgetVisuals,
  timeline: timelineVisuals,
  logistics: logisticsVisuals,
};

const chartCategoriesByTab: Record<TabId, ChartCategory[]> = {
  overview: [
    {
      id: "overview-health",
      eyebrow: "Health & momentum",
      title: "Move health system",
      description: "The high-level pulse: readiness, mission score, velocity and phase state.",
      visualIds: ["move-health", "mission-score", "momentum-line", "phase-state"],
    },
    {
      id: "overview-risk",
      eyebrow: "Risk & attention",
      title: "Where focus should go next",
      description: "Signals that show pressure points, energy load and the best windows for focused progress.",
      visualIds: ["critical-radar", "weekly-focus", "risk-donut", "completion-heatmap"],
    },
    {
      id: "overview-rewards",
      eyebrow: "Gamified journey",
      title: "Progress that feels earned",
      description: "Badges and challenges that reward real move-risk reduction, not empty activity.",
      visualIds: ["achievement-rail", "challenge-board"],
    },
  ],
  budget: [
    {
      id: "budget-control",
      eyebrow: "Spend control",
      title: "Burn, allocation and guardrails",
      description: "Core financial health for the move: cash curve, category mix, buffer and control scores.",
      visualIds: ["budget-burn", "category-donut", "cash-buffer", "budget-scorecards"],
    },
    {
      id: "budget-scenarios",
      eyebrow: "Scenario planning",
      title: "Sensitivity and decision tradeoffs",
      description: "The charts that explain what changes when overlap, hidden costs or deposit recovery shift.",
      visualIds: ["hidden-costs", "overlap-weeks", "deposit-recovery"],
    },
    {
      id: "budget-operations",
      eyebrow: "Payment operations",
      title: "Quotes, utilities and cash events",
      description: "Operational money moments that need decisions before they become stress.",
      visualIds: ["utility-map", "quote-comparison", "payment-timeline"],
    },
  ],
  timeline: [
    {
      id: "timeline-roadmap",
      eyebrow: "Roadmap",
      title: "Schedule structure and critical path",
      description: "Gantt, duration and buffer views that make the move sequence tangible.",
      visualIds: ["immersive-gantt", "phase-duration", "buffer-burn"],
    },
    {
      id: "timeline-readiness",
      eyebrow: "Readiness",
      title: "Preparedness and task maturity",
      description: "How readiness improves, where tasks are aging, and which windows need protection.",
      visualIds: ["readiness-trend", "task-aging", "milestone-heatmap"],
    },
    {
      id: "timeline-dependencies",
      eyebrow: "Dependencies",
      title: "Blockers, unlocks and execution gates",
      description: "Dependency views that connect blockers, milestone unlocks and critical path scorecards.",
      visualIds: ["dependency-radar", "blocker-donut", "unlock-pipeline", "critical-scorecards"],
    },
  ],
  logistics: [
    {
      id: "logistics-packing",
      eyebrow: "Packing & inventory",
      title: "Room-level execution",
      description: "Everything related to boxes, fragile items, room load and inventory state.",
      visualIds: ["packing-progress", "inventory-donut", "fragile-heatmap", "load-by-room"],
    },
    {
      id: "logistics-services",
      eyebrow: "Vendors & utilities",
      title: "External commitments",
      description: "Vendor confidence, booking risk and service activation before move day.",
      visualIds: ["vendor-score", "utility-activation", "truck-booking"],
    },
    {
      id: "logistics-readiness",
      eyebrow: "Execution readiness",
      title: "First-night and declutter pipeline",
      description: "The operational charts that make the final transition smoother and less cluttered.",
      visualIds: ["donation-pipeline", "setup-readiness", "execution-scorecards"],
    },
  ],
};

const tabOrder = Object.keys(tabMeta) as TabId[];

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="app-shell relative min-h-screen overflow-x-hidden text-[color:var(--text)] transition-colors duration-500">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,138,31,0.16),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(73,199,162,0.14),transparent_24%),linear-gradient(180deg,var(--canvas)_0%,var(--canvas-2)_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:56px_56px]" />

      <main className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-6 px-3 pb-16 pt-4 sm:px-5 lg:px-8 lg:pt-8">
        <PremiumHero theme={theme} onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))} />
        <MissionStrip />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-3 z-40"
          >
            <Card className="premium-surface p-2.5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <TabsList className="no-scrollbar grid h-auto w-full grid-cols-2 gap-1 overflow-x-auto rounded-[22px] border-0 bg-[color:var(--surface-raised)] p-1 shadow-inner sm:flex sm:w-auto">
                  {tabOrder.map((tab) => {
                    const Icon = tabMeta[tab].icon;
                    return (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="group min-h-11 gap-2 rounded-[18px] px-3 text-[color:var(--muted)] data-[state=active]:bg-[color:var(--text)] data-[state=active]:text-[color:var(--canvas)] data-[state=active]:shadow-[0_14px_32px_rgba(15,23,42,.18)] sm:px-4"
                      >
                        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                        <span className="whitespace-nowrap">{tabMeta[tab].label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--flour)]">
                      Active lens
                    </div>
                    <p className="mt-1 max-w-2xl text-sm font-semibold text-[color:var(--muted)]">
                      {tabMeta[activeTab].summary}
                    </p>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 text-[color:var(--flour)] sm:block" />
                </div>
              </div>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {tabOrder.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {activeTab === tab ? <DashboardTab tab={tab} /> : null}
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}

function PremiumHero({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="premium-hero group relative grid min-h-[560px] overflow-hidden rounded-[36px] border border-[color:var(--line)] bg-[linear-gradient(135deg,var(--hero-a),var(--hero-b))] p-5 shadow-[0_30px_90px_-40px_rgba(15,23,42,.45)] sm:p-7 lg:grid-cols-[1.08fr_.92fr] lg:p-9"
    >
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_22%_18%,rgba(255,138,31,.22),transparent_26%),radial-gradient(circle_at_74%_34%,rgba(99,120,255,.18),transparent_24%)]" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20" />

      <div className="relative z-10 flex flex-col justify-between gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-[rgba(255,138,31,.25)] bg-[rgba(255,138,31,.14)] text-[color:var(--flour)]">
              Mission control · {todayLabel}
            </Badge>
            <Badge className="border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--muted)]">
              Target {targetDate}
            </Badge>
          </div>

          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.04em] text-[color:var(--text-strong)] sm:text-6xl lg:text-7xl xl:text-8xl">
            Land the move like a calm, cinematic mission.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            A premium command center for turning contracts, packing, budget pressure and move-day logistics into one
            confident sequence. Every phase earns momentum, every blocker gets surfaced, and the path to move-in feels
            visible before it feels urgent.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-12 rounded-[18px] bg-[color:var(--flour)] px-5 font-bold text-white shadow-[0_18px_42px_rgba(255,138,31,.34)] hover:bg-[#ff9a3d]">
              <Sparkles className="h-4 w-4" />
              Continue mission
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onToggleTheme}
              className="h-12 rounded-[18px] border-[color:var(--line)] bg-[color:var(--surface-soft)] px-5 text-[color:var(--text)] hover:bg-[color:var(--surface)]"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "light" ? "Dark mode" : "Light mode"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <HeroSignal label="Move health" value="73/100" detail="stable with rising momentum" />
          <HeroSignal label="Next unlock" value="Keys + access" detail={executiveSummary.nextMilestone} />
          <HeroSignal label="Critical stack" value={`${criticalDependencies.length} dependencies`} detail="contract, access, notice" />
        </div>
      </div>

      <div className="relative z-10 mt-10 min-h-[420px] lg:mt-0">
        <HeroOrbital />
      </div>
    </motion.section>
  );
}

function HeroOrbital() {
  return (
    <motion.div
      whileHover={{ rotateX: 3, rotateY: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      className="hero-stage absolute inset-0 flex items-center justify-center [perspective:1200px]"
    >
      <motion.div
        animate={{ y: [0, -10, 0], rotateZ: [0, 1.4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-[380px] w-full max-w-[560px] [transform-style:preserve-3d]"
      >
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,138,31,.5),rgba(255,138,31,.08)_52%,transparent_70%)] blur-sm" />
        <div className="absolute right-[8%] top-[16%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(73,199,162,.28),rgba(99,120,255,.08)_58%,transparent_74%)]" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,.38)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[rgba(255,138,31,.36)]"
        />

        <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-[44px] border border-white/35 bg-[linear-gradient(145deg,rgba(255,255,255,.82),rgba(255,255,255,.34))] p-5 shadow-[0_28px_80px_rgba(15,23,42,.24)] backdrop-blur-2xl [transform:rotateX(58deg)_rotateZ(-18deg)] dark:border-white/12 dark:bg-[linear-gradient(145deg,rgba(30,41,59,.86),rgba(15,23,42,.38))]">
          <div className="grid h-full grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0.35, opacity: 0.45 }}
                animate={{ scaleY: [0.45, 1, 0.62], opacity: [0.55, 1, 0.72] }}
                transition={{ duration: 2.4, delay: index * 0.08, repeat: Infinity, repeatType: "mirror" }}
                className={cn(
                  "origin-bottom rounded-[14px] border border-white/50 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/10",
                  index === 4 && "bg-[color:var(--flour)] shadow-[0_12px_28px_rgba(255,138,31,.35)]",
                )}
              />
            ))}
          </div>
        </div>

        <FloatingChip className="left-[2%] top-[8%]" icon={KeyRound} label="Access" value="74%" />
        <FloatingChip className="right-[1%] top-[26%]" icon={Wallet2} label="Buffer" value="$620K" />
        <FloatingChip className="bottom-[8%] left-[13%]" icon={PackageCheck} label="Packing" value="58%" />
        <FloatingChip className="bottom-[2%] right-[9%]" icon={Trophy} label="Level" value="4" />
      </motion.div>
    </motion.div>
  );
}

function FloatingChip({
  className,
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute flex items-center gap-3 rounded-[22px] border border-white/50 bg-white/72 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/46",
        className,
      )}
    >
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[rgba(255,138,31,.14)] text-[color:var(--flour)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
          {label}
        </div>
        <div className="text-sm font-black text-[color:var(--text-strong)]">{value}</div>
      </div>
    </motion.div>
  );
}

function HeroSignal({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,.4)] backdrop-blur-xl"
    >
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--flour)]">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.03em] text-[color:var(--text-strong)]">{value}</div>
      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{detail}</p>
    </motion.div>
  );
}

function MissionStrip() {
  return (
    <AnimatedSection className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="premium-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="eyebrow text-[color:var(--flour)]">Gamified mission progress</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[color:var(--text-strong)]">
              Level 4: access runway unlocked
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              Points are awarded for decisions that reduce uncertainty: locking access, protecting budget, packing high-risk rooms and clearing dependencies.
            </p>
          </div>
          <div className="min-w-[260px]">
            <div className="flex items-end justify-between">
              <span className="text-sm font-bold text-[color:var(--muted)]">1,840 / 2,600 pts</span>
              <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[color:var(--flour)]">next level</span>
            </div>
            <ProgressBar value={71} className="mt-3 h-4" />
          </div>
        </div>
      </Card>

      <Card className="premium-surface grid gap-3 p-4 sm:grid-cols-2">
        {missionBadges.slice(0, 2).map((badge) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.title}
              whileHover={{ y: -4 }}
              className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[18px] bg-[rgba(255,138,31,.14)] text-[color:var(--flour)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-[color:var(--text-strong)]">{badge.title}</div>
                  <div className="text-xs font-bold text-[color:var(--muted)]">{badge.level}</div>
                </div>
              </div>
              <ProgressBar value={badge.progress} className="mt-4 h-2" />
            </motion.div>
          );
        })}
      </Card>
    </AnimatedSection>
  );
}

function DashboardTab({ tab }: { tab: TabId }) {
  const visuals = visualsByTab[tab];
  const visualMap = new Map(visuals.map((visual) => [visual.id, visual]));
  const Icon = tabMeta[tab].icon;

  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      <AnimatedSection className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
        <Card className="premium-surface overflow-hidden p-6">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[rgba(255,138,31,.16)] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-[color:var(--flour)] text-white shadow-[0_18px_38px_rgba(255,138,31,.28)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="eyebrow text-[color:var(--flour)]">{tabMeta[tab].label}</div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[color:var(--text-strong)]">
                  {tab === "overview" && "Your move, scored like a living system."}
                  {tab === "budget" && "Cash control without losing calm."}
                  {tab === "timeline" && "Every dependency has a visible lane."}
                  {tab === "logistics" && "Execution feels lighter when it is mapped."}
                </h2>
              </div>
            </div>
            <p className="mt-5 text-base leading-7 text-[color:var(--muted)]">{tabMeta[tab].summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniKpi label="Charts" value="10+" icon={Layers3} />
              <MiniKpi label="Motion" value="Live" icon={Zap} />
              <MiniKpi label="Focus" value={tab === "budget" ? "$5.3M" : tab === "timeline" ? "8 phases" : tab === "logistics" ? "5 rooms" : "73/100"} icon={Target} />
            </div>
          </div>
        </Card>

        {tab === "timeline" ? <RoadmapGantt /> : <FeaturePanel tab={tab} />}
      </AnimatedSection>

      <div className="flex flex-col gap-8">
        {chartCategoriesByTab[tab].map((category, categoryIndex) => (
          <ChartCategorySection
            key={category.id}
            category={category}
            categoryIndex={categoryIndex}
            visuals={category.visualIds.flatMap((visualId) => {
              const visual = visualMap.get(visualId);
              return visual ? [visual] : [];
            })}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ChartCategorySection({
  category,
  categoryIndex,
  visuals,
}: {
  category: ChartCategory;
  categoryIndex: number;
  visuals: VisualSpec[];
}) {
  return (
    <AnimatedSection className="chart-category">
      <div className="category-heading">
        <div>
          <div className="eyebrow text-[color:var(--flour)]">{category.eyebrow}</div>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--text-strong)] sm:text-3xl">
            {category.title}
          </h3>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-[color:var(--muted)] sm:text-base">
          {category.description}
        </p>
      </div>

      <div className="dashboard-grid mt-4">
        {visuals.map((visual, index) => (
          <VisualizationCard
            key={visual.id}
            visual={visual}
            index={categoryIndex * 4 + index}
          />
        ))}
      </div>
    </AnimatedSection>
  );
}

function FeaturePanel({ tab }: { tab: TabId }) {
  if (tab === "budget") {
    return (
      <Card className="premium-surface p-5">
        <PanelHeader icon={Wallet2} eyebrow="Budget cockpit" title="The spend curve is under control, but overlap timing is the lever." />
        <div className="mt-6 h-[280px]">
          <BudgetChart />
        </div>
      </Card>
    );
  }

  if (tab === "logistics") {
    return (
      <Card className="premium-surface p-5">
        <PanelHeader icon={Boxes} eyebrow="Execution cockpit" title="Packing progress is healthy; utilities and fragile inventory need attention." />
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {packingRooms.map((room) => (
            <motion.div
              key={room.name}
              whileHover={{ y: -5 }}
              className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4"
            >
              <div className="text-sm font-black text-[color:var(--text-strong)]">{room.name}</div>
              <ProgressBar value={room.packed} className="mt-4 h-2" />
              <div className="mt-3 text-xs font-bold text-[color:var(--muted)]">{room.packed}% packed</div>
            </motion.div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="premium-surface p-5">
      <PanelHeader icon={Gauge} eyebrow="Health cockpit" title="Readiness is rising; risk falls fastest once access and notice are sequenced." />
      <div className="mt-6 h-[280px]">
        <ReadinessChart />
      </div>
    </Card>
  );
}

function RoadmapGantt() {
  return (
    <Card className="premium-surface overflow-hidden p-5">
      <PanelHeader icon={Route} eyebrow="Roadmap / Gantt" title="The critical path runs through decision, keys, notice, painting and packing." />
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-9 gap-1 pl-20 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {weeks.map((week) => (
            <span key={week}>{week.replace(" ", "\n")}</span>
          ))}
        </div>
        <div className="space-y-3">
          {movePhases.map((phase, index) => {
            const left = `${(phase.startWeek / 9) * 100}%`;
            const width = `${(Math.max(1, phase.endWeek - phase.startWeek + 1) / 9) * 100}%`;
            const isCritical = phase.status === "critical" || phase.status === "blocked" || phase.risk === "high";
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group grid grid-cols-[72px_1fr] items-center gap-3"
              >
                <div className="truncate text-xs font-black text-[color:var(--text-strong)]">F{phase.number} {phase.shortTitle}</div>
                <div className="relative h-12 overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-raised)]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.75, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "absolute inset-y-1 origin-left rounded-[15px] bg-gradient-to-r shadow-[0_14px_32px_rgba(15,23,42,.16)]",
                      isCritical ? "from-[rgba(255,138,31,.95)] to-[rgba(255,111,126,.82)]" : "from-[rgba(73,199,162,.9)] to-[rgba(99,120,255,.78)]",
                    )}
                    style={{ left, width }}
                  >
                    <div className="flex h-full items-center justify-between px-3 text-xs font-black text-white">
                      <span>{statusMeta[phase.status].label}</span>
                      <span>{phase.progress}%</span>
                    </div>
                  </motion.div>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_calc(11.11%-1px),rgba(148,163,184,.16)_calc(11.11%-1px),rgba(148,163,184,.16)_11.11%)] bg-[length:11.11%_100%]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function VisualizationCard({ visual, index }: { visual: VisualSpec; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -7, scale: 1.01 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.48, delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className={cn("premium-surface chart-card p-5", visual.size === "wide" && "lg:col-span-2", visual.size === "tall" && "lg:row-span-2")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow text-[color:var(--flour)]">{visual.eyebrow}</div>
          <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[color:var(--text-strong)]">{visual.title}</h3>
        </div>
        {visual.metric ? (
          <div className="rounded-[18px] border border-[rgba(255,138,31,.24)] bg-[rgba(255,138,31,.12)] px-3 py-2 text-right">
            <AnimatedNumber value={visual.metric} />
          </div>
        ) : null}
      </div>
      <p className="mt-3 min-h-[44px] text-sm leading-6 text-[color:var(--muted)]">{visual.detail}</p>
      <div className="mt-5 h-[230px]">
        <ChartRenderer visual={visual} />
      </div>
    </motion.article>
  );
}

function ChartRenderer({ visual }: { visual: VisualSpec }) {
  switch (visual.kind) {
    case "area":
      return <ReadinessChart data={visual.data} />;
    case "line":
      return <LinePulse data={visual.data} />;
    case "bar":
      return <SimpleBar data={visual.data} />;
    case "stacked":
      return <StackedBars data={visual.data} />;
    case "donut":
      return <Donut data={visual.data} />;
    case "radar":
      return <RadarPulse data={visual.data} />;
    case "radial":
      return <RadialProgress data={visual.data} />;
    case "heatmap":
      return <Heatmap data={visual.data} />;
    case "waterfall":
      return <Waterfall data={visual.data} />;
    case "timeline":
      return <MiniTimeline data={visual.data} />;
    case "scorecards":
      return <Scorecards data={visual.data} />;
    case "pipeline":
      return <Pipeline data={visual.data} />;
    default:
      return null;
  }
}

function ReadinessChart({ data = readinessTrend }: { data?: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="readinessGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={flour} stopOpacity={0.42} />
            <stop offset="100%" stopColor={flour} stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="riskGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={blue} stopOpacity={0.24} />
            <stop offset="100%" stopColor={blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: flour, strokeOpacity: 0.24 }} />
        <Area type="monotone" dataKey="readiness" stroke={flour} fill="url(#readinessGradient)" strokeWidth={3} animationDuration={1100} />
        <Area type="monotone" dataKey="risk" stroke={blue} fill="url(#riskGradient)" strokeWidth={2} animationDuration={1300} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BudgetChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={budgetBurn} margin={{ left: -18, right: 12, top: 10 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Area dataKey="buffer" fill="rgba(73,199,162,.16)" stroke={mint} strokeWidth={2} animationDuration={1100} />
        <Bar dataKey="planned" fill="rgba(99,120,255,.42)" radius={[10, 10, 4, 4]} animationDuration={900} />
        <Line dataKey="actual" stroke={flour} strokeWidth={3} dot={false} animationDuration={1200} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function LinePulse({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: -18, right: 12, top: 12 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="readiness" stroke={flour} strokeWidth={3} dot={{ r: 3, fill: flour }} animationDuration={1200} />
        <Line type="monotone" dataKey="risk" stroke={blue} strokeWidth={2} dot={false} animationDuration={1400} />
        <Line type="monotone" dataKey="momentum" stroke={mint} strokeWidth={2} dot={false} animationDuration={1600} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SimpleBar({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,138,31,.08)" }} />
        <Bar dataKey="value" radius={[14, 14, 6, 6]} fill={flour} maxBarSize={44} animationDuration={1000}>
          {data.map((_, index) => (
            <Cell key={index} fill={[flour, blue, mint, amber, rose, violet][index % 6]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function StackedBars({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }} />
        <Bar dataKey="ready" stackId="a" fill={mint} radius={[0, 0, 6, 6]} animationDuration={850} />
        <Bar dataKey="moving" stackId="a" fill={flour} animationDuration={1000} />
        <Bar dataKey="blocked" stackId="a" fill={rose} animationDuration={1150} />
        <Bar dataKey="planned" stackId="a" fill={blue} radius={[10, 10, 0, 0]} animationDuration={1300} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ChartTooltip />} />
        <Pie data={data} innerRadius="62%" outerRadius="88%" paddingAngle={4} dataKey="value" nameKey="name" animationDuration={1100}>
          {data.map((entry, index) => (
            <Cell key={index} fill={String(entry.color ?? [flour, blue, mint, amber, rose, violet][index % 6])} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function RadarPulse({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="74%">
        <PolarGrid stroke="var(--chart-grid)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} />
        <PolarRadiusAxis angle={90} tick={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Radar dataKey="score" stroke={flour} fill={flour} fillOpacity={0.28} strokeWidth={3} animationDuration={1200} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function RadialProgress({ data }: { data: VisualSpec["data"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart innerRadius="64%" outerRadius="92%" data={data} startAngle={90} endAngle={-270}>
        <RadialBar dataKey="value" cornerRadius={18} fill={flour} background={{ fill: "var(--track)" }} animationDuration={1300} />
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-[color:var(--text-strong)] text-4xl font-black">
          {data[0]?.value}%
        </text>
        <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle" className="fill-[color:var(--muted)] text-xs font-bold uppercase tracking-[0.2em]">
          complete
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

function Heatmap({ data }: { data: VisualSpec["data"] }) {
  const slots = ["AM", "Mid", "PM"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="grid h-full grid-cols-[36px_1fr] gap-3">
      <div className="grid grid-rows-3 pt-7 text-right text-[11px] font-bold text-[color:var(--muted)]">
        {slots.map((slot) => (
          <span key={slot}>{slot}</span>
        ))}
      </div>
      <div className="grid grid-rows-[24px_1fr] gap-3">
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[color:var(--muted)]">
          {days.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-3 gap-2">
          {data.map((point, index) => {
            const value = Number(point.value);
            return (
              <motion.div
                key={`${point.day}-${point.slot}-${index}`}
                initial={{ opacity: 0, scale: 0.78 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.015 }}
                className="rounded-[12px] border border-white/20"
                style={{
                  background: `linear-gradient(135deg, rgba(255,138,31,${0.12 + value / 145}), rgba(99,120,255,${0.08 + value / 220}))`,
                  boxShadow: value > 70 ? "0 12px 30px rgba(255,138,31,.18)" : undefined,
                }}
                title={`${point.day} ${point.slot}: ${value}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Waterfall({ data }: { data: VisualSpec["data"] }) {
  const max = Math.max(...data.map((item) => Number(item.value)));
  return (
    <div className="flex h-full items-end gap-3">
      {data.map((item, index) => {
        const height = (Number(item.value) / max) * 100;
        return (
          <div key={String(item.name)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${height}%` }}
              whileHover={{ y: -5 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-[18px] bg-gradient-to-b from-[color:var(--flour)] to-[rgba(255,138,31,.34)] shadow-[0_16px_30px_rgba(255,138,31,.18)]"
            />
            <div className="text-center text-[11px] font-black text-[color:var(--muted)]">{String(item.name)}</div>
          </div>
        );
      })}
    </div>
  );
}

function MiniTimeline({ data }: { data: VisualSpec["data"] }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {data.map((item, index) => {
        const left = `${(Number(item.start ?? 0) / 9) * 100}%`;
        const width = `${(Number(item.duration ?? 1) / 9) * 100}%`;
        return (
          <div key={String(item.name ?? item.title)} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <div className="truncate text-xs font-black text-[color:var(--muted)]">{String(item.name ?? item.title)}</div>
            <div className="relative h-7 rounded-full bg-[color:var(--surface-raised)]">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                whileHover={{ scaleY: 1.18 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: index * 0.05 }}
                className="absolute inset-y-1 origin-left rounded-full bg-gradient-to-r from-[color:var(--flour)] to-[rgba(73,199,162,.92)]"
                style={{ left, width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Scorecards({ data }: { data: VisualSpec["data"] }) {
  return (
    <div className="grid h-full content-center gap-3 sm:grid-cols-2">
      {data.map((item, index) => (
        <motion.div
          key={String(item.name)}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[color:var(--text-strong)]">{String(item.name)}</span>
            <span className="text-xl font-black text-[color:var(--flour)]">{Number(item.value)}</span>
          </div>
          <ProgressBar value={Number(item.value)} className="mt-4 h-2" />
        </motion.div>
      ))}
    </div>
  );
}

function Pipeline({ data }: { data: VisualSpec["data"] }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {data.map((item, index) => (
        <div key={String(item.name)} className="grid grid-cols-[minmax(92px,140px)_1fr_48px] items-center gap-3">
          <div className="truncate text-sm font-black text-[color:var(--text-strong)]">{String(item.name)}</div>
          <ProgressBar value={Number(item.value)} delay={index * 0.05} className="h-3" />
          <div className="text-right text-xs font-black text-[color:var(--muted)]">{Number(item.value)}%</div>
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | string; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,.22)] backdrop-blur-xl">
      <div className="text-sm font-black text-[color:var(--text-strong)]">{label ?? String(payload[0]?.payload?.name ?? "")}</div>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={String(item.name)} className="flex items-center justify-between gap-6 text-xs font-bold text-[color:var(--muted)]">
            <span>{item.name}</span>
            <span className="text-[color:var(--text-strong)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({ icon: Icon, eyebrow, title }: { icon: LucideIcon; eyebrow: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-[rgba(255,138,31,.14)] text-[color:var(--flour)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="eyebrow text-[color:var(--flour)]">{eyebrow}</div>
        <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[color:var(--text-strong)]">{title}</h3>
      </div>
    </div>
  );
}

function MiniKpi({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <Icon className="h-4 w-4 text-[color:var(--flour)]" />
      <div className="mt-3 text-2xl font-black text-[color:var(--text-strong)]">{value}</div>
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: string }) {
  return <div className="text-xl font-black tracking-[-0.03em] text-[color:var(--flour)]">{value}</div>;
}

function ProgressBar({ value, className, delay = 0 }: { value: number; className?: string; delay?: number }) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-[color:var(--track)]", className)}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-[color:var(--flour)] via-[#ffb155] to-[rgba(73,199,162,.95)] shadow-[0_10px_24px_rgba(255,138,31,.22)]"
      />
    </div>
  );
}

function AnimatedSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default App;
