import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(number, precision = 2) {
  if (number === undefined || number === null) return "0.00";

  const preciseValue = Number(number).toFixed(precision);
  const [integerPart, fractionalPart] = preciseValue.split(".");
  const formattedIntegerPart = Number(integerPart).toLocaleString();

  if (fractionalPart) {
    return `${formattedIntegerPart}.${fractionalPart}`;
  }
  return formattedIntegerPart;
}
