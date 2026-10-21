export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    try {
      input.select();
      if (!document.execCommand("copy")) {
        throw new Error("Clipboard write failed");
      }
    } finally {
      input.remove();
    }
  }
}
