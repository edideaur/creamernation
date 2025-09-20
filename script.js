document.addEventListener('DOMContentLoaded', () => {

    const releasesGrid = document.getElementById('releases-grid');
    const playerModal = document.getElementById('player-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalAlbumImg = document.getElementById('modal-album-img');
    const modalTitle = document.getElementById('modal-title');
    const modalArtist = document.getElementById('modal-artist');
    const modalCatalog = document.getElementById('modal-catalog');
    const modalTracklist = document.getElementById('modal-tracklist');
    const modalLinks = document.getElementById('modal-links');
    const audioPlayer = document.getElementById('audio-player');
    const nowPlayingBar = document.getElementById('now-playing-bar');
    const playerArtImg = document.getElementById('player-art-img');
    const playerTrackTitle = document.getElementById('player-track-title');
    const playerTrackArtist = document.getElementById('player-track-artist');
    const prevBtn = document.getElementById('prev-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const progressBar = document.getElementById('progress-bar');
    const progressBarContainer = document.getElementById('progress-bar-container');

    const VISIBLE_CLASS = 'visible';
    const PLAYING_CLASS = 'playing';
    const ARTIST_NAME = 'CREAMER NATION';
    const releasesMap = new Map();
    const originalTitle = document.title;
    let playlist = [];
    let currentTrackIndex = -1;

    const createReleaseElement = (release) => {
        const releaseElement = document.createElement('div');
        releaseElement.className = 'release-item';
        releaseElement.dataset.releaseId = release.id;
        releaseElement.setAttribute('role', 'button');
        releaseElement.setAttribute('tabindex', '0');
        releaseElement.innerHTML = `
            <img src="${release.imageUrl}" alt="Album cover for ${release.title}" loading="lazy" decoding="async">
            <h3>${release.title}</h3>
            <p>${release.catalogInfo}</p>
        `;
        return releaseElement;
    };

    const populateModal = (release) => {
        playerModal.dataset.releaseId = release.id;
        modalAlbumImg.src = release.imageUrl;
        modalAlbumImg.alt = `Album cover for ${release.title}`;
        modalTitle.textContent = release.title;
        modalArtist.textContent = ARTIST_NAME;
        modalCatalog.textContent = release.catalogInfo;

        const tracklistFragment = document.createDocumentFragment();
        release.tracklist.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.trackIndex = index;
            li.setAttribute('role', 'button');
            li.setAttribute('tabindex', '0');
            const trackNumber = document.createElement('span');
            trackNumber.className = 'track-number';
            trackNumber.textContent = `${String(index + 1).padStart(2, '0')}.`;
            const trackName = document.createElement('span');
            trackName.className = 'track-name';
            trackName.textContent = track;
            li.append(trackNumber, trackName);
            tracklistFragment.appendChild(li);
        });
        modalTracklist.replaceChildren(tracklistFragment);

        const linksFragment = document.createDocumentFragment();
        Object.entries(release.links).forEach(([platform, url]) => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = platform.toUpperCase();
            linksFragment.appendChild(link);
        });
        modalLinks.replaceChildren(linksFragment);
        updateTrackHighlight();
    };

    const openModal = (releaseId) => {
        const release = releasesMap.get(releaseId);
        if (!release) return;
        nowPlayingBar.dataset.album = release.title;
        populateModal(release);
        playerModal.classList.add(VISIBLE_CLASS);
        playerModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        playerModal.classList.remove(VISIBLE_CLASS);
        playerModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const loadReleases = async () => {
        try {
            const response = await fetch('./releases.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const releasesData = await response.json();
            if (!releasesData || releasesData.length === 0) {
                releasesGrid.textContent = 'No tapes found.';
                return;
            }
            const fragment = document.createDocumentFragment();
            releasesData.forEach(release => {
                releasesMap.set(release.id, release);
                fragment.appendChild(createReleaseElement(release));
            });
            releasesGrid.replaceChildren(fragment);
        } catch (error) {
            console.error("Failed to load releases:", error);
            releasesGrid.textContent = 'Error loading tapes. Please try again later.';
        }
    };

    const formatTime = (seconds) => {
        const value = isFinite(seconds) ? Math.floor(seconds) : 0;
        const minutes = Math.floor(value / 60);
        const secs = value % 60;
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    };

    const updateProgress = () => {
        const { duration, currentTime } = audioPlayer;
        const progressPercent = (currentTime / duration) * 100 || 0;
        progressBar.style.transform = `scaleX(${progressPercent / 100})`;
        currentTimeEl.textContent = formatTime(currentTime);
        totalDurationEl.textContent = formatTime(duration);
    };

    const setProgress = (e) => {
        const { duration } = audioPlayer;
        if (!isFinite(duration)) return;
        const width = progressBarContainer.clientWidth;
        const clickX = e.offsetX;
        audioPlayer.currentTime = (clickX / width) * duration;
    };

    const updatePlayerUI = (isPlaying) => {
        if (currentTrackIndex < 0 || playlist.length === 0) return;
        const track = playlist[currentTrackIndex];
        const release = releasesMap.get(track.releaseId);
        if (!release) return;
    
        if (playerArtImg.src !== release.imageUrl) {
            playerArtImg.src = release.imageUrl;
        }
        playerTrackTitle.textContent = track.title;
        // --- THIS IS THE ONLY LINE THAT CHANGED ---
        playerTrackArtist.textContent = `${ARTIST_NAME}`;
        // ------------------------------------------
        document.title = isPlaying ? `${track.title} - ${ARTIST_NAME}` : originalTitle;
        playPauseBtn.classList.toggle(PLAYING_CLASS, isPlaying);
        playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        updateTrackHighlight();
    
        // --- START: MODIFICATION FOR WEB SCROBBLER ---
        const playerBar = document.getElementById('now-playing-bar');
        let scrobblerAlbumEl = document.getElementById('web-scrobbler-album');
        if (!scrobblerAlbumEl) {
            scrobblerAlbumEl = document.createElement('span');
            scrobblerAlbumEl.id = 'web-scrobbler-album';
            scrobblerAlbumEl.style.display = 'none';
            playerBar.appendChild(scrobblerAlbumEl);
        }
        scrobblerAlbumEl.textContent = release.title;
        window.dispatchEvent(new Event('web-scrobbler:state-changed'));
        // --- END: MODIFICATION FOR WEB SCROBBLER ---
    };

    const updateTrackHighlight = () => {
        if (!playerModal.classList.contains(VISIBLE_CLASS)) return;

        const currentlyPlaying = modalTracklist.querySelector(`.${PLAYING_CLASS}`);
        if (currentlyPlaying) {
            currentlyPlaying.classList.remove(PLAYING_CLASS);
        }

        if (playlist.length > 0 && currentTrackIndex >= 0) {
            const currentTrack = playlist[currentTrackIndex];

            if (playerModal.dataset.releaseId === currentTrack.releaseId) {
                const trackElement = modalTracklist.querySelector(`li[data-track-index="${currentTrack.trackIndex}"]`);
                trackElement?.classList.add(PLAYING_CLASS);
            }
        }
    };

    const updateMediaSessionMetadata = () => {
        if (!('mediaSession' in navigator) || currentTrackIndex < 0) return;
        const track = playlist[currentTrackIndex];
        const release = releasesMap.get(track.releaseId);
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: ARTIST_NAME,
            album: release.title,
            artwork: [{ src: release.imageUrl, sizes: '512x512', type: 'image/webp' }]
        });
    };

    const handlePlaybackStateChange = (isPlaying) => {
        updatePlayerUI(isPlaying);
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    };

    const playTrack = (index) => {
        if (index < 0 || index >= playlist.length) return;
        currentTrackIndex = index;
        const track = playlist[currentTrackIndex];
        audioPlayer.src = track.audioSrc;
        audioPlayer.play().catch(error => console.error("Playback failed:", error));
        nowPlayingBar.classList.add(VISIBLE_CLASS);
        updateMediaSessionMetadata();
    };

    const handlePlayPause = () => {
        if (audioPlayer.paused) {
            if (currentTrackIndex < 0 && playlist.length > 0) {
                playTrack(0);
            } else {
                audioPlayer.play().catch(e => console.error("Play failed", e));
            }
        } else {
            audioPlayer.pause();
        }
    };

    const playNext = () => playTrack((currentTrackIndex + 1) % playlist.length);
    const playPrev = () => playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);

    const setupMediaSessionHandlers = () => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
        navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    };

    const setupEventListeners = () => {
        releasesGrid.addEventListener('click', (e) => {
            const releaseItem = e.target.closest('.release-item[data-release-id]');
            if (releaseItem) openModal(releaseItem.dataset.releaseId);
        });
        releasesGrid.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const releaseItem = e.target.closest('.release-item[data-release-id]');
                if (releaseItem) {
                    e.preventDefault();
                    openModal(releaseItem.dataset.releaseId);
                }
            }
        });
        modalTracklist.addEventListener('click', (e) => {
            const trackItem = e.target.closest('li[data-track-index]');
            if (!trackItem) return;
            const releaseId = playerModal.dataset.releaseId;
            const release = releasesMap.get(releaseId);
            const clickedTrackIndex = parseInt(trackItem.dataset.trackIndex, 10);

            if (!playlist.length || playlist[0].releaseId !== releaseId) {
                playlist = release.tracklist.map((trackName, index) => ({
                    title: trackName,
                    audioSrc: release.audioSrc[index],
                    releaseId: release.id,
                    trackIndex: index
                }));
            }
            playTrack(clickedTrackIndex);
        });
        modalCloseBtn.addEventListener('click', closeModal);
        playerModal.addEventListener('click', (e) => {
            if (e.target === playerModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && playerModal.classList.contains(VISIBLE_CLASS)) closeModal();
        });
        playPauseBtn.addEventListener('click', handlePlayPause);
        nextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev);
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', updateProgress);
        audioPlayer.addEventListener('ended', playNext);
        audioPlayer.addEventListener('play', () => handlePlaybackStateChange(true));
        audioPlayer.addEventListener('pause', () => handlePlaybackStateChange(false));
        progressBarContainer.addEventListener('click', setProgress);
    };

    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered successfully with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    };

    const init = () => {
        loadReleases();
        setupMediaSessionHandlers();
        setupEventListeners();
        registerServiceWorker(); 
    };

    init();
});