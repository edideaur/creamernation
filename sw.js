const CACHE_NAME = 'creamer-nation-v2';
const ASSETS_TO_CACHE = [
    'https://fonts.googleapis.com/css2?family=VT323&display=swap',
    '/',
    'index.html',
    'style.css',
    'script.js',
    'releases.json',
    'manifest.json',
    'favicon.png',
    './assets/logo.webp',
    './assets/CNTAPE2/CNTAPE2.webp',
    './assets/RBZRMX/SoundCloudAud.com_RIP BOZO (REMIX)_albumcover.jpeg',
    './assets/RBZRMX/rip-bozo-remix.mp3',
    './assets/WCF/WCF.webp',
    '/assets/WCF/audio/01 Windy City Freestyle.mp3',
    './assets/TOAK/TOAK.jpg',
    '/assets/TOAK/audio/01 Windy City Freestyle (Mix).mp3',
    '/assets/TOAK/audio/02 System Overload (Mix).mp3',
    '/assets/TOAK/audio/03 Championship Ring 2.mp3',
    './assets/VISION/VISION.webp',
    './assets/VISION/audio/01 VISION.flac',
    './assets/ACNC/ACNC.webp',
    './assets/ACNC/audio/01 CHRISTMAS IN CN.mp3',
    './assets/ACNC/audio/02 HRT CHRISTMAS.mp3',
    './assets/ACNC/audio/03 INCEST BALLS.mp3',
    './assets/ACNC/audio/04 SANTA\'S HERE (INTERLUDE).mp3',
    './assets/ACNC/audio/05 HOLY WAR.mp3',
    './assets/ACNC/audio/06 THERE IS NO SANTA.mp3',
    './assets/ACNC/audio/07 JOLLY ASS SONG!!!.mp3',
    './assets/ACNC/audio/08 NAUGHTY LIST (OUTRO).mp3',
    './assets/CRMRSZN/CRMRSZN.webp',
    '/assets/CRMRSZN/audio/01 CREAMER NATIONAL ANTHEM (INTRO).mp3',
    '/assets/CRMRSZN/audio/02 FLIPPED.mp3',
    '/assets/CRMRSZN/audio/03 LACED.mp3',
    '/assets/CRMRSZN/audio/04 WAR 2.mp3',
    '/assets/CRMRSZN/audio/05 SAUSAGE FINGERS.mp3',
    '/assets/CRMRSZN/audio/06 HIDDEN PLACE.mp3',
    '/assets/CRMRSZN/audio/07 JUMP JUMP.mp3',
    '/assets/CRMRSZN/audio/08 SYSTEM OVERLOAD.mp3',
    '/assets/CRMRSZN/audio/09 CHAMPIONSHIP RING.mp3',
    '/assets/CRMRSZN/audio/10 LEAN FREESTYLE (INTERLUDE).mp3',
    '/assets/CRMRSZN/audio/11 STADIUM RAVE.mp3',
    '/assets/CRMRSZN/audio/12 RUNNIN\'.mp3',
    '/assets/CRMRSZN/audio/13 COMMERCIAL BREAK.mp3',
    '/assets/CRMRSZN/audio/14 BLOOM.mp3',
    '/assets/CRMRSZN/audio/15 KNOCKIN\'.mp3',
    './assets/SRFR/SRFR.webp',
    './assets/SRFR/SERIAL RAPIST FREESTYLE (REMIX).mp3',
    './assets/MORECREAM/MORECREAM.webp',
    './assets/MORECREAM/audio/01 GRAVEYARD.mp3',
    './assets/MORECREAM/audio/02 RIOT.mp3',
    './assets/MORECREAM/audio/03 HAWK TUAH (INTERLUDE).mp3',
    './assets/MORECREAM/audio/04 SPLIT.mp3',
    './assets/MORECREAM/audio/05 R.I.P BOZO.mp3',
    './assets/MORECREAM/audio/06.1 CRACK NATION.mp3',
    './assets/MORECREAM/audio/06.2 RAETARD.mp3',
    './assets/MORECREAM/audio/07 CREAMER OUTRO.mp3',
    './assets/CNTAPE1/CNTAPE1B.webp',
    './assets/CNTAPE1/audio/01 INTRO.mp3',
    './assets/CNTAPE1/audio/02 CREAMER NATION.mp3',
    './assets/CNTAPE1/audio/03 BOOSIE.mp3',
    './assets/CNTAPE1/audio/04 WAR.mp3',
    './assets/CNTAPE1/audio/05 EENIE MEENIE MINEY MO.mp3',
    './assets/CNTAPE1/audio/06 RAEDOWN.mp3',
    './assets/CNTAPE1/audio/07 TEMU.mp3',
    './assets/CNTAPE1/audio/08 HOMOPHOBIA VS HOMOSEXUALITY.mp3',
    './assets/CNTAPE1/audio/09 FANUM.mp3',
    './assets/CNTAPE1/audio/10 SPRING \'23.mp3',
    './assets/CNTAPE1/audio/11 SUMMER \'23.mp3',
    './assets/CNTAPE1/audio/12 LET\'S STOP COMEDY. (INTERLUDE).mp3',
    './assets/CNTAPE1/audio/13 CHRIS GRIFFIN.mp3',
    './assets/CNTAPE1/audio/14 ULTRAVIOLET.mp3',
    './assets/CNTAPE1/audio/15 SERIAL RAPIST FREESTYLE.mp3',
    './assets/CNTAPE1/audio/16 SCHIZO FORTNITE.mp3',
    './assets/CNTAPE1/audio/17 PEG SUMN.mp3',
    './assets/CNTAPE1/audio/18 BUT GOT THIS INSTEAD.mp3',
    './assets/CNTAPE1/audio/19 FOR THE CREAMERS.mp3'
];

self.addEventListener('install', event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching assets');

                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(networkResponse => {

                    return networkResponse;
                });
            })
    );
});