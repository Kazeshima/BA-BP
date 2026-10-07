import { memo, useState } from "react";
import { studentImage } from "../../lib/schaledb";
import type { Student } from "../../types";

/** Student portrait with a graceful text fallback when the image can't load. */
export const Portrait = memo(function Portrait({ student }: { student: Pick<Student, "id" | "name"> }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="portrait-fallback">{student.name}</div>;
  return (
    <img
      className="portrait"
      src={studentImage(student.id)}
      alt={student.name}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
});
