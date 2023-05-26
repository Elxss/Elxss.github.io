var icons = ["src/img/ninja.png", "src/img/mechanic.png", "src/img/cook.png","src/img/pilot.png","src/img/solder.png","src/img/spacianaut.png"];
    
// Définir l'intervalle de temps entre chaque changement d'icône (en millisecondes)
var interval = 2500; // 1 seconde

// Obtenir l'élément d'icône de la page
var icon = document.getElementById("icon");

// Définir une variable pour suivre l'index de l'image actuelle
var currentIcon = 0;

// Définir une fonction pour changer l'icône de la page
function changeIcon() {
  // Changer l'attribut src de l'élément d'icône avec l'image actuelle
  icon.setAttribute("href", icons[currentIcon]);

  // Incrémenter l'index de l'image actuelle
  currentIcon++;

  // Si l'index dépasse la longueur de la liste d'images, réinitialiser l'index à 0
  if (currentIcon >= icons.length) {
    currentIcon = 0;
  }
}

// Appeler la fonction changeIcon à intervalles réguliers définis par la variable interval
setInterval(changeIcon, interval);