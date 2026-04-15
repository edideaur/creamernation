// Last.fm settings storage
export const lastFMStorage = {
    isEnabled: () => localStorage.getItem('lastfm-enabled') !== 'false',
    enable: () => localStorage.setItem('lastfm-enabled', 'true'),
    disable: () => localStorage.setItem('lastfm-enabled', 'false'),
    getScrobblePercentage: () => parseInt(localStorage.getItem('lastfm-scrobble-pct') || '50', 10),
    useCustomCredentials: () => false,
    getCustomApiKey: () => null,
    getCustomApiSecret: () => null,
};
