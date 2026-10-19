console.log("[remote.js] loading")

document.addEventListener("DOMContentLoaded", () => {
    // Numéros
    document.querySelectorAll(".num").forEach(btn => {
        btn.addEventListener("click", () => console.log("Chaîne " + btn.textContent));
    });

    // Fonction pour les blocs VOL / CH
    function setupBlockRemote(selector, plusAction, minusAction) {
        const block = document.querySelector(selector);
        const top = block.querySelector(".top_remote");
        const bottom = block.querySelector(".bottom_remote");

        // Clic sur le haut
        top.addEventListener("mousedown", () => {
            top.classList.add("active");
            console.log(plusAction);
        });
        top.addEventListener("mouseup", () => top.classList.remove("active"));
        top.addEventListener("mouseleave", () => top.classList.remove("active"));

        // Clic sur le bas
        bottom.addEventListener("mousedown", () => {
            bottom.classList.add("active");
            console.log(minusAction);
        });
        bottom.addEventListener("mouseup", () => bottom.classList.remove("active"));
        bottom.addEventListener("mouseleave", () => bottom.classList.remove("active"));
    }

    setupBlockRemote(".vol_remote", "Volume +", "Volume -");
    setupBlockRemote(".ch_remote", "Chaîne +", "Chaîne -");
});
