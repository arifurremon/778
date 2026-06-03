"use client";

import { authStyles } from "@/lib/design/auth-styles";

interface AuthDividerProps {
  label: string;
}

export default function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div className={authStyles.dividerWrap}>
      <div className={authStyles.dividerLine}>
        <span className={authStyles.dividerBorder} />
      </div>
      <div className={authStyles.dividerLabel}>
        <span className={authStyles.dividerLabelBg}>{label}</span>
      </div>
    </div>
  );
}
