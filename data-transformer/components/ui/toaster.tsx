"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider data-oid="-ijwozk">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} data-oid="i4aa-ep">
            <div className="grid gap-1" data-oid="90zu:76">
              {title && <ToastTitle data-oid="m:7a:th">{title}</ToastTitle>}
              {description && (
                <ToastDescription data-oid="w57txks">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose data-oid="79weabi" />
          </Toast>
        );
      })}
      <ToastViewport data-oid=":w_f0mi" />
    </ToastProvider>
  );
}
