console.log("[blur.js] loading")

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("backgroundVideo");

    // Ajoute une fonction globale accessible depuis la console
    window.toggleBlur = function() {
    video.classList.toggle("blur");
    console.log("Blur toggled:", video.classList.contains("blur"));
    };

    document.getElementById("toggle-blur").addEventListener("click", ()=>toggleBlur());
});