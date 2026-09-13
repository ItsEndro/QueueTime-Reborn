// ===============================
// Spotify Queue Remaining Time
// ===============================

// Your original working selectors
const QUEUE_WRAPPER_SELECTOR =
    '#queue-panel .V9r36EbBOckW5QPa:nth-of-type(2) .vdNj5Kuby0wJApMc';

const QUEUE_HEADER_SELECTOR =
    '#queue-panel .V9r36EbBOckW5QPa:nth-of-type(2) h2[data-encore-id="text"]';

const FULLPAGE_HEADER_SELECTOR =
    '.queue-queuePage-header';

const ALL_SELECTORS =
    `${QUEUE_HEADER_SELECTOR}, ${FULLPAGE_HEADER_SELECTOR}`;


// ===============================
// CSS
// ===============================

document.getElementById("queue-time-style")?.remove();

const qt_style = document.createElement("style");
qt_style.id = "queue-time-style";

qt_style.innerHTML = `
${QUEUE_WRAPPER_SELECTOR},
${FULLPAGE_HEADER_SELECTOR} {
    position: relative;
}

${QUEUE_HEADER_SELECTOR}::after,
${FULLPAGE_HEADER_SELECTOR}::after {
    content: var(--queue-remaining);
    color: var(--spice-subtext);
    font-size: 1rem;
    position: absolute;
    bottom: ;
    right: -20px;
    font-weight: initial;
}

${QUEUE_HEADER_SELECTOR}::after {
    top: 7px;
}
`;

document.head.appendChild(qt_style);


// ===============================
// Formatting
// ===============================

function formatRemaining(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));

    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;
}


// ===============================
// Track helpers
// ===============================

function isRealTrack(track) {
    const uri = track?.contextTrack?.uri;

    return typeof uri === "string" &&
           uri.startsWith("spotify:track:");
}

function getTrackDuration(track) {
    const duration = Number(
        track?.contextTrack?.metadata?.duration
    );

    return Number.isFinite(duration) ? duration : 0;
}


// ===============================
// Calculate remaining playlist tracks
// ===============================

function getRemainingPlaylistTracks() {

    const metadata =
        Spicetify.Player.data?.context?.metadata;

    const totalTracks =
        Number(metadata?.playlist_number_of_tracks);

    const currentIndex =
        Number(Spicetify.Player.data?.index?.itemIndex);

    if (!Number.isFinite(totalTracks) ||
        !Number.isFinite(currentIndex)) {
        return [];
    }

    // Example:
    // total = 114
    // current index = 112
    //
    // 114 - 112 - 1 = 1 track remaining

    const remainingCount =
        Math.max(0, totalTracks - currentIndex - 1);

    const queue =
        Spicetify.Queue?.nextTracks ?? [];

    // Remove Spotify delimiters first
    const realTracks =
        queue.filter(isRealTrack);

    // Only take the number of tracks that
    // actually remain in the playlist
    return realTracks.slice(0, remainingCount);
}


// ===============================
// Update timer
// ===============================

function updateTimer() {

    const headers =
        document.querySelectorAll(ALL_SELECTORS);

    if (!headers.length) {
        return;
    }

    const currentDuration =
        Number(Spicetify.Player.getDuration());

    const currentProgress =
        Number(Spicetify.Player.getProgress());

    const currentRemaining =
        Math.max(
            0,
            currentDuration - currentProgress
        );

    const remainingTracks =
        getRemainingPlaylistTracks();

    const upcomingTime =
        remainingTracks.reduce(
            (total, track) =>
                total + getTrackDuration(track),
            0
        );

    const totalRemaining =
        currentRemaining + upcomingTime;

    const formatted =
        formatRemaining(totalRemaining);

    headers.forEach(header => {
        header.style.setProperty(
            "--queue-remaining",
            `"${formatted}"`
        );
    });
}


// ===============================
// Prevent duplicate timers
// ===============================

if (window.__queueRemainingTimer) {
    clearInterval(window.__queueRemainingTimer);
}

window.__queueRemainingTimer =
    setInterval(updateTimer, 1000);


// Initial update
updateTimer();
