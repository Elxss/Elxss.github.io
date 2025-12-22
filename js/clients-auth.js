function createCookie(name, value, seconds) {
    let expires = '';
    if (seconds) {
      let date = new Date();
      date.setTime(date.getTime() + (seconds * 1000));
      expires = '; expires=' + date.toUTCString();
    } else {
      expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=None; Secure`;
  }  

async function getClientInfo() {
// nothing here my friend
}
  
async function run() {
    await getClientInfo();
    createCookie("Auth", "1", "900")
}

if (window.location.pathname === '/index.html' || window.location.pathname === '/' || window.location.pathname === '') {
    console.log("TEST , TEST , Your are landing on the index page ! 🚀")
    if (document.cookie.includes('Visitor')) {
        console.log("You are not a new visitor 👨🏽‍🍳")
    } else {
        console.log("You are a new visitor 👨🏽‍🍳 ")
        createCookie("Visitor", "1")
    }

    if (!document.cookie.includes('Auth')) {
        console.log("Auth cookie not detected, cooking some for ya 👨🏽‍🍳")
        run();
        console.log("Here they are, delicious ( they won't be good in 15 minutes, eat them fast! ) :)🍪")
    } else {
        console.log("Auth Cookie present, 🍪 Miam :) ")
    }
    
} else {
    console.log(window.location.pathname);
    run();
    setTimeout(function() {window.location.href = "index.html";}, 4000);
}
