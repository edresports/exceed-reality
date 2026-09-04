document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const copyButton = document.getElementById("copy-code");
  const code = document.getElementById("discount-code");
  const message = document.getElementById("copy-message");

  if (copyButton && code && message) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        message.textContent = "Code copied: EDRWIN";
        copyButton.textContent = "COPIED!";
        setTimeout(() => {
          message.textContent = "";
          copyButton.textContent = "COPY CODE";
        }, 2200);
      } catch {
        message.textContent = "Copy failed. Please copy EDRWIN manually.";
      }
    });
  }
});
