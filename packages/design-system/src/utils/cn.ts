import { clsx, type ClassValue } from "clsx";

/** Compose class names. Thin wrapper over clsx for internal DS composition. */
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}
