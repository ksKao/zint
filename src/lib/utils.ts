import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
  });
}

export function base64ToFile(base64String: string, fileName: string): File {
  const [metadata, base64Data] = base64String.split(",");

  const mimeType = metadata.split(":")[1].split(";")[0];

  const byteCharacters = atob(base64Data); // atob decodes the base64 string
  const byteArrays = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArrays], { type: mimeType });

  const file = new File([blob], fileName, { type: mimeType });

  return file;
}

export function getDateAtMidnight(date: Date = new Date()) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);

  return clone;
}
