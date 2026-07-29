"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminAccessGate } from "@/components/admin/access-gate";
import { AdminAuthScreen } from "@/components/admin/auth-screen";
import { adminPageSlideTransition } from "@/components/admin/page-transition";

type AdminLoginFlowProps = {
  hasAccess: boolean;
  homeHref: string;
  redirectTo: string;
};

export function AdminLoginFlow({
  hasAccess,
  homeHref,
  redirectTo,
}: AdminLoginFlowProps) {
  const router = useRouter();
  const [showGate, setShowGate] = useState(!hasAccess);

  return (
    <div className="relative min-h-svh overflow-hidden bg-white">
      <AdminAuthScreen
        homeHref={homeHref}
        onAuthenticated={() => {
          // No router.refresh() here: it re-requests the route we are leaving,
          // which now redirects, and Next escalates that to a full document
          // navigation — taking the exit animation with it. Both admin routes
          // are dynamic, so replace() already fetches them fresh.
          router.replace(redirectTo);
        }}
      />

      <AnimatePresence>
        {showGate ? (
          <motion.div
            key="access-gate"
            className="fixed inset-0 z-30 bg-white"
            initial={false}
            exit={{ y: "-100%" }}
            transition={adminPageSlideTransition}
          >
            <AdminAccessGate onSuccess={() => setShowGate(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
