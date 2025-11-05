export async function loadPartials({ header = false, footer = false } = {}) {
  try {
    if (header) {
      const headerRes = await fetch("/src/js/views/partials/header.html");
      if (!headerRes.ok) throw new Error("Error cargando header");
      document.getElementById("header-container").innerHTML = await headerRes.text();

      const logo = document.querySelector(".app-logo");
      if (logo) {
        logo.addEventListener("click", () => {
          window.location.href = "/index.html";
        });
      }
    }

    if (footer) {
      const footerRes = await fetch("/src/js/views/partials/footer.html");
      if (!footerRes.ok) throw new Error("Error cargando footer");
      document.getElementById("footer-container").innerHTML = await footerRes.text();
    }

  } catch (err) {
    console.error("❌ Error al cargar partials:", err);
  }
}
