function CopyToClipboard(where) {
    var popup = document.getElementById(where);

    popup.classList.remove("hide");

    popup.classList.add("show");

    var popupValue = popup.getAttribute("value");

    var temp = document.createElement("textarea");
    temp.style.position = "absolute";
    temp.style.left = "-1000px";
    temp.style.top = "-1000px";
    temp.value = popupValue;
    document.body.appendChild(temp);

    temp.select();
    temp.setSelectionRange(0, 99999);

    try {
        document.execCommand('copy');
        console.log('📋 Text Copied: ' + popupValue);
    } catch (err) {
        console.log('Oops, unable to copy', err);
    }

    document.body.removeChild(temp);

    setTimeout(function() {
        popup.classList.remove("show");
        popup.classList.add("hide");

        setTimeout(() => popup.classList.remove("hide"), 500);
    }, 1500);
}