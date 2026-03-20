"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster 
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#171717",
          color: "#fff",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10b981", // Emerald 500
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
