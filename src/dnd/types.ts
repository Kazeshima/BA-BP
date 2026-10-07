import type { DragSource, DropTarget, StudentId } from "../types";

export interface DragData {
  studentId: StudentId;
  source: DragSource;
}

export interface DropData {
  target: DropTarget;
}
