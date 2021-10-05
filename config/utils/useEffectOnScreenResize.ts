import { useEffect } from "react";

type Args = {
  onResize: (newMediaWidth: number) => void;
};

export const getCurrMediaWidth = (): number =>
  window?.innerWidth ??
  document?.documentElement?.clientWidth ??
  document?.body?.clientWidth ??
  0;

export function useEffectOnScreenResize({ onResize }: Args): void {
  useEffect((): void => {
    window.addEventListener("resize", (): void => {
      onResize(getCurrMediaWidth());
    });
  }, []);
}
