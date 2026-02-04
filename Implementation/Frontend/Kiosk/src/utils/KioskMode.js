/**
 * Kiosk Mode Utility
 * Disables keyboard input, text selection, and other interactions
 * for a true kiosk experience on Raspberry Pi
 */

export const enableKioskMode = () => {
  window.addEventListener("DOMContentLoaded", () => {
    // Disable all keyboard events
    ["keydown", "keyup", "keypress"].forEach((event) => {
      document.addEventListener(
        event,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        },
        true
      );
    });

    // Disable context menu (right-click)
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });

    // Disable drag and drop
    document.addEventListener("dragstart", (e) => {
      e.preventDefault();
      return false;
    });

    // Disable text selection via mouse
    document.addEventListener("selectstart", (e) => {
      e.preventDefault();
      return false;
    });

    // Disable copy/paste shortcuts
    document.addEventListener("copy", (e) => {
      e.preventDefault();
      return false;
    });

    document.addEventListener("cut", (e) => {
      e.preventDefault();
      return false;
    });

    document.addEventListener("paste", (e) => {
      e.preventDefault();
      return false;
    });
  });
};
