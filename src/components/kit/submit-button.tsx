"use client";

import { Button } from "@/components/ui/button";

// Standard form submit: disabled while submitting with a busy label
// (UI standard: buttons disabled while submitting).
export function SubmitButton({
  isSubmitting,
  children,
  busyLabel = "Saving…",
  ...props
}: React.ComponentProps<typeof Button> & {
  isSubmitting: boolean;
  busyLabel?: string;
}) {
  return (
    <Button type="submit" disabled={isSubmitting} {...props}>
      {isSubmitting ? busyLabel : children}
    </Button>
  );
}
