// Dynamically load icon font
export const loadIcons = () => {
  // Check if already loaded
  if (document.getElementById("material-symbols-font")) {
    return;
  }

  const link = document.createElement("link");
  link.id = "material-symbols-font";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";

  // Add to head at the beginning for higher priority
  document.head.insertBefore(link, document.head.firstChild);
};
