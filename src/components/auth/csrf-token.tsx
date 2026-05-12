"use client";

import { getCsrfToken } from "next-auth/react";
import { useEffect, useState } from "react";

export function CSRFToken() {
  const [token, setToken] = useState("");
  useEffect(() => {
    getCsrfToken().then((t) => setToken(t || ""));
  }, []);
  return <input type="hidden" name="csrfToken" value={token} />;
}
