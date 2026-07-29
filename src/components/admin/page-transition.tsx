"use client";

import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export const adminPageSlideTransition = {
  duration: 1.05,
  ease: [0.22, 1, 0.36, 1] as const,
};

function usePreviousValue<T>(value: T): T | undefined {
  const previous = useRef<T | undefined>(undefined);

  useEffect(() => {
    previous.current = value;
    return () => {
      previous.current = undefined;
    };
  });

  return previous.current;
}

/**
 * Keep the departing route's LayoutRouterContext frozen while AnimatePresence
 * runs its exit animation — otherwise App Router swaps the tree mid-flight.
 * Pattern: https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const previousContext = usePreviousValue(context) ?? null;
  const segment = useSelectedLayoutSegment();
  const previousSegment = usePreviousValue(segment);
  const changed =
    segment !== previousSegment &&
    segment !== undefined &&
    previousSegment !== undefined;

  return (
    <LayoutRouterContext.Provider value={changed ? previousContext : context}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

function getAdminPhase(segment: string | null) {
  return segment === "login" ? "login" : "workspace";
}

const AdminPageFrame = forwardRef<
  HTMLDivElement,
  Readonly<{ children: ReactNode }>
>(function AdminPageFrame({ children }, ref) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      ref={ref}
      className="relative min-h-svh bg-background"
      style={{ zIndex: isPresent ? 0 : 1 }}
      initial={false}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={adminPageSlideTransition}
    >
      <FrozenRouter>{children}</FrozenRouter>
    </motion.div>
  );
});

export function AdminPageTransition({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const phase = getAdminPhase(segment);

  return (
    <div className="relative min-h-svh overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <AdminPageFrame key={phase}>{children}</AdminPageFrame>
      </AnimatePresence>
    </div>
  );
}
