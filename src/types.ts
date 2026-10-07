export type StudentId = number;
export type Side = "attacker" | "defender";
export type BanSide = Side | "shared";
export type SquadType = "Main" | "Support";
export type TacticRole = "DamageDealer" | "Tanker" | "Healer" | "Supporter" | "Vehicle";

export interface Student {
  id: StudentId;
  name: string;
  devName: string;
  school: string;
  squadType: SquadType;
  role: TacticRole;
  star: number;
  bullet: string;
  armor: string;
  /** Release flags by server: [JP, Global, CN]. */
  released: [boolean, boolean, boolean];
  tags: string[];
}

export type Slot = StudentId | null;

/** Address of a single slot on the board. */
export type SlotRef =
  | { zone: "ban"; side: BanSide; index: number }
  | { zone: "pick"; side: Side; index: number }
  | { zone: "protected"; index: number };

/** Where a dragged student came from. "pool" = roster grid, free panel or archive. */
export type DragSource = { kind: "pool" } | { kind: "slot"; slot: SlotRef };

/** Where a student was dropped. "pool" = back onto the roster, i.e. remove from the slot. */
export type DropTarget = { kind: "slot"; slot: SlotRef } | { kind: "pool" };

export interface Board {
  bans: Record<BanSide, Slot[]>;
  /** Always 6 per side. In 4+2 mode, 0–3 are main slots and 4–5 support slots. */
  picks: Record<Side, Slot[]>;
  /** Students in protected slots can never be banned. */
  protected: Slot[];
}

export const SIDES: readonly Side[] = ["attacker", "defender"];
export const BAN_SIDES: readonly BanSide[] = ["attacker", "shared", "defender"];
export const PICK_SLOTS = 6;
export const MAIN_SLOTS = 4;
export const PROTECTED_SLOTS = 4;
export const MAX_SIDE_BANS = 10;
export const MAX_SHARED_BANS = 80;
