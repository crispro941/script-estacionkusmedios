const RADIO_NAME = 'estacionkusfm';

// Change Azuracast Stream URL Here, .
const URL_STREAMING = 'https://radio.estacionkusmedios.com/listen/estacionkusfm/radio.mp3';

//API URL Azuracast Now Playing
const API_URL = 'https://radio.estacionkusmedios.com/api/nowplaying/2';

// Visit https://api.vagalume.com.br/docs/ to get your API key
const API_KEY = "2e4317c4fc225989:cab0a9b66d05c81a3fe1b61236521fe6";

// Variable to control history display: true = display / false = hides
let showHistory = true; 

window.onload = function () {
    var page = new Page;
    page.changeTitlePage();
    page.setVolume();

    var player = new Player();
    player.play();

    getStreamingData();
    // Interval to get streaming data in miliseconds
    setInterval(function () {
        getStreamingData();
    }, 10000);

    var coverArt = document.getElementsByClassName('cover-album')[0];

    coverArt.style.height = coverArt.offsetWidth + 'px';

    localStorage.removeItem('musicHistory');
}

// DOM control
class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');
    
            if (song !== currentSong.innerHTML) {
                // Animate transition
                currentSong.className = 'animated flipInY text-uppercase';
                currentSong.innerHTML = song;
    
                currentArtist.className = 'animated flipInY text-capitalize';
                currentArtist.innerHTML = artist;
    
                // Refresh modal title
                document.getElementById('lyricsSong').innerHTML = song + ' - ' + artist;
    
                // Remove animation classes
                setTimeout(function () {
                    currentSong.className = 'text-uppercase';
                    currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        }

        this.refreshCover = async function () {
        
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Falha ao obter dados da API');
                }
                
                const data = await response.json();
                const nowPlaying = data.now_playing;
        
                const song = nowPlaying.song.title;
                const artist = nowPlaying.song.artist;
                const artwork = nowPlaying.song.art;
        
                var coverArt = document.getElementById('currentCoverArt');
                var coverBackground = document.getElementById('bgCover');
        
                coverArt.style.backgroundImage = 'url(' + artwork + ')';
                coverArt.className = 'animated bounceInLeft';
        
                coverBackground.style.backgroundImage = 'url(' + artwork + ')';
        
                setTimeout(function () {
                    coverArt.className = '';
                }, 2000);
        
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: song,
                        artist: artist,
                        artwork: [{
                            src: artwork,
                            sizes: '96x96',
                            type: 'image/png'
                        }]
                    });
                }
            } catch (error) {
                console.error('Ocorreu um erro:', error);
            }
        }

        this.refreshHistoric = function (songData, index) {
            // Selecione os elementos HTML correspondentes ao histórico de músicas
            var historicSongs = document.getElementById('historicSong').querySelectorAll('.col-md-6');
        
            // Verifica se o índice está dentro do intervalo válido
            if (index >= 0 && index < historicSongs.length) {
                var historicItem = historicSongs[index];
                var coverElement = historicItem.querySelector('.cover-historic');
                var songElement = historicItem.querySelector('.song');
                var artistElement = historicItem.querySelector('.artist');
        
                // Atualize os elementos com os dados da música
                if (coverElement) {
                    coverElement.style.backgroundImage = 'url(' + songData.art + ')';
                }
                if (songElement) {
                    songElement.textContent = songData.title;
                }
                if (artistElement) {
                    artistElement.textContent = songData.artist;
                }
            } else {
                console.error('Índice fora do intervalo válido para histórico de músicas.');
            }
        };
        
        this.changeVolumeIndicator = function (volume) {
            document.getElementById('volIndicator').innerHTML = volume;

            if (typeof (Storage) !== 'undefined') {
                localStorage.setItem('volume', volume);
            }
        };

        this.setVolume = function () {
            if (typeof (Storage) !== 'undefined') {
                var volumeLocalStorage = (!localStorage.getItem('volume')) ? 80 : localStorage.getItem('volume');
                document.getElementById('volume').value = volumeLocalStorage;
                document.getElementById('volIndicator').innerHTML = volumeLocalStorage;
            }
        };

        this.refreshLyric = function (currentSong, currentArtist) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var data = JSON.parse(this.responseText);

                    var openLyric = document.getElementsByClassName('lyrics')[0];

                    if (data.type === 'exact' || data.type === 'aprox') {
                        var lyric = data.mus[0].text;

                        document.getElementById('lyric').innerHTML = lyric.replace(/\n/g, '<br />');
                        openLyric.style.opacity = "1";
                        openLyric.setAttribute('data-toggle', 'modal');
                    } else {
                        openLyric.style.opacity = "0.3";
                        openLyric.removeAttribute('data-toggle');

                        var modalLyric = document.getElementById('modalLyrics');
                        modalLyric.style.display = "none";
                        modalLyric.setAttribute('aria-hidden', 'true');
                        (document.getElementsByClassName('modal-backdrop')[0]) ? document.getElementsByClassName('modal-backdrop')[0].remove() : '';
                    }
                } else {
                    document.getElementsByClassName('lyrics')[0].style.opacity = "0.3";
                    document.getElementsByClassName('lyrics')[0].removeAttribute('data-toggle');
                }
            };
            xhttp.open('GET', 'https://api.vagalume.com.br/search.php?apikey=' + API_KEY + '&art=' + currentArtist + '&mus=' + currentSong.toLowerCase(), true);
            xhttp.send();
        };
    }
}

function getStreamingData() {
    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos de la API');
            }
            return response.json();
        })
        .then(data => {
            const page = new Page();

            // Extraer información de la canción actual
            const nowPlaying = data[0].now_playing.song;
            const currentSong = nowPlaying.title;
            const currentArtist = nowPlaying.artist;
            const currentArt = nowPlaying.art;

            // Actualizar título de la página
            document.title = `${currentSong} - ${currentArtist} | ${RADIO_NAME}`;

            // Actualizar información de la canción actual
            if (document.getElementById('currentSong').innerHTML !== currentSong) {
                page.refreshCurrentSong(currentSong, currentArtist);

                // Actualizar portada y fondo
                const coverArt = document.getElementById('currentCoverArt');
                const bgCover = document.getElementById('bgCover');
                coverArt.style.backgroundImage = `url(${currentArt})`;
                bgCover.style.backgroundImage = `url(${currentArt})`;
            }

            // Actualizar historial de canciones
            const songHistory = data[0].song_history;
            songHistory.forEach((songData, index) => {
                page.refreshHistoric(songData.song, index);
            });

            // Mostrar u ocultar historial según configuración
            updateHistoryUI();
        })
        .catch(error => {
            console.error('Error al obtener datos de la API:', error);
        });
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
      historicElement.classList.remove('hidden'); // Show history
    } else {
      historicElement.classList.add('hidden'); // Hide history
    }
}

//####################################### AUDIO #######################################


// Variável global para armazenar as músicas
var audio = new Audio(URL_STREAMING);

// Player control
class Player {
    constructor() {
        this.play = function () {
            audio.play();

            var defaultVolume = document.getElementById('volume').value;

            if (typeof (Storage) !== 'undefined') {
                if (localStorage.getItem('volume') !== null) {
                    audio.volume = intToDecimal(localStorage.getItem('volume'));
                } else {
                    audio.volume = intToDecimal(defaultVolume);
                }
            } else {
                audio.volume = intToDecimal(defaultVolume);
            }
            document.getElementById('volIndicator').innerHTML = defaultVolume;
        };

        this.pause = function () {
            audio.pause();
        };
    }
}

// On play, change the button to pause
audio.onplay = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao.className === 'fa fa-play') {
        botao.className = 'fa fa-pause';
        bplay.firstChild.data = 'PAUSAR';
    }
}

// On pause, change the button to play
audio.onpause = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao.className === 'fa fa-pause') {
        botao.className = 'fa fa-play';
        bplay.firstChild.data = 'PLAY';
    }
}

// Unmute when volume changed
audio.onvolumechange = function () {
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

audio.onerror = function () {
    var confirmacao = confirm('Stream Down / Network Error. \nClick OK to try again.');

    if (confirmacao) {
        window.location.reload();
    }
}

document.getElementById('volume').oninput = function () {
    audio.volume = intToDecimal(this.value);

    var page = new Page();
    page.changeVolumeIndicator(this.value);
}

function togglePlay() {
    if (!audio.paused) {
        audio.pause();
    } else {
        audio.load();
        audio.play();
    }
}

function volumeUp() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0 && audio.volume < 1) {
            audio.volume = (vol + .01).toFixed(2);
        }
    }
}

function volumeDown() {
    var vol = audio.volume;
    if(audio) {
        if(audio.volume >= 0.01 && audio.volume <= 1) {
            audio.volume = (vol - .01).toFixed(2);
        }
    }
}

function mute() {
    if (!audio.muted) {
        document.getElementById('volIndicator').innerHTML = 0;
        document.getElementById('volume').value = 0;
        audio.volume = 0;
        audio.muted = true;
    } else {
        var localVolume = localStorage.getItem('volume');
        document.getElementById('volIndicator').innerHTML = localVolume;
        document.getElementById('volume').value = localVolume;
        audio.volume = intToDecimal(localVolume);
        audio.muted = false;
    }
}

document.addEventListener('keydown', function (event) {
    var key = event.key;
    var slideVolume = document.getElementById('volume');
    var page = new Page();

    switch (key) {
        // Arrow up
        case 'ArrowUp':
            volumeUp();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Arrow down
        case 'ArrowDown':
            volumeDown();
            slideVolume.value = decimalToInt(audio.volume);
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Spacebar
        case ' ':
        case 'Spacebar':
            togglePlay();
            break;
        // P
        case 'p':
        case 'P':
            togglePlay();
            break;
        // M
        case 'm':
        case 'M':
            mute();
            break;
        // Numeric keys 0-9
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            var volumeValue = parseInt(key);
            audio.volume = volumeValue / 10;
            slideVolume.value = volumeValue * 10;
            page.changeVolumeIndicator(volumeValue * 10);
            break;
    }
});


function intToDecimal(vol) {
    return vol / 100;
}

function decimalToInt(vol) {
    return vol * 100;
}
// Llamado a las funciones de actualización después de cargar el DOM
window.onload = function () {
    var page = new Page();
    page.changeTitlePage();
    page.setVolume();
    
    var player = new Player();
    player.play();

    // Llamar a la función para obtener los datos de transmisión
    getStreamingData();
    
    // Intervalo para actualizar los datos de transmisión cada 10 segundos
    setInterval(function () {
        getStreamingData();
    }, 10000);

    var coverArt = document.getElementsByClassName('cover-album')[0];
    coverArt.style.height = coverArt.offsetWidth + 'px';

    localStorage.removeItem('musicHistory');
}

// Función para obtener datos de transmisión
function getStreamingData() {
    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos de la API');
            }
            return response.json();
        })
        .then(data => {
            const page = new Page();

            // Extraer información de la canción actual
            const nowPlaying = data[0].now_playing.song;
            const currentSong = nowPlaying.title;
            const currentArtist = nowPlaying.artist;
            const currentArt = nowPlaying.art;

            // Actualizar título de la página
            document.title = `${currentSong} - ${currentArtist} | ${RADIO_NAME}`;

            // Actualizar información de la canción actual
            if (document.getElementById('currentSong').innerHTML !== currentSong) {
                page.refreshCurrentSong(currentSong, currentArtist);

                // Actualizar portada y fondo
                const coverArt = document.getElementById('currentCoverArt');
                const bgCover = document.getElementById('bgCover');
                coverArt.style.backgroundImage = `url(${currentArt})`;
                bgCover.style.backgroundImage = `url(${currentArt})`;
            }

            // Actualizar historial de canciones
            const songHistory = data[0].song_history;
            songHistory.forEach((songData, index) => {
                page.refreshHistoric(songData.song, index);
            });

            // Mostrar u ocultar historial según configuración
            updateHistoryUI();
        })
        .catch(error => {
            console.error('Error al obtener datos de la API:', error);
        });
}

// Función para actualizar la interfaz del historial
function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
        historicElement.classList.remove('hidden'); // Mostrar historial
    } else {
        historicElement.classList.add('hidden'); // Ocultar historial
    }
}

// Ejemplo de función para obtener datos de una API
async function fetchSongData() {
    try {
        const response = await fetch('https://radio.estacionkusmedios.com');
        const data = await response.json();
        updateSongInfo(data.title, data.artist);
    } catch (error) {
        console.error('Error al obtener los datos de la canción:', error);
    }
}

// Llama a fetchSongData si usas una API
fetchSongData();

// Llamado inicial a las funciones de actualización
getStreamingData();
