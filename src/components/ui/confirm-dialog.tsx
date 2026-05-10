"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { Button } from "./button";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => Promise<any>;
  formData?: Record<string, string>;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  action,
  formData = {},
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(formData)) fd.append(k, v);
    startTransition(async () => {
      await action(fd);
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-full max-w-sm bg-white rounded-xl shadow-2xl p-6"
          )}
        >
          <div className="flex gap-4">
            <div
              className={cn(
                "flex-shrink-0 size-10 rounded-full flex items-center justify-center",
                variant === "danger" ? "bg-red-50" : "bg-amber-50"
              )}
            >
              <AlertTriangle
                size={18}
                className={variant === "danger" ? "text-red-600" : "text-amber-600"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <RadixDialog.Title className="text-base font-semibold text-gray-900">
                {title}
              </RadixDialog.Title>
              <RadixDialog.Description className="mt-1 text-sm text-gray-500">
                {description}
              </RadixDialog.Description>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <RadixDialog.Close asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </RadixDialog.Close>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              loading={isPending}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
