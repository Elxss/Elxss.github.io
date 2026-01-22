
console.log("[televeision.js] televeision.js loading...");

document.addEventListener("DOMContentLoaded", async () => {

    console.log("[televeision.js] televeision.js loaded !");

    async function fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
    
        try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } finally {
            clearTimeout(id);
        }
    }
    

    // --- CONFIGURATION ---
    const CHANNELS_INDEX_URL = window.location.href + "channels_index.json"; // do not add a "/" before the filemane because its going to break the loading of the channels

    // === Utilitaires ===
    function ProgressBar(filledChar, emptyChar, totalLength, currentValue) {
        const filled = Math.round(totalLength * currentValue);
        const empty = totalLength - filled;
        return filledChar.repeat(filled) + emptyChar.repeat(empty);
    }

    function formatTime(seconds) {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    }

    // async function loadMarkdownAsHTML(url) {
    //     try {
    //         const res = await fetch(url);
    //         if (!res.ok) throw new Error(`HTTP ${res.status}`);
    //         const text = await res.text();
    //         const md = window.markdownit({
    //             html: true,
    //             linkify: true,
    //             breaks: true,
    //             typographer: true
    //         });
    //         return md.render(text);
    //     } catch (err) {
    //         console.error("[televeision.js] Markdown load error:", err);
    //         return `<p style="color:red;">Erreur de chargement : ${err.message}</p>`;
    //     }
    // }

    function createChannelContainers(channelsCount) {
        const content = document.querySelector(
            "html body div.television-support div.content"
        );
        if (!content) {
            console.error("[televeision.js] .content not found");
            return;
        }
    
        for (let i = 1; i < channelsCount; i++) {
            if (document.getElementById(`ch${i}`)) continue;
    
            const div = document.createElement("div");
            div.id = `ch${i}`;
            div.className = "hide_when_loaded_channel";
            div.style.display = "none";
    
            content.appendChild(div);
            console.log(`[televeision.js] ADDED ch${i}`);
        }
    }
    

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    

    async function loadMarkdownAsHTML(url, retries = 5, delay = 250) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
                const text = await res.text();
                const md = window.markdownit({
                    html: true,
                    linkify: true,
                    breaks: true,
                    typographer: true
                });
    
                return md.render(text);
    
            } catch (err) {
                console.warn(
                    `[televeision.js] Markdown load failed (attempt ${attempt}/${retries})`, err
                );
    
                if (attempt === retries) {
                    return `<p style="color:red;">
                        Erreur de chargement Markdown après ${retries} tentatives<br>
                        ${err.message}
                    </p>`;
                }
    
                await sleep(delay);
            }
        }
    }
        

    // --- DATE ---
    const today = new Date();

    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const parts = formattedDate.split(' ');
    const formattedWithComma = `${parts[0]}, ${parts[1]} ${parts[2]}`;
    document.getElementById('today_date').innerText = formattedWithComma;

    // === INIT TBL ===
    let ChannelTitle = [
        "CHANNEL 0 - MENU",
    ];

    let ChannelVideoTitle = [
        ["Main Menu", "#"],
    ];

    let ChannelVideoSource = [
        "./assets/vhs1.mp4",
    ];

    // === INIT DOM SELECTION ===
    let ChannelVideoIndex = 0;
    let CurrentVolume = 100;

    const VolumeLength = 15;
    const videoElement = document.getElementById('backgroundVideo');
    const sourceElement = document.getElementById('videoSource');
    const channelSpan = document.getElementById('channel');
    const maxChannels = document.getElementById('max_channels');
    const channelTitleElem = document.getElementById('ch_title');
    const mutedIndicator = document.getElementById('muted');
    const ChannelVideoTitleSelector = document.getElementById('background_video_title');
    const Volh1 = document.getElementById('vol');
    const Volbar = document.getElementById('vol_bar');
    const desktopGrid = document.querySelectorAll(".desktop-icons");
    const blurredIndicator = document.getElementById('blurred');

    let blurBlinkInterval;
    let blinkInterval;
    let volumeTimeout;

    // === GESTION DES CANAUX ===
    function showChannel(index) {
        for (let i = 0; i < ChannelVideoSource.length; i++) {
            const ch = document.getElementById('ch' + i);
            if (ch) ch.style.display = 'none';
        }

        const currentCh = document.getElementById('ch' + index);

        if (currentCh) currentCh.style.display = 'block';

        document.getElementById('logo').style.display = index === 0 ? 'block' : 'none';

        desktopGrid.forEach(grid => {
            grid.style.display = index === 0 ? 'block' : 'none';
        });
    }

    function changeVideoSource(index) {
        if (index >= 0 && index < ChannelVideoSource.length) {
            sourceElement.src = ChannelVideoSource[index];
            videoElement.load();
            videoElement.play();

            channelSpan.innerText = index;
            channelTitleElem.innerText = ChannelTitle[index];
            ChannelVideoTitleSelector.innerText = ChannelVideoTitle[index][0];
            ChannelVideoTitleSelector.setAttribute("href", ChannelVideoTitle[index][1]);

            console.log("[televeision.js] Current channel: " + index);
            showChannel(index);
        }
    }

    // === BLINKING / MUTE / VOLUME ===
    function startBlinking() {
        if (blinkInterval) return;
        let visible = true;
        mutedIndicator.classList.add("active");
        blinkInterval = setInterval(() => {
            mutedIndicator.classList.toggle("active", !visible);
            visible = !visible;
        }, 750);
    }

    function stopBlinking() {
        clearInterval(blinkInterval);
        blinkInterval = null;
        mutedIndicator.classList.remove("active");
    }

    function startBlurBlinking() {
        if (blurBlinkInterval) return;
        let visible = true;
        blurredIndicator.classList.add("active");
        blurBlinkInterval = setInterval(() => {
            blurredIndicator.classList.toggle("active", !visible);
            visible = !visible;
        }, 750);
    }

    function stopBlurBlinking() {
        clearInterval(blurBlinkInterval);
        blurBlinkInterval = null;
        blurredIndicator.classList.remove("active");
    }

    document.getElementById('toggle-blur').addEventListener('click', () => {
        if (blurBlinkInterval) stopBlurBlinking();
        else startBlurBlinking();
        console.log("Blur blinking toggled:", !!blurBlinkInterval);
    });

    function increaseVolume(amount = 5) {
        if (videoElement.muted) {
            videoElement.muted = false;
            stopBlinking();
        }
        CurrentVolume = Math.min(CurrentVolume + amount, 100);
        showVolumeTemporarily();
    }

    function decreaseVolume(amount = 10) {
        if (videoElement.muted) {
            videoElement.muted = false;
            stopBlinking();
        }
        CurrentVolume = Math.max(CurrentVolume - amount, 0);
        showVolumeTemporarily();
    }

    function showVolumeTemporarily() {
        const normalizedVolume = CurrentVolume / 100;
        Volbar.textContent = ProgressBar("|", "-", VolumeLength, normalizedVolume);
        videoElement.volume = normalizedVolume;
        if (volumeTimeout) clearTimeout(volumeTimeout);
        Volh1.classList.add("active");
        volumeTimeout = setTimeout(() => {
            Volh1.classList.remove("active");
            volumeTimeout = null;
            if (videoElement.muted) startBlinking();
        }, 2000);
    }

    // === EVENTS ===
    document.getElementById('power_remote').addEventListener('click', () => {
        changeVideoSource(0);
        console.log("[televeision.js] Stop button pressed!");
    });

    document.getElementById("mute_remote").addEventListener("click", () => {
        videoElement.muted = !videoElement.muted;
        videoElement.muted ? startBlinking() : stopBlinking();
        console.log(`[televeision.js] ${videoElement.muted ? "Muted" : "Unmuted"}!`);
    });

    function setupBlockRemote(selector, plusAction, minusAction) {
        const block = document.querySelector(selector);
        const top = block.querySelector(".top_remote");
        const bottom = block.querySelector(".bottom_remote");

        top.addEventListener("mousedown", () => {
            top.classList.add("active");
            if (selector === ".ch_remote") {
                ChannelVideoIndex = (ChannelVideoIndex + 1) % ChannelVideoSource.length;
                changeVideoSource(ChannelVideoIndex);
            } else if (selector === ".vol_remote") {
                increaseVolume();
            }

            console.log(plusAction);
        });

        top.addEventListener("mouseup", () => top.classList.remove("active"));
        bottom.addEventListener("mousedown", () => {
            bottom.classList.add("active");
            if (selector === ".ch_remote") {
                ChannelVideoIndex = (ChannelVideoIndex - 1 + ChannelVideoSource.length) % ChannelVideoSource.length;
                changeVideoSource(ChannelVideoIndex);
            } else if (selector === ".vol_remote") {
                decreaseVolume();
            }

            console.log(minusAction);
        });
        bottom.addEventListener("mouseup", () => bottom.classList.remove("active"));
    }

    setupBlockRemote(".vol_remote", "Volume +", "Volume -");
    setupBlockRemote(".ch_remote", "Chaîne +", "Chaîne -");

    videoElement.addEventListener('timeupdate', () => {
        const playedTimeSpan = document.getElementById('played_time');
        const totalTimeSpan = document.getElementById('total_time');

        const currentTime = Math.floor(videoElement.currentTime);
        const duration = Math.floor(videoElement.duration);

        playedTimeSpan.innerText = formatTime(currentTime);
        totalTimeSpan.innerText = formatTime(duration);
    });

    // === CHANNELS LOADING ===
    async function loadDynamicChannels() {
        console.log("[televeision.js] Loading dynamic channels...");
        try {
            const res = await fetch(CHANNELS_INDEX_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const channels = await res.json();

            for (let i = 1; i < channels.length; i++) {

                createChannelContainers(channels.length);//ICI channels.length

                const ch = channels[i];
                ChannelTitle.push(ch.title || `CHANNEL ${i} - TITLE`);
                ChannelVideoTitle.push([ch.videoTitle || "Untitled", ch.videoLink || "#"]);
                ChannelVideoSource.push(ch.videoSource || "./assets/vhs1.mp4");

                const chElem = document.getElementById(`ch${i}`);
                if (chElem) {
                    if (ch.markdown) {
                        chElem.innerHTML = await loadMarkdownAsHTML(ch.markdown);
                    } else if (ch.html) {
                        chElem.innerHTML = ch.html;
                    } else {
                        chElem.innerHTML = "<p>No content available</p>";
                    }
                }
            }

            maxChannels.innerText = ChannelVideoSource.length - 1;
            console.log("[televeision.js] Dynamic channels loaded:", ChannelVideoSource.length);

        } catch (err) {
            console.error("[televeision.js] Failed to load dynamic channels:", err);
        }
    }

    await loadDynamicChannels();

    // and voila
    startBlinking();
    changeVideoSource(0);
});
