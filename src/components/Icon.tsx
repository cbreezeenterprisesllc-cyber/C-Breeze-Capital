import React from "react";

// ═══════════════════════════════════════════════════════════════
// GreenExpress Premium Icon System
// Replaces all emoji with consistent, brand-colored SVG icons.
// All icons use the design system's CSS variable tokens for theming.
// ═══════════════════════════════════════════════════════════════

type IconName =
  | "leaf"
  | "rocket"
  | "shield"
  | "cart"
  | "package"
  | "star"
  | "check"
  | "clipboard"
  | "chart"
  | "money"
  | "phone"
  | "car"
  | "id-card"
  | "camera"
  | "lightbulb"
  | "celebration"
  | "cross"
  | "search"
  | "clock"
  | "shop"
  | "dollars"
  | "target"
  | "heart"
  | "age"
  | "trash"
  | "chef"
  | "person"
  | "pencil"
  | "medal"
  | "truck"
  | "settings"
  | "chat"
  | "arrow-right"
  | "arrow-down";

function IconSVG({ name, size = 24 }: { name: IconName; size?: number }) {
  const s = size;
  switch (name) {
    // ── Leaf (premium, multi-tone) ──────────────────────────
    case "leaf":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-500)" />
              <stop offset="50%" stopColor="var(--color-primary-700)" />
              <stop offset="100%" stopColor="var(--color-primary-900)" />
            </linearGradient>
            <linearGradient id="leafVein" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-primary-400)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-primary-300)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M36 4C28 4 14 12 8 22C4 28 4 36 6 40C8 42 12 44 24 44C32 44 40 40 44 34C46 30 46 26 44 22C42 18 38 16 34 14L36 4Z" fill="url(#leafGrad)" opacity="0.9"/>
          <path d="M22 12C20 16 18 22 18 28C18 32 20 36 22 38" stroke="url(#leafVein)" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M28 10C27 14 26 20 27 26C28 30 30 34 32 36" stroke="url(#leafVein)" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M34 8C33 12 33 18 34 24" stroke="var(--color-primary-300)" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
        </svg>
      );

    // ── Rocket (delivery speed) ──────────────────────────────
    case "rocket":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-amber-500)" />
              <stop offset="100%" stopColor="var(--color-amber-700)" />
            </linearGradient>
          </defs>
          <path d="M24 6L30 14H18L24 6Z" fill="url(#rocketBody)" />
          <rect x="20" y="14" width="8" height="16" rx="3" fill="url(#rocketBody)" />
          <path d="M19 26L14 34H11L13 26H19Z" fill="var(--color-amber-600)" />
          <path d="M29 26L34 34H37L35 26H29Z" fill="var(--color-amber-600)" />
          <path d="M24 30L26 40H22L24 30Z" fill="var(--color-amber-300)" />
          <path d="M20 14H28V18H20V14Z" fill="var(--color-primary-700)" />
          <circle cx="24" cy="22" r="2.5" fill="var(--color-primary-900)" />
        </svg>
      );

    // ── Shield (safety/compliance) ───────────────────────────
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-400)" />
              <stop offset="100%" stopColor="var(--color-primary-700)" />
            </linearGradient>
          </defs>
          <path d="M24 4L6 11V26C6 34 14 42 24 45C34 42 42 34 42 26V11L24 4Z" fill="url(#shieldGrad)" />
          <path d="M20 25L23 28L30 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Cart ─────────────────────────────────────────────────
    case "cart":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8H9L16 34H38L44 16H14" stroke="var(--color-primary-700)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="18" cy="41" r="3" fill="var(--color-primary-600)" />
          <circle cx="36" cy="41" r="3" fill="var(--color-primary-600)" />
          <path d="M14 16L18 12L32 12L34 16" stroke="var(--color-primary-700)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Package (orders) ─────────────────────────────────────
    case "package":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4L6 12V36L24 44L42 36V12L24 4Z" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinejoin="round" fill="var(--color-primary-100)" />
          <path d="M24 4V44" stroke="var(--color-primary-600)" strokeWidth="2" />
          <path d="M6 12L24 20L42 12" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinejoin="round" fill="none" />
          <path d="M16 28L24 32L32 28" stroke="var(--color-primary-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Star (rating) ────────────────────────────────────────
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 6L29.6 18.2L42 20L33 29.6L35.6 42L24 35.2L12.4 42L15 29.6L6 20L18.4 18.2L24 6Z" fill="var(--color-amber-500)" />
        </svg>
      );

    // ── Check (verified) ─────────────────────────────────────
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" fill="var(--color-success)" />
          <path d="M16 24L22 30L33 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Clipboard (orders/documents) ─────────────────────────
    case "clipboard":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="6" width="28" height="38" rx="4" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-surface-primary)" />
          <rect x="16" y="3" width="16" height="8" rx="2" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-100)" />
          <line x1="16" y1="20" x2="32" y2="20" stroke="var(--color-primary-300)" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="26" x2="28" y2="26" stroke="var(--color-primary-300)" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="32" x2="24" y2="32" stroke="var(--color-primary-300)" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="38" x2="30" y2="38" stroke="var(--color-primary-300)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // ── Chart (analytics) ────────────────────────────────────
    case "chart":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="40" height="36" rx="4" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-surface-primary)" />
          <rect x="10" y="28" width="6" height="8" rx="1" fill="var(--color-primary-500)" />
          <rect x="21" y="20" width="6" height="16" rx="1" fill="var(--color-primary-500)" />
          <rect x="32" y="12" width="6" height="24" rx="1" fill="var(--color-primary-500)" />
        </svg>
      );

    // ── Money (revenue) ─────────────────────────────────────
    case "money":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-success)/10" />
          <text x="24" y="28" textAnchor="middle" fontFamily="var(--font-heading)" fontSize="18" fontWeight="700" fill="var(--color-primary-700)">$</text>
        </svg>
      );

    // ── Phone ────────────────────────────────────────────────
    case "phone":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="4" width="28" height="40" rx="5" stroke="var(--color-primary-500)" strokeWidth="2.5" fill="var(--color-primary-50)" />
          <rect x="18" y="8" width="12" height="4" rx="2" fill="var(--color-primary-200)" />
          <circle cx="24" cy="38" r="2" fill="var(--color-primary-400)" />
        </svg>
      );

    // ── Car (delivery vehicle) ──────────────────────────────
    case "car":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 26L10 16H38L42 26V36H6V26Z" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinejoin="round" fill="var(--color-primary-50)" />
          <rect x="10" y="14" width="8" height="4" rx="1" stroke="var(--color-primary-400)" strokeWidth="1.5" fill="none" />
          <circle cx="14" cy="36" r="4" stroke="var(--color-neutral-600)" strokeWidth="2" fill="var(--color-neutral-200)" />
          <circle cx="34" cy="36" r="4" stroke="var(--color-neutral-600)" strokeWidth="2" fill="var(--color-neutral-200)" />
        </svg>
      );

    // ── ID Card ──────────────────────────────────────────────
    case "id-card":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="32" rx="4" stroke="var(--color-primary-500)" strokeWidth="2" fill="var(--color-surface-primary)" />
          <rect x="8" y="14" width="12" height="16" rx="2" fill="var(--color-primary-100)" />
          <circle cx="14" cy="20" r="3" fill="var(--color-primary-400)" />
          <rect x="24" y="16" width="16" height="3" rx="1" fill="var(--color-primary-200)" />
          <rect x="24" y="22" width="12" height="3" rx="1" fill="var(--color-primary-200)" />
          <rect x="24" y="28" width="14" height="3" rx="1" fill="var(--color-primary-200)" />
        </svg>
      );

    // ── Camera ──────────────────────────────────────────────
    case "camera":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="14" width="36" height="24" rx="4" stroke="var(--color-primary-500)" strokeWidth="2" fill="var(--color-surface-primary)" />
          <rect x="16" y="10" width="16" height="6" rx="2" stroke="var(--color-primary-500)" strokeWidth="2" fill="var(--color-primary-50)" />
          <circle cx="24" cy="26" r="7" stroke="var(--color-primary-400)" strokeWidth="2" fill="none" />
          <circle cx="24" cy="26" r="2" fill="var(--color-primary-500)" />
        </svg>
      );

    // ── Lightbulb (tip/insight) ──────────────────────────────
    case "lightbulb":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 42V38H30V42H18Z" fill="var(--color-neutral-300)" />
          <path d="M20 38V26C20 26 14 22 14 17C14 11 18 8 24 8C30 8 34 11 34 17C34 22 28 26 28 26V38H20Z" stroke="var(--color-amber-500)" strokeWidth="2" fill="var(--color-amber-500)/10" />
          <path d="M20 22H28" stroke="var(--color-amber-300)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // ── Celebration (success) ────────────────────────────────
    case "celebration":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="18" fill="var(--color-success)" />
          <path d="M16 22L21 28L32 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="14" r="2" fill="var(--color-amber-400)" />
          <circle cx="38" cy="12" r="2.5" fill="var(--color-amber-400)" />
          <circle cx="10" cy="36" r="1.5" fill="var(--color-primary-300)" />
          <circle cx="40" cy="34" r="2" fill="var(--color-primary-300)" />
        </svg>
      );

    // ── Cross (error/cancel) ─────────────────────────────────
    case "cross":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" fill="var(--color-error)" />
          <path d="M16 16L32 32M32 16L16 32" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );

    // ── Search ───────────────────────────────────────────────
    case "search":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="12" stroke="var(--color-primary-600)" strokeWidth="2.5" fill="none" />
          <path d="M31 31L42 42" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    // ── Clock (pending/waiting) ──────────────────────────────
    case "clock":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="var(--color-amber-500)" strokeWidth="2.5" fill="var(--color-amber-500)/10" />
          <path d="M24 14V24L30 30" stroke="var(--color-amber-600)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    // ── Shop (dispensary) ────────────────────────────────────
    case "shop":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 42H42V28H6V42Z" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-50)" />
          <path d="M6 28L10 12H38L42 28" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinejoin="round" fill="var(--color-primary-100)" />
          <rect x="18" y="30" width="12" height="8" rx="1" stroke="var(--color-primary-400)" strokeWidth="1.5" fill="none" />
          <rect x="10" y="42" width="4" height="6" fill="var(--color-primary-200)" />
          <rect x="34" y="42" width="4" height="6" fill="var(--color-primary-200)" />
        </svg>
      );

    // ── Dollars (earnings) ──────────────────────────────────
    case "dollars":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="var(--color-success)" strokeWidth="2.5" fill="var(--color-success)/10" />
          <text x="24" y="30" textAnchor="middle" fontFamily="var(--font-heading)" fontSize="22" fontWeight="800" fill="var(--color-success)">$</text>
        </svg>
      );

    // ── Target ──────────────────────────────────────────────
    case "target":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="var(--color-primary-300)" strokeWidth="2" fill="none" />
          <circle cx="24" cy="24" r="12" stroke="var(--color-primary-500)" strokeWidth="2" fill="none" />
          <circle cx="24" cy="24" r="4" fill="var(--color-amber-500)" />
        </svg>
      );

    // ── Heart (green heart for plant/care) ──────────────────
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 40C24 40 6 28 6 18C6 12 12 8 17 8C21 8 24 11 24 11C24 11 27 8 31 8C36 8 42 12 42 18C42 28 24 40 24 40Z" fill="var(--color-primary-500)" />
        </svg>
      );

    // ── Age (21+ verification) ──────────────────────────────
    case "age":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="var(--color-primary-700)" strokeWidth="2.5" fill="var(--color-primary-50)" />
          <text x="24" y="30" textAnchor="middle" fontFamily="var(--font-heading)" fontSize="20" fontWeight="800" fill="var(--color-primary-700)">21+</text>
        </svg>
      );

    // ── Trash (delete) ──────────────────────────────────────
    case "trash":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12H38" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 12V8C16 6 18 5 20 5H28C30 5 32 6 32 8V12" stroke="var(--color-error)" strokeWidth="2" fill="none" />
          <rect x="14" y="12" width="20" height="32" rx="3" stroke="var(--color-error)" strokeWidth="2" fill="var(--color-error)/10" />
          <line x1="20" y1="20" x2="20" y2="36" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="24" y1="20" x2="24" y2="36" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="28" y1="20" x2="28" y2="36" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    // ── Chef (preparing) ────────────────────────────────────
    case "chef":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="16" r="10" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-100)" />
          <path d="M14 28C14 28 18 38 24 38C30 38 34 28 34 28" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-50)" />
          <circle cx="24" cy="20" r="2" fill="var(--color-primary-500)" />
          <circle cx="20" cy="22" r="1.5" fill="var(--color-primary-400)" />
          <circle cx="28" cy="22" r="1.5" fill="var(--color-primary-400)" />
        </svg>
      );

    // ── Person ──────────────────────────────────────────────
    case "person":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="14" r="8" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-100)" />
          <path d="M8 42C8 34 16 28 24 28C32 28 40 34 40 42" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    // ── Pencil (edit/notes) ─────────────────────────────────
    case "pencil":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 6L40 14L16 38H8V30L32 6Z" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinejoin="round" fill="var(--color-primary-50)" />
          <path d="M28 10L36 18" stroke="var(--color-primary-600)" strokeWidth="2" />
        </svg>
      );

    // ── Medal (best/top) ────────────────────────────────────
    case "medal":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="22" r="14" stroke="var(--color-amber-500)" strokeWidth="2.5" fill="var(--color-amber-500)/15" />
          <text x="24" y="27" textAnchor="middle" fontFamily="var(--font-heading)" fontSize="16" fontWeight="800" fill="var(--color-amber-600)">1</text>
          <rect x="18" y="36" width="12" height="8" rx="2" fill="var(--color-amber-300)" />
          <rect x="16" y="44" width="16" height="4" rx="1" fill="var(--color-amber-400)" />
        </svg>
      );

    // ── Truck (delivery) ────────────────────────────────────
    case "truck":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="16" width="30" height="20" rx="3" stroke="var(--color-primary-600)" strokeWidth="2.5" fill="var(--color-primary-50)" />
          <rect x="34" y="10" width="12" height="26" rx="3" stroke="var(--color-primary-600)" strokeWidth="2.5" fill="var(--color-primary-100)" />
          <circle cx="14" cy="38" r="4" stroke="var(--color-neutral-600)" strokeWidth="2" fill="var(--color-neutral-200)" />
          <circle cx="38" cy="38" r="4" stroke="var(--color-neutral-600)" strokeWidth="2" fill="var(--color-neutral-200)" />
        </svg>
      );

    // ── Settings (document) ─────────────────────────────────
    case "settings":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4H28L38 14V42C38 44 36 46 34 46H14C12 46 10 44 10 42V8C10 6 12 4 14 4Z" stroke="var(--color-primary-500)" strokeWidth="2" fill="var(--color-surface-primary)" />
          <path d="M28 4V14H38" stroke="var(--color-primary-500)" strokeWidth="2" fill="none" />
          <rect x="16" y="20" width="16" height="3" rx="1" fill="var(--color-primary-200)" />
          <rect x="16" y="26" width="12" height="3" rx="1" fill="var(--color-primary-200)" />
          <rect x="16" y="32" width="14" height="3" rx="1" fill="var(--color-primary-200)" />
        </svg>
      );

    // ── Arrow Right ──────────────────────────────────────────
    case "arrow-right":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 8L34 24L16 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Arrow Down ──────────────────────────────────────────
    case "arrow-down":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 16L24 34L40 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // ── Chat (messaging bubble) ──────────────────────────────
    case "chat":
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12C6 9.8 7.8 8 10 8H38C40.2 8 42 9.8 42 12V30C42 32.2 40.2 34 38 34H22L12 42V34H10C7.8 34 6 32.2 6 30V12Z" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinejoin="round" fill="var(--color-primary-50)" />
          <circle cx="16" cy="21" r="2" fill="var(--color-primary-600)" />
          <circle cx="24" cy="21" r="2" fill="var(--color-primary-600)" />
          <circle cx="32" cy="21" r="2" fill="var(--color-primary-600)" />
        </svg>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Icon Component (convenience wrapper)
// Usage: <Icon name="leaf" size={24} className="animate-float" />
// ═══════════════════════════════════════════════════════════════
interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <span className={className} style={{ display: "inline-flex", lineHeight: 0 }}>
      <IconSVG name={name} size={size} />
    </span>
  );
}

export type { IconName };
