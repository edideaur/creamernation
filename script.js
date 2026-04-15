import { LastFMScrobbler } from './lastfm.js';

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
    const playerAlbumTitle = document.getElementById('player-album-title');
    const playerTrackArtist = document.getElementById('player-track-artist');
    const prevBtn = document.getElementById('prev-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const progressBar = document.getElementById('progress-bar');
    const progressBarContainer = document.getElementById('progress-bar-container');

    // Last.fm UI elements
    const lastfmConnectBtn = document.getElementById('lastfm-connect-btn');
    const lastfmModal = document.getElementById('lastfm-modal');
    const lastfmModalClose = document.getElementById('lastfm-modal-close');
    const lastfmNotConnected = document.getElementById('lastfm-not-connected');
    const lastfmConnected = document.getElementById('lastfm-connected');
    const lastfmAuthStartBtn = document.getElementById('lastfm-auth-start-btn');
    const lastfmAuthStep2 = document.getElementById('lastfm-auth-step2');
    const lastfmAuthCompleteBtn = document.getElementById('lastfm-auth-complete-btn');
    const lastfmDisconnectBtn = document.getElementById('lastfm-disconnect-btn');
    const lastfmUsernameDisplay = document.getElementById('lastfm-username-display');

    const VISIBLE_CLASS = 'visible';
    const PLAYING_CLASS = 'playing';
    const ARTIST_NAME = 'CREAMER NATION';
    const releasesMap = new Map();
    const originalTitle = document.title;
    let playlist = [];
    let currentTrackIndex = -1;
    let focusedElementBeforeModal;
    let pendingLastfmToken = null;

    const scrobbler = new LastFMScrobbler();

    // Strip featured artist info from track titles for clean scrobbling
    const cleanTrackTitle = (title) =>
        title.replace(/\s*\((?:ft|feat|featuring|w\/)\.?\s+[^)]+\)/gi, '').trim();

    const buildScrobbleTrack = (track, release) => ({
        title: track.title,
        cleanTitle: cleanTrackTitle(track.title),
        artist: ARTIST_NAME,
        album: { title: release.title },
        duration: isFinite(audioPlayer.duration) ? audioPlayer.duration : 0,
        trackNumber: track.trackIndex + 1,
    });

    // --- Last.fm UI ---

    const updateLastfmBtn = () => {
        if (!lastfmConnectBtn) return;
        lastfmConnectBtn.textContent = scrobbler.isAuthenticated()
            ? `[LFM: ${scrobbler.username}]`
            : '[LAST.FM]';
    };

    const openLastfmModal = () => {
        if (scrobbler.isAuthenticated()) {
            lastfmNotConnected.hidden = true;
            lastfmConnected.hidden = false;
            lastfmUsernameDisplay.textContent = scrobbler.username;
        } else {
            lastfmNotConnected.hidden = false;
            lastfmConnected.hidden = true;
            lastfmAuthStep2.hidden = true;
        }
        lastfmModal.classList.add(VISIBLE_CLASS);
        lastfmModal.setAttribute('aria-hidden', 'false');
    };

    const closeLastfmModal = () => {
        lastfmModal.classList.remove(VISIBLE_CLASS);
        lastfmModal.setAttribute('aria-hidden', 'true');
    };

    const setupLastfmUI = () => {
        updateLastfmBtn();

        lastfmConnectBtn?.addEventListener('click', openLastfmModal);
        lastfmModalClose?.addEventListener('click', closeLastfmModal);
        lastfmModal?.addEventListener('click', (e) => { if (e.target === lastfmModal) closeLastfmModal(); });

        lastfmAuthStartBtn?.addEventListener('click', async () => {
            try {
                lastfmAuthStartBtn.textContent = 'LOADING...';
                lastfmAuthStartBtn.disabled = true;
                const { token, url } = await scrobbler.getAuthUrl();
                pendingLastfmToken = token;
                window.open(url, '_blank', 'noopener,noreferrer');
                lastfmAuthStep2.hidden = false;
                lastfmAuthStartBtn.textContent = 'CONNECT LAST.FM ↗';
                lastfmAuthStartBtn.disabled = false;
            } catch (err) {
                lastfmAuthStartBtn.textContent = 'ERROR - TRY AGAIN';
                lastfmAuthStartBtn.disabled = false;
                console.error('Failed to start Last.fm auth:', err);
            }
        });

        lastfmAuthCompleteBtn?.addEventListener('click', async () => {
            if (!pendingLastfmToken) return;
            try {
                lastfmAuthCompleteBtn.textContent = 'CONNECTING...';
                lastfmAuthCompleteBtn.disabled = true;
                const result = await scrobbler.completeAuthentication(pendingLastfmToken);
                pendingLastfmToken = null;
                lastfmUsernameDisplay.textContent = result.username;
                lastfmNotConnected.hidden = true;
                lastfmConnected.hidden = false;
                updateLastfmBtn();
                lastfmAuthCompleteBtn.textContent = "I'VE AUTHORIZED";
                lastfmAuthCompleteBtn.disabled = false;
            } catch (err) {
                lastfmAuthCompleteBtn.textContent = 'FAILED - TRY AGAIN';
                lastfmAuthCompleteBtn.disabled = false;
                console.error('Failed to complete Last.fm auth:', err);
            }
        });

        lastfmDisconnectBtn?.addEventListener('click', () => {
            scrobbler.disconnect();
            lastfmNotConnected.hidden = false;
            lastfmConnected.hidden = true;
            lastfmAuthStep2.hidden = true;
            updateLastfmBtn();
        });
    };

    // --- Releases ---

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
            li.innerHTML = `<span class="track-number">${String(index + 1).padStart(2, '0')}.</span><span class="track-name">${track}</span>`;
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

    const trapFocusInModal = (e) => {
        if (e.key !== 'Tab') return;

        const focusableElements = playerModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); }
        } else {
            if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); }
        }
    };

    const openModal = (releaseId) => {
        const release = releasesMap.get(releaseId);
        if (!release) return;

        focusedElementBeforeModal = document.activeElement;
        populateModal(release);
        playerModal.classList.add(VISIBLE_CLASS);
        playerModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modalCloseBtn.focus();
        document.addEventListener('keydown', trapFocusInModal);

        const newHash = `#${release.id}`;
        if (window.location.hash !== newHash) {
            history.pushState({ releaseId: release.id }, `${release.title} - ${ARTIST_NAME}`, newHash);
        }
        document.title = `${release.title} - ${ARTIST_NAME}`;
    };

    const closeModal = () => {
        if (!playerModal.classList.contains(VISIBLE_CLASS)) return;

        playerModal.classList.remove(VISIBLE_CLASS);
        playerModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', trapFocusInModal);
        focusedElementBeforeModal?.focus();

        if (window.location.hash) {
            history.pushState(null, originalTitle, window.location.pathname + window.location.search);
        }
        if (audioPlayer.paused) document.title = originalTitle;
    };

    const handleUrlHash = () => {
        const releaseId = window.location.hash.substring(1);
        if (releaseId && releasesMap.has(releaseId)) openModal(releaseId);
        else closeModal();
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
            releasesGrid.innerHTML = '';
            releasesGrid.appendChild(fragment);
            releasesGrid.classList.add('loaded');
        } catch (error) {
            console.error("Failed to load releases:", error);
            releasesGrid.textContent = 'Error loading tapes. Please try again later.';
        }
    };

    // --- Player ---

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
        if (isFinite(duration)) totalDurationEl.textContent = formatTime(duration);
    };

    const setProgress = (e) => {
        const { duration } = audioPlayer;
        if (!isFinite(duration)) return;
        audioPlayer.currentTime = (e.offsetX / progressBarContainer.clientWidth) * duration;
    };

    const updatePlayerUI = (isPlaying) => {
        if (currentTrackIndex < 0 || playlist.length === 0) return;
        const track = playlist[currentTrackIndex];
        const release = releasesMap.get(track.releaseId);
        if (!release) return;

        if (playerArtImg.src !== release.imageUrl) {
            playerArtImg.src = release.imageUrl;
            playerArtImg.alt = `Album art for ${release.title}`;
        }
        playerTrackTitle.textContent = track.title;
        playerAlbumTitle.textContent = release.title;
        playerTrackArtist.textContent = ARTIST_NAME;
        document.title = isPlaying ? `▶ ${track.title} - ${ARTIST_NAME}` : `${track.title} - ${ARTIST_NAME}`;
        playPauseBtn.classList.toggle(PLAYING_CLASS, isPlaying);
        playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        updateTrackHighlight();
    };

    const updateTrackHighlight = () => {
        modalTracklist.querySelector(`.${PLAYING_CLASS}`)?.classList.remove(PLAYING_CLASS);
        if (playlist.length > 0 && currentTrackIndex >= 0) {
            const currentTrack = playlist[currentTrackIndex];
            if (playerModal.dataset.releaseId === currentTrack.releaseId) {
                modalTracklist.querySelector(`li[data-track-index="${currentTrack.trackIndex}"]`)
                    ?.classList.add(PLAYING_CLASS);
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
        if (audioPlayer.src && !audioPlayer.paused) {
            audioPlayer.pause();
        } else if (audioPlayer.src && audioPlayer.paused) {
            audioPlayer.play().catch(e => console.error("Play failed", e));
        } else if (!audioPlayer.src && playlist.length > 0) {
            playTrack(0);
        }
    };

    const playNext = () => playTrack((currentTrackIndex + 1) % playlist.length);
    const playPrev = () => playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);

    const setupMediaSessionHandlers = () => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('play', handlePlayPause);
        navigator.mediaSession.setActionHandler('pause', handlePlayPause);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    };

    const handleGenericKeyEvent = (e, targetSelector, action) => {
        const element = e.target.closest(targetSelector);
        if (element && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            action(element);
        }
    };

    const setupEventListeners = () => {
        releasesGrid.addEventListener('click', (e) => {
            const releaseItem = e.target.closest('.release-item[data-release-id]');
            if (releaseItem) openModal(releaseItem.dataset.releaseId);
        });
        releasesGrid.addEventListener('keydown', (e) => handleGenericKeyEvent(e, '.release-item[data-release-id]', item => openModal(item.dataset.releaseId)));

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
                    trackIndex: index,
                }));
            }
            playTrack(clickedTrackIndex);
        });
        modalTracklist.addEventListener('keydown', (e) => handleGenericKeyEvent(e, 'li[data-track-index]', item => item.click()));

        modalCloseBtn.addEventListener('click', closeModal);
        playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closeModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && playerModal.classList.contains(VISIBLE_CLASS)) closeModal();
        });

        playPauseBtn.addEventListener('click', handlePlayPause);
        nextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev);

        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', () => {
            updateProgress();
            // Fire scrobbler once we have the duration
            if (currentTrackIndex >= 0) {
                const track = playlist[currentTrackIndex];
                const release = releasesMap.get(track.releaseId);
                if (release) scrobbler.onTrackChange(buildScrobbleTrack(track, release));
            }
        });
        audioPlayer.addEventListener('ended', playNext);
        audioPlayer.addEventListener('play', () => handlePlaybackStateChange(true));
        audioPlayer.addEventListener('pause', () => {
            handlePlaybackStateChange(false);
            scrobbler.onPlaybackStop();
            if (!playerModal.classList.contains(VISIBLE_CLASS)) document.title = originalTitle;
        });

        progressBarContainer.addEventListener('click', setProgress);
        window.addEventListener('popstate', handleUrlHash);
    };

    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
            });
        }
    };

    const init = async () => {
        setupMediaSessionHandlers();
        setupEventListeners();
        setupLastfmUI();
        registerServiceWorker();
        await loadReleases();
        handleUrlHash();
    };

    init();
});
